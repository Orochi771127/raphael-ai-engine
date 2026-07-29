import assert from 'node:assert/strict';
import { runRaphaelEngine } from '../core/index.js';
import { getVariationReply } from '../core/replyPolicy.js';

console.log('--- Testing Multi-Variation Dialogue Pool ---');

// Test 1: Multi-turn candidate variation rotation
const turn0 = runRaphaelEngine({
  requestId: 'var-1',
  mode: 'companion',
  input: { text: '我很累' },
  internalState: { conversationContext: { turnCount: 0 } },
});

const turn1 = runRaphaelEngine({
  requestId: 'var-2',
  mode: 'companion',
  input: { text: '我很累' },
  internalState: { conversationContext: { turnCount: 1 } },
});

const turn2 = runRaphaelEngine({
  requestId: 'var-3',
  mode: 'companion',
  input: { text: '我很累' },
  internalState: { conversationContext: { turnCount: 2 } },
});

assert.equal(turn0.replyCandidate.style, 'companion_tired_attunement');
assert.ok(turn0.replyCandidate.text.includes('聽起來你今天消耗很多'));
assert.ok(turn1.replyCandidate.text.includes('電力用到極限'));
assert.ok(turn2.replyCandidate.text.includes('辛苦你了'));

assert.notEqual(turn0.replyCandidate.text, turn1.replyCandidate.text);
assert.notEqual(turn1.replyCandidate.text, turn2.replyCandidate.text);
console.log('Test 1 Passed: Multi-turn candidate rotation verified.');

// Test 2: Short length preference pool
const shortTurn = runRaphaelEngine({
  requestId: 'var-short',
  mode: 'companion',
  input: { text: '工作壓力好大' },
  learningProfile: { replyLengthBias: 'short' },
  internalState: { conversationContext: { turnCount: 0 } },
});

assert.equal(shortTurn.replyCandidate.style, 'companion_daily_work_stress');
assert.ok(shortTurn.replyCandidate.text.includes('工作辛苦了') || shortTurn.replyCandidate.text.includes('工作壓力'));
console.log('Test 2 Passed: Short length preference pool verified.');

// Test 3: Direct getVariationReply helper lookup
const varRes = getVariationReply('mood_sad', {}, { turnCount: 1 });
assert.ok(varRes.text.includes('假裝堅強') || varRes.text.includes('不用馬上變好'));
console.log('Test 3 Passed: getVariationReply direct lookup verified.');

console.log('ALL MULTI-VARIATION DIALOGUE POOL TESTS PASSED');
