# Capacitor Endurance Contract

## Boundary and input ownership

Feature 005's `PowerConditionsStore` holds the WEP allocation. It already stores pips in the
package's own `[0, 4]` range, on the game's half step, so the allocation is passed through unchanged:

```ts
const metrics = BuildMetrics.of(loadout);
const result = metrics.weaponsCapacitorMetrics({
  weaponsPips: conditions.pips.weapons,
});
```

Use `WeaponsCapacitorMetrics` from `@elite-dangerous-almanac/core/ships/weapons-capacitor`. The
options object is passed as a literal and its type is inferred from the method, so `WeaponsOptions`
is never named here. Do not call
the standalone calculator, and do not convert, clamp or re-derive the allocation: every value that
store can hold is one the package answers for, and a conversion at this boundary would be a rule this
application invented.

Feature 007 never sets the allocation. The canvas draws the pip control in `POWER` and nowhere else.

## Exact result

Four of the six returned fields are drawn by a canvas and are retained and presented exactly:

| Package field              | Required meaning                                         | Drawn as                   |
| -------------------------- | -------------------------------------------------------- | -------------------------- |
| `capacity`                 | Powered deployed WEP capacity, a stored pool             | Canvas 1d's `WEP CAP` chip |
| `rechargeRate`             | Actual allocation-scaled recharge in MJ/s                | Canvas 1c's `RECHARGE`     |
| `sustainedEnergyPerSecond` | Powered, enabled, deployed sustained firing draw         | Canvas 1c's `DRAW`         |
| `timeToDrain`              | Seconds from full to empty, or package positive infinity | Canvas 1c's `FULL FIRE`    |

No field is calculated from another, and none is combined with another.

`netDrainRate` and `weaponsPips` are **not read**. No canvas draws a net drain, and no canvas prints
the allocation back — so nothing downstream can blank, dash or zero either. This is the rule feature
005 set for `headroom`, `utilisation` and `withinBudget`
(`specs/005-power-and-heat/design/reference-review.md`).

`DRAW` and `RECHARGE` are written in the package's unit. Canvas 1c labels both `MW`; both fields are
MJ/s, and the package wins.

> **Ruled 2026-08-27 — `CAPACITY` is written `MW`, and it is the game's unit rather than the
> package's.** The capacity is a stored pool and its SI unit is the megajoule, which is what this
> block wrote until this ruling and what canvas 1d's chip draws. The game writes `MW` after a
> capacitor pool in the outfitting panel a Commander cross-checks, and one figure written in two
> units across two panels reads as two figures. So this one row takes the game's unit over both the
> canvas's and SI's, while `DRAW` and `RECHARGE` keep the package's `MJ/s` as above.
>
> The figure does not move: `capacity` is copied from the package to the same two decimal places,
> with no conversion or factor applied. The ruling is feature 005's — its distributor table states
> this same quantity for `WEP` and had to answer the same question first
> (`specs/005-power-and-heat/spec.md`, FR-007, and
> `specs/005-power-and-heat/contracts/distributor-metrics.md`). The two blocks state one quantity
> and must not state it in two units, so 007 follows 005 here rather than ruling separately.

## Duration semantics

`timeToDrain` carries one of three meanings, each read off its own field:

| Returned state             | Required semantic wording                    |
| -------------------------- | -------------------------------------------- |
| finite `timeToDrain > 0`   | Localized finite duration                    |
| `timeToDrain === 0`        | Drains immediately                           |
| `timeToDrain === Infinity` | `∞`, standing for a recharge that keeps pace |

No generic number formatter, JSON boundary or visual label receives `Infinity`. The sustained
meaning is drawn as the mathematical symbol for infinity, with the phrase it stands for carried in
words beside it and kept out of sight — the pattern feature 006's unbounded damage and feature 005's
unsettled heat already use, and the one the canvas draws. The symbol is never the package's own
`Infinity` reaching a formatter: it is a message under its own key, and so is its reading, so both
localize. The phrase is programmatically associated with the field either way, which is what makes
the symbol readable rather than decorative.

## Zero capacity

Zero capacity and zero recharge are genuine package numbers and are shown as such. **No cause is
stated.** The package documents several ways to reach a zero-capacity result — no powered
distributor among them — and does not say which one applied, so neither does this application. No
distributor observation, priority band, symbol prefix or `distributorMetrics() === null` is consulted
or drawn beside the figure: no canvas draws one, and an adjacency a reader would read as a cause is
the inference FR-007 forbids.

## Scope separation

`weaponMetrics().total.sustainedEnergyPerSecond` and the capacitor's `sustainedEnergyPerSecond` have
deliberately different scopes:

- weapon totals include the enabled returned weapons;
- capacitor draw includes the powered, enabled, deployed firing weapons.

The whole-build figure is not drawn by any canvas and is not read at all, so the two can never be
confused on the screen. The capacitor facade always models deployed firing, independently of the
hardpoint state feature 005's dashboard is showing.

## Empty, unavailable and disabled contexts

- Confirmed-empty hardpoints retain the exact capacitor result beside the no-fitted-weapons meaning.
- Unavailable hardpoint coverage qualifies completeness; an omitted draw is never estimated.
- All-disabled returned weapons stay visible; a zero capacitor draw with an infinite time to drain
  reads as a load that never drains, not as an endurance claim.
- A genuine zero-energy weapon is not classified as disabled.
- Zero capacity with a positive draw and zero capacity with a zero draw remain different outcomes.

## Localization and accessibility

- MW, MJ/s and seconds use feature 011's active-locale formatters.
- Immediate and no-drain phrases use application message keys.
- The allocation the figures were read at is named in words beside them, without a control.
- Every text value remains available at narrow widths and 400% zoom, and every one of the four is
  written in words whether or not it carries a bar.
- `DRAW` and `RECHARGE` are both MJ/s, share one scale, and are filled against the larger of the two.
  `CAPACITY` is a stored pool and `FULL FIRE` a duration; neither shares a scale with anything beside
  it, so neither is filled (`design/canvas-contract.md`, review note 6). The unit `CAPACITY` is
  written in does not change that — it is `MW` by the ruling above and still not a rate, so it is
  still measured against nothing on this screen.

## Verification

- Deep-equal the four fields at WEP allocations `0`, `0.5`, `2` and `4`.
- Prove the store's allocation reaches the package unchanged, with no division, rounding or clamp.
- Prove `CAPACITY` is written `MW` and both rates `MJ/s`, and that no other row in the block acquires
  the capacity's unit.
- Prove `netDrainRate` and `weaponsPips` appear in no projection, template or message.
- Cover finite duration, immediate drain and the infinite result.
- Cover positive-draw and zero-draw zero-capacity results, and prove neither states a cause.
- Prove the capacitor result is unchanged by the dashboard's hardpoint state.
- Prove exactly two of the four rows carry a filled track, and that the other two say so rather than
  drawing an empty one.
