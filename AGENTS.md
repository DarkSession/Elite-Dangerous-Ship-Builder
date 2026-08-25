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
  fully usable on all three, by touch as well as pointer, in portrait and
  landscape, with no horizontal page scrolling.
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
  `pnpm run check` and cover desktop, tablet and mobile viewports, in **Chromium
  and Firefox**, with an automated accessibility check over every screen.
  `playwright.config.ts` generates **ten projects** — five layout profiles
  (desktop, tablet portrait, tablet landscape, mobile portrait, mobile
  landscape) in each of the two engines — and every rendered product and preview
  state is scanned with `@axe-core/playwright` against WCAG 2.0/2.1/2.2 A and AA
  with no disabled rules. CI may shard the matrix; it may not reduce it. Do not
  skip, quarantine or delete tests to pass a build — `pnpm run policy` fails a
  build that contains a skipped, focused or quarantined interface test.
- **Accessible to WCAG 2.2 AA, except success criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3,
  2.4.7 and 2.4.11.** Those seven are the keyboard-operation criteria the constitution
  excludes. Every conformance statement names them; an unqualified "WCAG 2.2 AA" claim is a
  stronger claim than this project supports, and the policy checker rejects one.
  Screen-reader navigable, legible at 200% text and 400% zoom, AA contrast, AA
  touch targets, `prefers-reduced-motion` honoured, and nothing carried by
  colour alone. It is a requirement of every feature, not a later pass.
  Keyboard operation is out of scope by constitutional exclusion (principle V
  names the criteria), so the application never claims unqualified AA — state
  the exclusion wherever conformance is stated.
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
- **`package.json` declares `major.minor.0`; CI supplies the patch.** Major and
  minor are advanced by hand in a normal reviewed commit. The patch is never
  written down: `scripts/resolve-build-version.mjs` counts the commits since
  that major.minor was declared and stamps the result into the manifest just
  before `pnpm run build` in CI, so the deployed bundle — and the `appVersion`
  its SLEF exports carry — is versioned without anything being committed back to
  `main`. The count is a property of the commit, so a re-run and the manual
  republish in `deploy.yml` ship the same number. A committed patch other than
  `0` fails the resolver. It is not release evidence: a release is declared only
  by `SHIP_BUILDER_RELEASE_TAG` matching the shipped version exactly
  (`specs/012-help-and-licences/contracts/distribution-artifacts.md`).
- Angular is standalone and zoneless; prefer signals for state.
- Run `pnpm run check` (format check, typecheck, build, unit tests with
  coverage, Playwright) before proposing a change.
- Unit tests live beside their source in `src/`; end-to-end tests live in
  `e2e/`. New user journeys need both.
- The end-to-end suite runs every project in Chromium **and** in Firefox, with an
  automated accessibility check over every capability and relevant state (feature
  011, FR-021 and FR-022). `playwright.config.ts` generates the ten projects from
  `ENGINES × LAYOUT_PROFILES` in `e2e/coverage-ledger.ts`, which is also where
  the coverage ledger lives; the policy checker reconciles the two, so a project
  cannot be renamed or dropped without the build noticing. No browser may be
  dropped from the matrix to get a build green. If a preinstalled browser does
  not match the version Playwright pins, point at its executable
  (`E2E_CHROMIUM_PATH`, `E2E_FIREFOX_PATH`) rather than editing the config.
- Automation is a floor, not the gate. The versioned manual protocols in
  `e2e/manual/` — screen-reader journeys and actual 400% browser zoom — cover
  what no scan can judge, and their result records live beside them.
- **Specs are scoped to a capability and name no screen.** They constrain
  behaviour and the information a screen must convey. Screens are defined at
  plan time in `specs/<NNN>-<short-name>/design/`, recording what each screen
  composes, the states it handles, and the requirements it satisfies. The
  inventory and its requirement mapping come before task breakdown; finished
  visuals may follow.
