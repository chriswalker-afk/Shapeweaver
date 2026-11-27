# PR06 — Interactive object engine

The Gatehouse practice room remains playable. Open Objects to pause movement and inspect props. Select by clicking/tapping their outlined polygon (including inaccessible objects) or using the labelled list, then choose one of its permitted transformations. Non-interactive terrain and the decorative crate cannot be selected. The coordinate picker and object inspector are mutually exclusive. Closing Objects restores movement; no spell is committed in PR06.

## Definitions
- Timber beam: translation only, supported.
- Hinged gate: rotation only, fixed corner hinge H at (31.2, 6). Moved behind the exit to keep the existing practice route clear and offer a legal rotation preview.
- Cheese wedge: enlargement (positive factors 0.5–2) and reflection, supported.
- Decorative crate: no permissions, not solid or selectable.

Objects use authoritative CCW world vertices and stable IDs. Reference letters A, B, C, … correspond to source vertices; H represents the hinge. A reflected image reverses winding for collision but preserves correspondence in the separate image reference list. Permissions are checked by the engine, not only hidden UI controls. A supported object needs contact below; a hinged object must use its fixed hinge; enchanted support is reserved for explicitly marked future objects. The support probe establishes local contact only, not a structural load/connected-support simulation.

## Preview mathematics
All inputs are explicit: signed horizontal/vertical displacement, quarter-turn angle/direction and typed centre, positive decimal or fraction scale and typed centre, or x=a / y=b / y=x / y=-x mirror equation. No eval, free drag or automatic answer selection. Empty/invalid parameters, forbidden transformations, identity moves, nonfinite/degenerate results and scale limits are rejected. Original vertices are immutable; the candidate and reference points are returned separately and the preview response is frozen. The dashed ghost, corresponding points and vector/centre/mirror guides follow the camera. Clear removes only the preview.

Final-pose validation checks permission/hinge, room bounds, positive-area polygon overlap with solids/hazards, player intersection or moving a player's supporting object, and support. Polygon overlap uses simple-polygon triangulation and SAT; boundary contact is legal. Red ghost plus textual reason indicates rejection; a clear final pose is explicitly NOT authority to Apply. Translation swept path, rotation arc sweep, enlargement path, actual reflection commit, attachments/linked mechanisms, atomic collision-index rebuild, history and scoring follow in PR07–12. No move is consumed by previews. No commitment or level mutation API is exposed yet.

Example previews (at spawn): beam vector (14, −3.65) creates a ghost over the second gap; wedge factor 1.5 about (4,3), wedge reflection x=5.2, gate 90° anticlockwise about H. These are inspection examples, not puzzle answers or verified spell paths. The gate's portal proximity is intentional for this temporary fixture; the portal is a trigger, not solid terrain.

## QA
Tests cover selection, permissions, geometry/vertex correspondence, exact quarter turns, fraction parsing, no-op rejection, concave overlaps/contact, player safety, support, final bounds, immutability, preview-only UI, and retained movement replay. Browser visual review remains required for small viewports, marker visibility, form focus/touch, selection and paused/resumed movement. PR07 should implement actual translation with swept collision validation, atomic apply/rebuild, animation and Level 1 Across the Brook; retain explicit mathematical input and never treat final-pose success as path success.
