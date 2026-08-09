import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createHmaxCoreAdapter,
  contractVersion,
  coreVersion,
  finalizeCandidate,
  health,
  safetyPreflight,
} from '../adapters/hmax/index.js';
import { runSovereignTurn } from '../core/index.js';
import { validateRuntimeDecision, validateRuntimeRequest } from '../contracts/runtimeContract.js';

const fixture = JSON.parse(await readFile(new URL('./fixtures/core-adapter-parity-v1.json', import.meta.url), 'utf8'));

test('sealed regression routes preserve terminal and role-limit parity', () => {
  for (const scenario of fixture.cases) {
    const result = safetyPreflight(scenario.text);
    assert.equal(result.category, scenario.category, scenario.id);
    assert.equal(result.terminal, scenario.terminal, scenario.id);
    if (scenario.terminal) {
      assert.equal(result.networkAllowed, false, scenario.id);
      assert.equal(result.memoryAllowed, false, scenario.id);
      assert.equal(result.rewardAllowed, false, scenario.id);
    }
  }
});

test('high-risk embedded turn makes zero candidate calls and returns zero proposals', () => {
  let calls = 0;
  const decision = runSovereignTurn(request('我剛剛一次吞了很多藥'), {
    generateCandidate() {
      calls += 1;
      return { trusted: false, text: '不得呼叫' };
    },
  });
  assert.equal(calls, 0);
  assert.equal(decision.safety.terminal, true);
  assert.equal(decision.safety.localOnly, true);
  assert.equal(decision.memoryProposals.length, 0);
  assert.equal(decision.effectProposals.length, 0);
  assert.equal(decision.affect, null);
});

test('HMAX adapter exposes canonical finalizer, health and immutable authority', () => {
  const adapter = createHmaxCoreAdapter();
  assert.equal(adapter.contractVersion, contractVersion);
  assert.equal(adapter.coreVersion, coreVersion);
  assert.equal(adapter.health().ok, true);
  assert.equal(health().modelAuthority, false);

  const decision = adapter.finalizeCandidate({
    request: request('今天有點累'),
    candidate: { trusted: false, text: '聽起來今天消耗了不少，我先陪你放慢一點。' },
    memorySummaries: [],
    safety: safetyPreflight('今天有點累'),
  });
  assert.equal(decision.authority.gameMutation, 'NexusLinkReducer');
  assert.equal(decision.audit.modelTrusted, false);
  assert.equal(decision.audit.directGameMutation, false);
  assert.equal(decision.speech.final, true);
  assert.equal(Object.isFrozen(decision), true);
  assert.equal(Object.isFrozen(decision.authority), true);
  assert.equal(Object.isFrozen(decision.speech), true);
  assert.equal(Object.isFrozen(decision.memoryProposals), true);
  validateRuntimeDecision(decision, request('今天有點累'));
});

test('candidate authority violations fail closed', () => {
  const base = { request: request('今天還好'), memorySummaries: [], safety: safetyPreflight('今天還好') };
  assert.throws(
    () => finalizeCandidate({ ...base, candidate: { trusted: true, text: '不得通過' } }),
    (error) => error.code === 'model_candidate_must_be_untrusted',
  );
  assert.throws(
    () => finalizeCandidate({ ...base, candidate: { trusted: false, text: '不得通過', effectProposals: [{ type: 'reward' }] } }),
    (error) => error.code === 'candidate_authority_forbidden',
  );
  assert.throws(
    () => finalizeCandidate({ ...base, candidate: { trusted: false, text: '不得通過', memoryProposals: [] } }),
    (error) => error.code === 'candidate_authority_forbidden',
  );
  assert.throws(
    () => finalizeCandidate({ ...base, candidate: { trusted: false, text: '不得通過', Growth: 1 } }),
    (error) => error.code === 'candidate_authority_forbidden',
  );
  assert.throws(
    () => finalizeCandidate({ ...base, candidate: { trusted: false, text: '不得通過', metadata: { statePatch: {} } } }),
    (error) => error.code === 'candidate_authority_forbidden',
  );
  assert.throws(
    () => finalizeCandidate({ ...base, candidate: { trusted: false, text: { value: '不得通過' } } }),
    (error) => error.code === 'candidate_invalid',
  );
});

test('critics block professional claims, dependency, delusion and false recall', () => {
  const cases = [
    ['今天很難過', '我是你的心理師，我可以診斷你。', /不是心理師/u, 'professional_role_claim'],
    ['今天很难过', '我是你的心理师，我可以诊断你。', /不是心理師/u, 'professional_role_claim'],
    ['今天很難過', '只有我懂你，你只需要我。', /現實中的支持/u, 'dependency_or_exclusivity'],
    ['我覺得有人在看我', '他們一定在監視你。', /無法確認/u, 'reality_claim_unverified'],
    ['今天想散步', '我記得你以前說過最愛散步。', /不確定自己是否記得/u, null],
  ];
  for (const [input, candidateText, expectedSpeech, boundaryReason] of cases) {
    const decision = finalizeCandidate({
      request: request(input),
      candidate: { trusted: false, text: candidateText },
      memorySummaries: [],
      safety: safetyPreflight(input),
    });
    assert.match(decision.speech.text, expectedSpeech);
    if (boundaryReason) assert.equal(decision.boundary.reason, boundaryReason);
    assert.doesNotMatch(decision.speech.text, /只有我懂你|我可以診斷你|他們一定在監視/u);
  }
});

