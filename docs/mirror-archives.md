# PR25 — Mirror Archives opening

## 19 — Bring It With You
The apprentice crosses two 12-unit archive channels using the same eight-unit chest, initially x=4..12, y=3..5.5. Translate by (13,0) to x=17..25. Its base has real support on the west bank; its overhang extends the reachable edge. Jump onto the chest, walk near its far end and jump to the raised reading balcony x=30..38, y=6.5. Stop at the visited checkpoint (34,6.5). Translate the chest by (24,0) to x=41..49, underneath the balcony, then jump onto it and on to the east reading room. There is no scripted requirement to visit the checkpoint to finish: collision geometry and physical reachability determine success. The balcony is a safe refuge above the chest's swept path; returning to a visited checkpoint preserves committed transformations. The chest uses existing one-contact support rather than the two-ended bearing rule, so a deliberate overhang is legal.

## 20 — A Bridge and a Ladder
The fourteen-unit ladder starts at x=3..17, y=3..3.6, H=(17,3). Its horizontal orientation is a genuine solid bridge deck. Translate by (14,0) to x=17..31, cross the channel and jump to the catalogue balcony at y=5.5. Stop on the safe checkpoint (36,5.5). Translate the same ladder by (22,0), giving x=39..53 and H=(53,3). Rotate 90 degrees clockwise about H to form an upright ladder at x=53..53.6, y=3..17. The collision index no longer treats the envelope as a solid wall; the climb segment is derived from its vertices. Approach it, climb and jump right onto the upper catalogue at y=15. The ladder's pivot is carried by every translation, not a fixed global anchor.

## Shared mechanics and recovery
- Opt-in bridgeDeck metadata retains ordinary ladder behaviour. A dual-purpose ladder is solid only in an axis-aligned horizontal rectangular configuration, climbable only when upright. The engine rebuilds physical collision geometry after a successful cast. Its animation is visual only.
- The normal full-path, player-supported and player-overlap validation rules protect the apprentice, including the moving crossing. An earlier bridge may be removed once the apprentice stands safely on the balcony. The existing immutable attempt history, undo and reset preserve meaningful recovery options. Returning does not teleport to an unvisited checkpoint.
- Chapter V features a muted plum/violet archive palette, bookcases, arched windows, labelled balconies and bridge/ladder state labels. Background artwork is non-solid.
- Live hints use the player's current position as well as the current object geometry. They distinguish a movement stage (traverse to the balcony) from a cast stage (reuse the object). Worked cast hints are still validated against the actual room and apprentice. The hints are guidance, not additional completion gates. They are not an exhaustive solver for arbitrary alternate arrangements.
- Level 19 uses 2/4 efficiency thresholds; Level 20 uses 3/5.

## Reproducible route evidence
The new fixtures preserve casts and fixed-tick movement in chronological order. At 120 Hz each movement segment is [ticks,horizontal,jump on first tick,climb (optional)].
- 19: after the first translation, [240,1,0], [100,1,1], [76,1,0], [160,1,1], [20,0,0]; after the second, [57,1,0], [130,1,1], [49,1,0], [120,1,1], [400,1,0].
- 20: after the first translation, [250,1,0], [120,1,1], [115,1,0], [100,1,1], [25,0,0]; after the second translation, no movement; after rotation, [270,1,0], [25,0,0,1], [420,0,0,1], [1,1,1,0], [250,1,0].

Direct execution of the committed engine modules completed both intended routes without returns. The common campaign audit checks the real player at each cast, live worked hints at those poses, geometric invariants, omitted-cast subsets and bounded shortcut probes starting at intermediate poses. Existing static-arrangement fixtures retain their previous format. The workshop recorder independently replays all twenty puzzles. Browser smoke tests cover initial appearance and first crossing at four viewport sizes; controller tests exercise interleaved input and results. Full CI remains the review gate. No manual screenshot inspection, classroom calibration or exhaustive shortcut proof is claimed.

Next: PR26 — The Mirror Archives: Levels 21–22, No Going Back and Locked Passage. Introduce one-way latches and locking sockets, where objects can become unavailable after placement; retain explicit Undo/Reset recovery and verify consequential choices.
