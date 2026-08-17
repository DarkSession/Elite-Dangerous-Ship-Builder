# Visual Reference Review

## Reference

`.design/Ship Builder.dc.html` contains the relevant wide offence detail in canvas 1c and the narrow
offence mode in canvas 1d. It is a hierarchy/composition reference only. Package outputs, accepted
specs, the constitution and feature 011 override its sample values, interactions and CSS.

## Adopted direction

| Reference idea                                         | Planned adaptation                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Offence is a first-class build capability              | Compose one Offence Profile inside `/build`, reached from feature 003's headline/capability navigation. |
| Burst/sustained totals lead the wide analysis          | Retain that prominence while showing every returned total and exact scope.                              |
| Weapon identity, DPS, piercing and range are adjacent  | Keep a scannable summary, backed by a complete row/card-owned field region and exact-slot action.       |
| Damage and capacitor facts occupy a neighboring region | Retain two fluid regions where space permits, with complete textual groups and no calculated scales.    |
| Wide sections become stacked mobile cards              | Use the stack at narrow widths and 400% zoom while retaining every field, state and action.             |
| Hardpoint entries can target fitted locations          | Route every returned weapon to feature 002 by exact package slot key.                                   |

## Required departures

- The reference's “DPS by range band” is damage-at-range aggregation, explicitly outside feature
  scope. Remove all four sample ranges, bars and figures; do not call the data-free falloff helper.
- Shot convergence, impact-plane geometry, target range, lateral/vertical span, apparent spread and
  widest-mount calculations are out of scope and absent in both wide and narrow designs.
- Percentage damage bars calculate shares and visually partition anti-xeno/conventional damage.
  Replace them with complete textual burst/sustained package amounts and overlay wording.
- “VS 45% resist,” “vs shield,” “vs hull,” corrosion bonus and target-adjusted output are target
  simulation. Remove them rather than supplying a default target.
- “Alpha” and any combined volley metric are absent because `WeaponTotals` does not return one.
- The sample weapon list omits most `WeaponMetrics`, damage types, ammunition details, continuous
  state, power/heat costs and missing-value states. The planned row/card details add every field.
- The sample range/piercing numbers cannot be sourced from beta.12's `weaponMetrics()` result.
  Implementation waits for Almanac #300; the mock values are never copied.
- The reference visually orders weapons but beta.12 can return imported module order contrary to its
  declaration. Preserve returned order and track Almanac #301 instead of silently sorting.
- Capacitor bars imply locally normalized draw/recharge/duration. Show exact capacity, recharge,
  sustained draw, net drain and duration as semantic facts unless a future package scale exists.
- “14 s fire” becomes field-specific package `timeToDrain` wording. Infinity distinguishes positive
  sustained draw from zero/no powered load, and zero capacity remains visible.
- Whole-pip reference blocks conflict with feature 003's shared half-pip allocation. Use the shared
  valid-six-pip control and returned WEP value.
- The reference supplies no no-weapon, unresolved hardpoint, all-disabled, genuine-zero,
  no-ammunition, unlimited-ammunition, missing range/piercing, zero-capacity or no-powered-distributor
  states. The planned surface/components cover all of them.
- Hover titles, color, bar fill and position carry too much meaning. Every state, type and
  relationship receives visible and programmatic text.
- Tiny reference actions are enlarged through shared touch-target tokens and use native/shared
  semantic controls.
- Inline visual literals, hard-coded English, truncated names, external font dependencies and ad hoc
  breakpoints are not copied. Feature 011 tokens, messages, locale formatters and same-origin assets
  define implementation.

## Missing responsive/accessibility reference states

The reference provides no authoritative tablet, landscape, 200%-text, 400%-zoom,
expanded-language, RTL, reduced-motion, screen-reader, unavailable-field or semantic-infinity
composition. The screen definition and component previews supply these states before tasks are
generated; no reference omission reduces the feature.

## Source-of-truth conclusion

The reference's offence section hierarchy and wide-to-stacked direction are accepted. Its
calculations, percentages, target model, convergence model, sample values, interaction shortcuts and
styles are rejected wherever they conflict with package truth, FR-001–FR-007 or feature 011. The
repository's implemented tokens and components remain the design-system source of truth.
