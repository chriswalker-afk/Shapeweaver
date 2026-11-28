# Observatory — alternative routes and crystal delivery

## Level 33: Three Ways Across
The outer banks are at x=22 and x=56 with a safe island from x=34 to 44. Three physically distinct solutions:
1. Long deck: translate the 34-unit deck by (18,-12) into one continuous crossing. Jump on at the near bank and walk across both gaps. One cast, three stars.
2. Two independent spans: translate the short deck by (20,-2), rotate the far hinged beam 90 degrees anticlockwise about (56,4.8), then cross the first bridge, land on the island and jump onto the raised second span. Two casts, two stars.
3. Reflect and reuse: translate the short deck by (20,-2), cross to the island and reflect it in x=39 to form the second span. Two casts, two stars.
All routes use real geometry and physics. The existing efficiency scoring rewards the shortest route; the two-cast alternatives are intentionally valid, not treated as bypasses. Compare the different strategies during teaching. The route audit explicitly replays the alternatives and checks their scores and no respawns. Hints default to the efficient long deck and recognise the intended alternative configurations; they are not an exhaustive solver.

## Level 34: The Lost Star
Translate the rescue deck by (18,0), then reflect the asymmetric crystal in x=23 into the receiver. Either cast can happen first. The player can reach the portal without the crystal but cannot complete until the correct crystal exactly fits the receiver. Delivery may be performed remotely from the portal. Two casts, three stars.

Delivery targets are optional non-solid polygons in the room's deliveries array. Each references a specific crystal; duplicate object links, invalid target geometry and terrain/hazard overlaps are rejected. Fit is recomputed from actual polygon vertices, independent of winding or vertex order. It is reversible before completion; moving the crystal away makes the portal unavailable again. No separate stale completion flag. Preview describes changes to delivery and portal availability; the inspector displays target coordinates, and the portal and receiver have explicit status labels. Existing rooms have no extra completion requirement. Workshop copies expose receivers as editable items and allow independent replay; no standalone receiver palette template in this PR.

Browser smoke verifies canonical cast setup across four viewport sizes; complete route and alternate-route replays run in the deterministic engine and workshop. Manual visual review, real-device/classroom playtesting and exhaustive solution search remain pending.

Next: PR33, The Observatory Machine and The Final Ascent.
