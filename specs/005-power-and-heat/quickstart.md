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

- Node resolves version 24;
- `package.json` and the lockfile agree on the Almanac release;
- production imports use leaf paths;
- TypeScript strict mode is enabled before feature work;
- prerequisite feature contracts 001, 002, 003 and 011 are implemented.

## 2. Reproduce the blocking Almanac defect

Run against the currently pinned package:

```bash
node --input-type=module <<'NODE'
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';

const source = ShipLoadout.default('SideWinder').toLoadoutEvent();
const build = ShipLoadout.fromLoadout({
  ...source,
  Modules: source.Modules.map((module) =>
    module.Slot === 'SmallHardpoint1'
      ? {
          ...module,
          Item: 'Unresolved_Test_Weapon',
          Engineering: {
            BlueprintName: 'Unknown',
            Level: 1,
            Quality: 1,
            Modifiers: [
              { Label: 'PowerDraw', Value: 0.2 },
              { Label: 'ThermalLoad', Value: 20 },
              { Label: 'DistributorDraw', Value: 2 },
            ],
          },
        }
      : module,
  ),
});

const budget = build.powerBudget();
const heat = build.heatMetrics();

console.log({
  consumer: budget.consumers.find(
    ({ label }) => label === 'SmallHardpoint1',
  ),
  powerUnknowns: budget.unknownDraws,
  heatUnknowns: heat?.unknownDraws,
  firing: heat?.firingSustained,
});
NODE
```

Installed 0.1.1 currently reports a 0.2 MW consumer, no power unknown and no
heat unknown, while ignoring the unresolved weapon's supplied thermal
information. This is the blocking defect.

Do not start implementation or generate feature tasks until:

1. the reproduction is raised against Elite-Dangerous-Almanac;
2. an upstream fix is released;
3. this repository pins that release;
4. the reproduction returns a structured qualification naming the unresolved
   heat contributor;
5. [contracts/heat-profile.md](./contracts/heat-profile.md) is aligned to the
   exact released field.

No validation-based, slot-based or journal-modifier workaround is acceptable.

## 3. Verify prerequisite integration contracts

Before implementation acceptance, confirm:

- feature 001 exposes one active `ShipLoadout`, numeric build revision,
  no-build state and `/build`;
- feature 002 advances that revision on committed edits and reveals an exact
  slot target;
- feature 003 exposes integer-half-pip `ViewingConditions`, draft/Apply/Reset,
  condition revision, `StatusProvider<T, I>` and `powerAndHeat`;
- feature 003 permits reuse of the same scoped condition controls inside Power
  and Heat as required by FR-003;
- feature 010 consumes feature 005's
  `HardpointPowerObservationPort` rather than power fields directly;
- feature 011 supplies shared UI, localized formatting/game text, previews,
  ten Playwright projects and axe helpers.

Expected: no feature 005 state duplicates a prerequisite.

## 4. Run focused automated tests

After the blocker and prerequisites are resolved:

```bash
pnpm test -- --include='src/app/**/power-heat/**/*.spec.ts'
pnpm exec playwright test e2e/power-and-heat.spec.ts
```

Expected: unit tests compare views/ports field-for-field with the package result
for one revision context. Browser tests run every configured Chromium/Firefox
size/orientation project with the shared accessibility helper.

## 5. Validate selected power state

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

## 6. Validate unknown, disabled and zero-output power

Use fixtures for:

- enabled unknown draw;
- disabled null draw with no enabled unknown;
- zero capacity and zero draw;
- zero capacity and positive draw;
- all five bands including a zero-draw group.

Expected:

- enabled unknowns name exact returned slots;
- draw/band/utilisation fields are lower bounds, headroom is known-draw-only and
  booleans are known-draw-only;
- disabled null draw remains visible but does not qualify aggregates;
- plant capacity is always exact;
- zero/zero utilisation is numeric zero;
- positive draw/zero capacity uses “draw with zero available plant output.”

## 7. Validate module contributions and slot actions

For every returned `PowerBudget.consumers` entry:

1. Compare exact label, symbol, draw/null, enabled, priority and deployed-only.
2. Confirm null draws precede numeric ordering.
3. Confirm numeric ties retain package source order.
4. Confirm identical module symbols remain separate exact-slot rows.
5. Activate the row's slot action once.

Expected: feature 002 reveals the original returned slot label. Passive and
zero-draw fittings absent from consumers are not invented. A missing facade
label/symbol produces projection failure and an upstream regression, not an
inferred identity.

## 8. Validate distributor performance

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

## 9. Validate heat

After the fixed package release:

1. Compare plant efficiency, hull capacity and dissipation.
2. In order, compare idle, thrusters, FSD charging, sustained fire and
   drained-capacitor fire.
3. For each, compare all five `HeatState` fields.
4. Repeat with no weapons.
5. Repeat with non-settling and never-overheating fields.
6. Repeat the blocking unresolved-weapon fixture and another package-reported
   unknown contributor.
7. Repeat with package null from absent/disabled/unavailable plant state.

Expected: five scenarios remain whenever ready. Unknown contributors name and
qualify the whole profile as a non-directional projection. Non-settling and
never-overheating are distinct. Null remains unavailable. No reference-only
heat summary appears.

## 10. Validate feature 003 and 010 ports

For one captured context:

1. Compare `PowerStatusProjection.available`,
   `hardpointState` and `selectedDraw` with the detail projection.
2. Confirm `qualifiedSummaryIds` is exactly `['power']` for enabled unknown
   draw and empty otherwise.
3. Confirm target is exactly `powerAndHeat`.
4. Query hardpoint observations covering not applicable, disabled, inactive
   retracted, powered, shed and every qualified reason.
5. Advance build and condition revisions during projection.

Expected: both ports return the captured revision pair; stale results do not
publish; feature 003/010 do not calculate, join or reinterpret power.

## 11. Validate responsive, accessibility and localization behavior

Exercise complete, lower-bound, projection, unavailable, zero and error states
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

## 12. Run the complete gate

```bash
pnpm run check
```

Expected: format check, all typechecks, static build, script tests, unit
coverage at or above 80% for every threshold, and the complete dual-engine
Playwright/accessibility matrix pass without skipped or quarantined cases.
