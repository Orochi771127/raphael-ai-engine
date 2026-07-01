# Phase 6 Canon Retrieval Lab Report

Date: 2026-07-01

## Scope

Phase 6 adds an offline, source-attributed canon retrieval lab for Raphael AI Engine.

It does not:

- call external model APIs;
- use public web search;
- import LangGraph runtime into NexusLink;
- mutate NexusLink save data, companion data, Pixi renderer state, or frontend runtime;
- make retrieved lore the final player-facing authority.

## Implemented

- `corpus/nexuslink-canon-cards.json`
  - reviewed canon cards with explicit source path and line ranges;
  - source policy requires citation before answering;
  - unknown or unsupported claims must abstain.
- `core/canonRetrievalPolicy.js`
  - deterministic keyword retrieval;
  - citation-first output;
  - abstention when no approved source is matched;
  - advisory metadata: `trusted: false`, no direct game mutation, no memory write.
- `training/canon-retrieval/canon-retrieval-cases.json`
  - known canon questions;
  - unsupported lore questions;
  - safety and authority boundary cases.
- `tests/canon-retrieval.test.mjs`
  - verifies corpus review metadata;
  - verifies citations on every answered case;
  - verifies abstention has no answer and no citation;
  - verifies no memory write and no direct game mutation.
- `training/run-canon-retrieval-eval.mjs`
  - deterministic Phase 6 eval runner.

## Current Source Set

The first canon corpus uses approved local NexusLink documents:

- `AGENTS.md`
  - project identity;
  - RaphaelCore / Companion Shell boundary;
  - commercial model;
  - emotional contracts and red lines;
  - static frontend technical boundary;
  - single-active-companion runtime model;
  - Linkara world and faction model.
- `docs/raphael/RAPHAEL_CONSTITUTION.md`
  - RaphaelCore as Soul Origin;
  - RaphaelCore as Stateful Companion Cognition Agent.
- `docs/architecture/RAPHAEL_SOUL_ARCHITECTURE_V1.md`
  - Raphael is not GPT;
  - external models advise only;
  - Core vs Gateway authority boundary.
- `ACCEPTANCE.md`
  - safety red-line acceptance checks.

## Self-Review

Pass:

- Answers are copied from curated `canonicalAnswer` fields, not generated from raw documents.
- Every answered case includes source path and line range metadata.
- Unsupported questions abstain with a stable "insufficient reviewed source" response.
- Retrieval output is advisory and marked `trusted: false`.
- Retrieval cannot write memory, mutate game state, or create gameplay reward.
- NexusLink runtime remains untouched.

## QA Results

Passed:

- `node --check` for all JavaScript and MJS files.
- `node tests/canon-retrieval.test.mjs`: `12/12` cases, `10` corpus cards.
- `node training/run-canon-retrieval-eval.mjs`: `12/12` cases.
- `node tests/engine-contract.test.mjs`: `8` assertions.
- `node tests/image-derived-knowledge.test.mjs`: `5` cases.
- `node tests/local-learning-sidecar.test.mjs`: `18` assertions.
- `node training/run-eval.mjs`: `11/11` cases.
- `node training/run-phase-4-expanded-eval.mjs`: `167/167` cases.
- `node training/run-conversation-lab.mjs`: `6/6` scripts.
- `node adapters/nexuslink/run-probe.mjs`: `9/9` probe cases.
- `git diff --check`.
- No `fetch`, API key, external model call, DOM, Pixi, or NexusLink runtime dependency in `core/`.
- NexusLink worktree remained clean.

Limitations:

- Retrieval is deterministic keyword matching, not semantic embedding search.
- Corpus coverage is intentionally small and manually curated.
- Current lab is not wired into NexusLink live Soul Talk.
- Corpus updates still require human review; this is not automatic lore ingestion.

## Recommendation

`READY_FOR_PHASE_7_CRITIC_AND_REFLECTION_LOOP`

Not ready for:

- NexusLink live runtime replacement;
- global training;
- unreviewed canon ingestion;
- public web retrieval;
- frontend API/model calls.
