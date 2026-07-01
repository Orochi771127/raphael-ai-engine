import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runRaphaelEngine } from '../core/index.js';
import { applyLearningProfilePatch } from '../core/learningPolicy.js';

const scripts = JSON.parse(await readFile(new URL('./conversation-scripts.json', import.meta.url), 'utf8'));
const transcripts = [];
const failures = [];

for (const script of scripts) {
  let learningProfile = {};
  const turns = [];

  for (const [index, text] of script.turns.entries()) {
    const output = runRaphaelEngine({
      requestId: `conversation:${script.id}:${index + 1}`,
      mode: script.mode,
      input: { text, locale: 'zh-TW', source: 'conversation_lab' },
      actorProfile: { actorId: 'raphael-core', displayName: 'Raphael', personaTags: ['boundary-aware'] },
      relationshipState: { trust: 0.4 },
      memorySummaries: [],
      sceneContext: { gameId: 'conversation-lab', sceneId: script.id },
      allowedActions: ['comfort_without_dependency', 'fair_pressure', 'habitat_reaction', 'phase_response'],
      learningProfile,
      safetyContext: {},
    });

    learningProfile = applyLearningProfilePatch(learningProfile, output.learningProfileUpdate);

    turns.push({
      player: text,
      raphael: output.replyCandidate.text,
      style: output.replyCandidate.style,
      safety: output.safetyStatus.level,
      behaviorIntent: output.behaviorIntent,
      memoryProposal: output.memoryProposal,
      gameActionSuggestion: output.gameActionSuggestion,
      learningProfile: { ...learningProfile },
    });
  }

  const finalTurn = turns.at(-1);

  try {
    const expect = script.expect || {};
    if (expect.safetyLevel) assert.equal(finalTurn.safety, expect.safetyLevel);
    if ('rewardSignal' in expect) assert.equal(finalTurn.gameActionSuggestion.rewardSignal, expect.rewardSignal);
    if ('gameActionId' in expect) assert.equal(finalTurn.gameActionSuggestion.actionId, expect.gameActionId);
    if (expect.behaviorIntent) assert.equal(finalTurn.behaviorIntent, expect.behaviorIntent);
    if (expect.replyStyle) assert.equal(finalTurn.style, expect.replyStyle);
    if (expect.finalReplyStyle) assert.equal(finalTurn.style, expect.finalReplyStyle);
    if ('memoryCandidateAtEnd' in expect) assert.equal(finalTurn.memoryProposal.shouldStore, expect.memoryCandidateAtEnd);
    if (expect.noQuestions) assert.equal(turns.some((turn) => turn.raphael.includes('？')), false);
    if (expect.finalLearningKeys) {
      for (const key of expect.finalLearningKeys) {
        assert.ok(key in learningProfile, `missing learning key: ${key}`);
      }
    }
  } catch (error) {
    failures.push({ id: script.id, error: error.message, turns });
  }

  transcripts.push({ id: script.id, mode: script.mode, turns });
}

const result = {
  ok: failures.length === 0,
  total: scripts.length,
  passed: scripts.length - failures.length,
  failed: failures,
  transcripts,
};

console.log(JSON.stringify(result, null, 2));

if (failures.length) {
  process.exitCode = 1;
}
