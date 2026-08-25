# Research: Offence Profile

Research used the installed `@elite-dangerous-almanac/core`, its public declarations and live
leaf-import probes; the accepted feature 001/002/003/005/011 artifacts; the current repository
configuration; and `.design/Ship Builder.dc.html` canvases 1c and 1d. No application formula was used.

## Package boundaries and exact types

**Decision**: Retain one exact `BuildWeaponMetrics` from `loadout.weaponMetrics()` for each active
build revision and one exact `WeaponsCapacitorMetrics` from
`loadout.weaponsCapacitorMetrics({ weaponsPips })` for each build/condition revision. Import
`ShipLoadout`, `BuildWeaponMetrics` and `FittedWeaponMetrics` from
`@elite-dangerous-almanac/core/ships/ship-loadout`; weapon result types from `/ships/weapons`;
capacitor types from `/ships/weapons-capacitor`; `damageFalloff` from `/ships/weapons`; module mounts
from `/ships/modules`; hardpoint geometry from `/ships/gunsights`; and hull layouts from
`/ships/ships` and `/ships/slots`.

**Rationale**: These are the public leaf contracts. Retaining the package objects avoids a parallel
numeric model and lets detail and Status select the same build projection.

**Alternatives considered**: Calling data-free weapon/capacitor functions with application-assembled
inputs, importing a broad barrel, component-owned calls and copying every package result into a
second mutable model were rejected as duplicate calculation paths, bundle expansion or mixed-revision
risk.

## Complete weapon output

**Decision**: Retain the whole `BuildWeaponMetrics` and read from it where each figure is drawn.
Present the four the canvas's columns draw — name, `metrics.damagePerSecond`, `armourPiercing`,
`falloffRange` — and preserve returned order. The rest, including `ammunition`, are unread: no canvas
draws them, and the canvas draws its rows inert.

**Rationale**: Runtime probes and declarations agree. The installed package returns known weapons in hull-slot
order and appends unknown/unmapped slots in source order. Reversed Sidewinder input returns
`SmallHardpoint1` then `SmallHardpoint2`; unknown slots retain their source order after the known set.
The required fitted range/piercing projection and ordering are present in the installed package.

**Alternatives considered**: DPS-only summaries, local re-summing, catalogue joins through
`fittedModuleAt()`, local slot sorting and positional navigation were rejected because they discard or
replace public facade behavior.

## Empty, unavailable, disabled and genuine zero

**Decision**: Keep package totals and weapon entries unchanged, and pair them with feature 002's
same-revision package slot coverage. Only an empty weapon list plus confirmed-empty hardpoints means
no fitted weapons. Unavailable coverage receives a separate qualification but no invented weapon
metrics. A non-empty zero-total list remains populated; disabled entries
remain visible.

**Rationale**: Disabled Sidewinder weapons remain in the list with full metrics while all aggregate
fields become zero. Only supported package-resolved module identities reach this
capability. A real zero-damage hardpoint record also exists, so
zero cannot identify absence or disability.

**Alternatives considered**: Treating `weapons.length === 0` as empty, hiding disabled weapons,
inserting non-package entries into the package result, and inferring state from aggregate zero were
rejected as dishonest.

## Damage-type semantics

**Decision**: Draw the conventional members of `damageByType` the build deals as the canvas's stacked
bar, and state each one's exact amount and its share in the legend beside it. A member that is zero
or absent gets no segment and no line. Read neither `antiXeno` nor `sustainedDamageByType`. Compute
no combined total and no target result.

**Rationale**: this is what both canvases draw and all they draw. `DamageSplit` documents
`unclassified` as absent when zero, so an omitted member and a zero member mean the same thing and
are drawn the same way — which is why nothing on the screen has to tell them apart. The share is one
package amount over another with both stated, which is the form feature 006 established for a bar
fill.

**Revised 2026-08-24.** This decision previously read: present burst _and_ sustained values
field-for-field, with `antiXeno` labelled as an overlay and an absent `unclassified` stated as none.
It was implemented as two enumerated lists of every member of both splits, most of them zeroes. No
canvas draws any of that, and it was withdrawn along with the two package fields nothing draws
(`design/canvas-contract.md`, review note 7).

**Alternatives considered**: zero-filling optional structure, labelling it unknown, combining
conventional and anti-xeno, and target resistance simulation were rejected.

