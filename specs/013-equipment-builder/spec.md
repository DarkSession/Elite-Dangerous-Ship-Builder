# Feature Specification: Equipment Builder

**Feature Branch**: `013-equipment-builder`

**Created**: 2026-09-01

**Status**: Draft — ready to plan, see Dependencies

**Input**: User description: "Eqipment builder, see .design"

An on-foot outfitting bench beside the ship one: pick a suit, set its grade, fit
handheld weapons, apply modifications, and read what the resulting Commander is
worth. Drawn in `.design/Equipment Builder.dc.html` at 1640px (artboard `1a`) and
390px (artboard `1b`).

## Clarifications

### Session 2026-09-02

- Q: Where do the combat figures the equipment library does not publish — a weapon's
  sustained damage per second and its headshot damage — come from? → A: The library
  publishes them. The gap is raised upstream, and until that release the bench states
  only the figures the library holds rather than deriving them here.
  **Settled 2026-09-03**: the release landed. Almanac 0.2.9 publishes
  `personalWeaponMetrics`, so the answer stands and the waiting is over — the bench states
  the figures because the library computes them.
- Q: Can a Commander paste a saved loadout payload back into the bench, or is a share
  link the only way a loadout comes in? → A: Links only for this feature. Reading a
  loadout payload back in is recorded as a follow-on feature rather than as out of scope.
- Q: When a loadout is saved or shared as a link, does it carry the weapons and
  modifications the bench is only holding — the ones in a mount the current suit does
  not offer, or in a slot the current grade has locked? → A: Both carry it. A saved
  loadout and a share link round-trip held content as well as what is in effect.
- Q: How is "every figure matches the library, in every combination the library
  publishes" actually checked, given how many combinations that is? → A: Exhaustively
  where no rendering is needed, and over a named representative set end to end.
- Q: Can a Commander set the grade of each fitted weapon separately from the suit's
  grade? → A: Independent per weapon. Each fitted weapon carries its own grade, which
  unlocks its own modification slots.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Assemble a loadout and read what it is worth (Priority: P1)

A Commander opens the bench, chooses one of the personal suits, sets the grade it
is upgraded to, and fills its weapon slots from the handheld weapons the suit can
carry. As each choice is made, the shield strength, regeneration, damage resistances and
firepower of the assembled Commander update beside the loadout.

**Why this priority**: this is the bench. Without it there is nothing to modify,
nothing to cost and nothing to save. It is also the whole of the value for a
Commander comparing two suits before spending at Pioneer Supplies.

**Independent Test**: choose each suit in turn at each available grade, fit a
weapon in every slot the suit offers, and confirm the stated shield, regeneration,
resistance and firepower figures change with each choice and match the equipment library.

**Acceptance Scenarios**:

1. **Given** an empty bench, **When** a Commander selects a suit, **Then** the suit's
   weapon slots are offered according to that suit's primary and secondary counts, and
   the Commander stats state that suit's figures at the selected grade.
2. **Given** a suit at grade 3, **When** the Commander raises it to grade 5, **Then** the
   shield strength, regeneration and each damage resistance restate at grade 5.
3. **Given** a suit offering two primary slots, **When** the Commander switches to a suit
   offering one, **Then** the slot that no longer exists is shown as unavailable rather
   than silently dropping the weapon that was in it.
4. **Given** the Flight Suit, **When** it is selected, **Then** no grade above 1 is
   offered, because it cannot be upgraded.
5. **Given** a fitted weapon, **When** the Commander selects it, **Then** its class, make,
   damage type, fire mode, rate of fire, magazine, reserve, range and per-grade damage
   are stated.
6. **Given** a fitted weapon at grade 3 on a suit at grade 5, **When** the Commander raises
   that weapon to grade 5, **Then** its damage and its unlocked modification slots restate
   at grade 5 and neither the suit nor any other fitted weapon changes grade.
7. **Given** any selected suit, **When** the Commander reads its tools, **Then** the tools the
   library records for that suit are named and counted, and none of them can be selected, changed,
   removed or swapped.

---

### User Story 2 - Fit modifications and see what they cost (Priority: P2)

A Commander applies engineering modifications to the suit and to each weapon,
within the slots the item's grade has unlocked, and reads the micro-resources the
whole loadout would require and which engineers grant each modification.

**Why this priority**: modifications are what distinguishes a planned loadout from
a shopping trip, and the material requirement is the reason to plan one before
going to a settlement. It depends on US1 having something to modify.

