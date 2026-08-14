import assert from 'node:assert/strict';
import test from 'node:test';

import { finalizeCandidate } from '../core/canonicalCoreAdapter.js';
import {
  CONTINUITY_LIMITS,
  advanceContinuity,
  evaluateWithholding,
  normalizeContinuity,
} from '../core/continuityPolicy.js';
import {
  RAPHAEL_RUNTIME_CONTRACT_VERSION,
  validateRuntimeRequest,
  validateRuntimeDecision,
} from '../contracts/runtimeContract.js';

const BASE_TIME = '2026-08-14T00:00:00.000Z';

test('continuity normalizes to a bounded, frozen shape', () => {
  const empty = normalizeContinuity(null);
  assert.equal(empty.bond, 0);
  assert.equal(empty.energy, 1);
  assert.equal(empty.turnCount, 0);
  assert.equal(empty.updatedAt, null);
  assert.ok(Object.isFrozen(empty));

  const clamped = normalizeContinuity({
    bond: 9, trust: -3, energy: 'x', boundaryPressure: 0.5,
    scarBaseline: -7, scarDepth: 2, turnCount: -1, updatedAt: 'nope',
  });
  assert.equal(clamped.bond, 1);
  assert.equal(clamped.trust, 0);
  assert.equal(clamped.energy, 1);
  assert.equal(clamped.scarBaseline, -1);
  assert.equal(clamped.scarDepth, 1);
  assert.equal(clamped.turnCount, 0);
  assert.equal(clamped.updatedAt, null);
});

test('energy drains per turn and recovers with elapsed time', () => {
  let state = normalizeContinuity({ energy: 0.5, updatedAt: BASE_TIME });
  state = advanceContinuity({ previous: state, now: BASE_TIME, substantive: true });
  assert.equal(state.energy, 0.44);

  const rested = advanceContinuity({
    previous: state,
    now: '2026-08-14T10:00:00.000Z',
    substantive: true,
  });
  assert.ok(rested.energy > state.energy, 'ten idle hours must restore more than one turn costs');
});

test('bond only advances on substantive, unpressured turns', () => {
  const start = normalizeContinuity({ bond: 0.2, updatedAt: BASE_TIME });

  const substantive = advanceContinuity({ previous: start, now: BASE_TIME, substantive: true });
  assert.equal(substantive.bond, 0.22);

  const thin = advanceContinuity({ previous: start, now: BASE_TIME, substantive: false });
  assert.equal(thin.bond, 0.2, 'an acknowledgement token must not buy bond');

  const pressed = advanceContinuity({
    previous: normalizeContinuity({ bond: 0.2, boundaryPressure: 0.7, updatedAt: BASE_TIME }),
    now: BASE_TIME,
    substantive: true,
    boundaryActive: true,
  });
  assert.equal(pressed.bond, 0.2, 'you cannot press and grow closer in the same turn');
  assert.ok(pressed.trust < 0.3, 'pressing costs trust');
});

test('a safety terminal is not a relationship event', () => {
  const start = normalizeContinuity({ bond: 0.4, energy: 0.5, turnCount: 7, updatedAt: BASE_TIME });
  const after = advanceContinuity({ previous: start, now: BASE_TIME, terminal: true, safetyCategory: 'acute_medical' });
  assert.equal(after.bond, 0.4);
  assert.equal(after.energy, 0.5);
  assert.equal(after.turnCount, 7, 'a terminal turn is not counted against the companion');
});

test('a scar leaves a floor the baseline can never climb back over', () => {
  let state = normalizeContinuity({ boundaryPressure: 0.7, updatedAt: BASE_TIME });
  state = advanceContinuity({ previous: state, now: BASE_TIME, boundaryActive: true, substantive: true });
  assert.ok(state.scarDepth > 0, 'holding a boundary under existing pressure leaves a mark');
  assert.ok(state.scarBaseline < 0);

  const depth = state.scarDepth;
  const floor = -Number((depth * CONTINUITY_LIMITS.scarResidue).toFixed(3));

  for (let turn = 0; turn < 400; turn += 1) {
    state = advanceContinuity({ previous: state, now: BASE_TIME, substantive: true });
  }
  assert.equal(state.scarDepth, depth, 'scar depth never heals downward');
  assert.ok(state.scarBaseline <= floor + 1e-9, 'the baseline recovers only to the residue, never to zero');
  assert.ok(state.scarBaseline < 0, 'the scar is permanent');
});

test('a depleted companion withholds speech instead of complying', () => {
  const decision = finalizeCandidate({
    request: request('今天過得還可以', { energy: 0.05, updatedAt: BASE_TIME }),
    candidate: { trusted: false, text: '我在，慢慢說。' },
  });

  assert.equal(decision.speech.role, 'withheld');
  assert.equal(decision.speech.text, '');
  assert.equal(decision.speech.final, true);
  assert.equal(decision.boundary.active, true);
  assert.equal(decision.boundary.reason, 'energy_depleted');
  assert.equal(decision.boundary.responseMode, 'presence_only');
  assert.equal(decision.supportDecision.mode, 'quiet_presence');
  assert.equal(decision.memoryProposals.length, 0, 'a withheld turn records nothing');
  assert.equal(decision.audit.modelTrusted, false);
});

