## Timing baseline

Reports use Playwright 1.62.1, eight workers for regular and production tests, and one worker for timing tests.
All ten layout and engine projects run without sharding or retries.
Timing tests run separately from the other browser suites.

| Suite      | Executions passed | Elapsed seconds | Summed attempt seconds | Axe scans | Axe seconds |
| ---------- | ----------------: | --------------: | ---------------------: | --------: | ----------: |
| Regular    |             7,440 |         1,342.2 |               10,476.9 |     1,046 |     1,079.5 |
| Timing     |                 2 |            14.2 |                    4.9 |         0 |         0.0 |
| Production |               720 |           184.2 |                1,310.1 |        40 |        40.4 |

All 8,162 selected executions complete with no failures, flakes, skips or run errors.
Elapsed values come from Playwright reports; they exclude preparatory package-script work outside Playwright.
The regular suite's 4,918 named stock-build steps take 1,938.2 summed seconds.
Those steps account for 18.5% of attempt time; axe scans account for 10.3%.
These categories omit other navigation, fixture and assertion work.
The report does not establish how often an earlier task repeated its full gate.

The slowest regular case takes about 25 seconds in four Chromium touch projects.
It is the repeated undo journey in `outfitting-history.spec.ts`.
That journey exercises 12 decisions through browser controls.
The exact 100-decision boundary is tested in the existing domain and application unit suites.

Commands:

```sh
E2E_JSON_REPORT=dist/verification/baseline-regular.json pnpm run e2e
E2E_JSON_REPORT=dist/verification/baseline-timing.json pnpm run e2e:timing
E2E_JSON_REPORT=dist/verification/baseline-production.json pnpm run e2e:offline
pnpm run e2e:summary dist/verification/baseline-regular.json dist/verification/baseline-timing.json dist/verification/baseline-production.json
```

Raw reports and logs stay under the ignored `dist/verification/` directory.
Report aggregation has four passing script tests, including retry accounting and incomplete-run exit status.
TypeScript, formatting and repository policy checks pass for the reporting changes.

## Assertion destinations

The original case names remain as named steps within these tests.
Each step keeps its assertions and uses the same prepared state.

| File                         | Owning test                                                         | Named steps |
| ---------------------------- | ------------------------------------------------------------------- | ----------: |
| `power-and-heat.spec.ts`     | states power groups and the labelled module totals                  |           3 |
| `power-and-heat.spec.ts`     | states the plant, bar and read-only controls                        |           3 |
| `cost-and-materials.spec.ts` | states package costs with labels and native relationships           |           3 |
| `cost-and-materials.spec.ts` | states the complete ordered material list and its totals            |           4 |
| `hull-anatomy.spec.ts`       | draws package geometry and names hardpoints and utilities           |           3 |
| `hull-anatomy.spec.ts`       | limits schematic content to located mounts and the declared legend  |           3 |
| `defence.spec.ts`            | identifies defence pools, damage readings and their sources         |           3 |
| `defence.spec.ts`            | states armour protection and shield recovery facts                  |           2 |
| `defence.spec.ts`            | states matching shield and hull figures without controls            |           2 |
| `offence-profile.spec.ts`    | states weapon totals, their count and range bands                   |           3 |
| `offence-profile.spec.ts`    | names every damage segment in one complete legend                   |           3 |
| `offence-profile.spec.ts`    | states matching sustained damage without controls or qualification  |           2 |
| `slef-export.spec.ts`        | offers a selectable SLEF payload with metadata and delivery actions |           4 |

Cross-route announcement assertions belong to the existing structural test for each of the four screens.
The three outlet assertions execute on every screen in every project.
Entry-point semantics and control names share one load in `interface-foundations.spec.ts`.
Its ship-tool tests open the shipyard directly because they inspect no entry-point content.

A TypeScript syntax-tree comparison preserves all 810 `expect` calls across the eight files.
The comparison ignores formatting and checks expression structure and literal values.
The six capability files retain all 779 of their `expect` calls.
The step 3 regular selection contains 717 cases per project, with 7,170 executions across the same ten projects.

The eight affected suites pass all 2,150 executions across ten projects in 6.9 minutes.
TypeScript, formatting and repository policy checks pass.

## Accessibility scan ownership

