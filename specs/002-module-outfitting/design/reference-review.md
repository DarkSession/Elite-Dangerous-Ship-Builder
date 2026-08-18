# Design Reference Review

## Source reviewed

- `.design/Ship Builder.dc.html`
- Canvas **1c**: wide outfitting workspace, module manifest and engineering/material regions
- Canvas **1d**: narrow slot list, change-module layer and engineering layer

The canvas is a visual/product reference, not source code, package data or a component implementation.

## Adopted decisions

| Reference decision                                    | Planning interpretation                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Dense grouped slot ledger with exact module summaries | Render all package slots in outfitting order with semantic group/list structure and explicit keys. |
| Wide selected-slot editor and candidate manifest      | Replacement and engineering compose inline without leaving `/build`.                               |
| Narrow category controls and stacked slot cards       | Same complete package slot collection reflows for touch/mobile.                                    |
| Narrow full-screen change/engineering views           | Responsive application layers with explicit cancel/apply and inert background.                     |
| Direct wide undo/redo and compact narrow actions      | Same session-history capability at every width.                                                    |
| Per-module enabled/priority control                   | Separate accessible switch/select, with package zero-based values and one-based labels.            |
| Visible engineering/material context before apply     | Draft shows package current/candidate facts and costs before one atomic decision.                  |

## Required adaptations

### Package truth and capability scope

- Every mock slot, module, count, price, stat, modifier, material and warning is illustrative. Runtime
  reads only the active `ShipLoadout` and package leaf APIs.
- Canvas anatomy nodes belong to feature 010. Headline/live statistics belong to features 003 and
  005–009. Save/import/export/help belong to features 001, 004 and 012. Feature 002 supplies
  composition outlets, not duplicate mock calculations.
- Candidate rows contain only `modulesForSlot()` stock records and package pre-engineered variants.
  “Leave empty” appears only when package removability permits an explicit remove action.
- Cargo hatch has facts and power only; it never opens replacement/engineering.
- Design “Powerplay reward” assumptions are replaced with exact package entitlement/acquisition data.
  Mercenary, tech-broker, community-goal and event-reward are not conflated.
- Variant recognition comes only from `FittedModule.preEngineeredVariant`; purchase grade stays
  separate from current ordinary grade.
- Design comparison arrows/colors are omitted because 0.1.1 does not provide trustworthy
  better/worse direction. Exact package before/current values can still be shown.

### Normalization and engineering

- The canvas/help statement that imported modules keep a partial roll contradicts the constitution.
  Every modelled grade is completed to 100%, with original quality reported in a notice.
- Fixed missing/unresolved mounts are repaired from package defaults before the workspace/calculations
  render, with slot and replaced identity disclosed.
- The engineering surface has distinct effect-only and clear-all behavior. It cannot rewrite raw
  modifier blocks or turn a fixed reward into an ordinary roll; it uses 0.1.1's structured
  `setExperimentalEffect()` operation.
- Material images cannot be fetched from the external source named in the canvas. Use package or
  repository same-origin assets where licensed/available, otherwise accessible text; never a runtime
  third-party request.

### Interaction and semantics

- Canvas clickable `div` rows/tabs/dropdowns become shared native/semantic controls.
- A slot row cannot be one interactive container around nested power controls. Selection/edit,
  enabled and priority are distinct named controls.
- Candidate selection uses radio/button semantics and explicit apply; editor draft changes are not
  immediate history steps.
- Search gains a visible label, exact result count, polite announcement, explicit no-match status and
  clear action.
- Selected, engineered, disabled, invalid/unresolved and reward states gain text/programmatic state;
  amber border, opacity, dots and icons are never the sole cue.

### Design system, localization and accessibility

- Inline canvas colors, typography, sizes, spacing, radii, elevations, durations and hover effects are
  translated into feature 011 tokens/shared components; canvas CSS is not copied.
- Google Fonts requests do not ship. Any retained typeface is licensed and self-hosted same-origin
  through feature 011/012.
- Every application label/help/refusal uses localization messages. Module, blueprint, effect and
  material names use package i18n helpers; canonical fallback is disclosed where missing.
- Abbreviations and one-based priority values have localized visible/accessibility expansions.
- Every target is at least 44 CSS px. Hover is enhancement only. Wide manifests own internal overflow;
  400% zoom uses narrow composition with no document horizontal scrolling.
- Screen-reader order follows semantic content, not three-column visual placement. Expanded/RTL text,
  200% text, 400% zoom, both orientations and reduced motion are explicit acceptance states.

## Released API constraint

Visual implementation consumes the released Almanac operations in
[../research.md](../research.md). Hiding effect-only actions for supported fixed rewards or merging
modifiers in the screen would violate the accepted spec and constitution.

## Acceptance

Feature 002 is visually accepted only when it remains recognizably consistent with the workspace and
mobile hierarchy of canvases 1c/1d **and** every adaptation above is present. Pixel similarity cannot
override package truth, feature boundaries, localization, accessibility or lossless behavior.
