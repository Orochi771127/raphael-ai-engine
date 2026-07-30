import assert from 'node:assert/strict';
import { runRaphaelEngine } from '../core/index.js';

{
  const requestStart = {
    mode: 'expedition',
    expeditionEvent: 'start',
    actorProfile: { actorId: 'greyshade-cat' },
    input: { text: '' }
  };
  
  const resultStart = runRaphaelEngine(requestStart);
  
  assert.ok(resultStart.expeditionBehavior, 'Should output expedition behavior');
  assert.equal(resultStart.expeditionBehavior.style, 'shadow_walker', 'Should correctly inherit style from persona');
  assert.ok(resultStart.replyCandidate.text.includes('我會在暗處留意四周'), 'Reply should be overriden with start text');
  assert.equal(resultStart.replyCandidate.microAction, 'prepare_expedition', 'Micro action should match eventType');
}

{
  const requestDanger = {
    mode: 'expedition',
    expeditionEvent: 'danger',
    actorProfile: { actorId: 'greyshade-cat' },
    input: { text: '' }
  };
  
  const resultDanger = runRaphaelEngine(requestDanger);
  assert.equal(resultDanger.emotionState.primary, 'alert', 'Emotion state should change based on event');
  assert.ok(resultDanger.replyCandidate.text.includes('別出聲'), 'Danger dialogue should be used');
}

console.log(JSON.stringify({
  ok: true,
  suite: 'expedition policy integration',
  assertions: 6,
}, null, 2));
