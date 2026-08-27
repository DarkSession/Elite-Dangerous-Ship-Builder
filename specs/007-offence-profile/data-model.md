# Data Model: Offence Profile

One pure projection, no store, no persisted field. Everything below lives in
`src/app/domain/offence/offence.ts` — with the gunsight geometry in its own
`src/app/domain/offence/convergence.ts` — and is a function of `(loadout, coverage, weaponsPips)`.

## Projection

```ts
export interface Offence {
  /** The exact `weaponMetrics()` result, retained unchanged. */
  readonly build: BuildWeaponMetrics;
  /** The exact returned weapons, in package order, neither sorted nor merged. */
  readonly weapons: readonly FittedWeaponMetrics[];
  /** What the collection means. Never inferred from `weapons.length`. */
  readonly collection: CollectionMeaning;
  /** The four drawn capacitor fields, and what the duration means. */
  readonly capacitor: Capacitor;
  /** The burst total split into the shares the canvas's stacked bar draws. */
  readonly damageSegments: readonly DamageSegment[];
  /** What the enabled weapons land at each of the canvas's four distances. */
  readonly rangeBands: readonly RangeBand[];
  /** Where those weapons' shots go, or why the hull's gunsight could not place them. */
  readonly convergence: Convergence;
}
```

`build` is the package object itself, not a copy: the totals a screen reads are the totals the
package returned, and nothing between them can round, re-sum or relabel a field. `weapons` preserves
the package's own order — hull slot order, then unknown or unmapped slots in source order — and
neither sorts nor merges duplicate symbols.

The count the canvas draws as `5 MOUNTED` is `weapons.length`. It is the one figure this feature
works out that the package does not publish, and it is a count of a returned collection rather than a
measurement (`design/canvas-contract.md`, ruled exception 1).

## Collection meaning

```ts
export type CollectionMeaning = 'populated' | 'noFittedWeapons' | 'coverageUnavailable';
```

| Returned weapons | Feature-002 coverage | Meaning               |
| ---------------- | -------------------- | --------------------- |
| any              | `complete`           | `populated`           |
| empty            | `confirmedEmpty`     | `noFittedWeapons`     |
| empty            | `unavailable`        | `coverageUnavailable` |
| non-empty        | `confirmedEmpty`     | `populated`           |
| non-empty        | `unavailable`        | `coverageUnavailable` |

An empty list is only ever `noFittedWeapons` when feature 002 confirms the hardpoints are empty. The
package's weapon list is the set of weapons it could measure, which is not the set of mounts that
carry a module, so an empty list on its own says nothing about the build.

`coverageUnavailable` qualifies a populated collection rather than replacing it: the weapons the
package did return are still real, and the qualification says only that completeness is unknown.

## One weapon

Nothing is projected. `weapons` is the package's own array, and a presenter
reads `weapon.metrics.damagePerSecond` directly, so there is exactly one place a
figure can come from.

The `AmmunitionCapacity` a weapon carries is **not read**. An earlier revision
turned it into a four-state `Ammunition` union and drew it under a row-owned
disclosure; neither canvas draws an ammunition figure anywhere, the disclosure
is withdrawn (`design/canvas-contract.md`, review note 5), and the field
therefore joins the unread list rather than being projected into a state nothing
displays.

## Damage segments

```ts
export type ConventionalDamageType = Exclude<keyof DamageSplit, 'antiXeno'>;

export interface DamageSegment {
  readonly type: ConventionalDamageType;
  /** The package's own amount, in damage per second. */
  readonly amount: number;
  /** That amount over the conventional total, in `[0, 1]`. */
  readonly share: number;
}
```

One segment per conventional type the build actually deals, in the package's own
field order. Anti-xeno is excluded, because the package documents it as an
overlay on conventional damage rather than a share of it, and a bar that gave it
a slice would describe a total nobody fires. A build dealing no conventional
damage yields no segments at all — the empty array is the state, not a set of
zero-width ones.

`share` is one package amount over the sum of the package amounts beside it.
Both are stated on the same screen, so the proportion adds no figure a reader
cannot check (`design/canvas-contract.md`, ruled exception 2).

## Range bands

```ts
export const RANGE_BANDS = [500, 1000, 2000, 3000] as const;

export interface RangeBand {
  /** The distance to the target, in metres. */
  readonly metres: number;
  /** What the enabled weapons together land there, in damage per second. */
  readonly damagePerSecond: number;
  /**
   * That figure over the strongest band's, in `[0, 1]` — the row's bar.
   *
   * `null` where the strongest band is itself zero, which is the whole set
   * having nothing to be read against rather than a fill of nothing.
   */
  readonly fill: number | null;
}
```

The four distances are the canvas's own. At each, every **enabled** weapon's
returned `damagePerSecond` is multiplied by the package's `damageFalloff()` at
that distance and the results are added. The multiplier is the package's; the
addition is the same addition the package itself performs for `total`, over the
same weapons.

