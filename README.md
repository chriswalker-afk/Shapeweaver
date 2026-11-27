# Shapeweaver

**Reshape the world. Find your way.**

A storybook fantasy puzzle platformer in which an apprentice magician uses mathematical transformations to overcome obstacles and reach the exit. Translate a log to bridge a river, rotate a hinged gate, enlarge a cheese wedge into a ramp, or reflect a barrel out of a sealed chamber.

## Project status

PR03 — world renderer. Open Explore the Gatehouse from the title to inspect a static world-space test room with layered scenery, terrain, props and camera controls. Not yet playable. Next: PR04 coordinate grid and axes.

## Design documents

- [Game design](docs/game-design.md) — player experience, mathematics, rules, recovery, accessibility and visual direction.
- [Campaign](docs/campaign.md) — 36 proposed levels across seven chapters, new mechanics and validation targets.
- [Implementation roadmap](docs/roadmap.md) — PR01–36 and optional extensions.
- [Visual identity](docs/visual-identity.md) — branding, artwork, spell symbols and chapter palettes.
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

The entry module mounts a responsive high-DPI canvas beneath an illustrated title and accessible spellbook. Title artwork and the reference apprentice are original SVG files, not playable collision geometry. PR03 adds the separate world renderer and camera; PR04–06 implement the grid, player and object engine.
