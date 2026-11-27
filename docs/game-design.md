# Shapeweaver — game design specification

**Reshape the world. Find your way.**

Status: PR00 design baseline. Implementation is planned, not yet complete. The campaign is a fantasy puzzle platformer that teaches formal school-level transformations through meaningful physical interactions. Aim for a genuine game, not a worksheet with decorative artwork.

## Core loop
Explore the environment, identify the obstacle, select an object (including inaccessible but visible objects), choose a permitted spell, enter mathematical parameters, inspect the preview, apply, then walk/jump/climb to advance. Players may switch between movement and spells freely. Pause movement and simulation when entering spell parameters; no timed maths. The exit is the goal, plus explicit secondary objectives in later levels. A valid solution is any legal sequence and traversable route satisfying the exit conditions, not a match to a hardcoded answer.

## Mathematical interface
- Translation: signed horizontal and vertical displacement (column vector, x then y). Early controls may additionally show right/left and up/down. No click-to-place solving in the game.
- Rotation: angle in degrees, clockwise/anticlockwise, centre (x,y). Initially 90/180/270 degrees; later add more angles only when justified and tested. Fixed hinges constrain the permitted centre. Equivalent rotations are valid.
- Enlargement: scale factor and centre (x,y); positive integers first, positive fractions later. No zero scale. Negative scale factors are a post-release extension. Centre may be outside the object.
- Reflection: equation of mirror line, first x=a, then y=b, later y=x and y=-x; explicitly validate supported equations, never use eval. Extend to other lines only with tests and a pedagogical need.
- Centres can be selected on a grid or typed numerically; display the resulting coordinates and complete mathematical description. Selecting centres is not dragging an object to its destination.
- Axes and grid independently visible or hidden as practical, with a prominent toggle for both. Unit grid and origin fixed in world space, x right, y up; equal axis scales. Integer vertices/reference points initially; permit fractional coordinates as needed. Camera movement/zoom must not change coordinates. Labels must stay legible, and selected vertices/hinges can show coordinates.
- Preview: original plus translucent transformed silhouette, vector/arc/rays/mirror line and centres as appropriate. Highlight invalid placements with reasons, not merely red. Cancel is free. Only explicit Apply commits a valid transformation; previewing is not a move. Consider an optional challenge setting with preview hidden, not the default.
- Formal language stays visible alongside any magical terminology. Post-level history gives object, type and complete parameters.

## Objects and environment
| Object | Uses |
| --- | --- |
| Log/beam | Bridge, slope, support or reusable platform |
| Hinged gate | Rotate around hinge to open a passage or create a surface |
| Cheese wedge | Ramp; visible asymmetric orientation |
| Barrel/crate | Stepping stone, switch activator, support |
| Ladder | Climbable axis; may also be a bridge |
| Mushroom | Bouncy surface or enlarged platform |
| L/T/stepped shapes | Fit irregular gaps and create compound structures |
| Plates, sockets, rails | Trigger gates, attach hinges, latch or select mechanism states |
| Crystal | Deliver to receiver in later puzzles |

Per-object capabilities: translatable, rotatable (possibly constrained pivot), scalable (allowed factor range and absolute size bounds), reflectable (possibly constrained line), climbable, bouncy, dockable, linked, locking. Mark restrictions clearly with icons and text, not hidden assumptions. Use sensible limits to prevent universal oversized bridges; allow more combinations as the campaign advances. Distinguish ordinary structural objects from explicitly enchanted floating objects. Artwork and collision geometry are transformed together, including surfaces, attachment points, face orientation and mechanism contacts.

## Deterministic physical rules
- World geometry rather than art pixels controls collisions. Touching at a supported boundary is allowed; interior overlap is not. Translations/rotations/enlargements check the swept path as well as final clearance; a valid final pose alone is not enough. Hinge contact is a designated exception, not global collision immunity.
- Reflection is magical transfer: may pass through a wall but its final pose must be legal. Communicate this distinction in the tutorial.
- Final poses must respect bounds, support and object capabilities; use deterministic supports/docks instead of chaotic rigid-body simulation. Suspended objects need explicit permission or a valid attachment. Shape can be selected remotely, but never transformed into the occupied player collider.
- Initial tutorial arrangements must be consistent with these rules (e.g. movable logs on shelves/docks rather than inexplicably floating). A translating object must have a clear swept path. Transformations may animate, but only commit once validation passes.
- Use consistent jump height/range and slopes; no accidental pixel-perfect jumps. If a player is standing on a transformed object, define and test safe dismount or controlled carry behaviour before enabling that operation. Mechanism state updates atomically. Avoid player crushing; reject unsafe changes or provide a clear safe recovery.
- Reach exit through actual player movement and satisfy objectives. No teleport-to-finish or validating solely against target object coordinates.

