# Screen Inventory: Cost and Materials

Feature 009 adds no route. Its committed detail and compact Assembly Requirements summary compose
the active `/build` workspace; feature 002's Engineer surface consumes the shared selection-cost
boundary for contextual draft/current-selection facts. Capability selection and trace disclosure do
not alter the canonical `b.…` build fragment.

| Screen/surface                          | Wide desktop                                                                          | Tablet/orientation                     | Mobile/400% zoom                                     | Requirements          |
| --------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- | --------------------- |
| No active build                         | Existing feature-001 workspace state; no projection                                   | Same actions reflow                    | Same create/open actions                             | Prerequisite          |
| Build Status / Assembly Requirements    | Compact retail, conditional Mercenary and material-state summaries with detail target | Full labels wrap/stack                 | One semantic stack in Status mode                    | FR-001–FR-010         |
| Cost and Materials detail               | Costs may group side by side; complete materials/traces use full width                | At most two columns when evidence fits | One ordered semantic stack                           | FR-001–FR-010         |
| Retail credits                          | Hull, modules and rebuy as separate facts                                             | Qualification below affected facts     | Stacked facts plus full evidence                     | FR-001–FR-003         |
| Unpriced retail evidence                | Returned-order slot/module actions                                                    | Full-width evidence                    | One complete item per exact slot                     | FR-002                |
| Mercenary purchases                     | Separate conditional region with per-slot entries and package total                   | Same, wrapping labels                  | Stacked entries; never merged with credits/materials | FR-001, FR-004–FR-006 |
| Consolidated materials                  | Every row shows name, textual grade, quantity and trace control                       | Fluid responsive list                  | Labelled rows/cards without truncation               | FR-001, FR-007–FR-010 |
| Material trace                          | Row-owned disclosure of every contributing fitted selection                           | Expands in reading order               | Stacked disclosure plus exact-slot actions           | FR-007–FR-010         |
| Missing recipe/metadata                 | Qualified known rows plus named missing sources/metadata                              | Same associations                      | Same content and actions                             | FR-008, FR-010        |
| Contextual Engineer integration         | Selection recipe facts adjacent to feature-002 editor                                 | In-document editor layer               | Full-screen Engineer composition                     | FR-007–FR-009         |
| Projection failure / mismatched context | Current-context error/pending replaces stale facts                                    | Same                                   | Same without blocking global navigation              | FR-001                |

## Requirement mapping

| Requirement | Planned surface behavior                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| FR-001      | Detail and Status share one revision snapshot containing only package-returned quantities.                                           |
| FR-002      | Retail preserves numeric hull/modules/rebuy and returned-order unpriced evidence; modules/rebuy alone become lower bounds.           |
| FR-003      | Source-purchase provenance stays outside retail groups and the 009 snapshot.                                                         |
| FR-004      | Mercenary entries exist only from fitted package variants whose acquisition is `mercenary`.                                          |
| FR-005      | Each optional variant price and the package total remain separate from credits; missing prices qualify and name affected slots.      |
| FR-006      | No recognized entry omits the Mercenary region/summary; later grades retain purchase price; clearing follows package recognition.    |
| FR-007      | Shared selection and committed projections use only cumulative blueprint, one-application effect and package consolidation helpers.  |
| FR-008      | Missing recipe sources remain named/unavailable; known rows are visibly incomplete, never relabelled complete or empty.              |
| FR-009      | Fixed and Mercenary purchase baselines are explicitly non-crafted; later Mercenary grades and separate effects retain package costs. |
| FR-010      | Material identity/name/grade use package helpers; locale miss shows canonical package text plus untranslated disclosure.             |

## Cross-feature ownership

- Feature 001 supplies the active build/revision, `/build` workspace and no-build state.
- Feature 002 supplies the Engineer surface, shared classifier, committed edits and exact-slot target.
- Feature 003 consumes the compact summary adapter and reveals the detail capability.
- Feature 004 retains source-purchase provenance.
- Feature 011 supplies tokens/components, localization/formatting, announcements and the complete
  test/accessibility matrix.

Every feature-009 component must preview populated, empty/absent, lower-bound, unavailable,
incomplete, loading/integration-pending, error and disabled states as applicable at desktop, tablet
and mobile widths.