**Independent Test**: fit modifications across a suit and three weapons, and confirm
the material requirement is the sum of every fitted modification and changes as
modifications are added and removed.

**Acceptance Scenarios**:

1. **Given** an item at grade 5, **When** the Commander opens its modification slots,
   **Then** four slots are open; at grade 3, two are open and the remaining two are
   shown as locked rather than hidden.
2. **Given** a modification fitted in the fourth slot of a grade 5 item, **When** the
   grade is lowered to 3, **Then** the modification is retained but shown as held by a
   locked slot, and it is not counted in the material requirement.
3. **Given** a loadout with modifications fitted, **When** the material requirement is
   read, **Then** it lists each micro-resource and the total quantity across every
   fitted modification.
4. **Given** a weapon modification whose requirement differs by the weapon's damage
   type, **When** it is fitted to a kinetic weapon and to a plasma weapon, **Then** the
   stated materials are those of the weapon it is fitted to.
5. **Given** any fitted modification, **When** the Commander reads it, **Then** the
   engineers who grant it are named.

---

### User Story 3 - Keep a loadout and come back to it (Priority: P3)

A Commander names a loadout, saves it, and later reopens it from the list of saved
loadouts, or discards one they no longer want.

**Why this priority**: a bench a Commander cannot return to is a scratchpad. It is
below US2 only because a loadout that cannot yet be modified is not worth keeping.

**Independent Test**: save several named loadouts, reload the application, and
confirm every saved loadout reopens with the suit, grade, weapons, grades and
modifications it was saved with.

**Acceptance Scenarios**:

1. **Given** an edited loadout, **When** the Commander saves it under a name, **Then** it
   appears in the saved list identified by that name, its suit and its modification count.
2. **Given** a saved loadout, **When** the Commander opens it, **Then** every choice is
   restored exactly as saved.
3. **Given** a saved loadout, **When** the Commander saves the open loadout under the same
   name, **Then** they are asked whether to overwrite it or keep both copies.
4. **Given** a stored loadout this version cannot rebuild, **When** it is opened, **Then**
   the Commander is told it could not be opened and the stored loadout is left intact.

---

### User Story 4 - Hand a loadout to someone else (Priority: P4)

A Commander exports the open loadout as a link, as a structured payload, or as a
readable summary to paste into a forum or Discord post.

**Why this priority**: sharing is what makes a planned loadout useful to anybody
but its author, but every earlier story stands on its own without it.

**Independent Test**: export a loadout by each offered means, and confirm the link
reopens the same loadout and the readable summary names every fitted item.

**Acceptance Scenarios**:

1. **Given** an open loadout, **When** the Commander copies its link and opens it,
   **Then** the same suit, grades, weapons and modifications are restored, including any
   the bench was only holding.
2. **Given** an open loadout, **When** the Commander exports a readable summary, **Then**
   it names the suit, its grade, each weapon with its grade, and each fitted modification.
3. **Given** a link that names equipment this version does not recognise, **When** it is
   opened, **Then** the Commander is told what could not be resolved and nothing already
   open is replaced by a partial loadout.

---

### Edge Cases

- A suit is changed to one with fewer primary slots while weapons occupy them: the
  weapons in slots the new suit does not have are held rather than discarded, and are
  restored if the Commander changes back.
- A grade is lowered below a slot holding a modification: the modification is held, is
  excluded from the material requirement, and returns when the grade is raised.
- The Flight Suit is selected: its maximum grade is 1, so it unlocks no modification
  slots at all and the modification region states that rather than showing four locked
  slots without explanation.
- The same modification is offered for two different slots of one item: it can be fitted
  once per item, and the second offer states why it is unavailable.
- A weapon is fitted to a secondary slot that is only offered for secondary weapons: the
  choices offered are those the slot accepts, never the whole catalogue.
- Every browser store is unavailable or full: saving fails with a statement of what
  happened, and the open loadout is not lost.

## Requirements _(mandatory)_

### Functional Requirements

**The bench**

- **FR-001**: The application MUST offer every personal suit the equipment library
  publishes, identified by the library's own name and symbol.
- **FR-002**: The application MUST offer the grades each suit supports, and MUST NOT
  offer a grade the library does not publish for that suit.
- **FR-002a**: The application MUST offer the grades the library publishes for each
  fitted weapon, set for that weapon alone and unrelated to the suit's grade, and each
  weapon's grade MUST govern its own attributes and its own unlocked modification slots.
