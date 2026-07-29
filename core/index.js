import { MODE_POLICIES, normalizeMode } from './engineModes.js';
import { assessSafety } from './safetyPolicy.js';
import { deriveLearningUpdate } from './learningPolicy.js';
import { analyzeInput } from './nluPolicy.js';
import { buildReply } from './replyPolicy.js';
import { deriveContextKnowledge } from './contextKnowledgePolicy.js';
import { applyCriticRevision, critiqueRaphaelOutput } from './criticPolicy.js';
import { updateInternalState, evaluateNeeds } from './needsPolicy.js';
import { getPersona } from './personas/personaManager.js';

import { derivePADEmotionState } from './emotionPhysicsPolicy.js';
import { evaluateProactiveInitiative } from './autonomyProactivePolicy.js';
import { runSelfReflectionSidecar } from './selfReflectionSidecar.js';

export const RAPHAEL_ENGINE_VERSION = '0.1.0';

export { answerCanonQuestion, retrieveCanonCards } from './canonRetrievalPolicy.js';
export { applyCriticRevision, critiqueRaphaelOutput } from './criticPolicy.js';
export { derivePADEmotionState } from './emotionPhysicsPolicy.js';
export { evaluateProactiveInitiative } from './autonomyProactivePolicy.js';
export { runSelfReflectionSidecar } from './selfReflectionSidecar.js';

export function runRaphaelEngine(request = {}) {
  const mode = normalizeMode(request.mode);
  const inputText = String(request.input?.text || '').trim();
  const inputAnalysis = analyzeInput(inputText);
  const safetyStatus = assessSafety(inputText);
  const contextKnowledge = deriveContextKnowledge(request, { safetyStatus });
  const learningProfileUpdate = deriveLearningUpdate(inputText, safetyStatus);
  const actorId = request.actorProfile?.actorId;
  const persona = getPersona(actorId);
  const nextInternalState = updateInternalState(request.internalState, inputText.length > 0, persona?.needsProfile, inputAnalysis.primaryIntent);
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
    contextKnowledge,
    persona,
    conversationContext: request.internalState?.conversationContext || null,
  });
  const boundaryAction = buildBoundaryAction(safetyStatus);
  const gameActionSuggestion = buildGameActionSuggestion({ request, modePolicy, safetyStatus, internalState: nextInternalState });

  const draftOutput = {
    ok: safetyStatus.level !== 'blocked',
    requestId: request.requestId || 'request:missing',
    trusted: false,
    engineVersion: RAPHAEL_ENGINE_VERSION,
    mode,
    replyCandidate,
    emotionState: derivePADEmotionState({
      previousState: request.internalState?.emotionState || null,
      mode,
      safetyStatus,
      intents: inputAnalysis.intents || [],
    }),
    boundaryAction,
    memoryProposal,
    behaviorIntent: modePolicy.behaviorIntent,
    gameActionSuggestion,
    internalState: nextInternalState,
    learningProfileUpdate,
    safetyStatus,
    selfReflection: runSelfReflectionSidecar({
      inputText,
      replyOutput: replyCandidate,
      safetyStatus,
      conversationContext: request.internalState?.conversationContext || {},
      now: request.now || null,
    }),
    metadata: {
      graphVersion: 'local-deterministic-v0',
      decisionPath: [
        'normalize_request',
        'nlu_analysis',
        'safety_gate',
        'context_knowledge',
        'learning_signal',
        'mode_policy',
        'reply_candidate',
        'audit',
      ],
      inputAnalysis,
      contextKnowledge,
      directGameMutation: false,
    },
  };

  const critic = critiqueRaphaelOutput({
    request,
    output: draftOutput,
    canonResult: request.canonResult || null,
  });

  return applyCriticRevision(draftOutput, critic);
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

function buildGameActionSuggestion({ request, modePolicy, safetyStatus, internalState }) {
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
  
  const criticalNeed = evaluateNeeds(internalState);
  let preferred = null;
  let reason = '';

  if (criticalNeed === 'energy') {
    preferred = allowedActions.find(a => a === 'sleep' || a === 'rest');
    reason = 'CRITICAL_NEED_ENERGY';
  } else if (criticalNeed === 'fun') {
    preferred = allowedActions.find(a => a === 'fishing' || a === 'play' || a === 'explore');
    reason = 'CRITICAL_NEED_FUN';
  } else if (criticalNeed === 'social') {
    preferred = allowedActions.find(a => a === 'approach' || a === 'greet');
    reason = 'CRITICAL_NEED_SOCIAL';
  }

  if (!preferred) {
    preferred = allowedActions.find((action) => action === modePolicy.actionBias) || allowedActions[0] || null;
    reason = preferred ? 'SELECTED_FROM_ALLOWED_ACTIONS' : 'NO_ALLOWED_ACTION';
  }

  return {
    actionId: preferred,
    reason: reason,
    rewardSignal: safetyStatus.rewardAllowed && preferred ? 'neutral_progress' : false,
  };
}

function summarizeForMemory(inputText) {
  return String(inputText).replace(/\s+/g, ' ').slice(0, 120);
}
