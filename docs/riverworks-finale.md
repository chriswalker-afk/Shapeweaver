# PR24 — Riverworks finale

## 17 — Watermill
A two-paddle solid rotor has a fixed axle H=(32,11) and a 14.8-unit span. The vertical arrangement is unusable. Rotate 90 degrees clockwise about H to produce a continuous horizontal top edge at y=11.5 (x=24.6..39.4). The axle and both paddle ends remain part of the same transformation; the actual concave polygon is the collision shape. The dashed circular rim is a non-solid axle guide, not a hidden collection of usable platforms. The ramp starts with height 2.5 and width 6. Enlarge by factor 3 about B=(24,3) to reach y=10.5; the height is then 7.5 and the horizontal extent is 6..24. Walk up the ramp and jump onto the rotor; cross it and jump off onto the raised east quay. Both pieces are necessary for the intended route. A 90-degree clockwise rotation is the worked example, not a scripted completion requirement. Rotations must have clear swept geometry, including hazards, solid terrain and player.

## 18 — Around the Tower
The floating walkway starts at x=18..30, y=14..14.5. Its fixed external centre is P=(32,11), visibly outside the shape. Rotate 180 degrees clockwise around P: each vertex (x,y) maps to (64-x,22-y), so its image is x=34..46, y=7.5..8. Clockwise takes the walkway above the tower; the anticlockwise arc goes below and is blocked. The two-ended approach span starts x=3..17, y=7.5. Translate by (14,0), leaving x=17..31: both ends rest on the west quay and central tower. Jump onto this span, walk towards the tower and jump onto the orbiting walkway. Its final position is genuinely usable geometry. No automatic teleport or required sequence flag.

## Reusable mechanisms
- A waterwheel is one hinged timber rotor with a polygon collision surface and decorative dashed axle guide. It is not a continuously spinning physics object, a rideable moving platform, or a simulation of water power.
- New optional fixedCentre metadata for rotation-only enchanted objects. Validate finite coordinates, within room bounds, strictly external to the polygon, no hinge/docking/pivot conflicts. The marked centre must be entered exactly; it remains fixed in the source/image reference lists, previews and commits. Other rotation-enabled objects retain their previous centre permissions. Full signed arc validation remains unchanged. The workshop includes templates for each and draws the centre in the draft editor. Guide lines/rings are never terrain. Undo/reset preserve the authored reference.
- Live hints derive geometry, choose valid signed arcs, and calculate the ramp factor or approach vector. Both levels have two-/four-move efficiency thresholds. Valid alternative casts are not arbitrarily forbidden. 

## Verification
Direct execution of committed engine modules with the new room geometry completed both recorded routes without respawns. Fixed step at 120 Hz:
- 17: [365,1,0], [120,1,1], [125,1,0], [120,1,1], [400,1,0].
- 18: [250,1,0], [120,1,1], [150,1,0], [120,1,1], [550,1,0].

Each segment is ticks, horizontal input, jump on the first tick. Both fixtures feed the campaign audit and independent workshop recorder/verifier. Tests check full geometry/centre correspondence, alternate order, rejected centre and arc, hints, support, undo and results navigation. Browser smoke tests cover all eighteen puzzles at four viewport sizes. CI results are the authoritative evidence. No exhaustive shortcut search, manual screenshot or classroom touch review, no deployment or domain changes.

Next PR25 — The Mirror Archives: Levels 19–20, Bring It With You and A Bridge and a Ladder. Introduce genuine reuse of an object after traversing an earlier part of the room. Record interleaved movements and casts; verify geometry, safe recovery and route reachability.
