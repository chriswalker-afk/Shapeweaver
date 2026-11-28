# Shapeweaver — player and teacher guide (v1.0.0)

Shapeweaver is a mathematical puzzle platformer for practising transformations. Every puzzle is available from the adventure library. No account, installation or payment is required to play the deployed static app.

## Quick start for players

1. Open Adventure & puzzle library and select a level, or use Continue to resume the first unfinished puzzle. The first four levels introduce one transformation each. Practice room and Spellbook are available from the title.
2. Look at the obstacle, the grid and the shape's labelled vertices. Read the guide or try the puzzle independently.
3. Select Objects. Click or tap a highlighted object, or choose one from the object list. Choose a permitted transformation.
4. Enter the mathematical parameters, select Preview, and compare the exact image coordinates with the intended destination. A rejected preview explains the reason and costs no move. Only Apply changes the world and counts a move.
5. Return to movement and cross the obstacle. Touch controls allow simultaneous movement and jumping. Finish by reaching the portal; some puzzles also require a crystal to fit its receiver.

| Transformation | Parameters | Example |
| --- | --- | --- |
| Translation | Horizontal and vertical components of the column vector | (4, -2): four right, two down |
| Rotation | Angle, direction and centre | 90° anticlockwise about (2, 3) |
| Enlargement | Positive scale factor and centre | Factor 1/2 about (4, 1) |
| Reflection | Mirror line equation | x = 5, y = 3, y = x, y = -x |

A specific object's permitted transformations, fixed centres and scale-factor range may constrain valid inputs. The coordinate system uses x increasing right and y increasing up. A translation, rotation or enlargement must also have a clear path when required by the object; reflections test the image destination. A mathematically correct transformation can still be physically unsuitable for the route.

## Movement, camera and help

- Left/right arrows or A/D move, Space or Z jumps, up/down arrows or W/S climb ladders. The on-screen movement buttons provide the same controls. Use Objects to pause movement while entering parameters.
- Grid toggles the coordinate grid. Close-up follows the apprentice; Full room returns to the overview. In View tools you can inspect, pan, zoom, toggle the axes, and pick an exact point. When inspecting an object, Locate object and Locate image frame its geometry. The inspector shows exact coordinates even when labels are crowded.
- Use Guide to switch contextual guidance on or off. Hints reveal progressively more support, ending with a worked transformation. Hints are optional and never penalise your star rating.
- Escape closes an open hint, coordinate picker, object panel or view tools. The interface also has labelled buttons and a keyboard-accessible object list.
- View tools includes Focus view, sound and reduced-motion preferences. Sound is off by default; the reduced setting respects system preferences. Not all canvas scenery is independently accessible to screen readers; teacher support may be needed.

## Mistakes and stars

- Invalid previews are free. An applied transformation counts as one move.
- Undo restores the previous geometry and a safe earlier position, but the original move still counts.
- Return moves the apprentice to the last safe visited checkpoint or start; transformations and moves are preserved. If neither is safe, Undo or Reset.
- Reset restores the authored room and clears the current attempt. It does not delete completed-level best results.
- Three stars are earned for meeting the demonstrated efficient move target. Two stars have a wider move allowance. Any completed solution earns at least one star. There is no time, hint or fall penalty.
- The results show formal mathematical descriptions of all committed transformations, including undone casts. Use Replay to refine the solution, or the Puzzle library to choose another challenge.
- Complete all 36 levels to finish the adventure; 108 stars are available. Alternative routes are valid where the real geometry and mechanisms allow them.

## Classroom use

Use the library filters for transformation, mathematics difficulty, puzzle difficulty and chapter. Mathematics and puzzle ratings are separate author estimates, not measured attainment or time-to-solve data.

| Chapter and levels | Teaching focus |
| --- | --- |
| I — The Gatehouse, 1–4 | Introduce the four transformations and parameter conventions |
| II — The Enchanted Gardens, 5–8 | Combine objects; sequence simple transformations |
| III — The Clockwork Gallery, 9–12 | Centres, hinges, clearance and exact shape matching |
| IV — The Riverworks, 13–18 | Linked structures, simultaneous conditions, diagonal mirrors |
| V — The Mirror Archives, 19–24 | Reuse, planning, irreversible locks within an attempt |
| VI — The Alchemist’s Workshop, 25–30 | Fractional enlargement, changing reference points, multi-stage puzzles |
| VII — The Celestial Observatory, 31–36 | Moving mirrors, multiple strategies, delivery and mastery |

Suggested sequence: model a tutorial with its coordinates projected, ask learners to predict the mathematical description before previewing, then have them independently attempt a matched filtered puzzle. Use staged hints for scaffolding and hide the guide for independent practice. Ask students to write the formal description of each transformation and justify why a move was valid mathematically and useful physically. Levels 33 and 36 invite comparison of different valid routes. For deeper teacher preparation, the [campaign audit](final-campaign-audit.md) gives the progression matrix; the recorded solution fixtures and chapter design documents contain spoilers.

Progress and sound/motion preferences are stored in the current browser, scoped to its website origin. There are no student accounts, analytics or central progress dashboard. Clearing site data, changing browsers/devices, private-mode restrictions, or moving from the GitHub Pages address to the custom domain can lose or separate saved progress. When storage is blocked, play continues with session-only best results. Use written solutions or screenshots of the results as classroom evidence, following school policy. The hosting provider may have its own normal request logs; the game does not send student progress to a server.

Use the current release checklist for device and classroom QA. Automated verification covers mathematics, collision and recorded routes, but does not establish accessibility conformance or the suitability of the estimated difficulty for every learner.
