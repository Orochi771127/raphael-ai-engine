import assert from 'node:assert/strict';
import worker, { runLegacyGatewayContract } from '../gateway/worker-skeleton.js';

{
  const response = runLegacyGatewayContract({
    requestId: 'legacy:advisor',
    companionId: 'greyshade-cat',
    tool: 'ask_model_advisor',
    payload: { inputSummary: '嗨 Raphael' },
    context: { sceneId: 'moon_lake_camp' },
  });

  assert.equal(response.ok, true);
  assert.equal(response.trusted, false);
  assert.equal(response.advisor.trusted, false);
  assert.equal(response.metadata.authorityReport.finalAuthority, 'RaphaelCore');
  assert.equal(response.metadata.authorityReport.advisorOverrideApplied, false);
  assert.equal(response.metadata.frontendApiKeyRequired, false);
  assert.ok(Array.isArray(response.advisor.replyCandidates));
}

{
  const response = runLegacyGatewayContract({
    requestId: 'legacy:disabled',
    companionId: 'greyshade-cat',
    tool: 'web_search_public_info',
    payload: { inputSummary: '請幫我查公開網路' },
    context: {},
  });

  assert.equal(response.ok, false);
  assert.equal(response.trusted, false);
  assert.equal(response.error.code, 'DISABLED_GATEWAY_TOOL');
  assert.equal(response.metadata.authorityReport.finalAuthority, 'RaphaelCore');
}

{
  const request = new Request('http://127.0.0.1:8787/v1/gateway', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      requestId: 'legacy:http',
      companionId: 'greyshade-cat',
      tool: 'ask_model_advisor',
      payload: { inputSummary: '今天上班壓力很大' },
      context: { sceneId: 'moon_lake_camp' },
    }),
  });
  const response = await worker.fetch(request);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.trusted, false);
  assert.equal(body.metadata.authorityReport.finalAuthority, 'RaphaelCore');
}

console.log(JSON.stringify({
  ok: true,
  suite: 'gateway legacy contract',
  cases: 3,
}, null, 2));
