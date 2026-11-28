# PR38 — Storybook home artwork

## Art direction
Twilight indigo, muted teal and warm parchment/gold. The new 1440 × 800 hero looks toward a luminous gatehouse, across a winding river and arched bridge. Distant clockwork and observatory towers, layered mountain ridges, forest silhouettes, inlaid path and crystal/fern details suggest the campaign without pretending to be actual room geometry. The existing apprentice is composited separately at the approach, preserving their established design. Desktop keeps the light and focal architecture to the right of the menu; portrait crops toward the right and fades behind the copy.

The four 160 × 132 illustrations share rounded inset frames, small corner ornaments, light/dark contrast and a readable foreground silhouette:
- Continue: a purple-hooded apprentice and golden gate.
- Puzzle Library: archive shelves, a window and a seven-stop chapter map.
- Spellbook: open parchment with mathematically correct miniature translation, quarter-turn rotation, enlargement and reflection constructions.
- Practice Room: workbench and congruent triangles reflected in a vertical mirror line.

The original title environment remains visible behind the library, spellbook and results. The new home scene is a separate decorative SVG composition; no changes to navigation, storage, spell mechanics, physics, scoring or puzzle data. Existing menu copy, order, focus and tap targets remain. No new animation in this PR.

## Verification
All assets are original local static SVG, recorded in the provenance manifest; combined budget 65 KiB uncompressed. Test the public artifact and both hosting paths. Browser QA decodes all five assets, checks the actual illustration bounds against card copy, confirms the old/new hero visibility switches, and captures home screenshots at 1366×768, 1024×600, 844×390 and 390×844. Keep the 144 existing level/viewport cases and workshop checks. Automated asset/layout checks are not a substitute for human visual inspection; review the screenshot artifact and a real device before final sign-off.

## Next
PR39 — ambient spell showcase: separate decorative layer, mathematically accurate sequential transformation demonstrations, no gameplay input or pointer interception, no obscuring menu copy, pause when home is hidden and honour reduced motion. PR40 — final visual and responsive QA.
