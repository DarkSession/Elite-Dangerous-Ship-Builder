# Quickstart: Offence Profile Validation

Runnable acceptance for the `OFFENCE` mode of the hull anatomy region and the status rail's `DPS`
cell. [design/canvas-contract.md](./design/canvas-contract.md) is the template; every check below is
either a package equality or a thing a canvas draws.

## Prerequisites

- `pnpm install --frozen-lockfile`
- The repository's own toolchain: Node per `.nvmrc`, pnpm per `packageManager`.
- Feature 001's active build, feature 002's slot views and `hardpointCoverage()`, feature 005's mode
  strip and `PowerConditionsStore`, and feature 011's design system are all in the repository. No
  boundary is stubbed.

## Package and contract audit

```bash
pnpm exec ng test --no-coverage --include 'src/app/domain/offence/**/*.spec.ts'
```

The Angular unit-test builder, not `vitest` directly: the package's localization
helpers are partially compiled, and only the builder runs the Angular linker over
them. `pnpm exec vitest run` fails at import with a JIT-compiler error that says
nothing about this feature.

Confirms against the installed Almanac that:

- `weaponMetrics()` returns `total` with exactly ten fields, and `weapons` with each fitted entry
  carrying an exact `slot`, `symbol`, `name` and `enabled`, and the sparse `maximumRange`,
  `falloffRange` and `armourPiercing` left undefined rather than zero where the article has none;
- the returned weapons arrive in the hull's own slot order, which is what the panel's rows and the
  gunsight's hardpoint numerals both depend on. The package documents unknown or unmapped slots as appended in
  source order after them; that path is the package's own to prove, and nothing here exercises it,
  because no build this application can make reaches it;
- `DamageSplit.unclassified` is absent exactly when it is zero, and `antiXeno` is always present;
- `weaponsCapacitorMetrics({ weaponsPips })` accepts `0`, `2`, `2.5` and `4`, rejects `-1` and `5`,
  and returns `Infinity` for `timeToDrain` when the recharge keeps pace;
- `damageFalloff()` weakens with distance for a weapon carrying both range fields — exercised
  through `projectRangeBands()` rather than called directly, because the projection is the one place
  allowed to call it;
- `getShipGunsight()` publishes one offset per hardpoint, in the order `enumerateSlots()` returns
  them, and returns nothing for a hull the catalogue does not carry.

## Static and unit validation

```bash
pnpm run format:check
pnpm run typecheck
pnpm run policy
pnpm run test
```

`pnpm run policy` runs `scripts/policy/offence-ownership.mjs`, which fails the build when:

- the Almanac is imported outside this capability's allowed leaf subpaths;
- `weaponMetrics(`, `weaponsCapacitorMetrics(`, `damageFalloff(`, `projectGunsight(` or
  `getShipGunsight(` appears outside `src/app/domain/offence`;
- a package figure is arithmetically combined anywhere the projection is read;
- `Infinity` or `Number.POSITIVE_INFINITY` is named on a surface rather than left to the
  projection's own endurance states.

The unread fields are not a policy rule: a field nobody reads has no line for a scanner to find. They
are held by the contract suites instead, which assert the projection's own key sets
(`offence.spec.ts`, "selects the four drawn fields, their two fills, and no others").

The unit suite proves each package call happens at most once per projection, the retained result is
identity-equal to the package's, the allocation reaches the package unchanged, ordering is preserved
with no sort or merge, and every collection, segment, band, convergence and endurance state maps as
[data-model.md](./data-model.md) states.

## End-to-end scenarios

```bash
pnpm exec playwright test offence-profile.spec.ts
```

### 1. Open the mode

Open a build, select `OFFENCE` on the anatomy mode strip. The region's rule reads `OFFENCE ANALYSIS`;
the plates, the side selector and the legend are gone; the three blocks are drawn. Selecting `MOUNTS`
restores all three exactly as they were. Nothing reached the route, the fragment, history, storage or
the build.

### 2. Read complete build output

With several enabled weapons, the `WEAPONS` block states the returned weapon count and both damage
figures, each separately labelled. Every figure parses back — for the active locale — to its exact
`weaponMetrics().total` field. No capacitor draw, heat, thermal load or plant draw appears in this
block.

### 3. Preserve damage-type meaning

`DAMAGE PROFILE` draws one stacked bar with one segment per conventional type the build deals, and
the legend beside it writes each segment's own exact amount and its share. That legend is the whole
damage-by-type reading: a type the build does not deal — an `unclassified` the package omits
included — has no segment and no line, and no anti-xeno figure and no second split appear at all.

`DPS BY RANGE BAND` draws the canvas's four distances, each weakening as the distance grows and each
stated in words. No combined total, resistance result or target adjustment appears anywhere in the
rendered output.

### 4. Distinguish empty, unavailable, disabled and zero

- No hardpoints occupied and coverage `confirmedEmpty`: no weapons fitted, with the package's own
  zero totals beside it.
- Coverage `unavailable`: an explicit qualification, and no claim that the hardpoints are empty.
- Every weapon disabled: all rows present with their own metrics, and the package's exact zero total.
- A genuine zero-damage weapon: a complete row including its numeric zero.

