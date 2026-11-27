# PR13 — Tutorials and hints

The four official Gatehouse puzzles share a read-only state-driven guide. It explains objective, keyboard/touch movement, remote selection, permitted transformation, mathematical input, Preview and Apply, rejection feedback, traversal and recovery. Guidance reacts to coordinate picking, inspector selection, valid/invalid preview, cast animation and current geometry. On by default; toggle off for independent practice, retaining the choice between levels in the session. No forced steps. Completion and stars still depend on actual traversal and committed moves.

## Five stages
1. Obstacle — physical problem.
2. Useful object — relevant prop.
3. Transformation — mathematical concept.
4. Mathematical reasoning — current coordinates and target relationship, without computing the final parameters.
5. Worked solution — explicitly choose Show worked solution to reveal calculation and parameters.

Separate non-modal footer panel, hidden initially. Previous/next/close controls. No auto-selection, fill, preview or application. Hint use has no move or star cost. Successful cast, undo, reset, manual return, level change and leaving gameplay close the panel. Blocked respawn and completion close it too. Practice has no official tutorial hints.

## Live geometry
The UI's authoritative tutorial module reads stable reference points and bounds from current geometry. Recognises intended usable arrangements and common alternatives rather than suggesting identity moves; not a general solver or completion gate. Legacy three-stage level helper exports remain for earlier regression fixtures. Translation uses current signed differences; rotation uses current hinge/ray and signed arc; enlargement uses the remaining height ratio and centre mapping the base to the intended point (or a bounded intermediate factor); reflection uses current barrel centre and the corresponding point's midpoint, including after winding reversal. Unfamiliar arrangements without a useful candidate suggest undo/reset. At stage 5 the actual preview validator checks the current room and player, explains rejections and advises repositioning or recovery. A clear example is a suggestion at reveal time, not a promise after movement. Apply revalidates. No mutation from guidance or hints.

## QA
Test stages, explicit reveal, contextual steps, ready and corrected geometry, no move cost, toggle and lifecycle. Real browser/touch/layout review and text-length calibration belong to PR14. No new puzzles, domain or deployment changes.

Next: PR14 — Gatehouse polish, classroom-ready review of Levels 1–4.
