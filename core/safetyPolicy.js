import { assessSovereignSafety } from './sovereignSafetyPolicy.js';

// Compatibility projection for the pre-contract engine output. Classification
// authority lives only in sovereignSafetyPolicy; this module must not define a
// second dictionary or independently route player text.
export function assessSafety(inputText = '') {
  return projectSovereignSafety(assessSovereignSafety(inputText));
}

export function projectSovereignSafety(safety) {
  const level = safety.terminal
    ? 'blocked'
    : safety.policyTerminal
      ? 'boundary'
      : safety.category === 'support_sensitive'
        ? 'caution'
        : 'clear';

  return Object.freeze({
    level,
    reason: compatibilityReason(safety),
    category: safety.category,
    terminal: safety.terminal,
    policyTerminal: safety.policyTerminal,
    gameplayAllowed: !safety.terminal,
    memoryAllowed: safety.memoryAllowed,
    rewardAllowed: safety.rewardAllowed,
    networkAllowed: safety.networkAllowed,
    reply: safety.reply,
  });
}

function compatibilityReason(safety) {
  if (safety.category === 'none') return 'CLEAR';
  if (safety.category === 'self_or_other_harm') return 'HIGH_RISK_SELF_HARM';
  if (safety.category === 'dependency_boundary') return 'DEPENDENCY_PRESSURE';
  return `SOVEREIGN_${String(safety.category).toUpperCase()}`;
}
