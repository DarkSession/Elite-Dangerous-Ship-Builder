# Quickstart: Validate Power and Heat

This guide validates feature 005 end to end. It is not an implementation guide.
The field and intent contracts are in [contracts/](./contracts/), and the state
model is in [data-model.md](./data-model.md).

## 1. Prerequisites and release gate

Use Node.js from `.nvmrc`, pnpm from `packageManager`, and the committed lockfile:

```bash
nvm use
pnpm install --frozen-lockfile
```

Before implementation or acceptance, confirm all gates:

- [Elite-Dangerous-Almanac issue #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
  has been fixed in a released package;
- [ship-builder issue #13](https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/issues/13)
  tracks consumption of that package;
- this repository pins the fixed `@elite-dangerous-almanac/core` release;
- feature 001 supplies the active build/revision and `/build` workspace;
- feature 002 supplies exact-slot selection and power editing controls;
- feature 003 supplies atomic deployed/retracted and valid pip conditions;
- feature 011 supplies tokens/components, localization, dual-engine projects
  and automated accessibility scans.

Expected: no raw-modifier parser, aggregate subtraction, reduced-build probe or
copied power-consumer rule exists in application code. If the released package
does not expose the required module projection, stop; feature 005 remains
blocked.

## 2. Run focused automated tests

During development, run the relevant unit and browser journeys:

```bash
pnpm test -- --include 'src/app/domain/power-heat/**/*.spec.ts' --include 'src/app/application/power-heat/**/*.spec.ts'
pnpm exec playwright test e2e/power-and-heat.spec.ts
```

Expected: every projection asserts equality with one package result for one
build/condition revision. Browser tests execute all configured Chromium and
Firefox viewport/orientation projects and their accessibility scans.

## 3. Validate selected power state

1. Open a known active build whose deployed draw sheds at least one lower
   priority band while retracted draw does not.
2. Open Power and Heat from the power headline.
3. Confirm deployed is selected by default.
4. Compare plant capacity, total draw and every band's draw, cumulative draw and
   powered state with `ShipLoadout.powerBudget()` deployed fields.
5. Confirm headroom, utilisation and within-budget equal the package result.
6. Select retracted.
7. Compare total/band fields with the retracted package fields.
8. Confirm headroom, utilisation and within-budget are omitted and a localized
   explanation identifies them as deployed-only package summaries.

Expected: exactly one hardpoint state is shown, every band is present and no
retracted summary is calculated.

## 4. Validate module contributions and slot actions

Use package/repository fixtures covering a known engineered module, a disabled
module, a deployed-only module, an unknown draw and the unresolved-modifier
reproduction from [research.md](./research.md#per-module-power-projection--upstream-blocker).

For each fixture:

1. Compare every displayed module entry with the released Almanac per-module
   projection.
2. Confirm exact draw/unavailable, enabled, priority and deployed-only state.
3. Switch to retracted and confirm deployed-only entries stay visible and are
   labelled inactive without an application-calculated zero.
4. Confirm unknown entries form a separate group before numerically ordered
   known entries.
5. Activate every entry's slot action once.

Expected: one entry per exact slot, no grouping by module name, no unknown in
numeric ordering, and feature 002 reveals the matching original game slot key.
The unresolved-modifier fixture displays the package's exact 1.5 MW contribution
without reading raw modifiers in application code.

## 5. Validate unknown and no-plant power

1. Load a build whose package budget returns at least one `unknownDraws` entry.
2. Confirm every returned unknown is named.
3. Confirm total and band numbers are labelled lower bounds and package booleans
   are identified as known-draw-only verdicts.
4. Load a build with no enabled power plant but reportable module draw.

Expected: draw remains visible, capacity remains package zero and deployed
utilisation infinity is expressed as draw with no plant output. The interface
does not show an unexplained infinity symbol or claim that zero-draw bands prove
fitted modules are powered.

## 6. Validate distributor performance

1. Start with the default 2/2/2 allocation.
2. Compare SYS, ENG and WEP capacity, rated recharge, actual recharge and pips
   used with `distributorMetrics({ systemsPips: 2, enginesPips: 2,
weaponsPips: 2 })`.
3. Move pips through valid half-step allocations, including zero on each
   capacitor in turn.
4. Confirm feature 003 prevents a total other than six or a capacitor above
   four.
5. Test missing, disabled, unresolved and retracted-shed distributor fixtures.

Expected: capacity and all recharge fields equal the package result. Zero-pip
actual recharge is genuine zero. Every package `null` produces unavailable with
no catalogue fallback or inferred diagnostic. Pip changes do not enter edit
history, storage, URL, link or SLEF.

## 7. Validate heat profile

1. Load a build with a ready finite heat result.
2. Compare plant efficiency, hull capacity and dissipation with the package.
3. In order, compare idle, thrusters, FSD charging, sustained fire and
   drained-capacitor fire.
4. For each scenario compare thermal load, heat level, gauge, overheat state and
   time to overheat.
5. Repeat with no weapons.
6. Repeat with a non-settling scenario and a never-overheating scenario.
7. Repeat with `unknownDraws`, then with `heatMetrics() === null`.

Expected: all five scenarios remain present whenever the result is ready. A
non-settling heat/gauge field and a never-overheating time use different
localized meanings. Unknown contributors qualify the entire profile as a
projection, not a bound. Null remains unavailable and no reference-only heat
sink, cell-bank, peak or WEP-drain result appears.

## 8. Validate revision coherence and performance

1. Trigger rapid module edits through feature 002 while alternating hardpoint
   and valid pip conditions.
2. Observe the revision identifiers used by the presenter test seam.
3. Measure the settled update at the mobile viewport under Playwright 4x CPU
   slowdown.

Expected: every visible snapshot uses one build revision and one condition
revision, with no stale partial patch. The settled result updates within 100 ms.
Viewing-condition changes never create undo entries.

## 9. Validate responsive and accessible behavior

Run the primary journeys at desktop, tablet and mobile portrait/landscape in
Chromium and Firefox. For every complete, lower-bound, projection, unavailable,
zero and error state:

- run `@axe-core/playwright` and fail on every in-scope violation;
- verify semantic headings, definitions/tables/cards and named conditions;
- verify textual equivalents for every bar, gauge, powered and overheat state;
- verify slot-action names include module and slot context;
- verify touch targets meet the shared 44 CSS-pixel token;
- verify 200% text and 400% zoom with no document horizontal scrolling;
- verify expanded and RTL text, reduced motion and both orientations;
- verify polite updates announce changed condition/qualification once without
  repeating unchanged figures;
- complete the three primary stories with a screen reader.

Expected: the same complete capability works at every size and in both engines.
If conformance is described, the wording names the exclusions: WCAG 2.2 AA
except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## 10. Validate localization and source boundaries

Switch between every shipped locale and use expanded/RTL fixtures.

Expected:

- every application label, unavailable/qualification notice and non-finite
  phrase comes from feature 011 messages with bundled English fallback;
- MW, MJ, MJ/s, percentage, pip and duration formatting follows the active
  locale;
- module game text comes from the Almanac with canonical-language disclosure
  when needed;
- no raw key, blank placeholder, private game translation, hard-coded display
  text or application-owned diagnostic reaches the screen;
- production imports use package leaf paths.

## 11. Run the complete gate

```bash
pnpm run check
```

Expected: formatting, type checking, static build, script tests, unit tests with
at least 80% statements/branches/functions/lines, and the full dual-engine
Playwright/accessibility matrix pass with no skipped or quarantined case.
