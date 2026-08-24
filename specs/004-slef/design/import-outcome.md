# Import Outcome

## Divergence

**The design canvas draws no import-outcome surface, so this feature builds none.**

The reference review found `imp-modal`, `simp-modal`, `mimp-modal`, `exp-modal` and `mexp-modal` on
`.design/Ship Builder.dc.html`, and nothing else for feature 004. There is no drawn panel, banner,
notice or region that reports what an accepted import did. What such a surface would have said is
already drawn twice over, by screens that exist:

- **the completed partial rolls** — feature 002's quality-completion notice in the build workspace,
  which reads `ActiveBuildStore.qualityCompletionNotices`, is bound to the active revision and is
  dismissible;
- **the package verdict, issue by issue** — feature 003's build-status rail, which renders the
  package's own validation issues for whatever build is active, permanently.

Neither cares where the build came from, which is the point: an imported build is a build. Adding a
third surface beside them would have said the same fact twice on the same screen, and would have been
an addition beside the design rather than the design.

So the import path hands its quality completions to feature 001 as ordinary `qualityNotices` on the
candidate, and feature 004 publishes no report of its own. There is no `SlefImportOutcome`, no
`importOutcome` state, no `slef.outcome.*` message and no feature-004 component under
`src/app/features/slef/import-outcome/`.

FR-006, FR-010, FR-012, FR-013 and SC-002 are unchanged as requirements; only the surface that
evidences them changed. They are registered in `e2e/coverage-ledger.ts` under
`build/slef-import-aftermath`, whose assertions name the two reused surfaces and require that each
fact appear exactly once.

`specs/004-slef/spec.md` and `specs/004-slef/design/screen-inventory.md` were updated to match: the
design wins.

## What the two reused surfaces must show, after an import

| Situation                   | Where it is read                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| No modelled normalization   | Nothing new. The workspace draws the build; no empty notice and no all-clear line         |
| Quality completed           | Feature 002's completion notice, one row per source partial normalized to quality 1       |
| Retained incomplete/invalid | Feature 003's build-status rail, the package's own issues in the package's own words      |
| Combined                    | Both, in their own regions on their own screens — never merged into one status            |
| Dismissed                   | The completion notice's own dismissal; build, revision, dirty state and history unchanged |
| Revision changed            | The completion notice retires with the revision it described; the rail follows the build  |
| Import refused              | Nothing changes anywhere: no notice, no rail change, no build (FR-010)                    |

Nothing here is new behaviour. Both surfaces already do it for feature 002's own edits; feature 004
adds no state and no presentation, only a build for them to describe.

## What never leaves the session

Quality completion is transient. Feature 001 independently persists the accepted revision's
`valid`/`complete` booleans; nothing about a completion enters `BuildSnapshotV1`, the build link, a
SLEF payload or edit history. The export payload assertions in
`src/app/application/slef/slef-export-artifact.spec.ts` hold that line.