- **FR-003**: The application MUST offer weapon slots according to the selected suit's
  primary and secondary slot counts, and MUST offer in each slot only the weapons that
  slot accepts.
- **FR-004**: The application MUST offer every handheld weapon the library publishes,
  with its make, class, damage type and fire mode.
- **FR-005**: The application MUST state, for the selected item, the attributes the
  library holds for it at the selected grade — for a suit its shield strength,
  regeneration and each damage resistance; for a weapon its damage, rate of fire,
  headshot multiplier, magazine, reserve and range, and its damage per shot, headshot
  damage, damage per second and sustained damage per second. A figure the library does not
  publish MUST NOT be derived here; the derived combat figures are stated because the
  library computes them, not because this application can multiply.
- **FR-005a**: The application MUST name the suit tools the library records for the selected
  suit, and MUST state how many there are. Tools are fitted to every suit and cannot be
  swapped, so they are named and never offered as a choice, never selectable, and carry no
  grade and no modification slot.
- **FR-006**: The application MUST state the assembled Commander's shield strength,
  regeneration, damage resistances and firepower, and MUST restate them whenever a choice
  changes them. Firepower is each fitted weapon's damage per second as the library
  computes it, never arithmetic performed here.
- **FR-007**: A weapon or suit slot that the current suit does not offer MUST be shown
  as unavailable, and its contents MUST be retained rather than discarded.

**Modifications**

- **FR-008**: The application MUST offer the modification slots the item's grade has
  unlocked, and MUST show the remaining slots as locked rather than hiding them.
- **FR-009**: The application MUST offer only the modifications the library publishes
  for that kind of item, and MUST NOT offer one twice on the same item.
- **FR-010**: The application MUST name the engineers the library records as granting
  each modification.
- **FR-011**: A modification held by a slot that is currently locked MUST be retained,
  MUST be excluded from the material requirement, and MUST return to effect when the
  grade that unlocks its slot is restored.
- **FR-012**: Users MUST be able to clear a modification slot.

**Materials**

- **FR-013**: The application MUST state the micro-resources the fitted modifications
  require, as a total across the whole loadout, taken from the library.
- **FR-014**: The material requirement MUST cover one application of each fitted
  modification, and MUST NOT include the cost of raising an item's grade.
- **FR-015**: Where a modification's requirement differs by the weapon's damage type,
  the stated requirement MUST be the one for the weapon it is fitted to.

**Keeping and sharing**

- **FR-016**: Users MUST be able to name the open loadout, save it, reopen a saved
  loadout and delete one.
- **FR-017**: Saving under the name of an existing loadout MUST ask whether to replace
  it or keep both.
- **FR-018**: Saved loadouts MUST survive closing and reopening the application, and
  MUST live only in the Commander's own browser.
- **FR-018a**: A saved loadout and a shared link MUST carry the content the bench is
  holding under FR-007 and FR-011 as well as what is in effect, so that neither saving
  nor sharing discards a choice the Commander has made.
- **FR-019**: A stored loadout this version cannot rebuild MUST be reported as
  unopenable and MUST be left in store exactly as it was.
- **FR-020**: Users MUST be able to export the open loadout as a link that restores it,
  as a structured payload, and as a readable summary.
- **FR-021**: A link that names equipment the application cannot resolve MUST say what
  could not be resolved and MUST NOT replace the open loadout with a partial one. A link
  is the only way a loadout comes in: this feature offers no route for reading an
  exported payload back, and the structured payload of FR-020 leaves the bench for other
  tools the way SLEF does for a ship build.
- **FR-022**: Users MUST be able to undo and redo their outfitting choices.

**Everywhere**

- **FR-023**: Every screen MUST be fully usable on desktop, tablet and mobile, by touch
  as well as pointer, in portrait and landscape, with no horizontal page scrolling.
- **FR-024**: Every string the application owns MUST go through the localisation layer,
  and every number and quantity MUST be formatted for the active locale.
- **FR-025**: Equipment names and modification names MUST be asked of the equipment
  library in the active locale, never translated or held here.
- **FR-026**: Every capability MUST remain usable offline after first load.
- **FR-027**: The bench MUST be reachable at its own address, and that address MUST
  restore the bench directly rather than by way of another screen.

### Key Entities

- **Loadout**: one planned on-foot Commander — a suit at a grade with its modifications,
  a weapon at its own grade with its modifications in each slot the suit offers, and a
  name once the Commander has given it one. A weapon's grade is its own; nothing ties it
  to the suit's.
