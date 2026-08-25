# Feature Specification: Offence Profile

## Scope

This capability presents whole-build and per-weapon damage, damage types and their shares, damage at
the canvas's four range bands, shot convergence across the build's hardpoints, and weapons-capacitor
endurance. Target simulation is out of scope, because the Almanac returns no result against a
target. Ammunition is out of scope too: an earlier revision of this file listed it here and no canvas
draws a magazine, a reserve or a reload anywhere on this panel, so the capability neither reads the
package's ammunition subpath nor pre-authorises it.

An earlier revision of this file also placed damage-at-range and shot convergence out of scope, on
the stated ground that the Almanac returns no complete build result for them. That was false. The
package publishes `damageFalloff()` for the per-weapon multiplier at a distance, and
`ships/gunsights` for every player-flyable hull's hardpoint offsets from the cockpit. Both regions
the canvas draws are package-backed and both are built. The record is kept here rather than removed,
because it is why the first implementation shipped a third of the canvas.

## User Scenarios

### Story 1 — Read build damage (P1)

1. Burst and sustained totals are both shown, and each is named.
2. The conventional damage types the build deals are drawn as one bar, each type's share of the
   conventional total sized against the others, with every amount and every share stated in words
   beside it.
3. A conventional type the build does not deal has no segment and no line, as the canvas draws it.
4. Disabled weapons remain listed but contribute to totals only as the package specifies.
5. No fitted weapons is distinct from fitted weapons producing zero totals.

### Story 2 — Inspect weapons (P1)

1. Each weapon shows the four figures the canvas draws for it: its module identity and engineering,
   its damage per second, its armour piercing and its falloff range.
2. Missing fields remain missing rather than being inferred.
3. The build's damage is stated again at each of the canvas's four range bands, using the package's
   own falloff for every enabled weapon.

### Story 3 — Read firing endurance (P2)

1. WEP capacity, recharge, sustained draw and time to drain use the WEP pips the power dashboard is
   set to.
2. A build whose recharge keeps pace is drawn as `∞`, with what the symbol stands for stated
   beside it. It is not described as firing indefinitely: the recharge keeping pace is a fact
   about the capacitor, and how long the weapons can fire depends on ammunition this screen
   does not read.
3. No powered distributor keeps the package's zero-capacity result, stated as the package returns it.

### Story 4 — See where the shots go (P2)

1. The build's armed hardpoints are drawn on one gunsight view, at their published offsets from the
   cockpit.
2. A target range is chosen, and every shot moves as the range moves.
3. The lateral span, the vertical span, the apparent spread and the widest mount are stated for the
   chosen range.
4. A hull the catalogue does not place is stated as such, rather than drawn from part of its mounts.
5. A hull the catalogue does place is drawn even when the build has armed none of it: the plate
   keeps its axes and its rings, takes no mark, and is given none of the four figures about a group
   of armed mounts.

## Requirements

- **FR-001**: Every offence measurement MUST come from `@elite-dangerous-almanac/core`; the
  application MUST NOT re-sum, derive or estimate a weapon or build metric. Presentational
  proportions over package amounts — a share of a stated total, a bar filled against a stated
  strongest — are not measurements and are permitted where the canvas draws one, provided every
  amount they are drawn from is itself stated (FR-009).
- **FR-002**: Whole-build and per-weapon values MUST use `ShipLoadout.weaponMetrics()`.
- **FR-003**: Every conventional damage type the build deals — kinetic, thermal, explosive,
  absolute and unclassified — MUST be stated with its exact returned amount and its share of the
  conventional total, beside the bar that draws those shares. A type the build does not deal MUST
  NOT be given a line, a zero or a segment. No amount may be folded into another type.

  This is the whole damage-by-type reading, because it is the whole of what either canvas draws.
  An earlier revision enumerated every member of both `DamageSplit` results as a labelled figure,
  including a stated zero per unused type and a row for `antiXeno`. No canvas draws any of it; the
  lists were withdrawn and `antiXeno` and `sustainedDamageByType` joined the fields no canvas draws
  and this feature therefore does not read (`design/canvas-contract.md`, review note 7).

- **FR-004**: Every returned weapon MUST remain visible with its identity, its enabled state and
  the four figures the canvas's columns draw. Missing damage, range or piercing MUST remain
  missing.

  An earlier revision of this item also required the weapon's slot on the row. The canvas draws its
  weapon rows inert and gives a slot nowhere to go; the row keeps its exact package slot key as its
  identity and its handoff, and does not display it (`design/canvas-contract.md`, review note 5).

