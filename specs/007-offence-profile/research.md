# Research: Offence Profile

Research used the installed `@elite-dangerous-almanac/core`, its public declarations and live
leaf-import probes; the accepted feature 001/002/003/005/011 artifacts; the current repository
configuration; and `.design/Ship Builder.dc.html` canvases 1c and 1d. No application formula was used.

## Package boundaries and exact types

**Decision**: Retain one exact `BuildWeaponMetrics` from `loadout.weaponMetrics()` for each active
build revision and one exact `WeaponsCapacitorMetrics` from
`loadout.weaponsCapacitorMetrics({ weaponsPips })` for each build/condition revision. Import
`ShipLoadout`, `WeaponsOptions`, `BuildWeaponMetrics` and `FittedWeaponMetrics` from
`@elite-dangerous-almanac/core/ships/ship-loadout`; weapon result types from `/ships/weapons`;
capacitor types from `/ships/weapons-capacitor`; ammunition from `/ships/ammunition`; and projectile
boundaries from `/ships/modules`.

**Rationale**: These are the public leaf contracts. Retaining the package objects avoids a parallel
numeric model and lets detail and Status select the same build projection.

**Alternatives considered**: Calling data-free weapon/capacitor functions with application-assembled
inputs, importing a broad barrel, component-owned calls and copying every package result into a
second mutable model were rejected as duplicate calculation paths, bundle expansion or mixed-revision
risk.

## Complete weapon output

**Decision**: Preserve the ten total fields and every returned fitted entry exactly. Each entry keeps
`slot`, `symbol`, canonical returned `name`, `enabled`, `ammunition`, optional
`maximumRange`/`falloffRange`/`projectileRange`/`armourPiercing`, and all 14 required
`WeaponMetrics` fields. Preserve returned order and use the exact `slot` for navigation.

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

**Decision**: Present burst and sustained kinetic, thermal, explosive, absolute and anti-xeno values
field-for-field. Optional `unclassified` is present only for non-zero unclassified damage; structural
absence means no unclassified damage and may be omitted or stated as none. Anti-xeno is labelled as an
overlay on conventional damage. Calculate no share, percentage, combined total or target result.

**Rationale**: `DamageSplit` documents unclassified as absent when zero, while anti-xeno overlays the
conventional partition. Guardian Gauss demonstrates an anti-xeno overlay; a Plasma Shock Accelerator
variant demonstrates unclassified conventional output. Calling absent unclassified “unavailable”
would misstate the package contract.

**Alternatives considered**: Zero-filling optional structure, labelling it unknown, copying the
reference's percentage bar, combining conventional and anti-xeno, and target resistance simulation
were rejected.

## Range, projectile boundaries and piercing

**Decision**: Present effective `maximumRange` and `falloffRange` in metres when returned;
`ProjectileRangeBoundaries` as separately named unitless package parameters; and `armourPiercing` as
a rating. Preserve every absent optional member as not stated. Boundary value zero remains present.

**Rationale**: A subsurface-displacement missile returns projectile boundaries while omitting
effective distances. Other records omit range or piercing entirely. The package explicitly says
projectile boundaries are not effective distances and cannot drive attenuation.

**Alternatives considered**: `fittedModuleAt()` joins, catalogue fallback, `damageFalloff()`,
`armourPiercingFactor()`, target hardness and range-band aggregation were rejected as duplicate or
out-of-scope calculations.

## Ammunition semantics

**Decision**: Keep package `null` as carries no ammunition. A capacity keeps exact `clipSize`,
`hopper`, `total` and `unlimited`. Infinite hopper/total with `unlimited: true` receives localized
unlimited wording; finite zero reserve remains numeric zero.

**Rationale**: Probes distinguish laser `null`, finite multicannon capacity, Abrasion Blaster
infinity/unlimited and an 18-round magazine with zero reserve. These are full-rearm capacities, not
current journal ammunition.

**Alternatives considered**: Treating null as unknown, passing infinity through number formatting,
calling zero reserve unlimited, or calculating shots/reloads/firing time were rejected.

## WEP half-pips and capacitor semantics

**Decision**: Accept feature 003's settled integer half-pips and pass
`conditions.pips.weapons / 2` exactly once to `weaponsCapacitorMetrics()`. Retain all six returned
fields and display the returned `weaponsPips`. Map finite positive time, zero time, infinite time with
positive draw and infinite time with zero draw to field-specific wording without replacing the
number.

