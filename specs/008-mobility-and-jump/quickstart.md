# Quickstart: Mobility, Mass and Jump Validation

> **Superseded in part.** This document was written before the design review and describes an
> arrangement and a package surface the design and the installed Almanac replaced. Three corrections
> govern anything read here:
>
> 1. **Getters that do not exist.** `unladenMassResult`, `fuelCapacityResult` and
>    `cargoCapacityResult` are not in `@elite-dangerous-almanac/core`, deliberately: the package
>    documents those three aggregates as figures it can always state, with `importOutcomes()` rather
>    than a `CalculationResult` as the report. The build's mass split comes from `buildMass(load)`
>    and the thruster's curve from `BuildMetrics.thrusters()`. See FR-006 in [spec.md](./spec.md).
> 2. **Two cards, not five surfaces.** Canvases 1c and 1d draw `THRUSTER LOAD` and `FRAME SHIFT
DRIVE`; the five stacked components and the per-module mass list described below are not built.
>    See [design/reference-review.md](./design/reference-review.md) and
>    [design/mobility-and-jump-profile.md](./design/mobility-and-jump-profile.md).
> 3. **Only what the canvas draws.** The two mass-curve multipliers, a Guardian booster's jump bonus,
>    `unladenMass`, `cargoCapacity` and — since the revision of 2026-08-25, which cut the fuel legend
>    row's qualifier to the bare word `TANK` — `fuelCapacity` are real package figures neither canvas
>    has, so none is read or drawn. See FR-004 and FR-006 in [spec.md](./spec.md).
>
> Where this document and those disagree, those decide.

This is the runnable acceptance guide for feature 008 after its shared prerequisites are present. It
does not contain implementation code or hand-calculated game figures.

## Prerequisites

- Node.js from `.nvmrc` / `package.json#engines`
- pnpm from `package.json#packageManager`
- `@elite-dangerous-almanac/core` from the committed lockfile
- TypeScript strict mode enabled in the shared configuration
- feature 001 active build/revision and `/build` workspace
- shared package-populated fixed-mount ingress, feature 002 revision advancement and exact-slot
  targeting
- feature 003 stage-one viewing-condition/context/provider/target contracts
- feature 011 token, component, localization, preview and dual-engine accessibility foundations
- Chromium and Firefox versions compatible with the lockfile-resolved Playwright

Install exactly the committed dependencies:

```bash
pnpm install --frozen-lockfile
```

If the environment supplies browsers rather than Playwright downloads, set `E2E_CHROMIUM_PATH` and
`E2E_FIREFOX_PATH` to their exact executables.

## Verify the package boundary first

Use small direct package tests/probes, then preserve them as feature unit tests:

1. Confirm all three `standardLoadResult()` calls are complete for a stock build and
   `jumpRangeSummary()` returns the three single/total/count groups.
2. Confirm an empty build has complete zero mass/fuel/cargo where the package says so, an incomplete
   maximum standard load with `frameShiftDrive/missing`, and a throwing summary.
3. Disable `MainEngines` and confirm `mobilityMetricsResult()` is incomplete with
   `thrusters/disabled`.
4. Use an undersized plant/high thruster priority fixture and confirm the result reports
   `thrusters/shed` without a local power-budget classification.
5. Confirm a load above the thruster maximum yields a complete seven-field all-zero mobility value.
6. Confirm `slots('core')` identifies thrusters by `core: 'thrusters'` and exact key `MainEngines`.
7. Confirm a fitted engineered module's displayed row mass equals `effectiveStats.mass`.

Do not add copied expected game values. Compare the projector with live package results from the same
fixture/revision.

## Focused static and unit checks

During implementation run:

```bash
pnpm exec ng test --include='src/app/**/*mobility-jump*.spec.ts'
pnpm run typecheck
pnpm run build
pnpm run format:check
```

Expected:

- imports use Almanac leaf subpaths;
- all three aggregate and all three standard-load results guard the single summary call;
- selected standard load plus unladen mass guard one mobility call;
- all seven mobility and all nine jump summary fields are package-equal;
- exact `CalculationIssue` structures/order survive without a reduced local issue type;
- zero, incomplete, unavailable row and unexpected failure are separate discriminated states;
- no local jump/range/count, standard-load, mass/capacity, curve or power formula exists;
- no feature 005 dependency or second viewing-condition store/control exists;
- source slots use `BuildSlot.core` and retain `BuildSlot.key`; and
- coverage remains at least 80% for statements, branches, functions and lines.

## End-to-end acceptance

Run the feature journey across the feature 011 Chromium/Firefox projects:

```bash
pnpm exec playwright test e2e/mobility-and-jump.spec.ts
```

### 1. Read the complete jump summary

Open a complete build and navigate from the Status mobility summary to Drives & Mass.

