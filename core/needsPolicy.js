const DEFAULT_STATE = {
  energy: 100,
  social: 100,
  fun: 100,
  conversationContext: {
    turnCount: 0,
    lastIntent: null
  }
};

const DEFAULT_DECAY = {
  energy: 2,
  social: 3,
  fun: 1
};

export function updateInternalState(currentState = {}, hasInteraction = false, needsProfile = null, primaryIntent = null) {
  const state = {
    ...DEFAULT_STATE,
    ...currentState,
    conversationContext: {
      ...DEFAULT_STATE.conversationContext,
      ...(currentState.conversationContext || {})
    }
  };

  const decayRates = needsProfile?.decayRates || DEFAULT_DECAY;
  const interactionCost = needsProfile?.socialInteractionEnergyCost || 1;

  state.energy = Math.max(0, state.energy - decayRates.energy);
  state.social = Math.max(0, state.social - decayRates.social);
  state.fun = Math.max(0, state.fun - decayRates.fun);

  if (hasInteraction) {
    state.social = Math.min(100, state.social + 20);
    // interaction cost from persona
    state.energy = Math.max(0, state.energy - interactionCost);
    
    // Update conversation context
    state.conversationContext.turnCount += 1;
    if (primaryIntent) {
      state.conversationContext.lastIntent = primaryIntent;
    }
  }

  return state;
}

export function evaluateNeeds(internalState) {
  let criticalNeed = null;
  let lowestValue = 50; 

  for (const [need, value] of Object.entries(internalState)) {
    if (value < lowestValue) {
      lowestValue = value;
      criticalNeed = need;
    }
  }

  return criticalNeed;
}
