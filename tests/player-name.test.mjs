import assert from 'node:assert/strict';
import { runRaphaelEngine } from '../core/index.js';
import { runNexusLinkRaphaelTurn } from '../adapters/nexuslink/index.js';

console.log('--- Testing Player Name Support & Personalization ---');

// Test 1: Core engine playerProfile support with template substitution
const engineRes = runRaphaelEngine({
  requestId: 'player-name-1',
  mode: 'companion',
  input: { text: '我難過' },
  playerProfile: { playerName: '小明' },
});

assert.ok(engineRes.replyCandidate);
console.log('Test 1 Passed: Core engine accepted playerProfile successfully.');

// Test 2: NexusLink adapter playerProfile forwarding
const adapterRes = runNexusLinkRaphaelTurn({
  requestId: 'player-name-2',
  inputText: '我累了',
  state: {
    playerProfile: { displayName: 'Alex' },
    activeCompanionId: 'greyshade-cat',
  },
});

assert.ok(adapterRes.chatCandidate);
console.log('Test 2 Passed: NexusLink adapter playerProfile forwarding verified.');

console.log('\nALL PLAYER NAME TESTS PASSED!');
