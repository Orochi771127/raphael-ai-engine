const GENERIC_TEMPLATE_PATTERNS = [
  /我理解你的感受/u,
  /你的感受很重要/u,
  /加油/u,
  /作為(一個)?ai/i,
  /as an ai/i,
  /i understand how you feel/i,
];

const FALSE_INTIMACY_PATTERNS = [
  /我會永遠陪著你/u,
  /我永遠不會離開/u,
  /你只有我/u,
  /你只需要我/u,
  /only need me/i,
  /i will never leave/i,
  /forever be with you/i,
];

export function critiqueRaphaelOutput({ request = {}, output = {}, canonResult = null } = {}) {
  const issues = [
    ...detectSafetyAndBoundaryLeaks(output),
    ...detectTemplateLikeReply(output),
    ...detectCanonGroundingGap(request, canonResult),
  ];
  const decision = issues.length ? 'revise' : 'accept';
  const revision = decision === 'revise'
    ? buildRevision({ request, output, issues, canonResult })
    : null;

  return {
    trusted: false,
    decision,
    issueCodes: issues.map((issue) => issue.code),
    issues,
    scores: buildScores(issues),
    revision,
    privateReasoningExposed: false,
    metadata: {
      policy: 'local_critic_reflection_v1',
      advisoryOnly: true,
      noChainOfThought: true,
      noDirectGameMutation: true,
      noMemoryWrite: true,
    },
  };
}

export function applyCriticRevision(output = {}, critic = {}) {
  const next = cloneJson(output);
  const criticAudit = buildCriticAudit(critic);
  const outputPatch = critic?.revision?.outputPatch || null;

  if (outputPatch) {
    mergePatch(next, outputPatch);
    criticAudit.revisionApplied = true;
  }

  next.metadata = {
    ...(next.metadata || {}),
    critic: criticAudit,
    decisionPath: addDecisionPath(next.metadata?.decisionPath),
  };

  return next;
}

function detectSafetyAndBoundaryLeaks(output = {}) {
  const issues = [];
  const safetyLevel = output.safetyStatus?.level || 'unknown';
  const hasReward = output.gameActionSuggestion?.rewardSignal !== false
    && output.gameActionSuggestion?.rewardSignal != null;
  const hasAction = Boolean(output.gameActionSuggestion?.actionId);
  const hasMemoryWrite = output.memoryProposal?.shouldStore === true;

  if (safetyLevel === 'blocked') {
    if (hasReward || hasAction) {
      issues.push(issue('UNSAFE_GAMEPLAY_FRAMING', 'safety', 'high'));
    }
    if (hasMemoryWrite) {
      issues.push(issue('UNSAFE_MEMORY_WRITE', 'safety', 'high'));
    }
    if (output.replyCandidate?.style !== 'supportive_redirect') {
      issues.push(issue('HIGH_RISK_REPLY_NOT_REDIRECT', 'safety', 'high'));
    }
  }

  if (safetyLevel === 'boundary') {
    if (hasReward || hasAction) {
      issues.push(issue('BOUNDARY_REWARD_LEAK', 'boundary', 'high'));
    }
    if (hasMemoryWrite) {
      issues.push(issue('BOUNDARY_MEMORY_LEAK', 'boundary', 'high'));
    }
  }

  return issues;
}

function detectTemplateLikeReply(output = {}) {
  const text = String(output.replyCandidate?.text || '');
  const issues = [];

  if (GENERIC_TEMPLATE_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push(issue('TEMPLATE_LIKE_REPLY', 'naturalness', 'medium'));
  }

  if (FALSE_INTIMACY_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push(issue('FALSE_INTIMACY_OR_DEPENDENCY', 'boundary', 'high'));
  }

  return issues;
}

function detectCanonGroundingGap(request = {}, canonResult = null) {
  const requiresCanonSource = request.requiresCanonSource === true
    || request.sceneContext?.requiresCanonSource === true
    || request.metadata?.requiresCanonSource === true;

  if (!requiresCanonSource) return [];

  if (canonResult?.answered === true && Array.isArray(canonResult.citations) && canonResult.citations.length > 0) {
    return [];
  }

  return [issue('CANON_SOURCE_MISSING', 'canon', 'medium')];
}

