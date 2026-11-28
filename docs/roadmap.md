# Implementation roadmap

PR00 is a direct bootstrap on main because an empty repository cannot host ordinary PRs. PR01 onward should branch from merged main; use actual GitHub PR numbers when available (planned labels may diverge). Keep PRs independently reviewable; insert follow-up polish PRs as needed. Do not skip review gates.

| Planned PR | Scope | Acceptance / deliverable |
| --- | --- | --- |
| 01 | Project scaffold | Runnable static JS module application, development commands, base test suite, CI and Pages deployment workflow; documented setup. |
| 02 | Visual identity | Title screen, branding, palette, typography, parchment UI, spell icons, initial protagonist/assets; responsive visual review. |
| 03 | World renderer | Layered scenery, terrain, world camera, responsive viewport; independent art and geometry. |
| 04 | Coordinate system | Toggle axes/grid, equal unit scales, labels, snapping, world/screen inverse, zoom; no drift with camera. |
| 05 | Platformer engine | Walk/jump/slope/climb, collision, hazards, safe respawn, exit detection. |
| 06 | Interactive objects | Select remotely, capabilities, attachment geometry, previews and shared validation pipeline; playable test room. |
| 07 | Translation | Signed vectors, animation, path validation, tutorial level 1. |
| 08 | Rotation | Angles/directions/centres, pivot constraint and swept checks, level 2. |
| 09 | Enlargement | Scale and centre, geometry/size/sweep checks, level 3. |
| 10 | Reflection | Mirror equations, final collision/transfer, level 4. |
| 11 | Mistake recovery | Transactional history, undo/reset, safe respawn, feedback; no penalty for invalid previews. |
| 12 | Stars/results | Committed-move count, calibrated thresholds, results and formal transformation history. |
| 13 | Tutorials/hints | Contextual fading tutorials and progressive obstacle-specific hints. |
| 14 | Gatehouse polish | Verify all four levels and polish visuals, interaction, maths and traversal. |
| 15 | Campaign/library | Chapter selection, direct access to released puzzles, filters, local best progress, replay. |
| 16 | Levels 5–6 | Two-object puzzles, pressure plates/gates and bouncy mushrooms. |
| 17 | Levels 7–8 | Climbable ladders, dependent objects, horizontal reflection. |
| 18 | Levels 9–10 | Dockable hinges, sequential transformations, clearance. |
| 19 | Levels 11–12 | Asymmetric shapes, external enlargement centres, combined size/orientation. |
| 20 | First campaign audit | Review levels 1–12, shortcuts, star targets, progression, visuals and recoverability. |
| 21 | Internal level workshop | Coordinate-based authoring, geometry inspection, object/mechanism properties, test-play/export and solution recording. |
| 22 | Levels 13–14 | Modular bridges, central supports, stairs. |
| 23 | Levels 15–16 | Simultaneous plates, diagonal reflection, irregular pieces. |
| 24 | Levels 17–18 | Coordinated waterwheel, external rotation centre, Riverworks review. |
| 25 | Levels 19–20 | Object reuse after traversal, bridge/ramp dual roles. |
| 26 | Levels 21–22 | One-way latches, object scarcity, meaningful recovery. |
| 27 | Levels 23–24 | Linked compound objects, interconnected mechanisms. |
| 28 | Levels 25–26 | Fractional factors, shrink/translate/grow, narrow passages. |
| 29 | Levels 27–28 | Movable rotation centres, attached objects and dependency updates. |
| 30 | Levels 29–30 | Two-state selector, multi-stage alchemist puzzles and review. |
| 31 | Levels 31–32 | Movable mirror lines, reference-point combinations. |
| 32 | Levels 33–34 | Distinct alternative routes, crystal delivery objective. |
| 33 | Levels 35–36 | Interconnected machinery and final mastery challenge. |
| 34 | Campaign audit | All replays, mechanic cadence, maths, shortcuts, recovery, scores and visuals. |
| 35 | Final polish | Audio, animation, accessibility, touch, layout, performance. |
| 36 | Production release | Regression tests, documentation, Pages deployment, custom domain preparation. |

Review gates: PR06 (playable test room, screen composition); PR14 (first classroom-ready chapter); PR20 (12-level progression); PR24 (construction); PR30 (advanced mechanics); PR34 (complete campaign); PR36 (release). In-game visual QA requires actual browser evidence or a clearly documented pending manual review. Avoid claiming tests run without results.

## Original bootstrap milestone: PR01
- Start from main after PR00. Add index.html, src entry module, minimal CSS/app shell, development commands and repository structure; basic accessibility and responsive layout.
- Choose lightweight build/serve approach with relative asset paths (GitHub Pages repository subpath); prefer vanilla JavaScript modules, Canvas 2D and DOM controls. No backend or student accounts.
- Add deterministic smoke tests and CI workflow; no unnecessary dependencies. Set up Pages workflow to build/upload/deploy on appropriate events; if Pages configuration is missing, document activation rather than claim deployment.
- README development instructions, expected commands, basic test evidence. Open PR and request review; do not begin PR02 until PR01 merges.

## Optional post-release PRs
37 public drag-and-drop workshop; 38 successful playtest verification; 39 import/export versioned custom level files; 40 custom puzzle library; 41 cosmetics; 42 negative scale factor expansion; 43 Grandmaster challenges. Reassess numbering and scope after main release.

## Historical milestone: PR21
The internal workshop is local development tooling, outside the public build. It provides precise room authoring, real-engine playtest and versioned replay bundles. PR22 uses it to design and verify Levels 13–14 (modular bridge pieces, central supports and structural staircase combinations). The public custom-level feature remains optional after the production release.

## Historical milestone: PR28
Chapter VI opens with Levels 25–26, fractional scale factors and physical clearance. PR29 introduces movable rotation centres and attached object dependencies (The Wandering Pivot and The Mirrored Mechanism). Keep the PR review gates and do not merge unverified changes.

## Historical milestone: PR29
Levels 27–28 introduce separately selectable movable sockets and attached beams, with atomic rigid carrying transformations. PR30 adds two-state selectors and multi-stage alchemist puzzles (One Opens, One Closes and The Alchemist’s Trial).

## Current milestone: PR30
Chapter VI closes with a complementary-gate airlock and five-cast bridge-reuse trial. Review gate: run the full recorded/hinted campaign audit and independent workshop replays; review chapter progression and keep browser/manual QA distinct. PR31 opens The Celestial Observatory with The Wandering Mirror and The Astronomer’s Bridge (movable mirror lines and combined reference-point mechanisms).
