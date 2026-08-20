# Design Reference Review: Ship Statistics and Status

Reviewed the rendered `.design/Ship Builder.dc.html` canvases 1c (wide outfitting) and 1d (mobile
outfitting). The reference establishes visual hierarchy and workspace relationships; the accepted
specification, constitution and repository design system remain authoritative.

## Canvas trace

### 1c — wide

- Three columns: slot ledger, fluid anatomy/detail outlet and a persistent 306px status rail.
- Central capability choices are Mounts, Power, Drives, Defence and Offence. There is no Status mode.
- Rail order is one authored Build Status warning, power, six headline cells, cost, then
  materials/Merc Coin.
- Rail headline cells omit some units/conditions; the warning list is incomplete compared with 1d.
- No load, pip or hardpoint viewing controls exist.

### 1d — narrow

- Status is one of six peer in-memory capability tabs and replaces the anatomy/detail region.
- Status order is three authored warnings, power, six headline cells, cost and materials/Merc Coin.
- A second DPS/shield/jump/power dock and the slot ledger remain below Status, duplicating values.
- The single-row six-tab control and compact cards do not meet touch, zoom or text-expansion needs.
- No load, pip or hardpoint viewing controls exist.

Tablet, both landscape arrangements and 200%/400% zoom are not shown by the reference. Their behavior
below is a planned responsive adaptation.

## Adopted reference elements

- Persistent glanceable status/requirements rail at wide desktop.
- Power-first summary followed by shield, armour, DPS, jump, speed and mass.
- Cost/material requirements after headline results, with Merc Coin visually separate from credits.
- Status as an in-workspace capability on narrow layouts rather than a new route.
- Existing build identity/header and capability-navigation relationship.

## Spec-driven extensions

- Add Status as a peer desktop capability and a clear rail action to reach it. The complete Status
  capability is the sole diagnostic record location.
- Add load, pip and hardpoint controls before affected results.
- Add independent validity/completeness facts, complete ordered issues,
  qualifications, exact targets and no-issue/no-qualification states.
- Add visible units/conditions and exact-zero, lower-bound, incomplete, unavailable, infinite,
  pending and application-failure states.
- Reflow/wrap capability navigation and cards; do not copy the fixed single-row tabs or 3-column
  mobile grid.
- Suppress the duplicate narrow summary dock and slot ledger while Status is active. Exact-slot
  actions switch to the existing slot surface.

## Rejected mock content

- Authored power/heat warnings and optional-empty warnings; they are not structural package issues.
- Reverse-engineered power bars, favorable/unfavorable colors, comparison arrows and thresholds.
- Hull-plus-modules `TOTAL`, a locally explained “rebuy 5%,” and unowned blueprint/material totals.
- Truncated/ellipsized material names and desktop/mobile diagnostic asymmetry.
- Cross-origin `edassets.org` material images and Google Fonts runtime requests.
- `.design/assets/merc-coin.png` until its provenance and reuse terms are established; text remains
  complete without it.
- Raw color literals or icon-only currency/status meaning.

## Accessibility and localization adaptation

- Shared semantic controls and 44 CSS-pixel targets replace styled `div` controls.
- Issue kind/severity and every result state are textual; color/icon remain supplemental.
- Long canonical diagnostics, exact identities, expanded translations and RTL text wrap without
  document overflow.
- Units and conditions remain visible at every width. Material names are never forced to one line.
- One polite hidden region announces settled count changes; visible content is not live.
- Components use feature 011 tokens, local/static font assets and message/formatting services.

## Conclusion

The reference's hierarchy is compatible after the additions above. The plan does not claim that the
mock contains a desktop Status capability, viewing controls or responsive/accessibility states that
it does not actually show.
