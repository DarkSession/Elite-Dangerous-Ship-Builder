# Feature Specification: Mobility, Mass and Jump

## Scope

This capability presents package jump ranges, speed, boost, rotation, mass and capacity for the
active build. Route planning, neutron boosts and application-calculated mass or curve breakdowns are
out of scope.

The `.design` canvases 1c and 1d are the template for what appears and where. Where this
specification and the design disagree, the design decides and this document is corrected — the
inline notes below record each correction and why.

## User Scenarios

### Story 1 — Read jump performance (P1)

1. Maximum, unladen and laden single-jump range, total range and jump count are shown together.
2. Each value identifies its load state and fitted Frame Shift Drive.
3. No usable drive or package-incomplete input produces unavailable output; no fuel produces package zero.

### Story 2 — Read mobility (P1)

1. Speed, boost, pitch, roll and yaw use the selected load and ENG pips.
2. Missing, disabled, unpowered or package-incomplete thrusters produce unavailable build mobility.
3. Hull base values, when shown, are explicitly catalogue facts rather than build estimates.

### Story 3 — Read mass and capacity (P2)

1. Unladen mass, main and reserve fuel capacity and cargo capacity retain package diagnostics.
2. Every fitted module's package-resolved post-engineering mass is shown by slot.
3. A resolved module whose package mass is unavailable makes dependent aggregates unavailable, never zero.

## Requirements

- **FR-001**: Every mobility, mass and jump value MUST come from
  `@elite-dangerous-almanac/core`; the application MUST NOT implement a jump, range, mobility, mass
  or curve calculation.
- **FR-002**: Standard jump values MUST use `ShipLoadout.jumpRangeSummary()` for maximum, unladen and
  laden single and total ranges and jump counts.
- **FR-003**: The application MUST call package jump functions only after required diagnostic mass
  and capacity results are complete. Failure MUST remain unavailable without a guessed value.

  > **The guard is all three standard loads.** `jumpRangeSummary()` resolves the `maximum`, `unladen`
  > and `laden` loads in turn and throws a `TypeError` on the first it cannot, so all three are asked
  > before it is called. A guard on one of them would let the other two throw out of the projector and
  > take the whole anatomy region down, which is the failure this requirement exists to prevent. The
  > issues shown are those of the loads that failed, in the package's own order.

- **FR-004**: Mobility MUST use `ShipLoadout.mobilityMetricsResult()` for selected fuel, cargo and ENG
  pips, and every speed, boost and rotation field the canvas draws MUST come from that one result.

  > **Narrowed to what the canvas draws.** The requirement previously said "show every returned
  > speed, boost, rotation and multiplier field", and a first pass read that as a licence to draw
  > both mass-curve multipliers in a group of their own. Neither canvas draws them: the string
  > `multiplier` does not occur anywhere in `.design/Ship Builder.dc.html`, in any case, and canvas
  > 1c's left card runs `SPEED ENVELOPE AT THIS MASS` straight from its five readings into the card
  > edge. Like FR-006, this requirement says _how_ a reading is obtained if it is drawn, never _that_
  > it is drawn. The five readings the canvas draws are drawn, from one `mobilityMetricsResult()`
  > call; the multipliers are not drawn. `MobilityMetrics.loadedMass` is likewise a returned field
  > that is not drawn as a figure — it is what the canvas's `91% OF OPTIMAL MASS` is measured
  > against.
  >
  > **The allocation is an input, not a line.** The pips this call is made at are also not drawn. An
  > earlier pass stated them in the envelope's heading, on the grounds that five readings which are
  > all functions of an allocation set in another mode would otherwise change meaning silently. The
  > canvas heads that block `SPEED ENVELOPE AT THIS MASS` and writes nothing beside it, and a
  > shortcoming of a control this screen does not own is not licence to add words the template does
  > not have. See "Withdrawn addition" in the [reference review](./design/reference-review.md).

- **FR-005**: A `null` mobility result MUST remain unavailable. Hull base values MUST NOT be
  substituted for it.
