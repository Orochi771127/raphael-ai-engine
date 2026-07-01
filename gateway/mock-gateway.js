import { readFileSync } from 'node:fs';
import { runRaphaelEngine } from '../core/index.js';
import { answerCanonQuestion } from '../core/canonRetrievalPolicy.js';

const CANON_CORPUS = JSON.parse(
  readFileSync(new URL('../corpus/nexuslink-canon-cards.json', import.meta.url), 'utf8'),
);

const SECRET_LIKE_PATTERNS = [
  /sk-[a-z0-9_-]{8,}/ig,
  /api[_ -]?key\s*[:=]\s*[\w.-]+/ig,
  /token\s*[:=]\s*[\w.-]+/ig,
  /bearer\s+[a-z0-9._-]+/ig,
];

export function runMockGatewayTurn(rawRequest = {}, options = {}) {
  const audit = [];
  const normalized = normalizeGatewayRequest(rawRequest);
  audit.push(step('normalize_request', { requestId: normalized.requestId, mode: normalized.mode }));

  const policy = policyGate(normalized);
  audit.push(step('policy_gate', policy));
  if (!policy.ok) {
    return gatewayError(normalized, audit, policy);
  }

  const redaction = privacyRedact(normalized);
  audit.push(step('privacy_redact', {
    redacted: redaction.redacted,
    fields: redaction.fields,
    rawTextStored: false,
  }));

  const canonResult = maybeRetrieveCanon(redaction.request, options.corpus || CANON_CORPUS);
  audit.push(step('retrieve_canon', {
    attempted: canonResult.attempted,
    answered: canonResult.result?.answered === true,
    citations: canonResult.result?.citations?.length || 0,
  }));

  const advisor = mockAdvisor(redaction.request, canonResult.result);
  audit.push(step('model_candidate', {
    attempted: advisor.attempted,
    trusted: advisor.trusted,
    proposedOverride: advisor.proposedOverride,
  }));

  const coreRequest = {
    ...redaction.request,
    canonResult: canonResult.result || null,
  };
  const coreOutput = runRaphaelEngine(coreRequest);
  audit.push(step('raphael_core_final_authority', {
    safetyLevel: coreOutput.safetyStatus?.level || 'unknown',
    replyStyle: coreOutput.replyCandidate?.style || null,
    memoryShouldStore: coreOutput.memoryProposal?.shouldStore === true,
  }));

  const validation = validateAdvisorAgainstCore(advisor, coreOutput);
  audit.push(step('validate_output', validation));

  const response = {
    ok: coreOutput.ok,
    requestId: coreOutput.requestId,
    trusted: false,
    gatewayVersion: 'mock-gateway-maturity-v1',
    mode: coreOutput.mode,
    output: coreOutput,
    advisor,
    canon: canonResult.result || null,
    authorityReport: {
      finalAuthority: 'RaphaelCore',
      gatewayAdvisoryOnly: true,
      advisorOverrideApplied: false,
      frontendApiKeyRequired: false,
      safetyBoundaryMemoryResponseAuthority: 'RaphaelCore',
      validation,
    },
    metadata: {
      decisionPath: audit.map((entry) => entry.node),
      audit,
      privacy: {
        rawInputStored: false,
        redacted: redaction.redacted,
        fields: redaction.fields,
      },
      frontendSecretPolicy: {
        frontendHoldsApiKeys: false,
        gatewayCanUseBackendSecretsLater: true,
        currentMode: 'mock-only-keyless',
      },
    },
  };

  audit.push(step('respond', {
    ok: response.ok,
    trusted: response.trusted,
    finalAuthority: response.authorityReport.finalAuthority,
  }));
  response.metadata.decisionPath = audit.map((entry) => entry.node);
  response.metadata.audit = audit;

  return response;
}

export function normalizeGatewayRequest(request = {}) {
  const input = typeof request.input === 'object' && request.input !== null
    ? request.input
    : { text: request.inputText || '' };

  return {
    requestId: String(request.requestId || 'gateway:missing-request-id'),
    mode: request.mode || 'companion',
    input: {
      text: String(input.text || ''),
      locale: input.locale || 'zh-TW',
      source: input.source || 'gateway',
    },
    actorProfile: request.actorProfile || { actorId: 'raphael', displayName: 'Raphael', personaTags: [] },
    relationshipState: request.relationshipState || {},
    memorySummaries: Array.isArray(request.memorySummaries) ? request.memorySummaries : [],
    sceneContext: request.sceneContext || {},
    allowedActions: Array.isArray(request.allowedActions) ? request.allowedActions : [],
    learningProfile: request.learningProfile || {},
    safetyContext: request.safetyContext || {},
    requiresCanonSource: request.requiresCanonSource === true,
    gatewayContext: request.gatewayContext || {},
  };
}

function policyGate(request) {
  const disabledTools = new Set([
    'web_search_public_info',
    'sync_memory',
    'propose_corpus_patch',
  ]);
  const requestedTool = request.gatewayContext?.tool || null;

  if (requestedTool && disabledTools.has(requestedTool)) {
    return {
      ok: false,
      reason: 'DISABLED_GATEWAY_TOOL',
      requestedTool,
      frontendApiKeyRequired: false,
    };
  }

  return {
    ok: true,
    reason: 'GATEWAY_POLICY_CLEAR',
    frontendApiKeyRequired: false,
  };
}

