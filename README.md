# Raphael AI Engine

Raphael AI Engine is a standalone, game-neutral companion cognition engine. It is designed so NexusLink can remain the first official testbed while future games can connect through adapters instead of copying NexusLink internals.

Current status: `v0.1.0` contract-first mock engine.

- No OpenAI, Anthropic, Grok, or external model API.
- No LangGraph runtime dependency in NexusLink.
- No NexusLink DOM, Pixi, store, or save dependency inside `core/`.
- Engine output is advisory and structured; game adapters decide what can be applied.
- Safety, boundary, memory proposals, and learning metadata stay explicit and auditable.

## Structure

- `core/`: pure Raphael logic.
- `contracts/`: game-neutral request/response schema and examples.
- `adapters/nexuslink/`: NexusLink-specific adapter boundary.
- `adapters/generic-game/`: reference adapter for future games.
- `gateway/`: future backend and LangGraph workflow notes.
- `training/`: eval cases and deterministic local evaluation.
- `tests/`: engine and adapter contract tests.

## Run

```bash
node tests/engine-contract.test.mjs
node tests/image-derived-knowledge.test.mjs
node tests/local-learning-sidecar.test.mjs
node tests/canon-retrieval.test.mjs
node tests/critic-policy.test.mjs
node tests/gateway-maturity.test.mjs
node training/run-eval.mjs
node training/run-phase-4-expanded-eval.mjs
node training/run-canon-retrieval-eval.mjs
node training/run-critic-reflection-eval.mjs
node training/run-gateway-maturity-eval.mjs
node training/run-conversation-lab.mjs
node adapters/nexuslink/run-probe.mjs
```

On the Codex Windows workspace, use the bundled Node runtime if `node` is not on `PATH`:

```powershell
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\engine-contract.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\image-derived-knowledge.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\local-learning-sidecar.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\canon-retrieval.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\critic-policy.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\gateway-maturity.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-phase-4-expanded-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-canon-retrieval-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-critic-reflection-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-gateway-maturity-eval.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-conversation-lab.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" adapters\nexuslink\run-probe.mjs
```

## Integration Rule

NexusLink should not import Raphael internals directly. It should call a narrow adapter:

```text
NexusLink state -> Raphael contract -> Raphael engine -> NexusLink adapter result
```

The adapter may create chat candidates, animation intents, habitat traces, or memory proposals. It must not directly mutate save state, companion data, Pixi renderer state, or final player-facing output without a game-side policy gate.

The NexusLink probe runner verifies that this boundary remains intact before any live testbed integration:

```bash
node adapters/nexuslink/run-probe.mjs
```

## Learning Model

Learning is split into three layers:

- Local player learning: stored per player/game instance.
- Game-specific tuning: NexusLink-specific canon, evals, and response policy.
- Global Raphael training: anonymous, redacted, summarized, human-reviewed data only.

This v0 implements local learning signals as structured proposals. It does not perform global training or ingest raw player text into shared datasets.

## Agentic Pattern Training Plan

The current training roadmap derived from `Agentic Design Patterns` is documented here:

- `docs/RAPHAEL_AGENTIC_DESIGN_PATTERNS_TRAINING_PLAN.md`
- `training/agentic-pattern-map.json`

Phase 4 dataset expansion status:

- `docs/PHASE_4_DATASET_EXPANSION_REPORT.md`
- `training/phase-4-expanded-eval-packs.json`
- `npm run eval:phase4`

Image knowledge intake and Phase 5 local learning:

- `docs/IMAGE_KNOWLEDGE_INTAKE_REPORT.md`
- `docs/PHASE_5_LOCAL_LEARNING_SIDECAR_REPORT.md`
- `corpus/creature-body-language.json`
- `corpus/wellbeing-soft-context.json`
- `npm run test:image-knowledge`
- `npm run test:local-learning`

Phase 6 canon retrieval lab:

- `docs/PHASE_6_CANON_RETRIEVAL_LAB_REPORT.md`
- `corpus/nexuslink-canon-cards.json`
- `training/canon-retrieval/canon-retrieval-cases.json`
- `npm run test:canon-retrieval`
- `npm run eval:canon`

Canon retrieval answers only when a reviewed source card is matched. Unsupported or unapproved claims abstain instead of inventing lore.

Phase 7 critic and reflection loop:

- `docs/PHASE_7_CRITIC_REFLECTION_LOOP_REPORT.md`
- `core/criticPolicy.js`
- `training/critic-reflection/critic-reflection-cases.json`
- `npm run test:critic`
- `npm run eval:critic`

The critic can revise unsafe gameplay framing, false intimacy, template-like replies, and canon answers without reviewed citations. It exposes issue codes only, not chain-of-thought.

Phase 8 backend gateway maturity:

- `docs/PHASE_8_BACKEND_GATEWAY_MATURITY_REPORT.md`
- `gateway/mock-gateway.js`
- `training/gateway-maturity/gateway-maturity-cases.json`
- `npm run test:gateway`
- `npm run eval:gateway`

The gateway remains mock-only and keyless. Gateway advisors are `trusted: false` and cannot override RaphaelCore safety, boundary, memory, response, or reward policy.
