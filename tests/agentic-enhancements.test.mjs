import assert from 'node:assert/strict';
import { deriveVoiceToneParams } from '../core/voiceTonePolicy.js';
import { attachDevToolsTelemetryHook } from '../adapters/nexuslink/devToolsTelemetry.js';
import { buildFirebaseSyncDoc } from '../adapters/nexuslink/firebaseMemorySync.js';
import { evaluateAgenticQuality } from '../core/ra3AutonomyEvalBridge.js';
import { runRaphaelEngine } from '../core/index.js';

console.log('--- Testing Agentic Skill & Plugin Enhancements ---');

// Test 1: 3D PAD Voice Tone Mapper
const calmVoice = deriveVoiceToneParams({ pleasure: 0.1, arousal: -0.4, dominance: 0.2 });
assert.equal(calmVoice.voiceStyle, 'whisper_soft');
assert.ok(calmVoice.pitch < 1.0);
assert.ok(calmVoice.rate < 1.0);

const brightVoice = deriveVoiceToneParams({ pleasure: 0.5, arousal: 0.4, dominance: 0.3 });
assert.equal(brightVoice.voiceStyle, 'bright_cheerful');
assert.ok(brightVoice.pitch > 1.0);
console.log('Test 1 Passed: 3D PAD Voice Tone & TTS parameter mapper verified.');

// Test 2: Chrome DevTools Visual Telemetry Hook
const mockGlobal = {};
const hook = attachDevToolsTelemetryHook(mockGlobal);
assert.ok(mockGlobal.__RAPHAEL_DEVTOOLS_HOOK__);
hook.logTurn({ safetyLevel: 'clear', intent: 'greeting' });
assert.equal(hook.history.length, 1);
assert.equal(hook.getSummary().totalTurns, 1);
console.log('Test 2 Passed: Chrome DevTools telemetry hook verified.');

// Test 3: Firebase Encrypted Memory Cloud Sync
const syncAllowed = buildFirebaseSyncDoc({
  userId: 'user_123',
  safetyLevel: 'clear',
  memories: [{ id: 'm1', summary: '喜歡草莓蛋糕' }],
});
assert.equal(syncAllowed.allowed, true);
assert.equal(syncAllowed.docPayload.memoryCount, 1);

const syncBlocked = buildFirebaseSyncDoc({
  userId: 'user_123',
  safetyLevel: 'blocked',
});
assert.equal(syncBlocked.allowed, false);
assert.equal(syncBlocked.reason, 'SAFETY_BLOCKED_SYNC_REFUSED');
console.log('Test 3 Passed: Firebase cloud memory sync safety safeguards verified.');

// Test 4: RA3 Agentic Quality Evaluator
const engineOutput = runRaphaelEngine({
  requestId: 'eval-agentic',
  mode: 'companion',
  input: { text: '今天好累，壓力很大' },
});
const quality = evaluateAgenticQuality(engineOutput);
assert.ok(quality.qualityScore >= 80);
assert.equal(quality.grade, 'A+');
console.log('Test 4 Passed: RA3 agentic quality evaluator verified.');

console.log('\nALL AGENTIC ENHANCEMENT TESTS PASSED!');
