# Data Model: Equipment Builder

Every game fact here belongs to `@elite-dangerous-almanac/core`. What this feature models is the
set of choices a Commander made, and nothing that can be asked of the package about them.

## Owned by the package (read, never stored)

| Type                                   | Subpath                          | What this feature reads                                                                                                                                                          |
| -------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Suit`                                 | `equipment/suits`                | `family`, `name`, `mounts`, the component stats, and `grades` keyed by grade                                                                                                     |
| `PersonalMount`                        | `equipment/suits`                | `key` — Frontier's journal `SlotName` — and `kind`                                                                                                                               |
| `SuitGrade`                            | `equipment/suits`                | `modificationSlots`, `shieldStrength`, `shieldRegeneration`, and the four resistances                                                                                            |
| `PersonalWeapon`                       | `equipment/weapons`              | `symbol`, `name`, `class`, `slot`, `damageType`, `fireMode`, `rateOfFire`, `magazineSize`, `reserveAmmo`, `headshotMultiplier`, `effectiveRange`, `scopeMagnification`, `grades` |
| `PersonalWeaponGrade`                  | `equipment/weapons`              | `damage`, `modificationSlots`                                                                                                                                                    |
| `personalWeaponMetrics`                | `equipment/weapons`              | every derived combat figure the bench states                                                                                                                                     |
| `PersonalTool`                         | `equipment/tools`                | `id`, `name`, `suitFamilies` — and not the battery or timing stats, which no artboard draws                                                                                      |
| `PersonalModification`                 | `equipment/modifications`        | `name`, `target`, `engineers`, `modifiers`                                                                                                                                       |
| ingredient lists                       | `equipment/modification-costs`   | `getPersonalModificationCost(symbol)`                                                                                                                                            |
| `applyPersonalModifiers`               | `equipment/engineering`          | every modified figure the bench states                                                                                                                                           |
| `sumPersonalEngineeringIngredients`    | `equipment/engineering`          | the material total                                                                                                                                                               |
| `resolvePersonalModificationForWeapon` | `equipment/modification-journal` | which of a three-technology recipe a weapon takes                                                                                                                                |

`equipment/upgrade-costs` is installed and deliberately unread (FR-014).

## Owned here

### `EquipmentLoadout` — committed

Already written at `src/app/domain/equipment/loadout-link/equipment-loadout.ts` and unchanged by
this plan except for `weapons` (below).

| Field               | Type                                        | Rule                                                                                        |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `suitFamily`        | `string`                                    | `Suit.family` — the identity a suit keeps at every grade                                    |
| `suitGrade`         | `number`                                    | a grade the suit publishes; the Flight Suit publishes only `1` (FR-002)                     |
| `suitModifications` | `ModificationSlots`                         | four entries, one per slot, `null` for empty; position is meaning                           |
| `weapons`           | `readonly (FittedPersonalWeapon \| null)[]` | **one per catalogue mount**, in the order `PrimaryWeapon1, PrimaryWeapon2, SecondaryWeapon` |

**The change this plan makes**: `weapons` is the catalogue's widest mount set rather than the
selected suit's. An entry whose mount the selected suit does not offer is _held_ — retained,
excluded from every stated figure and from the material requirement, restored when a suit offering
that mount is selected again (FR-007, FR-018a).

### `FittedPersonalWeapon` — committed

| Field           | Type                | Rule                                                               |
| --------------- | ------------------- | ------------------------------------------------------------------ |
| `symbol`        | `string`            | `PersonalWeapon.symbol`; its `slot` must match the mount (FR-003)  |
| `grade`         | `number`            | a grade the weapon publishes, its own and not the suit's (FR-002a) |
| `modifications` | `ModificationSlots` | four entries; a recipe appears at most once per item (FR-009)      |

### `ModificationSlots` — committed

`readonly (string | null)[]`, always four. A slot beyond what the item's grade unlocks is **locked,
not absent**: it keeps what is in it, contributes nothing to a stated figure and nothing to the
material requirement, and returns to effect when the grade is raised (FR-008, FR-011).

### Mount identity — the library's, not this application's

`PersonalMountKey` — `'PrimaryWeapon1' | 'PrimaryWeapon2' | 'SecondaryWeapon'` — is Frontier's own
journal `SlotName`, published on `Suit.mounts` since Almanac 0.2.9 ([#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24)). It is an
identity and never text: `getPersonalMountName(mount, locale)` in `i18n/suits` is what names one,
so this application mints no key and keeps no translation of its own (research decision 7). A
refusal about the suit rather than a mount says so with this application's own message.

### `MountAvailability` — new, derived

Per mount, one of `offered` (the suit offers it), `held` (it holds a weapon the suit has no mount
for) or `absent` (neither). Derived from the suit's `mounts` on every read;
never stored, because the suit already says it.

### `LoadoutRecordV2` — new persistence variant

The stored envelope gains a discriminator, and the ship fields move under it.

| Field                                                                        | Type                          | Note                                                  |
| ---------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| `format`                                                                     | `"edsb.local-record"`         | unchanged                                             |
| `version`                                                                    | `2`                           | version 1 migrates on open, never on enumeration      |
| `tool`                                                                       | `"ship" \| "equipment"`       | absent in a version 1 record, which means `"ship"`    |
| `id`, `revisionId`, `createdAt`, `modifiedAt`, `name`, `note`, `sourceNamed` | as version 1                  | unchanged, and shared by both tools                   |
| `suitFamily`                                                                 | `string`                      | equipment only; the list column, read off the loadout |
| `loadout`                                                                    | serialised `EquipmentLoadout` | equipment only                                        |
| `hullSymbol`, `validation`, `build`                                          | as version 1                  | ship only                                             |

The allowlist rule holds: the record is built field by field, never by spread, so no stated figure,
material total or catalogue fact can reach storage.

### Bench working state — never stored

Selection (which item the item view is showing), the open dialog, and the undo/redo history are
ephemeral. History is the `outfitting-history` pattern already proven on the ship side: a stack of
committed loadouts, not a stack of edits (FR-022).

## Derived, on every read, from the package

| Reading                                              | How                                                                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suit shield, regen, resists                          | `SuitGrade` at the selected grade, folded through `applyPersonalModifiers` with the suit's unlocked modifiers                                                                   |
| Weapon damage                                        | `PersonalWeaponGrade.damage`, folded with the weapon's unlocked modifiers                                                                                                       |
| Weapon reserve ammo                                  | folded with the weapon's own modifiers **and** the suit's — Extra Ammo Capacity is a suit recipe that moves a weapon's `reserveAmmo`                                            |
| Material requirement                                 | `getPersonalModificationCost` per fitted, unlocked modification, through `sumPersonalEngineeringIngredients`                                                                    |
| Three-technology recipes                             | `resolvePersonalModificationForWeapon(weapon.symbol, journalSymbol)` (FR-015)                                                                                                   |
| Damage per shot, headshot damage, DPS, sustained DPS | `personalWeaponMetrics(weapon, grade, modifiers, options)`. Reload Speed carries no modifier of its own and arrives as `options.reloadSpeed`, which reads `reloadTime.upgraded` |
| The suit tools carried                               | `PERSONAL_TOOLS` whose `suitFamilies` include the suit's `family` — names and a count; no stat of theirs is read                                                                |

A recipe whose `modifiers` array is empty moves nothing and is stated as fitted with no numeric
change. It is never presented as a zero.

## State transitions

| From              | Event                             | To                                                                                                |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| any loadout       | select a suit with fewer mounts   | weapons on the lost mounts become `held`; nothing is discarded (FR-007)                           |
| any loadout       | select any suit                   | the stated suit tools become that suit's; nothing is chosen and nothing is carried over (FR-005a) |
| any loadout       | select a suit offering them again | the same weapons return to effect                                                                 |
| item at grade _n_ | lower to _m_ < _n_                | slots above *m*−1 lock, keeping contents, dropping out of the material total (FR-011)             |
| item at grade _m_ | raise to _n_                      | those slots unlock with what they held                                                            |
| unnamed record    | save under a new name             | named record; the unnamed one is consumed after the write succeeds                                |
| named record      | first modelled edit               | forks an unnamed record carrying `sourceNamed` (feature 001's rule, unchanged)                    |
