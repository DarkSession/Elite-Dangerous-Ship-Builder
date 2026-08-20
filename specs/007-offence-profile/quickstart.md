# Quickstart: Offence Profile Validation

This guide validates feature 007 after its shared prerequisites are accepted and implemented. It is
an end-to-end acceptance guide, not an implementation recipe.

## Prerequisites

- Node.js and pnpm versions from the repository configuration
- `@elite-dangerous-almanac/core` from the committed lockfile
- full TypeScript and Angular-template strictness enabled with the repository passing
- feature 001 active build/revision and `/build` workspace
- feature 002 accepted same-revision hardpoint coverage and exact-slot reveal boundary
- feature 003 settled integer-half-pip conditions, Status provider and workspace targets
- feature 005 accepted generalized power-observation port with an explicit deployed distributor read
- feature 011 tokens/components, localization/game text, previews, axe and ten-project browser matrix

Do not run feature 007 tasks by substituting private local infrastructure for any missing
prerequisite.

Install without changing the lockfile:

```bash
pnpm install --frozen-lockfile
```

When the feature-011 browser matrix is implemented, preinstalled browser paths may be supplied through
its accepted `E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` configuration. The current config reads only
the Chromium variable.

## Package and contract audit

Confirm the installed package and public leaves:

```bash
pnpm why @elite-dangerous-almanac/core
pnpm exec tsc --showConfig -p tsconfig.app.json
```

Rerun the live leaf-import probes documented in [research.md](./research.md). Expected outcomes:

- the total has every documented `WeaponTotals` member;
- returned weapons retain exact identities/order, full metrics, ammunition and sparse range/piercing;
- disabled entries remain while package totals exclude them;
- optional unclassified is absent when zero;
- WEP 0, 0.5, 2 and 4 return all six capacitor fields;
- zero/infinity, finite/zero/unlimited ammunition and boundary value zero remain distinct;
- known slots use hull order and appended unknown slots retain source order.

Fail the audit if implementation requires a catalogue/fitted-module join, local sort, weapon sum,
power diagnosis or capacitor formula.

## Static and unit validation

Run focused tests while developing:

```bash
pnpm exec ng test --include='src/app/**/*offence*.spec.ts'
```

Then run static checks:

```bash
pnpm run format:check
pnpm run typecheck
pnpm run build
```

Expected:

- package imports use the exact leaf paths in the contracts;
- strict TypeScript/template checks pass;
- no local damage/share/falloff/piercing/target/convergence/pip/recharge/drain/endurance or power-
  shedding formula exists;
- detail and Status select the same cached weapon projection;
- absent optional members and infinity use field-specific semantics rather than truthiness;
- all four coverage thresholds remain at or above 80%.

## End-to-end scenarios

After feature 011 supplies the complete matrix, run:

```bash
pnpm exec playwright test e2e/offence-profile.spec.ts
```

Every scenario runs in Chromium and Firefox at desktop, tablet portrait, tablet landscape, mobile
portrait and mobile landscape.

### 1. Read complete build output

Open a build with multiple enabled weapons and select Offence from feature 003 Status.

Expected:

- every total and every per-weapon field appears with exact scope/unit;
- canonical identity is preserved and localized game text/fallback is disclosed correctly;
- no alpha, share, target-adjusted, range-band or convergence figure appears;
- visible numbers equal the same live package result after locale-aware parsing.

### 2. Preserve damage-type meaning

Use fixtures covering conventional, unclassified and anti-xeno output.

Expected:

- burst and sustained groups show all required package fields;
- optional unclassified presence matches the package, and absence means none/zero rather than
  unavailable;
- anti-xeno is described as an overlay;
- color/position is never the sole type meaning.

### 3. Distinguish empty, unavailable, disabled and zero

Exercise confirmed-empty hardpoints, unavailable package coverage, all returned weapons disabled and
a genuine zero-damage weapon. Unsupported module identities are outside this feature's input contract.

Expected:

- only confirmed-empty coverage says no fitted weapons;
- unavailable coverage has an explicit qualification and no invented weapon fields;
- disabled/genuine-zero entries remain complete;
- package totals are untouched and Status qualification appears only for incomplete/unavailable
  coverage.

### 4. Inspect range, piercing and ammunition

Use fixtures with effective range, absent range, projectile boundaries including zero, absent
piercing, no ammunition, finite capacity, zero reserve and unlimited reserve.

Expected:

- effective distances come only from fitted weapon results and use metres;
- projectile boundaries remain separately named and unitless;
- absent optional fields remain not stated;
- ammunition meanings stay distinct and infinity is never generic-formatted.

### 5. Reach exact hardpoints

Activate every returned weapon action, including duplicate symbols and disabled/zero weapons.

Expected:

- feature 002 receives the exact original slot key once;
- wide layout reveals the inline slot; narrow layout opens the selected-slot layer and named return;
- details and slot actions remain distinct touch-sized controls.

### 6. Change WEP conditions

Apply valid feature-003 allocations including displayed WEP 0, 0.5, 2 and 4, plus invalid drafts.

Expected:

- integer half-pips divide by two exactly once;
- displayed allocation and all capacitor fields equal the package result;
- weapon metrics/Status sustained DPS do not change merely because WEP changes;
- invalid drafts call no feature-007 package boundary and advance no revision.

### 7. Read finite, immediate and infinite endurance

Exercise draining load, positive-draw zero capacity, sustaining positive draw, all-disabled weapons,
no weapons and plant-off/power-shed contexts.

Expected:

- finite seconds, immediate zero and both infinity meanings are correct;
- zero capacity remains numeric beside the independent deployed distributor observation;
- aggregate weapon EPS is not forced to equal powered capacitor draw;
- no cause is inferred from zero/null.

### 8. Consume Status and revisions

Compare feature 003's sustained-DPS summary with the detailed capability, then rapidly alternate
weapon edits, undo/redo, coverage changes and valid WEP changes.

Expected:

- Status and detail use identical package sustained DPS and the `offenceProfile` target;
- owner qualification `sustainedDps` appears once only for incomplete/unavailable coverage;
- every visible snapshot shares current revisions; stale projections never flash;
- one settled change produces at most one localized announcement.

## Responsive, localization and accessibility acceptance

For populated, empty, unavailable-coverage, disabled, genuine-zero, optional-field, ammunition, zero-capacity,
infinite and failure states:

- run the shared axe scan in every browser/layout project;
- verify no document-level horizontal scroll at each viewport, 200% text and actual 400% zoom;
- verify content/action parity in tablet and mobile portrait/landscape;
- verify touch/pointer controls use feature 011's target-size token and no function depends on hover;
- verify headings, definition groups, disclosures, qualifications and exact-slot actions are
  understandable by screen reader;
- verify no meaning depends only on color, bar length, shape or position;
- verify expanded-language and RTL association/wrapping;
- verify reduced motion loses no meaning;
- switch locales and confirm application messages/units change while package game text uses localized
  output or disclosed canonical fallback.

Any conformance statement must say: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1,
2.4.3, 2.4.7 and 2.4.11.”

## Full gate

```bash
pnpm run check
```

Expected: formatting, three typechecks, production build, script tests, unit coverage and every
Playwright project pass. Do not skip a browser, orientation, accessibility scan or failing test.