- **Suit**: a personal suit as the library publishes it — its family, name, the number
  of primary and secondary weapon slots it offers, and the shield, regeneration and
  resistance figures for each grade it supports.
- **Personal weapon**: a handheld weapon as the library publishes it — its make, class,
  the slot kind it occupies, damage type, fire mode, rate of fire, magazine, reserve,
  range and per-grade damage.
- **Modification**: one engineering modification the library publishes for suits or for
  weapons, the engineers who grant it, and the micro-resources one application requires.
- **Material requirement**: the micro-resources a whole loadout's fitted modifications
  require, totalled by resource.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Commander can assemble a complete loadout — suit, grade, every weapon
  slot filled, and modifications in every unlocked slot — in under three minutes.
- **SC-002**: Every figure the bench states matches the equipment library for the same
  suit, weapon, grade and modifications. This is verified exhaustively over every
  combination the library publishes where no screen has to be rendered, and over a named
  representative set of combinations on screen.
- **SC-003**: A Commander can tell, without leaving the bench, which micro-resources and
  how many of each a planned loadout will cost.
- **SC-004**: Every screen passes an automated accessibility check against WCAG 2.0, 2.1
  and 2.2 A and AA with no disabled rules, at desktop, tablet and mobile sizes in both
  supported engines, excepting only the criteria the constitution names.
- **SC-005**: A shared link restores exactly the loadout it was made from — including
  the weapons and modifications the bench was only holding — in 100% of loadouts the
  application can build.
- **SC-006**: Every screen remains fully usable with no network connection after first load.
- **SC-007**: A Commander switching between two suits can compare their protection at the
  same grade without losing the weapons or modifications they had already chosen.

## Assumptions

- **The bench is a tool inside the shared shell, not an application of its own.** Artboard
  `1a` draws its own topbar, its own `SAVED LOADOUTS` list, its own `EXPORT` dialog and its
  own `HELP · ABOUT` with a separate application version. `Tool Navigation.dc.html` draws
  one shell over both builders and asks for a ruling rather than making one. This spec
  assumes the shell: the duplicated chrome is withdrawn and the bench supplies only what is
  particular to on-foot outfitting. Recorded as a design collision to be written into this
  feature's design notes.
- **Saved loadouts share one library with ship builds.** `Tool Navigation.dc.html` draws a
  single saved list holding both, distinguished by the tool that made them.
