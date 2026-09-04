# Screen Inventory and Requirement Mapping

Feature 004 adds no route. The two logical layers and associated host/result surfaces compose into
feature 001 screens. Wide dialog, narrow sheet and constrained full-height presentation are
responsive states of one surface, not separate implementations.

## Surface inventory

| Surface                                 | Host/reference                                                             | Purpose                                                                                                                                       | Required states                                                                                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Import Build layer](./import-build.md) | `/ships`, `/ships/:hull`, `/outfitting`, `/builds`; canvases 1a/1b/1d      | Accept exact text, inspect one entry and produce a detached normalized candidate                                                              | empty, editing, over limit, inspecting, syntax, zero/multiple/mixed, diagnostic, unknown hull/construction, normalization unsupported/correlation/package failure, candidate ready, awaiting replacement, cancelled/superseded, committed transition |
| Shared replacement confirmation         | Feature 001 overlay within any import host                                 | Decide whether a ready candidate may replace dirty active work                                                                                | not required, awaiting decision, cancel, accept, stale candidate                                                                                                                                                                                     |
| [Import aftermath](./import-outcome.md) | Feature 003's build-status rail and the workspace itself, on `/outfitting` | Disclose the package verdict after the input layer closes — through the surfaces that already draw it; the canvas draws no feature-004 report | no changes, valid, invalid, revision changed                                                                                                                                                                                                         |
| Export-unavailable host state           | `/outfitting` without active build                                         | Explain why export cannot open and provide Import/Create recovery                                                                             | no build, import available, create/select available, persistence failure independent                                                                                                                                                                 |
| [Export Build layer](./export-build.md) | Active `/outfitting`; canvases 1c/1d                                       | Host feature 001 Share Link plus feature 004 SLEF artifact/delivery                                                                           | mode selection, generating, ready valid, ready invalid/incomplete, link included/omitted, revision invalidated, copy states, download dispatched/setup failed, share hidden/file/text/working/shared/cancelled/failed                                |

Successful import from `/ships`, `/ships/:hull` or `/builds` navigates to `/outfitting` only after the
shared coordinator commits. Open/close/failure/cancel preserves the current host route/history.

## Requirement coverage

| Requirement | Surface/state                                                | Contract evidence                                                                                                             |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Export-unavailable host; Export layer generating/ready       | Active snapshot required; package one-entry serializer only                                                                   |
| FR-002      | Import candidate/aftermath; Export ready and round trip      | Package-modelled hull/module/engineering/power/name/ident state plus completed quality and package-derived integrity          |
| FR-003      | Export ready link included/omitted                           | Build-time producer metadata; only feature 001 exact-revision canonical link qualifies                                        |
| FR-004      | Export copy/download/share states                            | Selectable payload and Download always remain; Share capability-gated; failure preserves artifact                             |
| FR-005      | Import candidate; Export ready                               | Default package current-retail export; captured purchase values are not application state                                     |
| FR-006      | Import aftermath and Export ready                            | Package-returned fixed state is modelled directly with no application provenance                                              |
| FR-007      | Import layer in no-build ship/workspace hosts                | Raw SLEF or bare journal accepted without hull selection/active build                                                         |
| FR-008      | Import over-limit and cardinality states                     | UTF-8 byte-first gate; exactly one observed top-level entry                                                                   |
| FR-009      | Import inspecting/syntax/diagnostic states                   | Exact string enters `inspectSlef`; no app parser/repair/heuristic                                                             |
| FR-010      | Import candidate, shared confirmation, refusal/cancel/commit | Full detached ingress before feature 001's only replacement transition                                                        |
| FR-011      | Import diagnostic list                                       | Exact index/path/code/constraint/params retained; package locale presenter owns text                                          |
| FR-012      | Import aftermath                                             | Quality disclosed by feature 002's completion notice, the verdict by feature 003's rail, each exactly once                    |
| FR-013      | Import candidate/aftermath; Export round-trip states         | Package model comparison after quality completion and package-populated fixed construction, plus package output normalization |
| FR-014      | Both layers and mocked delivery states                       | Installed/browser-only processing; unexpected requests fail; share only explicit user handoff                                 |

## Capability flow

```text
Host Import intent
  -> Import Build layer
  -> detached inspect/normalize candidate
  -> feature 001 replacement confirmation when dirty
  -> one commit -> /outfitting; feature 002's completion notice and feature 003's rail
                    describe the build that arrived (no feature-004 report)

Active /outfitting Export intent
  -> shared Export Build layer
       ├── SLEF mode (feature 004) — listed first and opened on, as `.design` draws it
       │    -> one revision-bound artifact
       │    -> selectable text / Download / Copy / capability-gated Share
       └── Share Link mode (feature 001)
```

Failure, cancel and supersession remain in the host state. Import provenance never reaches the SLEF
artifact.

Feature 004 draws no import report of its own: the canvas has none, and both facts one would have
carried are already drawn by feature 002 and feature 003. See
[Import Outcome](./import-outcome.md), "Divergence".

## Shared verification

Every row/state has feature 011 UI preview declarations at desktop, tablet and mobile widths. Product
journeys run across the ten Chromium/Firefox size-orientation projects with axe and semantic,
target-size, overflow, expansion, RTL, 200%-text and reduced-motion assertions. Actual 400% zoom and
the shared screen-reader scripts remain manual recorded gates.
