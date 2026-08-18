# Screen Inventory: Cost and Materials

Feature 009 adds no route. Every surface composes the existing `/build` workspace and requires its
active build. The URL fragment remains the canonical `b.…` payload, never capability selection.

| Screen/surface                | Wide desktop                                                          | Tablet                                    | Mobile/400% zoom                                     | Requirements            |
| ----------------------------- | --------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- | ----------------------- |
| No active build               | Existing workspace empty state; no projection                         | Same content reflows                      | Same creation/open actions                           | Capability prerequisite |
| Cost and Materials detail     | Central capability outlet; costs and materials may form fluid columns | At most two columns where full labels fit | One complete semantic stack                          | FR-001–FR-010           |
| Retail credits                | Hull, modules and rebuy definition group                              | Same group, qualifications wrap           | Stacked labels/values and full evidence              | FR-001–FR-003           |
| Unpriced credit evidence      | Named ordered slot/module list beside affected totals                 | Full-width evidence below totals          | One item per exact slot action                       | FR-002                  |
| Merc Coin purchases           | Separate conditional region with entries and total                    | Same separate region                      | Stacked entries; never merged with credits/materials | FR-001, FR-004–FR-006   |
| Consolidated materials        | Full list with grade, name, quantity and trace control                | Fluid list/cards                          | Labelled rows/cards; no truncated fields             | FR-001, FR-007–FR-010   |
| Material trace                | Per-material disclosure of every fitted source                        | Expands in reading order                  | Row-owned stacked disclosure                         | FR-007–FR-010           |
| Missing recipe/metadata       | Explicit incomplete/unavailable notice plus exact sources             | Same association                          | Same content and actions                             | FR-008, FR-010          |
| Assembly requirements summary | Feature 003 compact classified projection with detail target          | Reflows in status surface                 | Same semantic facts, not the only evidence location  | FR-001–FR-010           |
| Updating/failure              | Current-context pending/error replaces stale facts                    | Same                                      | Same without covering navigation                     | FR-001                  |

## Requirement traceability

| Requirement | Planned behavior                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One package-backed snapshot owns all credit, Merc Coin and material quantities; components and summary adapter do no arithmetic.   |
| FR-002      | Retail group preserves `retailCredits()` hull/modules/rebuy/unpriced and qualifies modules/rebuy with every exact unpriced slot.   |
| FR-003      | No source-purchase value appears inside catalogue retail; feature 004 provenance retains its own meaning.                          |
| FR-004      | Merc Coin entries exist only from fitted `preEngineeredVariant.acquisition === 'mercenary'`.                                       |
| FR-005      | Per-entry optional variant price and package total stay separate from credits; missing prices name entries and qualify the total.  |
| FR-006      | No recognized entry omits the entire region; later grade does not alter purchase price; clearing follows package recognition.      |
| FR-007      | Source records call cumulative blueprint, one-application effect and package consolidation helpers only.                           |
| FR-008      | Missing recipe sources remain named/unavailable and any known partial list is explicitly incomplete, never an empty complete list. |
| FR-009      | Fixed/purchase baselines are explained as non-crafted; later ordinary selections retain their package costs.                       |
| FR-010      | Material symbol/name/grade come from Almanac helpers, with visible canonical untranslated disclosure on locale miss.               |

## Cross-feature ownership

- Feature 001 supplies active build/revision and the no-build workspace.
- Feature 002 supplies exact-slot editing/target handling and the shared committed-selection cost
  classifier.
- Feature 003 consumes the summary adapter but does not own detailed calculations.
- Feature 004 owns source-purchase provenance.
- Feature 011 supplies the components, locale, formatting, responsive tokens and test harness.

All states in this inventory require previews at desktop, tablet and mobile widths before task
breakdown is considered complete.
