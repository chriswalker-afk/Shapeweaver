# Shapeweaver

**Reshape the world. Find your way.**

A storybook fantasy puzzle platformer in which an apprentice magician uses mathematical transformations to overcome obstacles and reach the exit. Translate a log to bridge a river, rotate a hinged gate, enlarge a cheese wedge into a ramp, or reflect a barrel out of a sealed chamber.

## Project status

PR23 — The Riverworks: Levels 15–16. Sixteen released puzzles, simultaneous pressure plates, visible linked counts, diagonal reflection of an irregular dock bracket, dependent upper span, workshop replay fixtures. Next: PR24 Levels 17–18.

## Design documents

- [Game design](docs/game-design.md) — player experience, mathematics, rules, recovery, accessibility and visual direction.
- [Campaign](docs/campaign.md) — 36 proposed levels across seven chapters, new mechanics and validation targets.
- [Implementation roadmap](docs/roadmap.md) — PR01–36 and optional extensions.
- [Visual identity](docs/visual-identity.md) — branding, artwork, spell symbols and chapter palettes.
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

Target: a static browser game hosted on GitHub Pages, eventually at `shapeweaver.mrwalkermaths.com`. Hosting and domain configuration are not yet set up.

See the roadmap before starting the next PR. Level briefs are proposals, not certified solutions; geometry, move targets and traversability must be verified during implementation.

## Development

Requires Node.js 22 or later and npm. No third-party runtime or development dependencies.

- `npm run dev` — serve source files at http://127.0.0.1:4173/ (refresh after editing).
- `npm test` — run the Node test suite, including a real HTTP smoke test under the root and repository subpath.
- `npm run build` — copy the public application into a clean `dist/` directory.
- `npm run preview` — build and serve the production output locally.
- `npm run check` — run tests and build.

The dev server binds only to localhost. Set `PORT=...` if needed, or `BASE_PATH=/Shapeweaver/` to simulate the GitHub Pages project subpath. For example, `BASE_PATH=/Shapeweaver/ npm run preview` (POSIX shell); open http://127.0.0.1:4173/Shapeweaver/. Use relative module and asset URLs so the app works at a custom domain as well.

## Deployment

CI tests and builds on pull requests and main pushes. To publish the static site, an administrator must first choose **GitHub Actions** in Settings → Pages → Build and deployment → Source. Then manually run the **Deploy to GitHub Pages** workflow on main. It tests, builds, uploads only `dist/`, and deploys via the protected github-pages environment. No deployment is claimed until Pages is configured and the workflow succeeds. Automatic deployment and custom-domain configuration can follow at release.

## Scaffold scope

The entry module mounts a responsive high-DPI canvas beneath an illustrated title and accessible spellbook. Title artwork and the reference apprentice are original SVG files, not playable collision geometry. PR03 adds the separate world renderer and camera; PR04 adds the mathematical overlay and coordinate picker; PR05 implements deterministic player movement; PR06 introduces interactive objects.

### Internal developer workshop

Run `npm run workshop` and open http://127.0.0.1:4173/workshop/index.html. Load a copy of any released puzzle or create a blank draft, place and drag items on the grid, edit exact properties, validate, playtest, and export a verified JSON bundle. Run `npm run verify:level -- path/to/level.verified.json` to independently replay an exported proof. The workshop directory is excluded from the public build and is served only by explicit opt-in. No level is automatically registered in the campaign.
