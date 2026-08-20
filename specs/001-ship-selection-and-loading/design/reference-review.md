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
- The reference detail summary omits hardness, mass-lock factor, crew, heat capacity/dissipation, reserve fuel, rotation endpoints, complete slot layout and the hull-only/retail cost distinction. The planned inspector/full-screen view adds every FR-004 fact without reducing the reference's initial hierarchy.
- Missing package values render as unavailable, never as the mock's zero, blank cell or guessed value.

### Catalogue behavior

- The visible size controls and search/sort treatments are retained. Manufacturer, hardpoint and price filtering plus every required bidirectional sort remain reachable through the shared collection toolbar even if they are not all expanded simultaneously in the mock.
- Wide column headers become semantic sort buttons with announced field/direction. Narrow sort chips expose the same state and are at least 44 CSS px.
- Selected-row amber/diamond styling gains programmatic and textual selected state; color/shape alone is insufficient.
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
