# Visual Reference Review

## Reference

`.design/Ship Builder.dc.html` contains wide and narrow defence compositions in canvases 1c/1d and
related anatomy concepts. It is a hierarchy/composition reference only. Package outputs, the accepted
specification, constitution and feature 011 override its sample values, interactions and CSS.

## Adopted direction

| Reference idea                                                           | Planned adaptation                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Defence is a first-class capability beside power/offence/mobility/status | Compose one Defence Profile inside `/build`, reachable from feature 003.                 |
| Shield and armour are parallel high-level regions                        | Retain two complete regions; allow fluid columns only when both remain legible.          |
| Resistance and effective pool are read together by damage type           | Use exact package resistance/EHP pairs in semantic rows/cards.                           |
| Recovery facts sit with shield strength                                  | Keep all four package recovery fields in the shield region.                              |
| Source modules sit near their aggregate                                  | Keep exact-slot source manifests near shield/armour, without assigning aggregate shares. |
| Narrow content becomes stacked cards                                     | Stack every required field at narrow widths and 400% zoom.                               |

## Required departures

- The reference's single “effective pool” and sample numbers are not package contracts. Show exact
  total strength/hit points plus all four returned EHP values.
- Its narrow view abbreviates contributions and recovery. FR-002, FR-004, FR-006 and FR-007 require
  complete returned fields at every width.
- Its module bars and grouped labels imply per-source contributions. Aggregate generator/booster/
  reinforcement/bulkhead values remain aggregates and receive no invented slot shares.
- “Integrity” is ambiguous between hull hit points and module armour. Use separate localized package
  concepts.
- The reference omits complete cell-bank fields, fitted-zero distinction, generator power state,
  module armour/protection and hull-hardness explanation. Add all accepted-spec states.
- Resistance/EHP bars cannot clamp negative or unbounded values and are omitted unless they add a
  truthful supplemental comparison.
- Anatomy overlays cannot replace textual metrics or exact-slot actions and remain feature 010's
  concern.
- Hover titles, color and fill cannot carry meaning. Every state and relationship receives visible
  and programmatic text.
- Tiny actions use shared touch-target tokens and native/shared semantic controls.
- Inline visual literals, hard-coded English, truncated names, external font dependencies and ad hoc
  breakpoints are not copied. Feature 011 tokens/messages/formatters define implementation.

## Missing reference states

The reference has no authoritative tablet, landscape, 200%-text, 400%-zoom, expanded-language, RTL,
reduced-motion, shieldless, disabled/shed generator, no-bank, all-unpowered-bank, unknown-draw,
negative-resistance, non-finite, loading or failure composition. Unknown-hull refusal belongs to the
feature 001/004 construction boundary. The screen definition
and component previews supply these states before tasks are generated; no omission reduces scope.

## Source-of-truth conclusion

The reference's two-region hierarchy and damage-row relationship are accepted. Its numbers,
abbreviations, derived visuals and incomplete states are rejected wherever they conflict with Almanac
truth, FR-001–FR-009 or feature 011. The repository's design tokens and components remain the sole
design-system source of truth.
