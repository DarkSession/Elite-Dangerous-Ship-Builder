# Screen Inventory and Requirement Mapping

Two logical route-preserving layers use wide/narrow variants of the same capability.

| Screen                            | Host/reference                             | Purpose                                                              | States                                                                                                        |
| --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Import build](./import-build.md) | Shell/build; 1a dialog, 1b/1d bottom sheet | Inspect one input, normalize detached candidate, request replacement | empty/editing/limit/checking, syntax/cardinality/diagnostic/normalization error, confirmation, success report |
| [Export build](./export-build.md) | Active build; 1c dialog, 1d bottom sheet   | Generate/deliver one package SLEF artifact independent of link       | no build/generating, valid, invalid/incomplete, link omitted, copy/download/share outcomes                    |

## Requirement coverage

| Requirement | Coverage                                                                    |
| ----------- | --------------------------------------------------------------------------- |
| FR-001      | Active-only export through one-entry `toSlefString`.                        |
| FR-002      | Export/round-trip covers all package modelled fields and completed quality. |
| FR-003      | Build metadata plus optional exact-revision feature 001 URL.                |
| FR-004      | Selectable payload/download survive copy failure; share capability-gated.   |
| FR-005      | Mandatory package source credits; no retail fallback.                       |
| FR-006      | Local import report excluded from normalized SLEF.                          |
| FR-007      | Shell/no-build import and package-supported SLEF/bare journal shapes.       |
| FR-008      | UTF-8 byte display/gate and exact observed cardinality.                     |
| FR-009      | Raw inspector boundary; no parse/repair/heuristics.                         |
| FR-010      | Detached candidate and shared confirmation before only commit.              |
| FR-011      | Semantic exact package diagnostic list.                                     |
| FR-012      | Success report covers quality/fixed/unresolved/fixed gaps.                  |
| FR-013      | Package integration corpus verifies stable second round trip.               |
| FR-014      | In-memory/browser ports; network requests rejected.                         |

```text
Import -> inspect/normalize -> confirm if needed -> active workspace + local report
Export -> immutable artifact -> copy/download/capability-gated share
```

Failure/cancel stays in host state; report data never reaches export.
