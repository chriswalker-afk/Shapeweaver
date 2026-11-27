# PR04 — Coordinate system

## Player controls
Open Explore the Gatehouse. Grid and Axes are separate toggles, both enabled initially. Switch both off for an unobstructed scene. Full room fits the entire level; Inspect magnifies it; −/+ zoom from 1× to 8× fit; directional controls pan within room bounds. The camera stays at a uniform x/y scale, preserves the chosen zoom factor and clamped centre on resize. Coordinates never change because of zoom, pan, DPI or viewport aspect ratio.

Pick point opens a compact panel. Click/tap the scene to mark a mathematical coordinate using the chosen whole-unit, half-unit or tenth-unit snap. Snapping is anchored at the mathematical origin. Alternatively type both coordinates and choose Mark exact point; typed finite decimal values are accepted without snapping when within bounds. Clear removes the marker. Clicks outside the room (letterbox scenery) are rejected. Pick mode off hides the marker and its controls without losing the selected point. No object selection, movement or transform is performed.

## Coordinate contract
- World y points upward; screen y downward. CSS pixels are the camera coordinate space; the high-DPI backing store is a presentation detail.
- Camera mapping and inverse are shared by artwork, coordinate lines and picking. Grid is clipped to visible room bounds, not stretched or re-anchored by camera position.
- True axes are drawn only at x=0 and y=0 if those lines are visible. Dark labelled edge rulers provide x/y coordinates even if the origin is offscreen; they are explicitly guides, not substitute axes. Origin is labelled when visible.
- Grid spacing is 1 world unit whenever at least 8 CSS pixels separate grid lines, otherwise a readable 1–2–5 integer step; stronger lines and labels use a multiple of that spacing. Status shows the actual displayed grid spacing. Dense labels are omitted near the ruler edges to avoid overlap. Labels are CSS-pixel-sized with outlined text and dark backing. Picked points retain world coordinates across resize and zoom. Marker is hidden when outside the visible room but its exact readout remains.
- Coordinate geometry and display state are independent of room polygons. No changes to physical geometry, scoring or spell rules. Pick results are a reusable input for future rotation/enlargement centres and mirror-line tools; they do not replace explicit mathematical parameters.

## Tests and QA
Unit tests cover zero and negative coordinates, adaptive grid steps, ruler/axis visibility, snap rules, typed input, CSS-to-world conversions and zoom invariants. Mock canvas checks overlay rendering and state isolation; room controller tests verify toggles, picking and listener cleanup. Source/build HTTP checks cover new modules and UI. Actual browser QA remains necessary: compare wide desktop, short landscape and portrait; check labels and marker when origin leaves view, off-grid state, keyboard form submission, touch picking, zoom bounds, and readable compact toolbar. PR05 will add player movement.
