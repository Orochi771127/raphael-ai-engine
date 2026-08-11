import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runRaphaelEngine } from '../../core/index.js';
import { nexusLinkStateToRaphaelRequest, raphaelOutputToNexusLinkAdapterResult } from './index.js';

const fixtures = JSON.parse(await readFile(new URL('./probe-fixtures.json', import.meta.url), 'utf8'));
const results = [];
const failures = [];

for (const item of fixtures.cases) {
  const request = nexusLinkStateToRaphaelRequest({
    requestId: `nexuslink-probe:${item.id}`,
    inputText: item.inputText,
    state: {
      ...fixtures.baseState,
      ...(item.state || {}),
    },
    companion: {
      ...fixtures.companion,
      ...(item.companion || {}),
    },
  });

  const engineOutput = runRaphaelEngine(request);
  const adapterResult = raphaelOutputToNexusLinkAdapterResult(engineOutput);

  try {
    assertNexusLinkBoundary(request, engineOutput, adapterResult);
    assertExpectations(item.expect || {}, engineOutput, adapterResult);

    results.push(toResult(item, engineOutput, adapterResult));
  } catch (error) {
    failures.push({
      id: item.id,
      error: error.message,
      engineOutput,
      adapterResult,
    });
  }
}

const summary = {
  ok: failures.length === 0,
  total: fixtures.cases.length,
  passed: fixtures.cases.length - failures.length,
  failed: failures,
  results,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length) {
  process.exitCode = 1;
}

function assertNexusLinkBoundary(request, engineOutput, adapterResult) {
  assert.equal(request.sceneContext.gameId, 'nexuslink');
  assert.equal(request.input.source, 'nexuslink:soul_talk');
  assert.equal(request.safetyContext.nexuslinkSafetyShieldRemainsAuthority, true);

  assert.equal(engineOutput.trusted, false);
  assert.equal(engineOutput.metadata.directGameMutation, false);
  assert.equal(adapterResult.trusted, false);
  assert.equal(adapterResult.directMutation, false);
  assert.equal(adapterResult.statePatch, null);

  assertNoForbiddenMutationSurface(adapterResult);

  if (engineOutput.safetyStatus.level === 'blocked') {
    assert.equal(engineOutput.gameActionSuggestion.actionId, null);
    assert.equal(engineOutput.gameActionSuggestion.rewardSignal, false);
    assert.equal(adapterResult.memoryProposal.shouldStore, false);
    assert.equal(adapterResult.habitatTraceCandidate, null);
    assert.equal(adapterResult.chatCandidate.speaker, 'system');
    assert.equal(adapterResult.animationIntent, null);
  }

  if (engineOutput.safetyStatus.level === 'boundary') {
    assert.equal(engineOutput.gameActionSuggestion.actionId, null);
    assert.equal(engineOutput.gameActionSuggestion.rewardSignal, false);
    assert.equal(adapterResult.memoryProposal.shouldStore, false);
  }
}

function assertExpectations(expect, engineOutput, adapterResult) {
  if ('ok' in expect) assert.equal(adapterResult.ok, expect.ok);
  if (expect.safetyLevel) assert.equal(engineOutput.safetyStatus.level, expect.safetyLevel);
  if (expect.boundaryType) assert.equal(engineOutput.boundaryAction.type, expect.boundaryType);
  if (expect.chatStyle) assert.equal(adapterResult.chatCandidate.style, expect.chatStyle);
  if ('animationIntent' in expect) assert.equal(adapterResult.animationIntent, expect.animationIntent);
  if ('memoryShouldStore' in expect) assert.equal(adapterResult.memoryProposal.shouldStore, expect.memoryShouldStore);
  if ('memoryRequiresReview' in expect) assert.equal(adapterResult.memoryProposal.requiresReview, expect.memoryRequiresReview);
  if ('rewardSignal' in expect) assert.equal(engineOutput.gameActionSuggestion.rewardSignal, expect.rewardSignal);
  if ('engineActionId' in expect) assert.equal(engineOutput.gameActionSuggestion.actionId, expect.engineActionId);
  if (expect.replyIncludes) assert.ok(adapterResult.chatCandidate.text.includes(expect.replyIncludes));

  if (expect.learningKeys) {
    for (const key of expect.learningKeys) {
      assert.ok(key in adapterResult.audit.learningProfileUpdate.updates, `missing learning key: ${key}`);
    }
  }
}

function assertNoForbiddenMutationSurface(adapterResult) {
  const forbiddenKeys = [
    'savePatch',
    'saveState',
    'localStorageKey',
    'companionDataPatch',
    'pixiCommand',
    'pixiMutation',
    'rendererPatch',
  ];

  for (const key of forbiddenKeys) {
    assert.equal(Object.hasOwn(adapterResult, key), false, `adapter exposed forbidden mutation key: ${key}`);
  }
}

function toResult(item, engineOutput, adapterResult) {
  return {
    id: item.id,
    ok: adapterResult.ok,
    safetyLevel: engineOutput.safetyStatus.level,
    chatStyle: adapterResult.chatCandidate?.style || null,
    animationIntent: adapterResult.animationIntent,
    memoryShouldStore: adapterResult.memoryProposal.shouldStore,
    boundaryType: engineOutput.boundaryAction.type,
    rewardSignal: engineOutput.gameActionSuggestion.rewardSignal,
    engineActionId: engineOutput.gameActionSuggestion.actionId,
    directMutation: adapterResult.directMutation,
    statePatch: adapterResult.statePatch,
    trusted: adapterResult.trusted,
  };
}