## Range, projectile boundaries and piercing

**Decision**: Present `falloffRange` in metres when returned and `armourPiercing` as a rating.
Preserve every absent optional member as not stated.

**Rationale**: A subsurface-displacement missile returns projectile boundaries while omitting
effective distances. Other records omit range or piercing entirely.

**Alternatives considered**: `fittedModuleAt()` joins, catalogue fallback, `armourPiercingFactor()`
and target hardness were rejected as duplicate or out-of-scope calculations.

## Damage at range

**Decision**: Ask `damageFalloff({ maximumRange, falloffRange }, metres)` for each enabled weapon at
the canvas's four distances, and add the results. The multiplier is the package's; the addition is
the same addition the package performs for `total`, over the same weapons.

**Rationale**: An earlier revision of this research rejected `damageFalloff()` as an out-of-scope
calculation, and the specification then placed the whole `DPS BY RANGE BAND` region out of scope on
that basis. Both were wrong. `damageFalloff()` is a published package function that answers exactly
the question the canvas's rows ask, and rejecting it left a third of the canvas unbuilt. The record
is kept here because a rejection that reads as reasoned is the kind that survives review.

**Alternatives considered**: A local attenuation curve, a hardness or resistance model and a
per-weapon target simulation were rejected — the package answers none of them, and the canvas states
no target model.

## Shot convergence

**Decision**: Read the hull's published hardpoint offsets with `getShipGunsight(shipSymbol)`, resolve
each weapon's returned `slot` to a place in that list through
`enumerateSlots(getShipSlots(shipSymbol))`, and place the shots at a range with
`projectGunsight(offsets, metres)`.

**Rationale**: `ships/gunsights` publishes every player-flyable hull's hardpoint offsets from the
cockpit, in metres, in the hull's own hardpoint order — the geometry the canvas's plate draws.
Probing the catalogue confirmed the gunsight length matches the hardpoint count on the hulls checked
(Anaconda 8, Python 5, Fer-de-Lance 5, Sidewinder 2), and `enumerateSlots` is the sanctioned
ordering: the package documents hulls where a slot key's number and its place disagree.

A hull the catalogue does not carry, or one whose gunsight does not line up with its hardpoints, is
reported unavailable whole. A convergence drawn from part of the mounts is a spread nobody has.

**Alternatives considered**: Parsing the slot number out of the key, deriving offsets from the hull
schematic, modelling a projectile path and drawing the mounts the catalogue _did_ place while
dropping the rest were all rejected.

## The WEP allocation and capacitor semantics

**Decision**: Read the WEP allocation from feature 005's `PowerConditionsStore` and pass it to
`weaponsCapacitorMetrics()` unchanged. Retain the four fields a canvas draws — capacity, recharge
rate, sustained draw and time to drain — and map finite positive time, zero time and infinite time to
field-specific wording without replacing the number.

**Rationale**: The package accepts any finite allocation from zero to four, and that store already
holds one, on the game's own half step, in that exact range. There is nothing to convert, so there is
no conversion to get wrong. Stock Sidewinder at WEP 2 returns capacity 10, recharge 0.5598197949…,
draw 2.48 and time 5.207844541… seconds. A distributor disabled with powered lasers returns zero
capacity and a positive draw with zero seconds. A plant that is off, or all weapons disabled, returns
zero draw and infinity — so infinity means the recharge keeps pace, not by itself that firing is
possible.

`netDrainRate` and the returned `weaponsPips` are not read: no canvas draws a net drain, and no canvas
prints the allocation back. This is the rule feature 005 set for `headroom`, `utilisation` and
`withinBudget`.

**Alternatives considered**: Converting the allocation at the boundary, a second pip store,
recalculating recharge or time, and describing every infinity as indefinite firing were rejected.

## Weapon totals versus powered firing load

**Decision**: Read from `weaponMetrics().total` only the two damage figures and the two damage splits
the canvases draw. The whole-build firing cost — capacitor draw, heat, thermal load and plant draw —
is not read at all.

**Rationale**: The two scopes genuinely differ: weapon totals do not apply plant shedding and
capacitor input does, and probes show shed Gauss weapons with a positive aggregate EPS but zero
capacitor draw. The canvas resolves the risk of confusing them by drawing only one of the two, in the
capacitor block, from the capacitor result. Not reading the other is both what the canvas asks for and
the safer answer.

