# The Celestial Observatory — movable mirrors

## Level 31 — The Wandering Mirror
The bevelled bridge starts across x=4 to 16, with a channel spanning x=22 to 34. Reflecting the left edge at x=4 to x=34 requires the midpoint x=19. Translate the mirror slider from x=10 by (9,0), then reflect the linked bridge in x=19. Jump onto the deck and cross. Target: two casts.

## Level 32 — The Astronomer’s Bridge
Translate the attached socket and asymmetric beam by (14,0), moving H from (8,4) to (22,4). Rotate the beam 90 degrees clockwise about its new pivot to span x=22 to 34. Cross and stop at the safe star platform checkpoint at (39,3). Move the slider from x=15 to x=39 by vector (24,0). Reflect the entire attached assembly in x=39: H moves to (56,4) and the beam spans x=44 to 56. Jump onto it and cross to the portal. Target: four casts. Moving the mirror earlier is legal if clearance permits. The safe checkpoint is guidance/recovery, not a scripted unlock condition.

## Mechanism contract
A mirror-rail is a solid, enchanted, axis-aligned rectangular slider, with translation only and vertical component zero. Its centre x-coordinate determines a vertical line. Any reflector may opt into the constraint with mirrorRailId; references must resolve to a valid slider. Other reflectors retain all previously supported line choices. The player still enters the equation manually. Preview rejects stale or incorrect lines, displays the new equation during slider translation, and validates destination geometry, including attached objects. Reflection retains magical transfer semantics. Undo restores the old mirror position and link-derived equation without a second stored state. The workshop exposes a slider template; use the object properties JSON to set mirrorRailId.

New starfield and arched observatory scenery are decorative only. Browser smoke covers the first crossing preparation for Level 32, both casts for Level 31, and checks equation feedback; chronological engine/workshop replays cover the full routes. Full audit and browser CI required before merge; manual visual and classroom playtesting remain pending. Bounded shortcut sampling is not exhaustive.

Next: PR32 — Three Ways Across and The Lost Star.