`fill` is each band over the strongest band, and `null` where the strongest band
is itself zero. A build landing nothing at any distance has nothing for the four
rows to be read against, and an empty track reads as a figure of nothing rather
than as "there is nothing to measure this against" (FR-009).

## Convergence

```ts
export type Convergence =
  | { readonly kind: 'unavailable' }
  | {
      readonly kind: 'available';
      readonly mounts: readonly ConvergenceMount[];
      readonly lateralSpanMetres: number;
      readonly verticalSpanMetres: number;
      readonly widest: ConvergenceMount | null;
    };
```

```ts
export interface ConvergenceMount {
  readonly slot: string;
  readonly hardpoint: number;
  readonly offset: GunsightOffset;
  readonly offsetMetres: number;
  readonly weapon: ConvergenceWeapon | null;
}

export interface ConvergenceWeapon {
  readonly name: string;
  readonly symbol: string;
  readonly mount: ModuleMount | null;
}
```

`SHIP_GUNSIGHTS` publishes every player-flyable hull's hardpoint offsets from
the cockpit, in metres. The enumerated hardpoints are walked in the hull's own
order and a returned weapon is matched onto one by its journal slot key, never
by reading a number out of that key — the package documents hulls where the two
disagree. A hull the catalogue does not carry, or one whose gunsight length does
not match its hardpoint count, is `unavailable`: a convergence drawn from some
of the mounts would be a spread nobody has.

`mounts` is the **hull's** list, not the build's: every placed hardpoint is
carried, and one no returned weapon claimed carries `weapon: null`. An earlier
revision carried the armed mounts alone, because neither canvas draws an empty
one; drawing them is a departure sanctioned on 2026-08-26 at the maintainer's
request and recorded as such (`design/canvas-contract.md`, review note 8, and
`spec.md` FR-012).

The weapon is nested rather than flattened because its three fields exist
together or not at all. A mount with a name and no symbol is not a state a hull
can be in, and three optional fields would let a surface read one of them off an
empty mount and print it.

`widest` is `null` when the build has armed nothing. That is **not**
`unavailable`: the two are different answers, and the unavailable sentence says
the package publishes no geometry for this hull, which for a placed hull whose
hardpoints are merely empty would be false. A build with no armed mount keeps
the plate — axes, rings and every one of its mounts, drawn empty — and is given
none of the four figures beneath it, all of which are about a group of armed
mounts.

The spans are distances between two published offsets and `widest` is the mount
furthest from the cockpit's axis, both measured **across the armed mounts
alone**, as is the `apparentSpreadMilliradians` of the view below. An empty
hardpoint is drawn because its offset is the hull's; it fires nothing, so a span
reaching one would be a separation between a shot and no shot. No ballistics are
modelled and no offset is derived (`spec.md` FR-010).

```ts
export const FIELD_OF_VIEW_MILLIRADIANS = 40;
export const PLATE_MARGIN_FRACTION = 0.92;
export const TARGET_RANGE = { min: 500, max: 3000, step: 50, initial: 1500 } as const;
```

