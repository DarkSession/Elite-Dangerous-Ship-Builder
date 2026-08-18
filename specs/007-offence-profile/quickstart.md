# Quickstart: Offence Profile Validation

This guide validates feature 007 after its repository prerequisites are available. It
is an acceptance/run guide, not an implementation recipe.

## Prerequisites

- Node.js 24 (`.nvmrc`)
- pnpm 10.33.0 from `packageManager`
- Chromium and Firefox versions compatible with Playwright 1.62.1
- implemented feature 001 active build/workspace
- implemented feature 002 package slot targeting/unresolved-state boundary
- implemented feature 003 viewing conditions and valid half-pip allocator
- implemented feature 005 distributor power observation
- implemented feature 011 tokens, components, localization and accessibility harness

Install without changing the lockfile:

```bash
pnpm install --frozen-lockfile
```

If the environment supplies browser executables instead of Playwright's pinned downloads, set
`E2E_CHROMIUM_PATH` and `E2E_FIREFOX_PATH` to those exact executables.

## Released-API regressions

1. Confirm pinned 0.1.1 closes [Almanac #300](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/300)
   with sparse post-engineering maximum/falloff range,
   projectile-boundary metadata and armour piercing with each fitted weapon.
2. Confirm feature 005 can consume the package work tracked by
   [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299) for authoritative
   distributor/power observation.
3. Confirm [Almanac #301](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/301) returns
   canonical known-slot order and preserves source order for appended unknown slots, with no local sort.
4. Rerun the
   minimal probes documented in [research.md](./research.md).

Do not implement a `fittedModuleAt()` range join or local module-power attribution; fail the
regression if the released projection is absent.

Useful audit commands:

```bash
pnpm why @elite-dangerous-almanac/core
gh issue view 299 --repo DarkSession/Elite-Dangerous-Almanac
gh issue view 300 --repo DarkSession/Elite-Dangerous-Almanac
gh issue view 301 --repo DarkSession/Elite-Dangerous-Almanac
```

## Static and unit validation

Run focused unit tests while developing:

```bash
pnpm exec ng test --include='src/app/**/*offence*.spec.ts'
```

Then run formatting, type and production-build checks:

```bash
pnpm run format:check
pnpm run typecheck
pnpm run build
```

Expected outcomes:

- package imports use leaf exports;
- no local weapon sum, damage share, falloff, piercing-factor, target, convergence, recharge, drain
  or time-to-drain formula exists;
- every projector test compares exact fields against a live package result;
- absent optional fields, zero and infinity use discriminated states rather than truthiness;
- unit coverage remains at or above 80% for statements, branches, functions and lines.

## End-to-end acceptance scenarios

Each scenario runs for desktop, tablet, mobile portrait and mobile landscape in Chromium and Firefox.
Run the feature journey with:

```bash
pnpm exec playwright test e2e/offence-profile.spec.ts
```

### 1. Read complete build output

1. Open a build with at least two enabled returned weapons.
2. Open Offence from the status headline/capability navigation.
3. Compare the visible total group with the same build revision's `weaponMetrics().total`.
4. Expand each weapon's complete facts.

Expected:

- every total and every per-weapon `WeaponMetrics` field appears exactly once with meaning/unit;
- package weapon identity, slot and enabled state are present;
- no locally calculated alpha, share, target-adjusted, range-band or convergence value appears;
- all visible numbers deep-equal their package fields after locale parsing in test helpers.

### 2. Preserve damage-type meaning

1. Open a fixture with conventional, anti-xeno and unclassified returned damage.
2. Inspect burst and sustained whole-build and weapon damage groups.

Expected:

- kinetic, thermal, explosive, absolute and anti-xeno are always present as returned;
- unclassified presence/absence matches the package object;
- anti-xeno is textually identified as an overlay;
- no percentage/share or folded total is shown; type meaning does not depend on color.

### 3. Distinguish empty, unresolved, disabled and zero

Exercise four builds: all hardpoints empty, occupied unresolved hardpoint only, all returned weapons
disabled, and an enabled genuine-zero-damage weapon.

Expected:

- only confirmed empty hardpoints receive “no fitted weapons” meaning;
- unresolved occupancy is a separate named state with no invented output;
- disabled and genuine-zero weapon entries remain visible;
- aggregate numbers always equal the package total and are never locally rebuilt.

### 4. Inspect range, piercing and ammunition

Use package fixtures covering Focused engineering, absent effective distance, absent piercing,
projectile-boundary metadata, no ammunition, finite ammunition, zero reserve and unlimited reserve.

Expected:

- effective maximum/falloff range and piercing come from the released fitted-weapon result;
- missing fields remain missing/unavailable;
- projectile boundaries are separately named and never labelled metres;
- ammunition null, finite, zero-reserve and unlimited meanings remain distinct;
- no target hardness or firing-duration calculation appears.

### 5. Reach an exact hardpoint

1. Activate the slot action on each returned weapon, including a disabled/zero weapon.
2. Return to Offence without replacing the active build.

Expected:

- feature 002 receives the exact original slot key once;
- wide layouts reveal/select the inline outfitting context;
- narrow layouts open the full-screen slot layer and provide a named return path;
- duplicate module symbols in different slots never target one another.

### 6. Change WEP pips

Apply valid WEP allocations including 0, 0.5, 2 and 4 through feature 003's shared six-pip control.

Expected:

- the result displays the package-returned WEP pips;
- all six capacitor fields equal one direct package call for each settled revision;
- weapon DPS fields do not change merely because WEP pips change;
- invalid drafts change no result and trigger no feature 007 projection.

### 7. Read finite, zero and infinite endurance

Exercise a draining load, a zero-capacity positive-draw load, a positive-draw sustaining load, an
all-disabled load and a plant-off/shed load.

Expected:

- finite seconds and immediate zero remain numeric package outcomes;
- positive-draw infinity says the powered firing load can be sustained indefinitely;
- zero-draw infinity says no draining powered firing load and does not claim weapons can fire;
- zero capacity remains visible with the independent distributor presence/enabled/powered state;
- weapon-total EPS is not forced to equal the powered capacitor draw.

### 8. Preserve one revision

Rapidly alternate a weapon edit, undo/redo and valid WEP-pip changes while Offence is open.

Expected:

- all visible weapon/capacitor/power facts share the latest build and condition revision;
- stale projections never appear beneath the new context;
- one settled change produces one concise announcement.

## Responsive, localization and accessibility validation

For populated, empty, unresolved, disabled, missing-field, unlimited, zero-capacity, infinite and
failure states:

- run the shared automated accessibility scan;
- verify no document-level horizontal scroll at every project viewport and 400% zoom;
- verify full content/action parity in portrait and landscape;
- verify every detail and slot action has at least the shared 44 CSS-pixel target and works by touch;
- verify headings, definition groups, disclosures and actions are understandable by screen reader;
- verify no type/state relies only on color, bar length, shape or position;
- switch to an expanded-text and RTL fixture and confirm wrapping/order;
- enable reduced motion and confirm no meaning or update is lost;
- switch locales and confirm application messages, numbers and units change while package game text
  uses the shared untranslated disclosure when required.

Any conformance statement must say: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1,
2.4.3, 2.4.7 and 2.4.11.”

## Full release gate

Run the repository gate:

```bash
pnpm run check
```

Expected: format, typecheck, production build, script tests, unit coverage and every Playwright
project pass. Do not skip a browser, viewport, accessibility scan or failing test.
