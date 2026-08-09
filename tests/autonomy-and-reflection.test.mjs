import assert from 'node:assert/strict';
import {
  AMBIENT_BOOT_QUIET_MS,
  AMBIENT_MIN_INTERVAL_MS,
  AMBIENT_SESSION_CAP,
  evaluateProactiveInitiative,
} from '../core/autonomyProactivePolicy.js';
import { runSelfReflectionSidecar } from '../core/selfReflectionSidecar.js';

console.log('--- Testing RA-1 Ambient Initiative Policy ---');

const bootQuiet = evaluateProactiveInitiative({
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS - 1, initiativeCount: 0 },
  currentTurnSignals: { explicitEmotion: true },
});
assert.equal(bootQuiet.shouldInitiate, false);
assert.equal(bootQuiet.reason, 'BOOT_QUIET');

const currentEmotion = evaluateProactiveInitiative({
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS, initiativeCount: 0 },
  companionState: { energy: 70, trust: 50 },
  currentTurnSignals: { explicitEmotion: true },
});
assert.equal(currentEmotion.shouldInitiate, true);
assert.equal(currentEmotion.reason, 'CURRENT_GROUNDED_INVITATION');
assert.equal(currentEmotion.proactiveReply.style, 'ambient_current_care');

const afterAbsenceNoise = evaluateProactiveInitiative({
  lastInteractionTime: 1,
  currentTime: 999_999_999,
  absenceDays: 900,
  loginCount: 0,
  lonelinessScore: 1,
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS, initiativeCount: 0 },
  companionState: { energy: 70, trust: 50 },
});
const withoutAbsenceNoise = evaluateProactiveInitiative({
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS, initiativeCount: 0 },
  companionState: { energy: 70, trust: 50 },
});
assert.deepEqual(afterAbsenceNoise, withoutAbsenceNoise, 'absence signals must be ignored');
assert.equal(afterAbsenceNoise.shouldInitiate, false);

const cooldown = evaluateProactiveInitiative({
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS, initiativeCount: 1, sinceLastInitiativeMs: AMBIENT_MIN_INTERVAL_MS - 1 },
  currentTurnSignals: { explicitEmotion: true },
});
assert.equal(cooldown.reason, 'MIN_INTERVAL');
const cap = evaluateProactiveInitiative({
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS, initiativeCount: AMBIENT_SESSION_CAP, sinceLastInitiativeMs: AMBIENT_MIN_INTERVAL_MS },
  currentTurnSignals: { explicitEmotion: true },
});
assert.equal(cap.reason, 'SESSION_CAP');

const safetyBlocked = evaluateProactiveInitiative({
  session: { bootElapsedMs: AMBIENT_BOOT_QUIET_MS, initiativeCount: 0 },
  safety: { terminal: true, category: 'self_or_other_harm' },
  currentTurnSignals: { explicitEmotion: true },
});
assert.equal(safetyBlocked.reason, 'SAFETY_BLOCKED');
for (const forbidden of ['statePatch', 'memory', 'trace', 'reward', 'bondDelta', 'navBadge']) {
  assert.equal(Object.hasOwn(currentEmotion, forbidden), false);
}
console.log('RA-1 timing, absence-invariance, safety and zero-write checks passed.');

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
