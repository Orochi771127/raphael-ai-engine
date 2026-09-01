# Training And Evaluation

This v0 does not train a neural model. It creates the data and evaluation boundary needed before training is allowed.

Learning layers:

- Local player learning: per player/game instance, stored by the host game.
- Game-specific tuning: NexusLink canon and evals.
- Global Raphael training: anonymous, redacted, summarized, human-reviewed data only.

Before any global training data is accepted:

1. Player consent exists.
2. Private details are redacted.
3. Raw text is summarized.
4. A human approves the training item.
5. The eval suite passes after inclusion.

Current deterministic evaluation files:

How to add cases: `skills/raphael-eval-author/SKILL.md`. Canon cards: `skills/raphael-canon-intake/SKILL.md`.

Current deterministic evaluation files:

- `eval-cases.json`: base smoke evaluation.
- `conversation-scripts.json`: multi-turn conversation lab.
- `phase-4-expanded-eval-packs.json`: expanded conversation, safety, memory, and mode coverage.
- `image-intake/image-derived-cases.json`: reviewed image-derived knowledge behavior cases.
- `canon-retrieval/canon-retrieval-cases.json`: source-attributed NexusLink canon retrieval and abstention cases.
- `critic-reflection/critic-reflection-cases.json`: local critic and conservative revision cases.
- `gateway-maturity/gateway-maturity-cases.json`: mock backend gateway authority, privacy, disabled-tool, and advisory-only cases.

Phase 5 local learning is tested in `tests/local-learning-sidecar.test.mjs`; it is a host-side sidecar model, not global training.

Phase 6 canon retrieval is tested in `tests/canon-retrieval.test.mjs` and `training/run-canon-retrieval-eval.mjs`. It can answer only when the response includes reviewed source metadata; unsupported claims must abstain.

Phase 7 critic reflection is tested in `tests/critic-policy.test.mjs` and `training/run-critic-reflection-eval.mjs`. It catches unsafe gameplay framing, false intimacy, template-like replies, and missing canon sources without exposing private reasoning.

Phase 8 backend gateway maturity is tested in `tests/gateway-maturity.test.mjs` and `training/run-gateway-maturity-eval.mjs`. It keeps frontend keys out of scope and proves gateway advisors cannot override RaphaelCore authority.
