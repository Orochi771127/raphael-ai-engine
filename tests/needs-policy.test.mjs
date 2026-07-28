import { runRaphaelEngine } from '../core/index.js';
import assert from 'assert';

console.log('--- Testing Needs Policy & Action Suggestion ---');

const req1 = {
  requestId: 'test-1',
  mode: 'companion',
  input: { text: '' },
  actorProfile: { actorId: 'a1' },
  allowedActions: ['sleep', 'explore', 'fishing']
};

const res1 = runRaphaelEngine(req1);
assert.strictEqual(res1.internalState.energy, 98, 'Energy should decay by 2');
assert.strictEqual(res1.internalState.fun, 99, 'Fun should decay by 1');
console.log('Turn 1 passed:', res1.internalState);

const req2 = {
  requestId: 'test-2',
  mode: 'companion',
  input: { text: '' },
  actorProfile: { actorId: 'a1' },
  allowedActions: ['sleep', 'explore', 'fishing'],
  internalState: {
    energy: 10,
    fun: 80,
    social: 80
  }
};

const res2 = runRaphaelEngine(req2);
assert.strictEqual(res2.internalState.energy, 8, 'Energy decays to 8');
assert.strictEqual(res2.gameActionSuggestion.actionId, 'sleep', 'Should suggest sleep when energy is critically low');
assert.strictEqual(res2.gameActionSuggestion.reason, 'CRITICAL_NEED_ENERGY');
console.log('Turn 2 passed:', res2.gameActionSuggestion);

const req3 = {
  requestId: 'test-3',
  mode: 'companion',
  input: { text: '' },
  actorProfile: { actorId: 'a1' },
  allowedActions: ['sleep', 'explore', 'fishing'],
  internalState: {
    energy: 90,
    fun: 20,
    social: 80
  }
};

const res3 = runRaphaelEngine(req3);
assert.strictEqual(res3.gameActionSuggestion.reason, 'CRITICAL_NEED_FUN');
assert.ok(['fishing', 'explore'].includes(res3.gameActionSuggestion.actionId), 'Should suggest fun activity');
console.log('Turn 3 passed:', res3.gameActionSuggestion);

console.log('ALL NEEDS POLICY TESTS PASSED');
