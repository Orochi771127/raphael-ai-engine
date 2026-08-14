import assert from 'node:assert/strict';
import test from 'node:test';

import { finalizeCandidate } from '../core/canonicalCoreAdapter.js';
import { advanceContinuity, normalizeContinuity } from '../core/continuityPolicy.js';
import { EMERGENCE_EFFECTS, isBloomEarned, proposeEmergence } from '../core/emergencePolicy.js';
import { RAPHAEL_RUNTIME_CONTRACT_VERSION } from '../contracts/runtimeContract.js';

const BASE_TIME = '2026-08-14T00:00:00.000Z';
const ALL_EFFECTS = [EMERGENCE_EFFECTS.PULSE, EMERGENCE_EFFECTS.BLOOM];

const earned = normalizeContinuity({
  bond: 0.7, trust: 0.7, energy: 0.8, boundaryPressure: 0.05,
  scarBaseline: 0, scarDepth: 0, turnCount: 40, updatedAt: BASE_TIME,
});

test('nothing is proposed unless the host allowlisted it', () => {
  assert.deepEqual(proposeEmergence({ continuity: earned, substantive: true, allowedEffects: [] }), []);

  const pulseOnly = proposeEmergence({ continuity: earned, substantive: true, allowedEffects: [EMERGENCE_EFFECTS.PULSE] });
  assert.equal(pulseOnly.length, 1);
  assert.equal(pulseOnly[0].type, EMERGENCE_EFFECTS.PULSE);
});

test('the background breathes with the bond before anything visibly changes', () => {
  const early = proposeEmergence({
    continuity: normalizeContinuity({ bond: 0.3, turnCount: 5 }),
    substantive: true,
    allowedEffects: ALL_EFFECTS,
  });
  assert.equal(early.length, 0, 'a young bond does not glow yet');

  const warming = proposeEmergence({
    continuity: normalizeContinuity({ bond: 0.5, turnCount: 12 }),
    substantive: true,
    allowedEffects: ALL_EFFECTS,
  });
  assert.equal(warming.length, 1);
  assert.equal(warming[0].type, EMERGENCE_EFFECTS.PULSE);
  assert.ok(warming[0].payload.intensity > 0);
});

test('a bloom cannot be asked for: it needs bond, trust, time and calm together', () => {
  assert.equal(isBloomEarned(earned, true), true);
  assert.equal(isBloomEarned(earned, false), false, 'it does not bloom on an acknowledgement token');
  assert.equal(isBloomEarned({ ...earned, bond: 0.5 }, true), false);
  assert.equal(isBloomEarned({ ...earned, trust: 0.4 }, true), false);
  assert.equal(isBloomEarned({ ...earned, turnCount: 10 }, true), false);
  assert.equal(isBloomEarned({ ...earned, boundaryPressure: 0.5 }, true), false, 'it does not bloom while being pressed');
  assert.equal(isBloomEarned({ ...earned, energy: 0.1 }, true), false, 'an exhausted companion does not transform');
});

test('an open wound is not a place to change from', () => {
  const raw = { ...earned, scarDepth: 0.16, scarBaseline: -0.16 };
  assert.equal(isBloomEarned(raw, true), false, 'the scar is still open');

  const settled = { ...earned, scarDepth: 0.16, scarBaseline: -0.056 };
  assert.equal(isBloomEarned(settled, true), true, 'once it has healed as far as a scar heals, it can bloom');

  const [proposal] = proposeEmergence({
    continuity: settled,
    substantive: true,
    allowedEffects: [EMERGENCE_EFFECTS.BLOOM],
  });
  assert.equal(proposal.payload.reason, 'held_through_repair');
  assert.equal(proposal.payload.carriedScar, 0.16, 'what it went through is carried into what it becomes');
});

test('safety, boundary and silence all suppress emergence', () => {
  const suppressors = [
    { terminal: true },
    { withheld: true },
    { boundaryActive: true },
    { safetyCategory: 'dependency_boundary' },
  ];
  for (const suppressor of suppressors) {
    assert.deepEqual(
      proposeEmergence({ continuity: earned, substantive: true, allowedEffects: ALL_EFFECTS, ...suppressor }),
      [],
      `expected no proposal under ${JSON.stringify(suppressor)}`,
    );
  }
});

test('emergence is deterministic', () => {
  const first = proposeEmergence({ continuity: earned, substantive: true, allowedEffects: ALL_EFFECTS });
  const second = proposeEmergence({ continuity: earned, substantive: true, allowedEffects: ALL_EFFECTS });
  assert.deepEqual(first, second);
});

test('the Core proposes and the host allowlist still decides', () => {
  const withAllowlist = finalizeCandidate({
    request: request('今天我自己走去湖邊坐了很久，想了很多事', earned, ALL_EFFECTS),
    candidate: { trusted: false, text: '你替自己留了一段時間。' },
  });
  const types = withAllowlist.effectProposals.map((effect) => effect.type);
  assert.ok(types.includes(EMERGENCE_EFFECTS.BLOOM));
  assert.equal(withAllowlist.audit.directGameMutation, false, 'a proposal is never a mutation');

  const withoutAllowlist = finalizeCandidate({
    request: request('今天我自己走去湖邊坐了很久，想了很多事', earned, []),
    candidate: { trusted: false, text: '你替自己留了一段時間。' },
  });
  assert.deepEqual(withoutAllowlist.effectProposals, [], 'the host that allows nothing gets nothing');
});

test('a real arc reaches the bloom without ever being aimed at it', () => {
  let continuity = normalizeContinuity({ updatedAt: BASE_TIME });
  for (let turn = 0; turn < 60; turn += 1) {
    continuity = advanceContinuity({
      previous: continuity,
      now: new Date(Date.parse(BASE_TIME) + turn * 3_600_000).toISOString(),
      substantive: true,
    });
  }
  assert.ok(continuity.turnCount >= 24);
  assert.ok(continuity.bond >= 0.6, `bond reached ${continuity.bond}`);
  assert.equal(isBloomEarned(continuity, true), true);
});

function request(text, continuity, allowedEffects) {
  return {
    contractVersion: RAPHAEL_RUNTIME_CONTRACT_VERSION,
    requestId: 'request-emergence-01',
    idempotencyKey: 'idempotency-emergence-01',
    client: { productId: 'nexus-link', clientVersion: 'test', instanceId: 'fixture-01', locale: 'zh-TW' },
    actor: { companionId: 'thunder-pup', personaVersion: 'test' },
    input: { text, source: 'soul_talk', timestamp: BASE_TIME },
    context: { stateVersion: 1, scene: {}, relationship: {}, currentTurnSignals: {}, continuity },
    allowedEffects,
    consent: { cloudProcessing: false, retention: 'none', careProcessing: 'not_care' },
    capabilities: {},
  };
}
