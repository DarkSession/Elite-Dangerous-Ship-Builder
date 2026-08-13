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
is exercised at three viewports — desktop, tablet and mobile — configured as
separate projects in [`playwright.config.ts`](./playwright.config.ts).

Playwright needs browsers installed once:

```bash
pnpm exec playwright install --with-deps chromium
```

The dev container does this for you. If your environment already ships a
Chromium whose build does not match the one Playwright pins, point at it instead
of editing the config:

```bash
E2E_CHROMIUM_PATH=/path/to/chromium pnpm run e2e
```

## Specifications

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) for
spec-driven development, configured for both Claude Code (`.claude/skills`) and
Codex CLI (`.agents/skills`).

| Spec                                                  | Feature                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [001](./specs/001-ship-selection-and-loading/spec.md) | Ship selection and build loading (local storage, URL import)                                             |
| [002](./specs/002-module-outfitting/spec.md)          | Module outfitting and engineering                                                                        |
| [003](./specs/003-ship-statistics/spec.md)            | Ship statistics                                                                                          |
| [004](./specs/004-slef-export/spec.md)                | SLEF export (and import)                                                                                 |
| [005](./specs/005-advanced-ship-statistics/spec.md)   | Advanced ship statistics (power states, defence and offence detail, mobility, heat, costs and materials) |
| [006](./specs/006-ship-selector-and-history/spec.md)  | Ship selector (comparison, search, preview) and builder undo/redo                                        |

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
