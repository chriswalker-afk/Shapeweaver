# PR20 — First campaign audit

Scope: the first twelve released puzzles, not the remaining planned campaign. Review based on authored geometry, replay fixtures, mathematical validators, hints, scoring and existing responsive browser smoke tests.

| Level | Maths / puzzle (1–5) | Concept / new dependency | Platforming review |
|---|---|---|---|
| 1 Across the Brook | 1 / 1 | Signed vector; supported bridge | One jump onto beam |
| 2 The Stubborn Gate | 1 / 1 | Fixed centre, signed turn | Walk under opened gate |
| 3 A Little Cheesy | 1 / 1 | Integer scale, fixed corner | Walkable slope |
| 4 The Missing Barrel | 1 / 1 | Vertical mirror, midpoint | Two jumps; land between presses |
| 5 Two Small Problems | 2 / 2 | Two independent objects | Bridge, checkpoint and gate |
| 6 The Secret Garden | 2 / 2 | Weight plate, linked gate, spring cap | Timing of spring jump |
| 7 Mind the Gap | 2 / 3 | Derived climb segment, step placement | Catch ladder and climb |
| 8 Above and Below | 3 / 3 | Horizontal mirror, two elevation changes | Land before second jump |
| 9 Find the Hinge | 3 / 3 | Mobile centre, dock before turn | Bridge crossing |
| 10 A Tight Squeeze | 3 / 4 | Marked pivot, swept clearance | Bridge crossing; arch clearance |
| 11 The Wrong Way Round | 4 / 3 | Asymmetry, external enlargement centre | Walk up slope |
| 12 The Giant Key | 4 / 4 | Concave shape, corresponding edges, exact fit | Walk below key |

Mathematics progresses independently of platforming difficulty. The reduction in puzzle rating at Level 11 is intentional: the mathematical demand increases, while physical navigation becomes simpler. Initial tutorials introduce a new transformation every level; Gardens introduce multiple objects, plate/gate/spring, ladder, horizontal mirror; Clockwork introduces same-object sequencing, sockets, clearance, external centres and compound shapes. The new-mechanic cadence is maintained. Keep the authored math/puzzle ratings and existing 1/3 or 2/4 move thresholds pending classroom completion data; changing saved ratings without such evidence is unnecessary. Hints, time and respawns do not cost stars. Undone committed casts still count.

## Improvements
- Full procedural automatic guidance in Gatehouse; goal and collaboration planning in Gardens; goal and sequence planning in Clockwork. Detailed object/parameter/solution guidance remains accessible on demand through the five-stage panel. Guide off also suppresses automatic cast-status solution cues. Actual valid geometry, not guidance readiness, determines completion.
- Label target lock corners S1–S6 on the game overlay when the key is selected; use same placement algorithm as source/image vertices and reserve the edge ruler bands. Numeric inspector references remain available. Chapter card selection clears incompatible stale filters.
- Central recorded solution/replay fixture in tools/campaign-audit.mjs. The regression test independently follows recorded casts and live worked hints, verifies physical exit and zero respawns, reference identities, pairwise distances and signed-area changes, intended route insufficiency before all casts, and scoring boundaries. Fixture is a starting point for PR21, not yet a full level-editor schema.
- npm run audit:campaign reports per-level evidence including bounded shortcut trials. Walk right with eight different jump-start delays, testing the initial state and legal incomplete intended sequences, stop after first respawn or 1000 ticks. Report any hits for review; do not outlaw valid alternative maths just because it differs from the example. This search cannot prove absence of every shortcut, especially multi-directional movement, climb timing, arbitrary transform parameters and additional object arrangements. The known valid alternative sequences are retained in the earlier tests.

## Remaining evidence
CI results are the authoritative record of execution. No human visual review or physical multi-touch classroom study has been performed in this PR. Browser QA continues to capture actual screenshots and layout dimensions at desktop, small desktop, landscape and portrait phone sizes. Manual review should focus on spring/ladder timing, minimum readable coordinate labels at full-room fit, on-device movement and playtesting whether the ratings reflect students' needs. Keep the game deterministic and avoid speculative global physics changes before observing such evidence. No deployment/domain changes.

Next: PR21 — Internal level workshop (developer level editor, geometry/coordinates, mechanism properties, solution recording and automated replay verification).
