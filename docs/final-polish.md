# Final polish — PR35

## Player-facing improvements
- Close-up is available beside Grid and Objects; it follows the apprentice. Full room restores the overview. The existing view tools retain pan, zoom, coordinate picking and follow control.
- In Objects, Locate object frames the selected original and Locate image frames the current preview. Exact geometry and mathematical input are unchanged. Returning to movement restores following after object location. Crystal receiver vertices are marked T1, T2, etc. on the canvas as well as in the inspector.
- World labels use fixed CSS-pixel lettering, a contrasting background, bounded collision-aware placement and leader lines when displaced. Dense overview labels that cannot fit without collision may be omitted; close-up and the object inspector reveal details. Locked delivery portals have a visible lock as well as text.
- Focus view (View tools) reduces heading and redundant status space without hiding Objects, Grid, recovery, movement, optional hints or guidance controls. Responsive touch targets and held-button feedback preserve simultaneous movement and jumping.
- Sound is off by default; enable in View tools. Original, synthesized short cues distinguish spells, mechanism changes, checkpoints, recovery and completion. No continuous music or audio asset download. Local preference is optional and storage/audio errors must not prevent gameplay. Motion defaults to the OS setting; the optional reduced setting never overrides a reduced-motion OS preference.
- All solved levels remain available. The results distinguish reaching the last portal from solving all 36 levels; campaign completion celebrates total stars and encourages replay if fewer than 108. Back to Levels opens the puzzle library, rather than the title.
- Static canvases no longer require layout reads on each frame when ResizeObserver is available; gameplay only redraws after visual state changes, with explicit redraws for input, resize, image load and camera changes. No physics timestep or collision change.

## Acceptance
All original campaign geometry, 36 canonical routes, three alternatives, scoring, and recovery rules are unchanged. Run full Scaffold CI and Browser QA; new automated checks cover optional settings, audio lifecycle, frame selection, label placement, cached redraw, focus mode, and campaign completion. Browser checks include four viewport sizes, but automated layout assertions are not a substitute for human screenshot review. Manual visual QA, physical touch devices, sound audibility and accessibility review with assistive technology and classroom playtesting remain pending. No claim of measured frame-rate improvement on actual school hardware.

## Next
PR36 — Production release: complete release regression, production build and deployment configuration, documentation and custom-domain preparation. Review real-device and classroom evidence before declaring release fully verified.
