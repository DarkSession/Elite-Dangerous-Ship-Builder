# Design Reference Review: Hull Anatomy

`.design/Ship Builder.dc.html` canvases 1c and 1d define the visual hierarchy for this plan. They are
composition references only; their markup, CSS, data and assets are not implementation inputs.

## Adopted hierarchy

- Hull Anatomy stays inside the active build workspace beside the complete outfitting ledger.
- Wide layout may show labelled top and bottom plates together with one shared selected mount.
- Narrow/zoomed layout uses a labelled top/bottom selector and one bounded plate.
- A concise legend explains visible mount state.
- Geometry and ledger selection synchronize.
- Selected facts remain close to the plates without becoming a second editor.
- Native internal overflow may contain a large schematic without page horizontal scrolling.
- Compact anatomy precedes the slot list/editor on narrow layouts.

## Critical utility correction

The mock's utility presentation is not game data. Its private Anaconda bottom SVG labels the shapes as
hardpoints; the HTML relabels numbered nodes 7/8 as utilities, and mobile code classifies utilities
with `Number(hp) > 6`. The wide selection path still says “Hardpoint” for them.

The accepted spec requires utilities to receive the same interaction, state, detail and navigation
as hardpoints. Production therefore ignores all mock classification and admits utilities only from
Almanac `data-feature="utility_mount"` plus an exact resolved package `kind === 'utility'` slot.

## Required adaptations

| Reference detail                                    | Planned correction                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Fixed 1560px and separate 390px canvases            | One container-responsive capability covering all five required layouts, zoom and text expansion |
| Hard-coded Anaconda technical SVGs                  | Exact active package symbol and installed `schematic-top/bottom.svg` copied to build output     |
| Percentage coordinates and numbered `data-hp` nodes | Exact package path/circle geometry and `data-journal-slot`; no measured/stored coordinates      |
| `Number(hp) > 6` utility logic                      | Exact `utility_mount` annotation plus matching package utility slot                             |
| Mock utility nodes on weapon geometry               | Discard; render all real Almanac utility occurrences                                            |
| Mock fitted, engineering, priority and power values | Same-revision feature 002 slot view and generalized feature 005 observation                     |
| Node-number/size badges                             | Exact package key/kind/size semantics; utility is not class zero                                |
| Small 14–30px nodes and hover titles                | Exact-shape 44px hit clones plus independent 44px semantic list controls                        |
| Color/dash/icon-only state                          | Complete visible/programmatic text, selected facts and unique text equivalent                   |
| Hover scaling and unconditional transition          | Optional supplementary hover only; reduced-motion-aware tokenized motion                        |
| `MOUNTS/POWER/DRIVES/DEFENCE/OFFENCE/STATUS` modes  | Feature 010 owns mounts only; other capability surfaces retain their data                       |
| Fitting/engineering bench below anatomy             | Remains feature 002; feature 010 adds selected facts, not another editor                        |
| Mock convergence/offset/direction measurements      | Remove; FR-008 permits no such facts and package geometry is not measured                       |
| Inline colors/type/spacing/durations                | Shared feature 011 tokens/components only                                                       |
| Google Fonts preconnect and remote font CSS         | No automatic cross-origin request; use shared same-origin/system typography                     |
| Hard-coded English/title-only labels                | Feature 011 localization/game text and semantic names/relationships                             |
| No loading/offline/schema/defect states             | Independent side lifecycle, retry/recovery and ledger-preserving defect surfaces                |
| Generic/incomplete help licence overlay             | Context action opens feature 012's accepted in-place artwork/data provenance modal              |

## Accessibility gaps corrected

- Clickable `div` nodes/tabs/rows become shared semantic controls or explicitly named SVG controls
  with state and relationships.
- Both sides have visible headings and accessible image descriptions.
- One semantic list represents every hardpoint and utility exactly once in package order.
- Side availability, selected state, current power and defects are text and announced once.
- Geometry state is never conveyed by color/shape/position alone.
- 44px direct and list targets, native pan and non-hover operation support touch/pointer.
- Desktop, tablet/mobile portrait/landscape, 200% text, actual 400% zoom, RTL expansion and reduced
  motion are explicit preview/test states.
- Axe runs in Chromium and Firefox; manual screen-reader checks verify geometry/list/detail and
  duplicate relationships.

The result keeps the reference's dense technical-instrument character and wide/narrow hierarchy
while removing every fabricated game assertion, private asset and inaccessible interaction.
