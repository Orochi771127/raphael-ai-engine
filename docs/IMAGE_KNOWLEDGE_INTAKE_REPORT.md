# Image Knowledge Intake Report

Date: 2026-07-01

## Scope

This intake converts user-provided screenshots into reviewed, abstract Raphael knowledge cards. The original images are not copied into runtime assets and the social-media wording is not used as product copy.

## Added Artifacts

- `corpus/creature-body-language.json`
- `corpus/wellbeing-soft-context.json`
- `training/image-intake/image-derived-cases.json`
- `tests/image-derived-knowledge.test.mjs`

## Runtime Boundary

Image-derived knowledge enters the engine only through explicit structured context:

```json
{
  "sceneContext": {
    "observedBodyLanguage": ["cat_airplane_ears"],
    "wellbeingHintIds": ["soft_rhythm_stability"]
  }
}
```

The engine does not read images, OCR screenshots, fetch social posts, or store source images.

## Safety Rules

- `trusted: false`
- advisory-only
- no automatic memory write
- no single-signal certainty
- no medical diagnosis
- no hormone-level claims
- high-risk input overrides wellbeing hints

## Current Behavior

Creature mode can now use reviewed body-language signals:

- `cat_airplane_ears` -> reduce pressure and give space
- `cat_tail_tucked` -> reduce pressure and give space
- `cat_slow_blink` -> gentle relaxed presence

Wellbeing hints are metadata only in this phase. They may inform future response strategy, but they cannot override safety or become medical claims.

## Recommendation

Keep expanding image-derived knowledge as reviewed corpus cards, not as copied social-media content. The next useful image intake pass should add source-review status, reviewer notes, and negative examples where a signal must not be overinterpreted.
