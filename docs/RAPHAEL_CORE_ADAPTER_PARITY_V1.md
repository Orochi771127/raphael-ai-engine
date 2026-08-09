# Raphael Core Adapter Parity V1

Status: implementation candidate; not a live Nexus Link integration.

## Purpose

Provide one narrow canonical Core port that both the embedded standalone turn
and `raphael-HMAX` can call without granting a model, gateway or game client
RaphaelCore authority.

## Public adapter

```text
safetyPreflight(text)
finalizeCandidate({ request, candidate, memorySummaries, safety, signal })
health()
coreVersion
contractVersion
```

`safetyPreflight` is deterministic and must run before any network/model call.
`finalizeCandidate` accepts only a `trusted:false` wording candidate. It may
replace the candidate; the candidate cannot propose memory, effects, state,
reward, Growth, relationship deltas, tools or commands.

## Fixed order

```text
strict immutable request
→ local high-risk / role / dependency / reality / forget route
→ at most three authorized summaries (transport-owned)
→ untrusted wording candidate
→ professional-role / medication / dependency / delusion critic
→ false-memory / no-question / no-advice critic
→ deterministic affect and memory eligibility
→ strict final Raphael decision
```

High-risk routes return `terminal:true`, `networkAllowed:false`, no affect
intimacy signal, no memory and no effect. HMAX rejects any high-risk turn that
reaches the hosted boundary because the Edge terminal should already have
handled it.

## Authority

| Surface | Authority |
|---|---|
| Safety, speech, boundary, memory eligibility | RaphaelCore |
| Candidate wording | Untrusted model input only |
| Persistence | MemoryPort after player/product decision |
| Game mutation | NexusLinkReducer |
| Hosted auth, tenant isolation, rate limiting | HMAX |

## Memory

- Retention `none` or `session`: no durable proposal.
- Official Care, any safety/policy category and any forget request: no proposal.
- Non-sensitive daily preference/event with `minimal`: at most one minimal
  proposal.
- Sensitive content: only an explicit `請記住`-style instruction may produce a
  `sensitive_consented` proposal.
- Crisis, acute medical, active violence and self/other-harm content are never
  eligible even when requested.

## Autonomy correction

The legacy standalone `idleHours/lastInteractionTime` welcome-back trigger is
removed. Ambient initiative now requires a current explicit emotion signal or
current game event and enforces RA-1 boot quiet 90 seconds, interval 240
seconds and session cap 2. Absence/login/loneliness fields are ignored.

## Release boundary

This package does not switch `soulTalkController → runRaphaelCore` and does not
deploy HMAX. A later Nexus Link shadow-client package must prove stale-result,
timeout, kill-switch, real UI and protected-main release gates before any hosted
speech becomes player-visible.

## Verification snapshot — 2026-08-09

- Engine Node test suite: `28/28 PASS`.
- Adapter parity plus sovereign runtime: `10/10 PASS`; the sealed routing
  fixture includes Traditional Chinese, Simplified Chinese and English cases.
- Canon retrieval: `12/12 PASS`; critic: `6/6 PASS`; gateway maturity:
  `7/7 PASS`; conversation lab: `6/6 PASS`.
- Existing Nexus adapter probe: `9/9 PASS`.
- Explicit memory recall is accepted only when its claim has grounding in one
  of the at most three authorized summaries; missing or mismatched recall is
  replaced with uncertainty rather than presented as memory.
- Real `raphael-HMAX` CoreCriticPort import and adapter finalization: `PASS`.
- Clean Nexus Link `origin/main` evidence: safety terminal `56/56 PASS`, sealed
  conversation hard gates `48/48 PASS` with zero quality flags, sealed RA-1
  autonomy `32/32 PASS` and advisory `trusted:false`.
- Human blind review and Owner feel-check remain open; no player-visible rollout
  is authorized by these machine results.

Two legacy training runners remain red at their unchanged baseline: `10/11`
and `132/167`. A read-only run on base commit
`42f6bbbd3e395861d3aa17a51fc1a5db8e4f4387` produced the same totals and the
same stale expected style names. They are recorded as pre-existing fixture debt,
not hidden or rewritten inside this safety/adapter package.
