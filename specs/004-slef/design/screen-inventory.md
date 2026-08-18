# Screen Inventory and Requirement Mapping

Feature 004 adds no route. The two logical layers and associated host/result surfaces compose into
feature 001 screens. Wide dialog, narrow sheet and constrained full-height presentation are
responsive states of one surface, not separate implementations.

## Surface inventory

| Surface                                 | Host/reference                                                     | Purpose                                                                                                                                  | Required states                                                                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Import Build layer](./import-build.md) | `/ships`, `/ships/:symbol`, `/build`, `/builds`; canvases 1a/1b/1d | Accept exact text, inspect one entry and produce a detached normalized candidate                                                         | empty, editing, over limit, inspecting, syntax, zero/multiple/mixed, diagnostic, unknown hull/construction, normalization unsupported/correlation/package failure, candidate ready, awaiting replacement, cancelled/superseded, committed transition |
| Shared replacement confirmation         | Feature 001 overlay within any import host                         | Decide whether a ready candidate may replace dirty active work                                                                           | not required, awaiting decision, cancel, accept, stale candidate                                                                                                                                                                                     |
| [Import Outcome](./import-outcome.md)   | `/build` workspace after accepted commit                           | Disclose package identity changes and final validation after the input layer closes, without retaining unknown identities in build state | no changes, unknown emptied/defaulted, quality completed, fixed restored/repaired, default unavailable/incomplete, invalid, combined, dismissed, revision changed                                                                                    |
| Export-unavailable host state           | `/build` without active build                                      | Explain why export cannot open and provide Import/Create recovery                                                                        | no build, import available, create/select available, persistence failure independent                                                                                                                                                                 |
| [Export Build layer](./export-build.md) | Active `/build`; canvases 1c/1d                                    | Host feature 001 Share Link plus feature 004 SLEF artifact/delivery                                                                      | mode selection, generating, ready valid, ready invalid/incomplete, link included/omitted, revision invalidated, copy states, download dispatched/setup failed, share hidden/file/text/working/shared/cancelled/failed                                |

Successful import from `/ships`, `/ships/:symbol` or `/builds` navigates to `/build` only after the
shared coordinator commits. Open/close/failure/cancel preserves the current host route/history.

## Requirement coverage

| Requirement | Surface/state                                                | Contract evidence                                                                                                    |
| ----------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Export-unavailable host; Export layer generating/ready       | Active snapshot required; package one-entry serializer only                                                          |
| FR-002      | Import candidate/outcome; Export ready and round trip        | Package-modelled hull/module/engineering/power/name/ident state plus completed quality and package-derived integrity |
| FR-003      | Export ready link included/omitted                           | Build-time producer metadata; only feature 001 exact-revision canonical link qualifies                               |
| FR-004      | Export copy/download/share states                            | Selectable payload and Download always remain; Share capability-gated; failure preserves artifact                    |
| FR-005      | Import candidate; Export ready                               | Default package current-retail export; captured purchase values are not application state                            |
| FR-006      | Import Outcome and Export ready                              | Source-empty fixed provenance is visible/local metadata but excluded from modelled snapshot/link/SLEF                |
| FR-007      | Import layer in no-build ship/workspace hosts                | Raw SLEF or bare journal accepted without hull selection/active build                                                |
| FR-008      | Import over-limit and cardinality states                     | UTF-8 byte-first gate; exactly one observed top-level entry                                                          |
| FR-009      | Import inspecting/syntax/diagnostic states                   | Exact string enters `inspectSlef`; no app parser/repair/heuristic                                                    |
| FR-010      | Import candidate, shared confirmation, refusal/cancel/commit | Full detached ingress before feature 001's only replacement transition                                               |
| FR-011      | Import diagnostic list                                       | Exact index/path/code/constraint/params retained; package locale presenter owns text                                 |
| FR-012      | Import Outcome                                               | Identity/quality/fixed/default-unavailable/final validation disclosed after commit                                   |
| FR-013      | Import candidate/outcome; Export round-trip states           | Package model comparison after quality and identity/fixed-mount normalizations plus package output normalization     |
| FR-014      | Both layers and mocked delivery states                       | Installed/browser-only processing; unexpected requests fail; share only explicit user handoff                        |

## Capability flow

```text
Host Import intent
  -> Import Build layer
  -> detached inspect/normalize candidate
  -> feature 001 replacement confirmation when dirty
  -> one commit -> /build + Import Outcome

Active /build Export intent
  -> shared Export Build layer
       ├── Share Link mode (feature 001)
       └── SLEF mode (feature 004)
            -> one revision-bound artifact
            -> selectable text / Download / Copy / capability-gated Share
```

Failure, cancel and supersession remain in the host state. Import outcome/provenance never reaches
the SLEF artifact.

## Shared verification

Every row/state has feature 011 UI preview declarations at desktop, tablet and mobile widths. Product
journeys run across the ten Chromium/Firefox size-orientation projects with axe and semantic,
target-size, overflow, expansion, RTL, 200%-text and reduced-motion assertions. Actual 400% zoom and
the shared screen-reader scripts remain manual recorded gates.
