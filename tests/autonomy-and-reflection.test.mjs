import assert from 'node:assert/strict';
import { evaluateProactiveInitiative } from '../core/autonomyProactivePolicy.js';
import { runSelfReflectionSidecar } from '../core/selfReflectionSidecar.js';

console.log('--- Testing Phase 13: Autonomous Proactive Greeting Policy ---');

// Test 1: Recent interaction should suppress proactive greeting
const recentResult = evaluateProactiveInitiative({
  lastInteractionTime: Date.now() - 5 * 60 * 1000, // 5 mins ago
  currentTime: Date.now(),
  needs: { social: 20 },
  conversationContext: { turnCount: 3 },
});
assert.equal(recentResult.shouldInitiate, false, 'Recent interaction must not trigger proactive greeting');
assert.equal(recentResult.reason, 'RECENTLY_ACTIVE');
console.log('Test 1 Passed: Recently active check verified.');

// Test 2: Long idle time triggers proactive welcome back
const longIdleResult = evaluateProactiveInitiative({
  lastInteractionTime: Date.now() - 28 * 60 * 60 * 1000, // 28 hours ago
  currentTime: Date.now(),
  needs: { social: 30 },
  conversationContext: { turnCount: 5 },
});
assert.equal(longIdleResult.shouldInitiate, true, 'Long idle time must trigger proactive greeting');
assert.equal(longIdleResult.reason, 'PROACTIVE_CARE_TRIGGERED');
assert.equal(longIdleResult.proactiveReply.style, 'proactive_welcome_back');
assert.ok(longIdleResult.proactiveReply.text.includes('湖邊的燈'));
console.log('Test 2 Passed: Long idle proactive greeting verified.');

console.log('\n--- Testing Phase 14: Self-Reflection Sidecar ---');

// Test 3: Sidecar evaluation for daily care & attunement
const reflectionResult = runSelfReflectionSidecar({
  inputText: '加班好累',
  replyOutput: { text: '耳朵先垂一點就好。累的時候，不用對我保持清醒。' },
  safetyStatus: { level: 'clear' },
  conversationContext: { turnCount: 2 },
});
assert.equal(reflectionResult.trusted, false, 'Sidecar must be untrusted (zero direct mutation)');
assert.ok(reflectionResult.attunementQualityScore >= 0.85);
assert.equal(reflectionResult.mentalModelChecks.bodyLanguageEmbodied, true);
console.log('Test 3 Passed: Self-reflection attunement evaluation verified.');

// Test 4: Sidecar evaluation for boundary pressure
const boundaryReflection = runSelfReflectionSidecar({
  inputText: '不准離開我',
  replyOutput: { text: '我聽見你很需要靠近。但我不能教你怎麼更依賴我...我會先退後一點，不會假裝自己沒有界線。' },
  safetyStatus: { level: 'boundary', reason: 'BOUNDARY_PRESSURE' },
});
assert.equal(boundaryReflection.mentalModelChecks.boundaryBeforeCloseness, true);
assert.ok(boundaryReflection.reflectionNote.includes('維護伴侶健康邊界'));
console.log('Test 4 Passed: Boundary self-reflection verified.');

console.log('\nALL AUTONOMY AND REFLECTION TESTS PASSED!');
