# Offence Profile

**Route context**: complete capability inside `/build`; no new route

**Design-system composition**: shared workspace capability heading/navigation; feature 003 condition
control/current-condition summary; metric definition groups; semantic status, qualification and
not-stated text; row/card-owned disclosures; exact-slot actions; localized game text and values.

## Purpose

Let a Commander read every package-returned build weapon field, understand damage-type meaning,
inspect each returned weapon and see selected-WEP capacitor endurance without selecting a target or
leaving the active build.

## Entry, exit and ownership

- Feature 003's sustained-DPS headline/detail target opens Offence in one activation. The workspace
  capability selector may also select it.
- Selected capability and expanded weapon details are memory-only and never enter build data,
  storage, history, route state, links or SLEF.
- Every weapon/unresolved action carries the shared exact-slot target to feature 002. Wide layouts
  reveal/select inline outfitting; narrow layouts open the selected-slot layer with a named return.
- Feature 003 owns viewing-condition editing. This surface may compose the shared control but never a
  WEP-only divergent store.
- Losing the active build returns to feature 001's workspace no-build state; feature 007 never creates
  a placeholder hull.

## Semantic information order

1. capability heading and concise active-build context;
2. settled WEP and deployed-firing context, with shared condition action;
3. complete enabled returned-weapon totals;
4. complete burst and sustained damage-type groups with AX overlay explanation;
5. six capacitor fields, semantic duration and owner-supplied distributor power observation;
6. unresolved/coverage qualification, when present;
7. complete returned weapon collection and exact-slot actions.

At roomy widths, items 3–5 may occupy two fluid regions and the weapon collection spans available
width. Tablet uses available container space, not a device-name breakpoint. At narrow widths,
landscape phones, expanded text and 400% zoom, every group stacks in the semantic order. No value or
action is omitted, abbreviated into ambiguity or moved to hover.

## Whole-build totals

- Lead with burst and sustained DPS as separate labelled values; never repeat the mock's contradictory
  sample labels.
- State the package scope as enabled returned weapons, not powered firing output.
- Show burst/sustained WEP draw and heat, followed by thermal load and deployed plant draw.
- Use complete label/value/unit relationships. Numeric zero remains numeric and is qualified only by
  adjacent coverage/weapon state.
- Display the exact package total even when all weapons are disabled, a weapon is genuine zero or an
  unresolved occupied hardpoint makes the overall build coverage incomplete.

## Damage types

- Present burst and sustained as separate complete groups.
- Show exact kinetic, thermal, explosive, absolute and anti-xeno values.
- When optional unclassified is present, show it. When absent, omit the optional row or state no
  unclassified damage; do not call the package-defined zero meaning unavailable.
- Identify anti-xeno as an overlay on conventional output every time the relationship could be
  misunderstood.
- Use no calculated percentage, stacked share, combined AX total or target adjustment.

## Weapon capacitor

- Show the returned WEP allocation and all six exact result fields: allocation, capacity, recharge,
  powered deployed sustained draw, net drain and time to drain.
- Positive finite duration is localized seconds; zero means immediate drain; positive-draw infinity
  means the powered firing load is sustained with no net drain; zero-draw infinity means no draining
  powered firing load and does not claim the weapons can fire.
- Show feature 005's deployed distributor observation as a separate fact, especially beside zero
  capacity. Do not state a cause merely because the facts are adjacent.
- Explicitly distinguish total weapon sustained WEP draw from powered capacitor draw.
- Initial design is textual. A future visual needs a package-authored scale and a complete nearby text
  equivalent; no local capacity/drain normalization is allowed.

## Weapon collection

Each returned weapon has an always-available summary and a same-entry complete detail region.

Summary content:

- localized package game text plus disclosed fallback when needed;
- exact slot and enabled/disabled text;
- burst and sustained DPS;
- effective range/piercing availability;
- ammunition meaning;
- distinct details control and exact-slot action.

Complete details expose every returned field:

- damage per shot, burst/sustained fire rate and continuous-fire state;
- burst/sustained damage, WEP draw and heat;
- thermal load and deployed plant draw;
- both full damage-type groups with absent-means-zero unclassified and AX overlay meaning;
- effective maximum/falloff distance, separately named projectile boundaries and piercing when
  returned; field-specific not-stated text otherwise;
- full-rearm clip, hopper, total and unlimited state, or no-ammunition meaning;
- one action named for that weapon and exact slot.

At wide widths, summaries may be rows with row-owned disclosures. At narrow widths they become
labelled cards/details. The details control and slot action are separate feature-011-sized targets;
activating the card itself does not navigate. Expanded state never hides the slot route.

The collection preserves package order. It neither sorts nor merges identical module symbols.

## Coverage, empty and qualification states

- Empty returned weapons plus feature-002 confirmed-empty coverage yields no fitted weapons.
- Unresolved occupied hardpoints appear in a separate exact-slot notice/list. They receive no weapon
  values and never enter package totals.
- Mixed resolved/unresolved coverage retains the complete returned collection and qualifies its
  completeness.
- Coverage unavailable says the package weapon result could not establish fitted coverage; it does
  not claim empty hardpoints.
- A non-empty list with zero total remains populated. Disabled and genuine-zero meanings remain
  visible per entry.

## State behavior

| State                                       | Presentation                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Workspace no build                          | Feature 001 no-build state; no feature-007 package call                                |
| Current revision pending                    | Shared pending state for this snapshot; old values are not relabelled                  |
| Complete populated                          | Exact totals, types, capacitor, distributor observation and all returned weapon fields |
| Confirmed no fitted weapons                 | Explicit empty meaning plus exact package zero/capacitor values where useful           |
| Unresolved-only or partial coverage         | Separate exact-slot qualification; no fabricated output or false empty claim           |
| Some/all returned weapons disabled          | Full entries with exact enabled flags and package totals                               |
| Genuine zero weapon                         | Complete entry including numeric zero and all other returned data                      |
| Unclassified absent                         | Optional row omitted or no-unclassified-damage meaning, not unavailable                |
| Range/piercing/projectile member absent     | Field-specific not stated, never numeric zero                                          |
| No/finite/zero-reserve/unlimited ammunition | Distinct full-rearm meanings; infinity never generic-formatted                         |
| Finite/immediate/infinite endurance         | Exact field plus one of the four duration meanings                                     |
| Zero capacity + power observation           | Both independent facts shown; no inferred cause                                        |
| Missing required integration port           | Blocking integration-unavailable state; no stale/fabricated numbers                    |
| Unexpected projection failure               | Shared alert for current revisions; active build remains intact                        |

## Status contribution

The feature-003 Status surface receives exact sustained DPS, native firing condition and the
`offenceProfile` target from feature 007's provider. Partial/unresolved/unavailable hardpoint coverage
qualifies `sustainedDps` once; exact zero does not. Selecting retracted hardpoints or changing WEP
pips does not change package sustained DPS.

## Announcements

A settled build/condition/coverage revision produces at most one concise localized message about
changed offence availability, returned/unresolved weapon count or duration meaning. Do not announce
every unchanged metric. Opening a slot uses feature 002's announcement once. A blocking integration
or projection error is announced assertively once; initial and discarded stale projections are
silent.

## Requirement mapping

The capability owns FR-001–FR-007. Totals/damage own FR-002, FR-003 and FR-005; the weapon collection
owns FR-002, FR-004 and FR-005; capacitor/distributor context owns FR-006 and FR-007. The complete
surface and Status adapter enforce FR-001's package-only revision boundary.