**Rationale**: The package accepts any finite pips from zero to four; feature 003 deliberately narrows
product input to half steps summing to six. Stock Sidewinder at WEP 2 returns capacity 10, recharge
0.5598197949…, draw 2.48, net drain 1.920180205… and time 5.207844541… seconds. Distributor disabled
with powered lasers returns zero capacity and positive draw with zero seconds. Plant off or all
weapons disabled returns zero draw and infinity. Infinity therefore means no net drain, not by itself
that firing is possible.

**Alternatives considered**: Passing integer half-pips directly, a second pip validator/store,
recalculating recharge/net drain/time, or describing every infinity as indefinite firing were
rejected.

## Weapon totals versus powered firing load

**Decision**: Label `weaponMetrics().total` as enabled returned-weapon output and capacitor
`sustainedEnergyPerSecond` as powered, enabled, deployed firing draw. Never force them to match.

**Rationale**: Weapon totals do not apply plant shedding; capacitor input does. Probes show shed Gauss
weapons with positive aggregate EPS but zero capacitor draw, and a shed distributor with positive
weapon/capacitor draw but zero capacity/immediate drain.

**Alternatives considered**: Zeroing weapon totals from power state, comparing the two EPS values as
an error, or substituting one for the other were rejected because they change package scope.

## Distributor and hardpoint context ownership

**Decision**: Consume two explicit same-revision boundaries: feature 002 supplies package-backed
hardpoint coverage and shared exact-slot targets; feature 005 supplies a deployed distributor
observation through its accepted generalized `MountPowerObservationPort`, backed by its owner-authored
`powerBudget()` interpretation. Feature 007 passes the distributor core slot and explicit `deployed`
state independently of the selected viewing state. Delivery waits on the owner implementations and
wiring, not on a missing type-only contract.

**Rationale**: Feature 002's accepted coverage implementation remains a sequencing dependency.
Feature 005 now owns one exact-slot port for feature 007's core distributor and feature 010's
hardpoint/utility reads, with the observation state explicit so a retracted viewing context cannot
alter feature 007's deployed request. Feature 007 still cannot reconstruct priority shedding or infer
a cause from null.

**Alternatives considered**: Diagnosing from capacitor zero, calling `distributorMetrics()` and
parsing null, joining feature-005 consumers/bands locally, or hiding power context were rejected. The
first three infer or duplicate power semantics; the last fails FR-007.

## Status-provider integration

**Decision**: Export `OffenceStatusProvider` under feature 003's generic envelope. It selects exact
`total.sustainedDamagePerSecond`, supplies package-native firing condition, targets
`offenceProfile`, repeats the captured revisions and returns `qualifiedSummaryIds: ['sustainedDps']`
only when hardpoint coverage is unavailable.

**Rationale**: Feature 003's accepted provider bundle requires an owner-authored feature-007
projection. Sharing the cached weapon projection prevents a second calculation model and leaves
feature 003 responsible only for composition.

**Alternatives considered**: Feature 003 calling Almanac itself, a second unversioned status store,
qualifying every numeric zero, and suppressing retracted output were rejected by ownership and the
package-native firing contract.

## Canonical and localized game text

**Decision**: Preserve `FittedWeaponMetrics.name` as exact canonical package output. Presentation
requests `getModuleName(symbol, locale)` through feature 011's game-text presenter; canonical fallback
is visibly disclosed and missing text remains unavailable.

**Rationale**: The fitted result name is canonical English, not active-locale text. Conflating it
with localized presentation loses the exact source and violates the shared localization boundary.

**Alternatives considered**: Treating `name` as localized, privately translating module names or
overwriting the snapshot's canonical field were rejected.

## Design-reference adaptation

**Decision**: Use canvas 1c's first-class Offence mode, prominent burst/sustained total and scannable
weapon identity/DPS/piercing/range adjacency. Use canvas 1d only for vertical-card and selected-slot
layer direction. Extend both with complete field parity, exact-slot actions and all required states.

**Rationale**: Canvas 1c nests damage/range/capacitor beside the weapon summary; canvas 1d omits that
weapon summary, reduces capacitor data, adds target/convergence calculations and contradicts the
desktop sample's burst/sustained labels. The mock is not a responsive data contract.

**Alternatives considered**: Literal HTML/CSS reuse, copying mobile omissions, inferred bars,
convergence, range bands, target resistance, alpha/corrosion values, hover meanings, external assets
and fixed breakpoints were rejected by the spec and constitution.

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
