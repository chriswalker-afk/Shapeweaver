# PR23 — The Riverworks: Levels 15–16

## 15 — Double Trouble
The sluice gate is linked to two plates at x=14..17 and x=28..31 on the floor y=3. Both plates require 2.5 units of horizontal contact from a weight-enabled object. A stored barrel occupies x=3..6 in a sealed store; the sliding crate occupies x=22..25. Reflect the barrel in x=10 and translate the crate by (6,0). Both counterweights are 1.5 units high, so jump over them without disturbing either plate. The gate opens only when both are held; moving either weight away closes it, unless closure would overlap the player or another object. The reverse cast order is legal. The existing pure geometry-derived AND condition is unchanged. Plate labels and separate coloured wiring lanes show each input's held/free state, and the gate is labelled with the held count. Preview reports changes to individual linked plates, count and gate. No timed hold or irreversible latch.

## 16 — Diagonal Dock
A six-vertex L-shaped timber bracket starts standing on a high shelf. A=(3,9) and E=(4.5,22) map to (9,3) and (22,4.5) under reflection in y=x. The full concave image spans the first ten-unit channel at y=3, with an elevated bearing surface x=19..22, y=4.5. Stable vertex correspondence and collision geometry are preserved even when the winding reverses. The upper span starts at x=33..46, y=4.5. Translate by (-12,0) to x=21..34; its left bearing rests on the reflected bracket and its right bearing on the raised east dock. The intended translation is rejected before the bracket is placed, and the bracket cannot be removed while the span depends on it. Both ends use the PR22 support rule. Reflection can transfer through intervening space; actual destination geometry must remain valid. The mirror parser already supports y=x and y=-x; this level deliberately requires y=x for the intended initial transfer. Wrong diagonal y=-x leaves this positive-coordinate room. The workshop palette now includes a reusable concave L-shaped dock piece.

## Verification
Direct execution of committed physics/spell modules completed both intended routes with zero respawns:
- 15: [100,1,0], [125,1,1], [150,1,0], [125,1,1], [450,1,0].
- 16: [125,1,0], [120,1,1], [100,1,0], [125,1,1], [600,1,0].

At 120 Hz each segment means ticks, horizontal input and jump on first tick. Both new puzzles use 2/4 efficiency thresholds; their replays and live worked hints are in the common campaign audit. Regression tests cover all linked plate states and contact threshold, alternate ordering, unsafe gate closure, undo, exact diagonal vertex correspondence, wrong mirror, dependency validation, workshop verification and campaign navigation. Browser smoke tests capture the real game at four viewport sizes. The existing finite shortcut search is not a proof of global optimality. No actual human visual or classroom playtest is claimed, no deployment or domain change.

Next: PR24 — The Riverworks: Levels 17–18, Watermill and Around the Tower. Introduce waterwheel mechanisms and external rotation centres, coordinating mechanisms and structural pieces.
