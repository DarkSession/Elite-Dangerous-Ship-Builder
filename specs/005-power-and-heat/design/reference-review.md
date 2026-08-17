# Visual Reference Review

## Reference

`.design/Ship Builder.dc.html` contains the relevant wide power detail in canvas
1c and the narrow power mode in canvas 1d. It is a hierarchy/composition
reference only. Package outputs, accepted specs, the constitution and feature
011 override its sample values, interactions and CSS.

## Adopted direction

| Reference idea                                                    | Planned adaptation                                                                                              |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Power is a first-class build capability beside other metric areas | Compose one Power and Heat detail inside `/build`, reachable from feature 003's headline/capability navigation. |
| Plant capacity, priority bands and module draw are adjacent       | Retain that comparison using exact selected-state package fields and complete semantic labels.                  |
| Wide panels use fluid columns                                     | Allow two-column composition when inline size supports it while keeping one semantic order.                     |
| Narrow power content becomes stacked cards                        | Use the stack at narrow widths and 400% zoom, but retain every module and field.                                |
| Heat and distributor follow power                                 | Preserve the broad hierarchy with the exact five heat scenarios and three complete capacitors.                  |
| Power marks can target fitted locations                           | Route every complete module entry to feature 002 by exact package slot key. A diagram remains supplemental.     |

## Required departures

- The reference aggregates identical modules at wide widths and truncates narrow
  content to “Top draw.” FR-006 requires one complete exact-slot entry per
  contribution, so neither behavior is retained.
- Its power charts imply locally scaled percentages and powered/unpowered
  subtraction. Only package fields are shown; visual lengths are optional and
  never presented as new values.
- Its retracted behavior does not enforce the package limitation. Retracted mode
  omits headroom, utilisation and within-budget rather than calculating them.
- Its heat rows use “cruise,” weapon alpha, shield-cell-bank and other sample
  concepts and omit required fields. Replace them with exactly `idle`,
  `thrusters`, `fsdCharging`, `firingSustained` and `firingDrained`, each with
  all five `HeatState` fields.
- “Resting heat,” “peak sustained,” heat-sink count, WEP drain/net and “100%
  module damage” reference summaries are absent unless another accepted feature
  owns an exact package result. Feature 005 does not derive them.
- Whole-pip visual blocks conflict with feature 003's half-pip allocation. The
  shared allocator supplies accessible half-step controls and feature 005 shows
  the package-returned pips.
- Hover titles, color, bar fill and pattern carry too much meaning in the
  reference. Every state, qualification and relationship receives visible and
  programmatic text.
- Tiny reference actions are enlarged through shared touch-target tokens and use
  native/shared semantic controls.
- Inline visual literals, hard-coded English, truncated names, external font
  dependencies and ad hoc breakpoints are not copied. Feature 011 tokens,
  messages, locale formatters and same-origin assets define the implementation.

## Missing reference states

The reference provides no authoritative tablet, landscape, 200%-text,
400%-zoom, expanded-language, RTL, reduced-motion, unknown-draw, projected-heat,
unavailable-distributor, unavailable-heat or non-finite-value composition. The
screen definition and component previews supply these states before tasks are
generated; no reference omission reduces the feature.

## Source-of-truth conclusion

The reference's section hierarchy is accepted. Its calculations, abbreviations,
labels and interaction details are rejected wherever they conflict with package
truth, FR-001–FR-011 or feature 011. The repository's implemented tokens and
components remain the design-system source of truth.
