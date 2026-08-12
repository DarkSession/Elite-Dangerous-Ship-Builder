# Agent guide

Elite Dangerous Ship Builder — a client-side-only Angular application for
planning ship loadouts.

## Read first

- [`.specify/memory/constitution.md`](./.specify/memory/constitution.md) — the
  project's non-negotiable principles. Everything below follows from it.
- [`specs/`](./specs) — one directory per feature, each with a `spec.md`.

## Non-negotiables

- **No backend.** No server, no API of our own, no accounts, no telemetry.
  Builds live in memory, in `localStorage`, or in a URL. Nothing is uploaded.
  The build output is static files.
- **`@elite-dangerous-almanac/core` is the source of truth** for game data and
  build calculations. Do not hand-maintain game data and do not reimplement a
  calculation the package provides. Import leaf subpaths (e.g.
  `@elite-dangerous-almanac/core/ships/ships`) rather than whole barrels.
- **Library defects are fixed in the library.** If the package returns a wrong
  value or is missing something, call it out and raise it against
  [Elite-Dangerous-Almanac](https://github.com/DarkSession/Elite-Dangerous-Almanac)
  with a minimal reproduction, then consume the released fix. Do **not** correct,
  clamp, re-derive or special-case a library result inside this application —
  not even temporarily. A blocked feature waits on the upstream fix.
- **Desktop, tablet and mobile are all first-class.** Every feature must be
  fully usable on all three, by touch as well as pointer and keyboard, in
  portrait and landscape, with no horizontal page scrolling.
- **Tests gate the build.** Unit coverage must stay at or above 80% (statements,
  branches, functions, lines) — enforced in `angular.json`; never lower the
  threshold to get green. Playwright end-to-end tests run as part of
  `pnpm run check` across desktop, tablet and mobile viewports. Do not skip,
  quarantine or delete tests to pass a build.
- **Identities come from the package**: `symbol` for hulls and modules, `fdname`
  for blueprints and experimental effects, and the game's own slot keys — never
  positional indices.
- **Never fabricate values.** Where the package reports a value as unavailable
  or a build as invalid or incomplete, surface that; do not substitute zero or
  an estimate.
- **Domain logic lives outside components** — in framework-agnostic services and
  signal-based stores that are testable without rendering.

## Working in this repo

- Package manager is **pnpm**. `pnpm-lock.yaml` is committed; use
  `--frozen-lockfile` in CI.
- Angular is standalone and zoneless; prefer signals for state.
- Run `pnpm run check` (format check, typecheck, build, unit tests with
  coverage, Playwright) before proposing a change.
- Unit tests live beside their source in `src/`; end-to-end tests live in
  `e2e/`. New user journeys need both.
- If the preinstalled Chromium does not match the version Playwright pins, set
  `E2E_CHROMIUM_PATH` to its executable rather than editing the config.
- UI _styling_ is deferred to a later workstream. Specs constrain behaviour and
  the information a screen must convey, not its visual design — do not treat
  visual design as a blocker for domain work. Responsiveness, touch support and
  accessibility are behavioural requirements and are in scope now.

## Spec-driven development

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit),
installed for Claude Code (`.claude/skills`) and Codex CLI (`.agents/skills`).
The flow is: `/speckit-specify` → `/speckit-clarify` (optional) →
`/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

Record ambiguity as `[NEEDS CLARIFICATION]` in the spec rather than resolving it
by silent assumption. If code and an accepted spec disagree, resolve the
mismatch deliberately — do not leave it standing.
