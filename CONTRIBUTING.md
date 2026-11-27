# Contributing to Shapeweaver

Read [game design](docs/game-design.md), [campaign](docs/campaign.md), [roadmap](docs/roadmap.md) and [architecture](docs/architecture.md) before implementation.

PR00 bootstraps main directly; subsequent work uses one focused branch/PR at a time, based on merged main. Label planned stages in titles (actual GitHub numbers may differ). No unrelated feature expansion. Document follow-up work rather than hiding unfinished tasks. Review/merge before starting the next stage.

## Definition of done
- Scope and acceptance criteria satisfied; tests added or updated.
- All transformations require mathematical inputs and use world geometry.
- No hard-coded intended-answer victory checks; accept legal alternative solutions.
- Check game viewport, coordinate readability, keyboard/touch usability as applicable, and artwork/collision alignment.
- Invalid previews are free; committed errors count but recover; no timing penalty.
- New levels have actual traversal replay, calibrated star targets, hints, reset/undo checks and new-element/novel-combination record.
- No unlicensed assets, credentials, student data, external hotlinks or unrelated generated files.
- Record test commands/results; explicitly state if visual/browser QA or deployment could not be performed.
- Update docs when decisions change; explain deviations from roadmap.

Use compact, accessible HTML controls and deterministic game logic. Prefer reuse and data-driven content, and keep math functions independently testable.

See the PR template for review evidence.
