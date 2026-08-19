# Visual Reference Review

## Reference scope

`.design/Ship Builder.dc.html` is a local, ignored visual reference, not a
runtime asset or source of game values. Feature 005 appears in:

- canvas `#1c` (“Outfitting … live stats”), beginning around line 621;
  its Power tab is part of the central analysis area and reveals
  `data-anat-detail="power"` around lines 966–1184;
- canvas `#1d` (“Mobile — full outfitting …”), beginning around line 1745;
  its stacked `data-m-mode="power"` appears around lines 2083–2155.

The package, accepted specs, constitution and implemented feature 011 design
system override every sample number, label, interaction and CSS literal.

## Adopted direction

| Reference idea                                         | Planned adaptation                                                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Power and Thermals is a peer build-analysis capability | Compose one `powerAndHeat` capability inside `/build`, reachable from feature 003's power summary and workspace capability selection. |
| Selected hardpoint state precedes power analysis       | Reuse feature 003's shared condition group and present one selected package state, default deployed.                                  |
| Capacity, priority bands and module draw are adjacent  | Keep this comparison with all five bands, exact package fields and one row per returned consumer.                                     |
| Heat follows power, then distributor                   | Preserve that semantic/narrow order with the exact five heat scenarios and all three complete capacitors.                             |
| Wide panels form a compact dashboard                   | Use fluid design-system regions where inline space supports them without changing semantic order.                                     |
| Mobile analysis becomes stacked cards                  | Stack complete content at narrow widths, landscape phones, expanded text and 400% zoom.                                               |
| Power warnings also appear in build status             | Supply feature 003's compact revision-stamped power projection; feature 003 owns its rail/capability placement.                       |
| Power facts can augment hardpoint geometry             | Supply feature 010's exact-slot observation port; diagrams remain supplemental to complete text.                                      |

## Required departures

### Power

- Both mock variants show only groups 1–4 although the package has five. All
  five bands remain present, including zero draw.
- Desktop module rows aggregate identical weapons; mobile truncates to “TOP
  DRAW.” FR-005/FR-006 require one complete package consumer per exact slot.
- Module rows omit exact slot, enabled, priority and deployed-only state. The
  implementation includes each and a named slot action.
- Mock bars/percentages imply local scaling and “powered draw/unpowered”
  subtraction. Only returned fields are values; any bar is supplemental.
- Retracted mode must omit package deployed-only headroom, utilisation and
  within-budget fields instead of adapting the mock summary tiles.
- Disabled-consumer and zero-capacity states are absent from the mock and are
  explicit in the implementation.
- Ledger priority/enabled controls around lines 759–870 remain feature 002
  editing; feature 005 displays and links only.

### Distributor

- Desktop shows capacity, max recharge, pips and recharge, but mobile omits
  capacity/rated recharge. Every size presents all fields.
- Pip blocks are visual-only and whole-pip. Feature 003's accessible half-pip
  draft/Apply control is reused.
- The mobile filled blocks and its “3 · 1 · 2 PIPS” footer are internally
  inconsistent. Neither is acceptance data.
- Package null and genuine zero receive distinct states missing from the mock.

### Heat

- Desktop uses six non-contract scenarios; mobile uses four. Replace them with
  exactly `idle`, `thrusters`, `fsdCharging`, `firingSustained` and
  `firingDrained`.
- Every scenario must show thermal load, heat level, gauge, overheat and time
  to overheat. The mock omits most of those fields.
- Plant efficiency, hull heat capacity and projection/unavailable/non-finite
  states are added.
- Cruise, weapons alpha, shield-cell bank, heat-sink count, resting/peak heat,
  WEP net and “100% module damage” are not inferred by feature 005.

### Interaction and implementation

- Clickable `div` tabs/state choices, title-only meaning and tiny targets
  become shared semantic controls with visible matching names/states.
- Color, fill, pattern, position and hover never carry a state without text.
- Fixed widths, ellipsis, tiny type, hard-coded English, number formatting,
  Google Fonts and remote asset references are not copied.
- Feature 011 tokens, bundled messages/formatters, same-origin assets and shared
  target sizes govern implementation.

## Missing reference states

The reference has no authoritative tablet, landscape, 200%-text, 400%-zoom,
expanded-language, RTL, reduced-motion, no-build, pending, error, group-5,
unknown-draw, heat-projection, unavailable-distributor/heat or semantic
infinity state. The screen and preview definitions supply them; no design
omission reduces the accepted requirements.

## Source-of-truth conclusion

Adopt the Power and Thermals hierarchy and dark dashboard density. Reject every
sample calculation, abbreviation and unsupported scenario. The repository's
feature 011 tokens/components are the visual source of truth, while the fixed
Almanac release is the sole game-result source.
