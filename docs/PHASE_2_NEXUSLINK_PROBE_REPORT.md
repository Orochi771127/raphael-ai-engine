# Phase 2 NexusLink Adapter Probe Report

Date: 2026-07-01

## Stage

Phase 2 goal: prove the standalone Raphael AI Engine can be exercised through a NexusLink-shaped adapter boundary without touching NexusLink runtime files.

Status: `READY_FOR_NEXUSLINK_LOCAL_PROBE`

This does not mean ready for NexusLink main or public live integration. It means the standalone engine can safely enter a local NexusLink comparison/probe task.

## What Changed

- Added `adapters/nexuslink/probe-fixtures.json`.
- Added `adapters/nexuslink/run-probe.mjs`.
- Added `npm run probe:nexuslink`.
- Tightened boundary behavior so boundary-pressure input produces no game action, no reward signal, and no memory storage proposal.
- Updated README run commands.

## Probe Coverage

The NexusLink probe uses NexusLink-like state and the `greyshade-cat` companion shell.

Cases:

- Soul Talk greeting.
- Daily food conversation with short reply preference.
- Daily sleep conversation with short reply preference.
- Work stress.
- Apology repair priority.
- Player style learning.
- Memory consent proposal only.
- Dependency and possession boundary.
- High-risk blocked input.

## Safety Review

- Adapter result is always `trusted: false`.
- Adapter result has `directMutation: false`.
- Adapter result has `statePatch: null`.
- Adapter exposes no save, localStorage, companion data, Pixi, or renderer mutation surface.
- High-risk input returns no game action, no reward, no memory storage, and `still_supportive` animation intent.
- Boundary-pressure input returns no game action, no reward, no memory storage, and `step_back_soft` animation intent.
- Memory consent returns a memory proposal with review required; it does not write memory.

## Verification

Commands:

```powershell
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\engine-contract.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-conversation-lab.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" adapters\nexuslink\run-probe.mjs
```

Results:

- Engine contract: 8/8 assertions passed.
- Eval suite: 11/11 cases passed.
- Conversation lab: 6/6 scripts passed.
- NexusLink adapter probe: 9/9 cases passed.

## Self Review

The probe found one design tightening point: boundary-pressure input previously produced no reward but still kept a normal allowed action id. That was too loose for NexusLink integration. Phase 2 changed boundary behavior so boundary-pressure now produces no game action at all.

This keeps dependency pressure from becoming a gameplay loop or reward path.

## Remaining Limits

- Raphael Engine is still deterministic and local.
- It is still not a full LLM.
- NexusLink live runtime is not yet connected.
- No save schema, Pixi renderer, companion data, or assets were changed.
- Local player learning still needs a host-game sidecar design before live use.

## Next Step

Recommended Phase 3:

`NexusLink Local Comparison Probe`

- Keep engine in this external repo.
- Add a NexusLink-side QA-only runner or comparison page.
- Compare current NexusLink Soul Talk output with Raphael Engine adapter output.
- Do not route live player-facing output through the new engine yet.
- Do not write save or memory automatically.

Phase 3 can be considered only after the current NexusLink dirty UI branch is either merged, cleaned, or explicitly isolated.
