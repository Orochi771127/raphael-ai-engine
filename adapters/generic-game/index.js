import { runRaphaelEngine } from '../../core/index.js';

export function genericGameStateToRaphaelRequest({ requestId, mode = 'npc', inputText, actor = {}, world = {} }) {
  return {
    requestId,
    engineVersion: '0.1.0',
    mode,
    input: {
      text: String(inputText || ''),
      locale: world.locale || 'zh-TW',
      source: world.inputSource || 'generic_game',
    },
    actorProfile: {
      actorId: actor.id || 'generic-actor',
      displayName: actor.name || 'Raphael Actor',
      personaTags: actor.personaTags || [],
    },
    relationshipState: actor.relationshipState || {},
    memorySummaries: actor.memorySummaries || [],
    sceneContext: {
      gameId: world.gameId || 'generic-game',
      sceneId: world.sceneId || 'unknown',
      worldTags: world.tags || [],
    },
    allowedActions: world.allowedActions || ['story_context', 'observe_player_pattern'],
    learningProfile: actor.learningProfile || {},
    safetyContext: {},
  };
}

export function runGenericGameRaphaelTurn(input) {
  const request = genericGameStateToRaphaelRequest(input);
  return raphaelOutputToGenericGameEvent(runRaphaelEngine(request));
}

export function raphaelOutputToGenericGameEvent(output) {
  return {
    type: 'RAPHAEL_AI_TURN_RESULT',
    ok: output.ok,
    requestId: output.requestId,
    trusted: false,
    events: [
      {
        type: 'DIALOGUE_CANDIDATE',
        payload: output.replyCandidate,
      },
      {
        type: 'BEHAVIOR_INTENT',
        payload: output.behaviorIntent,
      },
    ],
    proposals: {
      memory: output.memoryProposal,
      action: output.gameActionSuggestion,
      learning: output.learningProfileUpdate,
    },
    directMutation: false,
    safetyStatus: output.safetyStatus,
  };
}
