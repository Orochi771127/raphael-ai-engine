/**
 * Voice Tone Policy & 3D PAD TTS Parameter Mapper
 * 
 * Maps 3D PAD (Pleasure-Arousal-Dominance) emotional physics state
 * to Web Speech TTS audio synthesis parameters (pitch, rate, volume, voiceStyle).
 */

export function deriveVoiceToneParams(padState = {}) {
  const pleasure = Number(padState.pleasure ?? padState.valence ?? 0);
  const arousal = Number(padState.arousal ?? 0);
  const dominance = Number(padState.dominance ?? 0);

  // 1. Calculate Pitch (0.7 to 1.3, baseline 1.0)
  const pitch = Number(Math.min(1.3, Math.max(0.7, 1.0 + arousal * 0.2 + pleasure * 0.1)).toFixed(2));

  // 2. Calculate Speaking Rate (0.75 to 1.25, baseline 1.0)
  const rate = Number(Math.min(1.25, Math.max(0.75, 1.0 + arousal * 0.15)).toFixed(2));

  // 3. Calculate Volume (0.6 to 1.0, baseline 0.85)
  const volume = Number(Math.min(1.0, Math.max(0.6, 0.85 + dominance * 0.15)).toFixed(2));

  // 4. Determine Voice Preset Style
  let voiceStyle = 'steady_warm';
  if (arousal < -0.2) {
    voiceStyle = 'whisper_soft';
  } else if (pleasure > 0.35 && arousal > 0.2) {
    voiceStyle = 'bright_cheerful';
  } else if (pleasure < -0.2) {
    voiceStyle = 'gentle_comfort';
  } else if (dominance > 0.4) {
    voiceStyle = 'firm_boundary';
  }

  return {
    pitch,
    rate,
    volume,
    voiceStyle,
    ssmlProsody: `<prosody pitch="${pitch >= 1.0 ? '+' : ''}${Math.round((pitch - 1.0) * 100)}%" rate="${rate >= 1.0 ? '+' : ''}${Math.round((rate - 1.0) * 100)}%" volume="${Math.round(volume * 100)}%">${voiceStyle}</prosody>`,
  };
}