**Alternatives considered**: Drawing both and labelling their scopes, zeroing weapon totals from power
state, and comparing the two as an error were rejected — the first because no canvas draws it, the
others because they change package scope.

## Hardpoint context, and no distributor observation

**Decision**: Consume one boundary — feature 002's `hardpointCoverage()` over the same revision's
slot views, which answers `confirmedEmpty`, `complete` or `unavailable`. Build no distributor power
observation, and state no cause beside a zero capacity.

**Rationale**: Coverage is needed because an empty weapon list is the set of weapons the package could
measure, not the set of mounts carrying a module, and only feature 002 can tell those apart. A
distributor observation is a different matter: no canvas draws one anywhere in the offence panel, so
building one would put a fact on the screen the design does not have, and placing it beside a zero
capacity would read as a cause the package never stated. A zero capacity is shown as the package's own
result and nothing more.

**Alternatives considered**: Diagnosing from capacitor zero, calling `distributorMetrics()` and
parsing null, joining feature-005 consumers to bands, and building the planned mount-power port were
all rejected. The first three infer power semantics this feature does not own; the last builds a
surface the canvas does not draw.

## The status rail cell

**Decision**: Contribute one cell to the rail's six-cell row: the canvas's `DPS`, carrying
`total.sustainedDamagePerSecond` from the same projection the panel reads. A label and a bare figure,
with no unit and no condition. Unavailable hardpoint coverage qualifies it once; an exact zero does
not.

**Rationale**: The canvas draws six cells — `SHIELD`, `ARMOUR`, `DPS`, `JUMP`, `SPEED`, `MASS` — and
`DPS` is this feature's. Its own sample value cannot settle whether the cell means burst or sustained,
because 1c calls `248.6` burst and 1d calls it sustained; the specification settles it as sustained.
Reading the same projection the panel reads is what stops the two disagreeing.

**Alternatives considered**: A second calculation for the rail, qualifying every numeric zero, and
anticipating features 006 and 008's cells were rejected.

## Canonical and localized game text

**Decision**: Preserve `FittedWeaponMetrics.name` as exact canonical package output. Presentation
requests `getModuleName(symbol, locale)` through feature 011's game-text presenter; canonical fallback
is visibly disclosed and missing text remains unavailable.

**Rationale**: The fitted result name is canonical English, not active-locale text. Conflating it
with localized presentation loses the exact source and violates the shared localization boundary.

**Alternatives considered**: Treating `name` as localized, privately translating module names or
overwriting the snapshot's canonical field were rejected.

## Design-reference adaptation

**Decision**: Build canvas 1c's three blocks — `WEAPONS`, `DAMAGE PROFILE` and `SHOT CONVERGENCE` —
in the composition it draws them in. Use canvas 1d only for vertical-card direction and for the
`WEP CAP` field canvas 1c omits. Extend both only with the states no canvas draws.

**Rationale**: Canvas 1c nests damage/range/capacitor beside the weapon summary and puts convergence
full-width beneath; canvas 1d omits that weapon summary, reduces capacitor data and contradicts the
desktop sample's burst/sustained labels. The mock is not a responsive data contract, but it is the
contract for what is on the screen.

**Alternatives considered**: Literal HTML/CSS reuse, copying mobile omissions, target resistance,
alpha/corrosion values, hover meanings, external assets and fixed breakpoints were rejected by the
spec and constitution. Rejecting the shares, the range bands and the convergence region _as well_ was
this feature's own error, recorded above and in
[design/reference-review.md](./design/reference-review.md).

## Repository and verification readiness

**Decision**: Keep the 80% coverage gates and target five layouts per engine with axe plus manual
screen-reader/actual-zoom protocols. Block implementation until feature 011 enables full strictness
and supplies that harness.

**Rationale**: Full strictness and the complete browser/accessibility harness are delivery gates;
planning cannot treat those obligations as optional or replace them locally.

**Alternatives considered**: Calling the current config compliant, reducing the matrix, skipping
accessibility states or implementing private feature-local foundations were rejected.

## Research conclusion

All feature semantics and design choices are resolved, and the installed Almanac has no known feature-007
API blocker. Implementation remains blocked on shared strictness and features 001/002/003/005/011,
including implementation and wiring of the two accepted same-revision integration ports. No planning
clarification remains.
