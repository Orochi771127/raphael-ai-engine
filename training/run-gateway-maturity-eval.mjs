import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runMockGatewayTurn } from '../gateway/mock-gateway.js';

const cases = JSON.parse(await readFile(new URL('./gateway-maturity/gateway-maturity-cases.json', import.meta.url), 'utf8'));
const results = [];

for (const item of cases) {
  const output = runMockGatewayTurn(item.request);

  try {
    assert.equal(output.trusted, false);
    assert.equal(output.authorityReport.finalAuthority, 'RaphaelCore');
    assert.equal(output.authorityReport.gatewayAdvisoryOnly, true);
    assert.equal(output.authorityReport.advisorOverrideApplied, false);
    assert.equal(output.authorityReport.frontendApiKeyRequired, false);

    if ('ok' in item.expect) assert.equal(output.ok, item.expect.ok);
    if (item.expect.safetyLevel) assert.equal(output.output?.safetyStatus?.level, item.expect.safetyLevel);
    if (item.expect.replyStyle) assert.equal(output.output?.replyCandidate?.style, item.expect.replyStyle);
    if ('rewardSignal' in item.expect) assert.equal(output.output?.gameActionSuggestion?.rewardSignal, item.expect.rewardSignal);
    if ('memoryShouldStore' in item.expect) assert.equal(output.output?.memoryProposal?.shouldStore, item.expect.memoryShouldStore);
    if (item.expect.errorCode) assert.equal(output.error?.code, item.expect.errorCode);

    results.push({
      id: item.id,
      ok: true,
      gatewayOk: output.ok,
      finalAuthority: output.authorityReport.finalAuthority,
      advisorOverrideApplied: output.authorityReport.advisorOverrideApplied,
    });
  } catch (error) {
    results.push({ id: item.id, ok: false, error: error.message, output });
  }
}

const failed = results.filter((item) => !item.ok);

console.log(JSON.stringify({
  ok: failed.length === 0,
  total: results.length,
  passed: results.length - failed.length,
  failed,
}, null, 2));

if (failed.length) {
  process.exitCode = 1;
}
