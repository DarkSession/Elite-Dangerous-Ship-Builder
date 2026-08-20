# Quickstart: Validate Power and Heat

This is a validation guide, not an implementation guide. Contracts are under
[contracts/](./contracts/), the state model is in
[data-model.md](./data-model.md), and responsive composition is in
[design/](./design/).

## 1. Establish the toolchain

```bash
nvm use
pnpm install --frozen-lockfile
```

Confirm:

- Node satisfies `.nvmrc` / `package.json#engines`;
- the Almanac resolves from the committed lockfile;
- production imports use leaf paths;
- TypeScript strict mode is enabled before feature work;
- prerequisite feature contracts 001, 002, 003 and 011 are implemented.

## 2. Verify prerequisite integration contracts

Before implementation acceptance, confirm:

- feature 001 exposes one active `ShipLoadout`, numeric build revision,
  no-build state and `/build`;
- feature 002 advances that revision on committed edits and reveals an exact
  slot target;
- feature 003 exposes integer-half-pip `ViewingConditions`, draft/Apply/Reset,
  condition revision, `StatusProvider<T, I>` and `powerAndHeat`;
- feature 003 permits reuse of the same scoped condition controls inside Power
  and Heat as required by FR-003;
- features 007 and 010 consume feature 005's generalized exact-slot
  `MountPowerObservationPort` rather than power fields directly;
- feature 011 supplies shared UI, localized formatting/game text, previews,
  ten Playwright projects and axe helpers.

Expected: no feature 005 state duplicates a prerequisite.

## 3. Run focused automated tests

After the prerequisites are resolved:

```bash
pnpm test -- --include='src/app/**/power-heat/**/*.spec.ts'
pnpm exec playwright test e2e/power-and-heat.spec.ts
```

Expected: unit tests compare views/ports field-for-field with the package result
for one revision context. Browser tests run every configured Chromium/Firefox
size/orientation project with the shared accessibility helper.

## 4. Validate selected power state

Use a build whose deployed draw sheds a lower priority band while retracted
draw does not:

1. Open Power and Heat from feature 003's compact power summary.
2. Confirm the shared conditions default to deployed and `2/2/2`.
3. Compare capacity, selected total and all five band draw/cumulative/verdict
   fields with the deployed `powerBudget()` result.
4. Compare deployed headroom, utilisation and within-budget.
5. Select retracted in the shared draft and Apply.
6. Compare all selected fields with the retracted package fields.
7. Confirm headroom, utilisation and within-budget are absent with a localized
   deployed-only explanation.

Expected: exactly one settled state appears; no retracted result is derived.

## 5. Validate disabled and zero-output power

Use fixtures for:

- a disabled consumer;
- zero capacity and zero draw;
- zero capacity and positive draw;
- all five bands including a zero-draw group.

Expected:

- disabled consumers remain visible and contribute exactly as the package reports;
- every draw, band, headroom, utilisation and verdict equals its package value;
- zero/zero utilisation is numeric zero;
- positive draw/zero capacity uses “draw with zero available plant output.”

## 6. Validate module contributions and slot actions

For every returned `PowerBudget.consumers` entry:

1. Compare exact label, symbol, draw, enabled, priority and deployed-only.
2. Confirm numeric ties retain package source order.
3. Confirm identical module symbols remain separate exact-slot rows.
4. Activate the row's slot action once.

Expected: feature 002 reveals the original returned slot label. Passive and
zero-draw fittings absent from consumers are not invented. A missing facade
label/symbol produces projection failure and an upstream regression, not an
inferred identity.

## 7. Validate distributor performance

1. Compare SYS/ENG/WEP capacity, rated recharge, actual recharge and returned
   pips at default `4/4/4` half-pips.
2. Apply valid half-pip allocations including zero for each capacitor.
3. Confirm only the package-call adapter divides integer half-pips by two.
4. Attempt invalid range, step and total drafts.
5. Exercise package ready-zero and null results, including a null
   retracted-shed distributor.

Expected: every ready field equals `distributorMetrics()`; zero remains zero;
invalid drafts retain prior settled results; null has no catalogue fallback or
inferred cause.

## 8. Validate heat

For the ready heat profile:

1. Compare plant efficiency, hull capacity and dissipation.
2. In order, compare idle, thrusters, FSD charging, sustained fire and
   drained-capacitor fire.
3. For each, compare all five `HeatState` fields.
4. Repeat with no weapons.
5. Repeat with non-settling and never-overheating fields.
6. Repeat with package null from absent/disabled/unavailable plant state.

Expected: five scenarios remain whenever ready, each carrying the package's own figures. Non-settling
and never-overheating are distinct. Null remains unavailable. No reference-only heat summary appears.

## 9. Validate feature 003 and 010 ports

For one captured context:

1. Compare `PowerStatusProjection.available`,
   `hardpointState` and `selectedDraw` with the detail projection.
2. Confirm `qualifiedSummaryIds` is empty.
3. Confirm target is exactly `powerAndHeat`.
4. Query hardpoint, utility and distributor-core observations covering not
   applicable, disabled, inactive retracted, powered and shed.
5. Advance build and condition revisions during projection.

Expected: both ports return the captured revision pair; stale results do not
publish; features 003, 007 and 010 do not calculate, join or reinterpret power.

## 10. Validate responsive, accessibility and localization behavior

Exercise complete, unavailable, zero and error states
at desktop, tablet/mobile portrait and landscape in Chromium and Firefox:

- run axe and fail every in-scope violation;
- verify headings, definitions, table/card relationships and visible/matching
  control names;
- verify complete text equivalents for every bar/gauge/state;
- verify distinct module+slot action names and shared touch-target sizing;
- verify 200% text and actual 400% zoom without document horizontal scrolling;
- verify expanded and RTL text, reduced motion and both orientations;
- verify one polite settled announcement and one prompt blocking alert;
- complete the three user stories with a screen reader.

Switch through every shipped locale. Confirm owned text/sentinels use messages,
numbers/units use active-locale formatting and game text comes from the Almanac
with disclosed canonical fallback or unavailable state.

If conformance is stated, name the exclusions: WCAG 2.2 AA except criteria
2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## 11. Run the complete gate

```bash
pnpm run check
```

Expected: format check, all typechecks, static build, script tests, unit
coverage at or above 80% for every threshold, and the complete dual-engine
Playwright/accessibility matrix pass without skipped or quarantined cases.
