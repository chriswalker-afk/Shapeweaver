# Architecture and quality baseline

Proposed static browser game: vanilla JavaScript ES modules, Canvas 2D for world and effects, accessible HTML/CSS for controls; local storage for progress. Toolchain and package versions to be decided in PR01. No accounts, server or external asset hotlinks required. Serve assets relative to repository base path (GitHub Pages) and later root domain. Do not depend on student-identifying data.

## Target layout
- index.html: entry point
- src/core/: game loop, state, actions, input
- src/geometry/: vectors, matrices, polygons, coordinate conversion, contact tests
- src/physics/: character motion, collision, traversal, support and swept checks
- src/transformations/: pure math, permissions, preview/validate/commit
- src/mechanisms/: sockets, hinges, switches, linked assemblies and objectives
- src/rendering/: camera, scenery, object transforms, grid, animations
- src/ui/: menus, spell forms, hints, scoring, accessibility
- src/levels/: versioned data, validation and fixtures
- assets/{characters,environments,objects,effects,audio}/
- tests/: unit, integration, replay and browser smoke
- tools/: internal level workshop and validation
- docs/: design baseline and QA

Directories will be added with meaningful files during implementation rather than an empty placeholder tree.

## Mathematical core
World coordinate x increases right and y increases up. Uniform scale for drawing. World-to-screen and screen-to-world are inverse with y flip and camera offset. Store local vertices + world transform/pose or authoritative transformed vertices; render artwork using same transform; avoid a separate inaccurate visual representation. Test transforms independently of browser and physics.

For point p=(x,y), vector v=(dx,dy), centre c=(a,b):
- Translate: p'=p+v.
- Rotate: p'=c+R(theta)(p-c); positive theta anticlockwise, clockwise negates angle. Exact quarter-turn matrices avoid drift.
- Enlarge: p'=c+k(p-c); k finite and positive for base game. Fractional k supported later. Store rational values or use explicit tolerances where appropriate.
- Reflect in x=a: (2a-x,y); in y=b: (x,2b-y); in y=x: (y,x); in y=-x: (-y,-x). Normalize mirror-line input and reject unsupported forms. A future general reflection across ax+by+d=0 uses p'=p-2(a*x+b*y+d)/(a*a+b*b)*(a,b).

Reject NaN, infinities, unsupported values and no-op transformations without consuming moves; define numeric tolerance centrally. Validate capabilities and allowed parameter ranges against state, and world bounds/swept geometry/contact. Distinguish touching from overlapping, and handle concave shapes using decomposition or robust polygon tests. Reflections reverse winding; normals and walkable surfaces must remain correct. Never use eval for mathematical input.

## State and transaction boundaries
Game state includes level schema/version, player pose/velocity/safe checkpoint, objects with stable IDs, geometry and capabilities, mechanism graph/state, attempt count and objective flags. Input actions separate from drawing. A preview is pure and non-mutating. Apply validates against current state, computes final pose and dependent state, checks player safety, and commits atomically with history. Animation represents the transaction, never changes its mathematical outcome or increments move count. Prevent concurrent commits; state changes during preview require revalidation.
Undo restores complete prior puzzle state safely, but attempt count is monotonic until reset. Reset loads immutable starting data. Falling restores a validated safe player state without rolling back puzzle state. Persist only versioned best scores/settings, with robust fallbacks if storage fails. No arbitrary code in level data.

## Level data contract (proposed, formalise during PR03–06)
Stable ID, chapter, title, schema version, world bounds, camera start, grid defaults, terrain polygons, hazards, spawn and exit, objects with local/world geometry, artwork key, initial pose, capabilities, reference points, dimensions/limits and support mode, mechanism links and objective predicates, learning tags, separate difficulty values, hints, tested move targets and replay fixtures. Validate unique IDs, finite coordinates, nondegenerate polygons, spawn clearance, references, object constraints and asset keys. Official levels data-driven; no bespoke per-level input logic. Workshop uses same validator and runtime. Custom import later must validate size/schema and not execute untrusted code.

## Testing
- Unit: vector arithmetic, all transform types and inverses, length/angle preservation, scale changes and area ratio, quarter turns, external centres, fractional factors, composition order, diagonal reflections, coordinate round trips, degenerate and invalid input.
- Collision: swept paths, thin wall tunnelling, touching boundaries, final overlap, concave shapes, support, legal hinge contacts, player safety, slopes and ladder alignment.
- State: non-mutating previews, atomic commit, no-op/invalid actions cost zero, history, undo restoring mechanisms, monotonic move count, reset, fall/respawn and best progress.
- Mechanisms: simultaneous plates, locks, selector transitions, movable pivots and mirrors, linked objects, objective/exit dependencies.
- Levels: record actual transformation and traversal actions; replay against deterministic state and assert exit reached. A solution fixture is proof of reachability for that sequence only, not uniqueness or optimality. Explore shortcuts manually/with bounded search where useful. Validate chapter introduction cadence and released-level access.
- Browser: load under Pages subpath and root, keyboard and touch interaction, reduced motion, form focus, responsive viewport (e.g. 1280x720, 1366x768, 1920x1080, small landscape and portrait), axes and labels consistent. Screenshot evidence for visually significant PRs. Test resizing while playing; preserve state and grid geometry.

Prefer fast unit tests for every PR with targeted browser/replay checks. Full campaign suite before review gates. Record actual results and any unavailable checks in PR description. No claims of verification for unrun checks.

## Asset policy
Use original assets or assets with documented rights/attribution. Keep artwork source/provenance and licences in an asset manifest when introduced. Do not add real student data or private school resources. Concept art is reference only; generated or drawn sprites need independent layers and measured collision alignment. PR02 establishes the style guide and reusable initial assets.