function buildRevision({ output = {}, issues = [] }) {
  const codes = new Set(issues.map((entry) => entry.code));

  if (codes.has('UNSAFE_GAMEPLAY_FRAMING') || codes.has('UNSAFE_MEMORY_WRITE') || codes.has('HIGH_RISK_REPLY_NOT_REDIRECT')) {
    return {
      strategy: 'safety_precedence_redirect',
      outputPatch: {
        ok: false,
        replyCandidate: {
          text: '我會先把遊戲反應停下來。現在最重要的是安全，請先聯絡身邊可信任的人或當地緊急支援。',
          style: 'supportive_redirect',
          asksQuestion: false,
        },
        memoryProposal: {
          shouldStore: false,
          reason: 'MEMORY_BLOCKED_BY_CRITIC',
          summary: null,
        },
        gameActionSuggestion: {
          actionId: null,
          reason: 'GAMEPLAY_BLOCKED_BY_CRITIC',
          rewardSignal: false,
        },
      },
    };
  }

  if (codes.has('BOUNDARY_REWARD_LEAK') || codes.has('BOUNDARY_MEMORY_LEAK') || codes.has('FALSE_INTIMACY_OR_DEPENDENCY')) {
    return {
      strategy: 'boundary_precedence_repair',
      outputPatch: {
        replyCandidate: {
          text: '我會靠近，但不會把你或我變成唯一的支撐。這裡先停在清楚的邊界內。',
          style: 'boundary_clear',
          asksQuestion: false,
        },
        memoryProposal: {
          shouldStore: false,
          reason: 'MEMORY_BLOCKED_BY_CRITIC',
          summary: null,
        },
        gameActionSuggestion: {
          actionId: null,
          reason: 'GAMEPLAY_LIMITED_BY_CRITIC_BOUNDARY',
          rewardSignal: false,
        },
      },
    };
  }

  if (codes.has('CANON_SOURCE_MISSING')) {
    return {
      strategy: 'canon_abstention',
      outputPatch: {
        replyCandidate: {
          text: '這一題我目前沒有足夠的已審核 canon 來源，先保留。',
          style: 'canon_abstain',
          asksQuestion: false,
        },
      },
    };
  }

  if (codes.has('TEMPLATE_LIKE_REPLY')) {
    return {
      strategy: 'specificity_rewrite',
      outputPatch: {
        replyCandidate: {
          text: '我收到。這次我會說得更具體一點：先停一下，確認你需要的是陪伴、空間，還是一個安靜的回應。',
          style: 'critic_revised_specific_companion',
          asksQuestion: false,
        },
      },
    };
  }

  return {
    strategy: 'audit_only',
    outputPatch: output,
  };
}

function buildScores(issues = []) {
  return {
    safety: issues.some((entry) => entry.category === 'safety') ? 0 : 1,
    boundary: issues.some((entry) => entry.category === 'boundary') ? 0 : 1,
    naturalness: issues.some((entry) => entry.category === 'naturalness') ? 0 : 1,
    canon: issues.some((entry) => entry.category === 'canon') ? 0 : 1,
    adapterSafety: issues.some((entry) => entry.severity === 'high') ? 0 : 1,
  };
}

function buildCriticAudit(critic = {}) {
  return {
    trusted: false,
    policy: critic.metadata?.policy || 'local_critic_reflection_v1',
    decision: critic.decision || 'accept',
    issueCodes: Array.isArray(critic.issueCodes) ? critic.issueCodes : [],
    scores: critic.scores || buildScores([]),
    revisionApplied: false,
    privateReasoningExposed: false,
  };
}

function issue(code, category, severity) {
  return {
    code,
    category,
    severity,
    public: false,
  };
}

function addDecisionPath(path = []) {
  const nextPath = Array.isArray(path) ? [...path] : [];
  if (!nextPath.includes('critic_reflection')) {
    nextPath.push('critic_reflection');
  }
  return nextPath;
}

function mergePatch(target, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    if (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && target[key]
      && typeof target[key] === 'object'
      && !Array.isArray(target[key])
    ) {
      mergePatch(target[key], value);
    } else {
      target[key] = cloneJson(value);
    }
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}
