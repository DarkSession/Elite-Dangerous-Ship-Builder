# Visual Reference Review

## Reference

`.design/Ship Builder.dc.html` contains the relevant compositions in canvas 1c (wide Outfitting,
Defence Analysis selected) and canvas 1d (390px mobile Outfitting, Defence selected). It is a design
hierarchy reference, not source code, package data, a responsive implementation or an accessibility
contract.

## Reference observations

- Canvas 1c uses a fixed three-column shell: slot ledger, fluid analysis and Status rail. Defence
  replaces the anatomy center with equal shield/armour cards.
- Its shield card shows a headline, four damage rows, three recovery facts, grouped module bars and
  one terse bank row. Armour mirrors the headline/damage/source pattern and adds hardness,
  “module protection” and “integrity.”
- Canvas 1d is separately authored fixed-width markup, not a responsive transformation of 1c. It
  stacks shield then armour but removes resistance percentages, most recovery content, banks,
  hardness and module-protection detail. Status becomes a separate capability.

## Adopted direction

| Reference idea                                  | Planned adaptation                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Defence is a first-class workspace mode         | Keep one `defenceProfile` capability inside `/build`; add no route.                    |
| Shield and armour are visual peers              | Use two complete fluid regions only while both remain legible; otherwise stack.        |
| Resistance and EHP read together by damage type | Pair exact same-type package values in semantic rows/cards.                            |
| Recovery sits with shields                      | Keep both rates and both durations adjacent to the shield profile.                     |
| Fitted modules sit near their aggregate         | Show exact-slot fitted-role records without a contribution value/provenance claim.     |
| Narrow content stacks                           | Preserve the same complete semantic order and every field in one stack.                |
| Wide workspace retains surrounding context      | Compose with feature 002's ledger and feature 003's Status surfaces when space allows. |

## Required departures

- The reference's “effective pool” headline is ambiguous. Show package total strength/hit points and
  all four returned EHP values explicitly.
- Add missing shield mass multiplier, boost multiplier, SYS resistance and visible selected SYS
  pips.
- Add broken regeneration rate and keep the two recovery durations separate.
- Replace the single bank-reserve row with exact totals and every returned bank field/state/action.
- Replace ambiguous armour “integrity” with distinct hull HP, module armour, module protection and
  hardness concepts using correct units.
- Explain hardness against weapon armour piercing without creating a matchup.
- Keep mobile resistance values, all contributions, recovery, banks, hardness and protection; the
  mock's compact footer is not a complete product.
- Grouped booster/reinforcement bars cannot imply per-module aggregate shares. Numeric aggregates
  remain separate from exact-slot fitted-role rows.
- The signed negative resistance bar in the mock is misleading. Bars are supplemental only with a
  truthful scale; signed/non-finite cases may use text alone.
- Add missing/null, disabled, shed, unresolved, invalid, no-bank, all-unpowered, unknown-power,
  zero, negative, infinity, pending and failure states.
- Replace fixed 1560/390 widths, tiny/ellipsis text, ~30px tabs, clickable `div`s, hover/title
  dependence and color-only meaning with feature 011 primitives/tokens.
- Do not copy inline colors, spacing/type/motion literals, hard-coded English, `en-US` formatting,
  external Google Fonts or cross-origin asset links.

## Responsive conclusion

The canvases are two compositional endpoints, not breakpoints. Available inline size decides whether
the two complete regions sit side by side. Tablet, landscape, text expansion and zoom are independent
constraints. A separate abbreviated mobile data model is prohibited.

## Source-of-truth conclusion

Adopt the reference's capability hierarchy, peer defence regions, damage relationship and stacked
order. Reject its sample values, arithmetic implications, incomplete state set and implementation
literals wherever they conflict with FR-001–FR-009, Almanac or the constitution. Repository tokens,
components and these plan-time screen definitions remain authoritative.
