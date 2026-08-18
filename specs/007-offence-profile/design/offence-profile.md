# Offence Profile

**Route context**: capability surface inside `/build`; no new route

**Design-system composition**: workspace capability heading/navigation, shared pip allocator/current
conditions, metric/fact groups, semantic status and unavailable text, complete row-owned details,
responsive table/card collection, localized number/unit values and exact-slot action.

## Purpose

Let a Commander read the package's complete build weapon output, understand its damage types,
inspect every returned fitted weapon and see WEP-capacitor endurance without selecting a target or
leaving the active build.

## Entry and exit

- Feature 003's offence headline opens this capability in one interaction and preserves the current
  active build and viewing conditions.
- The workspace capability selector may also select it. Selection and expanded detail state are not
  encoded in build data, local records, fragment or SLEF.
- A weapon action emits the exact returned slot key to feature 002. Wide layouts reveal/select the
  inline outfitting location; narrow layouts open the existing selected-slot layer with a named
  return action.
- Losing the active build returns to the workspace no-build state; this feature never creates a
  placeholder hull or build.

## Information order

Semantic and narrow-screen order is fixed:

1. capability heading and concise current-build context;
2. selected shared WEP-pip and deployed-firing context;
3. whole-build burst/sustained output and exact package scope;
4. burst and sustained damage-type amounts with anti-xeno overlay explanation;
5. weapon-capacitor fields, semantic endurance and shared distributor observation;
6. unresolved occupied-hardpoint qualification, when present;
7. complete returned weapon collection with one exact-slot action per entry.

At wide widths, items 3–5 may occupy two fluid columns and the weapon collection spans the available
width. Tablet chooses one or two columns from available inline size, not a device-name breakpoint.
At narrow widths, landscape phones, expanded text and 400% zoom, every group stacks and wraps. No
content is shortened or moved to hover.

## Whole-build section

- Label totals as “enabled fitted weapon totals,” not powered firing output.
- Present damage, WEP draw and heat in burst/reload-averaged pairs, followed by thermal load and
  deployed plant draw. Every value carries its unit/meaning.
- Present burst and sustained damage types as two complete textual definition groups. Optional
  unclassified absence is explicit. Anti-xeno is identified as an overlay and is never visually or
  numerically folded into the conventional group.
- Do not use the reference's stacked share bar: FR-003 prohibits calculating damage shares.
- A zero total stays zero. Adjacent hardpoint/weapon state distinguishes truly empty, all disabled,
  unresolved and genuine-zero results without changing the number.

## Weapon-capacitor section

- Show the shared settled WEP-pip value used by the package. The existing shared allocator may open
  or compose here; feature 007 never creates a WEP-only divergent control.
- Show capacity, selected-pip recharge, powered deployed sustained draw, net drain and time to drain.
- Positive finite duration is formatted in seconds; zero is immediate; infinite positive draw says
  the powered firing load can be sustained indefinitely; infinite zero draw says no draining powered
  firing load.
- Show feature 005's distributor presence/enabled/powered observation separately, especially beside
  zero capacity. Neither fact is inferred from the other.
- A bar may appear only if a future package result supplies its exact scale. 0.1.1's values do not
  authorize a local capacity/drain percentage, so the initial design is textual.

## Weapon collection

Every returned entry includes an always-available summary and a row/card-owned complete fact region.
The summary shows package name, exact slot, enabled state, burst and sustained DPS, armour piercing,
effective range availability and ammunition meaning. The complete region exposes:

- damage per shot, fire rate, sustained fire rate and continuous-fire state;
- burst/sustained damage, WEP draw and heat rates;
- thermal load and deployed plant power draw;
- burst/sustained kinetic, thermal, explosive, absolute, optional unclassified and anti-xeno values;
- maximum/falloff range, separately named projectile-boundary metadata and piercing when returned;
- full-rearm clip, hopper, total and unlimited state, or no-ammunition meaning;
- one distinct action named for the weapon/slot that opens that exact slot.

At wide widths, complete regions may use row-owned disclosure to keep ten weapons scannable. At
narrow widths they are labelled card details. Disclosure controls and slot actions remain distinct
44 CSS-pixel targets; activating the card itself does not silently navigate. Expanded state never
hides the only route to the slot.

The collection preserves 0.1.1's package-returned hull-slot order, with unknown/unmapped slots
appended in source order, and adds no local corrective sort.

## Unresolved hardpoints and empty states

- An empty returned weapon array plus feature 002 confirmation that all hardpoints are empty yields
  the explicit no-fitted-weapons state.
- Occupied unresolved hardpoints appear in a separate notice/list using feature 002 identity and
  exact-slot actions. They receive no weapon fields and do not enter package totals.
- If hardpoint occupancy itself is unavailable, say no weapon result was returned; do not claim the
  build has no fitted weapons.
- A non-empty list with zero package totals remains a populated weapon collection. Disabled and
  genuine-zero state is visible per entry.

## State behavior

| State                             | Presentation                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| No active build                   | Localized requirement notice plus feature 001 select/open/import actions; no package call    |
| Recomputing revision              | Shared pending state for the whole snapshot; prior revision is not mixed into current values |
| Complete                          | Exact totals, capacitor and every returned weapon field                                      |
| No fitted hardpoints              | Explicit empty state plus exact package zero totals/capacitor result where useful            |
| Unresolved occupied hardpoint     | Named separate qualification; no false empty claim or invented output                        |
| All returned weapons disabled     | Complete disabled entries and exact zero aggregate; capacitor no-powered-load meaning        |
| Genuine zero-damage weapon        | Complete entry including zero damage and all nonzero/other returned fields                   |
| Missing range/piercing/type field | Field-specific not-returned state; no zero                                                   |
| Unlimited ammunition              | Localized unlimited reserve/total; no numeric infinity                                       |
| Zero reserve                      | Exact numeric zero, explicitly not unlimited                                                 |
| Finite capacitor drain            | Exact fields and localized duration                                                          |
| Immediate drain                   | Exact zero seconds and zero-capacity/power context when available                            |
| Infinite with positive draw       | Package no-net-drain meaning: sustained indefinitely                                         |
| Infinite with zero draw           | No draining powered firing load; no claim that weapons can fire                              |
| Unexpected failure                | Shared error/alert with no fabricated or stale values; active build remains intact           |

## Announcements

A settled pip or build revision publishes one concise localized summary, for example that WEP pips
changed and endurance became finite, or that the number of returned/unresolved weapons changed. It
does not announce every unchanged metric or expanded definition. Opening a slot follows feature
002's selection announcement. A blocking error is announced promptly once.

## Requirement mapping

This surface owns FR-001–FR-007. Its whole-build/damage region owns FR-002, FR-003 and FR-005; its
weapon collection owns FR-002, FR-004 and FR-005; its capacitor region owns FR-006 and FR-007. The
whole surface enforces FR-001's package-only/revision boundary.
