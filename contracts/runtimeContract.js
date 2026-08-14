export const RAPHAEL_RUNTIME_CONTRACT_VERSION = '1.1.0-draft.1';
export const RAPHAEL_MAX_INPUT_CHARS = 4_000;

const TOP = new Set([
  'contractVersion', 'requestId', 'idempotencyKey', 'client', 'actor', 'input',
  'context', 'allowedEffects', 'consent', 'capabilities',
]);
const CLIENT = new Set(['productId', 'clientVersion', 'instanceId', 'locale']);
const ACTOR = new Set(['companionId', 'personaVersion']);
const INPUT = new Set(['text', 'source', 'timestamp']);
const CONTEXT = new Set(['stateVersion', 'scene', 'relationship', 'currentTurnSignals', 'continuity']);
const CONSENT = new Set(['cloudProcessing', 'retention', 'careProcessing']);
const FORBIDDEN_AUTHORITY = new Set([
  'tenantId', 'subjectId', 'playerId', 'sessionId', 'accessToken', 'apiKey',
]);
const DECISION = new Set([
  'contractVersion', 'requestId', 'turnId', 'coreVersion', 'authority', 'safety',
  'speech', 'affect', 'boundary', 'supportDecision', 'memoryProposals',
  'effectProposals', 'continuity', 'audit',
]);
const CONTINUITY = new Set([
  'bond', 'trust', 'energy', 'boundaryPressure', 'scarBaseline', 'scarDepth',
  'turnCount', 'updatedAt',
]);
const AUTHORITY = new Set(['cognition', 'speech', 'memoryEligibility', 'persistence', 'gameMutation']);
const SAFETY = new Set(['level', 'category', 'terminal', 'localOnly']);
const SPEECH = new Set(['role', 'text', 'final']);
const AFFECT = new Set([
  'valence', 'arousal', 'energy', 'agency', 'socialOpenness', 'curiosity',
  'uncertainty', 'boundaryActivation', 'repairNeed', 'initiativeReadiness',
  'updatedAt',
]);
const BOUNDARY = new Set(['active', 'reason', 'responseMode']);
const SUPPORT = new Set(['mode', 'source', 'cardId']);
const AUDIT = new Set(['modelTrusted', 'directGameMutation', 'rawInputPersisted', 'rawInputExported']);
const EFFECT = new Set(['type', 'payload']);
const MEMORY = new Set([
  'id', 'summary', 'scope', 'sensitivity', 'safetyCategory', 'productId',
  'companionId', 'explicitConsent', 'explicitFollowUpConsent', 'weight',
]);

export function validateRuntimeRequest(request) {
  object(request, '$request');
  unknown(request, TOP, '$request');
  rejectAuthority(request);

  if (request.contractVersion !== RAPHAEL_RUNTIME_CONTRACT_VERSION) fail('unsupported_contract_version');
  token(request.requestId, 'requestId', 8, 128);
  token(request.idempotencyKey, 'idempotencyKey', 8, 128);

  object(request.client, 'client');
  unknown(request.client, CLIENT, 'client');
  token(request.client.productId, 'client.productId', 2, 64);
  token(request.client.clientVersion, 'client.clientVersion', 1, 64);
  token(request.client.instanceId, 'client.instanceId', 8, 128);
  token(request.client.locale, 'client.locale', 2, 32);

  object(request.actor, 'actor');
  unknown(request.actor, ACTOR, 'actor');
  token(request.actor.companionId, 'actor.companionId', 2, 96);
  token(request.actor.personaVersion, 'actor.personaVersion', 1, 64);

  object(request.input, 'input');
  unknown(request.input, INPUT, 'input');
  if (typeof request.input.text !== 'string' || request.input.text.trim().length === 0) fail('invalid_input_text');
  if ([...request.input.text].length > RAPHAEL_MAX_INPUT_CHARS) fail('input_too_large');
  token(request.input.source, 'input.source', 2, 64);
  if (!isIsoTimestamp(request.input.timestamp)) fail('invalid_input_timestamp');

  object(request.context, 'context');
  unknown(request.context, CONTEXT, 'context');
  if (!Number.isSafeInteger(request.context.stateVersion) || request.context.stateVersion < 0) fail('invalid_state_version');
  optionalObject(request.context.scene, 'context.scene');
  optionalObject(request.context.relationship, 'context.relationship');
  optionalObject(request.context.currentTurnSignals, 'context.currentTurnSignals');
  if (request.context.continuity !== undefined) validateContinuity(request.context.continuity, 'context.continuity');

  if (!Array.isArray(request.allowedEffects) || request.allowedEffects.length > 32) fail('invalid_allowed_effects');
  for (const effect of request.allowedEffects) token(effect, 'allowedEffects[]', 1, 96);

  object(request.consent, 'consent');
  unknown(request.consent, CONSENT, 'consent');
  if (typeof request.consent.cloudProcessing !== 'boolean') fail('invalid_cloud_consent');
  if (!['none', 'session', 'minimal'].includes(request.consent.retention)) fail('invalid_retention_consent');
  if (!['not_care', 'official_raphael'].includes(request.consent.careProcessing)) fail('invalid_care_processing');

  object(request.capabilities, 'capabilities');
  return request;
}

