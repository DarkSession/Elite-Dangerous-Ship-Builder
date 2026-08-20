# Routes and UI Contract

## Routes

| Route                         | Outcome                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `/`                           | Replace-navigation redirect to `/ships`; no payload                                            |
| `/ships`                      | Hull catalogue with per-tab session state and no required hull selection                       |
| `/ships/:symbol`              | Exact package hull detail: wide inspector or narrow full-screen layer; unknown is a safe error |
| `/build` with optional `#b.…` | Active workspace; recognized fragment passes through the shared ingress pipeline               |
| `/builds`                     | Record library: route-backed wide modal or narrow full-screen view                             |

Catalogue constraints and scroll are deliberately absent from route query/fragment and build state. A detail back action restores the catalogue session anchor. Build links use only the `/build` fragment.

## Intent boundary

Route components receive immutable localized view models and emit intent. They never read Almanac catalogues, `ShipLoadout`, Web Storage, History, BroadcastChannel or Web Locks directly.

Required intent entry points:

- catalogue: change search/facet/sort, open hull;
- detail: back to catalogue, retry artwork, request stock creation;
- workspace: save/name, share/copy, open library, retry persistence, accept/cancel replacement;
- library: open, name/rename, duplicate, delete, resolve conflict, manage/discard, retry.

Stock creation, record open and link load all call the same replacement coordinator. Candidate failure or cancel cannot mutate active state.

## Shared presentation components

Screens compose feature 011's `AppShell`, landmark/page heading, navigation, action buttons, form fields, status/notice/error/live-announcement components and dialog primitives. Feature 001 adds or extends the shared library with:

- `CollectionToolbar`: search, segmented size filter, additional fact filters, sort, active constraints and match count;
- `ResponsiveCatalogueView`: semantic sortable manifest at wide widths and semantic stacked record cards at narrow widths;
- `HullSummaryCard`, `FactList`, `UnavailableValue`, `HullArtwork` and `SlotLayout`;
- `ResponsiveRecordList` and `SavedBuildCard`;
- `ShareLinkPanel`, `ConfirmDialog` and three-choice `ChoiceDialog`.

Every shared component has default/populated, empty, loading, error and disabled previews where meaningful at desktop, tablet and mobile widths. Components use only design tokens and input/output state.

## Accessibility and responsive behavior

- Each route has `main`, one visible `h1`, consistent heading nesting and semantic lists/definition lists.
- Controls expose matching visible/accessibility names and selected/expanded/invalid relationships.
- Search constraints and match count are textual; count updates use a polite live region.
- Blocking load/storage/link errors use one prompt alert; status changes do not re-announce unaffected content.
- Facts include unit and availability in accessible text. Hull facts are explicitly distinguished from module-dependent build results.
- Artwork always has a text equivalent; loading/missing images cannot disable stock creation.
- State is never conveyed by color alone; status includes localized text and an icon or equivalent cue.
- Fluid single-column layouts serve narrow widths and 400% zoom; multi-column composition appears only when available space permits. There is no document horizontal overflow.
- Wide catalogue columns use table/header semantics and named sort buttons. If translated or zoomed content exceeds the manifest width, overflow belongs to that region; the narrow card presentation is the 400%-zoom fallback.
- Long hull names, user save names, notes, symbols and IDs wrap safely. All actions remain available on touch in portrait and landscape, with tokenized targets at least 44 CSS px.
- `prefers-reduced-motion` removes nonessential transitions without suppressing status changes.
- Expanded and RTL text do not reorder semantic reading or remove actions.
- Reference selection markers are supplemented by text and programmatic selected state. Reference `div` actions become native/shared semantic controls, and targets smaller than 44 CSS px are enlarged through tokens.

Any conformance statement uses: “WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.”

## Localization and formatting

- Every application-owned string is a feature 011 message key with bundled English fallback.
- Numbers, credits, units and record dates use named locale formatter functions backed by `Intl` and translated unit labels where `Intl` has no appropriate unit.
- Search/order uses the active locale's collator and displayed values.
- Package hull/manufacturer/diagnostic text remains package-owned. Query the installed package's i18n leaves for
  the active locale; on `null`, render canonical text with its language/disclosure marker. Do not add
  private translations.
- Missing application messages never expose a raw key, blank or placeholder.
- Reference typefaces, if retained by feature 011, are self-hosted same-origin static assets with system fallbacks. The design document's Google Fonts requests are not part of the application.

## Automated contract

Every route and relevant dialog/error state is scanned by `@axe-core/playwright` in Chromium and Firefox across desktop, tablet/mobile portrait and landscape profiles. Tests also assert roles/names/state, no page overflow, 200% text, 400% zoom, reduced motion, expanded/RTL fixtures and that in-scope errors fail the suite. Only exact rules exclusively corresponding to constitutionally excluded keyboard criteria may be excluded; broad WCAG-tag suppression is forbidden.
