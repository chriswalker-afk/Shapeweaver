# The Alchemist's Workshop — finale and chapter review

## Level 29 — One Opens, One Closes
The selector begins held: entrance closed, exit open. Move its weight from (10,8) to (4,8) by vector (-6,0). Entrance opens and exit closes. Walk into the airlock and reach the checkpoint at (24,3). Move the same weight back by (6,0), then walk out. Target: two casts. Both gates are actual full-height solids when closed. A cast that closes a gate onto the apprentice or another object is rejected. Undo restores the complementary outputs and the safe pose.

The selector is an ordinary non-latching pressure plate with one additional field, closedGateId. Its gateId opens on contact, its closedGateId opens when contact is absent. Both gates must have exclusive links. Invalid, duplicate or mixed links are rejected. Rendering shows both circuits and explicit HELD/FREE labels; preview describes both gate changes.

## Level 30 — The Alchemist’s Trial
The 12 by 2 bridge must pass through a 1.1-unit slit. Shrink about (4,11) by 1/2; translate by (27,0); enlarge about (34,18) by 2 to span x=28 to 40 at y=4 to 6. Walk under the partition and jump onto the bridge. Jump from it onto the elevated refuge checkpoint at (45,8.2), safely above the bridge’s travel path. Translate the same bridge by (24,0) to span x=52 to 64, then rotate the final gate 90 degrees anticlockwise about (72,8). Step down to the middle bank, jump onto the second crossing and reach the portal. Target: five casts. The second bridge may be built or the gate turned in other orders when geometry and the player's position allow. No forced stage sequence.
 
## Chapter VI review
| Level | Main demand | Target |
| --- | --- | ---: |
| 25 | Fractional scale factor and fixed corner | 1 |
| 26 | Shrink, translate through clearance, regrow | 3 |
| 27 | Carry a pivot by translation, then rotate | 2 |
| 28 | Reflect a dependent assembly and rotate | 2 |
| 29 | Reversible exclusive gate state with traversal between casts | 2 |
| 30 | Recombine fractional enlargement, clearance, object reuse, rotation and traversal | 5 |

The sequence alternates new mathematical concepts with increasingly demanding planning. Levels 27–29 target two casts, but require new dependencies or changes to player position. Level 30 is the chapter's first five-cast interleaved fixture. Hints are optional and use current player position and geometry. Automated route, geometry, scoring, omitted-cast and independent workshop replay tests are included. Browser smoke covers the first safe traversal setup in the two new levels; it does not simulate the entire multi-stage keyboard route. Manual visual review, real-device/classroom playtesting, and exhaustive alternative-solution search remain pending. The PR30 review gate is the full CI campaign audit and browser QA before merge.

Next: PR31, The Wandering Mirror and The Astronomer's Bridge.
