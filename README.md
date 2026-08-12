# Elite Dangerous Ship Builder

A browser-based ship loadout planner for Elite Dangerous: pick a hull, fit and
engineer modules, read the resulting build metrics, and export the build as
SLEF.

The application is **client-side only**. There is no backend and no account:
builds live in your browser (`localStorage`) or in a URL, and nothing is ever
uploaded. See [`.specify/memory/constitution.md`](./.specify/memory/constitution.md)
for the principles this project is held to.

Game data and build calculations come from
[`@elite-dangerous-almanac/core`](https://github.com/DarkSession/Elite-Dangerous-Almanac).

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

| Command              | What it does                            |
| -------------------- | --------------------------------------- |
| `pnpm start`         | Run the dev server with hot reload      |
| `pnpm run build`     | Production build into `dist/`           |
| `pnpm test`          | Run the unit tests                      |
| `pnpm run typecheck` | Type-check the project without emitting |
| `pnpm run format`    | Format the repository with Prettier     |
| `pnpm run check`     | Format check, typecheck, build and test |

Run `pnpm run check` before proposing a change.

## Specifications

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit) for
spec-driven development, configured for both Claude Code (`.claude/skills`) and
Codex CLI (`.agents/skills`).

| Spec                                                  | Feature                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| [001](./specs/001-ship-selection-and-loading/spec.md) | Ship selection and build loading (local storage, URL import) |
| [002](./specs/002-module-outfitting/spec.md)          | Module outfitting and engineering                            |
| [003](./specs/003-ship-statistics/spec.md)            | Ship statistics                                              |
| [004](./specs/004-slef-export/spec.md)                | SLEF export (and import)                                     |

The project constitution lives in
[`.specify/memory/constitution.md`](./.specify/memory/constitution.md).

UI design is deliberately deferred: the specs describe behaviour and the
information each screen must convey, not its visual design.

### Working on a spec

With Claude Code or Codex CLI in this repository:

```
/speckit-specify     # create or refine a feature specification
/speckit-clarify     # de-risk ambiguous areas (optional)
/speckit-plan        # produce an implementation plan
/speckit-tasks       # break the plan into tasks
/speckit-implement   # execute the tasks
```
