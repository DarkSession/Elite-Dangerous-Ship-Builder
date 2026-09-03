# Contract: the bench

What the bench offers, what it states, and what it refuses. Every figure named here is the
package's answer; this contract fixes which question is asked, never the arithmetic.

## What may be chosen

| Choice                 | Offered from                                                                                  | Bounded by                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| suit                   | `SUITS`, by `Suit.family`                                                                     | every suit the release publishes, and no other (FR-001)                          |
| suit grade             | the keys of `Suit.grades`                                                                     | never a grade the suit does not publish — the Flight Suit offers only 1 (FR-002) |
| weapon, per mount      | `PERSONAL_WEAPONS` filtered by `PersonalWeapon.slot === mount kind`                           | the mount's own kind, never the whole catalogue (FR-003, FR-004)                 |
| weapon grade           | the keys of `PersonalWeapon.grades`                                                           | that weapon's own, unrelated to the suit's (FR-002a)                             |
| modification, per slot | `PERSONAL_MODIFICATIONS` filtered by `target`, and for a weapon by `WEAPON_MODIFICATION_SETS` | never twice on one item (FR-009)                                                 |

A three-technology recipe — Greater Range, Headshot Damage, Improved Hip Fire Accuracy — is offered
as the one `resolvePersonalModificationForWeapon` gives for that weapon, never as three (FR-015).

## Mounts

The catalogue's mount set is `PrimaryWeapon1`, `PrimaryWeapon2`, `SecondaryWeapon` — Frontier's
own journal `SlotName`s, published on `Suit.mounts`. For the selected suit each is:

| State     | Condition                          | Behaviour                                                                                                  |
| --------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `offered` | carried by the suit's `mounts`     | fittable, its weapon counted in every stated figure and in the material requirement                        |
| `held`    | outside them, and holding a weapon | shown as unavailable with its weapon named; counted in nothing; restored on a suit that offers it (FR-007) |
| `absent`  | outside them, and empty            | not drawn                                                                                                  |

A held mount is never silently emptied, and selecting the earlier suit again restores it exactly.

## Modification slots

An item's grade unlocks `modificationSlots` slots, which are always its **first** ones. Four slots
are always addressed:

- a slot the grade has unlocked is open;
- a slot beyond it is **locked and shown**, never hidden (FR-008), keeping whatever is in it;
- a locked slot's modification is excluded from every stated figure and from the material
  requirement, and returns to effect when the grade is raised (FR-011);
- a slot can be cleared (FR-012).

The Flight Suit's one grade unlocks none. The modification region says the suit cannot be upgraded
rather than drawing four locked slots without explanation (spec Edge Cases).

## What is stated

| Reading                                                                          | Question asked of the package                                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| suit shield strength, regeneration, four resistances                             | `SuitGrade` at the selected grade, each folded through `applyPersonalModifiers` with the suit's unlocked modifiers                   |
| weapon damage                                                                    | `PersonalWeaponGrade.damage`, folded with that weapon's unlocked modifiers                                                           |
| weapon rate of fire, magazine, range, headshot multiplier                        | `PersonalWeapon`, folded where a fitted recipe names that stat                                                                       |
| weapon reserve ammo                                                              | folded with the weapon's own modifiers **and** the suit's — Extra Ammo Capacity is a suit recipe that moves a weapon's `reserveAmmo` |
| scope magnification                                                              | `PersonalWeapon.scopeMagnification`, `upgraded` when Scope is fitted                                                                 |
| engineers granting a modification                                                | `PersonalModification.engineers` (FR-010)                                                                                            |
| material requirement                                                             | `getPersonalModificationCost` per fitted **unlocked** modification, through `sumPersonalEngineeringIngredients` (FR-013, FR-014)     |
| damage per shot, headshot damage, damage per second, sustained damage per second | `personalWeaponMetrics(weapon, grade, modifiers, options)` (FR-005)                                                                  |
| the suit tools carried, and how many                                             | `PERSONAL_TOOLS` whose `suitFamilies` include the suit's `family` — their names and their number, and no stat of theirs (FR-005a)    |

A resistance folds on damage taken, which `applyPersonalModifiers` already handles for any stat
whose name ends in `Resistance`. The bench does not reimplement that rule.

A recipe whose `modifiers` is empty — Night Vision, Scope, Stowed Reloading, Combat Movement Speed
— is stated as fitted with no numeric change. It is never rendered as a zero, a dash meaning zero,
or an invented figure (constitution IV).

## Firepower

The `FIREPOWER` region states one row per fitted weapon, each carrying that weapon's damage per
second as `personalWeaponMetrics` returns it. A held weapon contributes no row. The canvas computes
a total across the primaries and does not draw one, so neither does the bench.

**Two calling rules the arithmetic depends on**, both the library's:

- fitted modifiers go in as they are — the call reads `magazineSize` and `headshotMultiplier` off
  them and ignores modifiers naming other stats;
- **Reload Speed carries no modifier at all.** Its magnitude is `PersonalWeapon.reloadTime`'s
  `upgraded` value, reached through `options.reloadSpeed`. A call that passed only the modifier list
  would state the unmodified sustained figure for every weapon carrying that recipe, and nothing in
  the modifier list would reveal it.

## Suit tools

The `SUIT TOOLS` region states the tools the selected suit carries — those whose `suitFamilies`
include its `family` — and offers no choice, because tools are fitted to every suit and cannot be
swapped (FR-005a). A tool is never a mount, never takes a grade, never takes a modification slot,
and appears in neither the link nor the stored record.

**It states no tool stat.** The library publishes battery and timing figures for every tool, and
neither artboard draws one: a row is a badge, a name and nothing else, under a count. The canvas is
the record, so the stats stay out — and with them the `toolEnergyDrain` folding that Reduced Tool
Battery Consumption would otherwise call for. Nothing is computed for this region.

Drawing the stats is a change to the canvas first, not a decision to take here.

## Text

| Text                                         | Source                                                                     | State     |
| -------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| suit name                                    | `getSuitName(family, locale)`                                              | localized |
| modification name                            | `getPersonalModificationName(symbol, locale)`                              | localized |
| micro-resource name                          | `getMicroResourceName(symbol, locale)`                                     | localized |
| weapon name                                  | `PersonalWeapon.name` — a product name the game leaves in English          | canonical |
| engineer name                                | `PersonalModification.engineers` — people's names, English in every locale | canonical |
| suit tool name                               | `getPersonalToolName(id, locale)`                                          | localized |
| mount name                                   | `getPersonalMountName(mount, locale)` — English only in 0.2.9              | canonical |
| slot headings and every label the bench owns | this application's message catalogue                                       | localized |

All of it goes through `GameTextPresenter`, which already renders `canonical` honestly rather than
claiming a translation (FR-025, constitution VI).

## Refusals

Nothing the bench offers can produce a loadout the game could not hold, so a refusal reaching a
Commander comes from ingress: a link, or a stored record. Each names what could not be resolved,
names the mount through a message key where the codec named one, and leaves the open loadout
exactly as it was (FR-019, FR-021).

## Undo and redo

Every outfitting choice — suit, grade, weapon, weapon grade, modification, clearing a slot — is
undoable and redoable (FR-022), on the `outfitting-history` pattern already proven on the ship
side: a stack of committed loadouts rather than a stack of edits. Opening a saved loadout, saving
and exporting are not edits and do not enter the stack.

## Address

The bench is at `/equipment`, restores directly from that address, and carries a loadout only in
the fragment (FR-027, constitution I).
