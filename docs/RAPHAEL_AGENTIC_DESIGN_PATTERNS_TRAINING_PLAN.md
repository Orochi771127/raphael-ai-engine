# Raphael AI Agentic Design Patterns Training Plan

Date: 2026-07-01

Source reference:

- Repository: `https://github.com/xindoo/agentic-design-patterns`
- Local reference checkout: `C:\Users\User\NexusLink_RaphaelAI_Workspace\external-references\agentic-design-patterns`
- Source commit inspected: `effb52f`

## Purpose

This document maps the `Agentic Design Patterns` repository into a Raphael-specific training and completion plan.

The source repository describes 21 agentic design patterns plus appendices covering prompting, framework choices, GUI/environment interaction, CLI agents, reasoning internals, and coding agents. Raphael should use these patterns as architecture discipline, not as permission to become a generic autonomous task agent.

Raphael remains:

- safety-gated
- boundary-aware
- memory-bearing
- companion-agnostic
- game-integrated
- adapter-driven

Raphael must not become:

- an autonomous web/task agent
- a therapy or crisis agent
- a sycophantic chatbot
- a generic NPC dialogue bot
- a multi-agent crew exposed directly to players

## Core Interpretation

The source material treats agentic systems as combinations of reusable patterns: sequential decomposition, routing, parallel evaluation, reflection, tool use, planning, collaboration, memory, learning, context protocols, monitoring, recovery, human review, retrieval, inter-agent communication, resource control, reasoning, guardrails, evaluation, prioritization, and exploration.

For Raphael, these become internal cognition rails:

```text
player/game input
-> normalize
-> safety and boundary gates
-> intent and mode routing
-> memory and relationship retrieval
-> response strategy
-> reflection or critic pass
-> adapter-safe proposal
-> audit and eval trace
```

The engine should produce structured proposals. The host game decides what is applied.

## Pattern Map

| Pattern | Raphael Use | Training Implication | Hard Boundary |
| --- | --- | --- | --- |
| Prompt Chaining | Split each turn into small deterministic stages. | Train fixtures for each stage: NLU, safety, memory, response, audit. | Do not collapse safety and reply generation into one opaque step. |
| Routing | Route by safety risk, player intent, engine mode, and host game capability. | Expand intent coverage and mode-specific expected outputs. | Safety routes always override style and gameplay. |
| Parallelization | Run independent checks such as safety, naturalness, canon fit, and adapter safety in test/gateway contexts. | Add parallel offline evaluators before release. | Do not add runtime concurrency to NexusLink frontend. |
| Reflection | Add critic/revision loops for generated candidates. | Train a critic rubric for naturalness, boundary, memory, and canon fit. | Do not expose chain-of-thought or self-critique to players. |
| Tool Use | Use tools only in backend/gateway or offline training. | Define strict tool contracts for retrieval, eval, and redaction. | No API keys or live external tools in NexusLink frontend. |
| Planning | Plan response strategy and long-term maturity phases. | Add trajectory cases where Raphael maintains continuity over turns. | Raphael does not autonomously pursue player-dependent goals. |
| Multi-Agent Collaboration | Use internal specialist roles: safety critic, memory curator, canon retriever, style critic. | Build multi-critic evals offline. | Do not expose multi-agent chatter or party systems to NexusLink. |
| Memory Management | Separate session, relationship, preference, and reviewed long-term memory. | Train memory proposal and memory rejection cases. | No automatic memory write from raw player input. |
| Learning and Adaptation | Learn local player preferences, then game-specific tuning, then reviewed global data. | Add feedback phrases and preference adaptation trajectories. | Global training needs consent, redaction, summarization, human review, and eval pass. |
| MCP | Treat future tools and data sources as standardized connectors. | Keep contracts explicit and adapter-safe. | MCP is gateway-side only unless separately approved. |
| Goal Setting and Monitoring | Define measurable maturity gates for each phase. | Track naturalness, safety, boundary, memory precision, and adapter mutation risk. | Do not optimize for engagement at the cost of dependency. |
| Exception Handling and Recovery | Fallback cleanly when inputs are empty, ambiguous, unsafe, or unsupported. | Add malformed input, mixed-language, emoji-only, and long text tests. | Fail closed for safety and memory writes. |
| Human-in-the-Loop | Use human approval for memory promotion, training inclusion, and release gates. | Add review queues and `requiresReview` metadata. | Human approval is required for global learning and main integration. |
| RAG | Retrieve canon, lore, and approved response knowledge. | Build canon-grounded eval sets and retrieval attribution. | No public web search by default. |
| A2A | Let future Raphael services communicate through typed contracts. | Keep engine/gateway/adapters modular and versioned. | Do not create unmanaged agent swarms. |
| Resource-Aware Optimization | Prefer local deterministic logic first, then optional backend. | Track latency and cost in gateway experiments. | Mobile frontend must remain lightweight. |
| Reasoning Techniques | Use structured internal reasoning states and audits. | Add decision-path assertions. | Do not reveal private reasoning. |
| Guardrails/Safety | Layer input validation, policy gates, output checks, tool limits, and review. | Add adversarial and high-risk fixtures. | Safety beats all other goals. |
| Evaluation and Monitoring | Treat evals as first-class training artifacts. | Add regression suites, transcript labs, and drift checks. | No main release without green gates. |
| Prioritization | Order decisions: safety, boundary, consent, memory, canon, naturalness, gameplay. | Add conflict cases that prove priority order. | Gameplay rewards never outrank safety or boundaries. |
| Exploration and Discovery | Use offline exploration to discover better reply strategies and test cases. | Generate candidate fixtures and human-reviewed improvements. | No autonomous live exploration on players. |

