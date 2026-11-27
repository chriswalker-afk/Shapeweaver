# Shapeweaver

**Reshape the world. Find your way.**

A storybook fantasy puzzle platformer in which an apprentice magician uses mathematical transformations to overcome obstacles and reach the exit. Translate a log to bridge a river, rotate a hinged gate, enlarge a cheese wedge into a ramp, or reflect a barrel out of a sealed chamber.

## Project status

PR00 — repository bootstrap. The game is not yet playable. PR01 will establish the runnable browser scaffold, tests and deployment workflow.

## Design documents

- [Game design](docs/game-design.md) — player experience, mathematics, rules, recovery, accessibility and visual direction.
- [Campaign](docs/campaign.md) — 36 proposed levels across seven chapters, new mechanics and validation targets.
- [Implementation roadmap](docs/roadmap.md) — PR01–36 and optional extensions.
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
