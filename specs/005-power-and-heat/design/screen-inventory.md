# Screen and Surface Inventory

Feature 005 adds no top-level route. Its complete Power and Heat capability
composes inside feature 001's `/build` workspace. It also supplies typed data
to feature 003's Status surfaces and feature 010's Hull Anatomy; those features
own their screens.

| Surface                                                 | Wide/tablet presentation                                                            | Narrow/zoomed presentation                             | Requirements          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------- |
| [Power and Heat capability](./power-and-heat-detail.md) | Shared conditions; fluid power/band/module regions followed by heat and distributor | One complete semantic stack; no abbreviated “Top draw” | FR-001–FR-011         |
| Power summary and priority bands                        | Capacity/selected draw plus five-band table/list and deployed-only summaries        | Labelled cards with every field retained               | FR-002–FR-004, FR-011 |
| Per-module power                                        | Complete returned consumer manifest and exact-slot actions                          | Same complete card collection                          | FR-004–FR-006         |
| Heat profile                                            | Plant/hull facts and five complete scenario groups                                  | Same five complete groups in semantic order            | FR-009–FR-011         |
| Distributor performance                                 | Shared condition control beside/before SYS/ENG/WEP definitions where space permits  | Condition control then three complete capacitor groups | FR-007, FR-008        |
| Compact power status contribution (feature 003)         | Selected draw/capacity and owner qualification in rail/Status                       | Same owner value in feature 003's Status capability    | FR-001–FR-004         |
| Hardpoint power observation (feature 010)               | Supplemental geometry/text state                                                    | Same complete textual state in anatomy list/detail     | FR-001, FR-004–FR-006 |
| Exact outfitting slot (feature 002)                     | Reveal/select matching inline slot                                                  | Open existing selected-slot surface with return action | FR-006                |

## Requirement ownership

| Requirement | Planned behavior                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | One feature-owned projection calls only the three `ShipLoadout` methods; adapters select that owner data without recalculation.               |
| FR-002      | Selected total/bands map directly to named package fields; deployed summaries are absent while retracted.                                     |
| FR-003      | Feature 005 composes feature 003's shared condition control, defaults deployed and displays one settled hardpoint state.                      |
| FR-004      | Enabled package unknowns name/qualify affected results; disabled returned consumers remain visible exactly as reported.                       |
| FR-005      | Every returned power consumer uses package post-engineering draw/null; null remains outside numeric ordering.                                 |
| FR-006      | Every row exposes exact slot, enabled, priority and deployed-only state plus one exact-slot action.                                           |
| FR-007      | Integer half-pips divide by two only at the package call; all returned SYS/ENG/WEP fields and pips are displayed.                             |
| FR-008      | Package distributor null is unavailable and receives no catalogue substitute or inferred cause.                                               |
| FR-009      | Ready heat shows three profile facts, exactly five scenarios and every one of their five fields.                                              |
| FR-010      | Package heat null is unavailable; `unknownDraws` qualifies the whole profile, while `unknownWeaponHeat` qualifies only both firing scenarios. |
| FR-011      | Field-specific presentation distinguishes zero-output utilisation, non-settling heat and never-overheating time.                              |

## Cross-feature composition

- Feature 001 owns the active build, numeric build revision, no-build behavior
  and `/build` workspace.
- Feature 002 owns enabled/priority mutations, exact-slot selection and all
  editing UI. Feature 005 emits a slot target only.
- Feature 003 owns settled viewing conditions, integer half-pips, draft/Apply/
  Reset, condition revision, Status composition and detail target. Feature 005
  reuses its controls within this capability to satisfy FR-003; it does not
  duplicate state.
- Feature 005 owns every power/heat/distributor projection and qualification,
  including the compact `PowerStatusProvider` and
  `HardpointPowerObservationPort`.
- Feature 010 consumes the observation port and owns geometry. It does not join
  consumers to bands or infer power.
- Feature 011 owns tokens, components, localization/formatting, package game
  text, announcements, previews and accessibility/browser harness.

Feature 003 owns the only viewing-condition store and shared control component. Status composes the
complete control, while Power and Heat composes the same component for its hardpoint/pip conditions;
both instances share one draft/Apply/Reset state and condition revision.

## Required states

- no active build;
- pending current revision and stale-result refusal;
- unexpected projection failure;
- deployed and retracted, including omitted retracted summaries;
- within budget, exact over-budget shedding and all five bands;
- enabled unknown draw/lower-bound power;
- disabled null draw that does not qualify totals;
- zero capacity with zero draw and with positive draw/infinite utilisation;
- participating enabled/disabled/deployed-only/null module consumers;
- distributor ready, package unavailable and genuine zero-pip recharge;
- heat ready, package unavailable, unknown-power projection, unknown-weapon firing projection and no weapons;
- finite, does-not-settle and never-overheats fields;
- missing required returned consumer identity as a package-contract failure.

## Responsive, accessibility and localization baseline

- The owning workspace supplies one `main` and one `h1`; feature sections
  nest under the capability heading.
- Wide columns never alter semantic order. At narrow widths, both landscape
  orientations, 200% text and 400% zoom, sections stack without document
  horizontal scrolling.
- A semantic table may scroll only inside a labelled container when labelled
  cards cannot express the relationship more clearly.
- Controls work by pointer and touch and use shared target-size tokens. Nothing
  required depends on hover.
- Powered, disabled, deployed-only, shed, unknown, lower-bound, projection,
  unavailable and overheat states are visible/programmatic text.
- Charts are omitted when they do not materially aid comparison; any retained
  bar/gauge has a complete nearby text equivalent.
- One settled build/condition/qualification update receives one coalesced
  polite announcement. Blocking application failure uses shared alert behavior.
- Owned strings and semantic sentinels use messages; MW, MJ, MJ/s,
  percentages, pips and durations use active-locale formatters.
- Game module/slot text uses Almanac localization or disclosed canonical
  fallback; missing canonical text is unavailable.
- Every meaningful state is exercised in Chromium and Firefox across desktop,
  tablet/mobile portrait and landscape with axe plus manual screen-reader and
  zoom protocols.

Where conformance is stated, use “WCAG 2.2 AA except criteria 2.1.1, 2.1.2,
2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.”