| Rendered state                       | Owning test                                                                                           | Retained evidence                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Stock build with no history          | `outfitting-history.spec.ts`: is offered as disabled rather than hidden at either end                 | Visible disabled undo and redo, full accessibility sweep |
| Stock build with CargoHatch selected | `outfitting-accessibility.spec.ts`: states cargo-hatch refusal and unavailable engineering accessibly | Visible refusal reason, full accessibility sweep         |

Each owner uses the same stock hull, route and selected mount as the equivalent scans.
The disabled-control assertions do not change the rendered state.
The cargo-hatch refusal and unavailable engineering appear together in one state.
The owners run in all ten projects without scan caching.
Distinct overlays, edited builds, locales, text scales and layout conditions retain their scans.
The consolidation removes two repeated scans and two test setups per project.

Both affected suites pass all 310 executions across ten projects in 1.8 minutes.
TypeScript, formatting and repository policy checks pass.

## Test placement and viewport review

Domain boundary cases remain in unit tests beside their source.
The history store and application tests cover the exact 100-decision retention boundary.
The browser history test retains its 12-decision journey to verify rendered controls and restored state.
Static browser assertions share setup where their route, build and selection match.
Primary journeys, browser geometry, touch interactions and rendered accessibility remain browser tests.

The viewport review identifies 42 explicit viewport sites across 17 files.
Two context factories inherit their viewport; 40 sites select fixed conditions.

| File                               | Sites |
| ---------------------------------- | ----: |
| `cost-and-materials.spec.ts`       |     1 |
| `defence.spec.ts`                  |     1 |
| `design-reference.spec.ts`         |     3 |
| `help-and-licences.spec.ts`        |     1 |
| `hull-anatomy.spec.ts`             |     5 |
| `interface-conformance.spec.ts`    |     1 |
| `mobility-and-jump.spec.ts`        |     2 |
| `module-engineering.spec.ts`       |     7 |
| `module-outfitting.spec.ts`        |     1 |
| `offence-profile.spec.ts`          |     4 |
| `outfitting-accessibility.spec.ts` |     1 |
| `outfitting-families.spec.ts`      |     5 |
| `outfitting-responsive.spec.ts`    |     5 |
| `power-and-heat.spec.ts`           |     1 |
| `prerendered-first-frame.spec.ts`  |     1 |
| `reflow.spec.ts`                   |     2 |
| `ship-status.spec.ts`              |     1 |

Fixed conditions include 320-pixel reflow, panel breakpoints, wide engineering benches and selected mobile layouts.
The family locale context inherits the project viewport and touch setting.
The first-frame context inherits the page viewport and permits explicit context options.
Fixed widths do not establish coverage at the original project width.
Input settings can still differ between projects at the same width.

All project assignments remain in place.
A narrower assignment requires a separate accepted change that identifies each condition and preserves every primary journey across the required matrix.
The README states how to choose the verification layer and assign scan ownership.
OpenSpec apply guidance uses targeted checks during fixes and requires the full merge gate after the final code fix.

Regular discovery selects 7,150 executions across ten projects in 43 files.
Repository policy checks pass for the retained matrix and coverage ledger.

## Complete verification

`pnpm run check` passes, including formatting, generated artifacts, TypeScript, both builds, policies, codec capacity, script tests, unit coverage and all browser suites.
The run passes 598 script tests and 3,228 unit tests across 226 files.
Coverage is 93.50% statements, 86.36% branches, 94.52% functions and 93.37% lines.

| Browser suite | Passed executions | Reported elapsed time |
| ------------- | ----------------: | --------------------: |
| Regular       |             7,150 |          22.2 minutes |
| Timing        |                 2 |          14.5 seconds |
| Production    |               720 |           3.1 minutes |

All 7,872 browser executions pass without failures, retries or skips.
The complete log is local at `dist/verification/check.log`.
All ten regular projects remain, with 290 fewer executions than the baseline.
The scan ownership changes remove 20 repeated scans across those projects.

The regular baseline takes 22.4 minutes; the final regular run takes 22.2 minutes.
These single local runs do not establish a stable speedup.
The affected step 3 files consume 3,133.3 summed attempt seconds, compared with 3,321.9 in the baseline selection.
The affected step 4 files consume 721.6 summed attempt seconds, compared with 737.8 in the baseline selection.
Targeted selections and full suites have different scheduling, so these comparisons describe observed work rather than guaranteed elapsed savings.

The main workflow saving comes from limiting intermediate checks to the failing test and affected capability.
The complete merge gate remains required after the final code fix.