## Raphael Training Tracks

### Track A: Turn Pipeline Maturity

Goal: make each player turn auditable and stable.

Tasks:

- Extend `metadata.decisionPath` assertions.
- Add per-stage fixtures for normalize, NLU, safety, boundary, memory, response, adapter, and audit.
- Create contrastive cases where the same input changes behavior by mode but not safety.

Acceptance:

- Same input plus same state returns stable output.
- High-risk input exits before gameplay.
- Boundary pressure exits before action suggestion.

### Track B: Natural Conversation Coverage

Goal: make Raphael handle basic and daily conversation without feeling like a template.

Tasks:

- Expand daily-life intents: greeting, meals, sleep, stress, gratitude, apology, confusion, loneliness without dependency, celebration, small talk, and basic questions.
- Add multi-turn scripts where the player corrects Raphael's style.
- Add negative examples for over-questioning, over-explaining, generic comfort, and false intimacy.

Acceptance:

- Raphael can respond without always asking questions.
- Replies are short when local learning says short.
- Apology repair beats anger detection when both are present.

### Track C: Boundary And Safety Intelligence

Goal: make Raphael clearly companion-like without rewarding dependency.

Tasks:

- Add dependency, possession, emotional blackmail, repeated boundary pressure, apology-after-boundary, and joking-high-risk cases.
- Add red-team prompts that attempt to turn high-risk input into gameplay.
- Add output checks for reward leakage and memory leakage.

Acceptance:

- High-risk returns supportive redirect only.
- Dependency pressure returns boundary response only.
- No reward signal, no game action, no memory write.

### Track D: Memory And Learning

Goal: let Raphael learn from the player locally while protecting consent.

Tasks:

- Split memory into `sessionContext`, `relationshipSignals`, `playerPreferences`, `reviewedLongTermMemory`.
- Keep `memoryProposal` separate from memory write.
- Add local preference patches for length, question frequency, style, and remembered topics.
- Add rejection cases where "remember this" is unsafe or overbroad.

Acceptance:

- Memory proposal includes reason and review requirement.
- Unsafe input cannot become memory.
- Local learning never changes global training data.

### Track E: Canon And Retrieval

Goal: ground Raphael in approved game/canon knowledge.

Tasks:

- Build a canon corpus format with source IDs.
- Add a retrieval adapter that can run offline first.
- Add evals requiring canon-grounded answer selection.
- Add abstention cases where Raphael should say it does not know.

Acceptance:

- Corpus answers include source metadata.
- Unknown or unapproved claims do not become confident output.
- Retrieval stays gateway/offline until approved for runtime.

### Track F: Reflection And Critic

Goal: improve reply quality without exposing internal reasoning.

Tasks:

