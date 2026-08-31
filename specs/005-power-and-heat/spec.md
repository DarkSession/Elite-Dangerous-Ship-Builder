# Feature Specification: Power and Heat

## Scope

This capability presents power generation and draw, priority shedding, distributor capacitors and
the heat scenarios returned by the Almanac, together with the hardpoint state and pip allocation
those results are read under. Module power edits belong to
[002](../002-module-outfitting/spec.md). Feature 003's wave 11 ruling C moved the hardpoint and pip
conditions here, because the design draws them inside this capability and nowhere else.

## User Scenarios

### Story 1 — Understand the power budget (P1)

1. Plant capacity and draw for the selected hardpoint state are shown together.
2. Deployed is selected by default, and the Commander can switch between deployed and retracted.
3. Every priority band shows its draw, cumulative draw and powered state for the selected state.
4. Each module's contribution reaches the corresponding slot.

### Story 2 — Read distributor performance (P2)

1. SYS, ENG and WEP each show capacity, rated recharge and actual recharge at the selected pips.
2. Pip changes affect recharge but not capacity.
3. A missing, disabled, package-incomplete or shed distributor produces an unavailable result.

### Story 3 — Understand heat (P2)

1. Plant efficiency and hull heat capacity and dissipation are identified.
2. Idle, thruster, FSD-charging, sustained-fire and drained-capacitor scenarios show every package
   result.

## Requirements

- **FR-001**: Every numeric value and calculation MUST come from
  `@elite-dangerous-almanac/core` without local recomputation.
- **FR-002**: Power MUST use `BuildMetrics.powerBudget()` for plant capacity, the selected hardpoint
  state's total draw, and the per-group draw, cumulative draw and powered state of every priority
  group this build puts something in. A group nothing is assigned to MUST NOT be drawn. Package
  `headroom`, `utilisation` and `withinBudget` MUST NOT be shown in either state: neither canvas
  draws any of the three (design wins, wave 13).
- **FR-003**: The power budget MUST show only one hardpoint state at a time, default to deployed and
  allow the Commander to switch between deployed and retracted. This capability owns that selection;
  it is in memory only and reaches no route, history, storage, saved build or export.
- **FR-004**: Disabled modules MUST remain visible and contribute exactly as the package reports.
- **FR-005**: A per-module breakdown MUST use package-resolved post-engineering draw and MAY sort by
  contribution.
- **FR-006**: The module list MUST state each line's draw in the selected state, so a stowed
  hardpoint and a switched-off module each read a real zero and each state's list adds up to that
  state's own package total. A line standing for more than one mount MUST carry its count, a line
  the plant leaves dark MUST name its group, and a switched-off line MUST say so. The list carries
  no action: feature 002's ledger is where a mount is selected (design wins, wave 13).
- **FR-007**: Distributor values MUST use `BuildMetrics.distributorMetricsResult()` for capacity, rated
  recharge, pip-scaled recharge and the allocation used. The application MUST NOT scale recharge.
  This capability owns the allocation: a Commander assigns a whole `0`–`4` pips to one of SYS, ENG
  and WEP, chosen in place with no draft, running total or confirmation step, and the pips shown are
  the pips the package returns.

  > **Ruled 2026-08-25 — what the other two banks pay.** Six pips between the three is the ship's
  > rule, and so is how they move: every whole pip assigned to one bank MUST be taken **half a pip
  > from each of the other two**. Where only one of the two has pips left to give, that bank MUST
  > pay the whole of it rather than the other going negative; taking pips back out of a bank MUST
  > run the same rule backwards, all of it going to one bank where the other is already at four. It
  > follows that the bank being set always stands on a whole pip while the two paying for it stand
  > on the half step, and that four blocks filled from the leading edge draw every allocation the
  > control can reach. No control MUST offer a half pip directly.

  > **Ruled 2026-08-27 — the capacity is written in the game's unit, not SI's.** A bank's capacity
  > MUST be written `MW`, and both recharge figures `MJ/s`. A capacity is a stored pool and its SI
  > unit is the megajoule — which is what this capability wrote until this ruling, and what canvas 1c
  > draws — but the outfitting panel a Commander cross-checks these figures against writes `MW` after
  > it, and one figure written in two units across two panels reads as two figures. The game's unit
  > wins over both the canvas and SI, for this one column. The figure itself MUST NOT change: it is
  > the package's `capacity`, copied, with no conversion, scale or factor applied — this ruling
  > reaches the unit and nothing else, the decimal place this table already used included.
  >
  > Feature 007's `WEAPON CAPACITOR` states this same quantity, and its spec carries the same ruling
  > for its own region (`specs/007-offence-profile/spec.md`, FR-006). It is recorded there rather
  > than imposed from here: this spec constrains this capability, and one quantity written in two
  > units across one workspace is a thing both specs have to say.

- **FR-008**: A `null` distributor value MUST remain unavailable; catalogue figures MUST NOT replace
  a build result.
- **FR-009**: Heat MUST use `BuildMetrics.heatMetricsResult()` and show the five returned scenarios, their
  thermal load, heat level, gauge level, overheat state and time to overheat.
- **FR-010**: `null` heat MUST remain unavailable; catalogue figures MUST NOT replace a build
  result.
- **FR-011**: Infinity MUST be expressed by its package meaning, such as never settling or never
  overheating, rather than as an unexplained number.
