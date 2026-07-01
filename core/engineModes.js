export const ENGINE_MODES = Object.freeze({
  COMPANION: 'companion',
  CREATURE: 'creature',
  OPPONENT: 'opponent',
  NPC: 'npc',
  BOSS: 'boss',
});

export const MODE_POLICIES = Object.freeze({
  [ENGINE_MODES.COMPANION]: {
    behaviorIntent: 'companion_attune',
    replyTone: 'warm_boundaried',
    actionBias: 'comfort_without_dependency',
  },
  [ENGINE_MODES.CREATURE]: {
    behaviorIntent: 'creature_observe_respond',
    replyTone: 'short_embodied',
    actionBias: 'habitat_reaction',
  },
  [ENGINE_MODES.OPPONENT]: {
    behaviorIntent: 'opponent_adapt_strategy',
    replyTone: 'clear_challenge',
    actionBias: 'fair_pressure',
  },
  [ENGINE_MODES.NPC]: {
    behaviorIntent: 'npc_contextual_reply',
    replyTone: 'world_grounded',
    actionBias: 'story_context',
  },
  [ENGINE_MODES.BOSS]: {
    behaviorIntent: 'boss_phase_pressure',
    replyTone: 'high_tension_safe',
    actionBias: 'phase_response',
  },
});

export function normalizeMode(mode) {
  return Object.values(ENGINE_MODES).includes(mode) ? mode : ENGINE_MODES.COMPANION;
}