Expected:

- maximum, unladen and laden each show single range, total range and jump count exactly once;
- every value equals the same build revision's `jumpRangeSummary()` field;
- the exact fitted FSD/slot and only present package parameters are adjacent;
- combined `jumpBoost`, if shown, is labelled as a build/booster parameter; and
- no mass factor, delta, bar-derived value or inferred SCO badge appears; and
- the only comparisons drawn are FR-008's two — the percentage of optimal mass and the headroom under
  it — each of which disappears when either of its two package operands does.

### 2. Guard jump inputs and preserve zero

Exercise incomplete mass, fuel and cargo; missing/package-incomplete FSD; active-booster failure; complete
zero main fuel; and complete zero cargo.

Expected:

- any incomplete aggregate or standard load prevents the summary call;
- all exact package issues retain field/reason/slot/symbol/message/params/order;
- no usable FSD produces no numeric summary;
- zero fuel remains package numeric zero; and
- equal unladen/laden results remain separate labelled profiles.

### 3. Read selected-load mobility

In feature 003's Status capability, Apply each load and valid ENG allocations including 0, 0.5, 2
and 4; then return to/read Drives & Mass.

Expected:

- the ENG allocation the envelope was read under is stated in the envelope's own heading, which is
  where the card names it, and no Apply/Reset control is duplicated;
- `maximumJump` maps to `standardLoadResult('maximum')`;
- the diagnostic mobility method receives exact package fuel/cargo and selected ENG pips once;
- speed, boost, pitch, roll and yaw equal the package result, and the two multipliers it also
  returns are not drawn; and
- invalid feature 003 drafts change no revision or feature 008 result.

### 4. Distinguish mobility unavailable states from ready zero

Exercise missing, disabled, shed and package-incomplete thrusters, power-capacity/draw issues, and a resolved
build above supported thruster mass.

Expected:

- the package field/reason and source identity distinguish each unavailable state;
- there is no feature 005 join or hull catalogue fallback;
- incomplete `mobilityMetricsResult().value` remains null; and
- above-supported-mass result remains a complete numeric zero in every field the canvas draws.

### 5. Read mass and capacity diagnostics

Exercise complete zero values, each incomplete aggregate independently, combined issues, and an
import whose package-supplied aggregate remains complete while a module row mass is unavailable.

Expected:

- unladen mass, main fuel, reserve fuel and cargo equal the exact three package results;
- each issue stays attached to its owning result in package order;
- one incomplete group does not hide another complete group; and
- feature 008 does not override either the trusted aggregate or unavailable module row.

### 6. Inspect every fitted module mass

Use duplicate module symbols in separate slots, engineered mass, zero-mass and unavailable-mass
entries.

Expected:

- every `fittedModules()` entry appears once in package order under its exact slot;
- each ready value equals `effectiveStats.mass`;
- unavailable resolved-module mass is explicit, never zero/base mass;
- slot actions target only the exact owning key; and
- no module subtotal, decomposition or reconstructed unladen mass appears.

### 7. Verify Status integration and revision coherence

Compare the selected jump, top speed and unladen mass in feature 003 Status with Drives & Mass, then
rapidly edit/undo/redo and Apply a new condition.

Expected:

- all three Status values come from feature 008's synchronous provider and exact context pair;
- selected jump follows maximumJump/unladen/laden; unladen mass keeps fixed meaning;
- each unavailable summary contributes its qualification ID once; ready zero contributes none;
- the detail target is `mobilityAndJump` and module actions use exact shared slot targets; and
- old figures never appear under new context; one settled revision produces one polite update.

## Responsive, localization and accessibility validation

For complete, zero, each incomplete/unavailable source state, sparse-parameter variants, unavailable
module mass, trusted aggregate and failure:

- run the shared axe scan in Chromium and Firefox at desktop, tablet portrait/landscape and mobile
  portrait/landscape;
- verify no document horizontal scrolling at each viewport, 200% text and actual 400% zoom;
- verify all fields/issues/rows remain present in portrait and landscape;
- verify semantic heading/region, definition-list or table relationships by screen reader;
- verify tabs/disclosures/slot actions have visible names/states, shared touch target size and work by
  touch without hover;
- verify no meaning relies on colour, bar length, arrows, shape or position;
- verify expanded text, RTL and reduced motion preserve reading order and associations; and
- switch locales and verify application labels/numbers/units update while Almanac game text and
  diagnostics follow the shared locale/canonical-disclosure contract.

Any conformance statement must say: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1,
2.4.3, 2.4.7 and 2.4.11.”

## Full release gate

```bash
pnpm run check
```

Expected: format, typecheck, production build, script tests, unit coverage and all ten Playwright
projects pass. Do not skip a browser, layout, accessibility scan or failing test.
