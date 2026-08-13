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

## Commit Identity — no personal data in git metadata

**Commit as whoever git is already configured as. Never set an identity yourself.** The environment configures `user.name` / `user.email` (and, where signing is enabled, the signing key) before you start. Do not pass `-c user.name=…` / `-c user.email=…` to `git commit`, do not `git config` a different one, and do not use `--reset-author` to change _who_ a commit is by. An agent that substitutes its own choice produces commits GitHub marks **Unverified**, because the identity no longer matches the key that signed them.

**An identity you did not get from git config is a personal detail, and commit metadata publishes it.** A maintainer's address may be in front of you — in the conversation, an issue, a profile, an earlier commit's author field — and none of that is permission to write it into this repository's history. The author and committer fields of a public repository are world-readable and permanent in a way ordinary files are not:

> A wrong address cannot be taken back by force-pushing over it. Rewriting the branch removes the _reference_; the old commit object survives on the remote, stays fetchable by its SHA, and the force-push event in a pull request timeline links to it by SHA. Only GitHub Support can purge unreachable objects. **Getting it right the first time is the only fix that works.**

Before pushing, confirm the whole branch carries one identity, the configured one:

```bash
git log --format='%an <%ae> | %cn <%ce>' origin/<default-branch>..HEAD | sort -u
```

The same rule covers everything else you author. Commit messages, PR titles and bodies, code comments, data files, fixtures and documentation entries carry **no personal data** — no email addresses, no real names, no handles, no machine or account names, and nothing identifying a private individual.

## Pull requests

**Before opening any PR, have a subagent re-review the complete change.** Address every actionable finding, then ask a subagent to review the updated change again. Repeat this review-and-fix cycle until the subagent reports no actionable findings; only then may the PR be opened.

## Spec-driven development

This repository uses [GitHub Spec Kit](https://github.com/github/spec-kit),
installed for Claude Code (`.claude/skills`) and Codex CLI (`.agents/skills`).
The flow is: `/speckit-specify` → `/speckit-clarify` (optional) →
`/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

Record ambiguity as `[NEEDS CLARIFICATION]` in the spec rather than resolving it
by silent assumption. If code and an accepted spec disagree, resolve the
mismatch deliberately — do not leave it standing.