- **Suit tools are in scope, on the condition this spec set.** The region was withdrawn
  while the library published nothing for it, on the stated condition that it returns if
  the library gains them. [#25](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/25) closed and Almanac 0.2.9 publishes
  `equipment/tools` — four tools, which suits carry each, their battery and timing stats,
  and `i18n/personal-tools` for their names — so the condition is met and the `SUIT TOOLS`
  region of artboard `1a` returns (FR-005a). What returns is what the canvas draws: a
  named, dimmed, unselectable row per tool under a count. The canvas draws three fixed
  rows; which rows appear follows the selected suit's own `suitFamilies` membership, and
  the catalogue holds a fourth the canvas does not draw — the Genetic Sampler, which the
  Artemis carries. The tools' battery and timing stats are published and are **not** drawn
  on either artboard, so they are not stated.
- **Reading a loadout payload back in is a follow-on feature.** Neither artboard draws a
  paste field, and the `EXPORT LOADOUT` dialog of artboard `1a` offers a share link, a
  loadout JSON and a readable summary and nothing inbound. The bench therefore restores a
  loadout from a link and from the saved list only. This is deferred rather than
  rejected: it needs its own design before it can be specified.
- **Grade upgrade costs are out of scope**, as the design's own FAQ states: the material
  requirement covers applying modifications, not raising a grade.
- **Modification quality is not modelled**, consistent with the ship builder's treatment of
  blueprint grades: a fitted modification is a completed one.
- **The compact layout follows artboard `1b`** — a loadout ledger, a stats view and a
  materials view, with item and modification screens reached by drilling in.

## Dependencies

- **`@elite-dangerous-almanac/core` publishes the equipment catalogue and its calculations.**
  The `equipment/` namespace holds `equipment/suits`, `equipment/weapons`, `equipment/modifications`,
  `equipment/engineering`, `equipment/upgrade-costs`, `equipment/modification-costs` and
  `equipment/modification-journal`. Material totalling
  (`sumPersonalEngineeringIngredients`) and per-damage-type modification resolution
  (`resolvePersonalModificationForWeapon`) are the library's, and MUST NOT be
  reimplemented here.

- **The equipment catalogue is localisable.** `i18n/suits` (`getSuitName`,
  `getSuitDescription`), `i18n/personal-weapons` (`getPersonalWeaponDescription`) and
  `i18n/personal-modifications` (`getPersonalModificationName`,
  `getPersonalModificationDescription`) are what FR-025 asks for. Probed on the installed
  package, the three leaves answer for every key — 4 suit families, 11 weapons and 31
  modifications — in all six stored locales, with no miss.

  There is no weapon-name lookup, and the library states that is not a gap: a handheld
  weapon's name is a product name — "Karma P-15", "TK Aphelion" — that the game leaves in
  English in every locale, so `PersonalWeapon.name` is the name in all six. FR-025 is met
  for a weapon by asking the catalogue and being told the name does not vary.

- **Modification magnitudes and the stats they move come from the library.**
  `PersonalModification.modifiers` and `applyPersonalModifiers` in `equipment/engineering`
  carry them, beside the suit-wide component stats (health, mass, battery, oxygen, backpack
  capacities, audible range, line-of-sight analysis) on `Suit` and
  `PersonalWeapon.scopeMagnification`.
  A figure a modified loadout states is that call's answer, never arithmetic performed here.

- **Derived combat figures are published.** [#23](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/23) is closed: Almanac 0.2.9 adds
  `personalWeaponMetrics(weapon, grade, modifiers?, options?)` in `equipment/weapons`,
  returning `damagePerShot`, `headshotDamagePerShot`, `rateOfFire`, `sustainedRateOfFire`,
  `damagePerSecond` and `sustainedDamagePerSecond`. The three inputs that were missing came
  with it — `PersonalWeapon.projectiles`, `burstRounds` / `burstRateOfFire` and
  `reloadTime` — so the `FIREPOWER` region of artboard `1a` and the `SUSTAINED DPS` and
  `HEADSHOT DPS` lines of the item view ship as drawn. Nothing here multiplies: the call
  takes the fitted modifiers, reads `magazineSize` and `headshotMultiplier` off them, and
  takes Reload Speed through its `reloadSpeed` option because that recipe carries its
  magnitude as `reloadTime.upgraded` rather than as a modifier.

- **A suit's weapon mounts now have a published key.** [#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24) is closed: Almanac 0.2.9 replaced the
  `Suit.primarySlots` / `Suit.secondarySlots` counts with `Suit.mounts`, a `PersonalMount[]`
  whose `key` is Frontier's journal `SlotName` — `PrimaryWeapon1`, `PrimaryWeapon2`,
  `SecondaryWeapon` — and whose `kind` is `primary` or `secondary`, listed in the game's own
  order. Constitution II asks for exactly those keys, so the positional order this feature
  reserved is withdrawn and the published keys replace it everywhere — in the loadout
  model, in the link format and in every refusal. Counting a kind is
  `suit.mounts.filter((mount) => mount.kind === 'primary').length`.

  A mount key is an identity and not text. `getPersonalMountName(mount, locale)` in
  `i18n/suits` is what names one, so the name is the library's like every other game noun
  and this application keeps no translation of its own (constitution VI). Probed on 0.2.9
  it answers for `en-GB` only and `null` for the other five stored locales, which is
  [#26](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/26) — closed, but not present in the installed release. Until it lands, a
  mount name presents as canonical English through the same path a hull name already
  takes, which states what it is rather than claiming a translation.

- **Suit tools are published.** [#25](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/25) is closed: `equipment/tools` holds the
  Energylink, Profile Analyser, Arc Cutter and Genetic Sampler, each naming the suit
  families that carry it and the battery and timing stats it has — a stat a tool does not
  have is absent rather than zero. `i18n/personal-tools` names them in all six stored
  locales ([#29](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/29)). FR-005a
  takes the names and the count and not the stats, because neither artboard draws a tool stat;
  the rest of what the library holds here — the battery and timing figures, and the Reduced
  Tool Battery Consumption recipe that moves `toolEnergyDrain` — is available whenever the
  design asks for it.

- **The shared tool shell** exists: `src/app/ui/components/app-frame` draws canvas 4c's bar
  from the tool registry in `src/app/features/shared/app-navigation.ts`, and this feature
  joins that registry as one entry rather than building chrome of its own.