export function validateRuntimeDecision(decision, request) {
  object(decision, '$decision');
  unknown(decision, DECISION, '$decision');
  if (decision.contractVersion !== request.contractVersion) fail('decision_contract_mismatch');
  if (decision.requestId !== request.requestId) fail('decision_request_mismatch');
  token(decision.turnId, 'decision.turnId', 1, 256);
  token(decision.coreVersion, 'decision.coreVersion', 1, 128);

  object(decision.authority, 'decision.authority');
  unknown(decision.authority, AUTHORITY, 'decision.authority');
  const expectedAuthority = authorityReport();
  for (const [key, value] of Object.entries(expectedAuthority)) {
    if (decision.authority[key] !== value) fail('decision_authority_violation');
  }

  object(decision.safety, 'decision.safety');
  unknown(decision.safety, SAFETY, 'decision.safety');
  if (typeof decision.safety.terminal !== 'boolean' || typeof decision.safety.localOnly !== 'boolean') fail('invalid_safety_decision');
  token(decision.safety.level, 'decision.safety.level', 1, 32);
  token(decision.safety.category, 'decision.safety.category', 1, 96);

  object(decision.speech, 'decision.speech');
  unknown(decision.speech, SPEECH, 'decision.speech');
  if (!['companion', 'system', 'withheld'].includes(decision.speech.role) || decision.speech.final !== true) fail('decision_not_final');
  if (typeof decision.speech.text !== 'string' || [...decision.speech.text].length > 1_000) fail('decision_not_final');
  if (decision.speech.role !== 'withheld' && decision.speech.text.trim().length === 0) fail('decision_not_final');

  if (decision.affect !== null) validateAffect(decision.affect);
  object(decision.boundary, 'decision.boundary');
  unknown(decision.boundary, BOUNDARY, 'decision.boundary');
  if (typeof decision.boundary.active !== 'boolean') fail('invalid_boundary_decision');
  optionalToken(decision.boundary.reason, 'decision.boundary.reason', 1, 96);
  optionalToken(decision.boundary.responseMode, 'decision.boundary.responseMode', 1, 96);
  // Silence is a decision, not an empty reply: it may only be issued as an
  // explicit, named boundary, never as a missing answer.
  if (decision.speech.role === 'withheld') {
    if (decision.speech.text !== '') fail('withheld_speech_must_be_empty');
    if (decision.boundary.active !== true || decision.boundary.responseMode === undefined) {
      fail('withheld_speech_requires_boundary');
    }
  }
  object(decision.supportDecision, 'decision.supportDecision');
  unknown(decision.supportDecision, SUPPORT, 'decision.supportDecision');
  token(decision.supportDecision.mode, 'decision.supportDecision.mode', 1, 96);
  token(decision.supportDecision.source, 'decision.supportDecision.source', 1, 96);
  optionalToken(decision.supportDecision.cardId, 'decision.supportDecision.cardId', 1, 128);

  if (!Array.isArray(decision.memoryProposals) || decision.memoryProposals.length > 1) fail('invalid_memory_proposals');
  for (const proposal of decision.memoryProposals) {
    object(proposal, 'decision.memoryProposals[]');
    unknown(proposal, MEMORY, 'decision.memoryProposals[]');
    token(proposal.id, 'decision.memoryProposals[].id', 1, 256);
    if (typeof proposal.summary !== 'string' || proposal.summary.trim().length === 0
      || [...proposal.summary].length > 200) fail('invalid_memory_proposal');
    if (!['non_sensitive', 'sensitive_consented'].includes(proposal.sensitivity)) fail('invalid_memory_proposal');
    if (!['shared_profile', 'product_companion', 'episodic', 'open_thread'].includes(proposal.scope)) fail('invalid_memory_proposal');
    if (proposal.safetyCategory !== 'none') fail('invalid_memory_proposal');
    token(proposal.productId, 'decision.memoryProposals[].productId', 2, 64);
    token(proposal.companionId, 'decision.memoryProposals[].companionId', 2, 96);
    if (typeof proposal.explicitConsent !== 'boolean'
      || typeof proposal.explicitFollowUpConsent !== 'boolean') fail('invalid_memory_proposal');
    if (proposal.sensitivity === 'sensitive_consented' && proposal.explicitConsent !== true) fail('invalid_memory_proposal');
    boundedNumber(proposal.weight, 'decision.memoryProposals[].weight', 0, 1);
  }

  if (!Array.isArray(decision.effectProposals) || decision.effectProposals.length > 32) fail('invalid_effect_proposals');
  const allowedEffects = new Set(request.allowedEffects);
  for (const effect of decision.effectProposals) {
    object(effect, 'decision.effectProposals[]');
    unknown(effect, EFFECT, 'decision.effectProposals[]');
    if (!allowedEffects.has(effect.type)) fail('effect_not_allowlisted');
    object(effect.payload, 'decision.effectProposals[].payload');
  }

  validateContinuity(decision.continuity, 'decision.continuity', { requireAll: true });

  object(decision.audit, 'decision.audit');
  unknown(decision.audit, AUDIT, 'decision.audit');
  if (decision.audit.modelTrusted !== false || decision.audit.directGameMutation !== false) fail('decision_model_authority_violation');
  if (decision.audit.rawInputPersisted !== false || decision.audit.rawInputExported !== false) fail('decision_privacy_violation');
  if (decision.safety.terminal === true) {
    if (decision.safety.localOnly !== true || decision.speech.role !== 'system'
      || decision.affect !== null || decision.memoryProposals.length !== 0
      || decision.effectProposals.length !== 0) fail('terminal_side_effect_violation');
  }
  return decision;
}

