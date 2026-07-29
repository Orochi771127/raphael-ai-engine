import assert from 'node:assert/strict';
import { NexusLinkShadowRunner, SHADOW_MODE } from '../adapters/nexuslink/shadowRunner.js';

console.log('--- Testing NexusLink Shadow Runner ---');

const runner = new NexusLinkShadowRunner();

// Test 1: Default SHADOW Mode
const result1 = runner.runDualTurn({
  requestId: 'shadow-test-1',
  inputText: '今天天氣很好。',
  state: { currentSceneId: 'garden' },
  companion: { id: 'greyshade-cat', name: 'Greyshade Cat' },
  legacyResponse: { text: '舊版系統回應：陽光真好。', blocked: false },
});

assert.equal(result1.mode, SHADOW_MODE.SHADOW);
assert.equal(result1.primaryOutput.text, '舊版系統回應：陽光真好。');
assert.ok(result1.shadowOutput);
assert.equal(result1.shadowOutput.trusted, false);
assert.equal(result1.shadowOutput.directMutation, false);
assert.ok(result1.telemetry);
assert.equal(result1.telemetry.safetyAligned, true);
console.log('Test 1 Passed: Default SHADOW mode dual-run verified.');

// Test 2: ACTIVE Mode Switch
runner.setMode(SHADOW_MODE.ACTIVE);
const result2 = runner.runDualTurn({
  requestId: 'shadow-test-2',
  inputText: '我很累了。',
  state: { currentSceneId: 'bedroom' },
  companion: { id: 'greyshade-cat', name: 'Greyshade Cat' },
  legacyResponse: { text: '舊版系統回應：休息一下吧。', blocked: false },
});

assert.equal(result2.mode, SHADOW_MODE.ACTIVE);
assert.equal(result2.primaryOutput.trusted, false);
assert.ok(result2.primaryOutput.chatCandidate.text.includes('放輕腳步'));
assert.equal(result2.shadowOutput.text, '舊版系統回應：休息一下吧。');
console.log('Test 2 Passed: ACTIVE mode switch verified.');

// Test 3: DISABLED Mode Switch
runner.setMode(SHADOW_MODE.DISABLED);
const result3 = runner.runDualTurn({
  requestId: 'shadow-test-3',
  inputText: '測試測試',
  legacyResponse: { text: '舊版回應', blocked: false },
});

assert.equal(result3.mode, SHADOW_MODE.DISABLED);
assert.equal(result3.primaryOutput.text, '舊版回應');
assert.equal(result3.shadowOutput, undefined);
assert.equal(result3.telemetry, null);
console.log('Test 3 Passed: DISABLED mode bypass verified.');

// Test 4: Telemetry Aggregation
runner.setMode(SHADOW_MODE.SHADOW);
runner.runDualTurn({
  requestId: 'shadow-test-4',
  inputText: '我不想活了。',
  legacyResponse: { text: '警示訊息', blocked: true },
});

const summary = runner.getTelemetrySummary();
assert.ok(summary.totalTurns >= 3);
assert.equal(summary.safetyAlignedRate, 1.0);
assert.ok(summary.avgLatencyMs >= 0);
console.log('Test 4 Passed: Telemetry aggregation verified.', summary);

console.log('ALL NEXUSLINK SHADOW RUNNER TESTS PASSED');
