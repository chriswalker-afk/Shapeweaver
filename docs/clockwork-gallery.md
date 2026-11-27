# PR18 — Clockwork Gallery: Levels 9–10

Chapter III introduces ordered combinations of transformations on one object. Brass gears, pipes and slate columns establish a mechanical workshop atmosphere without adding invisible solid terrain. All prior levels remain available.

## 9 — Find the Hinge
The vertical socket beam has mobile hinge H=(6,3). Translate by (11,0) so H coincides with fixed socket S=(17,3), then rotate 90 degrees clockwise about (17,3). The resulting beam spans x=17..29 across the ten-unit channel. The socket is drawn and labelled; preview reports docking and the inspector displays the updated hinge and docking state.

Docking is derived from actual matching coordinates (geometry epsilon only), not a separate counter or automatic snap. The socket must be anchored in terrain; a compatible object has a marked pivot and both translation and rotation permissions. An undocked beam cannot rotate. Once docked, the rotation centre must be its current hinge. Supported placement and the existing swept collision rules still apply. Translation may undock the beam; undo/reset reconstruct docking from restored geometry. The socket is not load-bearing by itself.

## 10 — A Tight Squeeze
The plank starts upright at H=(6,3). Its marked pivot moves with it and is the only permitted rotation centre. Rotate 90 degrees clockwise about (6,3), then translate (17,0). The resulting beam covers x=23..35. The 3-unit clearance under the low arch prevents translating the original 12-unit vertical plank through it; the horizontal plank can pass. There is no arbitrary required-cast counter. The fixed marked-pivot rule prevents treating a mobile engineering pivot as an arbitrary remote centre. Students can make additional useful or unnecessary casts and recover as before.

## Recorded replay at 120 Hz
- 9: right 245 ticks, right+jump 120 ticks (one jump press), right 600 ticks.
- 10: right 345 ticks, right+jump 120 ticks, right 600 ticks.
Direct simulation verified both intended sequences and portal completion without respawn. The reversed intended first steps are rejected by the socket/clearance validators. This is not exhaustive solution-search proof. Stars use 2 and 4 move boundaries; rejected casts are free. Hints calculate remaining vector and pivot from current geometry; final reveal validates the cast. Real device and human visual review remain outstanding. No deployment or domain changes.

Next: PR19 — Levels 11–12: The Wrong Way Round and The Giant Key, combining reflection, enlargement and rotation of asymmetric shapes.