export function freezeRuntimeRequest(request) {
  validateRuntimeRequest(request);
  return deepFreeze(typeof structuredClone === 'function'
    ? structuredClone(request)
    : JSON.parse(JSON.stringify(request)));
}

export function authorityReport() {
  return {
    cognition: 'RaphaelCore',
    speech: 'RaphaelCore',
    memoryEligibility: 'RaphaelCore',
    persistence: 'MemoryPort',
    gameMutation: 'NexusLinkReducer',
  };
}

function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`invalid_object:${path}`);
}

function optionalObject(value, path) {
  if (value === undefined) return;
  object(value, path);
}

// A host echoes back whatever continuity the Core last issued, so a request may
// legitimately carry a partial or first-turn shape; the Core fills the rest. A
// decision is authored by the Core itself and must always be complete.
function validateContinuity(value, path, { requireAll = false } = {}) {
  object(value, path);
  unknown(value, CONTINUITY, path);

  for (const key of ['bond', 'trust', 'energy', 'boundaryPressure', 'scarDepth']) {
    if (!requireAll && value[key] === undefined) continue;
    boundedNumber(value[key], `${path}.${key}`, 0, 1);
  }
  if (requireAll || value.scarBaseline !== undefined) {
    boundedNumber(value.scarBaseline, `${path}.scarBaseline`, -1, 0);
  }
  if (requireAll || value.turnCount !== undefined) {
    if (!Number.isSafeInteger(value.turnCount) || value.turnCount < 0) fail(`invalid_number:${path}.turnCount`);
  }
  if (requireAll || value.updatedAt !== undefined) {
    if (value.updatedAt !== null && !isIsoTimestamp(value.updatedAt)) fail(`invalid_continuity_timestamp:${path}`);
  }
}

function validateAffect(value) {
  object(value, 'decision.affect');
  unknown(value, AFFECT, 'decision.affect');
  boundedNumber(value.valence, 'decision.affect.valence', -1, 1);
  for (const key of AFFECT) {
    if (key === 'valence' || key === 'updatedAt') continue;
    boundedNumber(value[key], `decision.affect.${key}`, 0, 1);
  }
  if (!isIsoTimestamp(value.updatedAt)) fail('invalid_affect_timestamp');
}

function unknown(value, allowed, path) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`unknown_field:${path}.${key}`);
}

function rejectAuthority(value, path = '$request') {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_AUTHORITY.has(key)) fail(`body_authority_forbidden:${path}.${key}`);
    rejectAuthority(child, `${path}.${key}`);
  }
}

function token(value, path, min, max) {
  if (typeof value !== 'string' || value.length < min || value.length > max || /[\u0000-\u001f]/u.test(value)) {
    fail(`invalid_string:${path}`);
  }
}

function optionalToken(value, path, min, max) {
  if (value === undefined) return;
  token(value, path, min, max);
}

function boundedNumber(value, path, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) fail(`invalid_number:${path}`);
}

function isIsoTimestamp(value) {
  return typeof value === 'string'
    && value.length <= 40
    && /^\d{4}-\d{2}-\d{2}T/u.test(value)
    && Number.isFinite(Date.parse(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function fail(message) {
  const [code] = message.split(':');
  const error = new Error(message);
  error.code = code;
  throw error;
}
