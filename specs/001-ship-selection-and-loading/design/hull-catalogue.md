# Hull Catalogue Screen

**Route**: `/ships`  
**Requirements**: FR-001, FR-002, FR-003, FR-006

## Composition

- `AppShell` with the reference shipyard command bar. The bar carries the screen's name and the size of the shipyard, and the page renders neither again (see [screen chrome](#screen-chrome-and-the-command-bar)).
- `CollectionToolbar` as the reference draws it and no further: a localized search field carrying its words in the placeholder rather than in a drawn label, and the size choices as an abutted segmented strip led by `ALL`. The strip is exclusive — `ALL` or one pad class, never two at once — so it is a radio group, not a set of checkboxes. Ordering is the wide manifest's own column headers, and canvas 1b's sort chips in the compact composition.
- Wide `ResponsiveCatalogueView`: canvas 1a's manifest — a leading marker column, then ship, manufacturer, the size code, the mount code and the price in Mcr, the last two hard against the trailing edge as the reference sets them. Column headers are named bidirectional sort buttons; the column in force takes the reference's amber and its `▲`/`▼` caret, which is decoration beside `aria-sort`. The current row is marked by the amber lozenge, the 3px marker on its leading edge, the wash and the amber hull name, and by `aria-current`; it carries no drawn label.
- Narrow `ResponsiveCatalogueView`: canvas 1b's stacked records — the size code on the leading edge, the hull name over one `manufacturer · mounts` line, the price and `Mcr` on the trailing edge — preceded by the horizontally scrolling sort chips.
- When `/ships/:symbol` is active at wide widths, the manifest shares the page with the [hull-detail inspector](./hull-detail.md). `/ships` itself requires no implicit first selection.
- One centred sentence for no matches, on the manifest's own ground. No notice above the list: the reference draws none, and a cell with no value already says "Unavailable" in place.

### Narrowing is the search and the size strip, and nothing else

The earlier divergence recorded here is **closed**. FR-002 was narrowed on 2026-08-21 to the two controls the reference draws, and the manufacturer, hardpoint-class and price facets were deleted rather than left dormant on the facade: `CatalogueFilters` is now `{ query, sizes }`, and `ActiveConstraint`, `PriceRange`, `manufacturersIn` and the whole constraint-view surface are gone.

Folding them into the search is not a loss of capability, because the search already matches **every string a hull shows** — the localized name and manufacturer, the size code, the mount code and the price. What it gained is that each word of a search is matched separately: `lakon asp` is a manufacturer and part of a name, and every word must land somewhere but they need not land in the same place. Word order carries no meaning. A search whose every word cannot be placed finds nothing, which is the honest answer.

Canvas 1b's sort chips offered `PRICE`, `SHIP`, `HULL t` and `MOUNTS`, which was neither the wide manifest's column set nor a subset of it. `HULL t` and `MOUNTS` are being removed from the drawing, so the chips carry the manifest's own five fields at both widths.

### Words the reference uses

Every string on this screen is the reference's, not a paraphrase of it:

| Reference    | Message key                                          |
| ------------ | ---------------------------------------------------- |
| `48 SHIPS`   | `catalogue.match-count.all`                          |
| search field | `catalogue.search.label` — placeholder, hidden label |
| `ALL`        | `catalogue.size.all`                                 |
| `SIZE`       | `catalogue.filter.size.legend` — hidden legend       |
| `HARDPOINTS` | `catalogue.column.hardpoints`                        |
| `PRICE Mcr`  | `catalogue.column.price`                             |

The bar's count is the size of the shipyard, not the size of the result: canvas 1a reads `48 SHIPS` and goes on reading it while the list is narrowed. `catalogue.match-count` — "{{count}} of {{total}} ships" — survives as the polite live-region announcement, where the change is news rather than chrome. Canvas 1b's compact bar does read `8 OF 48 SHIPS`; that is a **live divergence**, resolved in favour of 1a on 2026-08-21 so one string serves both widths.

The table caption and the size legend are not drawn; they stay in the markup as the accessible names of the table and the strip, in the reference's own words rather than in invented ones.

### Frozen chrome

With 48 hulls the manifest is several screenfuls, so the command bar, the toolbar and the column headers stay put while the rows scroll under them, and the inspector rail stays with the hull it describes.

The offsets are exact by construction rather than measured at runtime. The command bar is one row of controls at the target baseline inside its own block padding (`--edsb-layout-bar-height`), the toolbar below it is one such row inside the region's block padding and the size strip's hairline, and the manifest header clears both through `--edsb-layout-manifest-offset`. A short viewport releases the bar (FR-011), and every region below releases with it.

The toolbar and the column headers freeze against the same edge, so a fractional device pixel ratio can round the two boxes apart and let a hairline of the row behind them show through the seam. The toolbar paints a hairline of its own ground below itself rather than the arithmetic being tuned to a ratio nobody's screen has to have.

The manifest is deliberately **not** an overflow container: a sticky header inside one freezes against that box rather than against the viewport. It only ever renders above the medium threshold, where its six short columns fit, and narrower or zoomed layouts use the cards instead.

### The manifest holds its column track list

