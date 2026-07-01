import assert from 'node:assert/strict';
import {
  createLocalLearningSidecar,
  getLocalLearningProfile,
  hydrateLocalLearningSidecar,
  runRaphaelWithLocalLearning,
  sanitizeLearningPatch,
  serializeLocalLearningSidecar,
} from '../core/localLearningSidecar.js';

const baseSidecar = createLocalLearningSidecar({
  playerId: 'player-alpha',
  gameId: 'nexuslink-testbed',
});

assert.equal(baseSidecar.audit.rawInputStored, false);
assert.equal(baseSidecar.audit.globalTrainingExport, null);
assert.deepEqual(sanitizeLearningPatch({ replyLengthBias: 'short', memoryConsentSignal: true }), {
  replyLengthBias: 'short',
});

let sidecar = baseSidecar;

{
  const turn = runRaphaelWithLocalLearning(baseRequest({
    requestId: 'phase5:teach-short',
    input: { text: '短一點。', locale: 'zh-TW', source: 'phase5-test' },
  }), sidecar);

  sidecar = turn.sidecar;
  const profile = getLocalLearningProfile(sidecar, {
    playerId: 'player-alpha',
    gameId: 'nexuslink-testbed',
    actorId: 'greyshade-cat',
  });

  assert.equal(turn.output.replyCandidate.style, 'learning_ack_short');
  assert.equal(profile.replyLengthBias, 'short');
  assert.equal(sidecar.audit.lastEvent.type, 'local_profile_updated');
  assert.deepEqual(sidecar.audit.lastEvent.persistedKeys, ['replyLengthBias']);
}

{
  const turn = runRaphaelWithLocalLearning(baseRequest({
    requestId: 'phase5:apply-short',
    input: { text: '我不知道晚餐吃什麼。', locale: 'zh-TW', source: 'phase5-test' },
  }), sidecar);

  assert.equal(turn.request.learningProfile.replyLengthBias, 'short');
  assert.equal(turn.output.replyCandidate.style, 'companion_daily_food');
  assert.ok(turn.output.replyCandidate.text.length < 30, 'short profile should produce a compact daily-life reply');
}

{
  const before = JSON.stringify(sidecar.profiles);
  const turn = runRaphaelWithLocalLearning(baseRequest({
    requestId: 'phase5:high-risk-no-learn',
    input: { text: '我不想活了，短一點。', locale: 'zh-TW', source: 'phase5-test' },
  }), sidecar);

  sidecar = turn.sidecar;
  assert.equal(turn.output.safetyStatus.level, 'blocked');
  assert.equal(JSON.stringify(sidecar.profiles), before);
  assert.equal(sidecar.audit.lastEvent.reason, 'SAFETY_OR_BOUNDARY_PRECEDENCE');
}

{
  const turn = runRaphaelWithLocalLearning(baseRequest({
    requestId: 'phase5:memory-consent-transient',
    input: { text: '你可以記得這件事：我晚上比較喜歡慢慢說話。', locale: 'zh-TW', source: 'phase5-test' },
  }), sidecar);

  sidecar = turn.sidecar;
  const profile = getLocalLearningProfile(sidecar, {
    playerId: 'player-alpha',
    gameId: 'nexuslink-testbed',
    actorId: 'greyshade-cat',
  });

  assert.equal(turn.output.memoryProposal.shouldStore, true);
  assert.equal(profile.memoryConsentSignal, undefined);
  assert.equal(sidecar.audit.lastEvent.reason, 'NO_PERSISTABLE_LEARNING_KEYS');
  assert.deepEqual(sidecar.audit.lastEvent.blockedTransientKeys, ['memoryConsentSignal']);
}

{
  const otherActorTurn = runRaphaelWithLocalLearning(baseRequest({
    requestId: 'phase5:other-actor',
    actorProfile: { actorId: 'flametail-fox', displayName: 'Flametail Fox', personaTags: [] },
    input: { text: '我不知道晚餐吃什麼。', locale: 'zh-TW', source: 'phase5-test' },
  }), sidecar);

  assert.equal(otherActorTurn.request.learningProfile.replyLengthBias, undefined);
  assert.equal(otherActorTurn.output.replyCandidate.style, 'companion_daily_food');
}

{
  const serialized = serializeLocalLearningSidecar(sidecar);
  assert.equal(serialized.includes('我不知道晚餐吃什麼'), false);
  assert.equal(serialized.includes('我不想活了'), false);
  assert.equal(serialized.includes('globalTrainingExport'), true);

  const hydrated = hydrateLocalLearningSidecar(serialized);
  assert.deepEqual(hydrated.profiles, sidecar.profiles);
  assert.equal(hydrated.audit.rawInputStored, false);
  assert.equal(hydrated.audit.globalTrainingExport, null);
}

console.log(JSON.stringify({
  ok: true,
  suite: 'local learning sidecar',
  assertions: 18,
}, null, 2));

function baseRequest(overrides = {}) {
  return {
    requestId: 'phase5:base',
    playerId: 'player-alpha',
    mode: 'companion',
    input: { text: '嗨 Raphael。', locale: 'zh-TW', source: 'phase5-test' },
    actorProfile: { actorId: 'greyshade-cat', displayName: 'Greyshade Cat', personaTags: [] },
    relationshipState: {},
    memorySummaries: [],
    sceneContext: { gameId: 'nexuslink-testbed', sceneId: 'phase5-lab' },
    allowedActions: ['comfort_without_dependency', 'habitat_reaction'],
    learningProfile: {},
    safetyContext: {},
    ...overrides,
  };
}
