# Responsive Composition

## Derived layout modes

The reference supplies wide and 390px compact examples. Feature 011 adds the missing medium behavior
and lets available content space—not a device label alone—choose composition.

| Mode    | Composition rule                                                                         | Reference basis        |
| ------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| Wide    | Master-detail or multi-region workspace; centered dialogs                                | Canvases 1a and 1c     |
| Medium  | Two regions where relationships remain legible; secondary region moves below or drill-in | Synthesized for tablet |
| Compact | Single semantic flow; route-backed/full-height drill-ins; sheets for simple tasks        | Canvases 1b and 1d     |

The command bar is not in that table. It composes at a step of its own — inline identity and
actions above the width the widest shipped language needs for them, one row and a named menu below —
because what decides it is the bar's own content rather than the page's
(`_responsive.scss`, `$mode-bar-folded-max`).

Container queries govern reusable component composition. Page-level media queries govern shell and
route regions. Both use named tokens; the reference canvas widths are not copied as breakpoints.

A component may ask the window for the one thing its container cannot report: the viewport's height.
A container query measures the box, and a box's inline size does not say whether the window it is in
is a short one — a landscape phone and a bounded desktop column present the same width. Where an
arrangement needs both axes, the container query states the inline condition and a `short-viewport`
media query states the other, nested inside it. The composition still belongs to the component; the
window is only asked what it alone knows (feature 010's plate pair,
`specs/010-hull-anatomy/design/hull-anatomy.md`, "Intermediate tablet").

## Shipyard-pattern derivation

- Wide: semantic sortable manifest plus selected detail rail.
- Medium: the manifest keeps its own composition and the detail is a route-backed drill-in over it,
  in both orientations. A two-pane medium was allowed here until 2026-08-30; feature 001 measured it
  and closed it, because a manifest of 48 records is several screenfuls and a detail stacked under
  them is a screen the reader has to scroll the whole list to reach
  (`specs/001-ship-selection-and-loading/design/hull-detail.md`, "Every width below the rail's is
  the sheet's"). A pattern that fits in the medium band is still allowed one; the shipyard's does
  not.
- Compact/zoom: semantic stacked records, named sort/filter controls and full-height detail/library
  layers. Internal horizontal controls may scroll only when labelled and when every choice remains
  discoverable; the page never scrolls horizontally.

## Workspace-pattern derivation

- Wide: ledger, active work/anatomy region and status rail share the viewport.
- Medium landscape: ledger plus active region stay side by side; status moves into an adjacent or
  following named region.
- Medium portrait: active region precedes a category/status drill-in while the same actions remain.
- Compact/zoom: mode tabs, one active panel, category ledger and full-screen editors reproduce all
  wide capabilities. Sticky actions reserve space and do not cover the final content row.

## Adaptive layer rule

| Content kind                         | Wide/medium                         | Compact/short landscape                |
| ------------------------------------ | ----------------------------------- | -------------------------------------- |
| Confirmation or short form           | Named centered dialog               | Sheet; promote if content does not fit |
| Searchable collection/detail chooser | Dialog or route-backed detail panel | Full-height drill-in                   |

A chooser whose collection does not fit beside its detail in the medium band takes the compact
column there too. The table gives the roomier option where there is room for it, not a floor.
| Complex editor | In-workspace panel or large dialog | Full-height editor |
| Global/context action list | Inline actions or named popup layer | Named sheet/full-height action layer |

All variants share one state/intent contract. Background inertness, title/description, dismissal and
invoker restoration do not change with presentation.

**One scrollbar at a time (2026-08-26).** A layer scrolls inside its own box. The platform's
`<dialog>` makes the page behind it inert but leaves it scrolling, so a full-height layer on a phone
drew a second bar down the same edge and a flick on the wrong one moved a page the layer had already
put out of reach. The document stops scrolling for as long as any layer is open — `html:has(dialog[open])`
in the global base, so it holds for every layer in the application and for a nested one without a
count to keep. The scroll position is not reset, so dismissal puts a Commander back where they were.

## Text, zoom and bidi

- Relative typography and intrinsic block sizing support 200% text without clipped labels or controls.
- At the 320 CSS-pixel reflow proxy and actual 400% browser zoom, compact composition is allowed;
  required two-dimensional content owns a labelled internal scroller, never document overflow.
- Long translated strings wrap. Truncation may supplement only when full text is available through a
  persistent touch/pointer disclosure and no ambiguity remains.
- Logical properties define inline/block placement. RTL changes visual flow without changing semantic
  DOM/reading order. Technical ids/numbers are bidi-isolated.
- Portrait and landscape preserve capability and state; short height may promote a sheet to a
  full-height scrollable layer.

## Motion and visual equivalence

Reference hover/node transitions become tokenized enhancements. Reduced motion makes nonessential
correlation/layer transitions immediate. Selection, status and change remain visible in text and
programmatic state, so disabling motion or forcing color does not remove meaning.
