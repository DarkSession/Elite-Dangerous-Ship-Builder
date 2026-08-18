# Quickstart: Mobility, Mass and Jump Validation

This guide validates feature 008 after its upstream and repository prerequisites are available. It
is an acceptance/run guide, not an implementation recipe.

## Prerequisites

- Node.js 24 (`.nvmrc`)
- pnpm 10.33.0 from `packageManager`
- Chromium and Firefox versions compatible with Playwright 1.62.1
- implemented feature 001 active build/workspace
- implemented feature 002 package slot targeting and unresolved-state boundary
- implemented feature 003 shared standard-load/ENG conditions and Mobility headline
- implemented feature 005 package-backed exact-slot power observation
- implemented feature 011 tokens, components, localization and accessibility harness

Install without changing the lockfile:

```bash
pnpm install --frozen-lockfile
```

If the environment supplies browser executables instead of Playwright's pinned downloads, set
`E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` to those exact executables.

## Upstream release gates

1. Confirm [Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) is
   closed by a released package where power-shed thrusters make `mobilityMetrics()` return `null`.
2. Confirm [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299) is
   closed by a released exact-slot per-module power projection and feature 005 exposes the shared
   observation required to name unpowered thrusters.
3. Check [Almanac #295](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/295). It is
   non-blocking; until a direct standard-load contract ships, retain feature 003's package-only
   `fuelPerJump(maxJumpRange())` composition and no local fuel-cap formula.
4. Upgrade the exact dependency and lockfile through the normal dependency change, then rerun the
   probes in [research.md](./research.md).

Before #296/#299 are released and consumed, feature 008 must remain blocked; do not add a local
power gate, infer an unpowered state, copy priority rules or null a package result.

Useful audit commands:

```bash
pnpm why @elite-dangerous-almanac/core
gh issue view 295 --repo DarkSession/Elite-Dangerous-Almanac
gh issue view 296 --repo DarkSession/Elite-Dangerous-Almanac
gh issue view 299 --repo DarkSession/Elite-Dangerous-Almanac
```

## Static and unit validation

Run focused unit tests while developing:

```bash
pnpm exec ng test --include='src/app/**/*mobility*.spec.ts'
```

Then run formatting, type and production-build checks:

```bash
pnpm run format:check
pnpm run typecheck
pnpm run build
```

Expected outcomes:

- package imports use leaf exports;
- no local jump, range, jump-count, mass, capacity, standard-load, thruster-curve or power formula
  exists;
- each projector test compares exact fields with live package results/snapshots;
- incomplete diagnostics prevent dependent calls and retain every ordered issue;
- zero, null, incomplete, unavailable and unknown module mass use discriminated states rather than
  truthiness;
- unit coverage remains at or above 80% for statements, branches, functions and lines.

## End-to-end acceptance scenarios

Each scenario runs for desktop, tablet, mobile portrait and mobile landscape in Chromium and Firefox.
Run the feature journey with:

```bash
pnpm exec playwright test e2e/mobility-and-jump.spec.ts
```

### 1. Read all standard jump results

1. Open a complete build with a resolved fitted FSD, fuel and cargo capacity.
2. Open Mobility from the status headline/capability navigation.
3. Compare all three load groups with the same build revision's `jumpRangeSummary()`.

Expected:

- maximum, unladen and laden each show single range, total range and jump count exactly once;
- every number equals its package field after locale parsing;
- every group identifies its load and the exact fitted FSD;
- only present returned FSD parameters appear;
- no local range, count, headroom, mass-factor or comparison figure appears.

### 2. Distinguish no drive, incomplete inputs and zero fuel

Exercise builds with no usable FSD, an unresolved drive, incomplete mass, incomplete fuel capacity,
incomplete cargo capacity and complete zero main fuel.

Expected:

- dependent jump methods are never called while diagnostic prerequisites are incomplete;
- all package issues retain field/slot/symbol/params/order;
- missing/unresolved drive has no fabricated number;
- complete zero fuel shows package numeric zero for all range/count results;
- prior revision values never remain under the new source state.

### 3. Preserve zero-cargo load identities

Open a complete build with zero cargo capacity.

Expected:

- cargo capacity is complete numeric zero;
- unladen and laden profiles remain separately labelled even when package values are equal;
- no presentation deduplication or inferred difference appears.

### 4. Change selected load and ENG pips

Apply maximum, unladen and laden loads and valid ENG allocations including 0, 0.5, 2 and 4 through
feature 003's shared controls.

Expected:

- `mobilityMetrics()` receives exact shared package inputs once per settled revision;
- all seven visible mobility fields equal that call;
- Jump Performance always keeps all three profiles while the selected headline/context changes;
- invalid drafts change no result and trigger no feature 008 projection.

### 5. Distinguish null and package zero mobility

Exercise absent, disabled, power-shed and unresolved thrusters, then a resolved build above its
thruster maximum supported mass.

Expected:

- absent, disabled, unpowered and unresolved source states are textually/programmatically distinct;
- package null has no hull base-value fallback;
- power-shed regression passes only with the released #296 fix and #299-backed observation;
- above-supported-mass result remains ready numeric zero for all seven fields, not unavailable.

### 6. Inspect returned source parameters

Use stock and engineered FSD/thruster fixtures covering shared, enhanced speed and enhanced rotation
curves plus absent optional fields.

Expected:

- only package-present thresholds, factors and multipliers appear;
- selected-load multipliers equal `mobilityMetrics()` fields;
- sparse facts remain absent rather than zero;
- no bar length, percentage-of-optimal, curve or headroom is calculated.

### 7. Read mass and capacity diagnostics

Exercise complete aggregates, each incomplete aggregate independently and combined package issues.

Expected:

- unladen mass, main fuel, reserve fuel and cargo equal the three package results;
- one incomplete group does not hide an independent complete group;
- all issues remain attached to their owning result in package order;
- zero mass/capacity values remain numeric zero.

### 8. Inspect every fitted module mass

Use a build containing duplicate module symbols in different slots, a package-resolved engineered
mass, a zero-mass module and an unresolved module.

Expected:

- every fitted package snapshot appears exactly once under its original slot;
- each ready value equals `effectiveStats.mass` after locale parsing;
- unresolved mass is unavailable, never zero;
- exact-slot actions target only the owning slot;
- no displayed module subtotal or locally reconstructed unladen mass exists.

### 9. Preserve one revision

Rapidly alternate a module edit, engineering change, undo/redo, load change and valid ENG-pip change
while the capability is open.

Expected:

- all visible jump, mobility, mass, capacity, source and module facts share the latest build/condition
  revision;
- stale projections never appear beneath new context;
- one settled change produces one concise polite announcement;
- matching DOM appears within 100 ms at mobile Chromium under 4x CPU slowdown.

## Responsive, localization and accessibility validation

For populated, zero-fuel, zero-cargo, incomplete, absent/unresolved drive, each thruster state,
ready-zero mobility, missing optional fact, unknown module mass and failure states:

- run the shared automated accessibility scan;
- verify no document-level horizontal scroll at every project viewport and 400% zoom;
- verify full content/action parity in portrait and landscape;
- verify every disclosure/slot action has at least the shared 44 CSS-pixel target and works by touch;
- verify headings, definition groups, issue lists, source states and actions are understandable by
  screen reader;
- verify no state/load/result relies only on colour, bar length, shape or position;
- switch to expanded-text and RTL fixtures and confirm wrapping/order;
- enable reduced motion and confirm no result or announcement is lost;
- switch locales and confirm labels, load names, numbers and units change while package game text and
  diagnostics use the shared untranslated disclosure when required.

Any conformance statement must say: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1,
2.4.3, 2.4.7 and 2.4.11.”

## Full release gate

Run the repository gate:

```bash
pnpm run check
```

Expected: format, typecheck, production build, script tests, unit coverage and every Playwright
project pass. Do not skip a browser, viewport, accessibility scan or failing test.
