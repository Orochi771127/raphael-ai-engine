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
node training/run-eval.mjs
node training/run-conversation-lab.mjs
node adapters/nexuslink/run-probe.mjs
```

On the Codex Windows workspace, use the bundled Node runtime if `node` is not on `PATH`:

```powershell
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" tests\engine-contract.test.mjs
& "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" training\run-eval.mjs
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