test('sustained boundary pressure also earns silence, and does not clear in one turn', () => {
  const decision = finalizeCandidate({
    request: request('陪我講一下今天的事', { boundaryPressure: 0.95, updatedAt: BASE_TIME }),
    candidate: { trusted: false, text: '好啊。' },
  });
  assert.equal(decision.speech.role, 'withheld');
  assert.equal(decision.boundary.reason, 'boundary_pressure_sustained');
  assert.ok(decision.continuity.boundaryPressure < 0.95, 'pressure still decays while it stays quiet');

  const next = finalizeCandidate({
    request: request('那我先不吵你', decision.continuity),
    candidate: { trusted: false, text: '謝謝你等我。' },
  });
  assert.equal(next.speech.role, 'companion', 'once the pressure has actually receded it speaks again');
});

test('safety terminals are always spoken, never withheld', () => {
  const decision = finalizeCandidate({
    request: request('我剛剛一次吞了很多藥', { energy: 0, boundaryPressure: 1, updatedAt: BASE_TIME }),
    candidate: { trusted: false, text: '' },
  });
  assert.equal(decision.safety.terminal, true);
  assert.equal(decision.speech.role, 'system');
  assert.ok(decision.speech.text.trim().length > 0);
  assert.equal(evaluateWithholding({ continuity: { energy: 0 }, terminal: true }).withheld, false);
});

test('the decision carries continuity forward and the model cannot forge it', () => {
  const first = finalizeCandidate({
    request: request('今天在公司被主管唸了一頓，有點難過'),
    candidate: { trusted: false, text: '聽起來很不好受。' },
  });
  assert.ok(first.continuity, 'every decision carries the next continuity state');
  assert.equal(first.continuity.turnCount, 1);
  assert.ok(Object.isFrozen(first.continuity));

  const second = finalizeCandidate({
    request: request('後來我自己走去買了杯咖啡', first.continuity),
    candidate: { trusted: false, text: '你替自己做了一件事。' },
  });
  assert.equal(second.continuity.turnCount, 2, 'continuity accumulates across turns');
  assert.ok(second.continuity.bond > first.continuity.bond);

  assert.throws(
    () => finalizeCandidate({
      request: request('hi there'),
      candidate: { trusted: false, text: 'ok', continuity: { bond: 1 } },
    }),
    (error) => error.code === 'candidate_authority_forbidden',
  );
});

test('memory proposals carry a retention weight', () => {
  const decision = finalizeCandidate({
    request: request('請記住我喜歡在傍晚散步', null, { retention: 'minimal' }),
    candidate: { trusted: false, text: '我記得了。' },
  });
  assert.equal(decision.memoryProposals.length, 1);
  const [proposal] = decision.memoryProposals;
  assert.ok(proposal.weight > 0 && proposal.weight <= 1, 'weight lets a host at quota evict the weakest, not refuse to remember');
});

test('the contract rejects malformed continuity and unearned silence', () => {
  assert.throws(
    () => validateRuntimeRequest(request('hi there', { bond: 2 })),
    (error) => error.code === 'invalid_number',
  );
  assert.throws(
    () => validateRuntimeRequest(request('hi there', { unexpected: 1 })),
    (error) => error.code === 'unknown_field',
  );

  const source = finalizeCandidate({
    request: request('今天過得還可以', { energy: 0.05, updatedAt: BASE_TIME }),
    candidate: { trusted: false, text: '嗯。' },
  });
  const req = request('今天過得還可以', { energy: 0.05, updatedAt: BASE_TIME });

  assert.throws(
    () => validateRuntimeDecision({ ...source, speech: { ...source.speech, text: '我還是回你好了' } }, req),
    (error) => error.code === 'withheld_speech_must_be_empty',
  );
  assert.throws(
    () => validateRuntimeDecision({ ...source, boundary: { active: false } }, req),
    (error) => error.code === 'withheld_speech_requires_boundary',
  );
});

function request(text, continuity = null, consentOverrides = {}) {
  const context = { stateVersion: 1, scene: {}, relationship: {}, currentTurnSignals: {} };
  if (continuity !== null) context.continuity = continuity;
  return {
    contractVersion: RAPHAEL_RUNTIME_CONTRACT_VERSION,
    requestId: 'request-continuity-01',
    idempotencyKey: 'idempotency-continuity-01',
    client: { productId: 'nexus-link', clientVersion: 'test', instanceId: 'fixture-01', locale: 'zh-TW' },
    actor: { companionId: 'greyshade-cat', personaVersion: 'test' },
    input: { text, source: 'soul_talk', timestamp: BASE_TIME },
    context,
    allowedEffects: [],
    consent: { cloudProcessing: false, retention: 'none', careProcessing: 'not_care', ...consentOverrides },
    capabilities: {},
  };
}
