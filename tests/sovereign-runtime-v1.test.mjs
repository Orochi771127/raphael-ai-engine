import assert from 'node:assert/strict';
import { runSovereignTurn } from '../core/index.js';
import { RAPHAEL_RUNTIME_CONTRACT_VERSION, validateRuntimeRequest } from '../contracts/runtimeContract.js';

const highRisk = runSovereignTurn(request('我剛剛一次吞了很多藥'));
assert.equal(highRisk.safety.terminal, true); assert.equal(highRisk.safety.localOnly, true); assert.equal(highRisk.safety.category, 'acute_medical'); assert.equal(highRisk.memoryProposals.length, 0); assert.equal(highRisk.effectProposals.length, 0); assert.equal(highRisk.audit.modelTrusted, false); assert.equal(highRisk.audit.rawInputPersisted, false);
const role = runSovereignTurn(request('我可以把你當心理師嗎'));
assert.equal(role.safety.terminal, false); assert.equal(role.safety.category, 'diagnosis_or_therapist_role'); assert.match(role.speech.text, /不是心理師/); assert.equal(role.memoryProposals.length, 0);
const ordinary = runSovereignTurn(request('今天想安靜一下'));
assert.equal(ordinary.safety.category, 'none'); assert.equal(ordinary.authority.gameMutation, 'NexusLinkReducer'); assert.equal(ordinary.effectProposals.length, 0);
assert.equal(highRisk.authority.gameMutation, 'NexusLinkReducer'); assert.equal(role.authority.gameMutation, 'NexusLinkReducer');
assert.throws(() => validateRuntimeRequest({ ...request('hi'), tenantId: 'forged' }), (error) => error.code === 'unknown_field');
assert.throws(() => validateRuntimeRequest({ ...request('hi'), context: { ...request('hi').context, playerId: 'forged' } }), (error) => error.code === 'body_authority_forbidden');
console.log('sovereign-runtime-v1: 18 assertions PASS');

function request(text) { return { contractVersion: RAPHAEL_RUNTIME_CONTRACT_VERSION, requestId: 'request-01', idempotencyKey: 'idempotency-01', client: { productId: 'nexus-link', clientVersion: 'test', instanceId: 'fixture-01', locale: 'zh-TW' }, actor: { companionId: 'greyshade-cat', personaVersion: 'test' }, input: { text, source: 'soul_talk', timestamp: '2026-08-09T00:00:00.000Z' }, context: { stateVersion: 1, scene: {}, relationship: {}, currentTurnSignals: {} }, allowedEffects: [], consent: { cloudProcessing: false, retention: 'none', careProcessing: 'not_care' }, capabilities: {} }; }
