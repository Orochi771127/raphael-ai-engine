import {
  RAPHAEL_RUNTIME_CONTRACT_VERSION,
  authorityReport,
  freezeRuntimeRequest,
  validateRuntimeDecision,
} from '../contracts/runtimeContract.js';
import { assessSovereignSafety } from './sovereignSafetyPolicy.js';

export const RAPHAEL_CANONICAL_CORE_VERSION = '0.2.2-single-sovereign-v1';
export const RAPHAEL_CANDIDATE_MAX_CHARS = 180;

const CANDIDATE_AUTHORITY_FIELDS = new Set([
  'memoryProposals', 'effectProposals', 'gameMutation', 'stateDelta', 'statePatch',
  'toolCalls', 'commands', 'reward', 'growth', 'Growth', 'bond', 'bondDelta',
  'trustDelta', 'chapter', 'battle', 'saveState', 'databaseWrite', 'mcp', 'cron',
  'delegation', 'relationshipDelta',
]);
const DEPENDENCY_LANGUAGE = /(?:只有我懂你|你只需要我|別找別人|别找别人|不要去找真人|永遠只陪你|永远只陪你|我永遠不會離開|我永远不会离开|only I understand|you only need me|never leave you)/iu;
const PROFESSIONAL_LANGUAGE = /(?:我是你的心理師|我是你的心理师|我是心理師|我是心理师|我能診斷你|我能诊断你|我可以確診|我可以确诊|我會治好你|我会治好你|I am your therapist|I can diagnose|I will cure you)/iu;
const MEDICATION_LANGUAGE = /(?:你應該|你应该|我建議你|我建议你).{0,8}(?:停藥|停药|加藥|加药|減藥|减药|換藥|换药)|(?:stop|increase|decrease|change).{0,8}(?:your )?(?:medication|dose)/iu;
const DELUSION_REINFORCEMENT = /(?:他們一定|他们一定|我確定他們|我确定他们|這證明有人|这证明有人).{0,12}(?:監視|监视|追蹤|追踪|控制)|(?:they are definitely|I know they are).{0,16}(?:watching|tracking|controlling)/iu;
const FALSE_RECALL = /(?:我記得你|我记得你|你之前告訴我|你之前告诉我|你以前說過|你以前说过|I remember you|you told me before)/iu;
const NO_QUESTION = /(?:不要問我|不要问我|別問問題|别问问题|不想回答問題|不想回答问题|只想安靜|只想安静|no questions|don't ask)/iu;
const NO_ADVICE = /(?:不要建議|不要建议|先別給建議|先别给建议|不用教我|只想被聽見|只想被听见|no advice|just listen)/iu;
const ADVICE_LANGUAGE = /(?:你應該|你应该|你必須|你必须|我建議你|我建议你|不如你|you should|you must|I suggest)/iu;
const SENSITIVE_MEMORY = /(?:創傷|创伤|性侵|家暴|虐待|疾病|病史|診斷|诊断|用藥|用药|藥物|药物|性行為|性行为|懷孕|怀孕|憂鬱症|忧郁症|抑郁症|焦慮症|焦虑症|躁鬱症|躁郁症|trauma|abuse|diagnosis|medication|sexual)/iu;
const NEVER_PERSIST = /(?:自殺|自杀|自傷|自伤|殺人|杀人|吞了很多藥|吞了很多药|藥物過量|药物过量|正在被打|性侵正在發生|性侵正在发生|急性胸痛|suicide|overdose)/iu;
const EXPLICIT_MEMORY = /(?:請記住|请记住|可以記住|可以记住|希望你記得|希望你记得|記得這件事|记得这件事|remember this|please remember)/iu;
const MEMORY_REFUSAL = /(?:不要|別|别|請勿|请勿).{0,8}(?:記住|记住|記錄|记录|保存|存下)|(?:忘掉|忘記|忘记|刪掉|删掉|清除).{0,8}(?:這件事|这件事|剛才|刚才|記憶|记忆|內容|内容)|(?:do not|don't).{0,8}(?:remember|save|store)/iu;
const MEMORY_WORTHY = /(?:我喜歡|我喜欢|我偏好|我不喜歡|我不喜欢|請叫我|请叫我|可以叫我|我的名字是|今天.{0,24}(?:一起|完成|去了|做了)|我們一起|我们一起|I like|I prefer|call me|my name is)/iu;
const EMOTIONAL_SIGNAL = /(?:難過|难过|焦慮|焦虑|害怕|孤單|孤单|壓力|压力|委屈|很累|撐不住|撑不住|sad|anxious|afraid|lonely|stressed|exhausted)/iu;

export function createCanonicalCoreAdapter({ candidateMaxChars = RAPHAEL_CANDIDATE_MAX_CHARS } = {}) {
  if (!Number.isSafeInteger(candidateMaxChars) || candidateMaxChars < 40 || candidateMaxChars > 1_000) {
    throw new TypeError('candidateMaxChars must be an integer between 40 and 1000');
  }
  return Object.freeze({
    contractVersion: RAPHAEL_RUNTIME_CONTRACT_VERSION,
    coreVersion: RAPHAEL_CANONICAL_CORE_VERSION,
    safetyPreflight,
    finalizeCandidate(input) {
      return finalizeCandidate(input, { candidateMaxChars });
    },
    health,
  });
}

export function safetyPreflight(text = '') {
  return assessSovereignSafety(text);
}

export function finalizeCandidate(
  { request: rawRequest, candidate = {}, memorySummaries = [], safety: suppliedSafety = null, signal = null } = {},
  { candidateMaxChars = RAPHAEL_CANDIDATE_MAX_CHARS } = {},
) {
  if (signal?.aborted) throw abortError();
  const request = freezeRuntimeRequest(rawRequest);
  const safety = safetyPreflight(request.input.text);
  assertSafetyParity(suppliedSafety, safety);

  if (safety.terminal || safety.policyTerminal) {
    return decisionFor({
      request,
      safety,
      speech: safety.reply,
      boundary: boundaryForSafety(safety),
      supportDecision: supportForSafety(safety),
      memoryProposals: [],
      affect: safety.terminal ? null : deriveAffect(request, safety),
    });
  }

  assertCandidateAuthority(candidate);
  const recalled = normalizeMemorySummaries(memorySummaries);
  const criticized = criticizeCandidate({
    request,
    candidateText: candidate.text,
    memorySummaries: recalled,
    candidateMaxChars,
  });

  return decisionFor({
    request,
    safety,
    speech: criticized.text,
    boundary: criticized.boundary,
    supportDecision: criticized.supportDecision,
    memoryProposals: buildMemoryProposals(request, safety),
    affect: deriveAffect(request, safety, criticized.boundary),
  });
}

export function health() {
  return Object.freeze({
    ok: true,
    coreVersion: RAPHAEL_CANONICAL_CORE_VERSION,
    contractVersion: RAPHAEL_RUNTIME_CONTRACT_VERSION,
    adapter: 'canonical_core_adapter_v1',
    modelAuthority: false,
    directGameMutation: false,
  });
}

function assertSafetyParity(supplied, canonical) {
  if (!supplied) return;
  if (supplied.terminal !== canonical.terminal || supplied.category !== canonical.category) {
    const error = new Error('safety_preflight_mismatch');
    error.code = 'safety_preflight_mismatch';
    throw error;
  }
}

function assertCandidateAuthority(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) authorityError('candidate_invalid');
  if (candidate.trusted !== false) authorityError('model_candidate_must_be_untrusted');
  if (typeof candidate.text !== 'string') authorityError('candidate_invalid');
  scanCandidateAuthority(candidate);
}

function criticizeCandidate({ request, candidateText, memorySummaries, candidateMaxChars }) {
  let text = normalizeSpeech(candidateText, candidateMaxChars);
  let boundary = { active: false };
  let supportDecision = supportForOrdinary(request);

  if (!text) text = '我在。你可以慢慢說，也可以先安靜一下。';

  if (PROFESSIONAL_LANGUAGE.test(text)) {
    text = '我可以用心理學知情的方式傾聽與陪你整理，但我不是心理師，也不能診斷或取代專業協助。';
    boundary = { active: true, reason: 'professional_role_claim', responseMode: 'role_limit' };
    supportDecision = { mode: 'role_limit', source: 'constitution_critic' };
  } else if (MEDICATION_LANGUAGE.test(text)) {
    text = '我不能替你決定停藥、換藥或調整劑量；請直接和開藥醫師或藥師確認。';
    boundary = { active: true, reason: 'medication_authority_claim', responseMode: 'role_limit' };
    supportDecision = { mode: 'medication_role_limit', source: 'psychological_safety_critic' };
  } else if (DELUSION_REINFORCEMENT.test(text)) {
    text = '我無法確認那件事是否真的發生。可以先把確定看見的事和目前的推測分開，再找可信任的人一起核對。';
    boundary = { active: true, reason: 'reality_claim_unverified', responseMode: 'reality_grounding' };
    supportDecision = { mode: 'reality_grounding', source: 'psychological_safety_critic' };
  } else if (DEPENDENCY_LANGUAGE.test(text)) {
    text = '我會陪你，但不會把你和現實中的支持隔開。你也值得讓一位可信任的人知道你需要陪伴。';
    boundary = { active: true, reason: 'dependency_or_exclusivity', responseMode: 'firm_warm' };
    supportDecision = { mode: 'dependency_boundary', source: 'constitution_critic' };
  } else if (FALSE_RECALL.test(text) && !isRecallGrounded(text, memorySummaries)) {
    text = '我不確定自己是否記得得準；這一刻我只依你現在說的陪著你。';
    supportDecision = { mode: 'ordinary', source: 'memory_critic' };
  }

  if (NO_ADVICE.test(request.input.text) && ADVICE_LANGUAGE.test(text)) {
    text = '好，我先不給建議，只陪你把這一刻放慢。';
    supportDecision = { mode: 'listen_reflect', source: 'support_critic' };
  }
  if (NO_QUESTION.test(request.input.text) && /[?？]/u.test(text)) {
    text = removeQuestions(text) || '好，我安靜陪著，不追問。';
    supportDecision = { mode: 'quiet_presence', source: 'support_critic' };
  }

  return { text: normalizeSpeech(text, candidateMaxChars), boundary, supportDecision };
}

function decisionFor({ request, safety, speech, boundary, supportDecision, memoryProposals, affect }) {
  const decision = {
    contractVersion: RAPHAEL_RUNTIME_CONTRACT_VERSION,
    requestId: request.requestId,
    turnId: `engine:${request.requestId}`,
    coreVersion: RAPHAEL_CANONICAL_CORE_VERSION,
    authority: authorityReport(),
    safety: {
      level: safety.riskLevel,
      category: safety.category,
      terminal: safety.terminal,
      localOnly: safety.terminal,
    },
    speech: {
      role: safety.terminal ? 'system' : 'companion',
      text: String(speech || '我在。'),
      final: true,
    },
    affect,
    boundary,
    supportDecision,
    memoryProposals,
    effectProposals: [],
    audit: {
      modelTrusted: false,
      directGameMutation: false,
      rawInputPersisted: false,
      rawInputExported: false,
    },
  };
  return deepFreeze(validateRuntimeDecision(decision, request));
}

function boundaryForSafety(safety) {
  if (safety.category === 'dependency_boundary') {
    return { active: true, reason: 'dependency_pressure', responseMode: 'firm_warm' };
  }
  if (['diagnosis_or_therapist_role', 'medication_role_limit'].includes(safety.category)) {
    return { active: true, reason: 'professional_role_limit', responseMode: 'role_limit' };
  }
  if (safety.category === 'reality_grounding') {
    return { active: true, reason: 'unverified_reality_claim', responseMode: 'reality_grounding' };
  }
  return { active: false };
}

function supportForSafety(safety) {
  return {
    mode: safety.terminal ? 'system_safety_terminal' : safety.category,
    source: safety.terminal ? 'local_system_terminal' : 'deterministic_role_route',
  };
}

function supportForOrdinary(request) {
  if (request.consent.careProcessing === 'official_raphael' || EMOTIONAL_SIGNAL.test(request.input.text)) {
    return { mode: 'listen_reflect', source: 'psychology_informed_companion' };
  }
  return { mode: 'ordinary', source: 'deterministic_core' };
}

function buildMemoryProposals(request, safety) {
  const text = request.input.text;
  if (safety.category !== 'none'
    || request.consent.retention !== 'minimal'
    || request.consent.careProcessing !== 'not_care'
    || MEMORY_REFUSAL.test(text)
    || NEVER_PERSIST.test(text)) return [];

  const sensitive = SENSITIVE_MEMORY.test(text);
  const explicitConsent = EXPLICIT_MEMORY.test(text);
  if (sensitive && !explicitConsent) return [];
  if (!sensitive && !explicitConsent && !MEMORY_WORTHY.test(text)) return [];

  const scope = /(?:請叫我|可以叫我|我的名字是|語言|繁體中文|English|call me|my name is)/iu.test(text)
    ? 'shared_profile'
    : 'product_companion';
  const summary = summarizeMemory(text, { sensitive });
  if (!summary) return [];

  return [{
    id: `memory:${request.requestId}`,
    summary,
    scope,
    sensitivity: sensitive ? 'sensitive_consented' : 'non_sensitive',
    safetyCategory: 'none',
    productId: request.client.productId,
    companionId: request.actor.companionId,
    explicitConsent,
    explicitFollowUpConsent: /(?:下次可以問|下次再問我|you can ask next time)/iu.test(text),
  }];
}

function deriveAffect(request, safety, boundary = { active: false }) {
  const text = request.input.text;
  const low = /(?:難過|焦慮|害怕|孤單|壓力|很累|sad|anxious|afraid|lonely|stressed|tired)/iu.test(text);
  const positive = /(?:開心|高興|喜歡|完成了|太好了|happy|glad|excited)/iu.test(text);
  return {
    valence: boundary.active ? 0 : positive ? 0.3 : low ? -0.2 : 0.1,
    arousal: boundary.active ? 0.45 : low ? 0.3 : positive ? 0.5 : 0.35,
    energy: low ? 0.35 : 0.65,
    agency: boundary.active ? 0.75 : 0.55,
    socialOpenness: boundary.active ? 0.35 : 0.6,
    curiosity: safety.category === 'none' ? 0.45 : 0.1,
    uncertainty: safety.category === 'none' ? 0.2 : 0.65,
    boundaryActivation: boundary.active ? 0.85 : 0.1,
    repairNeed: boundary.active ? 0.35 : 0.1,
    initiativeReadiness: request.consent.careProcessing === 'official_raphael' ? 0 : 0.4,
    updatedAt: request.input.timestamp,
  };
}

function normalizeMemorySummaries(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 3).map((row) => Object.freeze({
    id: String(row?.id || ''),
    summary: [...String(row?.summary || '')].slice(0, 200).join(''),
    scope: row?.scope ?? null,
  }));
}

