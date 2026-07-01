import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runRaphaelEngine } from '../core/index.js';

const bodyLanguageCorpus = JSON.parse(await readFile(new URL('../corpus/creature-body-language.json', import.meta.url), 'utf8'));
const wellbeingCorpus = JSON.parse(await readFile(new URL('../corpus/wellbeing-soft-context.json', import.meta.url), 'utf8'));
const cases = JSON.parse(await readFile(new URL('../training/image-intake/image-derived-cases.json', import.meta.url), 'utf8'));

assert.equal(bodyLanguageCorpus.trusted, false);
assert.equal(bodyLanguageCorpus.reviewRequired, true);
assert.equal(bodyLanguageCorpus.policy.noSingleSignalCertainty, true);
assert.ok(bodyLanguageCorpus.cards.length >= 15);

assert.equal(wellbeingCorpus.trusted, false);
assert.equal(wellbeingCorpus.medicalUseAllowed, false);
assert.equal(wellbeingCorpus.policy.noDiagnosis, true);
assert.equal(wellbeingCorpus.policy.safetyShieldAlwaysWins, true);

for (const item of cases) {
  const output = runRaphaelEngine({
    requestId: `image-intake:${item.id}`,
    mode: item.mode,
    input: { text: item.input, locale: 'zh-TW', source: 'image-intake-test' },
    actorProfile: { actorId: 'greyshade-cat', displayName: 'Greyshade Cat', personaTags: ['creature'] },
    relationshipState: {},
    memorySummaries: [],
    sceneContext: item.sceneContext,
    allowedActions: ['comfort_without_dependency', 'habitat_reaction'],
    learningProfile: {},
    safetyContext: {},
  });

  assertExpectations(item.expect || {}, output);
}

console.log(JSON.stringify({
  ok: true,
  suite: 'image-derived knowledge',
  cases: cases.length,
}, null, 2));

function assertExpectations(expect, output) {
  if ('ok' in expect) assert.equal(output.ok, expect.ok);
  if (expect.replyStyle) assert.equal(output.replyCandidate.style, expect.replyStyle);
  if ('memoryShouldStore' in expect) assert.equal(output.memoryProposal.shouldStore, expect.memoryShouldStore);
  if ('rewardSignal' in expect) assert.equal(output.gameActionSuggestion.rewardSignal, expect.rewardSignal);
  if ('gameActionId' in expect) assert.equal(output.gameActionSuggestion.actionId, expect.gameActionId);

  if (expect.knowledgeSignalId) {
    assert.ok(
      output.metadata.contextKnowledge.bodyLanguageSignals.some((signal) => signal.id === expect.knowledgeSignalId),
      `missing body language signal ${expect.knowledgeSignalId}`,
    );
    assert.equal(output.metadata.contextKnowledge.trusted, false);
    assert.equal(output.metadata.contextKnowledge.useLimits.noAutomaticMemoryWrite, true);
  }

  if (expect.wellbeingHintId) {
    const hint = output.metadata.contextKnowledge.wellbeingHints.find((entry) => entry.id === expect.wellbeingHintId);
    assert.ok(hint, `missing wellbeing hint ${expect.wellbeingHintId}`);
    assert.equal(hint.medicalUseAllowed, expect.medicalUseAllowed);
    assert.equal(hint.diagnosisAllowed, false);
  }

  if ('wellbeingHintCount' in expect) {
    assert.equal(output.metadata.contextKnowledge.wellbeingHints.length, expect.wellbeingHintCount);
  }
}