Canvas 1a draws the manifest as a grid on one track list — `22px 2.1fr 1.5fr 56px 104px 96px` — shared by the header row and every row under it. A table that re-measures its columns whenever the list is narrowed does not behave like that drawing: choosing a pad class or typing a letter shuffles every heading sideways under the reader's eye.

So the table is `table-layout: fixed` and the track list is carried on the header cells as shares of the manifest — 3/36/24/8/16/13 — which reproduces the reference's proportions at the width it is drawn at and holds them at every other. Row height follows: one block of padding lives on the open action rather than being paid twice by the cell around it, so every row is the target baseline tall and no row is taller than another.

### Screen chrome and the command bar

The reference command bar carries the screen's own name on the leading edge, the one count belonging to that screen beside it, and the screen's actions on the trailing edge. It carries no product name, and the screen it is on is never repeated as a navigation control.

So the bar's title is the document's single `h1`, published by the route title strategy and read from `LocaleStore.page()`; the count is published by the screen through `ScreenChrome`. No route renders a heading or a count of its own, and `AppNavigation.entries()` omits the current screen. The hull-detail child route sets no title of its own, because canvas 1a keeps the bar reading `SHIPYARD` while a hull is open in the inspector.

## States

| State                   | Required presentation and behavior                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Populated/default       | All package hulls in original stable order, the shipyard's size visible in the command bar.                            |
| Searching/filtering     | Every control shows its own state; the match count is announced politely once and the bar keeps the shipyard's size.   |
| Sorted                  | The field and the direction it would next apply are the sort control's accessible name; ties use package ordinal.      |
| No matches              | One sentence saying nothing matched. Every control stays reachable, so widening the search needs no separate action.   |
| Restored                | Returning from detail restores controls and the anchored result/relative offset after cards have stabilized.           |
| Missing fact            | Localized “Unavailable”; zero, if present, is rendered as zero and remains sortable/filterable.                        |
| Artwork loading/missing | Reserved aspect ratio prevents scroll shift; missing preview has text status and never changes matching or navigation. |

## Interaction and session behavior

The screen writes `CatalogueSessionState` to the tab catalogue store and optional versioned `sessionStorage` cache. It writes no active build, local build record, query parameter or fragment. Opening detail records the selected symbol/offset as the result anchor and navigates to `/ships/:symbol`; wide layout keeps the manifest visible while narrow layout presents detail as a full-screen layer. Browser/back and the detail back action restore from the same state.

Search uses the actual localized strings/formatters shown in the current manifest/cards, one word at a time. The size strip is the one structured facet, and it names its selected segment. The wide manifest uses real table semantics rather than a grid of generic elements; the narrow list preserves the same fact relationships without visually forcing table columns.

## Responsive and accessibility notes

- Toolbar controls wrap into a single column at narrow widths and 400% zoom; the sort chips scroll inside their own row. The shipyard's size is in the banner, ahead of `main` in reading order; the match count is announced rather than drawn.
- Every code the manifest shortens travels with its spelled-out form, and every label the reference compresses away stays in the markup — hidden from the eye, not dropped. A row reading `LRG · 2H 2L 1M 2S` still announces the landing-pad class and the mounts in words.
- Manifest headers expose sort name/direction; narrow cards use list/definition semantics so fact labels and values remain associated.
- Row/card click is not the only action mechanism; a named touch target exposes detail navigation.
- No result depends on hover artwork or color. Long canonical package names/manufacturers wrap.
- The document never scrolls horizontally. Zoomed and narrow layouts switch to cards rather than squeezing the manifest, which is what lets the manifest stay a plain table with a viewport-sticky header.
- Component previews cover default, constrained, no-match and unavailable states in wide manifest and narrow card variants.

## Reference composition

Measured from canvas 1a (wide) and 1b (compact); the shared vocabulary is in
[feature 011's canvas extraction](../../011-interface-foundations/design/canvas-extraction.md).

| Part                | Canvas                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Screen chrome       | The application command bar: amber flag, `SHIPYARD` in condensed 700 tracked 0.26em, the package hull count in monospace beside it |
| Region split        | `1fr` manifest against a fixed inspector rail; the rail carries its own darker ground behind an amber hairline                     |
| Toolbar             | A search field on the darker ground, then the size choices as an abutted segmented strip whose one-pixel gaps show amber through   |
| Compact sort        | A tracked `SORT` label and a single scrolling row of chips, the one in force filled amber and carrying a direction caret           |
| Column headers      | Monospace, tracked 0.16em, over a single amber hairline; each header is the sort control                                           |
| Row                 | A plate on `--panel` separated from its neighbours by a 2px gap, opened by a 3px marker on the leading edge                        |
| Selected row        | An amber lozenge fills the marker column, a wash runs from the leading edge, and the hull name turns amber — never a word          |
| Hull name           | Condensed 600 uppercase tracked 0.07em — the largest thing in the row                                                              |
| Manufacturer        | Barlow, untracked, quieter than the name                                                                                           |
| Size, mounts, price | Monospace codes — `LRG`, `2H 2L 1M 2S` — with the price in Mcr under a `PRICE Mcr` header, aligned to the trailing edge            |
| Compact row         | A fixed size code on the leading edge, name over a `manufacturer · mounts` line, price and `Mcr` on the trailing edge              |
| Empty state         | Centred prose in Barlow 300 on the manifest's own ground, no panel                                                                 |
