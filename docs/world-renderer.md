# PR03 — World renderer

The title's Explore the Gatehouse button opens the first real world-space room. This is a static renderer test fixture, not a released campaign level or verified puzzle. The character cannot walk or jump yet, and props cannot transform. PR04 will add grid/axes and coordinate interaction; PR05 adds actual movement/collision; PR06 adds interactive objects.

## World and camera
- Room bounds [0,32] by [0,14], mathematical y increases upward; fixture vertices are authoritative geometric data. CCW polygons for terrain, hazards and props. Static spawn is feet at (2.5,3), portal is bottom centre (30,6). Asset foot baseline at 157/168 of image height. All rendering uses CSS pixel coordinates, then viewport sets device-pixel scaling.
- Overview fits both room dimensions at uniform scale (letterbox with scenery where appropriate); Inspect zooms into the room, with directional pan controls and clamping. No independent x/y stretching. Both worldToScreen and screenToWorld are pure and inverse. Camera pan/resize changes only presentation; never mutate level data. PR04 can reuse this camera for grid and zoom.
- Layer order: sky/distant mountains, transparent arcade/trees with independent parallax, hazards, terrain, props, decoration, portal, apprentice, gentle vignette. Tile phase is anchored to geometry. Terrain fills clipped to polygon; grass trim and glow are decorative. Image failure falls back to simple shapes and colours.
- Original vector assets are local, reusable and documented. Title artwork is not reused as level geometry. Layered style is an initial vector baseline, not final hand-painted textures.

## Data contract and limitations
src/levels/gatehouse-preview.js exports an immutable room fixture and initial validator. Validate schema, finite/non-degenerate CCW polygons, bounds, unique IDs and spawn/exit dimensions. This is not a general self-intersection/support/overlap/solvability validator; expand in PR05–06. The example crate in the water is decorative, not a valid supported puzzle piece. No collision solving, gravity, object capabilities, game loop, player movement, grid or stars here. The future physics engine consumes the same polygons, not SVG pixels; decoration does not alter collision. Do not certify this room as a puzzle until gameplay and replay testing exist.

## QA
- Automated: camera round trips and uniform scale, clamped panning, viewport independence, geometry/data validation, deterministic render smoke with mock context, HTTP production asset delivery, title/spellbook/room navigation.
- Manual: open room on desktop 1366x768, 1920x1080, 1280x720, 956x440 landscape and phone portrait. Check readable controls, room canvas occupies most of screen, no covering gameplay, textures align with polygon edges, character feet touch terrain, portal sits on east ledge. Inspect/pan both axes and resize; return to title and spellbook. Record screenshots and issues before visual sign-off.
