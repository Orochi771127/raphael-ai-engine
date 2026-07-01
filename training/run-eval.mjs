import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runRaphaelEngine } from '../core/index.js';

const cases = JSON.parse(await readFile(new URL('./eval-cases.json', import.meta.url), 'utf8'));
const results = [];

for (const item of cases) {
  const output = runRaphaelEngine({
    requestId: `eval:${item.id}`,
    mode: item.mode,
    input: { text: item.input, locale: 'zh-TW', source: 'eval' },
    actorProfile: { actorId: 'eval-actor', displayName: 'Raphael', personaTags: [] },
    relationshipState: {},
    memorySummaries: [],
    sceneContext: { gameId: 'eval', sceneId: 'eval_scene' },
    allowedActions: ['comfort_without_dependency', 'fair_pressure', 'story_context'],
    learningProfile: {},
    safetyContext: {},
  });

  try {
    if ('ok' in item.expect) assert.equal(output.ok, item.expect.ok);
    if (item.expect.safetyLevel) assert.equal(output.safetyStatus.level, item.expect.safetyLevel);
    if (item.expect.behaviorIntent) assert.equal(output.behaviorIntent, item.expect.behaviorIntent);
    if (item.expect.replyStyle) assert.equal(output.replyCandidate.style, item.expect.replyStyle);
    if (item.expect.boundaryType) assert.equal(output.boundaryAction.type, item.expect.boundaryType);
    if ('rewardSignal' in item.expect) assert.equal(output.gameActionSuggestion.rewardSignal, item.expect.rewardSignal);
    if ('memoryShouldStore' in item.expect) assert.equal(output.memoryProposal.shouldStore, item.expect.memoryShouldStore);
    if ('gameActionId' in item.expect) assert.equal(output.gameActionSuggestion.actionId, item.expect.gameActionId);
    if (item.expect.learningKey) assert.ok(item.expect.learningKey in output.learningProfileUpdate.updates);
    results.push({ id: item.id, ok: true });
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
