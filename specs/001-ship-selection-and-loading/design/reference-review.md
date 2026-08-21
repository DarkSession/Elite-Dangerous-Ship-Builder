# Design Reference Review

## Source reviewed

- `.design/Ship Builder.dc.html`
- Canvas **1a**: wide shipyard manifest, inspector rail and saved-build modal
- Canvas **1b**: narrow shipyard list, full-screen hull detail and saved-build layer
- Canvas **1c**: wide workspace shell, save dialog and export/share dialog
- Canvas **1d**: narrow workspace shell, overflow actions and bottom-sheet dialogs

The design file is a product visual reference. It is not application source, a game-data source or a component implementation. Nothing under `.design/` is copied into the production bundle merely because it appears in the canvas.

## Adopted decisions

| Reference decision                                                                                 | Planning interpretation                                                                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Dark, dense amber-accented visual language                                                         | Implement through feature 011's single dark token set and shared components.                            |
| Wide shipyard uses a sortable manifest plus hull inspector rail                                    | `/ships/:symbol` composes the catalogue and detail in a master-detail layout at wide widths.            |
| Narrow shipyard uses search/filters/sort controls and stacked hull records                         | `/ships` switches to the semantic card/list variant without losing facts or actions.                    |
| Narrow detail replaces the catalogue visually and has a back action                                | The same `/ships/:symbol` route renders a full-screen layer and restores the catalogue session on back. |
| Saved builds are a centered overlay on wide screens and full screen on narrow screens              | `/builds` is route-backed; wide uses a modal surface, narrow an ordinary full-screen surface.           |
| Saved rows emphasize name/note, hull, issue state and modification age                             | Build cards preserve this hierarchy while adding working state and exact recorded validation.           |
| Workspace exposes save/export directly when space permits and via overflow when narrow             | `AppShell`/workspace actions adapt by width but retain identical capability and accessible names.       |
| Save dialog captures a local build name and one note and distinguishes replacement from a new copy | The dialog binds to UUID/revision semantics, duplicate-name warning and conflict-safe save operations.  |
| Export surface includes a dedicated share-link mode                                                | Feature 001 supplies canonical fragment links inside the surface; feature 004 supplies SLEF modes.      |

## Required adaptations

### Almanac data and assets

