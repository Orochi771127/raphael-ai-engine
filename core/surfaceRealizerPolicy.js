/**
 * Phase 17: Natural Language Surface Realizer & Dynamic Micro-Action Weaving
 * 
 * Synthesizes candidate reply text, pragmatic tone, 3D PAD emotion state,
 * companion micro-actions, and playerProfile (playerName) to generate fluent, warm responses.
 */

export function realizeSurfaceText({
  rawCandidate = {},
  pragmaticContext = {},
  companionBehavior = {},
  playerProfile = {},
  learningProfile = {},
  safetyStatus = {},
} = {}) {
  let text = String(rawCandidate.text || '').trim();
  const playerName = playerProfile.playerName || '';

  // 1. Player Name Substitution
  if (playerName) {
    text = text.replace(/\{playerName\}/g, playerName);
  } else {
    text = text.replace(/\{playerName\}/g, '你');
  }

  // 2. Safety & Boundary override — never force micro-actions if blocked
  if (safetyStatus.level === 'blocked') {
    return {
      text,
      microActionWeoven: false,
      style: rawCandidate.style || 'supportive_redirect',
      asksQuestion: rawCandidate.asksQuestion ?? false,
    };
  }

  // 3. Dynamic Micro-Action Weaving (skip if replyLengthBias is short or already has micro-actions)
  const isShortBias = learningProfile.replyLengthBias === 'short';
  const hasExistingMicroAction = /^（.+?）/u.test(text);
  const shouldWeave = !isShortBias && !hasExistingMicroAction && Boolean(companionBehavior.microAction);

  if (shouldWeave) {
    text = `${companionBehavior.microAction} ${text}`;
  }

  return {
    text,
    microActionWeoven: shouldWeave,
    style: rawCandidate.style || 'companion_attuned',
    asksQuestion: rawCandidate.asksQuestion ?? false,
  };
}
