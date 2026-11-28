# Campaign — 36 authored levels

All 36 authored levels are registered in the campaign. The chapter structure is fixed; geometry and star targets remain subject to real-device and classroom playtesting. The executable level definitions and replay fixtures are authoritative; see the final campaign audit for the implementation acceptance matrix. A new element must appear at least every three levels (more frequently in tutorials). New can mean a genuinely new gameplay interaction or mathematical requirement. Revisit existing elements in varied combinations.

## 1. The Gatehouse — one transformation per level
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 1 | Across the Brook | Translate log into a bridge over the river. | Column vectors |
| 2 | The Stubborn Gate | Rotate hinged gate through 90 degrees, opening route. | Angle, direction, pivot |
| 3 | A Little Cheesy | Enlarge wedge into ramp. | Scale factor and centre |
| 4 | The Missing Barrel | Reflect barrel from sealed room and jump on it. | Vertical mirror lines |

Tutorials use progressive fading: identify coordinates, model one step, prompt parameters, preview, apply, traverse. Level 4 explicitly explains reflection's magical transfer versus physical swept checks.

## 2. The Enchanted Gardens — two operations, two objects
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 5 | Two Small Problems | Translate log, rotate gate. | Recombine |
| 6 | The Secret Garden | Reflect barrel onto plate to open gate; enlarge mushroom to reach ledge. | Pressure plates and bouncy mushrooms |
| 7 | Mind the Gap | Rotate ladder, translate crate to reach ladder base. | Climbable objects and dependencies |
| 8 | Above and Below | Reflect platform across horizontal line; enlarge wedge to reach it. | Horizontal reflection |

## 3. The Clockwork Gallery — multiple operations on one object
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 9 | Find the Hinge | Translate beam to hinge socket, rotate it into bridge. | Dockable hinges |
| 10 | A Tight Squeeze | Rotate plank to fit opening, then translate to crossing. | Clearance and order |
| 11 | The Wrong Way Round | Reflect asymmetrical wedge, enlarge about external centre. | External enlargement centre |
| 12 | The Giant Key | Enlarge L-shaped piece and rotate to fit a matching lock outline. | Irregular compound silhouette |

In 9–12 use constrained pivots, capabilities, and clearance when needed to make the intended operations meaningful. Noncommuting transformations and equivalent compositions are mathematical opportunities, not reasons to reject legal shortcuts.

## 4. The Riverworks — construction puzzles
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 13 | Bridge Builders | Translate two beams onto banks/central support to span river. | Modular structures |
| 14 | Broken Staircase | Rotate ladder and translate platforms into continuous staircase. | Recombine |
| 15 | Double Trouble | Position separate objects on two plates to keep passage open. | Simultaneous switches |
| 16 | Diagonal Dock | Reflect L-shaped platform across diagonal line and translate second piece. | Diagonal reflections |
| 17 | The Watermill | Rotate wheel platform, enlarge connecting ramp. | Coordinated wheel platform |
| 18 | Around the Tower | Rotate about external centre to opposite side of tower, translate beam. | External rotation centre |

## 5. The Mirror Archives — dependencies and reuse
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 19 | Bring It With You | Use crate to climb first ledge, reposition for second. | Object reuse after traversal |
| 20 | A Bridge and a Ladder | Cross using beam; later move/rotate same beam into ramp. | Multiple purposes |
| 21 | No Going Back | Fit object into a socket that locks it for the attempt. | One-way latches |
| 22 | Locked Passage | Choose which object to lock, preserve scarce pieces for later. | Resource management |
| 23 | The Double Seal | Rotate and translate a rigid two-foot seal to hold both plates. | Linked compound objects |
| 24 | The Archivist’s Chain | Translate triple seal and rotate/translate a locking key to satisfy linked gates. | Recombine |

## 6. The Alchemist's Workshop — precision and planning
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 25 | Too Big to Fit | Reduce large block by factor 1/2 to pass opening, form step. | Fractional factors |
| 26 | Small Now, Big Later | Shrink, translate through opening and enlarge into bridge. | Reversible size changes |
| 27 | The Wandering Pivot | Translate movable socket, rotate beam about new centre. | Movable rotation centres |
| 28 | The Mirrored Mechanism | Reflect socket/attached assembly, rotate platform about new centre. | Interdependent transformations |
| 29 | One Opens, One Closes | Move object onto selector that opens one gate and closes another. | Two-state mechanisms |
| 30 | The Alchemist's Trial | Combine shrinking, growth, rotation and reuse in connected obstacles. | Recombine |

## 7. The Celestial Observatory — mastery and creativity
| Level | Title | Intended puzzle | New element |
| --- | --- | --- | --- |
| 31 | The Wandering Mirror | Translate mirror rail, reflect object across new permitted line. | Movable mirror lines |
| 32 | The Astronomer's Bridge | Move pivot and mirror to assemble route with unusual shapes. | Recombine |
| 33 | Three Ways Across | Build one long deck, two separate spans at different heights, or a reusable reflected deck. | Deliberately distinct solution routes |
| 34 | The Lost Star | Deliver crystal to receiver and build player route. | Secondary delivery objective |
| 35 | The Observatory Machine | Compound shapes, selectors and reused platforms activate exit. | Recombine |
| 36 | The Final Ascent | All four transformations and several objects; alternate solutions. | Mastery |

