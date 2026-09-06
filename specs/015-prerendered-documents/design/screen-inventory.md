# Screen inventory and requirement mapping

**Feature**: 015 | **Date**: 2026-09-06 | **Plan**: [plan.md](./plan.md)

Constitution IX requires that every requirement land on a screen and every screen
justify itself against a requirement, before tasks are broken down. This feature
adds **no screen and no component** — it changes when three existing screens are
rendered — so this inventory is unusual in two ways, and both are stated rather
than left implicit:

1. The screens are existing ones. Each entry records what it composes and the
   states it must handle **in the new first-frame condition**, not from scratch.
   [first-frame.md](./first-frame.md) is the per-screen design; this is the
   mapping.
2. Several requirements land on the **build and its gates** rather than on a
   screen. A requirement about which file a document is written to has no pixels.
   Those are mapped to their artifact below, in the second table, so that no
   requirement is unaccounted for.

## Screens in scope

Three, all existing. None is added, removed or re-composed.

| Screen         | Route          | Design system pieces it composes                                                                                         | Requirements it satisfies                                                               |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Start page     | `/`            | Shell (tool bar, banner), tool selector cards, attribution band                                                          | FR-001, FR-005, FR-008, FR-009, FR-010, FR-011, FR-012, FR-019                          |
| Hull catalogue | `/ships`       | Shell, responsive catalogue view (table `medium-up`, cards below), filter and sort controls, inspector rail at `wide-up` | FR-001, FR-003, FR-004, FR-005, FR-008, FR-009, FR-009a, FR-010, FR-011, FR-012, FR-019 |
| Hull detail    | `/ships/:hull` | Shell, catalogue behind, hull inspector (rail at `wide-up`, sheet below), hull illustration                              | FR-001, FR-002, FR-004, FR-005, FR-008, FR-009, FR-010, FR-011, FR-012, FR-016, FR-019  |

**Screens explicitly out of scope, and why**: `/outfitting` and `/equipment` are
advertised addresses but not content-bearing — a bench states nothing until a
Commander acts (spec Clarifications, FR-018). They keep today's behaviour, today's
head and today's first frame, and this feature touches neither.

## States each screen must handle

The states are new; the screens are not. Every one of these is a state a screen
could not previously be in, because before this feature the first frame was always
an empty `<app-root>`.

| State                                    | Start page | Catalogue | Hull detail | Held by        |
| ---------------------------------------- | ---------- | --------- | ----------- | -------------- |
| Generated document, no script ever runs  | yes        | yes       | yes         | FR-001, SC-001 |
| Generated document, before takeover      | yes        | yes       | yes         | FR-008, SC-004 |
| Takeover in progress                     | yes        | yes       | yes         | FR-009, SC-003 |
| Takeover applies the committed locale    | yes        | yes       | yes         | FR-011         |
| Takeover applies a stored catalogue view | n/a        | yes       | n/a         | FR-009a        |
| Takeover never completes                 | yes        | yes       | yes         | FR-012         |
| Cached shell, offline                    | yes        | yes       | yes         | FR-013, FR-014 |
| No generated document for this address   | n/a        | n/a       | yes         | FR-015, FR-016 |

Each screen's version of these states, and what the takeover may and may not
change in each, is [first-frame.md](./first-frame.md). The composition question —
why one document is correct at every viewport — is answered there once for all
three, because the answer is the same and structural.

## Requirements that land on the build rather than on a screen

Constitution IX asks that every requirement land somewhere. These land on an
artifact, and this is where each is held.

| Requirement | Lands on                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-004      | The components already render package values; the gate is `scripts/check-prerendered-documents.mjs` ([contracts/prerendered-document.md](../contracts/prerendered-document.md)) |
| FR-005      | `publish-static-routes.mjs`, applying the head over the generated document ([contracts/address-set.md](../contracts/address-set.md) §5)                                         |
| FR-006      | `published-addresses.mjs` and the generated routes file (address-set.md §1, §4)                                                                                                 |
| FR-007      | The prohibitions list (prerendered-document.md), gated by `productionOutputViolations` and the script test                                                                      |
| FR-013      | `ngsw-config.json` and the unchanged offline journeys (address-set.md §3)                                                                                                       |
| FR-014      | `navigationRequestStrategy: freshness`, the fallback move to `index.csr.html`, and the three pinned assertions (address-set.md §3)                                              |
| FR-015      | `404.html`, copied from `index.csr.html` (address-set.md §3, §5)                                                                                                                |
| FR-017      | Unchanged behaviour; asserted rather than built                                                                                                                                 |
| FR-018      | The content-bearing registry (data-model.md, address-set.md §1)                                                                                                                 |
| FR-020      | `scripts/check-prerendered-documents.mjs` (prerendered-document.md)                                                                                                             |
| FR-021      | The registry plus the build-failing reconciliation (address-set.md §1)                                                                                                          |

## Every requirement is accounted for

| Requirement | Screen      | Build artifact | Requirement | Screen      | Build artifact |
| ----------- | ----------- | -------------- | ----------- | ----------- | -------------- |
| FR-001      | all 3       | —              | FR-012      | all 3       | —              |
| FR-002      | hull detail | —              | FR-013      | —           | yes            |
| FR-003      | catalogue   | —              | FR-014      | —           | yes            |
| FR-004      | all 3       | yes            | FR-015      | —           | yes            |
| FR-005      | all 3       | yes            | FR-016      | hull detail | yes            |
| FR-006      | —           | yes            | FR-017      | —           | yes            |
| FR-007      | —           | yes            | FR-018      | —           | yes            |
| FR-008      | all 3       | —              | FR-019      | all 3       | —              |
| FR-009      | all 3       | —              | FR-020      | —           | yes            |
| FR-009a     | catalogue   | —              | FR-021      | —           | yes            |
| FR-010      | all 3       | —              |             |             |                |
| FR-011      | all 3       | —              |             |             |                |

Twenty-two requirements, every one mapped. No screen appears here without a
requirement, and no requirement without a home.

## What this inventory does not do

- **It does not define new visuals.** There are none. Constitution IX allows
  finished visuals to follow the mapping; here there is nothing to follow, because
  the screens are the ones already shipped and this feature renders them earlier.
- **It does not re-specify the three screens.** Their existing design artefacts
  stand. What is new about them is the first frame, and that is
  [first-frame.md](./first-frame.md).
