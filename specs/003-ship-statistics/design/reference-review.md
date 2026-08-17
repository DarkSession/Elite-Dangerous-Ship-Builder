# Design Reference Review: Ship Statistics and Status

Reviewed `.design/Ship Builder.dc.html` canvases 1c (wide builder) and 1d (mobile builder). These
references establish hierarchy and responsive intent; the repository design system and accepted
specifications remain authoritative.

## Adopted

- A glanceable wide status/requirements rail paired with richer central capability content.
- A mobile Status capability rather than squeezing the wide rail beside the slot workspace.
- Compact power-first hierarchy followed by headline cards and assembly requirements.
- Cards that reflow from a grid into stacked mobile content.
- Viewing context adjacent to the values it controls.

## Required adaptations

### Package authority

- Replace mock “build status” sentences with exact `ShipLoadout.validation` issues or an owning
  feature's explicit qualification. The mock's optional-empty count is not a package issue.
- Remove authored over-budget/heat interpretations unless feature 005 returns them.
- Remove comparison arrows, percentages, thresholds and favorable/unfavorable judgments without an
  authoritative package result.
- Do not add a hull-plus-modules credit total; `retailCredits()` supplies separate fields.
- Do not infer material-unit totals or blueprint counts outside feature 009.
- Power bars may use package utilisation only in the deployed state that supplies it.

### Scope

- Detailed power/heat, defence, offence, mobility/jump and cost/material content links to features
  005–009. Anatomy remains feature 010.
- Feature 003 adds no route and does not place capability state in the build fragment.
- Structural validation remains distinct from readiness or flyability.

### Presentation and assets

- Replace inline visual literals with feature 011 tokens and components.
- Do not load material imagery from `edassets.org`; use same-origin package assets where available or
  complete text presentation.
- Every number carries locale-aware formatting, unit, condition and availability state.
- Issue kind, severity and result status are textual, never carried only by colour, border or icon.

### Responsive/accessibility behavior

- Preserve every issue, qualification, condition and target on desktop, tablet, mobile, portrait,
  landscape, 200% text and 400% zoom.
- Use semantic lists/definition lists and native actions with 44 CSS px touch targets.
- Allow canonical package diagnostics, long identities, expanded translations and RTL text to wrap
  without document horizontal scrolling.
- Use one coalesced polite live-region message for settled count changes, not a live status panel.
- Honor reduced motion and retain the constitution's keyboard-operation exclusions in any conformance
  statement.

## Conclusion

The 1c/1d composition is compatible after replacing mock facts and bespoke styling with the atomic
package-backed status model and feature 011 primitives. No visual reference value is treated as a
calculation, validation rule or product requirement.
