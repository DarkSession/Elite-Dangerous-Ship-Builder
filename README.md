# Elite Dangerous Ship Builder

A browser-based ship loadout planner for Elite Dangerous: pick a hull, fit and
engineer modules, read the resulting build metrics, and export the build as
SLEF.

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

Project scaffolding and specifications. The Angular application is currently a
blank shell; feature work follows the specs in [`specs/`](./specs).

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

| Command              | What it does                                                 |
| -------------------- | ------------------------------------------------------------ |
| `pnpm start`         | Run the dev server with hot reload                           |
| `pnpm run build`     | Production build into `dist/`                                |
| `pnpm test`          | Run the unit tests with coverage                             |
| `pnpm run e2e`       | Run the Playwright suite (desktop, tablet, mobile)           |
| `pnpm run e2e:ui`    | Run Playwright in interactive UI mode                        |
| `pnpm run typecheck` | Type-check the project without emitting                      |
| `pnpm run format`    | Format the repository with Prettier                          |
| `pnpm run check`     | Format check, typecheck, build, unit tests and the E2E suite |

Run `pnpm run check` before proposing a change.

## Testing

Unit tests live beside their source in `src/` and run on Vitest through the
Angular unit-test builder. Coverage is enforced at **80%** for statements,
branches, functions and lines; the thresholds are configured in
[`angular.json`](./angular.json) and a build below them fails.

End-to-end tests live in [`e2e/`](./e2e) and run on
[Playwright](https://playwright.dev/) as part of `pnpm run check`. Every feature
is exercised at three viewports — desktop, tablet and mobile — in Chromium and
in Firefox, configured as separate projects in
[`playwright.config.ts`](./playwright.config.ts). The suite also runs an
automated accessibility check over every screen.

Playwright needs browsers installed once:

```bash
pnpm exec playwright install --with-deps chromium firefox
```

The dev container does this for you. If your environment already ships a browser
whose build does not match the one Playwright pins, point at it instead of
editing the config or dropping an engine from the matrix:

```bash
E2E_CHROMIUM_PATH=/path/to/chromium E2E_FIREFOX_PATH=/path/to/firefox pnpm run e2e
```

## Specifications

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) for
spec-driven development, configured for both Claude Code (`.claude/skills`) and
Codex CLI (`.agents/skills`).

| Spec                                                  | Feature                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [001](./specs/001-ship-selection-and-loading/spec.md) | Ship selection and build loading (search, sort, filters, previews, local storage, build links) |
| [002](./specs/002-module-outfitting/spec.md)          | Module outfitting and engineering, with undo, redo and the edit history                        |
| [003](./specs/003-ship-statistics/spec.md)            | Ship statistics — the contract every build figure obeys, and the headline set                  |
| [004](./specs/004-slef-export/spec.md)                | SLEF export (and import)                                                                       |
| [005](./specs/005-power-and-heat/spec.md)             | Power budget in both hardpoint states, the distributor, and heat                               |
| [006](./specs/006-defence-profile/spec.md)            | Shields, armour, resistances, recovery and cell banks                                          |
| [007](./specs/007-offence-profile/spec.md)            | Damage by type, per-weapon detail, output at range and capacitor endurance                     |
| [008](./specs/008-mobility-and-jump/spec.md)          | Speed, handling, mass and its curves, jump range and range by load                             |
| [009](./specs/009-cost-and-materials/spec.md)         | Credits, rebuy and the engineering material bill                                               |
| [010](./specs/010-hull-anatomy/spec.md)               | The build on the hull's schematics — the mount map and navigating by it                        |
| [011](./specs/011-interface-foundations/spec.md)      | The contract every screen obeys — design tokens, one theme, keyboard, screen readers, WCAG AA  |
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