- **FR-006**: Aggregate mass and capacity MUST use the package's `unladenMass`, `fuelCapacity` and
  `cargoCapacity` getters, and MUST NOT be recomputed, re-summed or reconciled locally.

  > **Narrowed to what the canvas draws.** The requirement says _how_ an aggregate is obtained if it
  > is drawn, never _that_ it is drawn — and canvas 1c's left card draws no unladen mass and no cargo
  > capacity anywhere. Its legend under the mass bar is `Hull` / `Modules` / `Fuel`, and the only
  > capacity on it is `TANK 32 T + RESERVE` beside the fuel row. An earlier draft of this feature
  > added a four-row "Mass and capacity" group for all three getters, which was a reading the
  > template does not have; it also printed the main tank three times on one card. So the screen
  > draws `fuelCapacity` where the canvas draws it, in the fuel row's own qualifier, and does not
  > draw `unladenMass` or `cargoCapacity` at all. Neither is read: the mass bar's track runs to the
  > thrusters' own maximum supported mass, which is the only maximum the package gives that bar, and
  > a build whose thruster publishes no curve has no track to scale against rather than a substitute
  > one.
  >
  > **Corrected against the installed package.** This requirement previously named
  > `unladenMassResult`, `fuelCapacityResult` and `cargoCapacityResult`. Those getters do not exist
  > in `@elite-dangerous-almanac/core` and their absence is deliberate: the package documents
  > these three aggregates as figures it can always state — a capture's own values while the fit it
  > described survives import, otherwise the hull plus the fitted modules — with `importOutcomes()`,
  > not a `CalculationResult`, as the report that the figure is the normalized fit's rather than the
  > capture's. There is no incomplete form to carry issues from, so no issues are attached. This was
  > a specification error rather than a library gap and is not part of the upstream issue.

- **FR-007**: Per-module mass MUST use package-resolved post-engineering stats and MAY be ordered for
  presentation without being re-summed.

  > **Not drawn on this screen.** Neither canvas lists per-module mass, and the design is the
  > template. What the canvas does draw is the hull/modules/fuel bar, and its modules segment is
  > `buildMass(load).modules` — the package's own split, the mass counterpart of `buildCost()` —
  > rather than a total summed from the fitted modules, which this requirement's own "without being
  > re-summed" already forbids. The requirement stands for the module ledger feature 002 owns, where
  > the per-slot masses are already shown.

- **FR-008**: Frame Shift Drive and thruster thresholds, factors and multipliers MUST be shown only
  when returned by package records or results. A parameter the canvas does not draw is not shown at
  all — the rule bounds what may appear, never what must.

- **FR-009**: The `JUMP`, `SPEED` and `MASS` cells of canvas 1c's status rail MUST be drawn, and each
  MUST carry the same figure, read at the same load and the same ENG allocation and printed at the
  same precision, as the card in the `DRIVES` mode that already states it. The rail closes with a
  grid of six cells — `SHIELD`, `ARMOUR`, `DPS`, `JUMP`, `SPEED`, `MASS` — of which features 006 and
  007 own the first three; these are this feature's, and they were absent from this specification
  while the design has drawn them all along. The design wins.

  > The rail and the two cards are one reading of one build seen twice. A rail cell that weighed the
  > hold, read a different allocation or rounded to different digits would put two different numbers
  > for one quantity on one screen, and both would look like answers.

## Edge Cases

- No fuel is a real zero range; no usable drive is unavailable.
- No cargo capacity makes laden and unladen package results equal.
- Thrusters above supported mass retain the package's zero-performance result.
- Unpowered thrusters remain distinct from absent thrusters.

## Almanac Coverage

`jumpRangeSummary()`, `mobilityMetricsResult()`, `standardLoadResult()`, `buildMass()`,
`frameShiftDrive` and `fuelCapacity` provide every aggregate this screen reads. Mass lock is a
catalogue fact from `getShipBySymbol()`. The thruster's mass curve is `ShipLoadout.thrusters`, the
package's own counterpart of `frameShiftDrive`, which decides what a complete curve is so this
application does not; Supercruise Overcharge capability is the drive record's own
`supercruiseOvercharge` flag.

Four of the canvas's readings had no result in the version of `@elite-dangerous-almanac/core` this
feature started against — the build's loaded mass, the hull/modules/fuel decomposition, the position
on the thruster mass curve, and Supercruise Overcharge capability. All four were raised against the
library, all four are published now, and all four are drawn as the ordinary package readings they
are. See the design's [reference review](./design/reference-review.md) for how each is obtained.

## Success Criteria

- **SC-001**: Every displayed value equals its Almanac field.
- **SC-002**: No local jump, mobility, mass-total or curve calculation exists. Two divisions of
  package figures are not such a calculation and are drawn: the position on the thruster mass curve,
  which is the loaded mass over the module's own `optMass` — the comparison the package's `thrusters`
  getter prescribes rather than one this side invented — and the length of every bar, which is
  decoration beside the package's own number and is a reading of nothing.
- **SC-003**: Zero, unavailable and incomplete results remain distinguishable with package issues.
- **SC-004**: The headline mass and the hull/modules/fuel split beneath it come from one package
  answer read at the load the card names; no part of either is summed, inferred or reconciled on this
  side of the boundary.
