# Hull Catalogue Screen

**Route**: `/ships`  
**Requirements**: FR-001, FR-002, FR-003, FR-006

## Composition

- `AppShell` with the reference shipyard command header, one “Shipyard” page heading, package hull count and integration actions for saved builds, feature 004 import and feature 012 help.
- `CollectionToolbar` following the reference hierarchy: prominent localized search, segmented size choices, visible sort field/direction and access to manufacturer/hardpoint/price facets, removable constraints and textual match count.
- Wide `ResponsiveCatalogueView`: canvas 1a's compact semantic manifest with ship, manufacturer, size, hardpoints and retail price columns. Column headers are named bidirectional sort buttons; selected detail is represented in text/programmatic state as well as the amber marker.
- Narrow `ResponsiveCatalogueView`: canvas 1b's stacked hull records with size, ship, manufacturer/hardpoints and formatted retail price, preceded by horizontally reflowable sort controls and the saved-build entry point.
- When `/ships/:symbol` is active at wide widths, the manifest shares the page with the [hull-detail inspector](./hull-detail.md). `/ships` itself requires no implicit first selection.
- `EmptyState` for no matches and `InlineNotice` for unavailable package facts/artwork.

## States

| State                   | Required presentation and behavior                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Populated/default       | All package hulls in original stable order, no hidden constraints, total count visible.                                |
| Searching/filtering     | Active constraints and current match count remain visible and announced politely once.                                 |
| Sorted                  | Field and direction are explicit text/state; ties use package ordinal.                                                 |
| No matches              | Explain that constraints produced no results and offer clear-all without discarding individual control accessibility.  |
| Restored                | Returning from detail restores controls and the anchored result/relative offset after cards have stabilized.           |
| Missing fact            | Localized “Unavailable”; zero, if present, is rendered as zero and remains sortable/filterable.                        |
| Artwork loading/missing | Reserved aspect ratio prevents scroll shift; missing preview has text status and never changes matching or navigation. |

## Interaction and session behavior

The screen writes `CatalogueSessionState` to the tab catalogue store and optional versioned `sessionStorage` cache. It writes no active build, local build record, query parameter or fragment. Opening detail records the selected symbol/offset as the result anchor and navigates to `/ships/:symbol`; wide layout keeps the manifest visible while narrow layout presents detail as a full-screen layer. Browser/back and the detail back action restore from the same state.

Search uses the actual localized strings/formatters shown in the current manifest/cards. Structured facets remain individually named and expose selected state. The wide manifest uses real table semantics rather than a grid of generic elements; the narrow list preserves the same fact relationships without visually forcing table columns.

## Responsive and accessibility notes

- Toolbar controls wrap into a single column at narrow widths and 400% zoom; match count precedes results in reading order.
- Manifest headers expose sort name/direction; narrow cards use list/definition semantics so fact labels and values remain associated.
- Row/card click is not the only action mechanism; a named touch target exposes detail navigation.
- No result depends on hover artwork or color. Long canonical package names/manufacturers wrap.
- A wide manifest that cannot fit expanded/translated content owns internal overflow; the document never scrolls horizontally, and zoomed layouts switch to cards.
- Component previews cover default, constrained, no-match and unavailable states in wide manifest and narrow card variants.

## Reference composition

Measured from canvas 1a (wide) and 1b (compact); the shared vocabulary is in
[feature 011's canvas extraction](../../011-interface-foundations/design/canvas-extraction.md).

| Part                | Canvas                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Screen chrome       | The application command bar: amber flag, `SHIPYARD` in condensed 700 tracked 0.26em, the package hull count in monospace beside it |
| Region split        | `1fr` manifest against a fixed inspector rail; the rail carries its own darker ground behind an amber hairline                     |
| Toolbar             | A search field on the darker ground, then the size choices as an abutted segmented strip whose one-pixel gaps show amber through   |
| Column headers      | Monospace, tracked 0.16em, over a single amber hairline; each header is the sort control                                           |
| Row                 | A plate on `--panel` separated from its neighbours by a 2px gap, opened by a 3px marker on the leading edge                        |
| Selected row        | The marker takes amber and a wash runs from the leading edge; the hull name turns amber                                            |
| Hull name           | Condensed 600 uppercase tracked 0.07em — the largest thing in the row                                                              |
| Manufacturer        | Barlow, untracked, quieter than the name                                                                                           |
| Size, mounts, price | Monospace, tabular, price aligned to the trailing edge                                                                             |
| Compact row         | A fixed size code on the leading edge, name over a `manufacturer · mounts` line, price and `Mcr` on the trailing edge              |
| Empty state         | Centred prose in Barlow 300 on the manifest's own ground, no panel                                                                 |
