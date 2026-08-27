# Import Outcome

## Divergence

**The design canvas draws no import-outcome surface, so this feature builds none.**

The reference review found `imp-modal`, `simp-modal`, `mimp-modal`, `exp-modal` and `mexp-modal` on
`.design/Ship Builder.dc.html`, and nothing else for feature 004. There is no drawn panel, banner,
notice or region that reports what an accepted import did. What such a surface would have said is
already drawn twice over, by screens that exist:

- **the package verdict, issue by issue** — feature 003's build-status rail, which renders the
  package's own validation issues for whatever build is active, permanently, and confirms a build it
  raises none about;
- **the build itself** — the ledger, the anatomy and every figure the workspace draws, all of them
  reading the candidate ingress normalized before it was activated.

Neither cares where the build came from, which is the point: an imported build is a build. Adding a
third surface beside them would have said the same fact twice on the same screen, and would have been
an addition beside the design rather than the design.

So feature 004 publishes no report of its own. There is no `SlefImportOutcome`, no `importOutcome`
state, no `slef.outcome.*` message and no feature-004 component under
`src/app/features/slef/import-outcome/`.

The quality completions still travel to feature 001 as ordinary `qualityNotices` on the candidate,
and nothing renders them: the notice that named them was withdrawn on 2026-08-27, because what the
package completed on a build a Commander now has open is a remark rather than a decision they are
being asked to take.

FR-006, FR-010, FR-012, FR-013 and SC-002 are unchanged as requirements; only the surface that
evidences them changed. They are registered in `e2e/coverage-ledger.ts` under
`build/slef-import-aftermath`, whose assertions name the reused surfaces and require that each fact
appear exactly once.

`specs/004-slef/spec.md` and `specs/004-slef/design/screen-inventory.md` were updated to match: the
design wins.

## What the reused surfaces must show, after an import

| Situation                   | Where it is read                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| No modelled normalization   | The workspace draws the build, and the rail confirms it where the package raises nothing |
| Quality completed           | Nothing is said about the completion; the build's own figures already carry it           |
| Retained incomplete/invalid | Feature 003's build-status rail, the package's own issues in the package's own words     |
| Revision changed            | The rail follows the build, because it reads the build rather than a stamped copy of it  |
| Import refused              | Nothing changes anywhere: no rail change, no build (FR-010)                              |

Nothing here is new behaviour. The rail already does it for feature 002's own edits; feature 004 adds
no state and no presentation, only a build for it to describe.

## What never leaves the session

Quality completion is transient and unrendered. Feature 001 independently persists the accepted revision's
`valid`/`complete` booleans; nothing about a completion enters `BuildSnapshotV1`, the build link, a
SLEF payload or edit history. The export payload assertions in
`src/app/application/slef/slef-export-artifact.spec.ts` hold that line.