- **Cost and materials (feature 009)** contributes the `COST` and `MATERIALS`
  blocks to the outfitting status rail. It owns no game rule: it reuses feature
  002's `engineeringCost()` only to count contributing blueprints and
  `materialRarity()` to present package material grades. Credits, Merc Coin and
  consolidated materials come from the Almanac's single `buildCost()` result.
  The only application-computed figures are the blueprint count, material-type
  count and unit total, which the canvas draws and the package does not return;
  these ruled exceptions are recorded in
  `specs/009-cost-and-materials/design/reference-review.md`.
  Out of scope, deliberately: historical purchase values, currency conversion,
  per-row material traces, unpriced-credit evidence and material-acquisition
  guidance.

- **Hull anatomy (feature 010)** contributes the `HULL ANATOMY` plates to the
  outfitting workspace, between the ledger and the fitting bench. It owns no
  game data: every mount's identity and position is read out of the installed
  package's own `schematic-top.svg` / `schematic-bottom.svg`, and a mount exists
  only where a package `data-journal-slot` resolves to a hardpoint or utility
  slot on the active hull. What is _drawn_ is the same file rasterised — see
  below — inside the same coordinate space, never a second geometry. The package draws every hull nose-up in a
  mostly empty 1200x800 box; canvas 1c frames it lying down at the hull's own
  proportions, which is one `transform` and one `viewBox` computed from the
  coordinates the package published. Nothing is measured off the rendered
  document — no `getBBox`, no `getScreenCTM`, no `getBoundingClientRect` — and
  no path is rewritten. A mount is the canvas's numbered mark, a named button at
  the canvas's own `clamp(14px, 3.06cqw, 22px)`; the package sets real mounts
  six CSS pixels apart, so marks overlap, the one being worked with is raised
  above them, and the size criterion is met by SC 2.5.8's Equivalent exception
  through feature 002's ledger rather than by the project's 44-pixel baseline
  (`specs/010-hull-anatomy/design/hull-anatomy.md`, "Divergence from
  FR-012"). Selecting a mount selects feature 002's slot and nothing else: the
  plates publish no second detail surface, no second mount list and no power
  state, which belongs to feature 005's mode over the same plates.
  - The plate is canvas 1c's `aspect-ratio: 720/292` frame in every state,
    drawn before anything is fetched, so the region reserves its height once and
    a late schematic does not resize the workspace. While it is on its way the
    plate carries the hull illustration's own loading mark.
  - The five-mode strip — `MOUNTS`, `POWER`, `DRIVES`, `DEFENCE`, `OFFENCE` — is
    canvas 1c's, and is drawn whole at every width. `MOUNTS` is this feature's,
    `POWER` is feature 005's, `DEFENCE` is feature 006's and `OFFENCE` is
    feature 007's; a segment is enabled when its feature lands, and `DRIVES`
    is the one still waiting. Canvas 1d's six-segment strip is a
    different control — it switches whole compact screens, the anatomy being one
    of them — and building it is feature 002's composition
    (`specs/010-hull-anatomy/design/hull-anatomy.md`, "Divergence from canvas
    1d — the sixth segment").
  - **The package SVG is never fetched.** It is ninety kilobytes of sub-pixel
    path data, and a plate reads a few hundred bytes of it. Both halves are made
    from the installed package at build time and committed under
    `public/assets/ships/<symbol>/`: `scripts/convert-ship-artwork.mjs`
    rasterises `illustration.svg` and both `schematic-*.svg` to PNG, and
    `scripts/extract-schematic-mounts.mts` writes `schematic-<side>.json` — the
    package's own `viewBox`, the rectangle the file draws in, and the middle of
    every annotated mount. Re-run both after moving the package pin.
  - The extractor runs the application's own `schematic-svg-parser.ts` under
    Node's type stripping with a jsdom `DOMParser`, so the contract being
    checked and the geometry being written are one piece of code; a file the
    parser refuses fails extraction by name. Each extract records the SHA-256 of
    the SVG it came from, and the policy checker's `copied-schematics` rule
    recomputes it against the installed file, failing on a missing, stale or
    unreadable extract and on any package SVG tracked under `public/` or `src/`.
    A hand-written coordinate file in this repository is the private geometry
    catalogue FR-009 exists to forbid; the digest is what keeps the extract from
    becoming one.
  - What is left at runtime is not the package contract but the deployment: the
    JSON is validated field by field, and a single malformed mount refuses the
    whole file rather than being dropped, because a plate missing one mount
    looks exactly like a hull that has none there.
  - Out of scope, deliberately: geometry for internal, armour and cargo-hatch
    slots, weapon metrics, mount direction, convergence and any coordinate,
    offset or distance derived from the drawing.

- **Power and thermals (feature 005)** is the anatomy region's `POWER` mode: it
  retitles the region `POWER & THERMALS`, removes the plates, their side
  selector and their legend exactly as the artboard's own switching script does,
  draws its four-block dashboard in the space they leave, and adds one read-only
  block to the outfitting status rail. Nothing is drawn on a mount. It owns no
  game rule and computes no figure the package publishes.
  `ShipLoadout.powerBudget()`, `.distributorMetrics()` and `.heatMetrics()` are
  asked once each, in `src/app/domain/power-heat/power-heat.ts`, and both
  screens read that one projection.
  `scripts/policy/power-heat-ownership.mjs` keeps it that way: the Almanac is
  reached only through `ships/ship-loadout`, `ships/power`, `ships/distributor`
  and `ships/heat`; nothing outside the projection asks the package those three
  questions; and no package figure is arithmetically combined anywhere the
  projection is read.
  - The capability owns two viewing conditions, both in memory only and neither
    reaching the route, the fragment, history, storage, the saved build or the
    export: the `DEPLOYED` / `RETRACTED` hardpoint state, and each capacitor's
    whole `0`–`4` pips. There is no draft, no Apply, no Reset, no running total
    across the three banks and no error state — the artboard draws none, and a
    selection that takes effect immediately needs none. The pips shown are the
    pips the package returned, not the ones that were pressed. Six pips is what
    the ship has, so setting one bank moves the other two to pay for it, on the
    half step: from `2 · 2 · 2`, three in `SYS` leaves `1.5` in each of the
    others.
  - **`headroom`, `utilisation` and `withinBudget` are not read at all.** Neither
    canvas draws a headroom figure, a utilisation percentage or a within-budget
    verdict, so the projection never takes them and nothing downstream can blank,
    dash or zero one. The package's infinite utilisation on a plant of zero
    therefore never has to be worded: such a build states a plant of `0.00 MW`
    with the whole demand in `UNPOWERED`.
  - Two package sentinels, each read off its own field and never inferred from
    another: an `Infinity` heat level or gauge is a load that never settles, and
    a `null` time to overheat is a scenario that never gets there. A `null`
    distributor or heat result is one unavailable group, with no catalogue figure
    and no diagnosis of which of the package's reasons it was in its place.
  - Four readings the canvases draw and the package does not publish are worked
    out once, in the projection, which is the only place the ownership policy
    permits it: the powered/unpowered split of the draw, each group's share of
    plant output, what a kind of module draws across its mounts, and the shield
    cell bank's sixth heat bar — the last by the package's own documented remedy,
    with its own `heatLevelAtTime` doing the running. `HEAT SINKS` is counted
    from `fittedModules()`, because `heatMetrics()` models no sink at all.
  - Groups this build puts nothing in are left out of `PRIORITY GROUPS`: an
    empty row saying `0.00 MW` about a group that does not exist here is not a
    reading of this build. Module lines state the selected state's own draw, so a
    stowed hardpoint and a switched-off module each read a real zero and each
    state's list adds up to that state's own package total.
  - Out of scope, deliberately: the artboard's `data-anat-layer="power"` mount
    overlay, which its own switching script never shows because it hides the
    plate container for every mode but `mounts`; and its cruise, weapons-alpha
    and WEP-net figures, which have no package result behind them
    (`specs/005-power-and-heat/design/reference-review.md`, wave 13).

- **Offence profile (feature 007)** is the anatomy region's `OFFENCE` mode: it
  retitles the region `OFFENCE ANALYSIS`, replaces the plates the same way
  feature 005's mode does, draws canvas 1c's three blocks — `WEAPONS` beside
  `DAMAGE PROFILE`, and `SHOT CONVERGENCE` across the full width beneath them —
  and adds the rail's `DPS` cell. It owns no game rule.
  `ShipLoadout.weaponMetrics()` and `.weaponsCapacitorMetrics()` are asked once
  each per projection, in `src/app/domain/offence/offence.ts`, and both surfaces
  read that one pure function of the same inputs, so neither can hold a figure
  the other does not; `damageFalloff()` and the gunsight catalogue are asked over
  its result and nowhere else.
  `scripts/policy/offence-ownership.mjs` keeps it that way.
  - **The canvas contract is what settles scope.**
    `specs/007-offence-profile/design/canvas-contract.md` records every drawn
    element, what it is built as and what is not built. Its weapon rows are
    **inert**: no disclosure, no action, no slot. The mount control is in
    `HULL ANATOMY`, where the canvas puts it.
  - Two package answers do the work the canvas's own script faked: `damageFalloff()`
    gives `DPS BY RANGE BAND` its multiplier at 500 m, 1.2 km, 1.8 km and 3 km,
    and `ships/gunsights` gives `SHOT CONVERGENCE` each hull's hardpoint offsets
    from the cockpit, placed at a range by `projectGunsight()`. A weapon's slot
    is resolved to a hardpoint through `enumerateSlots`, never by parsing the
    key's number; a hull whose gunsight does not line up with its hardpoints is
    reported unavailable whole, not drawn in part.
  - The gunsight plate is a **diagram**: `aria-hidden`, with every shot restated
    as a sentence beside it. Its field of view is the canvas's fixed 115 mrad
    either side of the axis, six-sixteenths as tall as it is wide, so a shot far
    enough off-axis is clipped rather than stretched — and keeps its sentence.
    A hardpoint the build has **not** filled takes no mark and no sentence:
    `wireConvergence` faces one on its own sample build and draws nothing for
    it, and an earlier revision that drew them is reverted with its requirement
    (`specs/007-offence-profile/design/canvas-contract.md`, review note 8).
  - **A bar only where a scale exists.** The four range bands share one and are
    filled; `DRAW` and `RECHARGE` are both MJ/s and are filled against the larger;
    `CAPACITY` in MJ and `FULL FIRE` in seconds share a scale with nothing beside
    them and keep their figures without a track. Every figure is written in words
    either way. The damage shares are the same rule as a fill: one package amount
    over another, both stated on the same screen.
  - Fields no canvas draws are **not read at all** — the whole-build firing cost
    on `WeaponTotals`, `netDrainRate`, the echoed `weaponsPips`, every
    `WeaponMetrics` field beyond the row's four columns, and the ammunition
    capacity. Nothing downstream can then blank, dash or zero one.
  - Out of scope, deliberately: the mobile canvas's `VS 45% RESIST` block —
    `ALPHA`, `BURST DPS`, `VS SHIELD`, `VS HULL` — and its `CORROSIVE +30%` chip.
    The package returns no result against a target and publishes no effect bonus,
    and the canvas states no target model to build one from.
  - The specification's original scope line claimed the package returned nothing
    for damage-at-range or convergence, and both regions were left unbuilt on
    that ground. It was never checked against the package, and it was false. The
    record is kept in `specs/007-offence-profile/spec.md`, in that feature's
    `design/reference-review.md` and in its requirements checklist: **an
    exclusion justified by what the package does not return has to be verified
    against the package, not against the sentence asserting it.**

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
