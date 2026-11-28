# Shapeweaver

**Reshape the world. Find your way.**

A storybook fantasy puzzle platformer in which an apprentice magician uses mathematical transformations to overcome obstacles and reach the exit. Translate a log to bridge a river, rotate a hinged gate, enlarge a cheese wedge into a ramp, or reflect a barrel out of a sealed chamber.

## Project status

PR37 — Home page redesign. The 36-level campaign is unchanged; a four-action home and session-local Continue are ready for review. Next: PR38 — Home page art and card illustrations.

## Design documents

- [Home page redesign](docs/home-redesign.md) — navigation, continuation contract, responsive layout and artwork roadmap.
- [Player and teacher guide](docs/player-teacher-guide.md) — controls, learning objectives, classroom use and local progress.
- [Release checklist](docs/release.md) — activation, deployment verification, custom domain, rollback and manual QA.
- [Game design](docs/game-design.md) — player experience, mathematics, rules, recovery, accessibility and visual direction.
- [Campaign](docs/campaign.md) — 36 authored levels across seven chapters, new mechanics and validation targets.
- [Final polish](docs/final-polish.md) — controls, visual feedback, audio, accessibility, performance and QA checklist.
- [Final campaign audit](docs/final-campaign-audit.md) — release acceptance matrix, progression review, scope and outstanding QA.
- [Implementation roadmap](docs/roadmap.md) — PR01–36 and optional extensions.
- [Visual identity](docs/visual-identity.md) — branding, artwork, spell symbols and chapter palettes.
- [Observatory finale](docs/observatory-finale.md) — interconnected machine and summit mastery routes.
- [Observatory alternative routes and delivery](docs/observatory-routes.md) — three verified strategies and live receiver fit.
- [Observatory opening](docs/observatory-mirrors.md) — live movable mirror equations and bridge reuse.
- [Alchemist’s Workshop finale and review](docs/alchemist-finale.md) — selector state, chronological bridge reuse, chapter review.
- [Alchemist’s movable pivots](docs/alchemist-pivots.md) — attached beams and shared moving centres.
- [Alchemist’s Workshop opening](docs/alchemist-workshop.md) — fractional scale factors and physical clearance.
- [Mirror Archives finale](docs/archives-finale.md) — rigid compound assemblies and linked pressure/shape mechanisms.
- [Mirror Archives latches](docs/archives-latches.md) — one-way latches and key capture.
- [Mirror Archives opening](docs/mirror-archives.md) — reusable pieces, intermediate safe checkpoints and interleaved replay.
- [Riverworks finale](docs/riverworks-finale.md) — waterwheel rotor and external-centre orbiting walkway.
- [Riverworks mechanisms](docs/riverworks-mechanisms.md) — simultaneous pressure plates, diagonal mirror lines and compound dock supports.
- [Riverworks opening](docs/riverworks.md) — Levels 13–14, structural supports and verified replay routes.
- [Internal level workshop](docs/internal-workshop.md) — authoring, validation and replay workflow.
- [First campaign audit](docs/first-campaign-audit.md) — replay evidence, difficulty review and remaining classroom QA.
- [Clockwork finale](docs/clockwork-finale.md) — Levels 11–12, shape-socket geometry and external centres.
- [Clockwork Gallery](docs/clockwork-gallery.md) — Levels 9–10, sequential spells and hinge socket rules.
- [Garden finale](docs/garden-finale.md) — Levels 7–8, derived climb geometry and traversal QA.
- [Enchanted Gardens](docs/enchanted-gardens.md) — Levels 5–6, mechanism rules and recorded traversal.
- [Campaign and level library](docs/campaign-library.md) — chapter map, direct access, filtering and saved progress.
- [Gatehouse polish](docs/gatehouse-polish.md) — review scope, visual and replay QA.
- [Tutorials and hints](docs/tutorials-and-hints.md) — contextual guidance, five-stage hints, live geometry and worked examples.
- [Stars and results](docs/stars-and-results.md) — scoring, completion history, personal best and navigation.
- [Mistake recovery](docs/mistake-recovery.md) — safe snapshots, recovery controls and attempt accounting.
- [Reflection tutorial](docs/reflection-tutorial.md) — mirror equations, stable vertices, magical transfer and verified traversal.
- [Enlargement tutorial](docs/enlargement-tutorial.md) — positive homothety sweep, scale animation and verified ramp traversal.
- [Rotation tutorial](docs/rotation-tutorial.md) — signed arc validation, shared commit boundary and verified Level 2 replay.
- [Translation tutorial](docs/translation-tutorial.md) — sweep, apply transaction, animation and verified Level 1 replay.
- [Interactive object engine](docs/object-engine.md) — permissions, selection, reference geometry, previews and final-pose validation.
- [Platformer engine](docs/platformer-engine.md) — movement, collision, ladder, checkpoint and replay contract.
- [Coordinate system](docs/coordinate-system.md) — grid, true axes, adaptive rulers, zoom and point picking.
- [World renderer](docs/world-renderer.md) — room fixture, camera, layer ordering and geometry contract.
- [Architecture and quality](docs/architecture.md) — technical boundaries, geometry, level data and test strategy.
- [Contribution guide](CONTRIBUTING.md) — PR workflow and acceptance criteria.

