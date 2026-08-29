# Contributing

Thank you for wanting to help. This document says how to raise something, how to change the code,
and what a change has to satisfy before it can be merged.

Two documents govern this repository, and they win over anything here:

- [`.specify/memory/constitution.md`](./.specify/memory/constitution.md) — the non-negotiable
  principles.
- [`AGENTS.md`](./AGENTS.md) — the working guide: the non-negotiables in short form, the repository
  layout, the language rules, and the pull request rules.

Taking part means following the [code of conduct](./CODE_OF_CONDUCT.md).

## Raise it in the right place

| What you have                                         | Where it goes                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A defect in the application                           | [New issue → Bug report](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/new/choose)            |
| A capability you want                                 | [New issue → Feature request](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/new/choose)       |
| Something you cannot use, or an accessibility barrier | [New issue → Accessibility barrier](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/new/choose) |
| Wrong game data, or a wrong calculated value          | [Elite-Dangerous-Almanac](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues) — the library owns both   |
| A security vulnerability                              | [Report it privately](./SECURITY.md). Do not open an issue.                                                        |

Ship hulls, modules, blueprints, effects, materials and every build calculation come from
[`@elite-dangerous-almanac/core`](https://github.com/DarkSession/Elite-Dangerous-Almanac). A wrong
figure is fixed there and consumed here, so an issue raised in this repository about one has to
travel before anything can happen to it. Raising it upstream is faster.

Search the open issues before you write a new one.

## Set up

You need Node.js — see [`.nvmrc`](./.nvmrc) and `package.json#engines` — and
[pnpm](https://pnpm.io/), enabled with `corepack enable`. The
[dev container](./.devcontainer/devcontainer.json) has all of it, plus the Playwright browsers.

```bash
pnpm install
pnpm start        # dev server on http://localhost:4200/
```

[`README.md`](./README.md) lists every script, and how to run and debug the application.

## What every change has to satisfy

These come from the constitution. A change that breaks one of them cannot be merged, however useful
it is.

- **No backend.** No server, no API of our own, no accounts, no telemetry, and no request to any
  origin other than the one the application is served from. Builds live in memory, in
  `localStorage`, or in a URL.
- **The Almanac is the source of truth.** Do not hand-maintain game data, and do not reimplement a
  calculation the package provides. A defect in the package is raised against the package and fixed
  there. Do not correct, clamp, re-derive or special-case a library result here — not even
  temporarily. A blocked feature waits for the released fix.
- **Never fabricate a value.** Where the package reports a figure as unavailable, or a build as
  invalid, show that. Do not substitute zero or an estimate.
- **Desktop, tablet and mobile are all first-class**, by touch as well as pointer, in portrait and
  landscape, with no horizontal page scrolling.
- **Nothing ships untranslatable.** Every string the application owns goes through the localisation
  layer. Numbers, credits and dates are formatted for the active locale. Game text belongs to the
  package.
- **One design system, one theme.** Screens compose the component library in `src/app/ui/`. Design
  tokens are the only source of colour, type, spacing, radius, elevation and motion. A screen that
  needs something the system lacks extends the system.
- **Domain logic lives outside components**, in services and signal-based stores that are testable
  without rendering.
- **Accessibility is part of the feature, not a later pass.** The target is WCAG 2.2 level AA except
  success criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11. Seven of those are
  the keyboard-operation criteria the constitution excludes; the eighth, 2.2.1, is excluded for
  applying a published update and for nothing else. State the exclusions wherever you state the
  target — an unqualified claim fails `pnpm run policy`.
- **Tests gate the build.** Unit coverage stays at or above 80%. Never lower the threshold, and
  never skip, focus, quarantine or delete a test to get a build green.

## Make the change

1. Read the spec of the area you are touching. `specs/<NNN>-<short-name>/spec.md` holds the
   behaviour, and several regions of the outfitting workspace are fenced by a
   `scripts/policy/*-ownership.mjs` script that fails the build rather than argue. The table in
   [`AGENTS.md`](./AGENTS.md) maps each region to its spec.
2. Branch from `main`.
3. For a feature, follow the Spec Kit flow: `/speckit-specify` → `/speckit-clarify` (optional) →
   `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. A defect fix does not need a new spec,
   but it must not contradict the accepted one.
4. Start a bug fix with a failing test that reproduces the bug.
5. Put unit tests beside their source in `src/`, and end-to-end tests in `e2e/`. A new user journey
   needs both.
6. Record an ambiguity as `[NEEDS CLARIFICATION]` in the spec. Do not resolve it by silent
   assumption.
7. Keep the change scoped to one thing.

## Run the gate

```bash
pnpm run check
```

It runs the format check, the generated help artifacts check, the typecheck, both builds, the
repository policy scripts, the codec capacity check, the script tests, the unit tests with coverage,
and the Playwright suites. It is the same gate a reviewer expects to have passed.

CI runs most of it. `pnpm run policy`, `help:artifacts:check`, `build:preview`, `codec:capacity`,
`e2e:timing` and `e2e:offline` run only in `pnpm run check`, so a green pull request does not prove
they passed. Run the whole gate locally.

Playwright needs its browsers once:

```bash
pnpm exec playwright install --with-deps chromium firefox
```

If your machine already has a browser whose build does not match the pinned one, point at it with
`E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` rather than editing
[`playwright.config.ts`](./playwright.config.ts).

Automated accessibility checks are a floor. The manual protocols in [`e2e/manual/`](./e2e/manual) —
screen-reader journeys and actual 400% browser zoom — cover what no scan can judge, and a change
that touches what they exercise needs a fresh result record beside them.

## Write like the rest of the repository

Code, comments, documentation, commit messages and pull requests use plain, common language. Name a
thing what it is. No metaphor, no marketing adjectives, no emoji, no throat-clearing openers, no
self-assessment. Say it once, and say it directly.

Documentation describes how the thing works now, not the change that produced it. Git records what
moved. Keep "previously", "now", "new" and dated superseded notes out of comments and documents, and
delete what no longer applies rather than labelling it obsolete.
[`AGENTS.md`](./AGENTS.md) carries the full rules and the two deliberate exceptions.

## Commits

Commit as whoever git is already configured as. Do not set an identity yourself, and do not pass
`-c user.name=` or `-c user.email=` to `git commit`.

Nothing you author carries personal data — no email addresses, no real names, no handles, no machine
or account names — and that covers commit messages, code comments, data files, fixtures and
documents as well as the author and committer fields. Commit metadata is world-readable and
permanent: a force-push removes the reference, but the old commit object survives on the remote and
stays fetchable by its SHA.

Write a message that says what changed and why, in plain words.

## Pull requests

[`.github/pull_request_template.md`](./.github/pull_request_template.md) is the layout to fill in.

- The title says what changed, in one plain line.
- Open with what is different and what problem it solves. Name the feature and spec directory, and
  link the issue it closes.
- Say what you ran and what it reported. "Tests pass" is not evidence. For a visual change, say
  which viewports and engines you exercised, and attach the manual protocol record when one was
  required.
- Leave the making-of out. No review log, no commit-by-commit walkthrough, no wishlist. A finding
  that still matters is a follow-up issue.
- Length follows the change.

Every pull request raised from a branch of this repository is published as a browsable preview, and
a comment on the pull request carries the link. A pull request from a fork is not previewed, because
a fork's run cannot read the deployment token; its checks still run in full.

## Licence

The project's own code and documentation are MIT-licensed. A contribution is offered under the same
terms — see [`LICENSE`](./LICENSE).

The MIT licence does not cover the Elite Dangerous game data and imagery the application displays.
Those belong to Frontier Developments plc and are used under Frontier's media-usage rules, which the
`LICENSE` file carries in full. Those terms are carried here, not granted here.
