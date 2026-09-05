# Nav Beacon

Browser-based tools for Elite Dangerous. Ship Builder is the first of them: pick
a hull, fit and engineer modules, read the resulting build metrics, and export
the build as SLEF. It runs at **[navbeacon.app](https://navbeacon.app/)**.

The application is **client-side only**. There is no backend and no account:
builds live in your browser (`localStorage`) or in a URL, and nothing is ever
uploaded. See [`.specify/memory/constitution.md`](./.specify/memory/constitution.md)
for the principles this project is held to.

Game data and build calculations come from
[`@elite-dangerous-almanac/core`](https://github.com/DarkSession/Elite-Dangerous-Almanac),
which is the single source of truth: defects and gaps there are fixed in the
library, never worked around here.

Desktop, tablet and mobile are all first-class targets.

## Status

In use. Twelve capabilities are specified and built — the hull catalogue and hull
pages, module outfitting and engineering, ship statistics, SLEF import and
export, power and heat, the defence, offence and mobility profiles, cost and
materials, hull anatomy, the interface foundations the whole application is
composed from, and Help · About. Each one's spec is in [`specs/`](./specs), and
each is the record of what the capability owes a Commander.

The application is installable, works offline after first load, and reads in
English and German.

## Requirements

- Node.js — see [`.nvmrc`](./.nvmrc) and `package.json#engines`
- [pnpm](https://pnpm.io/) (enabled via `corepack enable`)

The [dev container](./.devcontainer/devcontainer.json) provides all of the above,
plus the GitHub CLI, Python and Claude Code. Open the repository in a dev
container and everything is installed for you.

## Getting started

```bash
pnpm install
pnpm start        # dev server on http://localhost:4200/
```

## Scripts

| Command                | What it does                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `pnpm start`           | Run the dev server with hot reload                                     |
| `pnpm run build`       | Production build into `dist/`                                          |
| `pnpm test`            | Run the unit tests with coverage                                       |
| `pnpm run e2e`         | Run the Playwright suite across all ten projects                       |
| `pnpm run e2e:ui`      | Run Playwright in interactive UI mode                                  |
| `pnpm run e2e:offline` | Serve the production build and run the service-worker journeys         |
| `pnpm run ui:preview`  | Serve the tooling-only component preview catalogue                     |
| `pnpm run policy`      | Run the repository interface-policy checks                             |
| `pnpm run typecheck`   | Type-check the project without emitting                                |
| `pnpm run format`      | Format the repository with Prettier                                    |
| `pnpm run check`       | Format check, typecheck, builds, policy, unit tests and the E2E suites |

Run `pnpm run check` before proposing a change.

## Running and debugging

The dev server binds to `0.0.0.0` so the dev container's forwarded ports reach
it; the addresses stay the same (`http://localhost:4200/` for the product,
`http://localhost:4300/` for the preview catalogue).

Pick **`ng serve`** in Run and Debug (`F5`) or run the `ng serve` task
(`Ctrl+Shift+B`) — both start the same server in a terminal you can stop. VS
Code opens the app on your own machine when it forwards port 4200; the
container has no browser to attach a debugger to, so its developer tools do
the front-end debugging.

Unit tests do run under the debugger: the **`ng test`** launch configuration
runs them in watch mode and stops on breakpoints in specs and source.

## Testing

Unit tests live beside their source in `src/` and run on Vitest through the
Angular unit-test builder. Coverage is enforced at **80%** for statements,
branches, functions and lines; the thresholds are configured in
[`angular.json`](./angular.json) and a build below them fails.

End-to-end tests live in [`e2e/`](./e2e) and run on
[Playwright](https://playwright.dev/) as part of `pnpm run check`.
[`playwright.config.ts`](./playwright.config.ts) generates **ten projects** —
five layout profiles in each of two engines:

| Profile          | Viewport   | Touch | Engines           |
| ---------------- | ---------- | ----- | ----------------- |
| desktop          | 1440 × 900 | no    | Chromium, Firefox |
| tablet portrait  | 834 × 1112 | yes   | Chromium, Firefox |
| tablet landscape | 1112 × 834 | yes   | Chromium, Firefox |
| mobile portrait  | 390 × 844  | yes   | Chromium, Firefox |
| mobile landscape | 844 × 390  | yes   | Chromium, Firefox |

Every rendered product and preview state is scanned with
[`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright)
against WCAG 2.0, 2.1 and 2.2 level A and AA, with no rule disabled; an in-scope
violation fails the build and the full result is attached to the failure. On top
of the ten projects the suite runs 200% text-scale, 320 CSS-pixel reflow,
reduced-motion, expanded-copy and right-to-left variants, and the production
offline and update journeys under `pnpm run e2e:offline`.

CI may shard the matrix; it may not reduce it. The project names are generated
from the same constants the coverage ledger uses
([`e2e/coverage-ledger.ts`](./e2e/coverage-ledger.ts)), and `pnpm run policy`
reconciles the two.

Automation is a floor. The versioned manual protocols in
[`e2e/manual/`](./e2e/manual) — screen-reader journeys and actual 400% browser
zoom — cover what no scan can judge.

Playwright needs browsers installed once:

```bash
pnpm exec playwright install --with-deps chromium firefox
```

The dev container does this for you. If your environment already ships a browser
whose build does not match the one Playwright pins, point at it instead of
editing the config:

```bash
E2E_CHROMIUM_PATH=/path/to/chromium E2E_FIREFOX_PATH=/path/to/firefox pnpm run e2e
```

## Deployment

The application is published to GitHub Pages at
**[navbeacon.app](https://navbeacon.app/)** by
the final job in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml). A
deployment is only the static output of `pnpm run build`: there is no host-side
build step and nothing runs on the server.

For a push to `main`, the production build is packaged in the same workflow run
that checks it and is published only after every CI job succeeds. Pull requests
run the checks but never package or publish a Pages artifact. A separate
[`workflow_dispatch` recovery path](./.github/workflows/deploy.yml) republishes
`main` by verifying that exact commit's CI gate and reusing its retained Pages
artifact; it neither rebuilds the application nor executes repository code.

Two details make the deployment behave on Pages:

- [`public/CNAME`](./public/CNAME) names the custom domain. It is copied into the
  build by the asset glob in [`angular.json`](./angular.json), so the domain
  survives every deployment. `<base href="/">` in
  [`src/index.html`](./src/index.html) is correct for a domain of our own and
  needs no rewriting.
- The hull schematics ship as two committed files per side rather than as the
  package's SVG: a PNG rasterised by `scripts/convert-ship-artwork.mjs`, and
  about a kilobyte of JSON written by `scripts/extract-schematic-mounts.mts` —
  the drawing's box, the rectangle it draws in and the middle of every annotated
  mount. Ninety kilobytes of sub-pixel path data per side is work a fixed-ratio
  plate would redo on every resize, and only those few hundred bytes of it are
  ever read. Both scripts read the installed `@elite-dangerous-almanac/core`,
  and the extractor runs the application's own parser, so the contract being
  checked and the geometry being written cannot drift.
- Neither file is a private geometry catalogue, and the policy checker is what
  makes that a fact rather than a promise: each extract records the SHA-256 of
  the package SVG it was made from, `pnpm run policy` recomputes it against the
  installed file, and a package SVG tracked under `public/` or `src/` fails
  outright. Re-run both scripts after moving the package pin;
  [spec 010](./specs/010-hull-anatomy/spec.md) is where the rule is written.
- `index.html` is copied to `404.html` before upload. Pages answers any path that
  is not a file with its own 404 page, which would break a deep link into a
  client-side route; serving the application from `404.html` hands those paths to
  the Angular router instead, with no redirect and no hash fragment.
- Each route `public/sitemap.xml` advertises is also copied to `<route>.html`.
  `404.html` alone catches every address, but Pages serves it with a 404 status,
  and a crawler drops a 404 whatever the body says — so a sitemap of paths that
  only `404.html` answers is a sitemap of errors. `<route>.html` answers 200 with
  no redirect, where `<route>/index.html` would answer 301 to `<route>/`. The
  route list is read out of the sitemap rather than repeated in the workflow.

The repository has to be set up once for this to work: **Settings → Pages →
Build and deployment → Source** set to **GitHub Actions**, and a DNS `CNAME`
record for `navbeacon.app` pointing at `darksession.github.io`. Enable **Enforce
HTTPS** once GitHub has issued the certificate.

### Pull request previews

Every pull request raised from a branch of this repository is built a second
time and published as a browsable preview, so a change can be looked at before
it is merged. A sticky comment on the pull request carries the link, the preview
is replaced on every push and removed when the pull request closes.

Previews are published to
**[Elite-Dangerous-Ship-Builder-Preview](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder-Preview)**,
not to this repository, because this repository's Pages site _is_ the production
site: `public/CNAME` points it at `navbeacon.app`, and a repository serves exactly
one Pages site. A preview published from here would land on the production
domain. The preview repository has no custom domain, so its previews reach the
account's default Pages host instead:

```
https://darksession.github.io/Elite-Dangerous-Ship-Builder-Preview/pr-preview/pr-<number>/
```

The [`preview` job in `ci.yml`](./.github/workflows/ci.yml) publishes them and
the [`preview-cleanup.yml`](./.github/workflows/preview-cleanup.yml) workflow
removes them, both through
[`pr-preview-action`](https://github.com/rossjrw/pr-preview-action), pinned to a
commit because it is handed a token that can write to another repository. Four
things are worth knowing about them:

- **A preview waits only for the `Check` job**, not for the end-to-end matrix,
  so it is there to look at while the shards are still running. It gates
  nothing: the production `deploy` job does not need it, and a preview that
  fails cannot hold up a merge.
- **A preview is built separately from the checked build**, because it is served
  from a sub-path rather than from the root of a domain and `<base href>` is
  written into the bundle at build time. The build is otherwise the production
  one, service worker included — the base href reaches `ngsw.json` too.
- **Nothing the application asks for at runtime may be a root-absolute path.**
  A leading `/` looks past the deployment base and misses the file, which is
  invisible at the root of a domain and fatal one directory down. So the locale
  catalogues are `i18n/<tag>.json` relative to the base — `fetch` resolves a
  relative path against the document's base URL — and the `@font-face` sources
  in [`src/styles/_fonts.scss`](./src/styles/_fonts.scss) are
  `fonts/<family>/…woff2` relative to the stylesheet, which is emitted at the
  base. `externalDependencies: ["fonts/*"]` in
  [`angular.json`](./angular.json) is what keeps the bundler from resolving
  those at build time and leaves the relative URL in the emitted CSS. At the
  root of a domain all of them resolve exactly as the absolute paths they
  replaced, so production is unchanged.
- **`public/CNAME` is deleted from the preview** before it is published. Pages
  reads a `CNAME` only at the root of the published branch, so a copy in a
  preview directory is inert, but a file claiming the production domain has no
  business in a preview.
- **Previews share one origin.** `darksession.github.io` is the origin for every
  preview, so saved builds in `localStorage` are visible across them. Each
  preview's service worker is scoped to its own directory and cannot serve
  another.

Pull requests from forks are not previewed: a fork's workflow run cannot read
the deployment token. Their checks still run in full.

Two things have to be set up once, in addition to the production settings above:
in the preview repository, **Settings → Pages → Build and deployment → Source**
set to **Deploy from a branch**, with the branch `gh-pages` and folder `/ (root)`
— the branch is created by the first preview, so publish one before setting
this. And in this repository, a secret named `PREVIEW_PAGES_TOKEN` holding a
fine-grained personal access token owned by `DarkSession`, scoped under **Only
select repositories** to `Elite-Dangerous-Ship-Builder-Preview` alone, with
**Repository permissions → Contents: Read and write** as its only permission. It
needs nothing in this repository; the comment on the pull request is written
with the run's own `GITHUB_TOKEN`. If the secret is missing or expired, the
preview job says so in a warning and does nothing else — a missing preview never
fails a run.

That secret is readable by any workflow run of a pull request raised from a
branch of this repository, because a `pull_request` run executes the workflow
file from its own head. Anyone who can push a branch here can therefore read it,
which is why it is scoped to one repository and one permission and is worth
rotating if branch access changes. It grants nothing over this repository or the
production site.

Angular CLI usage analytics are disabled in [`angular.json`](./angular.json)
(`cli.analytics: false`), so no build — local or in CI — reports to Google. The
application itself sends no telemetry either; the constitution forbids it.

## Specifications

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) for
spec-driven development, configured for both Claude Code (`.claude/skills`) and
Codex CLI (`.agents/skills`).

| Spec                                                  | Feature                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [001](./specs/001-ship-selection-and-loading/spec.md) | Ship selection and build loading (search, sort, filters, previews, local storage, build links) |
| [002](./specs/002-module-outfitting/spec.md)          | Module outfitting and engineering, with undo, redo and the edit history                        |
| [003](./specs/003-ship-statistics/spec.md)            | Structural status, issues, headline statistics, assembly requirements and viewing conditions   |
| [004](./specs/004-slef/spec.md)                       | SLEF                                                                                           |
| [005](./specs/005-power-and-heat/spec.md)             | Selectable deployed or retracted power budget, the distributor, and heat                       |
| [006](./specs/006-defence-profile/spec.md)            | Shields, armour, resistances, recovery and cell banks                                          |
| [007](./specs/007-offence-profile/spec.md)            | Almanac-provided damage totals, per-weapon detail, ammunition and capacitor endurance          |
| [008](./specs/008-mobility-and-jump/spec.md)          | Almanac-provided speed, handling, mass and jump performance by load                            |
| [009](./specs/009-cost-and-materials/spec.md)         | Credits, rebuy, Merc Coin and the engineering material bill                                    |
| [010](./specs/010-hull-anatomy/spec.md)               | The build on the hull's schematics — the mount map and navigating by it                        |
| [011](./specs/011-interface-foundations/spec.md)      | The contract every screen obeys — design tokens, one theme, screen readers, localisation       |
| [012](./specs/012-help-and-licences/spec.md)          | Licences, attribution, versions and the answers the application's own decisions provoke        |

Specs 005 to 009 are the areas of the statistics family. Each is independently
deliverable and inherits spec 003, which fixes what every figure about a build
must obey: where it comes from, how it is qualified, what happens when it is
unavailable, and the viewing conditions it is computed under. Spec 011 is the
same kind of contract for screens, and every feature inherits it.

The project constitution lives in
[`.specify/memory/constitution.md`](./.specify/memory/constitution.md).

Specs are scoped to a capability and name no screen: they describe behaviour and
the information each screen must convey. Screens are defined during planning, in
`specs/<NNN>-<short-name>/design/`, and mapped to the requirements they satisfy.
Every screen composes the one design system; responsiveness, touch support,
accessibility and translatability are behavioural requirements, not styling
choices.

### Working on a spec

With Claude Code or Codex CLI in this repository:

```
/speckit-specify     # create or refine a feature specification
/speckit-clarify     # de-risk ambiguous areas (optional)
/speckit-plan        # produce an implementation plan
/speckit-tasks       # break the plan into tasks
/speckit-implement   # execute the tasks
```

## Contributing

[`CONTRIBUTING.md`](./CONTRIBUTING.md) says how to raise a defect, how to make a change, and what
the gate expects before a pull request is opened. Taking part means following the
[code of conduct](./CODE_OF_CONDUCT.md).

A wrong figure or a missing module belongs to
[Elite-Dangerous-Almanac](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues), which owns
the game data and the calculations. A security vulnerability goes in a private report rather than an
issue — [`SECURITY.md`](./SECURITY.md) says how.

## Licence

This project's own code and documentation are **MIT**-licensed — see
[`LICENSE`](./LICENSE), which is also where the terms below are carried in full.

The MIT licence does not cover the Elite Dangerous game data and imagery the
application displays. Those are the property of **Frontier Developments plc**,
reach the application through
[`@elite-dangerous-almanac/core`](https://github.com/DarkSession/Elite-Dangerous-Almanac),
and are used under Frontier's
[media-usage rules](https://forums.frontier.co.uk/threads/elite-dangerous-media-usage-rules.510879/):

> Nav Beacon was created using assets and imagery from Elite Dangerous, with the
> permission of Frontier Developments plc, for non-commercial purposes. It is not
> endorsed by nor reflects the views or opinions of Frontier Developments and no
> employee of Frontier Developments was involved in the making of it.

Those terms are carried here, not granted here. A distribution or use that retains
the covered game data or imagery must comply with them, including the non-commercial
condition; the MIT licence does not lift those terms. The library's bundled catalogues travel under further terms of
their own — some sources state no explicit licence, EDSY-derived material is
CC BY-NC 4.0 — listed in the `THIRD_PARTY_NOTICES.md` shipped with the installed
package. Review them before redistributing the data or using it commercially.

[Spec 012](./specs/012-help-and-licences/spec.md) requires the running application
to reproduce all of this.
