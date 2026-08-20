# Anatomy Projection Contract

## Inputs

The pure projector receives one coherent context:

- feature 001 active `ShipLoadout`, exact resolved hull symbol and `buildRevision`;
- feature 003 settled hardpoint condition and `conditionsRevision`;
- feature 002 immutable exact slot views and `selectedSlotKey`;
- top/bottom side states and validated annotations for that hull; and
- feature 005 generalized located-mount power observations for the same revision pair.

Any hull or revision mismatch refuses publication. Locale is a presentation input and never changes
mount identity or revisions.

## Canonical items

Read `ShipLoadout.slots()` once for the captured build revision. Keep entries with exact package kind
`hardpoint` or `utility`, preserving returned outfitting order. Create one item keyed by the package
slot key with:

- exact kind and package size semantics;
- feature 002's empty/resolved fitted state;
- exact module symbol and feature 011 game-text presentation;
- package/feature 002 engineering presence;
- focused state from the one exact selected key; and
- generalized feature 005 priority/current-power observation.

No item is created from an SVG annotation. No package item is removed because geometry is pending,
unavailable or defective.

## Annotation admission

For every validated group carrying `data-journal-slot`:

1. `data-feature="hardpoint"` expects a canonical `hardpoint` item;
2. `data-feature="utility_mount"` expects a canonical `utility` item;
3. every other feature remains inert artwork, even if malformed content adds a journal key;
4. the journal key must resolve to the exact package-enumerated active-hull item;
5. unknown keys and feature/kind mismatches are omitted and recorded as defects; and
6. a second occurrence for the same key on one side is a contract defect and no occurrence is chosen
   by order.

Key prefixes such as `TinyHardpoint`, translated/canonical labels, module symbols, ids, drawing order,
coordinates and model sockets never classify or resolve a mount.

## Occurrences and duplicates

A valid occurrence is `(slotKey, side, exact package shapes)`. It references its canonical item and
owns no build state. The package allows one occurrence on each side; top and bottom instances for the
same key both render identical fitted, engineering, focused and power state.

After both valid sides settle, a package hardpoint/utility without an occurrence becomes a
`missingContractGeometry` defect. If one side is unavailable, absence remains pending/temporarily
unavailable instead of being reported as permanent.

## State projection

| State                  | Source and rule                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| Mount kind/key/size    | Exact package slot snapshot                                              |
| Empty/fitted           | Feature 002 slot view from the same build revision                       |
| Module identity        | Exact `FittedModule.symbol`; no recovery lookup                          |
| Module name            | Feature 011 over Almanac i18n; canonical/unavailable disclosure retained |
| Engineering            | Package/feature 002 presence only                                        |
| Focused                | Feature 002's one `selectedSlotKey`                                      |
| Priority/current power | Feature 005 located-mount observation, unchanged                         |
| Geometry location      | Settled valid occurrences and side availability                          |

An unavailable priority, power verdict, module name or geometry state stays unavailable. Empty does
not imply disabled or zero draw. Missing power participation is `notApplicable`, not powered.

## Text-equivalent order and content

The unique located-mount list uses canonical package order and contains every hardpoint and utility
once, including pending/unavailable/defective geometry. Each item exposes as text:

- mount kind and exact slot key;
- class size or package-documented not-class-sized/unavailable state;
- empty or resolved module name/symbol state;
- engineered/stock/unavailable state;
- focused state;
- effective priority or unavailable;
- current named power state under deployed/retracted conditions; and
- top, bottom, both, pending, temporarily unavailable or package-defect location.

Visual colour, stroke, fill, dash, shape, icon and position are supplementary. Duplicate geometry
never duplicates the semantic list item.

## Projection lifecycle

- No active build publishes `noBuild` and no asset request.
- A new active hull clears prior geometry/items, starts both side loads and creates current package
  items immediately.
- A same-hull build edit reprojects item state without refetching a valid cached document.
- A condition change refreshes only owner power observations and revision-stamped presentation.
- Side completion updates occurrences/location only when hull/request identity still matches.
- Selection changes reproject focused state without a build revision.
- Unexpected projector failure publishes no stale prior-hull snapshot; the complete ledger and
  active build remain owned/usable outside anatomy.

## Verification

Tests cover both mount kinds, empty removable/resolved articles, package-populated fixed mounts,
engineering presence, all power
states, every location state, package order, cross-side repeats, wrong-kind/unknown/same-side
defects, partial side readiness, stale revisions and selection changes. Regression fixtures include
the current Federal Corvette and Lynx cross-side duplicates and at least one utility with
always-powered and deployed-only behavior.