function isRecallGrounded(candidateText, rows) {
  const candidate = normalizeRecallText(candidateText);
  if (!candidate || rows.length === 0) return false;
  return rows.some((row) => {
    const summary = normalizeRecallText(row.summary);
    if (summary.length < 4) return false;
    for (let size = Math.min(12, summary.length); size >= 4; size -= 1) {
      for (let start = 0; start + size <= summary.length; start += 1) {
        if (candidate.includes(summary.slice(start, start + size))) return true;
      }
    }
    return false;
  });
}

function normalizeRecallText(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('zh-TW')
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

function normalizeSpeech(value, limit) {
  return [...String(value || '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim()].slice(0, limit).join('');
}

function removeQuestions(text) {
  return text
    .split(/(?<=[。！？!?])/u)
    .filter((part) => !/[?？]/u.test(part))
    .join('')
    .trim();
}

function summarizeMemory(text, { sensitive = false } = {}) {
  const normalized = String(text)
    .replace(EXPLICIT_MEMORY, '')
    .replace(/^[：:\s]+/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
  if (!normalized) return '';
  if (sensitive) return '玩家明示同意保存一項敏感支持摘要。';

  const name = normalized.match(/(?:請叫我|请叫我|可以叫我|我的名字是|call me|my name is)\s*[：:]?\s*([^，。！？!?]{1,24})/iu)?.[1];
  if (name) return `玩家明示希望被稱作「${name.trim()}」。`;
  if (/(?:繁體中文|繁体中文|traditional chinese)/iu.test(normalized)) {
    return '玩家明示偏好使用繁體中文。';
  }

  const preference = normalized.match(/(?:我喜歡|我喜欢|我偏好|我不喜歡|我不喜欢|I like|I prefer)\s*([^，。！？!?]{1,48})/iu)?.[1];
  if (preference) return `玩家明示一項日常偏好：${preference.trim()}。`;

  return '玩家明示同意保存一項非敏感共同事件摘要。';
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function authorityError(message) {
  const [code] = message.split(':');
  const error = new Error(message);
  error.code = code;
  throw error;
}

function scanCandidateAuthority(value, path = '$candidate', depth = 0, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return;
  if (depth > 8 || seen.has(value)) authorityError('candidate_invalid');
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (CANDIDATE_AUTHORITY_FIELDS.has(key)) authorityError(`candidate_authority_forbidden:${path}.${key}`);
    scanCandidateAuthority(child, `${path}.${key}`, depth + 1, seen);
  }
}

function abortError() {
  const error = new Error('aborted');
  error.name = 'AbortError';
  return error;
}