Chapter art direction: autumn stone gatehouse; lush botanical gardens; brass clockwork gallery; teal aqueducts and watermills; violet mirror library; warm alchemist workshop; midnight blue celestial observatory. Share storybook style, not identical scenery.

## Level acceptance record (required before release)
For each level record: stable ID, title, chapter, intended learning goal, prerequisite mechanics, new element or novel combination, math difficulty (1–5), puzzle difficulty (1–5), permitted spell parameters/objects, exact coordinate geometry, player and exit conditions, intended transformation sequence with traversal actions, verified move count and star thresholds, alternative solution/shortcut review, hints, collision/swept-path checks, undo/reset/recovery checks and visual QA status. Keep replay fixtures in version control. Never mark a level verified without actual traversability; a replay proves an achievable upper bound, not mathematical optimality. Update target if a shorter valid solution is found. No hard-coded expected moves in victory validation.

## Future expansions
Inverted Kingdom (negative scale factors and more signed coordinates), Shattered Dimension (composition), Illusionist's Tower (describe existing transformations), Daily Portal, Architect's Workshop and Grandmaster Trials. These do not delay the main 36-level release.

## Level 1 implementation (PR07)
Across the Brook now has data in `src/levels/across-the-brook.js`, with a recorded one-translation route. The 10-unit brook requires a bridge under current movement tuning; the beam is translated horizontally to rest on both banks. The precise intended vector is guidance, not a required-answer check. See [translation tutorial](translation-tutorial.md) for replay and caveats.

## Level 2 implementation (PR08)
The Stubborn Gate now has a playable room in `src/levels/stubborn-gate.js`. Its overhead hinge is at (14,8); a 90-degree anticlockwise rotation opens the passage. The opposite direction and longer equivalent-final-pose turns are unsafe. The recorded route walks through the physically open passage. See [rotation tutorial](rotation-tutorial.md).

## Level 3 implementation (PR09)
A Little Cheesy is implemented in `src/levels/little-cheesy.js`. The initial wedge is 6 units wide and 3 units high; the ledge is 9 units above the floor. A factor of 3 about (25,3) produces a walkable ramp. Smaller valid enlargements and fractional corrective casts are accepted. See [enlargement tutorial](enlargement-tutorial.md).

## Level 4 implementation (PR10)
The Missing Barrel places a barrel in a sealed store; reflection in x=15 puts it on the courtyard floor near the raised ledge. Two jumps and a walk reach the portal. All four introductory tutorials are now implemented; see [reflection tutorial](reflection-tutorial.md).

## PR16 — Enchanted Gardens release
Levels 5–6 are implemented. Each has two different interactive objects and a verified two-cast physical route. Chapter II remains partially released until PR17 adds Levels 7–8.

## PR17 — Enchanted Gardens finale
Levels 7–8 are implemented with two distinct objects per puzzle. A hinged ladder becomes climbable after rotation and requires a translated step crate. A horizontal reflection raises a platform above a recessed walkway, and enlargement provides the final ramp. Chapter II is fully released.

## PR18 — Clockwork Gallery opening
Levels 9–10 require sequential transformations of a single beam/plank. The fixed socket and low arch create different order dependencies. Both have verified two-cast physical routes.

## PR19 — Clockwork Gallery finale
Levels 11–12 are implemented: reflect and enlarge a brass wedge about an external centre; enlarge and rotate a concave L-shaped key to match a lock outline. Both routes are verified. PR20 audits the first twelve levels.

## PR22 — The Riverworks opening
Levels 13–14 are implemented. Bridge Builders requires two supported spans across a central pier; Broken Staircase combines two stacked platforms and a hinged ladder. See [Riverworks](riverworks.md).

## PR23 — The Riverworks mechanisms
Levels 15–16 introduce simultaneous linked pressure plates and diagonal reflection of a concave dock bracket that supports a translated upper span. See [Riverworks mechanisms](riverworks-mechanisms.md).

## PR24 — The Riverworks finale
Levels 17–18 combine rotation of a linked two-paddle waterwheel and ramp enlargement, then rotation about a fixed external centre and a translated structural approach. See [Riverworks finale](riverworks-finale.md). Chapter IV is complete, halfway through the planned 36 levels.

## PR25 — The Mirror Archives opening
Levels 19–20 reuse a single object after traversing an earlier obstacle. Both have an intermediate raised checkpoint and verified chronological cast/movement fixtures. See [Mirror Archives](mirror-archives.md).

### Observatory finale
Levels 35–36 recombine existing validated mechanisms rather than introduce a new spell system. See [Observatory finale](observatory-finale.md). All 36 planned levels are authored; PR34 is the whole-campaign review gate before polish and production release.