## Core commitments

- Real mathematical coordinates and explicit transformation parameters, not drag-to-solve.
- Toggleable coordinate grid and axes, accurate previews and consistent collision geometry.
- New mechanics at least every three levels; puzzles recombine mechanics creatively.
- Accept any physically valid solution; stars reward efficiency, never speed.
- Safe experimentation, progressive hints, undo and reset.
- A large gameplay viewport and a distinct illustrated fantasy identity.
- Direct access to released puzzles for classroom use, without accounts or a server.

Expected GitHub Pages address after activation: https://chriswalker-afk.github.io/Shapeweaver/. Planned custom domain: `shapeweaver.mrwalkermaths.com`. Neither address is claimed live until a successful hosted verification.

See the final campaign audit for verified recorded routes and limitations; difficulty ratings are author estimates rather than classroom outcome measurements.

## Development

Requires Node.js 22 or later and npm. No third-party runtime or development dependencies.

- `npm run dev` — serve source files at http://127.0.0.1:4173/ (refresh after editing).
- `npm test` — run the Node test suite, including a real HTTP smoke test under the root and repository subpath.
- `npm run build` — copy the public application into a clean `dist/` directory.
- `npm run preview` — build and serve the production output locally.
- `npm run check` — run tests and build.
- `npm run release:check` — tests, build, full campaign integrity and public artifact verification.
- `npm run verify:dist` — verify the exact public artifact, version, imports and asset manifest.

The dev server binds only to localhost. Set `PORT=...` if needed, or `BASE_PATH=/Shapeweaver/` to simulate the GitHub Pages project subpath. For example, `BASE_PATH=/Shapeweaver/ npm run preview` (POSIX shell); open http://127.0.0.1:4173/Shapeweaver/. Use relative module and asset URLs so the app works at a custom domain as well.

## Deployment

On first release, enable GitHub Actions publishing in Settings → Pages, then run the **Deploy to GitHub Pages** workflow on merged main. Once Pages is enabled, main pushes also trigger deployment. The workflow verifies the campaign and production artifact, tests actual browser gameplay at both supported hosting paths, deploys only `dist/` and verifies the hosted version and exact commit over HTTPS. See [release checklist](docs/release.md) for all steps. The internal workshop, tests and developer documentation are excluded from the deployed site. Progress is saved locally on the browser and origin; there are no player accounts or analytics.

### Internal developer workshop

Run `npm run workshop` and open http://127.0.0.1:4173/workshop/index.html. Load a copy of any released puzzle or create a blank draft, place and drag items on the grid, edit exact properties, validate, playtest, and export a verified JSON bundle. Run `npm run verify:level -- path/to/level.verified.json` to independently replay an exported proof. The workshop directory is excluded from the public build and is served only by explicit opt-in. No level is automatically registered in the campaign.

### Home-screen acceptance
The four-action menu, bespoke illustrations and optional spell showcase are covered by the normal release checks and by `node tools/home-polish-qa.mjs` (requires the existing optional Playwright/Chromium QA installation). The Browser QA workflow publishes a small `shapeweaver-home-review` screenshot/report artifact for human visual review, separately from full campaign screenshots. See [Home acceptance](docs/home-acceptance.md).