These are properties of the **drawing**. The first two are the canvas's own
script's (`wireConvergence`), and the 2026-08-25 canvas revision changed both.
The third is three quarters the canvas's too: `wireConvergence` declares
`MIN = 500, MAX = 5000`, opens at `1500` and quantises to `50`, so only the
ceiling departs — stopped at 3,000 m by preference rather than by a package
fact, a cannon stating 4,500 m and a multi-cannon 4,000 m
(`design/canvas-contract.md`, review notes 18 and 21; the built ceiling was
`5000`, the canvas's own, between 2026-08-26 and 2026-08-27). None of the three changes a figure — each decides what the plate shows
and at what distance the package is asked, never what it answers. The plate is square in _angle_ — both axes map over the same field of
view — and the box it is drawn in is square too, which is what makes that
mapping level: a milliradian then covers the same number of pixels up as
across. The script's correction of a ring's height by the box's own
`offsetWidth / offsetHeight` is one on such a box, so a ring is a circle in
pixels as well as in angle and the plate draws it as `aspect-ratio: 1` rather
than measuring anything.

A shot further off the axis than the plate shows is **not drawn**:
`PLATE_MARGIN_FRACTION` is the canvas's `clamp(50 ± mrad / FOV × 50, 4, 96)`
written as the fraction of the half plate it works out to, and read as the bound
past which a mount has no mark rather than as a place to pin one
(`ConvergencePoint.onPlate`, from 2026-08-27). The field of view never moves to
accommodate a build, and a mark held at the margin says a shot lands where it
does not. `horizontal` and `vertical` therefore carry the shot's own unbounded
fraction, and the sentence stated beside the plate — which carries the offset and
the angle the shot actually has — is the whole reading for that mount
(`spec.md` FR-011).

`convergenceAt(convergence, metres)` asks `projectGunsight` where the shots go at
one range and returns their positions as fractions of the plate, the diagonal of
their spread in milliradians, and the two rings the canvas draws at a third and
two thirds of the field of view. Every mount is placed, the empty ones included —
the package is being asked where a mount points, which it answers from the
offset alone — and only the spread is narrowed to the armed ones, because it is
the one figure there that reports a group rather than a mark.

## Capacitor

```ts
export interface Capacitor {
  /**
   * Megajoules, which the screen writes `MW` after.
   *
   * The projection carries the package's figure and its real unit; the block
   * that draws it takes the game's unit for a capacitor pool instead, so that
   * this reading and the outfitting panel's agree (ruled 2026-08-27,
   * `spec.md` FR-006). Nothing is converted on the way — the two units name
   * one number.
   */
  readonly capacity: number;
  /** Megajoules per second at the read allocation. */
  readonly rechargeRate: number;
  /** Megajoules per second the firing load sustains. */
  readonly sustainedEnergyPerSecond: number;
  /** What `timeToDrain` means. */
  readonly endurance: Endurance;
  /** The WEP allocation the four above were read at. */
  readonly allocation: number;
  /**
   * The draw and the recharge over the larger of the two, in `[0, 1]`, and
   * `null` for both where that larger is itself zero.
   *
   * Here rather than on the screen: a fill is two package amounts divided, and
   * the projection is the one place allowed to divide them. The other two rows
   * carry no fill, because a stored pool and a duration share a scale with
   * nothing beside them.
   */
  readonly drawFill: number | null;
  readonly rechargeFill: number | null;
}

export type Endurance =
  | { readonly kind: 'finite'; readonly seconds: number }
  | { readonly kind: 'immediate' }
  | { readonly kind: 'sustained' };
```

Four of the six returned fields, because four is what the canvases draw. `netDrainRate` and the
returned `weaponsPips` are not selected at all, so nothing downstream can blank, dash or zero one —
the rule feature 005 set for `headroom`, `utilisation` and `withinBudget`.

`CAPACITY` and `FULL FIRE` carry no bar: a stored pool and a duration share a scale with nothing
beside them. `DRAW` and `RECHARGE` are both MJ/s, share one, and are filled against the larger of the
two (`design/canvas-contract.md`, review note 6). `CAPACITY` is written `MW` — the game's unit for a
capacitor pool rather than the package's or SI's, ruled 2026-08-27 with feature 005's distributor
table, which states the same quantity. The unit is all that changed; the figure is the package's.

`Endurance` exists so that `Infinity` never leaves the projection as a number. A positive finite
result carries its seconds; `0` is `immediate`; `Infinity` is `sustained`, which says the recharge
keeps pace and does not claim the weapons can fire.

`allocation` is the store's value, not the package's echo. It is the condition the four figures were
read under, and is drawn as one line beneath the four rows — the panel composes no metric group,
because canvas 1c draws none.

Zero capacity is a genuine package number and carries no cause. The package documents several ways to
reach one and does not say which applied.

## Damage splits

Only `build.total.damageByType` is read, and only its **conventional** members. `kinetic`,
`thermal`, `explosive` and `absolute` are always present; `unclassified` is present exactly when it
is non-zero, and its absence is the package's way of saying zero.

A member that is zero or absent gets no segment and no legend line — which is how both canvases draw
a type a build does not deal, and why nothing here has to distinguish a zero from an omission on the
screen. `antiXeno` and the whole of `sustainedDamageByType` are **not selected**: no canvas draws
either, and the rule feature 005 set is that a field no canvas draws is not read at all
(`design/canvas-contract.md`, review note 7).

The shares are drawn over those amounts and change none of them. No combined anti-xeno total and no
target adjustment is computed anywhere.

## Lifecycle

There is none. The projection is a pure synchronous read of an in-memory loadout, so there is no
pending state, no stale result to discard and no asynchronous failure to publish. Without a build
there is no projection and the panel draws nothing; feature 001's workspace already says why.

The revision is read before the loadout, because the loadout signal holds one mutable package object
and an edit changes its contents without changing the reference.

## What never enters this model

The whole-build firing cost (`energyPerSecond`, `sustainedEnergyPerSecond`, `heatPerSecond`,
`sustainedHeatPerSecond`, `thermalLoad`, `powerDraw` on `WeaponTotals`), `netDrainRate`, the returned
`weaponsPips`, every per-weapon `WeaponMetrics` field beyond the row's five columns, the
`AmmunitionCapacity`, any target result, and any distributor power observation. Each is a field no
canvas draws, so nothing downstream can blank, dash or zero one.

No attenuation model, hardness model, resistance model or projectile path is written anywhere: the
falloff multiplier and the gunsight projection are both package calls.
