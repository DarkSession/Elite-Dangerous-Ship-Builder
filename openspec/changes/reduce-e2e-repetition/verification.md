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