- All row/detail values in the design are illustrative. Runtime reads `SHIPS`, exact package symbols, package units and package validation; it does not copy the HTML's hard-coded arrays or labels.
- The reference PNGs and partial-coverage copy are stale mock assets/state. The installed package provides an `illustration.svg` for every catalogued hull. Runtime copies those package files to a same-origin asset path and retains defensive loading/missing states for package drift and offline conditions.
- The reference detail summary omits hardness, mass-lock factor, crew, heat capacity/dissipation, reserve fuel, rotation endpoints, complete slot layout and the hull-only/retail cost distinction. **This adaptation was withdrawn on 2026-08-21.** The screen is the reference composition; those figures are not shown. See [hull-detail, "Divergence from FR-004"](./hull-detail.md#divergence-from-fr-004).
- Missing package values render as unavailable, never as the mock's zero, blank cell or guessed value.

### Catalogue behavior

- The visible size controls and search/sort treatments are retained. **The adaptation that added manufacturer, hardpoint and price controls to the toolbar was withdrawn on 2026-08-21**; the capability remains on the facade but no control draws it. See [hull-catalogue, "Divergence from FR-002"](./hull-catalogue.md#divergence-from-fr-002).
- Wide column headers become semantic sort buttons with announced field/direction. Narrow sort chips expose the same state and are at least 44 CSS px.
- Selected-row amber/lozenge styling gains programmatic state. The lozenge and the wash are drawn as the reference draws them and `aria-current` carries the same fact, so nothing depends on colour alone; the visible “Currently viewing” label the earlier build added is gone.
- The selected inspector corresponds to `/ships/:symbol`. The `/ships` route does not silently create a build or require an arbitrary default hull.

### Persistence and saved builds

- The mock depicts named saves only. The implementation also lists tab working records, unsupported/malformed entries, retention/quota management and persistence-unavailable state.
- Each row always shows the recorded package validation state; an issue badge is not the only way “valid,” “incomplete” or “invalid” is conveyed.
- Rename, duplicate, name-working-copy and management actions are added using responsive shared actions; selecting a row does not hide the only route to them.
- The price column may compose feature 009 cost output, but feature 001 does not persist a display price as local metadata or use it in link/storage identity.
- The save mock's “overwrite” choice is resolved against record UUID/revision, not display name. A genuine concurrent write still requires overwrite, keep both and cancel after a locked recheck.

### Link and export behavior

- The mock sample `https://shipbuilder.local/b/pacifier#h=...` is noncanonical. Generated links are same-origin `/build#b.<versioned-payload>`; local save names never enter the path and build data never enters path/query.
- The share value is selectable after copy/share failure. Encode refusal clears a stale fragment, explains the structured slot/reason and preserves feature 004's SLEF fallback.
- SLEF export belongs to feature 004. The mock's journal and Markdown export formats are rejected by
  that accepted plan and do not expand feature 001's ownership.

### Design system, localization and accessibility

- Inline colors, sizes, spacing, radii, elevation, durations and hover behavior are translated into feature 011 tokens/components; the canvas CSS is not copied into feature styles.
- The design document's Google Fonts requests are not allowed at runtime. If Barlow/JetBrains Mono are retained, their permitted font files are shipped same-origin with system fallbacks and licence attribution from feature 012.
- Every design `div` acting as a button, tab, row or dialog choice becomes the appropriate native/shared semantic control. Visible/accessibility names match, dialog title/description are associated, and background content is inert.
- Reference targets below 44 CSS px are enlarged. Hover is enhancement only; all actions work by touch/pointer.
- Abbreviations such as `LRG`, `Mcr`, hardpoint codes and relative dates have localized visible or accessible expansions. Numeric values, units, credits and dates use the active locale.
- The wide manifest/modal owns any necessary internal overflow; 400% zoom uses the narrow composition and never creates document horizontal scrolling.
- Every application string is localized. Canonical package hull/manufacturer text is marked untranslated when the active locale is unavailable from the Almanac.
- Contrast, screen-reader flow, text expansion, RTL layout and reduced motion are verified rather than inferred from the canvas.

## Cross-feature observations

The reference also depicts outfitting, engineering, calculations, help and multiple export formats. Those visuals inform their respective later feature plans but do not move their requirements into feature 001.

One help sentence in the mock says imported modules keep partial engineering rolls. That contradicts constitution principle IV and feature 004, which normalize modelled engineering quality to 100%. It must be corrected through application localization when feature 012 plans help content; the mock sentence is not accepted product behavior.

## Design acceptance gate

Feature 001 visual implementation is accepted only when it remains recognizably consistent with these canvases **and** every adaptation above is present. Pixel similarity cannot override the specification, package source of truth, responsive/accessibility behavior, localization or privacy contracts.

## Reconciliation outcome (implementation)

This section records both halves of quickstart Scenario 10. Steps 3 and 4 — the mandatory
adaptations and the built asset tree — are checked against the production build. Steps 1 and 2 —
whether the wide and compact compositions preserve the reference hierarchy — are checked against
`.design/Ship Builder.dc.html` itself, canvas by canvas.

### Built output (Scenario 10, steps 3 and 4)

Checked against the production build (`pnpm run build`), not against intent.

| Check                                            | Outcome                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.design/` mock data or assets in the built tree | None. No file under `dist/` references `.design`, and every shipped asset is either a font, a locale catalogue or one of the 48 hull illustrations copied from the installed package.                                                                                                               |
| Google Fonts request                             | None. `fonts.googleapis.com` and `fonts.gstatic.com` appear nowhere in the built CSS, JavaScript or HTML. Barlow, Barlow Condensed and JetBrains Mono are served same-origin from `browser/fonts/`, with system fallbacks and feature 012's licence attribution.                                    |
| The `/b/<name>#h=…` sample link                  | Absent. `#h=` appears nowhere in the built tree. Published links are same-origin `/build#b.<payload>`, and a local save name never enters the path.                                                                                                                                                 |
| Any other origin                                 | The only absolute URLs in the built output are inside framework diagnostic text (`angular.dev`, `github.com`) and an XML namespace. Nothing is fetched from them; the end-to-end suite additionally asserts that no request during any catalogue, detail, storage or share flow leaves this origin. |

### Composition (Scenario 10, steps 1 and 2)

Each screen's canvas parts are tabulated in its own design file — see the "Reference composition"
section of [hull-catalogue.md](./hull-catalogue.md), [hull-detail.md](./hull-detail.md),
[build-library.md](./build-library.md) and [build-workspace.md](./build-workspace.md). The shared
vocabulary those tables draw on is measured in
[feature 011's canvas extraction](../../011-interface-foundations/design/canvas-extraction.md).

| Canvas part                                                       | Implemented as                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Command bar: amber flag, tracked condensed title, monospace count | `AppFrame`'s banner. The title is the document's one `h1` and the count comes from `ScreenChrome`; no route renders either again |
| `1fr` manifest against a fixed inspector rail                     | `region-pair` at wide widths, the rail carrying its own ground and hairline                                                      |
| Segmented size choices with hairline gaps                         | `ChoiceGroup` with `layout="segmented"` — native checkboxes, labels styled as the strip                                          |
| Tracked monospace column headers over a single amber hairline     | `DataTable` and `ResponsiveCatalogueView` headers                                                                                |
| Row plates with a 3px leading marker and an amber wash when open  | The `selectable-row` mixin, used by the manifest, the hull cards and the record list                                             |
| Amber lozenge in the current row's own marker column              | `ResponsiveCatalogueView`'s leading `.catalogue__mark` cell                                                                      |
| Compact sort chips, the one in force filled amber with a caret    | `CollectionToolbar`'s chip row, removed at wide widths where the headers sort                                                    |
| Ruled two-column metric grid                                      | `MetricGroup`, via the `ruled-group` mixin                                                                                       |
| Section rule with a trailing total                                | The `section-rule` mixin, used by the record groups and the slot layout                                                          |
| Hatched artwork plate with the amber filter                       | `HullArtwork`                                                                                                                    |
| Panel dialog: scrim, amber hairline, darker title bar, footer     | `Layer`, in all three presentations                                                                                              |
| Five button variants                                              | `ActionButton`'s emphasis values, via the `control-*` mixins                                                                     |

The adaptations recorded above the fold are implemented as described. The ones worth naming, because
they change what the canvas shows rather than only how it is built:

- the manifest's wide composition is a real table with named bidirectional sort buttons, and its
  narrow composition restates every label as a definition list;
- the current row carries `aria-current` alongside the amber lozenge and wash, but no visible word:
  the reference marks the row and never labels it;
- every code the manifest shortens — `LRG`, `2H 2L 1M 2S` — travels with its spelled-out form, and
  every label the reference compresses away stays in the markup, hidden from the eye rather than
  dropped;
- the segmented size choices are multi-select checkboxes rather than the canvas's single-select
  strip, because the specification's constraints are additive;
- the canvas's 0.32–0.50 ink label washes are lifted to the 0.55 step, the dimmest that clears
  4.5:1; the ladder above keeps its order, so the hierarchy survives;
- the type ramp is the canvas's own, lifted uniformly by ~1.25× to an 11 px floor;
- **two adaptations recorded above the fold were withdrawn on 2026-08-21**, because the design is
  the record and anything it does not draw is not on the screen: the toolbar's manufacturer,
  hardpoint and price controls with their constraint chips (FR-002), and everything the reference
  inspector leaves out of its five figures, one price and mount chips (FR-004). Both divergences,
  and what is left open by them, are recorded in [hull-catalogue.md](./hull-catalogue.md#divergence-from-fr-002)
  and [hull-detail.md](./hull-detail.md#divergence-from-fr-004);
- the library lists working records, unsupported and malformed entries, and the retention and quota
  states the mock does not depict, and it never evicts anything on its own;
- the share value stays selectable after a copy or share failure, and a refused encode clears the
  stale fragment while keeping the build;
- the help sentence claiming imported modules keep partial engineering rolls is not implemented —
  modelled engineering quality is normalised, per constitution principle IV.

Feature 004 owns SLEF export. Until it lands, the refusal path offers an explicit "not part of this
version yet" rather than an action that does nothing.
