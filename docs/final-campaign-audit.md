# Final campaign audit — PR34

## Acceptance baseline and scope
PR33 Scaffold CI: 282 automated tests passed; 36/36 canonical and live worked-hint routes passed with three stars and zero respawns; 3/3 recorded alternative routes passed; zero sampled shortcut hits. This is evidence for the PR33 commit, not a claim about an unrun PR34 workflow. PR34 strengthens that baseline and uses CI as the merge gate.

### Progression review
The matrix below is based on the actual PR33 campaign catalog and recorded route results. Math and puzzle difficulty are independent authoring estimates (1–5), not measured student performance. Efficient move targets are demonstrated upper bounds, not proof of global mathematical minimality.

| Level | Authored title | Math | Puzzle | Target casts | New concept or deliberate consolidation |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | Across the Brook | 1 | 1 | 1 | Column vectors |
| 2 | The Stubborn Gate | 1 | 1 | 1 | Rotation angle, direction, centre |
| 3 | A Little Cheesy | 1 | 1 | 1 | Scale factor and centre |
| 4 | The Missing Barrel | 1 | 1 | 1 | Vertical reflection, destination vs swept path |
| 5 | Two Small Problems | 2 | 2 | 2 | Two objects, two transformations |
| 6 | The Secret Garden | 2 | 2 | 2 | Pressure plate and mushroom |
| 7 | Mind the Gap | 2 | 3 | 2 | Ladder and step dependency |
| 8 | Above and Below | 3 | 3 | 2 | Horizontal reflection |
| 9 | Find the Hinge | 3 | 3 | 2 | Dockable pivot |
| 10 | A Tight Squeeze | 3 | 4 | 2 | Order and rotational clearance |
| 11 | The Wrong Way Round | 4 | 3 | 2 | Asymmetric reflection, external enlargement centre |
| 12 | The Giant Key | 4 | 4 | 2 | Irregular exact shape fit |
| 13 | Bridge Builders | 3 | 4 | 2 | Modular support at both ends |
| 14 | Broken Staircase | 3 | 4 | 3 | Multi-piece staircase and ladder |
| 15 | Double Trouble | 3 | 4 | 2 | Simultaneous pressure plates |
| 16 | Diagonal Dock | 4 | 4 | 2 | Diagonal reflection, structural dependency |
| 17 | Watermill | 4 | 4 | 2 | Coordinated rotor and ramp |
| 18 | Around the Tower | 4 | 4 | 2 | External rotation centre |
| 19 | Bring It With You | 3 | 4 | 2 | Object reuse after traversal |
| 20 | A Bridge and a Ladder | 4 | 5 | 3 | Dual-purpose object |
| 21 | No Going Back | 3 | 5 | 2 | One-way latch |
| 22 | Locked Passage | 3 | 5 | 2 | Scarce locking key |
| 23 | The Double Seal | 4 | 5 | 2 | Rigid linked feet |
| 24 | The Archivist’s Chain | 4 | 5 | 3 | Mixed plate and shape conditions |
| 25 | Too Big to Fit | 4 | 4 | 1 | Fractional reduction |
| 26 | Small Now, Big Later | 4 | 5 | 3 | Shrink, translate, grow through slit |
| 27 | The Wandering Pivot | 4 | 5 | 2 | Movable rotation centre |
| 28 | The Mirrored Mechanism | 4 | 5 | 2 | Reflection of dependent pivot assembly |
| 29 | One Opens, One Closes | 4 | 5 | 2 | Complementary gate selector and traversal |
| 30 | The Alchemist’s Trial | 5 | 5 | 5 | Clearance, resizing, reuse and rotation |
| 31 | The Wandering Mirror | 4 | 5 | 2 | Move the permitted mirror line |
| 32 | The Astronomer’s Bridge | 5 | 5 | 4 | Combine moving pivot and mirror |
| 33 | Three Ways Across | 4 | 5 | 1 | Compare three valid strategies |
| 34 | The Lost Star | 4 | 5 | 2 | Secondary exact crystal delivery |
| 35 | The Observatory Machine | 5 | 5 | 5 | Compound selector, reuse, conjunctive lock |
| 36 | The Final Ascent | 5 | 5 | 5 | All four spells, two equally efficient routes |

Chapter targets: I 1 cast each, II–III 2, IV–V 2–3, VI–VII 1–5. Complexity rises through planning, geometry and interdependence, not a monotonic move count. Intentional consolidation at 13 and 19, short focused introductions at 25 and 31, and strategic choice at 33 prevent the final chapters becoming only longer versions of earlier puzzles. There is a new requirement or novel combination at least every three levels. No reordering or difficulty-score inflation without real student evidence.

## Mathematical and engine acceptance
- Catalog validates 36 unique consecutive levels, seven chapter boundaries, 108 available stars, difficulty bands, permitted spells and fixture consistency.
- Recorded and worked-hint routes execute the actual full-path validators and fixed-step physics. Point-pair distances, corresponding signed area and exact coordinate images are checked independently of the production transform routine, including attached parts and fixed reference points.
- All 36 primary and three alternative routes are now also replayed through the workshop session and independently verified exported bundle. Check preview/commit correspondence, rejected missing input leaving the state untouched, no changes to unrelated geometry, exact move description, scoring and refusal to cast after completion.
- At every successful recorded/alternative cast, fork the history to test undo, including retained move count and restored room/valid safe pose. Test Return against the visited safe checkpoint or spawn, and require explicit Reset if neither is safe. Check fresh attempts restore authored state. Recovery checks do not change the canonical replay.
- The existing omitted-cast and bounded jump probes remain. A successful shorter legal solution is evidence to review efficiency targets, not a reason to ban mathematical alternatives. No exhaustive search or proof of optimality is claimed.
- Level 33: one long deck (1 cast / 3 stars), two spans or reflected reuse (2 casts / 2 stars). Level 36: reuse or raised-span route (5 casts / 3 stars both). Do not make alternate valid solutions artificially illegal.
- Full campaign completion regression verifies 108 stars, replay navigation and local session fallback if school-browser storage is blocked.

## Visual and classroom acceptance
Browser QA asserts every level at desktop (1366×768), small desktop (1024×600), landscape phone (844×390) and portrait phone (390×844): 144 level/viewport combinations, legal initial spell setup, game stage minimum, toggles and runtime errors. Screenshot artifacts are evidence to inspect; this is automated coverage, not human aesthetic approval. Interleaved puzzles' complete traversal is deterministic engine/workshop coverage, not a recorded keyboard playthrough in all viewport sizes.

Pending for PR35/manual release review: actual screenshots and real devices; stage legibility for wide late-game rooms, target labels/coordinates and overlap at small sizes, touch movement and casting, keyboard focus/accessible names, reduced-motion support, audio controls and performance on school hardware. In classroom playtest, sample at least the four tutorials, the first use of a new mechanism, fractional scaling, reuse, and final mastery; record misconceptions, wrong-but-valid casts, recovery and time-to-solve. The current campaign is a complete mathematical and mechanical baseline, not a claim of completed classroom playtesting.

## Release decision
PR34 is a review gate, not a production deployment. Keep all seven chapters intact unless concrete evidence warrants a change. Full current CI and browser QA must pass before merging. PR35: final polish and visual/device review. PR36: release regression, documentation, GitHub Pages deployment and custom-domain preparation.
