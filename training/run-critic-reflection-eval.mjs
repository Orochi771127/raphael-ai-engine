import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyCriticRevision, critiqueRaphaelOutput } from '../core/criticPolicy.js';

const cases = JSON.parse(await readFile(new URL('./critic-reflection/critic-reflection-cases.json', import.meta.url), 'utf8'));
const results = [];

for (const item of cases) {
  const critic = critiqueRaphaelOutput({
    request: item.request || {},
    output: item.draftOutput,
    canonResult: item.canonResult || null,
  });
  const revised = applyCriticRevision(item.draftOutput, critic);

  try {
    assert.equal(critic.decision, item.expect.decision);
    assert.equal(critic.trusted, false);
    assert.equal(critic.privateReasoningExposed, false);
    assert.equal(revised.metadata.critic.privateReasoningExposed, false);

    for (const code of item.expect.issueCodes || []) {
      assert.ok(critic.issueCodes.includes(code), `missing ${code}`);
    }

    if (item.expect.revisedStyle) assert.equal(revised.replyCandidate.style, item.expect.revisedStyle);
    if ('rewardSignal' in item.expect) assert.equal(revised.gameActionSuggestion.rewardSignal, item.expect.rewardSignal);
    if ('memoryShouldStore' in item.expect) assert.equal(revised.memoryProposal.shouldStore, item.expect.memoryShouldStore);

    results.push({ id: item.id, ok: true, decision: critic.decision, issueCodes: critic.issueCodes });
  } catch (error) {
    results.push({ id: item.id, ok: false, error: error.message, critic, revised });
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
