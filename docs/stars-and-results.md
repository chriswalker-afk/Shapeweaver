# PR12 — Stars and results

## Efficiency rules
- Stars are awarded only on actual portal completion of an official puzzle, never on preview, practice, reset or incomplete/blocked attempts.
- Three stars: total committed moves at or below the level's tested efficient target (`tutorial.efficientMoves`).
- Two stars: above the efficient target but at or below `tutorial.twoStarMoves` (default efficient target + 2).
- One star: any other completed solution. A valid route that beats the intended target is accepted, including zero moves if a future puzzle admits it.
- All four Gatehouse tutorials have a verified one-cast route, so 0–1 moves earns 3 stars, 2–3 earns 2 stars, and 4+ earns 1. Targets are provisional until the planned campaign/visual audits; no hardcoded answer check.
- Every successful cast counts, even if undone. Failed previews/commits, undo itself, hints, falls, manual returns and time never add moves or reduce stars. Reset begins a new attempt.

## Results view
A dedicated completion screen replaces the room only when the deterministic movement engine reports exit. The completed result is immutable and captured once per attempt. Show earned and unearned stars (accessible count), moves, target, undos, returns, thresholds and encouraging copy. Show every actual committed cast in order, by object and formal transformation name. Translation has a two-entry column vector, rotation angle/direction/centre, enlargement factor/centre, reflection mirror equation. The recorded numeric enlargement factor is displayed (not the original typed fraction). Undone entries are labelled 'Undone · still counted', not deleted. The history scrolls independently if long. The practice room still uses its previous completion status, not stars. Replaying or moving to the next available level starts a fresh attempt; the last available tutorial offers replay and Back to levels. Results use the existing title level buttons until the campaign library arrives in PR15.

## Local bests
Store only best completed move counts and best stars per stable level ID in versioned `shapeweaver.best-results.v1` localStorage. No player identity, timer, history or network service. Never downgrade a personal best. Reset/replay cannot erase it. Invalid/corrupt/blocked storage falls back to in-memory bests for the current session, with an explicit session-only label if writes fail. This is single-browser storage, not cross-device or synchronised multi-tab progress. PR15 will use the same best-results store for the campaign library; any later threshold recalibration should explicitly migrate or recompute scores.

## QA
Test star boundaries and overrides, incomplete/practice exclusion, all four mathematical descriptions, undo accounting, snapshot immutability, valid lower-move routes, storage round trips/failure, results navigation, final-level state and actual completion callback. Real browser/touch/short-viewport review remains necessary. No deployment/domain changes. Next PR13 — Tutorials and hints.
