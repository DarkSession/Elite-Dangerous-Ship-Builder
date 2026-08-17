# Defence Profile Detail

**Route context**: capability surface inside `/build`; no new route

**Design-system composition**: workspace capability heading/navigation, shared pip allocator,
metric/fact groups, availability/qualification notices, responsive damage table/cards, responsive
source and bank collections, localized number/unit values, semantic state labels and exact-slot
actions.

## Purpose

Let a Commander understand shield strength, recovery, cell banks, hull armour, resistances, hardness
and module protection for the active build without editing or leaving it, while every value remains an
exact Almanac result.

## Entry and exit

- Feature 003's shield or armour headline opens this capability in one interaction and preserves the
  active build and viewing conditions.
- The workspace capability selector may also select it. Selection is absent from build data,
  persistence, fragment and SLEF.
- A source/bank action emits its exact package slot key to feature 002. Wide layouts reveal/select the
  inline location; narrow layouts open the existing selected-slot layer with a named return action.
- Losing the active build returns to the workspace no-build state; feature 006 constructs no
  placeholder hull or metrics.

## Information order

Semantic and narrow-screen order is fixed:

1. capability heading and concise current-build context;
2. shared SYS-pip viewing condition;
3. shield availability, total and aggregate contributions;
4. shield resistance/effective-hit-point relationship;
5. normal/broken recovery rates and the two recovery durations;
6. generator, booster and shield-reinforcement sources;
7. cell-bank totals and complete bank list;
8. armour total and aggregate contributions;
9. armour resistance/effective-hit-point relationship;
10. hull hardness, module armour and module protection;
11. bulkhead, hull-reinforcement and module-reinforcement sources.

Wide layouts may put complete shield and armour regions in two fluid columns when each remains
legible. Tablet chooses one/two columns from available inline size rather than a device-name
breakpoint. Narrow widths, landscape phones, expanded text and 400% zoom use one complete stack.

## Shield and recovery region

- The shared allocator states selected SYS pips. Feature 006 does not duplicate its state or
  validation.
- A ready shield shows total strength, all three package contribution fields, both multipliers, SYS
  resistance and all four resistance/EHP pairs.
- Generator state sits beside availability. A retained strength for a shed generator remains visible
  with explicit shed context and is never labelled online.
- Missing/null shield state is explicit and contains no zeros. It does not hide cell-bank fitted
  state or any armour content.
- Recovery shows normal and broken MJ/s separately, followed by recovery threshold and full
  regeneration durations. Each non-finishing phase uses its own localized meaning.
- The shield source manifest gives every recognized source an exact-slot action but attaches no
  aggregate contribution share.

## Cell-bank region

- `noneFitted` is a dedicated empty state, not a zero-total summary.
- A fitted state always shows package total restorable MJ and powered cells, then every bank in
  package order.
- Each bank shows slot/module context, per-activation reinforcement, cells, spin-up, duration, heat
  and powered state.
- Disabled/shed banks remain present. All-unpowered banks show zero package totals while retaining the
  complete list.
- Unknown-draw qualification is adjacent to the affected verdicts/totals; package values stay exact.

## Armour and protection region

- A ready armour profile shows hit points, bulkhead/reinforcement aggregates and all four
  resistance/EHP pairs.
- Module armour and module-protection fraction are distinct labelled facts outside the hull pool.
- Hull hardness is the exact package rating with text explaining its comparison to weapon armour
  piercing. No matchup, damage percentage or verdict is generated.
- The source manifest shows only actual package-resolved fitted sources and never presents the
  package calculation's fallback bulkhead as though it were fitted.
- A package-authorized unresolved-hull state is explicit unavailable with no catalogue substitute.

## State behavior

| State                   | Presentation                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| No active build         | Localized requirement notice plus feature 001 select/open/import actions; no package call     |
| Recomputing revision    | Shared pending state for the whole snapshot; prior values are not mixed into current state    |
| Ready                   | Exact values, states and source identities with no qualification notice                       |
| Shield missing          | Explicit unavailable shield/recovery; armour and bank state continue independently            |
| Generator disabled      | Disabled context; only package-authorized metrics remain                                      |
| Generator shed          | Shed context; package-retained shield strength may remain, recovery is unavailable after #296 |
| Generator indeterminate | Generic qualified context; no invented reason/power verdict                                   |
| Recovery cannot finish  | Field-specific semantic text in the affected duration only                                    |
| No banks                | Dedicated no-bank state                                                                       |
| All banks unpowered     | Fitted list plus exact zero package totals and textual unpowered state                        |
| Unknown bank draw       | Package values retained under explicit assumed/unknown qualification                          |
| Negative resistance     | Signed percentage and exact EHP with textual weakness semantics                               |
| Unbounded EHP           | Field-specific unbounded text; no clamped bar or substituted number                           |
| Unknown hull            | Package-authorized unavailable armour/hardness; no guessed catalogue values                   |
| Unexpected failure      | Shared alert with no fabricated or stale values; active build remains intact                  |

## Announcements

A settled build/pip revision publishes one concise localized summary of changed availability,
generator state or totals. It does not announce every unchanged damage row/source. Opening a slot
uses feature 002's announcement. A blocking projection failure is announced promptly once.

## Requirement mapping

This surface owns FR-001–FR-009. The shield region owns FR-002–FR-005, the cell-bank region owns
FR-006, the armour/protection region owns FR-007–FR-008, and all source/bank actions own FR-009. The
whole surface enforces FR-001's package-only/revision boundary and the independent shield/armour
lifecycle.
