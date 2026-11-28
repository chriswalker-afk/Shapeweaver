# PR40 — Home-screen acceptance

## Polish decisions
Keep the four native actions and progress-aware Continue unchanged. Place the magical projection inside a reserved scenery grid cell; portrait places the projection above the menu, while short portrait (at most 820 × 720 CSS px) and narrow landscape (at most 680 CSS px wide) give the menu the entire area. Wider displays keep the storybook landscape on the right. No geometry or scoring change. Compact cards retain readable text, long labels wrap rather than clip, progress has a contained strip, and the auxiliary motion button does not cause the narrow header's version text to jump in and out. Card names/descriptions are separate accessible attributes, focus remains visible, and a motion control hidden by a media preference or resize sends focus to Continue. The 24-second scene uses the existing exact maths; unchanged attributes are no longer written during settled frames. Manual pause shows the current shape even during a fade.

## Automated release gates
Run npm run release:check, production smoke at both hosting paths, focused home acceptance, all 144 campaign level/viewport checks, and workshop browser QA. Focused home acceptance covers compact phone, narrow phone, modern phone, tablet portrait, short landscape, landscape phone, small desktop, classroom desktop, full HD, ultrawide and text enlargement. Check menu bounds, scroll/reflow, art/copy separation, projection containment, native accessible names, keyboard navigation, actual focus, button activation, touch targets, progress states and colour contrast against a conservative card background bound; check saved reduced motion and compact/resize transitions, mutation counts while settled and zero mutation while paused. It saves home screenshots and a JSON report in a separate small artifact. The existing PR39 checks still cover all four spells and motion/visibility lifecycle.

## Human sign-off (not replaceable by scripted bounds checks)
- Inspect the `shapeweaver-home-review` artifact (all layouts including long Continue and text enlargement; confirm balance, artwork legibility, no clipped copy or obscured gate).
- Open the production URL on a classroom desktop and a real phone, in both orientations. Try all four actions, tab order, enter/space, pause, system reduced motion, pause a real puzzle and visit practice, reload, confirm stars/progress, check no scroll trapping.
- Confirm GitHub Pages verify job reports the exact merged commit and HTTPS URL. If there is a blocker, fix it in a focused follow-up before sign-off. Do not claim screenshot inspection or real-device acceptance from automated success alone.

## Next
After PR40 passes, merge and verify production, then carry out the human acceptance checklist. Consider a separate optional public level workshop only after that sign-off.