### 5. Inspect a weapon

A row draws the module's localized name, the code line beneath it — `4A GIMBALLED`, and any
engineering summary after it — damage per second, piercing, maximum range and falloff. An
unengineered weapon still gets its code line; only the summary is absent. An absent piercing,
maximum range or falloff reads as not stated, never as zero. A disabled weapon keeps its row and is
marked off.

The row carries no control. It does not navigate, disclose or select, and activating it does nothing.

Two mounts carrying the same module are two rows, in package order, unmerged.

### 6. Read where the shots go

`SHOT CONVERGENCE` draws the gunsight plate with, per hardpoint the hull has, a mark where that
mount's shot lands and its hardpoint numeral beside it — and one sentence beside the plate naming
the weapon, its hardpoint, its mount and where its shot goes, plus the ring caption, which sits on
the block's heading line.

A hardpoint the build has not filled is drawn too, hollow and in a quieter ink, and its sentence
names it as empty rather than naming a weapon: where a mount sits is a property of the hull, and it
is what a Commander choosing what to fit is asking about. The mount the workspace has selected — the
same one the ledger row and the hull schematics mark — takes the plate's other ink with a ring in it,
and its own sentence says it is the selected one; a selected hardpoint with nothing on it is still
hollow. Selecting a different hardpoint in the ledger moves the mark. How each weapon is aimed is in
its sentence and is not drawn at all. The plate itself is hidden from assistive technology, so every
one of those distinctions is read from the sentences rather than from the ink.

The `TARGET RANGE` control runs from 500 m to 5,000 m on a 100 m step and opens at 1,000 m — past
every maximum range the package publishes for a weapon on this hull, so it reaches the distance being
asked about. Moving it moves every shot and every sentence, leaves the two spans alone, and moves the
apparent spread. A mount far enough off the axis is clamped to the frame's margin at a near range and
keeps its sentence, which states its true offset; moving the target out brings its mark back inside
the frame.

On a hull the gunsight catalogue does not carry, the block says so and draws no partial spread. On a
hull it does carry but the build has armed nothing on, the plate is drawn with its axes, its rings
and every one of its mounts in the empty ink, and none of the four cells appears — a span, a widest
and a spread are all figures about a group of armed mounts.

### 7. Read endurance at an allocation

`WEAPON CAPACITOR` draws four rows in the canvases' own order — sustained draw, recharge, time to
drain, then `WEP CAP` capacity — the first two in MJ/s and the capacity in the game's own `MW`
(ruled 2026-08-27), under the WEP allocation they were read at. Draw and
recharge carry a bar each, because those two share one scale; the other two carry none. Changing WEP
in the `POWER` mode and returning to `OFFENCE` moves recharge and time to drain and leaves capacity
alone. The capacitor result does not change when the dashboard's hardpoint state changes.

Finite duration reads as localized seconds; a zero reads as draining immediately; a recharge that
keeps pace draws `∞`, with what the symbol stands for carried in words beside it and out of sight.
`Infinity` never reaches a formatter. A zero capacity is stated as the package's own figure, with no
cause beside it.

### 8. Read the rail cell

The rail's `DPS` cell carries the same sustained figure the panel draws, from the same projection.
It has no unit, no second figure and no control. Unavailable coverage qualifies it once; an exact
zero does not.

## Responsive, localization and accessibility acceptance

```bash
pnpm exec playwright test offence-profile.spec.ts ui-preview.spec.ts
```

- All five layout profiles in both engines, with an axe scan over every state. Where Firefox cannot
  be installed this command produces the five Chromium projects only; the repository's CI installs
  both engines and shards the whole matrix, so that is where the Firefox evidence comes from — see
  the engine-coverage note at the head of [tasks.md](./tasks.md). The requirement is not waived by
  being unrunnable somewhere.
- At roomy widths the first two blocks are the canvas's fluid pair and convergence runs full width
  beneath them; at narrow widths, landscape phones, 200% text and actual 400% zoom all three stack,
  with no document-level horizontal scroll.
- The target-range field is a control at feature 011's target size, operable by pointer, touch and
  keyboard, announcing the distance in words.
- Owned strings resolve from message keys; damage rates, MW, MJ/s, seconds, metres, milliradians,
  percentages, counts and ratings use active-locale formatters; a German catalogue changes no package
  number.
- An RTL root keeps every value with its label.
- Canonical package names are disclosed as such when the active locale has no translation.
- Conformance is stated as "WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and
  2.4.11".

## Offline

```bash
pnpm run e2e:offline
```

Load the workspace, go offline, open `OFFENCE`, move the convergence target range and change WEP
pips. No cross-origin request is made.

## Full gate

```bash
pnpm run check
```

Formatting, compilation, build, policy checks, unit coverage at or above 80% on all four counters,
all ten Playwright projects and every axe scan, with nothing skipped, focused or quarantined.

`pnpm run check` runs the whole matrix, so on a machine with no Firefox binary it fails at the
`e2e` step rather than passing a narrower gate quietly. That failure is the engine-coverage note's
subject, not a defect in the feature: run the five Chromium projects to judge the change locally,
and read the full ten off CI, which installs both engines.
