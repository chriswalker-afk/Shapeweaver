# PR17 — Garden finale

## Level 7 — Mind the Gap
Rotate the hinged ladder 90 degrees anticlockwise about (24,12), then translate the step crate by (17,0). Both casts may be applied in either order. The ladder's lower endpoint is at height 7, beyond the normal floor jump; the crate top at 5.5 allows a jump into reach. Jump onto the crate, walk to its right edge, jump and hold Up/W to catch the ladder. Climb to y=12, jump right and walk to the portal. The upper-terrace checkpoint makes retries forgiving.

Transformable ladders use their actual rectangular world vertices. Vertical ladders derive a centreline, width, bottom and top for the existing climbing physics; horizontal ladders are not climbable and are not solid platforms. The envelope still reserves clearance for spell sweeps; it cannot support other objects. Reject casts on ladders currently being climbed. Undo and reset recompile the climb segment from the restored room. The rails/rungs are drawn from the actual moving vertices. Up/Down touch controls appear when a climbable ladder exists. Static ladders remain unchanged.

## Level 8 — Above and Below
Reflect the enchanted platform in y=3, raising its top to y=5. Enlarge the cheese ramp by factor 3 about (34,7), reaching the terrace at y=13. Both casts may be done in either order. Jump from the approach onto the raised platform; land and jump right onto the middle walkway, then walk up the ramp. A dry recess permits mistakes; Return is always available unless the attempt has ended. The enchanted support rule permits the platform to float; normal objects still require support.

## Recorded physical traversal at 120 Hz
Each step is [ticks, horizontal input, jump press on first tick, climb input].
- 7: [295,1,0,0], [60,1,1,0], [60,0,0,0], [40,1,0,0], [1,0,1,0], [300,0,0,1], [1,1,1,0], [300,1,0,0].
- 8: [142,1,0,0], [90,1,1,0], [20,0,0,0], [90,1,1,0], [450,1,0,0].
Direct execution verified both replays in either cast order with zero respawns in the intended order; each single intended cast alone fails on the same replay. This is not an exhaustive solver or proof against every shortcut. Both levels use two/four-move thresholds for three/two stars; hints are based on the remaining object and validated by the existing spell engine. Browser workflow exercises the actual cast UI at four viewport sizes; human touch and visual playtesting remain necessary.

Next PR18 — Clockwork Gallery Levels 9–10: dockable hinges, sequential transformations of the same object and clearance puzzles.
