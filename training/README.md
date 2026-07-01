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

Use `eval-cases.json` for current deterministic smoke evaluation.
