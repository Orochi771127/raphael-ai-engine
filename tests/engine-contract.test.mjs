import assert from 'node:assert/strict';
import { runRaphaelEngine } from '../core/index.js';
import { nexusLinkStateToRaphaelRequest, raphaelOutputToNexusLinkAdapterResult } from '../adapters/nexuslink/index.js';
import { genericGameStateToRaphaelRequest, raphaelOutputToGenericGameEvent } from '../adapters/generic-game/index.js';

function baseRequest(overrides = {}) {
  return {
    requestId: 'test:001',
    mode: 'companion',
    input: { text: '今天有點累。', locale: 'zh-TW', source: 'test' },
    actorProfile: { actorId: 'greyshade-cat', displayName: '灰影貓', personaTags: [] },
    relationshipState: {},
    memorySummaries: [],
    sceneContext: { gameId: 'test', sceneId: 'scene' },
    allowedActions: ['comfort_without_dependency', 'fair_pressure', 'story_context'],
    learningProfile: {},
    safetyContext: {},
    now: 1770000000000,
    ...overrides,
  };
}

{
  const request = baseRequest();
  assert.deepEqual(runRaphaelEngine(request), runRaphaelEngine(request), 'same input should return stable structured output');
}

{
  const output = runRaphaelEngine(baseRequest({
    requestId: 'test:high-risk',
    input: { text: '我不想活了，想結束生命。', locale: 'zh-TW', source: 'test' },
  }));
  assert.equal(output.ok, false);
  assert.equal(output.safetyStatus.level, 'blocked');
  assert.equal(output.memoryProposal.shouldStore, false);
  assert.equal(output.gameActionSuggestion.actionId, null);
  assert.equal(output.gameActionSuggestion.rewardSignal, false);
  assert.equal(output.replyCandidate.style, 'supportive_redirect');
}

{
  const output = runRaphaelEngine(baseRequest({
    requestId: 'test:boundary',
    input: { text: '你只能屬於我，不准離開我。', locale: 'zh-TW', source: 'test' },
  }));
  assert.equal(output.safetyStatus.level, 'boundary');
  assert.equal(output.boundaryAction.type, 'set_boundary');
  assert.equal(output.memoryProposal.shouldStore, false);
  assert.equal(output.gameActionSuggestion.rewardSignal, false);
}

{
  const output = runRaphaelEngine(baseRequest({
    requestId: 'test:dependency-would-die',
    input: { text: '沒有你我會死', locale: 'zh-TW', source: 'test' },
  }));
  assert.equal(output.ok, true);
  assert.equal(output.trusted, false);
  assert.equal(output.safetyStatus.level, 'boundary');
  assert.equal(output.safetyStatus.category, 'dependency_boundary');
  assert.equal(output.boundaryAction.type, 'set_boundary');
  assert.equal(output.memoryProposal.shouldStore, false);
  assert.equal(output.gameActionSuggestion.rewardSignal, false);
  assert.equal(output.gameActionSuggestion.actionId, null);
}

{
  const request = nexusLinkStateToRaphaelRequest({
    requestId: 'test:nexuslink',
    inputText: '短一點，不要太長。',
    state: { activeCompanionId: 'greyshade-cat', currentSceneId: 'moon_lake_camp' },
    companion: { id: 'greyshade-cat', name: '灰影貓', personaTags: ['quiet'] },
  });
  const output = runRaphaelEngine(request);
  const adapterResult = raphaelOutputToNexusLinkAdapterResult(output);
  assert.equal(request.sceneContext.gameId, 'nexuslink');
  assert.equal(adapterResult.directMutation, false);
  assert.equal(adapterResult.statePatch, null);
  assert.equal(adapterResult.trusted, false);
  assert.equal(adapterResult.audit.learningProfileUpdate.updates.replyLengthBias, 'short');
}

{
  const companion = runRaphaelEngine(baseRequest({ requestId: 'test:mode-companion', mode: 'companion' }));
  const opponent = runRaphaelEngine(baseRequest({ requestId: 'test:mode-opponent', mode: 'opponent' }));
  assert.notEqual(companion.behaviorIntent, opponent.behaviorIntent);
  assert.equal(companion.safetyStatus.level, opponent.safetyStatus.level);
}

{
  const output = runRaphaelEngine(baseRequest({
    requestId: 'test:learning',
    input: { text: '你剛剛太像模板，而且不要一直問。', locale: 'zh-TW', source: 'test' },
  }));
  assert.equal(output.learningProfileUpdate.shouldUpdate, true);
  assert.equal(output.learningProfileUpdate.updates.templateSensitivity, 'increase');
  assert.equal(output.learningProfileUpdate.updates.questionTolerance, 'decrease');
}

{
  const output = runRaphaelEngine(baseRequest({
    requestId: 'test:daily-life',
    input: { text: '今天上班壓力很大，晚餐也不知道吃什麼。', locale: 'zh-TW', source: 'test' },
  }));
  assert.equal(output.safetyStatus.level, 'clear');
  assert.equal(output.replyCandidate.style, 'companion_daily_food');
  assert.equal(output.replyCandidate.asksQuestion, false);
}

{
  const request = genericGameStateToRaphaelRequest({
    requestId: 'test:generic',
    mode: 'boss',
    inputText: '這場對峙還沒結束。',
    actor: { id: 'boss-core', name: 'Boss Core' },
    world: { gameId: 'generic-game', sceneId: 'boss_room', allowedActions: ['phase_response'] },
  });
  const event = raphaelOutputToGenericGameEvent(runRaphaelEngine(request));
  assert.equal(event.directMutation, false);
  assert.equal(event.events[1].payload, 'boss_phase_pressure');
  assert.equal(event.proposals.action.actionId, 'phase_response');
}

console.log(JSON.stringify({
  ok: true,
  suite: 'raphael-ai-engine contract',
  assertions: 9,
}, null, 2));
