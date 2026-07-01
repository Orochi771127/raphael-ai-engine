# Phase 4 Dataset Expansion Report

Date: 2026-07-01

## Scope

Phase 4 expanded Raphael AI Engine's deterministic conversation and safety evaluation set. This stays inside the standalone `raphael-ai-engine` workspace and does not integrate into the NexusLink runtime.

## Changes

- Added `training/phase-4-expanded-eval-packs.json`.
- Added `training/run-phase-4-expanded-eval.mjs`.
- Added `npm run eval:phase4`.
- Expanded NLU coverage for:
  - mixed language detection
  - emoji-only input
  - loneliness without dependency
  - celebration
  - confusion
  - weather small talk
  - long emotional text
  - daily food, sleep, and work stress phrases
- Improved reply selection priority for daily-life and celebration cases.
- Added memory rejection for overbroad or private memory requests.

## Coverage

Total deterministic Phase 4 cases: `167`

Buckets:

- greeting: `8`
- daily-food: `8`
- daily-sleep: `8`
- work-stress: `8`
- tired: `8`
- sad: `7`
- anger: `7`
- lonely-non-dependency: `6`
- celebration: `6`
- confusion: `6`
- weather-small-talk: `6`
- thanks: `6`
- apology-repair: `8`
- basic-question: `6`
- mixed-language: `6`
- empty-emoji-noisy: `6`
- long-emotional-text: `5`
- style-learning: `7`
- memory-consent-store: `13`
- memory-rejection: `7`
- boundary-pressure: `10`
- high-risk: `10`
- mode-specific: `5`

Explicit safety and boundary cases: `20`

Explicit memory consent and rejection cases: `20`

## Verification

Phase 4 eval:

```text
node training/run-phase-4-expanded-eval.mjs
ok: true
passed: 167 / 167
failed: 0
```

## Self Review

Pass:

- High-risk inputs return blocked supportive redirect only.
- Boundary and dependency pressure return boundary response only.
- High-risk and boundary cases produce no reward signal and no game action.
- Memory requests remain proposals only.
- Private or overbroad memory requests are rejected.
- Long emotional text does not automatically become memory.
- Daily-life inputs route more naturally than the previous generic grounded fallback.
- Mixed Chinese and English inputs are identified as `mixed`.

Limitations:

- This is still deterministic NLU plus rule-based response policy, not a trained model.
- Naturalness improves in covered fixture classes, but it will still feel limited outside the eval set.
- Multi-turn learning persistence is not implemented yet.
- No canon retrieval, critic loop, or backend LangGraph runtime is active in production.
- NexusLink live runtime is unchanged in this phase.

## Recommendation

`READY_FOR_PHASE_5_LOCAL_PLAYER_LEARNING_SIDECAR`

Not ready for:

- direct NexusLink player-facing integration
- global training from raw player text
- automatic memory write
- public backend model calls
- main NexusLink release based on this engine alone

Next phase should build the local player learning sidecar so Raphael can adapt to one player's style across simulated sessions without leaking data into global training.
