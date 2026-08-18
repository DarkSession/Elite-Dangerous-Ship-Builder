# Power and Heat Capability

**Route context**: logical capability inside `/build`; no new route

**Design-system composition**: workspace capability heading/navigation,
feature 003 viewing-condition group, metric definition groups, semantic status
notices, responsive table/card collections, localized values/units and exact
slot actions.

## Purpose

Let a Commander compare generation with selected-state draw and priority
shedding, inspect every returned module contribution, read the complete package
heat profile and compare all distributor capacitors without leaving or changing
the active build.

## Entry and exit

- Feature 003's compact power summary targets
  `{ kind: 'detail', capability: 'powerAndHeat' }` in one interaction.
- Workspace capability selection is memory-only and does not change the route,
  fragment, active build, history or persistence.
- A module action emits its exact returned slot label to feature 002. Wide
  layouts reveal the inline slot; narrow layouts open the existing selected-slot
  surface with a named return action.
- No active build returns to feature 001's no-build workspace state. Feature 005
  never constructs a placeholder loadout.

## Semantic information order

1. capability heading and concise active-build context;
2. shared viewing-condition group;
3. selected power capacity/draw, qualification and deployed summary when
   applicable;
4. all five priority bands;
5. unavailable-draw then known-draw module consumers;
6. heat plant/hull facts and five scenarios;
7. distributor SYS, ENG and WEP.

Wide presentation may place power summary/bands and modules in fluid adjacent
regions, then heat and distributor in fluid adjacent regions. Tablet chooses
the same composition from available inline size, not device-name branching.
Narrow widths, landscape phones, expanded text and 400% zoom use the semantic
single-column order with no shortened content.

## Shared viewing conditions

- Reuse feature 003's one draft/Apply/Reset group. Feature 005 does not create a
  separate segmented selector or pip store.
- The settled default is deployed, two displayed pips each.
- The capability shows only one settled power state. Draft changes do not
  relabel current results until a valid Apply advances the condition revision.
- Invalid pip range/step/total retains the prior result and exposes the shared
  localized error relationships.
- `load` remains visible only where the shared group requires it; feature 005
  states that it does not affect these results.

## Power region

- Plant capacity and selected total draw are adjacent labelled values.
- Enabled unknown draws produce a nearby notice that names every returned slot
  and explains lower-bound/known-draw-only meanings by field.
- Deployed shows package headroom, utilisation and within-budget. Retracted
  omits them and explains that the package supplies those summaries only for
  deployed hardpoints; blank or inferred replacements are not shown.
- All five priority groups show own draw, cumulative draw and textual powered
  verdict. A visual comparison bar is optional and adds no value.
- Null-draw module consumers appear before optionally ranked numeric consumers.
  Every row shows localized package name/canonical disclosure, exact slot,
  exact draw/unavailable, enabled, priority and deployed-only/unavailable.
- A deployed-only row remains visible while retracted and is labelled inactive
  as presentation of the returned state; its draw is not replaced with a local
  zero.
- Each row retains a distinct exact-slot action. Identical symbols never merge.

## Heat region

- Show plant heat efficiency, hull heat capacity and hull heat dissipation as
  distinct definitions.
- Ready always shows idle, thrusters, FSD charging, sustained fire and
  drained-capacitor fire. Each exposes thermal load, heat level, cockpit gauge,
  overheat and time to overheat.
- Package null produces one unavailable group with no catalogue/hull fallback.
- `unknownDraws` appears in a named non-directional projection notice applying to the complete heat
  profile. `unknownWeaponHeat` appears in a separate named notice applying only to sustained and
  drained firing; when power draws are otherwise known, it identifies their thermal loads as lower
  bounds without qualifying the three non-firing scenarios.
- “Does not settle” appears only for affected heat/gauge fields; “never
  overheats” appears only for affected time fields.
- The pinned Almanac release passes the historical package-only unresolved-weapon regression; this
  region uses the two returned qualification lists directly and never receives its unknown identity.

## Distributor region

- SYS, ENG and WEP each show allocation used, capacity, rated four-pip recharge
  and actual recharge.
- Shared half-pip state is converted only at the package call. Returned pips are
  displayed rather than reconstructed from the draft.
- Zero is numeric zero.
- Package null produces one unavailable group. Observable slot context may be
  separate, but no inferred cause or catalogue value fills the result.

## State behavior

| State                   | Presentation                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| No build                | Localized need-build notice and feature 001 actions; no package call                                               |
| Pending                 | One whole-capability pending state for the current revision; no stale mixed values                                 |
| Complete                | Exact values/states without qualification notice                                                                   |
| Unknown power           | Named enabled unknowns plus field-specific lower-bound/known-draw-only text                                        |
| Disabled null draw      | Consumer remains visible/unavailable; aggregate remains unqualified unless another enabled unknown exists          |
| Retracted               | Retracted total/bands only; deployed summaries omitted with explanation                                            |
| Zero output             | Capacity/draw remain exact; infinite utilisation receives semantic text                                            |
| Distributor unavailable | One unavailable group; other sections and shared conditions remain usable                                          |
| Heat unavailable        | One unavailable group; power/distributor remain usable                                                             |
| Heat projection         | Every result remains visible; notices distinguish whole-profile unknown power from firing-only unknown weapon heat |
| Unexpected failure      | Shared alert, no stale prior figures; active build remains intact                                                  |

## Announcements

After a valid settled build/condition change, publish one concise localized
summary of changed state/qualification (for example, hardpoints retracted and a
band verdict changed). Do not announce every unchanged cell. Invalid draft
feedback remains associated with the controls. Slot navigation uses feature
002's selection announcement. Unexpected failure is announced once promptly.

## Requirement mapping

The capability owns FR-001–FR-011. Power owns FR-002–FR-006; distributor owns
FR-007–FR-008; heat owns FR-009–FR-011. The whole surface owns FR-001's package/
revision boundary and all cross-cutting responsive, accessibility and
localization behavior.
