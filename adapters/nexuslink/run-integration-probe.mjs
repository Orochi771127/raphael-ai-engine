import assert from 'node:assert/strict';
import { runRaphaelEngine } from '../../core/index.js';
import { nexusLinkStateToRaphaelRequest, raphaelOutputToNexusLinkAdapterResult } from './index.js';

let currentState = {
  activeCompanionId: 'greyshade-cat',
  playerProfile: { displayName: 'Player1' },
  companionTrust: 0.5,
  companionCloseness: 0.5,
  energy: 80,
  memorySummaries: [],
  emotionalMemories: []
};

let currentCompanion = {
  id: 'greyshade-cat',
  name: 'Greyshade Cat'
};

function runLoopTurn(eventType, inputText, mode = 'companion') {
  const request = nexusLinkStateToRaphaelRequest({
    requestId: `nexuslink-loop:${eventType}`,
    inputText,
    state: {
      ...currentState,
      mode,
      expeditionEvent: mode === 'expedition' ? eventType : undefined
    },
    companion: currentCompanion
  });
  
  if (mode === 'expedition') {
    request.mode = 'expedition';
    request.expeditionEvent = eventType;
  }

  const engineOutput = runRaphaelEngine(request);
  const adapterResult = raphaelOutputToNexusLinkAdapterResult(engineOutput);

  if (adapterResult.memoryProposal?.shouldStore) {
    currentState.memorySummaries.push({
      id: Date.now().toString(),
      summary: adapterResult.memoryProposal.summary || `Memory stored from ${eventType}`
    });
  }
  
  return { engineOutput, adapterResult };
}

try {
  console.log("Turn 1: Greeting (Soul Talk)");
  let t1 = runLoopTurn('soul_talk', '嗨，我回來了。');
  assert.equal(t1.adapterResult.ok, true);
  console.log("=> " + t1.adapterResult.chatCandidate.text);

  console.log("Turn 2: Touch (Petting)");
  let t2 = runLoopTurn('touch', '撫摸頭部');
  assert.equal(t2.adapterResult.ok, true);
  console.log("=> " + t2.adapterResult.chatCandidate.text);

  console.log("Turn 3: Expedition Start");
  let t3 = runLoopTurn('start', '', 'expedition');
  assert.equal(t3.engineOutput.expeditionBehavior.mood, 'curious');
  console.log("=> " + t3.engineOutput.expeditionBehavior.text);

  console.log("Turn 4: Expedition Find Shard");
  let t4 = runLoopTurn('find_shard', '', 'expedition');
  assert.equal(t4.engineOutput.expeditionBehavior.mood, 'excited');
  console.log("=> " + t4.engineOutput.expeditionBehavior.text);

  console.log("Turn 5: Soul Talk (Memory Trigger)");
  let t5 = runLoopTurn('soul_talk', '這真是辛苦的一天，請記住我晚上想放鬆。');
  if (t5.adapterResult.memoryProposal.shouldStore) {
    console.log("=> Memory stored successfully.");
  }

  console.log("ALL SCENARIOS PASSED.");
} catch (e) {
  console.error("FAILED", e);
  process.exitCode = 1;
}
