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

1. Every one of the hull's hardpoints is drawn on one gunsight view, at its published offset from
   the cockpit, with the ones nothing is fitted to told apart from the armed ones.
2. The mount the workspace has open is marked, so the hardpoint being worked on can be found on the
   plate.
3. A target range is chosen, and every shot moves as the range moves.
4. The lateral span, the vertical span, the apparent spread and the widest mount are stated for the
   chosen range, across the armed mounts alone.
5. A hull the catalogue does not place is stated as such, rather than drawn from part of its mounts.
6. A hull the catalogue does place is drawn even when the build has armed none of it: the plate
   keeps its axes, its rings and every one of its mounts, and is given none of the four figures
   about a group of armed mounts.

## Requirements

- **FR-001**: Every offence measurement MUST come from `@elite-dangerous-almanac/core`; the
  application MUST NOT re-sum, derive or estimate a weapon or build metric. Presentational
  proportions over package amounts — a share of a stated total, a bar filled against a stated
  strongest — are not measurements and are permitted where the canvas draws one, provided every
  amount they are drawn from is itself stated (FR-009).
- **FR-002**: Whole-build and per-weapon values MUST use `BuildMetrics.weaponMetrics()`.
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
  the five figures the canvas's columns draw — damage per second, piercing, maximum range and
  falloff range beside the module. Missing damage, range or piercing MUST remain missing.

  > **`RANGE` added 2026-08-25.** The canvas revision of that date gave the weapon list a `RANGE`
  > column, `4,000 m` above `FALL 1,800` on canvas 1d, before the falloff column on canvas 1c. It is
  > the package's own `maximumRange`, which the projection already carries for `damageFalloff()`;
  > nothing is derived and nothing is capped. A weapon the package gives no maximum range remains
  > not stated, exactly as an absent falloff does.

  An earlier revision of this item also required the weapon's slot on the row. The canvas draws its
  weapon rows inert and gives a slot nowhere to go; the row keeps its exact package slot key as its
  identity and its handoff, and does not display it (`design/canvas-contract.md`, review note 5).

- **FR-005**: Disabled weapons MUST remain visible and totals MUST follow the package's enabled-state
  behaviour.