- **FR-005**: Disabled weapons MUST remain visible and totals MUST follow the package's enabled-state
  behaviour.
- **FR-006**: Capacitor endurance MUST use `ShipLoadout.weaponsCapacitorMetrics()` for the WEP pips
  feature 005's shared conditions hold. The application MUST NOT calculate endurance or pip scaling.
- **FR-007**: Infinite duration and zero capacity MUST be expressed by their package meaning, and
  MUST NOT be given a cause the package did not state.
- **FR-008**: Damage at a range band MUST apply the package's `damageFalloff()` to each enabled
  weapon's returned damage per second at the band's distance. The application MUST NOT model
  attenuation, hardness, resistance or a target.
- **FR-009**: A bar MUST be drawn only where the figures it compares share one scale, and every
  figure MUST be stated in words whether or not it carries a bar.
- **FR-010**: Shot convergence MUST use the package's published hardpoint offsets
  (`ships/gunsights`) and its own projection at range. The application MUST NOT derive an offset,
  model a projectile path or place a mount the catalogue does not publish. A hull whose gunsight does
  not line up with its hardpoints MUST be stated unavailable rather than drawn in part.
- **FR-011**: The gunsight view is a diagram. It MUST be hidden from assistive technology, and every
  mark it draws MUST also be stated as text beside it, including a mark that falls outside the drawn
  field of view. Each armed mount is drawn as the canvas draws it: a mark where its shot lands, a
  numbered badge at the plate's nearer edge, and a leader between the two.
- FR-012 — _withdrawn 2026-08-24, and deliberately no longer declared._ This item required a
  hardpoint the build has not filled to be
  drawn on the same plate and stated beside it. It was written on the belief that the canvas's own
  sample fills every hardpoint and so never faces an empty one, which is false: `wireConvergence`'s
  mount array carries hardpoints 1, 2, 3, 4 and 6, and the same sample build's hull-anatomy plate
  marks hardpoint 5 `data-kind="empty"`. The canvas does face an unfilled hardpoint on the gunsight
  and draws nothing whatsoever for it — its marks are mapped off the armed mounts alone, as are its
  two spans and its widest. A mark and a sentence for an empty mount were therefore an invention,
  and both are removed (`design/canvas-contract.md`, review note 8).

  A hull the catalogue places is still drawn whether or not the build has armed any of it, because
  saying the package publishes no geometry for a placed hull would be false. A build that has armed
  nothing gets the plate with its axes and its rings and no marks at all, which is what the canvas's
  own script draws when it has nothing to place.

  The number is retired rather than reused: nothing renumbers, and the coverage ledger registers no
  `007/FR-012`, because there is no drawn surface left for it to register.

## Edge Cases

- All weapons disabled produces genuine zero totals while retaining the weapon list.
- A zero-capacity capacitor is the package's own result and is stated as such, with no diagnosis of
  which of the package's reasons it was.
- A build dealing no conventional damage draws no damage bar, and no range band claims a share of a
  zero strongest band: with nothing to be read against, no band is given a track at all.
- A recharge that keeps pace is drawn as `∞`, with what the symbol stands for stated beside it.
- A shot whose offset exceeds the plate's field of view at the chosen range is clipped from the
  drawing and keeps its sentence. The field of view is a property of the drawing and never moves to
  accommodate a build.

## Design Scope

`design/canvas-contract.md` is the template. Where this specification and the canvas disagree, the
canvas decides and this file records the outcome. Two such outcomes stand: the row disclosure and the
per-row slot action that an earlier revision required of every weapon are withdrawn, because the
canvas draws its weapon rows inert; and the whole-build firing cost, net drain and returned
allocation are not read at all, because no canvas draws them. A third stands with them: FR-012's
mark and sentence for an unfilled hardpoint are withdrawn, because the canvas faces an unfilled
hardpoint on its own sample and draws nothing for it.

## Almanac Coverage

`weaponMetrics()` supplies whole-build totals and per-weapon results; `weaponsCapacitorMetrics()`
supplies pip-aware endurance; `damageFalloff()` supplies the multiplier at a distance; and
`ships/gunsights` supplies each hull's hardpoint geometry with its own projection at range. No
offence measurement is local.

## Success Criteria

- **SC-001**: Every offence value equals its Almanac field, or a proportion of stated Almanac fields
  the canvas draws.
- **SC-002**: No local damage, falloff, endurance or mount-geometry calculation exists; every one
  comes from a package call.
- **SC-003**: Disabled, absent, zero and infinite outcomes remain distinguishable.
- **SC-004**: Nothing user-facing appears that `design/canvas-contract.md` does not sanction, and
  every region it does sanction is present.