## Difficulty and level design
Separate mathematical and puzzle difficulty. Do not raise both dramatically together. Introduce a new mechanic/parameter concept at least every three levels, earlier in the campaign more frequently. Recombine elements with genuinely new dependencies instead of changing numbers alone. First four tutorials use one transformation each; levels 5–8 require two operations on different objects; 9–12 require two or more operations on one object in the intended solution; subsequent levels introduce structures, reuse, choices, dependencies and creative solutions. If composition admits an equally legal shorter solution, accept it and adjust target if appropriate. Use real mechanical constraints to establish order, not artificial answer matching.

## Mistakes and scoring
Every valid committed non-identity transformation counts as one move, including corrective moves. Reject malformed parameters, no-op actions, forbidden moves and collisions without increasing count. Preview, cancel, hints and ordinary traversal do not count. Count only successful commits (not animation frames). No hard move limit.
- 3 stars: complete at or below a level-specific tested efficient target.
- 2 stars: complete within a tested generous allowance (initial default target + 2).
- 1 star: complete with any larger number of legal transformations.
- No stars until completion. Never grade time, hint use, or deaths. Save personal best stars and best completed move count locally.
- Undo restores complete pre-commit world state including mechanism state, relevant player state and safe location; the committed move remains counted. No extra undo cost. Reset starts a new attempt with move count zero and original level state. Keep best prior records.
- Fall into a hazard: restore to a valid safe respawn point without silently undoing the puzzle or adding a move; if no safe reachable respawn exists, offer explicit undo/reset. A wrong irreversible latch may make an attempt unsolvable; provide clear warning and accessible undo/reset. No irreversible failure across attempts.
- Hints are optional and progressive: obstacle -> useful object -> transformation choice -> coordinates/math guidance -> worked solution. Later hints should be local to an obstacle and current state, not blindly assume the initial layout.

## Visual and UX identity
Original concept: richly illustrated 2D storybook fantasy, enchanted stone ruins, layered foliage, flowing turquoise water, warm golden lanterns and portals, purple-cloaked apprentice with red scarf. Distinct from other maths games; do not reuse their visual identities. Each chapter has unique silhouettes, scenery and palette while retaining a shared protagonist, spell iconography and parchment/violet UI. The reference concept art is a direction, not a background to paste into a game: independently layered, consistent-size, readable collision-aligned assets.
- Translation cyan (#4EADC3), rotation amber (#D5A044), enlargement green (#65A77A), reflection violet (#A57ACB). Use labels/icons and contrast in addition to colour.
- Preserve a large, responsive gameplay viewport. Compact collapsible header and context-sensitive spell panel; no persistent large instructions or stacked bars. Grid and UI must remain readable on school desktops at different resolutions and touch devices. Do not obscure critical targets with the spell panel.
- Keyboard movement and jump, pointer object selection, accessible labelled controls, touch equivalents, visible focus, reduced motion and mute options; no colour-only information. Prevent spell form typing from triggering movement. No timed input or sound-only feedback.
- Satisfying, short spell effects; water/foliage/parallax are decorative and not time pressure. Exit glows when conditions met. No distracting excessive particle effects.
- Adventure mode progresses through chapters. Puzzle Library offers direct access to all released levels with filters by transformation and separate difficulty dimensions. Local progress; no sign-in. Optional cosmetics/custom editor later.

## Release gate
Four polished tutorial levels form the first classroom-ready milestone. Review game feel and composition before expanding. Each official level must have a verified replay, tested collision and traversal, hints, recoverability, new-element cadence and calibrated scoring. Visual QA in actual browser at multiple viewport sizes; do not equate a successful unit test with an in-game visual review.

## PR11 implementation note
Undo restores the exact previous immutable room and a safe pre-cast player position (or validated prior safe point). The original committed move remains counted, with an undone marker in attempt history. Return to safety preserves current world and moves. Reset clears the whole attempt. See [mistake recovery](mistake-recovery.md).

## PR12 implementation note
Completion-only efficiency stars use each level's tested `efficientMoves` target and optional `twoStarMoves` allowance (default target + 2). The four current tutorials have targets of 1 move. A separate results screen lists all committed casts, including undone moves, and shows locally retained personal bests. No speed, fall, hint or undo action penalty beyond counting the original successful cast. See [stars and results](stars-and-results.md).

## PR13 implementation note
The contextual guide follows current interaction and object arrangement without locking the player into steps. A separate optional five-stage hint panel progresses from obstacle to object, transformation, coordinate reasoning and explicit worked solution. The final hint validates its proposed cast against the live world and apprentice before advising preview/apply. Hints and guidance never auto-fill or cast and never affect scoring. See [tutorials and hints](tutorials-and-hints.md).
