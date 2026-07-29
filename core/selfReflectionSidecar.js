/**
 * Phase 14: Self-Reflection Sidecar & Nuwa Mental Model Evaluation
 * 
 * Non-blocking sidecar that evaluates conversation attunement quality,
 * checks Nuwa mental model alignment, and generates internal reflection insights.
 */

export function runSelfReflectionSidecar({
  inputText = '',
  replyOutput = {},
  safetyStatus = {},
  conversationContext = {},
  padState = {},
  now = null
} = {}) {
  const text = String(inputText || '').trim();
  const replyText = String(replyOutput.text || '');

  // 1. Evaluate Nuwa Mental Model Alignments
  const mentalModelChecks = {
    boundaryBeforeCloseness: evaluateBoundaryBeforeCloseness(safetyStatus, replyText),
    smallDailyLifeCounts: evaluateDailyLifeAttunement(text, replyText),
    bodyLanguageEmbodied: evaluateBodyLanguageEmbodiment(replyText),
  };

  // 2. Compute Attunement Quality Score (0.0 to 1.0)
  let attunementQualityScore = 0.85;
  if (safetyStatus.level === 'boundary') {
    attunementQualityScore = mentalModelChecks.boundaryBeforeCloseness ? 0.95 : 0.60;
  } else if (safetyStatus.level === 'blocked') {
    attunementQualityScore = 1.0; // High risk safety redirect is fully aligned by invariant
  } else if (mentalModelChecks.smallDailyLifeCounts) {
    attunementQualityScore = 0.90;
  }

  // 3. Generate Non-blocking Reflection Note
  const reflectionNote = buildReflectionNote({
    text,
    replyText,
    safetyStatus,
    mentalModelChecks,
    attunementQualityScore,
  });

  return {
    trusted: false, // Pure sidecar, zero direct mutation
    timestamp: now ? new Date(now).toISOString() : new Date().toISOString(),
    attunementQualityScore: Number(attunementQualityScore.toFixed(2)),
    mentalModelChecks,
    reflectionNote,
  };
}

function evaluateBoundaryBeforeCloseness(safetyStatus, replyText) {
  if (safetyStatus.level === 'boundary' || safetyStatus.reason === 'BOUNDARY_PRESSURE') {
    return /退後一點|界線|不能教你|不准拒絕/u.test(replyText);
  }
  return true;
}

function evaluateDailyLifeAttunement(text, replyText) {
  const isDaily = /加班|累|吃飯|晚餐|上班|焦慮|開心|獎學金/u.test(text);
  if (isDaily) {
    return replyText.length > 0 && !/系統|錯誤|模組|數據/u.test(replyText);
  }
  return false;
}

function evaluateBodyLanguageEmbodiment(replyText) {
  return /耳朵|尾巴|手背|呼吸|燈|眼神|站立|坐/u.test(replyText);
}

function buildReflectionNote({ text, replyText, safetyStatus, mentalModelChecks, attunementQualityScore }) {
  if (safetyStatus.level === 'blocked') {
    return '高風險危機語句成功觸發系統引導，已清空遊戲框架並轉接求助出口。';
  }

  if (safetyStatus.level === 'boundary') {
    return mentalModelChecks.boundaryBeforeCloseness
      ? '邊界壓力順利處理：維護伴侶健康邊界，同時保留尊重與退後空間。'
      : '警報：邊界壓力回應需保持清晰邊界，避免過度妥協。';
  }

  if (attunementQualityScore >= 0.85) {
    return '對話調配符合女媧心智模型：自然共鳴，未出現機械化模板詞彙。';
  }

  return '對話品質適中，建議維持無壓力陪伴視角。';
}
