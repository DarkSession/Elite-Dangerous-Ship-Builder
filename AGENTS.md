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
- **Nothing ships untranslatable.** Every string the application owns goes
  through the localisation layer — never hard-coded in a component, template or
  formatter — and numbers, credits and dates are formatted for the active
  locale. Translations are static assets. Game text (ship, module, blueprint,
  effect and material names, and the package's diagnostics) belongs to
  `@elite-dangerous-almanac/core`: ask for a locale there, never keep a private
  translation of game data here.
- **Tests gate the build.** Unit coverage must stay at or above 80% (statements,
  branches, functions, lines) — enforced in `angular.json`; never lower the
  threshold to get green. Playwright end-to-end tests run as part of
  `pnpm run check` and must cover desktop, tablet and mobile viewports, in
  **Chromium and Firefox**, with an automated accessibility check over every
  screen. The suite has yet to reach that: `playwright.config.ts` configures the
  three viewports in Chromium only, and no accessibility check runs. Closing the
  gap is work on the suite, never a relaxation of the obligation. Do not skip,
  quarantine or delete tests to pass a build.
- **Accessible to WCAG 2.2 AA.** Keyboard-operable with a visible focus order,
  screen-reader navigable, legible at 200% text and 400% zoom, AA contrast, AA
  touch targets, `prefers-reduced-motion` honoured, and nothing carried by
  colour alone. It is a requirement of every feature, not a later pass.
- **Identities come from the package**: `symbol` for hulls and modules, `fdname`
  for blueprints and experimental effects, and the game's own slot keys — never
  positional indices.
- **Never fabricate values.** Where the package reports a value as unavailable
  or a build as invalid or incomplete, surface that; do not substitute zero or
  an estimate.
- **Domain logic lives outside components** — in framework-agnostic services and
  signal-based stores that are testable without rendering.
- **One design system, one theme.** Screens compose the component library in
  `src/app/ui/`; they never invent their own visual language. Design tokens are
  the only source of colour, type, spacing, radius, elevation and motion — no
  component, template or stylesheet outside the token layer may contain a colour
  literal. The application ships one dark theme; there is no light theme and no
  theme preference. A screen that needs something the system lacks extends the
  system. This repository is the source of truth for any design tool it syncs
  with.

## Working in this repo

- Package manager is **pnpm**. `pnpm-lock.yaml` is committed; use
  `--frozen-lockfile` in CI.
- Angular is standalone and zoneless; prefer signals for state.
- Run `pnpm run check` (format check, typecheck, build, unit tests with
  coverage, Playwright) before proposing a change.
- Unit tests live beside their source in `src/`; end-to-end tests live in
  `e2e/`. New user journeys need both.
- The end-to-end suite must run every project in Chromium **and** in Firefox, with
  an automated accessibility check over every screen (feature 011, FR-029 and
  FR-032). `playwright.config.ts` has yet to catch up: it currently defines the
  three viewport projects in Chromium only. Closing that gap is a change to the
  config, never to those requirements, and no browser may be dropped from the
  matrix to get a build green. If a preinstalled browser does not match the
  version Playwright pins, point at its executable (`E2E_CHROMIUM_PATH`, and
  `E2E_FIREFOX_PATH` once Firefox is configured) rather than editing the config.
- **Specs are scoped to a capability and name no screen.** They constrain
  behaviour and the information a screen must convey. Screens are defined at
  plan time in `specs/<NNN>-<short-name>/design/`, recording what each screen
  composes, the states it handles, and the requirements it satisfies. The
  inventory and its requirement mapping come before task breakdown; finished
  visuals may follow.

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
