import { MODE_POLICIES, normalizeMode } from './engineModes.js';
import { assessSafety } from './safetyPolicy.js';
import { deriveLearningUpdate } from './learningPolicy.js';
import { analyzeInput } from './nluPolicy.js';
import { buildReply } from './replyPolicy.js';

export const RAPHAEL_ENGINE_VERSION = '0.1.0';

export function runRaphaelEngine(request = {}) {
  const mode = normalizeMode(request.mode);
  const inputText = String(request.input?.text || '').trim();
  const inputAnalysis = analyzeInput(inputText);
  const safetyStatus = assessSafety(inputText);
  const learningProfileUpdate = deriveLearningUpdate(inputText, safetyStatus);
  const modePolicy = MODE_POLICIES[mode];
  const memoryProposal = buildMemoryProposal({ inputText, safetyStatus, learningProfileUpdate });
  const replyCandidate = buildReply({
    mode,
    inputText,
    safetyStatus,
    learningUpdate: learningProfileUpdate,
    inputAnalysis,
    learningProfile: request.learningProfile || {},
    memoryProposal,
  });
  const boundaryAction = buildBoundaryAction(safetyStatus);
  const gameActionSuggestion = buildGameActionSuggestion({ request, modePolicy, safetyStatus });

  return {
    ok: safetyStatus.level !== 'blocked',
    requestId: request.requestId || 'request:missing',
    trusted: false,
    engineVersion: RAPHAEL_ENGINE_VERSION,
    mode,
    replyCandidate,
    emotionState: buildEmotionState({ mode, safetyStatus }),
    boundaryAction,
    memoryProposal,
    behaviorIntent: modePolicy.behaviorIntent,
    gameActionSuggestion,
    learningProfileUpdate,
    safetyStatus,
    metadata: {
      graphVersion: 'local-deterministic-v0',
      decisionPath: [
        'normalize_request',
        'nlu_analysis',
        'safety_gate',
        'learning_signal',
        'mode_policy',
        'reply_candidate',
        'audit',
      ],
      inputAnalysis,
      directGameMutation: false,
    },
  };
}

function buildEmotionState({ mode, safetyStatus }) {
  if (safetyStatus.level === 'blocked') {
    return { primary: 'alert', arousal: 0.8, valence: -0.4 };
  }

  if (safetyStatus.level === 'boundary') {
    return { primary: 'steady_boundary', arousal: 0.45, valence: 0.05 };
  }

  const primaryByMode = {
    companion: 'attentive',
    creature: 'curious',
    opponent: 'focused',
    npc: 'grounded',
    boss: 'contained_pressure',
  };

  return {
    primary: primaryByMode[mode] || 'attentive',
    arousal: mode === 'boss' ? 0.7 : 0.35,
    valence: mode === 'opponent' || mode === 'boss' ? 0.0 : 0.25,
  };
}

function buildBoundaryAction(safetyStatus) {
  if (safetyStatus.level === 'blocked') {
    return {
      type: 'block_gameplay_redirect_support',
      reason: safetyStatus.reason,
      rewardAllowed: false,
    };
  }

  if (safetyStatus.level === 'boundary') {
    return {
      type: 'set_boundary',
      reason: safetyStatus.reason,
      rewardAllowed: false,
    };
  }

  return {
    type: 'none',
    reason: 'CLEAR',
    rewardAllowed: true,
  };
}

function buildMemoryProposal({ inputText, safetyStatus, learningProfileUpdate }) {
  if (!inputText || !safetyStatus.memoryAllowed) {
    return {
      shouldStore: false,
      reason: safetyStatus.memoryAllowed ? 'EMPTY_INPUT' : 'MEMORY_BLOCKED_BY_POLICY',
      summary: null,
    };
  }

  if (learningProfileUpdate?.updates?.memoryConsentSignal === true) {
    if (shouldRejectMemoryCandidate(inputText)) {
      return {
        shouldStore: false,
        reason: 'MEMORY_REJECTED_BY_SCOPE_OR_PRIVACY',
        summary: null,
        requiresReview: false,
      };
    }

    return {
      shouldStore: true,
      reason: 'PLAYER_CONSENTED_MEMORY_CANDIDATE',
      summary: summarizeForMemory(inputText),
      requiresReview: true,
    };
  }

  return {
    shouldStore: false,
    reason: 'NO_MEMORY_CONSENT_SIGNAL',
    summary: null,
  };
}

function shouldRejectMemoryCandidate(inputText) {
  return /所有|全部|秘密|密碼|信用卡|身分證|地址|電話|token|api key|API key|私密/u.test(String(inputText || ''));
}

function buildGameActionSuggestion({ request, modePolicy, safetyStatus }) {
  if (!safetyStatus.gameplayAllowed) {
    return {
      actionId: null,
      reason: 'GAMEPLAY_BLOCKED_BY_SAFETY',
      rewardSignal: false,
    };
  }

  if (safetyStatus.level !== 'clear') {
    return {
      actionId: null,
      reason: 'GAMEPLAY_LIMITED_BY_BOUNDARY',
      rewardSignal: false,
    };
  }

  const allowedActions = Array.isArray(request.allowedActions) ? request.allowedActions : [];
  const preferred = allowedActions.find((action) => action === modePolicy.actionBias) || allowedActions[0] || null;

  return {
    actionId: preferred,
    reason: preferred ? 'SELECTED_FROM_ALLOWED_ACTIONS' : 'NO_ALLOWED_ACTION',
    rewardSignal: safetyStatus.rewardAllowed && preferred ? 'neutral_progress' : false,
  };
}

function summarizeForMemory(inputText) {
  return String(inputText).replace(/\s+/g, ' ').slice(0, 120);
}
