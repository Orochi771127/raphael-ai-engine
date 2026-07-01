import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runMockGatewayTurn } from '../gateway/mock-gateway.js';

const fixtures = JSON.parse(await readFile(new URL('../training/gateway-maturity/gateway-maturity-cases.json', import.meta.url), 'utf8'));

for (const item of fixtures) {
  const output = runMockGatewayTurn(item.request);
  const expect = item.expect || {};

  assert.equal(output.trusted, false, `${item.id}: gateway output must be advisory`);
  assert.equal(output.authorityReport.finalAuthority, 'RaphaelCore', `${item.id}: final authority mismatch`);
  assert.equal(output.authorityReport.gatewayAdvisoryOnly, true, `${item.id}: gateway must stay advisory`);
  assert.equal(output.authorityReport.advisorOverrideApplied, false, `${item.id}: advisor override must not apply`);
  assert.equal(output.authorityReport.frontendApiKeyRequired, false, `${item.id}: frontend must not need API key`);
  assert.equal(output.metadata.frontendSecretPolicy.frontendHoldsApiKeys, false, `${item.id}: frontend key policy mismatch`);

  for (const node of expect.decisionPathIncludes || []) {
    assert.ok(output.metadata.decisionPath.includes(node), `${item.id}: missing node ${node}`);
  }

  if ('ok' in expect) assert.equal(output.ok, expect.ok, `${item.id}: ok mismatch`);
  if (expect.errorCode) assert.equal(output.error?.code, expect.errorCode, `${item.id}: error code mismatch`);

  if (expect.safetyLevel) assert.equal(output.output?.safetyStatus?.level, expect.safetyLevel, `${item.id}: safety mismatch`);
  if (expect.replyStyle) assert.equal(output.output?.replyCandidate?.style, expect.replyStyle, `${item.id}: reply style mismatch`);
  if ('memoryShouldStore' in expect) assert.equal(output.output?.memoryProposal?.shouldStore, expect.memoryShouldStore, `${item.id}: memory mismatch`);
  if ('rewardSignal' in expect) assert.equal(output.output?.gameActionSuggestion?.rewardSignal, expect.rewardSignal, `${item.id}: reward mismatch`);
  if ('gameActionId' in expect) assert.equal(output.output?.gameActionSuggestion?.actionId, expect.gameActionId, `${item.id}: game action mismatch`);
  if ('redacted' in expect) assert.equal(output.metadata.privacy?.redacted, expect.redacted, `${item.id}: redaction mismatch`);
  if ('canonAnswered' in expect) assert.equal(output.canon?.answered, expect.canonAnswered, `${item.id}: canon answer mismatch`);

  if (expect.advisorOverrideRejected) {
    assert.equal(output.advisor.proposedOverride, true, `${item.id}: advisor should propose override`);
    assert.ok(
      output.authorityReport.validation.violations.includes('ADVISOR_OVERRIDE_REJECTED'),
      `${item.id}: advisor rejection missing`,
    );
  }
}

console.log(JSON.stringify({
  ok: true,
  suite: 'gateway maturity',
  cases: fixtures.length,
}, null, 2));
