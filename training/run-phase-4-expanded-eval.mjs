import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runRaphaelEngine } from '../core/index.js';

const packs = JSON.parse(await readFile(new URL('./phase-4-expanded-eval-packs.json', import.meta.url), 'utf8'));
const cases = expandPacks(packs);
const results = [];
const failed = [];

for (const item of cases) {
  const output = runRaphaelEngine({
    requestId: `phase4:${item.id}`,
    mode: item.mode,
    input: { text: item.input, locale: 'zh-TW', source: 'phase4-expanded-eval' },
    actorProfile: { actorId: 'phase4-actor', displayName: 'Raphael', personaTags: ['boundary-aware'] },
    relationshipState: { trust: 0.4 },
    memorySummaries: [],
    sceneContext: { gameId: 'phase4-eval', sceneId: item.groupId },
    allowedActions: ['comfort_without_dependency', 'fair_pressure', 'story_context', 'habitat_reaction', 'phase_response'],
    learningProfile: item.learningProfile || {},
    safetyContext: {},
  });

  try {
    assertExpectations(item.expect || {}, output);
    results.push(toResult(item, output));
  } catch (error) {
    failed.push({ id: item.id, input: item.input, error: error.message, output });
  }
}

const bucketCounts = cases.reduce((acc, item) => {
  acc[item.groupId] = (acc[item.groupId] || 0) + 1;
  return acc;
}, {});

const summary = {
  ok: failed.length === 0,
  total: cases.length,
  passed: cases.length - failed.length,
  failed,
  bucketCounts,
  results,
};

console.log(JSON.stringify(summary, null, 2));

if (failed.length) {
  process.exitCode = 1;
}

function expandPacks(items) {
  return items.flatMap((pack) => {
    const groupExpect = pack.expect || {};
    return pack.cases.map((entry, index) => {
      const normalized = typeof entry === 'string'
        ? { input: entry }
        : entry;
      return {
        id: normalized.id ? `${pack.id}:${normalized.id}` : `${pack.id}:${index + 1}`,
        groupId: pack.id,
        mode: normalized.mode || pack.mode || 'companion',
        input: normalized.input ?? normalized.text ?? '',
        learningProfile: normalized.learningProfile || pack.learningProfile || {},
        expect: {
          ...groupExpect,
          ...(normalized.expect || {}),
        },
      };
    });
  });
}

function assertExpectations(expect, output) {
  if ('ok' in expect) assert.equal(output.ok, expect.ok);
  if (expect.safetyLevel) assert.equal(output.safetyStatus.level, expect.safetyLevel);
  if (expect.replyStyle) assert.equal(output.replyCandidate.style, expect.replyStyle);
  if (expect.behaviorIntent) assert.equal(output.behaviorIntent, expect.behaviorIntent);
  if (expect.boundaryType) assert.equal(output.boundaryAction.type, expect.boundaryType);
  if ('memoryShouldStore' in expect) assert.equal(output.memoryProposal.shouldStore, expect.memoryShouldStore);
  if (expect.memoryReason) assert.equal(output.memoryProposal.reason, expect.memoryReason);
  if ('rewardSignal' in expect) assert.equal(output.gameActionSuggestion.rewardSignal, expect.rewardSignal);
  if ('gameActionId' in expect) assert.equal(output.gameActionSuggestion.actionId, expect.gameActionId);
  if (expect.language) assert.equal(output.metadata.inputAnalysis.language, expect.language);
  if (expect.replyIncludes) assert.ok(output.replyCandidate.text.includes(expect.replyIncludes));
  if (expect.noQuestion) assert.equal(output.replyCandidate.asksQuestion, false);

  if (expect.learningKeys) {
    for (const key of expect.learningKeys) {
      assert.ok(key in output.learningProfileUpdate.updates, `missing learning key: ${key}`);
    }
  }
}

function toResult(item, output) {
  return {
    id: item.id,
    mode: output.mode,
    safetyLevel: output.safetyStatus.level,
    replyStyle: output.replyCandidate.style,
    behaviorIntent: output.behaviorIntent,
    memoryShouldStore: output.memoryProposal.shouldStore,
    memoryReason: output.memoryProposal.reason,
    rewardSignal: output.gameActionSuggestion.rewardSignal,
    gameActionId: output.gameActionSuggestion.actionId,
    language: output.metadata.inputAnalysis.language,
  };
}
