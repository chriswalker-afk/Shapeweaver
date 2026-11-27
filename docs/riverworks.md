# PR22 — The Riverworks opening

## Level 13 — Bridge Builders
The river consists of two 10-unit channels, separated by a four-unit stone pier. Both 13-unit timber spans start on the west quay. Translate East span by (25,0), then West span by (26,0). Their final ranges are [42,55] and [29,42], at y=3, with touching ends on the pier. The far span must clear the near span's travel path first. Both ends of each span rest on actual solid terrain. Walk towards the bridge, jump onto the 0.5-unit-high deck and continue to the portal. The east bank checkpoint is safe at the original room state.

## Level 14 — Broken Staircase
The upper terrace is 12 units above the floor. The service ladder can hang down five units from H=(34,15), but a jump from the floor or only one platform cannot reach its bottom at y=10. Translate Long lower platform by (15,0) to x=25..34, y=3..5.5. Translate Short upper platform by (26,0) from its storage rack to x=30..34, y=5.5..8. Rotate the ladder 90 degrees anticlockwise about (34,15). The player jumps onto the lower step, lands, jumps onto the upper step, jumps to catch the ladder, climbs and jumps onto the upper works. The upper step cannot be moved into the intended position until the lower support is in place. The ladder can be lowered before the platforms if the arc is clear.

## Structural bearing rule
New opt-in metadata bearing: "both-ends" on supported translation-only axis-aligned rectangular pieces. Both outer 0.5-unit bearing regions (or one-quarter width for a very small piece) require solid contact beneath them. The check runs for the initial room and for all flagged pieces in the proposed final room, including derived linked-gate state. Moving a support away from an upper construction piece is rejected without a move. Ordinary objects retain their previous support rule. Gold end caps mark bearing regions, and preview/inspector text explains them. This is a deterministic geometric rule, not load, torque or dynamic rigid-body simulation. During a valid translation a piece may travel briefly unsupported, as before; committed final arrangements must be supported. No new irreversible lock is introduced. Undo/reset restore the previous complete room.

## Recorded replay evidence
Direct execution of the committed physics/spell modules completed both intended routes without respawns. Inputs below are at 120 Hz; each row is [ticks, horizontal, jump on first tick, climb].
- 13: [455,1,0,0], [120,1,1,0], [800,1,0,0].
- 14: [410,1,0,0], [60,1,1,0], [75,0,0,0], [75,1,1,0], [55,1,0,0], [1,0,1,0], [290,0,0,1], [1,1,1,0], [350,1,0,0].
The shared campaign audit and workshop recorder/verifier now include both fixtures. For up to three casts, the audit checks all legal proper ordered subsets, with the existing bounded jump-delay probe extended to the recorded route length. This is not an exhaustive solver. Level 13 uses a 2/4 move threshold, Level 14 a 3/5 threshold. Both have stage-based live hints, independent geometry-driven completion and normal recovery.

Chapter IV uses a blue-green dockyard palette, misty aqueduct and gantry silhouettes, existing stone/water assets, and visibly reinforced bearing pieces. Background silhouettes are not terrain. Full CI, actual screenshot review and classroom touch playtests remain review gates. No deployment or domain changes.

Next PR23 — The Riverworks: Levels 15–16. Double Trouble introduces simultaneous weight-held pressure plates, and Diagonal Dock introduces diagonal mirror lines and irregular platform pieces.
