/**
 * Phase 16: Heart-Core Companion Dynamic Attachment & Emotional Resonance Policy
 * 
 * Manages multi-turn emotional momentum decay, physical body language continuity (ears, tail, eye contact),
 * and attachment state (secure_attuned, gentle_listening, respectful_boundary).
 */

export function evaluateCompanionBehavior({
  conversationContext = {},
  relationshipState = {},
  padEmotionState = {},
  safetyStatus = {},
  pragmaticContext = {},
} = {}) {
  const trust = Number(relationshipState.trust ?? 0.5);
  const closeness = Number(relationshipState.closeness ?? 0.5);
  const turnCount = Number(conversationContext.turnCount || 0);
  const lastIntent = conversationContext.lastIntent || null;

  // 1. Calculate Attachment State
  let attachmentState = 'gentle_listening';
  if (safetyStatus.level === 'boundary' || safetyStatus.level === 'blocked') {
    attachmentState = 'respectful_boundary';
  } else if (trust > 0.6 && closeness > 0.5) {
    attachmentState = 'secure_attuned';
  } else if (closeness < 0.3) {
    attachmentState = 'polite_observing';
  }

  // 2. Multi-turn Emotional Momentum Decay (Continuity)
  const isMultiTurnSameContext = turnCount > 1 && lastIntent !== null;
  const momentumFactor = isMultiTurnSameContext ? 0.85 : 0.4;

  // 3. Body Language Micro-Action Generator
  let microAction = null;
  const arousal = Number(padEmotionState.arousal ?? 0);
  const pleasure = Number(padEmotionState.pleasure ?? 0);

  if (attachmentState === 'respectful_boundary') {
    microAction = '（後退半步，保留清澈平穩的對視）';
  } else if (pragmaticContext.tone === 'hesitant') {
    microAction = '（耳朵稍微傾斜，放輕呼氣，安靜等待你接下去）';
  } else if (pragmaticContext.tone === 'self_mocking') {
    microAction = '（眼神溫柔地看著你，輕輕搖了搖頭）';
  } else if (arousal < -0.2 && pleasure > -0.2) {
    microAction = '（將身子放低，尾巴平緩地貼在地上）';
  } else if (pleasure > 0.3) {
    microAction = '（眼神微微亮起，身子稍微前傾）';
  } else {
    microAction = '（尾巴輕擺，專注聽著）';
  }

  return {
    attachmentState,
    momentumFactor,
    isContinuityTurn: isMultiTurnSameContext,
    microAction,
  };
}
