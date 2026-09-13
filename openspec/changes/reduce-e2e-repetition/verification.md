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
