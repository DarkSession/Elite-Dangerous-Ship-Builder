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
[Playwright](https://playwright.dev/) as part of `pnpm run check`.
[`playwright.config.ts`](./playwright.config.ts) currently defines three
projects — desktop, tablet and mobile — in Chromium.

Spec 011 requires more than that, and the config has yet to catch up: every
journey must run in **Firefox** as well as Chromium (FR-021), and an automated
accessibility check must cover every capability and relevant state (FR-022). Adding them is a
change to the config, never a change to those requirements.

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

| Spec                                                  | Feature                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [001](./specs/001-ship-selection-and-loading/spec.md) | Ship selection and build loading (search, sort, filters, previews, local storage, build links) |
| [002](./specs/002-module-outfitting/spec.md)          | Module outfitting and engineering, with undo, redo and the edit history                        |
| [003](./specs/003-ship-statistics/spec.md)            | Structural status, issues, headline statistics, assembly requirements and viewing conditions   |
| [004](./specs/004-slef/spec.md)                       | SLEF                                                                                           |
| [005](./specs/005-power-and-heat/spec.md)             | Selectable deployed or retracted power budget, the distributor, and heat                       |
| [006](./specs/006-defence-profile/spec.md)            | Shields, armour, resistances, recovery and cell banks                                          |
| [007](./specs/007-offence-profile/spec.md)            | Almanac-provided damage totals, per-weapon detail, ammunition and capacitor endurance          |
| [008](./specs/008-mobility-and-jump/spec.md)          | Almanac-provided speed, handling, mass, capacities and jump performance by load                |
| [009](./specs/009-cost-and-materials/spec.md)         | Credits, rebuy and the engineering material bill                                               |
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

## Licence

This project's own code and documentation are **MIT**-licensed — see
[`LICENSE`](./LICENSE), which is also where the terms below are carried in full.

The MIT licence does not cover the Elite Dangerous game data and imagery the
application displays. Those are the property of **Frontier Developments plc**,
reach the application through
[`@elite-dangerous-almanac/core`](https://github.com/DarkSession/Elite-Dangerous-Almanac),
and are used under Frontier's
[media-usage rules](https://forums.frontier.co.uk/threads/elite-dangerous-media-usage-rules.510879/):

> Elite Dangerous Ship Builder was created using assets and imagery from Elite
> Dangerous, with the permission of Frontier Developments plc, for
> non-commercial purposes. It is not endorsed by nor reflects the views or
> opinions of Frontier Developments and no employee of Frontier Developments was
> involved in the making of it.

Those terms are carried here, not granted here. A distribution or use that retains
the covered game data or imagery must comply with them, including the non-commercial
condition; the MIT licence does not lift those terms. The library's bundled catalogues travel under further terms of
their own — some sources state no explicit licence, EDSY-derived material is
CC BY-NC 4.0 — listed in the `THIRD_PARTY_NOTICES.md` shipped with the installed
package. Review them before redistributing the data or using it commercially.

[Spec 012](./specs/012-help-and-licences/spec.md) requires the running application
to reproduce all of this.