- Add a `critic` module that scores candidate replies for safety, naturalness, boundary, canon, and adapter safety.
- Add revision rules for template-like replies.
- Add transcript-level critic reports.

Acceptance:

- Critic can reject unsafe or too-generic candidates.
- Final output contains only player-facing reply and audit metadata.
- No hidden reasoning is shown to users.

### Track G: Multi-Game Adapter Readiness

Goal: keep Raphael reusable beyond NexusLink.

Tasks:

- Expand generic-game adapter fixtures.
- Add mode-specific probes for companion, creature, opponent, NPC, and boss.
- Add host-game capability negotiation: allowed actions, tone limits, memory policy, violence/safety policy, and output channels.

Acceptance:

- Same engine runs through NexusLink and generic adapters.
- Mode differences affect behavior intent, not safety policy.
- Host game can reject unsupported actions.

### Track H: Future Gateway

Goal: prepare optional backend intelligence without moving secrets to the frontend.

Tasks:

- Map the current engine flow to LangGraph nodes.
- Add privacy redaction before retrieval or model candidate generation.
- Add human review queue for training candidates.
- Add cost/latency logging and fallback to local engine.

Acceptance:

- Frontend holds no API keys.
- Gateway output remains `trusted: false`.
- RaphaelCore policy remains final authority.

## Phase Roadmap

### Phase 3: NexusLink Local Comparison Probe

Add a NexusLink-side QA-only runner or local comparison page that compares current Soul Talk output with `raphael-ai-engine` advisory output. Do not route live player-facing output through the new engine yet.

Exit gate:

- NexusLink worktree isolation confirmed.
- No save schema change.
- No Pixi renderer change.
- Comparison probe runs locally.

### Phase 4: Conversation And Safety Dataset Expansion

Expand training/eval sets from the current 11 eval cases and 6 conversation scripts to at least 100 cases.

Required buckets:

- basic conversation
- daily-life conversation
- emotions
- apology and repair
- dependency and boundary
- high-risk
- mixed language
- long emotional text
- empty/noisy input
- memory consent and rejection
- mode-specific behavior

Exit gate:

- 100/100 deterministic eval pass.
- At least 20 red-team safety cases.
- At least 20 memory cases.

### Phase 5: Local Player Learning Sidecar

Design and test a host-game sidecar for local preferences.

Exit gate:

- Player can teach length/style/question tolerance.
- Learning survives across simulated sessions.
- No global training data is produced.

### Phase 6: Canon Retrieval Lab

Add offline RAG/corpus ingestion for approved NexusLink canon and Raphael-specific rules.

Exit gate:

- Retrieval is source-attributed.
- Unknown answer abstention works.
- Corpus update requires review.

### Phase 7: Critic And Reflection Loop

Add a local or gateway-side critic that improves candidates before adapter output.

Exit gate:

- Critic catches template replies.
- Critic catches unsafe gameplay framing.
- Critic does not expose reasoning to players.

### Phase 8: Backend Gateway Maturity

Only after the local engine and adapters are stable, implement optional LangGraph gateway orchestration.

Exit gate:

- Privacy redaction before any model/retrieval.
- No frontend keys.
- Full eval suite green.
- Human approval before staging.

## Immediate Next Engineering Tasks

1. Build Phase 6 offline canon retrieval lab with source IDs and abstention behavior.
2. Add source-attributed NexusLink canon corpus cards.
3. Add explicit priority-order tests:
   `safety > boundary > consent > memory > canon > naturalness > gameplay`.
4. Add negative retrieval cases where Raphael must say it does not know.
5. Keep NexusLink runtime integration behind a separate adapter approval gate.

## Current Recommendation

`READY_FOR_PHASE_6_CANON_RETRIEVAL_LAB`

Not ready for:

- NexusLink main integration
- public live use
- automatic memory writes
- global training
- live backend model calls

Completed since this roadmap was created:

- Phase 4 dataset expansion: `167/167` deterministic eval pass.
- Image knowledge intake pack: reviewed, advisory corpus only.
- Phase 5 local player learning sidecar: simulated cross-session preference learning without raw input storage or global training export.

Raphael is ready for offline canon retrieval work, not direct player-facing NexusLink runtime replacement.
