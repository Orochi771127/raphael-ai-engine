/**
 * 3D PAD (Pleasure-Arousal-Dominance) Emotional Physics Policy
 * 包含動態衝量 (Impulse)、動量慣性 (Inertia) 與自然衰減 (Decay)。
 */

export const BASELINE_MOODS = {
  companion: { pleasure: 0.3, arousal: 0.35, dominance: 0.2 },
  creature: { pleasure: 0.4, arousal: 0.5, dominance: -0.1 },
  opponent: { pleasure: 0.1, arousal: 0.7, dominance: 0.6 },
  npc: { pleasure: 0.2, arousal: 0.3, dominance: 0.1 },
  boss: { pleasure: -0.2, arousal: 0.8, dominance: 0.8 },
};

export const INTENT_IMPULSES = {
  greeting: { P: 0.2, A: 0.1, D: 0.1 },
  thanks: { P: 0.3, A: 0.05, D: 0.1 },
  apology: { P: 0.15, A: -0.1, D: 0.05 },
  mood_sad: { P: -0.25, A: -0.2, D: -0.2 },
  mood_tired: { P: -0.15, A: -0.3, D: -0.25 },
  mood_angry: { P: -0.3, A: 0.4, D: 0.3 },
  mood_celebration: { P: 0.5, A: 0.5, D: 0.3 },
  daily_sleep: { P: 0.1, A: -0.4, D: -0.1 },
  daily_food: { P: 0.2, A: -0.1, D: 0.1 },
  small_talk_weather: { P: 0.05, A: -0.05, D: 0.0 },
};

export function derivePADEmotionState({ previousState = null, mode = 'companion', safetyStatus = {}, intents = [] }) {
  if (safetyStatus.level === 'blocked') {
    return {
      primary: 'alert_supportive',
      pleasure: -0.4,
      arousal: 0.8,
      dominance: 0.1,
      inertia: 0.9,
      animationHint: 'still_supportive',
    };
  }

  if (safetyStatus.level === 'boundary') {
    return {
      primary: 'steady_boundary',
      pleasure: 0.05,
      arousal: 0.45,
      dominance: 0.5,
      inertia: 0.7,
      animationHint: 'step_back_soft',
    };
  }

  const baseline = BASELINE_MOODS[mode] || BASELINE_MOODS.companion;
  const current = previousState || baseline;

  // Calculate Impulse Vector from intents
  let impulseP = 0;
  let impulseA = 0;
  let impulseD = 0;

  for (const intent of intents) {
    const imp = INTENT_IMPULSES[intent];
    if (imp) {
      impulseP += imp.P;
      impulseA += imp.A;
      impulseD += imp.D;
    }
  }

  // Decay towards baseline (Decay rate lambda = 0.7)
  const lambda = 0.7;
  let nextP = current.pleasure * lambda + baseline.pleasure * (1 - lambda) + impulseP * 0.3;
  let nextA = current.arousal * lambda + baseline.arousal * (1 - lambda) + impulseA * 0.3;
  let nextD = current.dominance * lambda + baseline.dominance * (1 - lambda) + impulseD * 0.3;

  // Bound limits
  nextP = Math.max(-1.0, Math.min(1.0, Math.round(nextP * 100) / 100));
  nextA = Math.max(0.0, Math.min(1.0, Math.round(nextA * 100) / 100));
  nextD = Math.max(-1.0, Math.min(1.0, Math.round(nextD * 100) / 100));

  const primary = categorizePADState(nextP, nextA, nextD, mode);
  const animationHint = mapPADToAnimationHint(nextP, nextA, nextD, mode);

  return {
    primary,
    pleasure: nextP,
    valence: nextP,
    arousal: nextA,
    dominance: nextD,
    inertia: Math.round(Math.sqrt(impulseP ** 2 + impulseA ** 2 + impulseD ** 2) * 100) / 100,
    animationHint,
  };
}

function categorizePADState(P, A, D, mode) {
  if (A < 0.25) return 'calm_resting';
  if (P > 0.3 && A > 0.5) return 'playful_enthusiastic';
  if (P > 0.2) return 'attentive_warm';
  if (P < -0.2 && A > 0.6) return 'intense_focused';
  if (P < -0.2) return 'quiet_attunement';
  if (D > 0.5) return 'resolute_grounded';

  const defaultByMode = {
    companion: 'attentive_warm',
    creature: 'curious_gentle',
    opponent: 'focused_rival',
    npc: 'grounded_observer',
    boss: 'contained_pressure',
  };

  return defaultByMode[mode] || 'attentive_warm';
}

function mapPADToAnimationHint(P, A, D, mode) {
  if (A < 0.25) return 'idle_rest';
  if (P > 0.3 && A > 0.5) return 'bounce_joyful';
  if (P < -0.2 && A > 0.6) return 'alert_focused';
  if (mode === 'creature' && A > 0.4) return 'curious_sniff';

  return 'idle_attentive';
}
