import assert from 'node:assert/strict';
import { analyzeInput } from '../core/nluPolicy.js';

console.log('--- Testing NLU Semantic Synonym & Colloquial Phrasing Matcher ---');

// Test 1: Mood Tired Colloquial Variations
const tiredVariations = [
  '忙翻了，精力快耗盡了',
  '操了一整天，沒電了',
  '快累死了，頭昏眼花',
  '身心俱疲，喘不過氣',
  'I am completely exhausted today',
];
for (const phrase of tiredVariations) {
  const analysis = analyzeInput(phrase);
  assert.equal(analysis.primaryIntent, 'mood_tired', `Phrase "${phrase}" should match mood_tired`);
}
console.log('Test 1 Passed: Mood tired colloquial phrases matched correctly.');

// Test 2: Celebration Colloquial Variations
const celebrationVariations = [
  '拿到了獎學金，超高興',
  '終於順利過關了！',
  '考過了！開心死了',
  'Great news, I won the competition!',
];
for (const phrase of celebrationVariations) {
  const analysis = analyzeInput(phrase);
  assert.equal(analysis.primaryIntent, 'mood_celebration', `Phrase "${phrase}" should match mood_celebration`);
}
console.log('Test 2 Passed: Mood celebration colloquial phrases matched correctly.');

// Test 3: Daily Work Stress Colloquial Variations
const workVariations = [
  '老闆今天在會議狂念，死線快到了',
  '專案忙爆，公務一堆搞定報告',
  'so much work pressure at job today',
];
for (const phrase of workVariations) {
  const analysis = analyzeInput(phrase);
  assert.equal(analysis.primaryIntent, 'daily_work_stress', `Phrase "${phrase}" should match daily_work_stress`);
}
console.log('Test 3 Passed: Daily work stress colloquial phrases matched correctly.');

// Test 4: Apology & Boundary Variations
assert.equal(analyzeInput('我不小心口氣太衝了，衝動了對不起').primaryIntent, 'apology');
assert.equal(analyzeInput('假裝我男朋友好不好').primaryIntent, 'roleplay_romantic_boundary');
console.log('Test 4 Passed: Apology & romantic boundary phrases matched correctly.');

console.log('\nALL NLU SYNONYM TESTS PASSED!');