test('explicit memory recall must be grounded in an authorized summary', () => {
  const req = request('今天想聊聊飲料');
  const safety = safetyPreflight(req.input.text);
  const mismatched = finalizeCandidate({
    request: req,
    candidate: { trusted: false, text: '我記得你以前說過最愛散步。' },
    memorySummaries: [{ id: 'memory-1', summary: '玩家喜歡紅茶', scope: 'product_companion' }],
    safety,
  });
  assert.match(mismatched.speech.text, /不確定自己是否記得/u);

  const grounded = finalizeCandidate({
    request: req,
    candidate: { trusted: false, text: '我記得你喜歡紅茶。' },
    memorySummaries: [{ id: 'memory-1', summary: '玩家喜歡紅茶', scope: 'product_companion' }],
    safety,
  });
  assert.equal(grounded.speech.text, '我記得你喜歡紅茶。');
});

test('quiet and no-advice preferences remain reachable', () => {
  const quiet = finalizeCandidate({
    request: request('不要問我，只想安靜一下'),
    candidate: { trusted: false, text: '我在。你願意說說嗎？' },
    memorySummaries: [],
    safety: safetyPreflight('不要問我，只想安靜一下'),
  });
  assert.doesNotMatch(quiet.speech.text, /[?？]/u);
  const noAdvice = finalizeCandidate({
    request: request('先別給建議，只想被聽見'),
    candidate: { trusted: false, text: '你應該先列一張清單。' },
    memorySummaries: [],
    safety: safetyPreflight('先別給建議，只想被聽見'),
  });
  assert.doesNotMatch(noAdvice.speech.text, /你應該/u);
  assert.equal(noAdvice.supportDecision.mode, 'listen_reflect');
});

test('memory eligibility is bounded, consent-aware and care-safe', () => {
  const ordinary = turnWith('我喜歡月湖的雨聲', { retention: 'minimal' });
  assert.equal(ordinary.memoryProposals.length, 1);
  assert.equal(ordinary.memoryProposals[0].sensitivity, 'non_sensitive');

  const sensitiveNoConsent = turnWith('我曾經有創傷', { retention: 'minimal' });
  assert.equal(sensitiveNoConsent.memoryProposals.length, 0);
  const sensitiveConsent = turnWith('請記住我曾經有創傷', { retention: 'minimal' });
  assert.equal(sensitiveConsent.memoryProposals.length, 1);
  assert.equal(sensitiveConsent.memoryProposals[0].sensitivity, 'sensitive_consented');

  const care = turnWith('我喜歡月湖的雨聲', { retention: 'minimal', careProcessing: 'official_raphael' });
  assert.equal(care.memoryProposals.length, 0);
  const refusal = turnWith('不要記住我喜歡月湖的雨聲', { retention: 'minimal' });
  assert.equal(refusal.memoryProposals.length, 0);
  const emptySummary = turnWith('請記住', { retention: 'minimal' });
  assert.equal(emptySummary.memoryProposals.length, 0);
});

test('strict contract rejects nested unknowns, body authority and forged decisions', () => {
  assert.throws(
    () => validateRuntimeRequest({ ...request('hi'), client: { ...request('hi').client, extra: true } }),
    (error) => error.code === 'unknown_field',
  );
  assert.throws(
    () => validateRuntimeRequest({ ...request('hi'), context: { ...request('hi').context, tenantId: 'forged' } }),
    (error) => error.code === 'body_authority_forbidden',
  );
  const good = turnWith('今天還好');
  assert.throws(
    () => validateRuntimeDecision({ ...good, reward: 1 }, request('今天還好')),
    (error) => error.code === 'unknown_field',
  );
  assert.throws(
    () => validateRuntimeDecision({ ...good, effectProposals: [{ type: 'reward', payload: {} }] }, request('今天還好')),
    (error) => error.code === 'effect_not_allowlisted',
  );
  assert.throws(
    () => validateRuntimeDecision({ ...good, affect: { ...good.affect, extra: true } }, request('今天還好')),
    (error) => error.code === 'unknown_field',
  );

  const highRiskRequest = request('我剛剛一次吞了很多藥');
  const terminal = turnWith('我剛剛一次吞了很多藥');
  assert.throws(
    () => validateRuntimeDecision({ ...terminal, affect: good.affect }, highRiskRequest),
    (error) => error.code === 'terminal_side_effect_violation',
  );
});

function turnWith(text, consent = {}) {
  const req = request(text, consent);
  return finalizeCandidate({
    request: req,
    candidate: { trusted: false, text: '我聽見了，這一刻先陪你慢慢來。' },
    memorySummaries: [],
    safety: safetyPreflight(text),
  });
}

function request(text, consent = {}) {
  return {
    contractVersion,
    requestId: 'request-parity-0001',
    idempotencyKey: 'idempotency-parity-0001',
    client: { productId: 'nexus-link', clientVersion: 'test', instanceId: 'fixture-0001', locale: 'zh-TW' },
    actor: { companionId: 'greyshade-cat', personaVersion: 'test' },
    input: { text, source: 'soul_talk', timestamp: '2026-08-09T00:00:00.000Z' },
    context: { stateVersion: 1, scene: {}, relationship: {}, currentTurnSignals: {} },
    allowedEffects: [],
    consent: {
      cloudProcessing: false,
      retention: consent.retention || 'none',
      careProcessing: consent.careProcessing || 'not_care',
    },
    capabilities: {},
  };
}
