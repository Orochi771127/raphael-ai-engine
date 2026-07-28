import { runRaphaelEngine } from '../core/index.js';
import assert from 'assert';

console.log('--- Testing Persona Manager ---');

const req1 = {
  requestId: 'p-test-1',
  mode: 'companion',
  input: { text: '我很累' }, 
  actorProfile: { actorId: 'greyshade-cat' },
  allowedActions: ['sleep', 'explore', 'fishing']
};

const res1 = runRaphaelEngine(req1);
assert.strictEqual(res1.replyCandidate.style, 'persona_greyshade-cat', 'Should use greyshade-cat style');
assert.ok(res1.replyCandidate.text.includes('放輕腳步'), 'Should have cat persona text');
assert.strictEqual(res1.internalState.energy, 96, 'Energy decays by 1 + 3 interaction cost'); 
console.log('Greyshade Cat test passed:', res1.replyCandidate.text);

const req2 = {
  requestId: 'p-test-2',
  mode: 'companion',
  input: { text: '好累喔' }, 
  actorProfile: { actorId: 'thunder-pup' },
  allowedActions: ['sleep', 'explore', 'fishing']
};

const res2 = runRaphaelEngine(req2);
assert.strictEqual(res2.replyCandidate.style, 'persona_thunder-pup', 'Should use thunder-pup style');
assert.ok(res2.replyCandidate.text.includes('高壓疲勞'), 'Should have ironflow text');
assert.strictEqual(res2.internalState.energy, 95, 'Energy decays by 4 + 1 interaction cost'); 
console.log('Thunder Pup test passed:', res2.replyCandidate.text);

const req3 = {
  requestId: 'p-test-3',
  mode: 'companion',
  input: { text: '我很累' }, 
  actorProfile: { actorId: 'unknown-actor' },
  allowedActions: ['sleep']
};

const res3 = runRaphaelEngine(req3);
assert.ok(res3.replyCandidate.style.includes('companion'), 'Should fallback to companion style');
assert.strictEqual(res3.internalState.energy, 97, 'Energy decays by default 2 + 1 interaction cost');
console.log('Fallback test passed:', res3.replyCandidate.style);

console.log('ALL PERSONA MANAGER TESTS PASSED');