- **FR-012**: **Withdrawn (wave 13).** The artboard's own switching script hides the plate container
  for every mode but `mounts`, so the `POWER` mode replaces the plates rather than annotating them
  and no mount carries a power state.
- **FR-013**: The build status rail MUST carry one sentence per priority group the package reports
  unpowered with the hardpoints deployed, each naming its group and its own deployed draw; the
  canvas's `POWER` line carrying the lit draw against plant output, with its unpowered remainder
  named after it only where something is dark; and the canvas's bar under it, drawing those same
  figures over the whole demand with a mark where the plant runs out. Each MUST name only fields the
  package returned, no severity word MUST stand beside a sentence, and no heat sentence MUST be
  drawn here. These three MUST NOT be interactive.

  > **Extended 2026-08-25 — the rail carries the pip control too.** The canvas revision of that date
  > drew three `.pipset` groups under the rail's `POWER` bar — `SYS`, `ENG` and `WEP`, each over four
  > blocks filled to that bank's standing allocation, each with `cursor: pointer`. The rail MUST
  > carry them as a control. It edits the same single viewing condition FR-007's distributor cell
  > edits, through the same action and under the same six-pip rule, and MUST NOT become a second
  > allocation, a draft or a running total; each bank MUST expose the allocation it stands at in
  > words, and the blocks shown MUST be the pips the package returned rather than the ones that were
  > pressed. The three
  > read-only contributions above stay read-only.
  >
  > The rail is on screen in every anatomy mode while the distributor table is only in `POWER`, and
  > the same revision gave feature 006 a column and feature 007 a chip that are read at an
  > allocation — so the control belongs where a Commander can reach it without leaving the region
  > whose figures it moves (`design/power-and-heat-detail.md`, "The rail's pip control"). No
  > requirement id is minted for it: this is FR-013's block gaining an element, and the coverage
  > ledger registers ids against journeys that exist.

- **FR-014**: At compact width, **where and only where** the package reports a band unpowered with
  the hardpoints deployed, the strip of key readings MUST close with a badge stating the share of
  plant output the build's lit demand takes, over one line naming each such band by its priority
  group. Both figures MUST be read from `BuildMetrics.powerBudget()`, the same result FR-013's rail
  reads, and MUST NOT be a second reading of it: the badge is the rail's `POWER` line at the width
  the rail is a segment a Commander has to open.

  The share is the lit demand over **plant output**, not over the whole demand: the reference sets
  `95%` against a build whose lit draw is `29.64 MW` of a `31.20 MW` plant and whose whole demand is
  `37.44`. Where the package reports no output at all there is no share to state, and the badge MUST
  state none — a share of nothing is a division without an answer rather than a small percentage.
  The badge itself is still drawn on such a build, carrying its band lines alone: no output means
  every band is unpowered, which is the condition above at its widest.

  A build whose plant covers every band MUST draw no badge at all. The badge is a warning, and a
  warning drawn over a build that has nothing wrong with it is a warning a Commander learns to stop
  reading. The share itself is not lost: FR-013's `POWER` line states it in full, one segment away,
  and it is stated there on every build rather than abbreviated here on some of them
  (Commander request 2026-08-30). Where more than one band is dark the badge MUST name each of them;
  the reference draws a build with one and names that one, and a build with two has two things to
  say.

  The badge MUST NOT take a row of its own away from the readings it closes: it stands at the
  trailing edge of the row those readings are on, and takes a row of its own only where the width
  it needs is not there. A badge given a row of its own at every width holds the six readings to a
  fraction of the strip they are drawn across.

  The badge MUST be a reading and MUST NOT be interactive: the pips that move it are the rail's, and
  the rail is one segment away.

## Edge Cases

- Without a plant, draw remains reportable, capacity is zero and heat is unavailable.
- Without weapons, firing scenarios remain package results; the UI does not invent an absent state.
- Zero-pip recharge is a genuine zero.
- A deployed-only module remains identifiable while hardpoints are retracted.

## Almanac Coverage

`powerBudget()`, `distributorMetricsResult()` and `heatMetricsResult()` provide every value and state required
here. The application only formats, orders and links returned data.

## Current Almanac Limit

`powerBudget()`'s `headroom`, `utilisation` and `withinBudget` fields describe deployed hardpoints
only, and the package publishes no retracted equivalent. The limit no longer reaches the screen:
neither canvas draws any of the three, so none is read in either state and none has to be blanked,
dashed or explained. The application MUST NOT calculate a retracted equivalent, and MUST NOT
reintroduce the deployed ones without the design drawing them.

`heatMetricsResult()` publishes five scenarios and states outright that a shield cell bank's heat is not
one of them, because a bank states heat per _activation_. The canvases draw a sixth bar for it, and
the package's own documented remedy — divide by the bank's spin-up, add it to the build's load, run
it for that duration with `heatLevelAtTime` — is what draws it. `heatMetricsResult()` also models no heat
sink, so the canvases' `HEAT SINKS` tile is counted from `fittedModules()` rather than derived.

## Success Criteria

- **SC-001**: Every displayed value and state equals the corresponding Almanac field.
- **SC-002**: A Commander can switch hardpoint state and identify deployment-dependent power
  shedding without leaving the capability.
- **SC-003**: Every package result reported as unavailable is presented as unavailable, with no
  catalogue figure or inferred cause in its place.
- **SC-004**: Every figure and state this capability contributes to the status rail equals the
  corresponding Almanac field for the same active build, read with the hardpoints deployed.
