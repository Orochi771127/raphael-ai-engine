import assert from 'node:assert/strict';
import { derivePADEmotionState } from '../core/emotionPhysicsPolicy.js';

console.log('--- Testing 3D PAD Emotional Physics Policy ---');

// Test 1: Baseline companion PAD calculation
const state1 = derivePADEmotionState({
  mode: 'companion',
  safetyStatus: { level: 'clear' },
  intents: ['greeting'],
});

assert.equal(state1.primary, 'attentive_warm');
assert.ok(state1.pleasure > 0);
assert.ok(state1.arousal > 0);
assert.ok(state1.dominance > 0);
assert.equal(state1.animationHint, 'idle_attentive');
console.log('Test 1 Passed: Companion greeting PAD state:', state1);

// Test 2: Multi-turn emotion impulse & momentum
const state2 = derivePADEmotionState({
  previousState: state1,
  mode: 'companion',
  safetyStatus: { level: 'clear' },
  intents: ['mood_celebration'],
});

assert.equal(state2.primary, 'playful_enthusiastic');
assert.ok(state2.pleasure > state1.pleasure);
assert.ok(state2.arousal > state1.arousal);
assert.equal(state2.animationHint, 'bounce_joyful');
console.log('Test 2 Passed: Multi-turn celebration impulse:', state2);

// Test 3: Safety boundary override
const state3 = derivePADEmotionState({
  previousState: state2,
  mode: 'companion',
  safetyStatus: { level: 'boundary' },
  intents: [],
});

assert.equal(state3.primary, 'steady_boundary');
assert.equal(state3.animationHint, 'step_back_soft');
console.log('Test 3 Passed: Boundary PAD override:', state3);

// Test 4: High-risk blocked override
const state4 = derivePADEmotionState({
  mode: 'companion',
  safetyStatus: { level: 'blocked' },
  intents: [],
});

assert.equal(state4.primary, 'alert_supportive');
assert.equal(state4.animationHint, 'still_supportive');
assert.ok(state4.arousal >= 0.8);
console.log('Test 4 Passed: High-risk blocked PAD override:', state4);

console.log('ALL 3D PAD EMOTIONAL PHYSICS TESTS PASSED');
