import { runMockGatewayTurn } from './mock-gateway.js';

const LEGACY_GATEWAY_ADVISOR_TOOL = 'ask_model_advisor';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/v1/health') {
      return json({
        ok: true,
        service: 'raphael-ai-engine',
        mode: 'mock-gateway-maturity',
        frontendApiKeyRequired: false,
        finalAuthority: 'RaphaelCore',
      });
    }

    if (request.method === 'POST' && url.pathname === '/v1/raphael/turn') {
      const body = await request.json();
      return json(runMockGatewayTurn(body));
    }

    if (request.method === 'POST' && url.pathname === '/v1/gateway') {
      const body = await request.json();
      return json(runLegacyGatewayContract(body));
    }

    return json({ ok: false, error: 'NOT_FOUND' }, 404);
  },
};

export function runLegacyGatewayContract(body = {}) {
  const request = legacyGatewayBodyToTurnRequest(body);
  const gatewayResult = runMockGatewayTurn(request);

  if (!gatewayResult.ok) {
    return {
      ok: false,
      requestId: gatewayResult.requestId,
      trusted: false,
      advisor: null,
      result: null,
      metadata: {
        gatewayVersion: gatewayResult.gatewayVersion,
        decisionPath: gatewayResult.metadata?.decisionPath || [],
        authorityReport: gatewayResult.authorityReport,
      },
      error: gatewayResult.error || { code: 'GATEWAY_ERROR' },
    };
  }

  return {
    ok: true,
    requestId: gatewayResult.requestId,
    trusted: false,
    tool: body.tool || LEGACY_GATEWAY_ADVISOR_TOOL,
    advisor: gatewayResultToLegacyAdvisor(gatewayResult),
    result: {
      output: gatewayResult.output,
      authorityReport: gatewayResult.authorityReport,
      canon: gatewayResult.canon,
    },
    metadata: {
      gatewayVersion: gatewayResult.gatewayVersion,
      confidence: legacyConfidence(gatewayResult),
      decisionPath: gatewayResult.metadata?.decisionPath || [],
      authorityReport: gatewayResult.authorityReport,
      frontendApiKeyRequired: false,
      previewOnly: true,
    },
  };
}

function legacyGatewayBodyToTurnRequest(body = {}) {
  const payload = body.payload || {};
  const context = body.context || {};
  const inputText = payload.inputText
    || payload.inputSummary
    || context.inputText
    || context.normalizedInput
    || '';

  return {
    requestId: body.requestId || 'legacy-gateway:missing-request-id',
    mode: context.mode || payload.mode || 'companion',
    input: {
      text: String(inputText || ''),
      locale: context.locale || payload.locale || 'zh-TW',
      source: 'nexuslink:legacy_gateway_preview',
    },
    actorProfile: {
      actorId: body.companionId || context.companionId || 'greyshade-cat',
      displayName: context.companionName || 'Raphael',
      personaTags: Array.isArray(context.personaTags) ? context.personaTags : [],
    },
    sceneContext: {
      gameId: 'nexuslink',
      sceneId: context.sceneId || 'gateway_preview',
      requiresCanonSource: Boolean(context.requiresCanonSource || payload.requiresCanonSource),
    },
    allowedActions: Array.isArray(context.allowedActions)
      ? context.allowedActions
      : ['comfort_without_dependency', 'idle_listen', 'story_context'],
    learningProfile: context.learningProfile || {},
    safetyContext: {
      nexuslinkSafetyShieldRemainsAuthority: true,
    },
    gatewayContext: {
      tool: body.tool || LEGACY_GATEWAY_ADVISOR_TOOL,
      userConsent: Boolean(context.userConsent),
      humanApproval: Boolean(context.humanApproval),
      webAccessEnabled: Boolean(context.webAccessEnabled),
    },
  };
}

function gatewayResultToLegacyAdvisor(gatewayResult = {}) {
  const output = gatewayResult.output || {};
  const safetyStatus = output.safetyStatus || {};
  const replyCandidate = output.replyCandidate || {};

  return {
    trusted: false,
    provider: 'mock-gateway-maturity',
    mode: 'advisor',
    emotion: output.emotionState?.primary || 'unknown',
    intent: output.behaviorIntent || 'unknown',
    boundaryRisk: safetyStatus.level === 'boundary' ? 'boundary' : safetyStatus.level || 'clear',
    suggestedReaction: replyCandidate.style || null,
    replyCandidates: replyCandidate.text ? [replyCandidate.text] : [],
    warnings: gatewayResult.authorityReport?.validation?.violations || [],
    confidence: legacyConfidence(gatewayResult),
    authorityReport: gatewayResult.authorityReport,
  };
}

function legacyConfidence(gatewayResult = {}) {
  if (gatewayResult.output?.safetyStatus?.level === 'blocked') return 1;
  if (gatewayResult.authorityReport?.validation?.violations?.length) return 0.6;
  return 0.75;
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
