# Production release checklist — Shapeweaver v1.0.0

## Scope and evidence

Version 1.0.0 is the first release candidate. The original 36-PR roadmap is complete in code: 36 levels, seven chapters, 108 available stars, four formal transformation types, staged hints, replay, local best results and optional presentation controls. No level geometry, physics, transformation validation or star thresholds changed in PR36. The internal workshop is developer-only.

PR35's verified baseline: 297 tests passed; all 36 canonical and hinted routes, three alternative routes, 455 exact point images, 90 previews/undo/safe-return checks, 39 verified workshop bundles, zero sampled shortcut hits and all 144 initial-level/cast-setup viewport combinations passed. These figures refer to PR35; the PR36 workflows are the release-candidate acceptance gate. Bounded shortcut probes are not a proof of uniqueness or minimum moves.

## Local and pull-request acceptance

- Node 22 or later. Run `npm run release:check` (tests, clean public build, campaign audit, artifact verifier). The artifact verifier checks the real directory tree, local module/HTML/CSS references, manifest assets and runtime asset constants, version consistency and generated release identity. Runtime has no external packages.
- `npm run preview` serves `dist/` at root; `BASE_PATH=/Shapeweaver/ npm run preview` simulates project Pages. On Windows set BASE_PATH in the environment before launching.
- Browser QA installs Playwright and Chromium only in CI; production runtime remains dependency-free. The production smoke uses real form inputs, rotation, keyboard traversal, results, library navigation, reload/persistence and absence of third-party browser requests at both root and project subpath. Full 144-combination browser suite also runs against the actual production build at the project subpath. Internal workshop smoke remains separate against local source.
- Verify that Scaffold CI and Browser QA on the exact PR36 head both succeed; then merge. Do not claim the site is deployed merely because the PR passes.
- CI writes `dist/assets/release.json` with name, version and the exact Git commit from GITHUB_SHA. Local builds have a null commit unless a SHA is supplied.

## First public deployment (administrator action)

At PR36 preparation, repository metadata reported Pages disabled. The available repository connector cannot activate that setting or dispatch the workflow. The following steps must be performed in GitHub:

1. Merge PR36 only after required checks pass.
2. Open [repository Pages settings](https://github.com/chriswalker-afk/Shapeweaver/settings/pages). Under Build and deployment, select GitHub Actions as Source. If available, restrict the github-pages environment to the default branch.
3. Open [Deploy to GitHub Pages](https://github.com/chriswalker-afk/Shapeweaver/actions/workflows/pages.yml), choose Run workflow, select main, and run. The workflow builds and tests the candidate, runs both production hosting-path browser smoke tests, uploads only dist, deploys to the github-pages environment and checks the hosted release over HTTPS. If required by environment protection, approve deployment in GitHub.
4. Verify all build, deploy and verify jobs succeeded; read the actual Pages output URL. Expected project URL: https://chriswalker-afk.github.io/Shapeweaver/. The verify job requests the page, release identity, entry module and crest SVG over HTTPS, checks content types and compares the exact published SHA to the workflow SHA. This guards against stale artifacts and wrong sites. If deploy succeeds but verification fails, do not announce release: inspect the URL, DNS or stale-cache error and re-run after correcting it.
5. Open the actual public URL on school equipment and confirm the title, library, selected puzzle, cast, reset, results and local progress. The workflow does not by itself establish classroom readiness.
6. Once Pages is enabled, future main pushes automatically deploy via this workflow after the release checks; PRs never deploy. Manual workflow runs remain available on main.

Reference: [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Custom-domain preparation (not configured by PR36)

Target: `shapeweaver.mrwalkermaths.com`. Only after the default site is verified:

1. Confirm the domain is controlled by the account holder, verify domain ownership in GitHub where appropriate, and check for any existing DNS or Pages association for this exact hostname.
2. In the repository Pages settings, set the custom domain to `shapeweaver.mrwalkermaths.com`.
3. At the DNS provider, create a CNAME named `shapeweaver` pointing to `chriswalker-afk.github.io` (no scheme and no /Shapeweaver/ path). Start DNS-only rather than proxied while GitHub validates the record and provisions its TLS certificate. Do not change unrelated records or use wildcard DNS.
4. Confirm GitHub's DNS check succeeds and enable Enforce HTTPS when available. Check the custom domain in a clean browser and run `node tools/verify-live.mjs https://shapeweaver.mrwalkermaths.com/ <merged-commit-SHA>` from the matching checkout.
5. Confirm the exact live URL, correct version/commit, working art and modules, and no certificate warning before adding the game to the teacher's games directory. Site data is origin-specific, so progress on github.io does not automatically transfer to the custom hostname.

A CNAME file in the artifact is not a substitute for Pages settings with an Actions publishing source. No DNS, custom domain, repository settings, external directory or release tag is changed by this PR. If domain setup fails, remove the custom-domain association and its dedicated DNS record in a coordinated manner, and keep using the verified Pages URL. Never leave an unclaimed dangling CNAME.

Reference: [GitHub Pages custom subdomain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Manual release acceptance — outstanding

Record the device/browser/date, result and screenshots where appropriate. Automated screenshots are evidence to inspect, not human approval.

| Check | Acceptance |
| --- | --- |
| Desktop and school laptop | Stage remains usable at actual resolution; object labels and mathematical inputs legible; no clipping or broken navigation |
| Physical tablet/phone | Multi-touch movement and jumping, casting, soft keyboard, orientation change, focus mode and object locator |
| Accessibility | Keyboard-only navigation and visible focus, system/user reduced motion, accessible labels, screen-reader interaction with inspector and results; document canvas limitations |
| Sound | Silent by default, deliberate enable, audible but unobtrusive cues, mute stops playback, no errors when audio unavailable |
| Performance | Observe real hardware frame pacing and memory in wide Observatory rooms; no measured frame-rate claim |
| Classroom trial | Sample tutorial levels 1–4, first linked mechanism, fractional enlargement, reusable object, alternative routes and final challenge; record misconceptions and time-to-solve |
| Data and progress | Shared/private device behaviour, browser reload, no central student tracking, origin change caveat |

## Rollback and maintenance

If a deployed commit is defective, use a revert PR on main, run full CI, merge, and let the deployment workflow republish the corrected commit. For an emergency, disable publishing through repository settings if necessary; do not force-push main. Inspect the actual release identity and hosted verification after rollback. Keep changes to versioned best-results storage backward compatible. No public workshop or new campaign mechanics are required for this release.

## After release

First publish and confirm HTTPS, then link the live game from the games directory, then conduct the documented classroom trial. Optional next development milestone PR37: public drag-and-drop level workshop; defer that until the base game is reliably published and tested. A GitHub v1.0.0 tag/release can be created after the hosted commit is verified, not in advance.
