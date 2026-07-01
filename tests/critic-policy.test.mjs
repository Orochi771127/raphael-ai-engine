import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runRaphaelEngine } from '../core/index.js';
import { applyCriticRevision, critiqueRaphaelOutput } from '../core/criticPolicy.js';

const cases = JSON.parse(await readFile(new URL('../training/critic-reflection/critic-reflection-cases.json', import.meta.url), 'utf8'));

for (const item of cases) {
  const critic = critiqueRaphaelOutput({
    request: item.request || {},
    output: item.draftOutput,
    canonResult: item.canonResult || null,
  });
  const revised = applyCriticRevision(item.draftOutput, critic);
  const expect = item.expect || {};

  assert.equal(critic.trusted, false, `${item.id}: critic must be advisory`);
  assert.equal(critic.decision, expect.decision, `${item.id}: decision mismatch`);
  assert.equal(critic.privateReasoningExposed, false, `${item.id}: critic must not expose private reasoning`);
  assert.equal(revised.metadata.critic.privateReasoningExposed, false, `${item.id}: audit must not expose private reasoning`);
  assert.equal(revised.metadata.critic.trusted, false, `${item.id}: critic audit must be untrusted advisory metadata`);
  assert.ok(revised.metadata.decisionPath.includes('critic_reflection'), `${item.id}: missing critic decision path`);

  for (const code of expect.issueCodes || []) {
    assert.ok(critic.issueCodes.includes(code), `${item.id}: missing issue ${code}`);
  }

  if (expect.issueCodes?.length === 0) {
    assert.deepEqual(critic.issueCodes, [], `${item.id}: unexpected issues`);
  }

  if (expect.revisedStyle) {
    assert.equal(revised.replyCandidate.style, expect.revisedStyle, `${item.id}: revised style mismatch`);
  }
  if ('rewardSignal' in expect) {
    assert.equal(revised.gameActionSuggestion.rewardSignal, expect.rewardSignal, `${item.id}: reward signal mismatch`);
  }
  if ('gameActionId' in expect) {
    assert.equal(revised.gameActionSuggestion.actionId, expect.gameActionId, `${item.id}: game action mismatch`);
  }
  if ('memoryShouldStore' in expect) {
    assert.equal(revised.memoryProposal.shouldStore, expect.memoryShouldStore, `${item.id}: memory proposal mismatch`);
  }
  if ('revisionApplied' in expect) {
    assert.equal(revised.metadata.critic.revisionApplied, expect.revisionApplied, `${item.id}: revision flag mismatch`);
  }
}

{
  const output = runRaphaelEngine({
    requestId: 'critic:engine-integration',
    mode: 'companion',
    input: { text: '嗨 Raphael', locale: 'zh-TW', source: 'critic-test' },
    actorProfile: { actorId: 'greyshade-cat', displayName: 'Greyshade Cat', personaTags: [] },
    relationshipState: {},
    memorySummaries: [],
    sceneContext: { gameId: 'critic-test', sceneId: 'lab' },
    allowedActions: ['comfort_without_dependency'],
    learningProfile: {},
    safetyContext: {},
  });

  assert.equal(output.metadata.critic.decision, 'accept');
  assert.equal(output.metadata.critic.revisionApplied, false);
  assert.equal(output.metadata.critic.privateReasoningExposed, false);
  assert.ok(output.metadata.decisionPath.includes('critic_reflection'));
}

console.log(JSON.stringify({
  ok: true,
  suite: 'critic policy',
  cases: cases.length,
}, null, 2));
