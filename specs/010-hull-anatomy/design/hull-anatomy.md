# Screen Definition: Hull Anatomy

## Purpose and parent

Hull Anatomy is a capability inside feature 001's active `/build` workspace. It lets a Commander
locate and select both weapon hardpoints and utility mounts on Almanac top/bottom schematics, inspect
their exact current state and move to/from feature 002's outfitting slot. It adds no route and is not
available without an active build.

## Information order

The semantic order is stable across all layouts:

1. localized Hull Anatomy heading, active hull context and feature 012 provenance/help action;
2. side availability summary and, when constrained, labelled top/bottom selector;
3. labelled top and bottom schematic regions (or the selected single region);
4. complete state legend;
5. selected mount facts, when the selected slot is located;
6. unique hardpoint-and-utility text equivalent in package order; and
7. feature 002's complete slot ledger/editor context.

Visual columns never reorder this reading sequence.

## Responsive composition

### Wide

When container space accommodates both without shrinking targets/text, top and bottom render as two
fluid labelled columns. They share one selected state, legend, selected facts and unique list. The
complete ledger remains beside the capability according to the feature 002 workspace definition.

### Intermediate tablet

Container queries choose paired or single-side presentation from available inline size and expanded
text, not a named device breakpoint. In portrait the schematics may stack or use the side selector;
in landscape they may pair. Nothing required disappears in either orientation.

### Narrow, mobile and zoomed

One labelled side renders at a time with 44px top/bottom selector controls. Anatomy precedes selected
facts and the unique list, matching canvas 1d's hierarchy. Selecting a mount reveals its feature 002
category/row or exact-slot layer; a named return preserves anatomy context. At 400% zoom and long/RTL
text, every group stacks and only the schematic viewport may scroll horizontally.

## Schematic regions

- Each side names hull and orientation in visible/programmatic text.
- Artwork is rendered from the validated typed package tree at its package viewBox; no private
  technical image or background overlay is used.
- Only a package `hardpoint` resolving to a hardpoint slot or `utility_mount` resolving to a utility
  slot receives interaction. All other annotated features remain inert artwork.
- Every admitted occurrence renders its exact package shapes plus an exact-shape transparent
  non-scaling hit clone using the shared target-size token. Geometry is never moved or measured.
- Occurrence state comes from the one canonical mount item. A cross-side repeat has two side-specific
  accessible names but identical fitted/engineering/focused/power state.
- Bounded native overflow provides panning with visible affordance. No custom zoom/drag matrix,
  coordinate read or stored pan model exists.

## Legend and visual language

The shared legend explains supplementary treatments for:

- hardpoint and utility kind;
- fitted and empty;
- engineered and stock;
- focused (the shared selected slot);
- disabled, inactive while retracted, powered, priority-shed and qualified/unavailable power.

Each entry uses the same localized text as items. No color, fill, stroke, dash, opacity, shape, icon
or animation carries meaning alone. Qualified/unknown power never receives powered or shed styling.

## Selected mount facts

When a located hardpoint or utility is selected, show:

- exact slot key and localized kind;
- package class size, not-class-sized utility state or unavailable;
- empty or resolved module name/symbol;
- engineered, stock or unavailable state;
- focused state from the shared selected slot;
- effective one-based priority or unavailable;
- current disabled/inactive/powered/shed/not-applicable/qualified state under the named deployed or
  retracted condition;
- top, bottom, both or unavailable/defect location; and
- one exact feature 002 slot action only when the surrounding ledger/editor does not already expose
  it.

This summary is not an editor. It contains no weapon statistics, direction, distance, convergence,
mass, cost or coordinate.

## Unique located-mount text equivalent

- One semantic item exists for every package hardpoint and utility, in filtered
  `ShipLoadout.slots()` order, even before geometry loads.
- Each item repeats all selected-fact state plus current location and provides an independent 44px
  exact-slot action.
- Hardpoint and utility may be visibly grouped only if group headings do not change the underlying
  package order or hide either kind from assistive navigation.
- Cross-side repeats remain one item with “top and bottom” location.
- Pending, temporary-unavailable and package-defect location states are named without guessing.
- The list supplements rather than replaces feature 002's complete ledger.

## Two-way movement

- Geometry/list activation emits only the canonical slot key to feature 002.
- A selected located ledger item identifies all occurrences. Narrow view keeps the current
  containing side, otherwise chooses top then bottom.
- Nearest native `scrollIntoView` reveals the occurrence; smooth movement is disabled when reduced
  motion is requested.
- Selecting an internal or currently unlocated slot leaves its ledger/editor active and shows no
  false anatomy selection.
- Geometry, list and ledger all expose the same selected state; locale or side changes create no
  build/history revision.

## Loading, failure and defect states

| State                                   | Presentation and behavior                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Both loading                            | Two named placeholders or selected-side placeholder; unique list and complete ledger usable |
| One ready, one loading                  | Render ready side immediately and preserve peer pending text                                |
| One temporarily unavailable             | Side-local explanation/retry; ready peer, facts, lists and editor unchanged                 |
| Both temporarily unavailable            | Named explanations/retries; no claim that the hull lacks geometry                           |
| Uncached offline                        | Temporary wording plus automatic online retry; no reload required                           |
| Invalid/unsafe SVG                      | Reject side, show package-defect status and modal/report route; never inject markup         |
| Unknown/wrong-kind annotation           | Omit occurrence, report exact package defect once, retain canonical item/ledger slot        |
| Same-side duplicate                     | Omit ambiguous duplicate occurrences rather than choose by drawing order                    |
| Missing geometry after both valid sides | Mark item package-defective; retain unique/complete text routes                             |
| Selected internal slot                  | No selected anatomy facts/geometry; ledger/editor remains selected                          |
| Unexpected projection failure           | Bounded alert; no stale previous-hull geometry; complete ledger/editing remain usable       |

Initial and unchanged availability is silent. Side failure/recovery and settled selected/state changes
produce one localized revision-keyed announcement rather than repeating every SVG occurrence.

## Component-system impact

Feature 010 extends feature 011 with reusable presentation-only components/previews for:

- typed static SVG schematic rendering;
- side selector and side-local asset status;
- tokenized mount state/hit treatment;
- mount-state legend;
- selected mount facts; and
- unique mount list item/location state.

Each component accepts immutable view state, emits typed intent, owns semantics/44px targets and has
default, populated, empty, loading, error, disabled, long-text/RTL and desktop/tablet/mobile previews.
No component reads `ShipLoadout`, services or stores directly.

## Requirement mapping

The schematic regions own FR-001–FR-003, FR-005–FR-007, FR-009, FR-010 and FR-012. Selected facts
own FR-005/FR-008. The unique list owns FR-004–FR-008, FR-010 and FR-012. Feature 002's complete
ledger supplies the invariant all-slot fallback for FR-004/FR-006/FR-010. Feature 012's modal entry
satisfies FR-011.
