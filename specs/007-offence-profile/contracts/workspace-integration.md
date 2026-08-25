# Workspace, Rail and Slot Integration Contract

## Ownership

- Feature 001 supplies one active `{ loadout, revision }` and the `/build` workspace.
- Feature 002 supplies same-revision package hardpoint coverage, and owns the engineering summary a
  weapon row reuses.
- Feature 005 owns the WEP allocation in `PowerConditionsStore`.
- Feature 007 owns the weapon, capacitor, damage-share, range-band and convergence projections, the
  `OFFENCE` panel and the rail's `DPS` cell.
- Feature 010 owns the anatomy mode strip and the plates the mode replaces. It draws the strip
  whole and left the `OFFENCE` segment disabled for this feature to enable.
- Feature 011 supplies shared components, tokens, localization, game text, previews and the
  accessibility verification harness.

Feature 007 creates no route, no store, no persisted field and no power calculation.

## The mode strip

`src/app/features/build-workspace/outfitting/hull-anatomy/` already draws all five of the canvas's
segments, with `OFFENCE` disabled. This feature enables it, and the region's rule renames to
`OFFENCE ANALYSIS` exactly as it renames to `POWER & THERMALS` for `POWER`. The plates, the side
selector and the legend are hidden for this mode for the same reason and by the same branch.

Which mode is open stays memory-only: it never reaches the route, the fragment, history, storage, the
active build or an export. Leaving the mode restores the mounts exactly as they were.

## Projection

For one active build and the WEP allocation feature 005 holds, in order:

1. read feature 001's revision, then its loadout;
2. call `loadout.weaponMetrics()` exactly once;
3. read feature 002's `hardpointCoverage()` over the same revision's slot views;
4. call `loadout.weaponsCapacitorMetrics({ weaponsPips })` exactly once, with the store's allocation
   passed through unchanged;
5. read the hull's gunsight and slot layout once, and place the armed mounts on it;
6. return one immutable projection.

It is a pure synchronous function of `(loadout, coverage, weaponsPips)`. There is no store, no cache
key, no lifecycle and no pending or failure state: the loadout is already in memory and every package
call is synchronous, so each surface memoises its own read of it in one `computed`. This is the shape
features 005, 006 and 009 already ship.

The chosen target range is _not_ part of it. The projection places the mounts once; where their shots
land at a range is a second, cheaper read over that result, so moving the slider re-places the shots
without asking the package about the build again.

The two surfaces hold one `computed` each rather than sharing a store — which is feature 006's shape
and what "no `application/offence/` layer" means. They cannot disagree all the same, and for a
stronger reason than a shared reference: the projection is a pure function, both call it with the
same three arguments, and a pure function called twice with equal arguments returns equal answers.
What that costs is one extra pair of package calls per recomputation, which is two synchronous reads
of an in-memory loadout.

## Feature-002 hardpoint coverage

`hardpointCoverage(views)` in `src/app/application/outfitting/` answers what this build's hardpoints
are, from the same package-resolved slot views the ledger renders, at the same revision. It:

- uses package slot views rather than parsed names or array positions;
- distinguishes `confirmedEmpty`, `complete` and `unavailable`;
- publishes no weapon metric.

`weapons.length` is never a substitute. An empty metrics list is the set of weapons the package could
measure, not the set of mounts that carry a module.

## The status rail cell

The rail's six metric cells are `SHIELD`, `ARMOUR`, `DPS`, `JUMP`, `SPEED` and `MASS`. Feature 007
contributes `DPS` and nothing else; features 006 and 008 own the rest and are not anticipated here.

The cell carries `weaponMetrics().total.sustainedDamagePerSecond` — a label and a bare figure, with
no unit, no second figure and no condition, because that is what the canvas draws. Unavailable
hardpoint coverage qualifies it once; an exact zero does not, because an exact zero is an answer.

The block draws nothing without a build, and holds no control.

## No slot handoff

A weapon row carries no control and reaches no slot. Canvas 1c draws the rows inert
(`design/canvas-contract.md`, "1. WEAPONS"), and the mount control is in `HULL ANATOMY`, where the
canvas puts it. An earlier revision added a per-row action calling `OutfittingStore.select()`; it is
withdrawn (`design/canvas-contract.md`, review note 5).

The one control this feature owns is the convergence block's target-range field. It sets nothing
outside the panel: the range is a property of the drawing, held in the component, and it reaches no
route, fragment, history entry, storage key, build or export.

## Announcements

Nothing in this feature announces. Both surfaces are read-only projections of the active build, every
change to them is a change a Commander just made somewhere they can see, and neither canvas draws a
live region. The target-range field announces itself, as a native range control does, and nothing
else on the panel speaks.

## Verification

- Prove the `OFFENCE` segment enables, retitles the region and replaces the plates, side selector and
  legend, and that leaving it restores them.
- Prove the mode reaches no route, fragment, history entry, storage key, build or export.
- Prove `weaponMetrics()` and `weaponsCapacitorMetrics()` are each called at most once per projection,
  and that the panel's figure and the rail cell's are the same figure.
- Prove the rail cell's figure is identity-equal to the panel's sustained damage figure.
- Prove no weapon row carries a control, and that activating a row selects nothing.
- Prove the target-range field reaches no route, fragment, history entry, storage key or export.
- Prove no feature-007 source outside the projection asks the package any of its questions.
- Prove moving the target range does not re-run the projection: neither package answer is asked
  again, and the hull's gunsight is read inside that projection, so it is not re-read either.
  What does re-run is `projectGunsight` over offsets already in hand, which is the whole point
  of the control.
