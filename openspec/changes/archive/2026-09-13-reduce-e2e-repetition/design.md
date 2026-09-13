## Context

The regular suite runs each case across ten projects. Generated help artifacts affect its discovered case count.
Production and timing run separately.
The constitution requires primary journeys in all ten projects and accessibility checks over every relevant state.
This change introduces no screens. It retains their present layout, interaction and manual verification requirements.

## Goals / Non-Goals

The goal is less repeated work with traceable evidence for each retained assertion.
Changing timeouts, weakening assertions, accepting flakes and reducing primary-journey coverage are outside this change.

## Decisions

### Targeted development runs

Contributor instructions use a file, test title and project to reproduce a failure.
The affected capability runs across all ten projects after a fix.
The complete `pnpm run check` remains the merge gate.
Apply guidance uses affected checks during review fixes and requires the complete gate after the final code fix.
Verification-record edits require formatting and specification policy checks rather than another browser run.
Full-suite output goes to a local file; contributors read summaries and relevant failures.

### Timing evidence

Use Playwright's JSON report and named steps for setup and accessibility work.
A local summary separates elapsed time from summed execution time and retry time.
It lists slow tests and failures by project without printing every successful test.
Reports remain ignored local artifacts; committed evidence contains aggregate figures and test identifiers only.
Run the complete regular, timing and production suites for a baseline before consolidation.
Treat incomplete runs as incomplete evidence, never as successful baselines.

### Related assertions

Combine static assertions that inspect the same prepared state into named steps within one test.
Start with the power status rail and cross-route conformance checks, then use measured costs to select other equivalent groups.
Keep state-changing journeys separate unless their sequence is itself the behaviour being tested.
Keep all assertions and record their destination in the verification notes.
Shared mutable pages across tests are unsuitable because failures would affect unrelated tests.

### Accessibility ownership

Record the owner of each consolidated scan in the coverage ledger or verification notes.
A state includes its route, open layer, selected mode, locale, text scale and effective viewport.
Only equivalent states qualify for consolidation; different overlays and conditions retain separate scans.
Named steps retain scan duration and failure labels.
Do not cache a scan result across tests or infer accessibility from a different rendered state.

### Placement and viewport review

Record fixed viewport overrides and detailed presentation checks with their required evidence.
Keep browser geometry in Playwright and domain calculations in their existing unit suites.
Retain the ten projects, including touch and pointer differences, unless a separate accepted specification permits another assignment.
The review records cases that need such a specification instead of silently dropping executions.

## Risks / Trade-offs

- Larger tests repeat more work on failure. Keep each combined test limited to one state and related assertions.
- Scan consolidation can hide a distinct state. Record equivalence and retain all named assertions before removing repeated setup.
- Machine contention affects timings. Record workers, suite completeness and commands with each measurement.
- A baseline can reveal unrelated failures. Diagnose each failure with a targeted run and record unresolved causes explicitly.

## Migration Plan

Each of the five steps has a separate commit and push after verification.
Test discovery and policy checks verify the retained matrix and coverage record.
Affected browser suites run across all ten projects after consolidation.
Run `pnpm run check` and the independent implementation review before reporting completion.
Each tooling commit can be reverted without a product migration.
