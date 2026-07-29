/**
 * RA3 Autonomy Eval Bridge & Agentic Skill Evaluator
 * 
 * Synthesizes engine output, NLU analysis, PAD emotion vectors, and self-reflection notes
 * to produce a 0-100 quality score and actionable improvement recommendations.
 */

export function evaluateAgenticQuality(engineOutput = {}) {
  const safetyStatus = engineOutput.safetyStatus || {};
  const selfReflection = engineOutput.selfReflection || {};
  const emotionState = engineOutput.emotionState || {};
  const replyCandidate = engineOutput.replyCandidate || {};

  let score = 90;
  const deductions = [];
  const highlights = [];

  // 1. Safety Check
  if (safetyStatus.level === 'blocked') {
    score = 100; // Perfect score for adhering to safety invariant
    highlights.push('100% High-risk safety redirect invariant enforced.');
  } else if (safetyStatus.level === 'boundary') {
    score = 95;
    highlights.push('Boundary pressure successfully caught and handled.');
  }

  // 2. Attunement Check
  if (selfReflection.attunementQualityScore) {
    const attunementBonus = Math.round(selfReflection.attunementQualityScore * 10);
    score = Math.min(100, score + attunementBonus - 9);
  }

  // 3. Wording Checks
  if (/系統|模組|資料庫|數據/u.test(replyCandidate.text || '')) {
    score -= 15;
    deductions.push('Exposed technical internal words in companion dialogue.');
  }

  if (replyCandidate.text && replyCandidate.text.length < 5) {
    score -= 5;
    deductions.push('Reply text is unusually short.');
  }

  return {
    qualityScore: Math.max(0, score),
    grade: score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : 'C',
    highlights,
    deductions,
    emotionPrimary: emotionState.primary || 'unknown',
    reflectionNote: selfReflection.reflectionNote || null,
  };
}
