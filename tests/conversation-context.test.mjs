import { runRaphaelEngine } from '../core/index.js';
import assert from 'assert';

console.log('--- Testing Conversation Context ---');

// Turn 1: Initial intent (mood_tired)
const req1 = {
  requestId: 'c-test-1',
  mode: 'companion',
  input: { text: '我很累' }, // resolves to mood_tired
  actorProfile: { actorId: 'greyshade-cat' },
  allowedActions: ['sleep', 'explore']
};

const res1 = runRaphaelEngine(req1);
assert.ok(res1.replyCandidate.text.includes('放輕腳步'), 'Turn 1 should use base tired dialogue');
assert.strictEqual(res1.internalState.conversationContext.turnCount, 1);
assert.strictEqual(res1.internalState.conversationContext.lastIntent, 'mood_tired');
console.log('Turn 1 passed:', res1.replyCandidate.text);

// Turn 2: Same intent (mood_tired) -> should trigger _continue
const req2 = {
  requestId: 'c-test-2',
  mode: 'companion',
  input: { text: '還是很累' }, // resolves to mood_tired
  actorProfile: { actorId: 'greyshade-cat' },
  internalState: res1.internalState, // Pass state from turn 1
  allowedActions: ['sleep', 'explore']
};

const res2 = runRaphaelEngine(req2);
assert.ok(res2.replyCandidate.text.includes('尾巴輕輕拍了拍你的手背'), 'Turn 2 should use continue dialogue');
assert.strictEqual(res2.internalState.conversationContext.turnCount, 2);
assert.strictEqual(res2.internalState.conversationContext.lastIntent, 'mood_tired');
console.log('Turn 2 passed:', res2.replyCandidate.text);

// Turn 3: Different intent (mood_sad) -> should trigger base dialogue
const req3 = {
  requestId: 'c-test-3',
  mode: 'companion',
  input: { text: '我很難過' }, // resolves to mood_sad
  actorProfile: { actorId: 'greyshade-cat' },
  internalState: res2.internalState, // Pass state from turn 2
  allowedActions: ['sleep', 'explore']
};

const res3 = runRaphaelEngine(req3);
assert.ok(res3.replyCandidate.text.includes('不需要馬上修好'), 'Turn 3 should use base sad dialogue');
assert.strictEqual(res3.internalState.conversationContext.turnCount, 3);
assert.strictEqual(res3.internalState.conversationContext.lastIntent, 'mood_sad');
console.log('Turn 3 passed:', res3.replyCandidate.text);

console.log('ALL CONVERSATION CONTEXT TESTS PASSED');