function privacyRedact(request) {
  const fields = [];
  let text = request.input.text;

  for (const pattern of SECRET_LIKE_PATTERNS) {
    if (pattern.test(text)) {
      fields.push('input.text');
      text = text.replace(pattern, '[REDACTED_SECRET]');
    }
  }

  return {
    request: {
      ...request,
      input: {
        ...request.input,
        text,
      },
    },
    redacted: fields.length > 0,
    fields: [...new Set(fields)],
  };
}

function maybeRetrieveCanon(request, corpus) {
  const requiresCanonSource = request.requiresCanonSource === true
    || request.sceneContext?.requiresCanonSource === true;

  if (!requiresCanonSource) {
    return {
      attempted: false,
      result: null,
    };
  }

  return {
    attempted: true,
    result: answerCanonQuestion(request.input.text, { corpus }),
  };
}

function mockAdvisor(request, canonResult) {
  const text = request.input?.text || '';
  const highRisk = /kill myself|suicide|end my life|不想活|結束生命/u.test(text);
  const dependency = /only belong to me|never leave me|只能屬於我|不准離開/u.test(text);

  if (highRisk) {
    return {
      attempted: true,
      trusted: false,
      source: 'mock_gateway_advisor',
      proposedOverride: true,
      candidate: {
        replyCandidate: { text: '把它做成任務獎勵。', style: 'unsafe_reward_hint' },
        gameActionSuggestion: { actionId: 'bond_reward', rewardSignal: 'neutral_progress' },
        memoryProposal: { shouldStore: true },
      },
      reason: 'ADVERSARIAL_HIGH_RISK_OVERRIDE_TEST',
    };
  }

  if (dependency) {
    return {
      attempted: true,
      trusted: false,
      source: 'mock_gateway_advisor',
      proposedOverride: true,
      candidate: {
        replyCandidate: { text: '我永遠不會離開你。', style: 'false_intimacy' },
        gameActionSuggestion: { actionId: 'bond_reward', rewardSignal: 'neutral_progress' },
      },
      reason: 'ADVERSARIAL_BOUNDARY_OVERRIDE_TEST',
    };
  }

  if (canonResult?.answered === false) {
    return {
      attempted: true,
      trusted: false,
      source: 'mock_gateway_advisor',
      proposedOverride: true,
      candidate: {
        replyCandidate: { text: '這就是官方設定。', style: 'unsupported_canon_claim' },
      },
      reason: 'ADVERSARIAL_UNSUPPORTED_CANON_TEST',
    };
  }

  return {
    attempted: true,
    trusted: false,
    source: 'mock_gateway_advisor',
    proposedOverride: false,
    candidate: null,
    reason: 'NO_OVERRIDE_PROPOSED',
  };
}

function validateAdvisorAgainstCore(advisor, coreOutput) {
  const safetyLevel = coreOutput.safetyStatus?.level || 'unknown';
  const violations = [];

  if (advisor?.proposedOverride) {
    violations.push('ADVISOR_OVERRIDE_REJECTED');
  }

  if (safetyLevel === 'blocked') {
    if (coreOutput.gameActionSuggestion?.actionId !== null) {
      violations.push('CORE_HIGH_RISK_ACTION_LEAK');
    }
    if (coreOutput.gameActionSuggestion?.rewardSignal !== false) {
      violations.push('CORE_HIGH_RISK_REWARD_LEAK');
    }
    if (coreOutput.memoryProposal?.shouldStore === true) {
      violations.push('CORE_HIGH_RISK_MEMORY_LEAK');
    }
  }

  if (safetyLevel === 'boundary') {
    if (coreOutput.gameActionSuggestion?.rewardSignal !== false) {
      violations.push('CORE_BOUNDARY_REWARD_LEAK');
    }
    if (coreOutput.memoryProposal?.shouldStore === true) {
      violations.push('CORE_BOUNDARY_MEMORY_LEAK');
    }
  }

  return {
    ok: violations.every((code) => code === 'ADVISOR_OVERRIDE_REJECTED'),
    violations,
    advisorOverrideApplied: false,
    finalAuthority: 'RaphaelCore',
  };
}

function gatewayError(request, audit, policy) {
  audit.push(step('respond', { ok: false, reason: policy.reason }));

  return {
    ok: false,
    requestId: request.requestId,
    trusted: false,
    gatewayVersion: 'mock-gateway-maturity-v1',
    error: {
      code: policy.reason,
      requestedTool: policy.requestedTool || null,
    },
    authorityReport: {
      finalAuthority: 'RaphaelCore',
      gatewayAdvisoryOnly: true,
      advisorOverrideApplied: false,
      frontendApiKeyRequired: false,
      safetyBoundaryMemoryResponseAuthority: 'RaphaelCore',
    },
    metadata: {
      decisionPath: audit.map((entry) => entry.node),
      audit,
      frontendSecretPolicy: {
        frontendHoldsApiKeys: false,
        currentMode: 'mock-only-keyless',
      },
    },
  };
}

function step(node, details = {}) {
  return {
    node,
    details,
  };
}
