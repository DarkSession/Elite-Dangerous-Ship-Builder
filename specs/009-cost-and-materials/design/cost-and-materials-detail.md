# Cost and Materials Detail Surface

**Parent state**: active `/build` workspace
**Requirements**: FR-001–FR-010

## Purpose and order

Explain the catalogue credits, conditional Merc Coin purchases and engineering materials needed for
the current package build without combining currencies or hiding missing package facts. The semantic
reading order is always:

1. catalogue retail credits;
2. Merc Coin purchases, only when package-recognized;
3. engineering material requirements and their fitted-selection traces.

Visual columns may change, but DOM/read order does not.

## Composition

### Retail credits

Use shared section, definition-list/value and qualification components. Show hull, fitted modules and
rebuy as independent rows. Do not show a combined total. A lower-bound marker is textual and
programmatically associated with modules and rebuy; the evidence list names every exact slot and
module/symbol and offers a feature 002 slot action. Hull unavailability remains independent.

Source-purchase values never appear as fallback retail. If feature 004 presents provenance nearby,
its own heading and wording keep it distinct.

### Merc Coin

Render a separate region only when the snapshot is `present`. Each entry exposes module/variant,
exact slot, purchase grade, current grade when different, and price or unavailable text. The region's
total is the literal package total; missing entry prices attach a lower-bound qualification and full
evidence. No copy, placement, icon or color implies a credit conversion.

### Materials

For complete requirements, render every consolidated package row—never only a top subset. Each row
contains material identity, localized/canonical-disclosed name, textual grade, locale-formatted
quantity and a named trace disclosure. Grade icons or category ornament may supplement but never
replace text.

The trace lists every exact fitted source with module/slot, blueprint or effect package name/id,
selected grade where applicable and that source list's package count. Expanding a trace does not
navigate; a separate exact-slot control targets feature 002.

For incomplete requirements, present the known consolidated rows only as a named lower bound and list
every missing recipe source. For no crafted requirements, explain that there is no ordinary craft
cost; recognized fixed/purchase baseline explanations may appear without empty material rows. Missing
material metadata produces an unavailable row/state and no inferred grade.

## Responsive layout

- Wide: a fluid costs region may place retail and Merc Coin beside each other when both retain full
  labels/evidence; materials then uses the full available width.
- Tablet: at most two columns; any qualification or trace that would be compressed forces a stack.
- Mobile, landscape and 400% zoom: one column, complete rows/cards and inline disclosures. Nothing is
  omitted, ellipsized into ambiguity or moved to hover.
- Wide lists may use a responsive table primitive only if it transforms to labelled rows/cards rather
  than causing document-level horizontal scrolling.
- Exact-slot/disclosure controls use feature 011's minimum 44 CSS-pixel touch target token and work by
  touch and pointer.

## States

| State                              | Required presentation                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| No active build                    | Existing workspace actions; no empty cost cards                                             |
| Pending new revision               | Current-context pending state; old facts keep old revision and are not presented as current |
| Exact retail                       | Three independent exact rows                                                                |
| One/all modules unpriced           | Useful package lower bounds plus complete named evidence                                    |
| Hull unknown                       | Hull/rebuy unavailable; useful module subtotal retains its own state                        |
| No Mercenary article               | Entire Merc Coin region absent                                                              |
| Complete Mercenary set             | Every entry and exact package total                                                         |
| Missing Merc price                 | Entry unavailable; total lower bound naming every missing slot                              |
| No crafted/fixed-only engineering  | No ordinary craft requirement; fixed/purchase explanation, no fabricated zero rows          |
| Complete repeated-source materials | Consolidated package list; traces retain repeated selections                                |
| Missing recipe                     | Known list visibly incomplete plus every missing blueprint/effect source                    |
| Untranslated material              | Canonical English package name and shared untranslated disclosure                           |
| Missing material metadata          | Identity remains; name/grade unavailable and upstream dependency visible                    |
| Projection failure                 | Prompt localized error; active build remains intact; no stale current facts                 |

## Accessibility and announcements

- Regions have localized headings; label/value relationships use semantic lists/table structures.
- Qualifiers and unavailable text are referenced from their affected values, not conveyed by color,
  icon, shape or placement alone.
- Trace controls expose expanded state and are named for the material. Slot controls name their exact
  visible destination.
- Localized package fallback disclosure is programmatically associated with the game name.
- After a settled revision, one polite localized announcement summarizes changed qualification and
  requirement states. Initial, unchanged and discarded work is silent. Prompt projection failure is
  not repeated by every card.
- Text survives 200% text size, 400% zoom, expanded/RTL fixtures and reduced motion. Automated axe is
  a floor; manual screen-reader reading/order/action checks cover both primary stories.
- Any conformance statement names the excluded criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7
  and 2.4.11.

## Component-system impact

Compose feature 011 section, fact-list, status/qualification, disclosure, action and responsive-list
primitives. If no shared disclosure can associate one aggregate row with several source records,
extend `src/app/ui/` with a reusable trace/disclosure primitive and preview all states at the three
width families. No screen-local token, color literal, spacing value or animation is permitted.
