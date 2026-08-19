# Defence Profile

**Route context**: complete capability inside `/build`; no new route

**Reference context**: `.design/Ship Builder.dc.html` canvas 1c wide Defence Analysis and canvas 1d
mobile Defence mode

**Design-system composition**: workspace capability navigation, shared viewing-condition control,
metric/definition groups, responsive damage relationship, calculation-issue notice, responsive bank
and fitted-role collections, contextual actions, localized values and shared announcement outlets

## Purpose

Let a Commander inspect every package shield, recovery, cell-bank, armour, hardness and module-
protection result for the active build and reach the relevant fitted slot without changing the
build.

## Entry and exit

- Feature 003's shield/armour headline or workspace capability control selects Defence in one
  interaction and preserves the active build and settled conditions.
- Capability selection remains memory-only and never enters the fragment, local record or SLEF.
- A bank, fitted-role or issue action sends its exact package slot to feature 002. Wide layouts reveal
  it inline; narrow layouts open the existing selected-slot surface with return context.
- Losing/replacing the active build returns through feature 003's no-build/pending lifecycle. Feature
  006 creates no placeholder hull or stale result.

## Semantic information order

1. Defence heading and concise active-build context;
2. shared feature 003 condition surface, including selected SYS pips;
3. shield availability, strength, aggregate contributions, multipliers and SYS resistance;
4. four shield resistance/effective-MJ relationships;
5. raised/broken regeneration rates and collapse-to-raise/raise-to-full durations;
6. calculation issues and resolved fitted shield-role actions;
7. cell-bank state, totals and every fitted bank;
8. armour total and aggregate contributions;
9. four armour resistance/effective-hull-point relationships;
10. hull hardness with armour-piercing explanation, module armour and module protection;
11. resolved fitted bulkhead/hull/module-reinforcement actions.

The DOM and screen-reader order always follows this list. At roomy widths the complete shield block
(items 3–7) and armour block (items 8–11) may appear as peer fluid columns. When either column would
truncate, overflow or lose target size, they become one stack. Tablet behavior follows available
inline space, not a device-name breakpoint. Landscape phones, expanded text and 400% zoom always use
the complete stacked composition.

## Shield and recovery

- Show the selected SYS pips and all scalar `ShieldMetrics` fields. “Effective pool” is not a
  substitute for total strength plus the four returned EHP values.
- Pair each damage resistance with its same-type EHP. A supplemental bar is allowed only with a
  declared truthful scale and complete text equivalent. Negative and non-finite cases may omit it.
- An unavailable result shows every package issue in order. Slot-bearing issues are contextual
  actions. The UI never derives or announces a different generator verdict.
- Shield and recovery are independent: either complete result remains visible if the other is
  unavailable.
- Recovery presents all four fields. Each infinite duration has its own phrase; raw “Infinity” is
  not shown.
- Fitted role rows sit near aggregates but carry no per-row contribution value or claim that the
  facade counted them.

## Cell banks

- `noneFitted` is a dedicated empty statement with no zero-total summary pretending to be a fitted
  pool.
- Fitted banks always show both package totals and every bank in package order.
- Each bank shows module/slot context, one-activation reinforcement, cells, spin-up, duration, heat
  and powered state, and the entire action meets the shared target-size token.
- All-unpowered banks retain the complete list beside exact zero totals.

## Armour and protection

- Show all `ArmourMetrics` fields. Armour EHP uses hull points, never MJ.
- Hardness, module armour and module protection are separately labelled and explained. The reference
  label “integrity” is not used for module armour.
- Hardness explanation states its comparison with weapon armour piercing but generates no matchup or
  reduction verdict.
- Armour remains complete when shield/recovery is missing, disabled, shed or otherwise unavailable.
- The actual fitted bulkhead is shown only from the package slot. Stock calculation fallback never
  fabricates a fitted source row.
- Fitted armour-role rows are exact-slot navigation records with no apportioned aggregate value.

## State behavior

| State                            | Presentation                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| no active build                  | Shared no-build state and feature 001 actions; no package read                            |
| recomputing revision             | Shared pending state for the requested revision; no stale metric payload                  |
| ready                            | Complete projection, current conditions and exact actions                                 |
| shield/recovery unavailable      | All ordered package issues; independent complete sections remain                          |
| missing/disabled/shed/unresolved | Exact issue field/reason and package-localized diagnostic; issue slot action when present |
| non-finishing recovery phase     | Field-specific semantic phrase only for the affected duration                             |
| no banks                         | Dedicated empty collection state                                                          |
| all banks unpowered              | Fitted list, textual unpowered states and exact zero totals                               |
| negative resistance              | Signed percentage, exact EHP and visible weakness meaning                                 |
| unbounded EHP                    | Field-specific unbounded text with no clamped/substituted number                          |
| projection failure               | Shared blocking error for current revision; no fabricated/stale payload                   |
| unknown hull ingress             | Rejected before activation by feature 001/004; no Defence surface state                   |

## Responsive and interaction rules

- Desktop reference: retain the workspace's slot ledger, central capability and Status rail when
  feature 001/003 permit them; the central Defence region uses fluid tracks, not the mock's fixed
  392/fluid/306 pixel shell.
- Narrow reference: retain Defence as an in-workspace capability and stack shield then armour, but do
  not copy its abbreviated data footer. The complete banks, sources and protection facts remain.
- A wide semantic table may become same-order labelled cards. Local table overflow is a last resort;
  the page never scrolls horizontally.
- No essential action depends on hover, color, bars, icons, fixed position or motion.
- Actions use feature 011's 44 CSS-pixel baseline unless a documented WCAG 2.2 target-size exception
  applies.
- Logical properties and wrapping handle RTL, long game names and doubled application text.
- Reduced motion changes no result timing, order or meaning.

## Localization and announcements

Application headings, states, explanations, units and sentinels use localization keys. Numbers,
percentages, multipliers, counts and durations use the active locale. Module/hull/slot names and
calculation diagnostics use Almanac leaf helpers; unavailable locale results use feature 011's
canonical-language disclosure or unavailable state.

One settled revision emits one polite summary of material availability/total/qualification changes.
A blocking projection failure is assertive once. Slot selection uses feature 002's announcement and
is not duplicated.

## Requirement mapping

The surface owns FR-001–FR-009. Shield/recovery owns FR-002–FR-005; banks own FR-006; armour and
protection own FR-007–FR-008; issue/bank/fitted-role actions own FR-009. The full surface enforces
FR-001's package-only and same-revision boundary.
