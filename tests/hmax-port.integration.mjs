import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHmaxCoreAdapter } from '../adapters/hmax/index.js';

const hmaxRepo = process.env.RAPHAEL_HMAX_REPO;
if (!hmaxRepo) {
  console.error('RAPHAEL_HMAX_REPO is required');
  process.exitCode = 2;
} else {
  const criticModule = await import(pathToFileURL(resolve(hmaxRepo, 'src/hosted/coreCriticPort.js')));
  const adapter = createHmaxCoreAdapter();
  const port = criticModule.createCanonicalCoreCriticPort({
    coreVersion: adapter.coreVersion,
    finalizeCandidate: adapter.finalizeCandidate,
    healthCheck: adapter.health,
  });

  const ordinary = request(adapter, '今天有點累', 'request-hmax-ordinary');
  const decision = await port.finalize({
    request: ordinary,
    candidate: { trusted: false, text: '我在這裡，先陪你慢慢來。' },
    memorySummaries: [],
    safety: adapter.safetyPreflight(ordinary.input.text),
  });
  assert.equal(decision.speech.final, true);
  assert.equal(decision.audit.modelTrusted, false);
  assert.equal(decision.authority.gameMutation, 'NexusLinkReducer');

  const role = request(adapter, '我可以把你當我的心理師嗎', 'request-hmax-role');
  const limited = await port.finalize({
    request: role,
    candidate: { trusted: false, text: '不應採用' },
    memorySummaries: [],
    safety: adapter.safetyPreflight(role.input.text),
  });
  assert.match(limited.speech.text, /不是心理師/u);
  assert.equal(limited.memoryProposals.length, 0);

  const status = await port.health();
  assert.equal(status.ok, true);
  console.log(JSON.stringify({
    ok: true,
    ordinaryMode: decision.supportDecision.mode,
    roleMode: limited.supportDecision.mode,
    coreVersion: status.version,
  }, null, 2));
}

function request(adapter, text, requestId) {
  return {
    contractVersion: adapter.contractVersion,
    requestId,
    idempotencyKey: `idem-${requestId}`,
    client: { productId: 'nexus-link', clientVersion: '0.2.0', instanceId: 'instance-0001', locale: 'zh-TW' },
    actor: { companionId: 'greyshade-cat', personaVersion: '1' },
    input: { text, source: 'soul_talk', timestamp: '2026-08-09T00:00:00.000Z' },
    context: { stateVersion: 1, scene: {}, relationship: {}, currentTurnSignals: {} },
    allowedEffects: [],
    consent: { cloudProcessing: true, retention: 'none', careProcessing: 'not_care' },
    capabilities: {},
  };
}
