# Quickstart: Validate Defence Profile

This guide validates feature 006 end to end. It is not an implementation guide. Field/intent
contracts are in [contracts/](./contracts/), the state model is in
[data-model.md](./data-model.md), and surfaces are mapped in
[design/screen-inventory.md](./design/screen-inventory.md).

## 1. Prerequisites and released regressions

Use Node.js from `.nvmrc`, pnpm from `packageManager` and the committed lockfile:

```bash
nvm use
pnpm install --frozen-lockfile
```

Before implementation or acceptance, confirm:

- [Almanac #296](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/296) is pinned in 0.1.1
  and shed generators return structured unavailable shield/recovery results;
- [Almanac #297](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/297) is pinned in 0.1.1
  and unknown hulls are rejected during construction;
- both minimal reproductions pass;
- feature 001 supplies the active build/revision and `/build` workspace;
- feature 002 supplies exact-slot selection;
- feature 003 supplies one atomic valid pip condition/revision;
- feature 011 supplies tokens/components, localization, the ten-project dual-engine matrix and
  automated accessibility scans.

Expected: there is no local power/availability override, hull fallback, resistance/EHP/recovery
formula, aggregate apportionment or copied game catalogue. If either regression fails, stop.

## 2. Run focused automated tests

During development, run the relevant unit and browser journeys:

```bash
pnpm test -- --include 'src/app/domain/defence/**/*.spec.ts' --include 'src/app/application/defence/**/*.spec.ts'
pnpm exec playwright test e2e/defence-profile.spec.ts
```

Expected: projector tests compare every field directly with the real package result; store tests
prove revision coherence; browser tests execute all configured Chromium/Firefox viewport/orientation
projects and accessibility scans.

## 3. Validate shield strength and SYS pips

1. Open a package-backed build with generator, multiple boosters and shield reinforcement.
2. Open Defence Profile from feature 003's defence headline.
3. Confirm the shared default SYS-pip condition and compare `strength`, `generator`, `boosters`,
   `reinforcement`, both multipliers and `systemsResistance` with the completed
   `shieldMetricsResult({ systemsPips })` value.
4. Compare all kinetic, thermal, explosive and caustic resistance/EHP pairs.
5. Apply valid zero, fractional and four-pip allocations through feature 003 and repeat.

Expected: every value equals its same-revision package field. Strength/contributions are never
recomputed; pips enter no build edit, history, storage, URL or SLEF.

## 4. Validate shield availability and generator state

Use package-backed fixtures for missing, explicitly disabled, power-shed, powered and unresolved
generator contexts.

Expected:

- missing and disabled are distinct where fitted state establishes them;
- the released #296 behavior gives a shed generator unavailable shield/recovery with structured power context;
- an unknown draw produces indeterminate/qualified state rather than a conclusive verdict;
- a package null/unavailable result has no zero/catalogue substitute;
- armour remains complete and usable in every shield state.

## 5. Validate recovery and non-finite meanings

1. Compare `regenRate`, `brokenRegenRate`, `recoveryTime` and `regenTime` independently with the
   completed `shieldRecoveryResult({ systemsPips })` value.
2. Repeat across valid pip allocations.
3. Exercise a phase that cannot reach the recovery threshold, one that cannot regenerate to full,
   and finite/zero fields.

Expected: both rates remain distinct; each infinite duration receives its own localized meaning;
finite zero remains numeric zero. No raw/clamped/substituted infinity appears.

## 6. Validate cell banks

Use fixtures for no banks, multiple powered banks, mixed powered/unpowered banks, all banks unpowered
and an unknown bank draw.

For every fitted bank compare slot, symbol, reinforcement, cells, spin-up, duration, heat and powered
state with `cellBanks().banks`; compare both totals directly.

Expected: no banks has a dedicated empty state. An all-unpowered fitted list remains visible beside
zero package totals. Unknown draw receives qualification without changing a verdict/total. Each bank
action reveals the exact returned slot in one interaction.

## 7. Validate armour, hardness and module protection

1. Open a known hull with a non-stock bulkhead plus hull and module reinforcements.
2. Compare hit points, bulkhead/reinforcement aggregates, all four resistance/EHP pairs,
   `moduleArmour` and `moduleProtection` with `armourMetrics()`.
3. Compare hardness with the exact `Ship.hardness` record.
4. Confirm hardness explains the armour-piercing comparison without generating a matchup.
5. Remove/disable shields and repeat the armour checks.

Expected: module armour/protection remain distinct from hull hit points; aggregate contributions are
not divided among sources; exact actual fitted source slots open through feature 002.

## 8. Validate unknown-hull rejection and semantic numeric states

Rerun #297's unknown-hull reproductions with pinned 0.1.1, then exercise negative resistance,
finite/zero EHP and unbounded EHP presentation-boundary cases.

Expected: the package rejects the unknown hull before active-build replacement. The application does
not recognize/discard zeros itself. Negative values stay signed; zero,
unavailable and unbounded remain separate.

## 9. Validate sources and exact-slot targeting

Use a build containing generator, duplicate boosters, shield reinforcement, bulkhead, duplicate hull
reinforcement and module reinforcement.

1. Compare each shown role/slot/symbol with the same-revision fitted package snapshots.
2. Confirm unresolved modules are not classified by name or symbol prefix.
3. Activate every source once at wide and narrow layouts.

Expected: each recognized fitted source appears independently, every action delivers its exact
original slot key and no row carries a locally allocated share of an aggregate.

## 10. Validate revision coherence and performance

1. Trigger rapid module edits through feature 002 while applying valid SYS-pip changes.
2. Observe build/condition revisions through the presenter test seam.
3. Measure from committed revision to matching revision-marked DOM with in-page
   `performance.now()`/`MutationObserver` at mobile Chromium under 4x CPU slowdown.

Expected: one settled revision publishes one whole snapshot, shield/recovery share pips, old values
are never relabelled and matching DOM arrives within 100 ms. Firefox runs the equivalent functional
case without Chromium-only CDP throttling.

## 11. Validate responsive and accessible behavior

Run the three primary stories and every meaningful state at:

- Chromium and Firefox desktop, 1440x900;
- Chromium and Firefox tablet portrait/landscape, 834x1112 and 1112x834;
- Chromium and Firefox mobile portrait/landscape, 390x844 and 844x390.

For every ready, empty, unavailable, qualified, negative, zero, non-finite and error state:

- run `@axe-core/playwright` and fail every in-scope violation;
- verify semantic headings, definitions/tables/cards and role/name/state relationships;
- verify complete text equivalents for every supplemental visual;
- verify contextual slot-action names and 44 CSS-pixel touch targets;
- verify touch/pointer interaction, both orientations and no document horizontal overflow;
- verify 200% text, 400% zoom, expanded/RTL text and reduced motion;
- verify coalesced live announcements and complete the three stories with a screen reader.

Expected: the complete capability works at every size/engine. If conformance is described, name the
exclusions: WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.

## 12. Validate localization and source boundaries

Switch every shipped locale and use expanded/RTL fixtures.

Expected:

- every application label, state, qualification and sentinel phrase uses feature 011 messages with
  bundled English fallback;
- MJ, MJ/s, percentages, multipliers, counts, heat and durations use active-locale formatting;
- hull/module game text comes from Almanac with canonical-language disclosure when needed;
- no raw key, blank placeholder, private game translation or application-authored game diagnosis
  reaches the screen;
- production imports use package leaf paths.

## 13. Run the complete gate

```bash
pnpm run check
```

Expected: formatting, strict type checking, static build, script tests, unit tests at or above 80%
statements/branches/functions/lines and the full dual-engine Playwright/accessibility matrix pass
with no skipped or quarantined case.
