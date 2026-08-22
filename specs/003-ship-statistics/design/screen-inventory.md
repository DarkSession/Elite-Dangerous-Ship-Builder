# Screen Inventory: Ship Statistics and Status

Feature 003 adds no route and, after the wave 11 rulings, no screen. Its whole surface is two blocks at
the head of the existing `/build` status rail, and it requires the active build from feature 001.

## Responsive inventory

| Surface         | Desktop                                         | Tablet landscape                 | Tablet portrait | Mobile landscape | Mobile portrait / 400% |
| --------------- | ----------------------------------------------- | -------------------------------- | --------------- | ---------------- | ---------------------- |
| No active build | Existing workspace empty state; no rail         | Same reflow                      | Same reflow     | Same reflow      | Same reflow            |
| `BUILD STATUS`  | Visible heading opening canvas 1c's 306 px rail | Heading opens the stacked region | Same            | Same             | Same                   |
| Issue list      | Full-width list inside the rail                 | Full width                       | Full width      | Full width       | Full width             |
| No issues       | Absent                                          | Absent                           | Absent          | Absent           | Absent                 |

The rail's own composition — third track at wide, stacked region at compact — is feature 009's, decided
in CSS from the space the region is given. Portrait/landscape changes layout only. No arrangement
creates document horizontal scrolling.

## Requirement mapping

| Requirement | Surface behavior                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| FR-001      | No-build state defers to the existing workspace and never creates or selects a hull.                        |
| FR-002      | `ShipLoadout.validation` is the only input; nothing is derived, clamped, repaired or reinterpreted.         |
| FR-003      | `valid` and `complete` are conveyed by the issues the package raises about them, and by nothing else drawn. |
| FR-004      | Each package issue is rendered once, in package order, with its severity in words.                          |
| FR-005      | The diagnostic is package text through the shared presenter; only the framing around it is localized.       |
| FR-007      | A locale miss shows canonical text with the shared untranslated disclosure.                                 |
| FR-013      | Package-defaulted fixed modules appear only as ordinary fitted state, with no provenance region.            |
| FR-014      | No import or defaulting history is inferred or persisted from fixed-module state.                           |
| FR-015      | A build with no issues draws nothing, so no readiness or quality claim can be made.                         |
| FR-022      | Severity is text beside its issue, hidden as the canvas draws none; the tiers differ by ground too.         |

Requirements withdrawn or reassigned by the wave 11 rulings are listed in
[spec.md](../spec.md#withdrawn-and-reassigned-requirements).

## Ownership boundaries

- Features 005–008 own the power block, the six metric cells and — under ruling C — the load, pip and
  hardpoint conditions their own artboards draw.
- Feature 009 owns `COST` and `MATERIALS`, already built.
- Feature 002 owns slot editing and navigation. Feature 003 links to none of it.
- Feature 001 owns the active build and the no-build state.
- Feature 011 owns the tokens, the game-text primitive, the message layer and the test harness.
