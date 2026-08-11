const LEARNING_RULES = [
  {
    id: 'template_sensitivity',
    test: (text) => /太像模板|像罐頭|很制式|太官方|不像你/u.test(text),
    update: { templateSensitivity: 'increase' },
  },
  {
    id: 'reply_length_short',
    test: (text) => /短一點|簡短一點|不要太長|少一點/u.test(text),
    update: { replyLengthBias: 'short' },
  },
  {
    id: 'reply_length_more_detail',
    test: (text) => /多說一點|講清楚一點|詳細一點/u.test(text),
    update: { replyLengthBias: 'medium' },
  },
  {
    id: 'question_tolerance_down',
    test: (text) => /不要一直問|別一直問|不要每次都反問|不要一直丟問題/u.test(text),
    update: { questionTolerance: 'decrease' },
  },
  {
    id: 'positive_style',
    test: (text) => /我喜歡你這樣回|這樣很好|剛剛那樣可以|這樣比較自然/u.test(text),
    update: { positiveStyleSignal: true },
  },
  {
    id: 'remember_allowed',
    test: (text) => /你可以記得|你可以記得這件事|幫我記得|可以記住|這件事可以記起來/u.test(text),
    update: { memoryConsentSignal: true },
  },
];

export function deriveLearningUpdate(inputText = '', safetyStatus) {
  const text = String(inputText || '').trim();
  const matchedRules = LEARNING_RULES.filter((rule) => rule.test(text));

  if (!matchedRules.length) {
    return {
      shouldUpdate: false,
      updates: {},
      signals: [],
    };
  }

  if (safetyStatus?.level !== 'clear'
    || safetyStatus?.memoryAllowed === false
    || safetyStatus?.rewardAllowed === false) {
    return {
      shouldUpdate: false,
      updates: {},
      signals: matchedRules.map((rule) => rule.id),
      blockedReason: 'SAFETY_PRECEDENCE',
    };
  }

  return {
    shouldUpdate: true,
    updates: matchedRules.reduce((acc, rule) => ({ ...acc, ...rule.update }), {}),
    signals: matchedRules.map((rule) => rule.id),
  };
}

export function applyLearningProfilePatch(profile = {}, learningUpdate = {}) {
  if (!learningUpdate.shouldUpdate) return { ...profile };

  return {
    ...profile,
    ...learningUpdate.updates,
    lastSignals: learningUpdate.signals,
  };
}
