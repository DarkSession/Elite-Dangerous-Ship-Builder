# Phase 0 Research: Equipment Builder

Decisions taken before design, each with what it was weighed against. Every one of them is a
decision the plan depends on; nothing here is a preference.

**Revised 2026-09-03 for Almanac 0.2.9.** Three of the gaps this feature was planned around are
closed upstream, and four decisions below change as a result: mounts now have the game's own keys
(2 and 7), the derived combat figures are published (4), and the suit tools exist (9). Each is
marked.

## 1. Where the bench lives in the shell

**Decision.** The bench is a second entry in the tool registry at
`src/app/features/shared/app-navigation.ts`, reachable at `/equipment`, with `/equipment` as the
route prefix it owns. It draws no topbar, no saved list, no help control and no version of its own.

**Rationale.** The spec's first Assumption records the collision: artboard `1a` draws its own
topbar, its own `SAVED LOADOUTS` list and its own `HELP · ABOUT` with a separate application
version, while `Tool Navigation.dc.html` draws one shell over both builders. The shell exists and
is what the application already draws — `src/app/ui/components/app-frame` renders canvas 4c's bar
from `TOOLS` — so the duplicated chrome is the drawing that loses. Two applications' worth of
chrome in one origin would also give a Commander two version numbers for one deployment, which
feature 012 exists to prevent.

**Alternatives considered.** A separate deployable was rejected: saved records, the locale choice
and the update mechanism are cross-tool state living in one browser origin, and splitting the
origin would fork all three. Keeping the bench's own topbar as drawn was rejected for the same
reason plus constitution VII — a screen composes the design system, it does not invent chrome.

## 2. The link format cannot carry held weapons as it stands

**Decision.** Table 1 is regenerated in place, under its own overwrite rule, so that every loadout
writes the **catalogue's whole mount set, addressed by the game's own keys** —
`PrimaryWeapon1`, `PrimaryWeapon2`, `SecondaryWeapon` — rather than the mounts the selected suit
happens to offer. A weapon on a mount the current suit does not offer is held content and encodes;
a weapon on a mount no suit in the catalogue offers is refused.

