## Why

Repeated browser setup and accessibility scans increase the cost of checking small changes.
The suite needs timing evidence and explicit ownership of each check.

## What Changes

- Document targeted development runs and the complete merge gate.
- Save machine-readable timing results and concise failure summaries.
- Combine related assertions that use the same prepared state.
- Assign accessibility scans to named states and combine repeated state visits where equivalent.
- Review test placement and fixed viewport overrides against the required matrix.

## Capabilities

### New Capabilities

None. This change concerns verification tooling.

### Modified Capabilities

None. Product requirements, primary journeys and accessibility coverage remain in force.
The change declares `skip_specs: true` because it changes no capability behaviour.

## Impact

The affected files are test tooling, contributor instructions, Playwright tests and the coverage ledger.
No dependency, product interface, game calculation or persisted format changes.
Each recommendation has a separate commit and push after its verification.
