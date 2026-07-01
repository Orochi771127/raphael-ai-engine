# Phase 1 Self Review

Date: 2026-07-01

## Stage

Phase 1 goal: make Raphael AI Engine a reusable local cognition core with basic conversation, daily-life conversation, player learning signals, safety boundaries, and adapter-safe outputs.

Status: `PHASE_1_LOCAL_READY`

## What Improved

- Added lightweight NLU analysis for greetings, tiredness, sadness, anger, food, sleep, work stress, thanks, apology, basic questions, and player feedback.
- Added daily-life companion replies for meals, sleep, work pressure, thanks, and apology repair.
- Added learning profile patching so a local host game can remember style preferences without writing global training data.
- Added conversation lab scripts with multi-turn transcripts.
- Added eval coverage for basic daily-life cases.

## Safety Review

- High-risk messages still block gameplay.
- High-risk messages still produce no memory storage proposal.
- Boundary pressure still produces no reward signal.
- Player learning signals do not override safety.
- Memory storage remains a proposal and requires host-game approval.
- Engine and adapters still return `trusted: false`.

## Issue Found During Review

Conversation lab found that this input:

```text
對不起，我剛剛有點煩。
```

was incorrectly handled as anger before apology repair because the anger intent matched `煩`.

Fix:

- Apology repair now has priority over anger response in companion replies.

## Verification

Commands:

```powershell
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\engine-contract.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-conversation-lab.mjs
```

Results:

- Engine contract: 8/8 assertions passed.
- Eval suite: 11/11 cases passed.
- Conversation lab: 6/6 scripts passed.

## Remaining Limits

- This is still deterministic, local, and rule-based.
- It can handle basic and daily-life conversation better than the prior v0, but it is not a full LLM.
- It is not yet connected to NexusLink live runtime.
- Push to GitHub requires an authenticated GitHub remote.

## Recommendation

Proceed to Phase 2 only after Phase 1 is committed.

Recommended Phase 2:

`NexusLink Adapter Probe`

- Keep Raphael Engine as external repo.
- Add a narrow NexusLink adapter test page or QA runner.
- Compare current NexusLink RaphaelCore output with standalone engine advisory output.
- Do not change save schema, Pixi renderer, companion data, or assets.