**Revised for 0.2.9.** The mount set was going to be positional — `primary1`, `primary2`,
`secondary1` — because the package published counts and no keys. [#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24) closed and
`Suit.mounts` now carries `PersonalMount.key`, Frontier's journal `SlotName`. Those are the keys
constitution II asks for, so the positional order is withdrawn: the table holds a `MOUNTS` list of
the three keys, and a loadout addresses a mount by key everywhere — model, format and refusal.
This removes the one departure from constitution II the feature had reserved.

**Rationale.** FR-018a, settled in clarification, requires a link to carry what the bench is
holding. The committed codec refuses exactly that: `equipment-link-codec.ts:84` refuses a loadout
whose weapon count is not the selected suit's mount count, so a Dominator's second primary weapon
cannot survive a switch to a Maverick and back through a link. The fix is the decision the format
already made one field earlier — every item writes all four modification fields whatever its grade
unlocks, because a lowered grade locks a slot without emptying it. A narrowed suit hides a mount
without emptying it, and the same reasoning gives the same answer. It costs the Flight Suit two
empty mount fields, eight bits, against a bound it uses five per cent of.

`docs/equipment-link-codec.md` records that table 1 is under the overwrite rule until the bench's
first release, and that release has not happened: nothing imports the codec yet. The change is
therefore a regeneration, not a table 2.

**Alternatives considered.** A `held` tail after the suit's own mounts was rejected as a second
way to say the same thing — two spellings for one loadout, which is what the addressed-slot rule
was written to avoid. Narrowing FR-018a so links drop held content was rejected: it makes sharing
silently destructive at the one moment SC-007 promises it is not.

## 3. Saved loadouts share the record key space, discriminated in the envelope

**Decision.** A loadout is stored under the existing `edsb:record:<uuid>` key as a
`edsb.local-record` envelope at **version 2**, whose payload is discriminated by a `tool` field
(`"ship"` or `"equipment"`). A version 1 record has no `tool` field and migrates to `tool: "ship"`
on open, under the existing migrate-on-open rule. Enumeration reads the discriminator and needs no
migration to list a row.

**Rationale.** The spec's second Assumption takes `Tool Navigation.dc.html`'s single saved list
holding both kinds, distinguished by the tool that made them. One key space is what makes that
list possible without an index, and `docs/persistence-and-links.md` explains why there is no index
to add a second one to. The envelope's ship-specific fields — `hullSymbol`, `validation`, `build`
— become the ship variant's, and the equipment variant carries the loadout and the suit family in
their place.

**Alternatives considered.** A second key prefix (`edsb:loadout:<uuid>`) was rejected: the shared
list would then be an ordered merge of two enumerations, and every retention, quota, lock and
cross-tab rule in feature 001 would need a second implementation. Adding `tool` to version 1
without a version bump was rejected — a required discriminator that older readers ignore is how a
record gets opened as the wrong kind.

## 4. Derived combat figures wait upstream

**Decision — reversed for 0.2.9.** The bench states damage per shot, headshot damage, damage per
second and sustained damage per second, each as `personalWeaponMetrics(weapon, grade, modifiers,
options)` returns it. The `FIREPOWER` region and the item view's `SUSTAINED DPS` and
`HEADSHOT DPS` lines ship as the canvas draws them.

**Rationale.** [#23](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/23) and [#31](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/31) are closed. `equipment/weapons` now publishes the
calculation, and the three inputs that made it underivable came with it —
`PersonalWeapon.projectiles`, `burstRounds` / `burstRateOfFire`, and `reloadTime` as a
default/upgraded pair. The library's own worked example is the case that made the issue: the
Manticore Intimidator at grade 5 is ten pellets of 5.215, so 52.15 per shot and 65.19 dps, against
the 6.5 a naive product gave.

**How it is called.** Fitted modifiers go in as they are — the call reads `magazineSize` and
`headshotMultiplier` off them and ignores the rest. **Reload Speed is the exception**: it carries
no modifier at all, and arrives as `options.reloadSpeed`, which takes `reloadTime.upgraded` instead
of `.default`. A bench that passed only the modifier list would silently state the unmodified
sustained figure for every weapon carrying that recipe.

**What does not change.** No arithmetic is performed here. The previous decision's reasoning was
right and its answer was "wait"; the wait is over.

## 5. Modification magnitudes come from `applyPersonalModifiers`, including across items

**Decision.** Every modified figure is one `applyPersonalModifiers(stat, base, modifiers)` call.
The suit's own modifiers fold into suit stats; a weapon's fold into that weapon's. **Extra Ammo
Capacity is a suit modification that multiplies a weapon's `reserveAmmo`**, so a weapon's reserve
is computed from the suit's fitted modifiers as well as its own.

**Rationale.** The package documents that exception on `PersonalModification.modifiers`. A bench
that folded only an item's own modifiers would state a reserve the game does not give.

**Also settled:** four recipes — Night Vision, Scope, Stowed Reloading and Combat Movement Speed —
publish an empty `modifiers` array, and four more change stats the catalogue puts no number on.
They are fitted, they are costed, and the bench states no numeric change for them rather than
inventing one (constitution IV). `Scope` swaps the sight, and the two magnifications are on
`PersonalWeapon.scopeMagnification`.

## 6. Equipment text, and the three kinds of it

**Decision.** All package text goes through the existing `GameTextPresenter`, which already
resolves a `(identity, locale) => string | null` lookup into `localized` / `canonical` /
`unavailable` with an honest disclosure. Three new lookups join it: `getSuitName`,
`getPersonalModificationName` and `getMicroResourceName` (already registered for ship materials).

**Rationale.** FR-025 asks that equipment and modification names be asked of the library in the
active locale and never held here, which is what that presenter is. Probed against the installed
0.2.9, the three leaves answer for every key in all six stored locales.

**Two identities have no leaf, and neither is a gap.** A handheld weapon's name is a product name
— "Karma P-15", "TK Aphelion" — that the game leaves in English in every locale, so
`PersonalWeapon.name` is the name; `PersonalModification.engineers` is documented as English names
of the on-foot engineers, which are people's names and equally untranslated. Both present as
`canonical`, which is the state that already exists for a hull name and says what it is rather
than claiming a translation.

## 7. Mount naming is an application string, not an identity

**Decision — reversed for 0.2.9.** A mount name is the library's text, resolved by
`getPersonalMountName(mount, locale)` in `i18n/suits` through the existing `GameTextPresenter`.
This application mints no message key for a mount and keeps no translation of one.

**Rationale.** The plan was to name mounts from this application's own catalogue, because a
positional identity this application invented would have had nowhere else to get a name. With
[#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24) the identity is the library's, and constitution VI is then explicit: game text
belongs to the library, and a local translation table forks the source of truth exactly as a
private catalogue would.

**What that costs today.** Probed on the installed 0.2.9, `getPersonalMountName` answers for
`en-GB` and returns `null` for `de`, `fr`, `es`, `pt-BR` and `ru`. That is [#26](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/26) — closed
upstream, but the values are not in this release, so a mount name presents as **canonical** English
with its provenance stated, which is the state a hull name already uses. It becomes `localized` on
the release that carries the five values, with no change here.

**Alternative rejected.** Keeping application-owned message keys "until the library catches up" was
rejected: it is a private translation of game text, and the temporary version of that is the one
that never gets removed.

## 8. Two link refusal strings are wrong for equipment

**Decision.** `link.error.unknownIdentity` and `link.error.invalidPayload` gain equipment-worded
counterparts, selected by which codec refused. The ship wording stays exactly as it is.

**Rationale.** `docs/equipment-link-codec.md` records the collision and defers it to this feature:
the shipped string says a link "names a hull or module that is not available here", which is
untrue of a personal modification this release publishes and the bench can show. Both codecs raise
`BuildLinkCodecError` with the same codes, so the mapper at
`src/app/application/build-link/link-error.mapper.ts` chooses the wording from the envelope that
refused.

## 9. What is not built

- **Suit tools are now built** — reversed for 0.2.9. [#25](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/25) closed and `equipment/tools`
  publishes four: the Energylink, Profile Analyser, Arc Cutter and Genetic Sampler. The spec's
  Assumption withdrew the region on the stated condition that it returns if the library gains
  them, and it has. See decision 10.
- **Grade upgrade costs.** `equipment/upgrade-costs` is installed and is deliberately not read:
  FR-014 puts the cost of raising a grade outside the material requirement, as the canvas's own
  FAQ does.
- **Reading a payload back in.** Settled in clarification: links and the saved list are the only
  way a loadout comes in.
- **A second theme, a route for the item view, or a private catalogue of any kind.**

## 10. Suit tools are stated, never chosen

**Decision.** The `SUIT TOOLS` region returns, listing the tools whose `suitFamilies` include the
selected suit's family, each with the stats the library holds for it. It offers no choice.

**Rationale.** `PersonalTool.suitFamilies` makes carriage a property of the suit, and the canvas
says the same thing in its own tooltip: "Tools are fitted to every suit and cannot be swapped". So
this is a statement about the selected suit, not a fifth thing to fit — no mount, no grade, no
modification slot, and nothing in the link format or the stored record.

**What it states: names and a count, and no stat.** Both artboards draw a tool as a dashed badge,
its name and nothing else, dimmed and unselectable, under the number of them. The library publishes
battery and timing figures for each — and the Reduced Tool Battery Consumption recipe that would
move `toolEnergyDrain` — and the canvas draws none of it. The canvas is the record: what it does
not draw does not ship, so the stats stay out and this region computes nothing at all.

That the library has more than the region shows is not a reason to show it. Drawing the stats is a
change to the canvas, and it can be made whenever the design wants them.

**Names** come from `getPersonalToolName(id, locale)` in `i18n/personal-tools`, which answers in
all six stored locales ([#29](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/29)).

**One departure from the canvas, and it is data.** The canvas draws three fixed rows — Energylink,
Arc Cutter, Profile Analyser — where the rows a suit actually gets follow its `suitFamilies`
membership: the Arc Cutter is the Maverick's alone, the Genetic Sampler is the Artemis's, and the
Energylink and Profile Analyser are on every suit. So the Maverick draws the canvas's three and the
Artemis draws three different ones. The count in the header is that number, not a literal.

A tool's id is the library's own key and joins to no journal field, which is why nothing stores
one.

No `NEEDS CLARIFICATION` remains, and **no upstream dependency blocks any part of this feature**.
The one outstanding upstream item — the five non-English mount labels of [#26](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/26) — degrades a
name to canonical English and blocks nothing.
