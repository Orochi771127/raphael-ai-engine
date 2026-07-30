import assert from 'node:assert/strict';
import { runRaphaelEngine, analyzePragmaticContext, evaluateCompanionBehavior, realizeSurfaceText } from '../core/index.js';

console.log('--- Testing Phase 15-17: Pragmatic NLU, Companion Behavior & Surface Realizer ---');

// Test 1: Pragmatic Tone Analysis
const pragmaticSelfMock = analyzePragmaticContext('我真是個天才呵呵');
assert.equal(pragmaticSelfMock.tone, 'self_mocking');

const pragmaticHesitant = analyzePragmaticContext('嗯...好像不知道算了吧');
assert.equal(pragmaticHesitant.tone, 'hesitant');
console.log('Test 1 Passed: Pragmatic tone detection verified.');

// Test 2: Companion Attachment & Micro-Action Generation
const behaviorRes = evaluateCompanionBehavior({
  relationshipState: { trust: 0.8, closeness: 0.7 },
  padEmotionState: { arousal: 0.4, pleasure: 0.4 },
  pragmaticContext: { tone: 'hesitant' },
});
assert.equal(behaviorRes.attachmentState, 'secure_attuned');
assert.ok(behaviorRes.microAction.includes('耳朵稍微傾斜'));
console.log('Test 2 Passed: Companion attachment & micro-action generation verified.');

// Test 3: Surface Realizer & Micro-Action Weaving
const realized = realizeSurfaceText({
  rawCandidate: { text: '我聽見了。', style: 'companion_grounded' },
  pragmaticContext: { tone: 'neutral_direct' },
  companionBehavior: { microAction: '（尾巴輕擺，專注聽著）' },
  playerProfile: { playerName: '小明' },
});
assert.ok(realized.text.startsWith('（尾巴輕擺，專注聽著）'));
assert.equal(realized.microActionWeoven, true);
console.log('Test 3 Passed: Surface realizer micro-action weaving verified.');

// Test 4: Full Engine Pipeline Integration
const engineResult = runRaphaelEngine({
  requestId: 'pragmatic-pipeline-1',
  mode: 'companion',
  input: { text: '我今天好像又搞砸了，不知道算了吧' },
  playerProfile: { playerName: '阿傑' },
  sceneContext: { sceneId: 'moonlake_camp', habitatState: { weather: 'night', mood: 'quiet' } },
});

assert.ok(engineResult.pragmaticContext);
assert.equal(engineResult.pragmaticContext.tone, 'hesitant');
assert.ok(engineResult.companionBehavior);
assert.ok(engineResult.replyCandidate.text);
console.log('Test 4 Passed: Full engine pipeline Phase 15-17 integration verified.');

console.log('\nALL PRAGMATIC NLU AND SURFACE REALIZER TESTS PASSED!');
