/**
 * Ambient initiative policy aligned with the sealed RA-1 contract.
 * Player absence, login frequency and inferred loneliness are deliberately
 * absent from the decision path.
 */

import { derivePADEmotionState } from './emotionPhysicsPolicy.js';

export const AMBIENT_BOOT_QUIET_MS = 90_000;
export const AMBIENT_MIN_INTERVAL_MS = 240_000;
export const AMBIENT_SESSION_CAP = 2;

export function evaluateProactiveInitiative({
  session = {},
  companionState = {},
  currentTurnSignals = {},
  currentGameEvent = null,
  surface = {},
  safety = {},
  learningProfile = {},
} = {}) {
  const blocked = blockReason({ session, companionState, surface, safety });
  if (blocked) return silent(blocked);

  const trigger = deriveCurrentTrigger(currentTurnSignals, currentGameEvent);
  if (!trigger) return silent('NO_CURRENT_GROUNDED_TRIGGER');

  const padState = derivePADEmotionState({
    previousState: companionState.padState || null,
    mode: 'companion',
    safetyStatus: { level: 'clear' },
    intents: trigger === 'current_emotion_signal' ? ['comfort'] : ['observe'],
  });
  const proactiveCandidate = buildProactiveText({
    trigger,
    energy: Number(companionState.energy ?? 100),
    isShort: learningProfile.replyLengthBias === 'short',
  });

  return Object.freeze({
    shouldInitiate: true,
    reason: 'CURRENT_GROUNDED_INVITATION',
    initiativeScore: trigger === 'current_emotion_signal' ? 0.7 : 0.55,
    proactiveReply: Object.freeze({
      text: proactiveCandidate.text,
      style: proactiveCandidate.style,
      animationHint: padState.animationHint,
      padState,
    }),
  });
}

function blockReason({ session, companionState, surface, safety }) {
  if (Number(session.bootElapsedMs ?? 0) < AMBIENT_BOOT_QUIET_MS) return 'BOOT_QUIET';
  if (Number(session.initiativeCount ?? 0) >= AMBIENT_SESSION_CAP) return 'SESSION_CAP';
  if (Number(session.initiativeCount ?? 0) > 0
    && Number(session.sinceLastInitiativeMs ?? 0) < AMBIENT_MIN_INTERVAL_MS) return 'MIN_INTERVAL';
  if (session.playerDeclined === true) return 'PLAYER_DECLINED';
  if (surface.onboarding === true || surface.firstLoop === true || surface.soulTalkFocused === true
    || surface.panelOpen === true) return 'SURFACE_BLOCKED';
  if (safety.terminal === true || safety.safeHarborMode === true || safety.category && safety.category !== 'none') return 'SAFETY_BLOCKED';
  if (Number(companionState.defense ?? 0) >= 75) return 'DEFENSE_BLOCKED';
  if (Number(companionState.touchFatigue ?? 0) >= 75) return 'TOUCH_FATIGUE_BLOCKED';
  if (Number(companionState.trust ?? 100) < 20) return 'LOW_TRUST_BLOCKED';
  if (['defensive', 'distant'].includes(companionState.mood)) return 'MOOD_BLOCKED';
  return null;
}

function deriveCurrentTrigger(signals, event) {
  if (signals.explicitEmotion === true || signals.emotionSignal === true) return 'current_emotion_signal';
  if (event && typeof event === 'object' && event.current === true && typeof event.type === 'string') return 'current_game_event';
  return null;
}

function buildProactiveText({ trigger, energy, isShort }) {
  if (energy < 30) {
    return {
      text: isShort ? '我想先安靜坐一會。' : '我今天想把步子放慢一點，先在這裡安靜坐一會。',
      style: 'ambient_self_rest',
    };
  }
  if (trigger === 'current_emotion_signal') {
    return {
      text: isShort ? '我在旁邊。' : '我注意到你這一刻有些不好受。我先待在旁邊，不催你開口。',
      style: 'ambient_current_care',
    };
  }
  return {
    text: isShort ? '湖面剛亮了一下。' : '湖面剛亮了一下，我停下來看了一會。',
    style: 'ambient_current_event',
  };
}

function silent(reason) {
  return Object.freeze({
    shouldInitiate: false,
    reason,
    proactiveReply: null,
    initiativeScore: 0,
  });
}
