# Design Reference Review: Hull Anatomy

`.design/Ship Builder.dc.html` canvases 1c and 1d define the visual hierarchy for this plan. They are
composition references only; their markup, CSS, data and assets are not implementation inputs.

## Adopted hierarchy

- Hull Anatomy stays inside the active build workspace beside the complete outfitting ledger.
- Wide layout may show labelled top and bottom plates together with one shared selected mount.
- Narrow/zoomed layout uses a labelled top/bottom selector and one bounded plate.
- A concise legend explains visible mount state.
- Geometry and ledger selection synchronize: selecting a node marks the ledger row and titles the
  fitting bench, and nothing else on the screen restates it.
- A `MOUNTS` mode carries kind, fitted, empty, engineered and selected state, and no power state.
- The plates hold one whole hull each at their own ratio; nothing pans and nothing scrolls.
- Compact anatomy precedes the bench. It follows the slot ledger rather than preceding it, which is
  the workspace grid's source order and a deviation recorded in `hull-anatomy.md`, "Narrow, mobile and
  zoomed".

## Critical utility correction

The mock's utility presentation is not game data. Its private Anaconda bottom SVG labels the shapes as
hardpoints; the HTML relabels numbered nodes 7/8 as utilities, and mobile code classifies utilities
with `Number(hp) > 6`. The wide selection path still says “Hardpoint” for them.

The accepted spec requires utilities to receive the same interaction, state, detail and navigation
as hardpoints. Production therefore ignores all mock classification and admits utilities only from
Almanac `data-feature="utility_mount"` plus an exact resolved package `kind === 'utility'` slot.

## Required adaptations

| Reference detail                                    | Planned correction                                                                                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed 1560px and separate 390px canvases            | One container-responsive capability covering all five required layouts, zoom and text expansion                                                                         |
| Hard-coded Anaconda technical SVGs                  | Exact active package symbol; the installed `schematic-top/bottom.svg` rasterised to PNG and its mounts extracted to JSON at build time, and the SVG itself never served |
| A private hull image already lying nose-left        | The package's own nose-up document, turned a quarter turn and cropped to the hull, at the hull's own proportions                                                        |
| Percentage coordinates and numbered `data-hp` nodes | The canvas's numbered mark, placed from the annotation's own published coordinates and named by `data-journal-slot`; nothing measured off the DOM, nothing stored       |
| `Number(hp) > 6` utility logic                      | Exact `utility_mount` annotation plus matching package utility slot                                                                                                     |
| Mock utility nodes on weapon geometry               | Discard; render all real Almanac utility occurrences                                                                                                                    |
| Mock fitted and engineering values                  | Same-revision feature 002 slot view; the mock's priority and power belong to the `POWER` mode                                                                           |
| Node-number/size badges                             | Exact package key/kind/size semantics; utility is not class zero                                                                                                        |
| Small 14–30px nodes and hover titles                | The canvas's own `clamp(14px, 3.06cqw, 22px)` mark as a named button; keyboard operation per mount and SC 2.5.8's Equivalent exception, proved (FR-012)                 |
| Color/dash/icon-only state                          | Every occurrence's accessible name states kind, side, fitted state and engineering in words                                                                             |
| Hover scaling and unconditional transition          | Optional supplementary hover only; reduced-motion-aware tokenized motion                                                                                                |
| `MOUNTS/POWER/DRIVES/DEFENCE/OFFENCE/STATUS` modes  | All five drawn in the canvas's order; feature 010 owns `MOUNTS`, and the other four are disabled until features 005 to 008 draw them                                    |
| Fitting/engineering bench below anatomy             | Remains feature 002, and is the selected mount's facts; feature 010 adds no second detail block                                                                         |
| Engineered icon offset from a node                  | The canvas's own offset icon on the mark, from the mark's own box rather than from the drawing; the legend carries the same icon rather than a square                   |
| `HELP & FAQ` in the application menu (1d)           | Stays feature 012's; feature 010 draws no provenance control (design/hull-anatomy.md, FR-011)                                                                           |
| Mock convergence/offset/direction measurements      | Remove; the design draws no such facts and package geometry is not measured                                                                                             |
| Inline colors/type/spacing/durations                | Shared feature 011 tokens/components only                                                                                                                               |
| Google Fonts preconnect and remote font CSS         | No automatic cross-origin request; use shared same-origin/system typography                                                                                             |
| Hard-coded English/title-only labels                | Feature 011 localization/game text and semantic names/relationships                                                                                                     |
| No loading/offline/schema/defect states             | Independent side lifecycle, retry/recovery and ledger-preserving defect surfaces                                                                                        |
| Generic/incomplete help licence overlay             | Feature 012 owns it; feature 010 emits no help intent and hard-codes no route                                                                                           |

## Accessibility gaps corrected

- Clickable `div` nodes/tabs/rows become shared semantic controls or explicitly named SVG controls
  with state and relationships.
- Both sides have visible headings and accessible image descriptions.
- Feature 002's ledger already represents every hardpoint and utility exactly once in package
  order, and remains the route to every slot it draws, with or without artwork.
- Side availability, selected state and side failure are text, and a side change is announced once.
- Geometry state is never conveyed by color/shape/position alone.
- Every occurrence is a named button, operable by keyboard and pointer without hover, and raised
  above the marks it overlaps while it is being worked with.
- Desktop, tablet/mobile portrait/landscape, 200% text, actual 400% zoom, RTL expansion and reduced
  motion are explicit preview/test states.
- Axe runs in Chromium and Firefox; manual screen-reader checks verify the plates, occurrence names
  and cross-side duplicate relationships.

The result keeps the reference's dense technical-instrument character and wide/narrow hierarchy
while removing every fabricated game assertion, private asset and inaccessible interaction.
