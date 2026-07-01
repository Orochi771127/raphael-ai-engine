import { runRaphaelEngine } from '../../core/index.js';

export function nexusLinkStateToRaphaelRequest({ requestId, inputText, state = {}, companion = {} }) {
  return {
    requestId,
    engineVersion: '0.1.0',
    mode: 'companion',
    input: {
      text: String(inputText || ''),
      locale: 'zh-TW',
      source: 'nexuslink:soul_talk',
    },
    actorProfile: {
      actorId: companion.id || state.activeCompanionId || 'greyshade-cat',
      displayName: companion.name || 'Raphael',
      personaTags: companion.personaTags || [],
    },
    relationshipState: {
      trust: state.companionTrust ?? null,
      closeness: state.companionCloseness ?? null,
    },
    memorySummaries: Array.isArray(state.memorySummaries) ? state.memorySummaries : [],
    sceneContext: {
      gameId: 'nexuslink',
      sceneId: state.currentSceneId || 'unknown',
      habitatState: state.habitatState || {},
    },
    allowedActions: [
      'comfort_without_dependency',
      'idle_listen',
      'habitat_trace_candidate',
    ],
    learningProfile: state.raphaelLearningProfile || {},
    safetyContext: {
      nexuslinkSafetyShieldRemainsAuthority: true,
    },
  };
}

export function runNexusLinkRaphaelTurn(input) {
  const request = nexusLinkStateToRaphaelRequest(input);
  return raphaelOutputToNexusLinkAdapterResult(runRaphaelEngine(request));
}

export function raphaelOutputToNexusLinkAdapterResult(output) {
  return {
    ok: output.ok,
    requestId: output.requestId,
    trusted: false,
    chatCandidate: output.replyCandidate
      ? {
          speaker: 'companion',
          text: output.replyCandidate.text,
          style: output.replyCandidate.style,
        }
      : null,
    animationIntent: mapBehaviorToAnimation(output.behaviorIntent, output.safetyStatus),
    habitatTraceCandidate: output.gameActionSuggestion?.actionId === 'habitat_trace_candidate'
      ? { type: 'soft_trace_candidate', requiresGameApproval: true }
      : null,
    memoryProposal: output.memoryProposal,
    statePatch: null,
    directMutation: false,
    audit: {
      engineVersion: output.engineVersion,
      safetyStatus: output.safetyStatus,
      boundaryAction: output.boundaryAction,
      learningProfileUpdate: output.learningProfileUpdate,
    },
  };
}

function mapBehaviorToAnimation(behaviorIntent, safetyStatus) {
  if (safetyStatus?.level === 'blocked') return 'still_supportive';
  if (safetyStatus?.level === 'boundary') return 'step_back_soft';
  if (behaviorIntent === 'companion_attune') return 'idle_attentive';
  return 'idle_neutral';
}
