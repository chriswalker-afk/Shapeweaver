# PR05 — Platformer engine

Gatehouse is now a movement practice room, not one of the 36 campaign puzzles. The static beam, gate and wedge are solid geometry; the decorative crate is not. A fixed timber bridge over the first river, a ladder to the shelf, a slope and a second water gap provide practice. The gate was moved behind the spawn to keep this room focused on movement. No transformations, stars or campaign progress yet.

## Inputs and simulation
Arrow keys / WASD move and climb; Space or Z jumps. Hold touch buttons; multiple pointers can be held independently. Focused form/button input is not intercepted by global movement keys. Blur, hidden page, switching views, entering coordinate picking and respawn clear held input. Coordinate picking pauses simulation. Reset starts at spawn and clears checkpoints. In Inspect, camera follows the character by default; pan disables follow and Follow restores it. Overview shows the full room.

Fixed 120 Hz simulation, at most 12 catch-up steps per frame, no large time step after a suspended tab. All positions are world units; y increases upwards. Speed 7.2, gravity 25, initial jump speed 12.2, terminal fall speed 18, ladder speed 3.8. Ground/air acceleration, 0.11 s coyote grace, 0.12 s buffered jump. No automatic jumping from a held key. These are provisional tuning values, subject to real playtesting.

## Collision and geometry
Player pose is centre of feet, AABB width .66 and height 1.55. Polygon clipping against AABB checks positive interior area (boundary contact allowed); concave simple CCW polygons are supported. Bounded substeps and bisection resolve axis movement; ground probe and bounded incline stepping handle walkable slopes without arbitrary step-ups. Side and top bounds constrain motion; bottom falls and hazard overlaps trigger respawn. No general polygon sweep/rotating object physics, dynamic rigid bodies or moving platforms yet. Future object transforms must rebuild collision geometry and validate player safety.

Climb only when within ladder reach and pressing up/down; release to hold, walk or jump to dismount. Ladder top/bottom limits are explicit. Ladder overlap is not solid terrain. No auto-teleport through platforms.

Checkpoints activate only when grounded near their validated safe coordinates. Hazard or pit returns to a safe checkpoint, otherwise spawn; if neither is clear, require reset. Exit requires grounded feet in the portal's usable area. Completion freezes movement until reset. Nothing is time-graded.

Artwork uses live pose and foot anchoring, facing flip and subtle procedural lean/stretch for walk/climb/jump, disabled by reduced-motion setting (facing still works). This is not a full multi-frame sprite sheet; replace in visual polish later.

## Test expectations
Pure geometry and physics tests cover contacts/concave geometry, walls, ceiling, slopes, jumps, ladder, hazard/checkpoint, exit, deterministic replays, fixed-step loop and independent input sources. Record actual CI results. Browser review still needed for movement feel, art alignment, control focus/touch ergonomics and viewport size. PR06 adds remote object selection and transformation permissions/previews; keep physics independent of UI.
