# Power and Heat Detail

**Route context**: capability surface inside `/build`; no new route

**Design-system composition**: workspace capability heading/navigation, shared
`HardpointStateSelector`, shared pip allocator, metric/fact groups,
qualification/unavailable notices, responsive table/card collection, localized
number/unit values, semantic status labels and exact-slot action.

## Purpose

Let a Commander understand current power generation, state-specific draw and
shedding, inspect every module contribution, compare all distributor capacitors,
and read the package's complete heat profile without changing or leaving the
active build.

## Entry and exit

- Feature 003's power headline opens this capability in one interaction and
  preserves the current active build and viewing conditions.
- The workspace capability selector may also select it. Selection is not encoded
  in build data, record persistence, fragment or SLEF.
- A module action emits the exact package slot key to feature 002. Wide layouts
  reveal/select the inline outfitting location; narrow layouts open the existing
  selected-slot layer with a named return action.
- Losing the active build returns to the workspace no-build state; this feature
  never creates a placeholder hull.

## Information order

Semantic and narrow-screen order is fixed:

1. capability heading and concise current-build context;
2. shared hardpoint state and pip viewing conditions;
3. power capacity/selected draw and qualification;
4. five priority bands;
5. unknown and known module contributions;
6. heat plant/hull facts and five scenarios;
7. distributor SYS, ENG and WEP values.

At wide widths, sections 3–5 may occupy two fluid columns and sections 6–7 may
use columns when their reading order remains unchanged. Tablet chooses one or
two columns from available inline size, not a device-name breakpoint. At narrow
widths, landscape phones, expanded text and 400% zoom, every section stacks and
wraps. No content is shortened or moved to hover.

## Power section

- A named two-choice control selects deployed or retracted; only one state is
  shown. Deployed is the shared default.
- Plant capacity and selected total draw appear together. A nearby text notice
  qualifies every affected result when unknown draws exist.
- Deployed mode shows exact package headroom, utilisation and within-budget
  verdict. Retracted mode omits those fields and explains that the package
  summaries describe deployed hardpoints; it does not show blank or inferred
  replacements.
- The band collection shows all five groups and labels own draw, cumulative draw
  and powered state. Any bar is supplemental and cannot imply a locally derived
  percentage.
- The module collection first shows each unavailable contribution, then every
  known contribution. Each entry shows package name/identity, slot, exact draw
  or unavailable, enabled, priority and deployed-only state. Selected-state
  inactivity is textual and does not overwrite the package draw with zero.
- Each entry retains its own slot action; identical fitted modules are not
  collapsed into a count.

## Heat section

- Plant efficiency, hull heat capacity and hull dissipation are labelled as
  distinct package quantities.
- A ready profile always shows idle, thrusters, FSD charging, sustained fire and
  drained-capacitor fire in that order. Each scenario exposes thermal load, heat
  level, cockpit gauge level, overheat state and time to overheat.
- A package null produces one explicit unavailable panel with no scenario or
  catalogue substitute.
- Unknown contributors appear by returned slot key in a projection notice that
  applies to the entire profile and explicitly says the result is not a bound.
- “Does not settle” and “never overheats” appear in the exact affected fields;
  one cannot substitute for the other.

## Distributor section

- The shared allocator retains feature 003's half-step, total-six and maximum
  four invariants.
- SYS, ENG and WEP each show allocation used, capacity, rated four-pip recharge
  and actual recharge. A returned zero remains numeric zero.
- A package null produces one explicit unavailable group. Observable fitted
  state may appear separately, but no inferred null reason or catalogue value
  fills the result.

## State behavior

| State                   | Presentation                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| No active build         | Localized requirement notice plus feature 001 select/open/import actions; no package call      |
| Recomputing revision    | Shared pending state for the whole snapshot; prior revision is not mixed into current values   |
| Complete                | Exact values and states with no qualification notice                                           |
| Unknown power           | Named unknowns plus lower-bound/known-draw-only text on every affected power result            |
| Over budget             | Package band/verdict text; color or bars only reinforce it                                     |
| Retracted               | Retracted totals/bands only; deployed summaries omitted with explanation                       |
| Distributor unavailable | One unavailable result; controls may remain available as shared conditions                     |
| Heat unavailable        | One unavailable profile; reportable power/distributor sections remain usable                   |
| Heat projection         | Every returned value remains visible under one projection qualification and named contributors |
| Unexpected failure      | Shared error/alert with no fabricated or stale values; active build remains intact             |

## Announcements

A settled condition or build revision publishes one concise localized summary,
for example that the hardpoint state changed and a band's powered status changed,
or that the heat profile became projected. It does not announce every unchanged
cell. Opening a slot follows feature 002's selection announcement. A blocking
error is announced promptly once.

## Requirement mapping

This surface owns FR-001–FR-011. Its power region owns FR-002–FR-006, its
distributor region owns FR-007–FR-008, and its heat region owns FR-009–FR-011.
The whole surface enforces FR-001's package-only/revision boundary and FR-011's
semantic non-finite presentation.