- **FR-006**: Capacitor endurance MUST use `BuildMetrics.weaponsCapacitorMetrics()` for the WEP pips
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
- **FR-011**: The gunsight view is a diagram. It MUST be hidden from assistive technology, and
  **every one of the hull's mounts MUST be stated as text beside it** — including a mount the plate
  does not draw at all. Each mount that is drawn is drawn as **one mark and no other**: a dot where
  its shot lands. A shot further off-axis than the plate shows MUST NOT be drawn; it MUST NOT be
  held at the frame either, because a mark on the margin says a shot lands where it does not.
  Whether a mount is armed and whether it is the mount the workspace has selected MUST each be
  carried by that mount's own sentence as well as by the ink of its mark. How a weapon is aimed, and
  which hardpoint a mark counts, MUST be stated in that sentence, and neither is drawn at all
  (`design/canvas-contract.md`, review notes 17, 20 and 21).

  > **Re-drawn 2026-08-25.** The plate the canvas draws changed in four ways at once, and the
  > requirement follows the drawing: the field of view is `40` milliradians rather than `115`; the
  > plate is square in angle rather than six-sixteenths as tall as it is wide, with only the rings
  > corrected for the box's pixel aspect; a shot outside the field of view is **clamped to the
  > frame's own margin** rather than clipped out of it; and the edge badge with its leader is
  > replaced by a small numeral placed beside the dot, at whichever of the script's four candidate
  > offsets stands furthest from every other dot. The field of view is still a property of the
  > drawing and still never moves to accommodate a build. Every mark is still a sentence — clamping
  > moves a dot, and a moved dot is exactly the case where the sentence is the true reading
  > (`design/canvas-contract.md`, "Canvas revision, 2026-08-25").

  > **Re-drawn again 2026-08-26.** The plate gains the canvas's boresight — a hairline ring on the
  > axis with a filled dot at its centre — which is where the hull itself points and therefore what
  > every shot is offset from. It is a property of the drawing, carries no build state and needs no
  > sentence of its own.
  >
  > The numeral rule is corrected in the same revision. Choosing the corner that stands furthest
  > from every other _dot_ reads the wrong thing: two mounts far enough apart both score their
  > inward corner well and each aims its numeral at the other's, so the dots stay apart and the
  > numerals collide. **No two numerals may be drawn over each other.** A numeral MUST be placed
  > clear of every dot on the plate and of every other numeral; where none of the four corners is
  > clear it MUST step out until it is, and MUST then be tied back to its own dot by a leader, as
  > feature 010's schematics explain a mark that has moved. The dot itself MUST NOT move to make
  > room — a dot is where the shot lands, and that is the reading.

  > **The numerals are withdrawn, 2026-08-27** (maintainer's request), and with them the whole
  > paragraph above: the placement, the leaders and the ring a crowded plate put them out on. A
  > gunsight 172px across carrying a numeral for every hardpoint was a page of digits over a
  > diagram, and every one of them was already the first thing that mount's own sentence says. What
  > is left is one dot a mount, so the plate draws **no text at all**, and which mount a mark counts
  > is read where the offset and the angle are read.
  >
  > **What "not on colour alone" means here, stated exactly.** This requirement used to close by
  > ruling that no distinction on the plate rests on colour alone, which was true while an outline
  > told an armed mount from an empty one. It no longer is, so the claim is withdrawn rather than
  > left standing over a drawing that does not support it: on the plate itself the three states are
  > three hues. What holds instead is that **the plate states nothing on its own** — it is
  > `aria-hidden` decoration whose every mount is restated in text beside it, and every fact those
  > hues separate is also drawn in visible text elsewhere in the same workspace: feature 002's
  > ledger carries one row per hardpoint with its module or its emptiness and marks the selected
  > one, and this panel's own `WEAPONS` block lists what is fitted. A Commander who cannot separate
  > the hues loses no reading, which is what 011 FR-022 is for; a plate that were the only statement
  > of any of it would not be allowed.
  >
  > The three states become three fills of one shape. The outline that told an empty hardpoint from
  > an armed one is withdrawn in the same request — a 7px mark cannot carry a shape difference and
  > an ink difference legibly, and an outline read as another kind of mark rather than as the
  > absence of a weapon. An empty mount takes the armed mount's own hue gone stale, so it reads as
  > _this mount, nothing on it_; the selected mount keeps the cool ink and takes it over either.
  > Neither fact rests on the mark: both are in the mount's own sentence, which is unchanged.

- **FR-012**: Every hardpoint the catalogue places MUST be drawn on the plate whenever its shot is
  inside the field of view, whether or not the build has armed it, at the offset the package
  publishes for that mount. A hardpoint with nothing fitted MUST be told apart from an armed one by
  its mark, and MUST be named as empty in its own sentence beside the plate rather than by that mark
  alone — which is also how it is reported at a range too short for the plate to hold it (FR-011).

  > **Amended 2026-08-26.** This requirement used to close by ruling that no figure the block
  > reports about the group — the two spans, the widest mount and the apparent spread — may be
  > measured across an empty hardpoint. The canvas revision of 2026-08-26 draws none of those four
  > figures anywhere, and no caption for the ring either, so the block no longer reports a figure
  > about the group at all and the sentence has nothing left to constrain. The rest of the
  > requirement is untouched: the sanctioned departure that draws an unfilled hardpoint stands, and
  > it is what a Commander deciding where to put a weapon is reading.

  > **Withdrawn 2026-08-24, reinstated 2026-08-26.** The withdrawal was correct about the drawing
  > and is not being re-argued: `wireConvergence`'s mount array carries hardpoints 1, 2, 3, 4 and 6,
  > the same sample build's hull-anatomy plate marks hardpoint 5 `data-kind="empty"`, and the
  > canvas's marks, spans and widest are all mapped off the armed mounts alone. Neither canvas draws
  > an empty mount on the gunsight.
  >
  > It is reinstated as a **sanctioned departure** at the maintainer's request, on a ground the
  > canvas does not decide: a Commander who has not fitted a weapon yet is reading the plate to find
  > out where a shot from that mount would go, and a plate showing only what is already fitted has
  > nothing to say to them. The offsets are the package's own, published per hardpoint rather than
  > per weapon, so nothing is derived to draw them, and every figure about the group stays measured
  > across the armed mounts as the canvas measures them
  > (`design/canvas-contract.md`, review note 8).
  >
  > The number is the one this requirement always had. Nothing renumbers, and the coverage ledger
  > registers `007/FR-012` again.

- **FR-013**: The mount the outfitting workspace currently has selected MUST be marked on the plate
  and MUST be named as the selected mount in its own sentence beside it. Whether that mount is armed
  MUST still be stated in the same sentence, and the selection MUST be read from the same slot key
  feature 002's ledger and feature 010's hull schematics mark, so the three drawings of one hull
  cannot disagree about which mount is open.

  > **Added 2026-08-26**, and a sanctioned departure like FR-012: neither canvas relates its
  > gunsight plate to the mount its ledger has open (`design/canvas-contract.md`, review note 17).

  > **Amended 2026-08-27.** This requirement used to rule that the selection mark may not replace
  > what the mount's mark already reports, which was a rule about a plate that drew armed against
  > empty as a fill against an outline. With the outline withdrawn (FR-011) a mark carries one fill,
  > so the selected mount takes the selection ink whether or not it is armed and the sentence
  > carries both facts — which is where the requirement always put the reading.

## Edge Cases

- All weapons disabled produces genuine zero totals while retaining the weapon list.
- A zero-capacity capacitor is the package's own result and is stated as such, with no diagnosis of
  which of the package's reasons it was.
- A build dealing no conventional damage draws no damage bar, and no range band claims a share of a
  zero strongest band: with nothing to be read against, no band is given a track at all.
- A recharge that keeps pace is drawn as `∞`, with what the symbol stands for stated beside it.
- A shot whose offset exceeds the plate's field of view at the chosen range is **not drawn**, and
  keeps its sentence, which states its true offset and angle. The field of view is a property of the
  drawing and never moves to accommodate a build, and a mark held at the frame's own margin — which
  is what the canvas does, and what was built until 2026-08-27 — reports a shot landing somewhere it
  does not. At the short end of the track that leaves most of a hull's mounts off the plate, which is
  the honest picture of a target too close for the shots to have converged.
- A hull the catalogue places whose hardpoints are all empty draws every one of them: where a mount
  sits is a property of the hull, and it is exactly the reading a Commander with nothing fitted yet
  is after. Nothing is reported beneath the plate either way — the 2026-08-26 canvas draws no
  figures there.
- A plate crowded enough that two dots overlap draws them overlapping. A dot is where the shot
  lands, and moving one to make it legible would be a wrong answer; the mount's own sentence states
  the offset and the angle exactly, which is the reading either way. _Restated 2026-08-27: this edge
  case used to describe stepping a crowded numeral out on a leader, and the numerals are withdrawn._
- The selected mount may be an empty hardpoint, and is marked as selected either way — that is the
  state a Commander is in while they decide what to put in it. The mark then says _selected_ and its
  sentence says both, because since 2026-08-27 one mark carries one fill: whether a mount is armed
  is stated in words rather than drawn twice.
- The target range reaches 3,000 m, the longest maximum range the package publishes for a weapon on
  this application's reference hull, so the track can be moved to the distance being asked about
  rather than stopping short of it — and no further, because past the range a weapon reaches the
  plate answers a question nobody is asking. _Amended 2026-08-27: the ceiling was 5,000 m from
  2026-08-26._

## Design Scope

`design/canvas-contract.md` is the template. Where this specification and the canvas disagree, the
canvas decides and this file records the outcome. Two such outcomes stand: the row disclosure and the
per-row slot action that an earlier revision required of every weapon are withdrawn, because the
canvas draws its weapon rows inert; and the whole-build firing cost, net drain and returned
allocation are not read at all, because no canvas draws them.

A fourth is recorded on 2026-08-26: the ring caption and the four figures beneath the plate — the
lateral and vertical spans, the apparent spread and the widest mount — are **withdrawn**, because
the canvas revision of that date draws none of them on either artboard. They were canvas-derived
rather than sanctioned departures, so they go when the drawing does. Nothing they reported is lost
to a reader: every mark on the plate is still stated in words beside it, with the offset and the
angle that mount's shot really has.

A third outcome stood with them until 2026-08-26 — FR-012's mark and sentence for an unfilled
hardpoint, withdrawn because the canvas faces an unfilled hardpoint on its own sample and draws
nothing for it. It is reinstated, together with FR-013's mark for the selected mount, as **two
sanctioned departures**: user-facing elements the template does not contain, asked for by the
maintainer and recorded in `design/canvas-contract.md` under review notes 8 and 17 rather than
settled in a stylesheet. Neither adds a figure the package did not publish, and neither moves a
figure the canvas measures.

**The plate departs from the canvas in five more ways from 2026-08-27, all of them the maintainer's
and all recorded before being built** (`design/canvas-contract.md`, review notes 20 and 21): the
hardpoint numerals are withdrawn and each mount is one dot; an empty mount is a fill rather than an
outline; a shot outside the field of view is left off the plate where the canvas clamps it to the
frame; the plate is drawn at `14rem` and its block bounded at the canvas's own 508px; and the filled
dot at the boresight's centre is withdrawn. None of them adds or moves a figure — every reading the
block gives is still the package's own answer, and every fact the drawing separates is stated in the
sentences beside it.

**The canvas moved on 2026-08-25, and this file follows it.** FR-004 gained the `RANGE` column and
FR-011 was re-drawn; the edge case for an off-axis shot changed from clipping to clamping. Two
exclusions were settled by the drawing rather than by argument: canvas 1d's `VS 45% RESIST` block is
no longer drawn anywhere, and canvas 1d is now canvas 1c's own blocks in canvas 1c's own order —
which is the composition this feature already built. `CORROSIVE +30%` survives on canvas 1d and
stays out, because no package field publishes an effect bonus. The whole reconciliation is the table
at the end of `design/canvas-contract.md`.

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
