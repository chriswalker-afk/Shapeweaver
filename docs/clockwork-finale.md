# PR19 — Clockwork Gallery finale

## 11 — The Wrong Way Round
The asymmetric brass wedge starts with a falling slope. Reflect in x=13; enlarge by factor 3 about (10,3), a point outside the reflected wedge. B maps from (14,3) to (22,3), C from (18,5) to (34,9). The resulting slope reaches the landing at (34,9). No special completion check: the player actually walks up the slope. Alternative sequences may be accepted if their geometry and sweep are valid.

## 12 — The Giant Key
The concave L-shaped brass key starts overhead, allowing the apprentice to pass below it. Enlarge by factor 2 about (8,5), then rotate 90 degrees clockwise about (13,8). The six resulting vertices coincide with the lock recess. The recess is an explicitly non-solid inlaid shape outline, not a solid wall with a tight physical hole. A cable connects it to a real gate. The gate opens only when the compatible key's entire polygon matches the outline (cyclic ordering or reversed winding accepted within the geometry epsilon), not when a scripted sequence is entered. Matching size/bounds alone is insufficient. There is no automatic snapping or extra move cost.

The existing plate mechanism resolver now also resolves geometric shape sockets. Linked gates require all their linked conditions. A preview reports a socket filling/emptying and gate opening/closing. Reject a closing gate overlapping another object or the player, restore state from immutable geometry with undo/reset. Slot references are included in the inspector. Brass artwork uses actual polygon boundaries; the wedge slope highlight follows the actual diagonal edge after reflection.

## QA
Direct simulation at 120 Hz with right input for up to 1000 ticks verified both intended two-cast routes from spawn, zero respawns. Initial and first-cast-only routes did not reach the exit; the gate refuses to close on the apprentice. Automated regressions cover socket fit, wrong orientation/size, equivalent sequences, history, hints and all 12 levels' browser cast previews at four viewport sizes. This is not exhaustive shortcut proof. Human visual/touch/classroom review remains outstanding. No deployment or domain changes.

Next: PR20 — First campaign audit: mathematical progression, physical routes, difficulty, alternatives and shortcuts, tutorial quality, scoring and visual consistency across Levels 1–12.
