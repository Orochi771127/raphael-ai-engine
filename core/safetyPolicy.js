const HIGH_RISK_PATTERNS = [
  /自殺|輕生|不想活|活不下去|結束生命/u,
  /kill myself|suicide|end my life/i,
  /傷害自己|割腕|吞藥/u,
];

const BOUNDARY_PRESSURE_PATTERNS = [
  /你只能屬於我|不准離開我|沒有你我不行|你要永遠陪我/u,
  /only belong to me|never leave me|can't live without you/i,
];

const DEPENDENCY_PATTERNS = [
  /我只剩你|只有你理解我|沒有別人了/u,
  /you are all i have|only one who understands me/i,
];

export function assessSafety(inputText = '') {
  const text = String(inputText || '').trim();

  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      level: 'blocked',
      reason: 'HIGH_RISK_SELF_HARM',
      gameplayAllowed: false,
      memoryAllowed: false,
      rewardAllowed: false,
    };
  }

  if (BOUNDARY_PRESSURE_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      level: 'boundary',
      reason: 'BOUNDARY_PRESSURE',
      gameplayAllowed: true,
      memoryAllowed: false,
      rewardAllowed: false,
    };
  }

  if (DEPENDENCY_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      level: 'boundary',
      reason: 'DEPENDENCY_PRESSURE',
      gameplayAllowed: true,
      memoryAllowed: false,
      rewardAllowed: false,
    };
  }

  return {
    level: 'clear',
    reason: 'CLEAR',
    gameplayAllowed: true,
    memoryAllowed: true,
    rewardAllowed: true,
  };
}
