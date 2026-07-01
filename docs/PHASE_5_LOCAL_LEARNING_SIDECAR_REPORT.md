# Phase 5 Local Player Learning Sidecar Report

Date: 2026-07-01

## Scope

Phase 5 adds a local player learning sidecar for Raphael AI Engine. The sidecar lets one player's preferences persist across simulated sessions while staying outside global training and outside NexusLink's save schema.

## Added Artifacts

- `core/localLearningSidecar.js`
- `tests/local-learning-sidecar.test.mjs`

## What The Sidecar Stores

Persistable local preference keys:

- `replyLengthBias`
- `questionTolerance`
- `templateSensitivity`
- `positiveStyleSignal`

Transient keys blocked from persistence:

- `memoryConsentSignal`

The sidecar stores preference patches by local scope:

```text
gameId:playerId:actorId
```

This keeps one player and one actor's learned preferences separate from another player or actor.

## Hard Boundaries

- No raw player input stored.
- No global training export.
- No automatic memory write.
- No NexusLink save schema change.
- No companion data mutation.
- No Pixi or DOM dependency.
- High-risk and boundary turns do not update the sidecar.

## Current Behavior

Example flow:

```text
player: "短一點。"
-> learningProfileUpdate.replyLengthBias = "short"
-> sidecar stores replyLengthBias for gameId:playerId:actorId

next session:
player: "我不知道晚餐吃什麼。"
-> sidecar injects learningProfile.replyLengthBias = "short"
-> Raphael uses compact daily-life reply
```

Memory consent remains separate:

```text
player: "你可以記得這件事..."
-> memoryProposal.shouldStore = true
-> requiresReview = true
-> sidecar does not persist memoryConsentSignal
```

## Verification

Local learning sidecar test:

```text
node tests/local-learning-sidecar.test.mjs
ok: true
```

## Recommendation

`READY_FOR_PHASE_6_CANON_RETRIEVAL_LAB`

Not ready for:

- direct NexusLink save integration
- automatic memory writes
- global training from player text
- backend model calls

The next step should be an offline canon retrieval lab with source-attributed answers and abstention behavior.
