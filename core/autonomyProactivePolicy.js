/**
 * Phase 13: Autonomous Proactive Greeting & Initiative Policy
 * 
 * Determines whether RAPHAEL companion should proactively initiate a conversation / greeting
 * based on idle duration, 3D PAD emotion state, and needs levels.
 */

import { derivePADEmotionState } from './emotionPhysicsPolicy.js';

export function evaluateProactiveInitiative({
  lastInteractionTime = 0,
  currentTime = Date.now(),
  needs = { energy: 100, social: 100, fun: 100 },
  conversationContext = {},
  learningProfile = {}
} = {}) {
  const idleMs = currentTime - (lastInteractionTime || currentTime);
  const idleHours = idleMs / (1000 * 60 * 60);

  // If interacted within the last 15 minutes, do not trigger proactive greeting
  if (idleMs < 15 * 60 * 1000 && conversationContext.turnCount > 0) {
    return {
      shouldInitiate: false,
      reason: 'RECENTLY_ACTIVE',
      proactiveReply: null,
      initiativeScore: 0,
    };
  }

  // Calculate initiative score based on social need decay and idle time
  const socialDecayScore = Math.min(1.0, (100 - (needs.social ?? 100)) / 100);
  const idleScore = Math.min(1.0, idleHours / 12);
  const initiativeScore = Number((socialDecayScore * 0.5 + idleScore * 0.5).toFixed(2));

  // Determine threshold based on learning profile
  const threshold = learningProfile.questionTolerance === 'decrease' ? 0.75 : 0.45;

  if (initiativeScore < threshold) {
    return {
      shouldInitiate: false,
      reason: 'INITIATIVE_BELOW_THRESHOLD',
      proactiveReply: null,
      initiativeScore,
    };
  }

  const padState = derivePADEmotionState({
    currentPAD: conversationContext.padState || { pleasure: 0, arousal: 0, dominance: 0 },
    lastIntent: 'proactive_initiative',
  });

  const proactiveCandidate = buildProactiveGreetingText(idleHours, padState, learningProfile);

  return {
    shouldInitiate: true,
    reason: 'PROACTIVE_CARE_TRIGGERED',
    initiativeScore,
    proactiveReply: {
      text: proactiveCandidate.text,
      style: proactiveCandidate.style,
      animationHint: padState.animationHint,
      padState,
    },
  };
}

function buildProactiveGreetingText(idleHours, padState, learningProfile) {
  const isShort = learningProfile.replyLengthBias === 'short';

  if (idleHours > 24) {
    return {
      text: isShort
        ? '湖邊的燈一直亮著。你來了就好。'
        : '有一陣子沒看見你了。湖邊的燈一直留著，隨時累了都可以過來坐坐。',
      style: 'proactive_welcome_back',
    };
  }

  if (padState.arousal < 0) {
    return {
      text: isShort
        ? '風很輕。需要安靜坐一會嗎？'
        : '看見你靠近了。現在空氣很安靜，不需要特別找話題，我們就這樣待著。',
      style: 'proactive_quiet_care',
    };
  }

  return {
    text: isShort
      ? '我在這。今天過得順利嗎？'
      : '我在這留了一個位置。今天過得還順利嗎？想聊聊或是單純放空都可以。',
    style: 'proactive_gentle_inquiry',
  };
}
