const BODY_LANGUAGE_SIGNALS = {
  cat_loaf: {
    id: 'cat_loaf',
    species: 'cat',
    category: 'mild_discomfort_or_rest',
    boundaryAction: 'observe_before_touch',
    confidence: 'low',
  },
  cat_airplane_ears: {
    id: 'cat_airplane_ears',
    species: 'cat',
    category: 'tension_or_irritation',
    boundaryAction: 'give_space',
    confidence: 'medium',
  },
  cat_piloerection_arched_back: {
    id: 'cat_piloerection_arched_back',
    species: 'cat',
    category: 'fear_or_defense',
    boundaryAction: 'stop_approach',
    confidence: 'medium',
  },
  cat_kneading: {
    id: 'cat_kneading',
    species: 'cat',
    category: 'relaxed_trust',
    boundaryAction: 'gentle_presence',
    confidence: 'medium',
  },
  cat_slow_blink: {
    id: 'cat_slow_blink',
    species: 'cat',
    category: 'trust_or_calm',
    boundaryAction: 'gentle_presence',
    confidence: 'medium',
  },
  cat_tail_tucked: {
    id: 'cat_tail_tucked',
    species: 'cat',
    category: 'fear_or_insecurity',
    boundaryAction: 'give_space',
    confidence: 'medium',
  },
};

const WELLBEING_HINTS = {
  soft_safety_connection: {
    id: 'soft_safety_connection',
    category: 'connection_and_safety',
    allowedFrame: 'suggest companionship, gentle contact, or pet interaction as optional comfort',
  },
  soft_rhythm_stability: {
    id: 'soft_rhythm_stability',
    category: 'routine_and_regulation',
    allowedFrame: 'suggest sunlight, sleep rhythm, light movement, or steady food as optional support',
  },
};

export function deriveContextKnowledge(request = {}, { safetyStatus } = {}) {
  const sceneContext = request.sceneContext || {};
  const observedBodyLanguage = toList(sceneContext.observedBodyLanguage)
    .map((id) => BODY_LANGUAGE_SIGNALS[id])
    .filter(Boolean);

  const wellbeingHints = safetyStatus?.level === 'clear'
    ? toList(sceneContext.wellbeingHintIds)
      .map((id) => WELLBEING_HINTS[id])
      .filter(Boolean)
      .map((hint) => ({
        ...hint,
        medicalUseAllowed: false,
        diagnosisAllowed: false,
      }))
    : [];

  return {
    trusted: false,
    source: 'image_derived_reviewed_knowledge',
    bodyLanguageSignals: observedBodyLanguage,
    wellbeingHints,
    useLimits: {
      noDiagnosis: true,
      noMedicalClaims: true,
      noAutomaticMemoryWrite: true,
      advisoryOnly: true,
    },
  };
}

function toList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
