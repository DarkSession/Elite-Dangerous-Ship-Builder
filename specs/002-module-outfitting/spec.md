# Feature Specification: Module Outfitting and Engineering

## Scope

Commanders can inspect every slot the ledger draws; fit, replace, remove and engineer modules;
manage module power;
name the loaded ship; and undo or redo build edits. Build creation belongs to
[001](../001-ship-selection-and-loading/spec.md); once a build is active, every edit to it — including
its ship name and ident — belongs here.

## Clarifications

### Session 2026-08-20

- Q: Are unknown module identities supported? → A: No. They receive no application compatibility
  behavior. The package always returns fixed mounts populated with their hull defaults.
- Q: Must edits and history preserve what a Commander originally paid for the hull or modules? →
  A: No. Historical purchase values are not build state. Cost presentation always uses the current
  catalogue values supplied by the Almanac.

### Session 2026-08-21

- Q: Is a ship's name the same value as the name a Commander gives the saved build record? → A: Yes,
  one value. The application MUST NOT hold a second copy of it. A record's local identity stays
  independent of that name (001 FR-008).
- Q: Where a capability is offered under some viewing conditions and not others, is it mirrored or
  withdrawn? → A: Per case. Ship name and ident are editable under every viewing condition. A
  separate clear-all action is withdrawn as duplicative: clearing all ordinary engineering, and
  removing only the experimental effect, are already reachable by choosing the explicit "none" entry
  the package offers among blueprint and effect choices. Clearing capability is unchanged.
- Q: Must the game slot key be visible text wherever a slot is presented? → A: No. Presentation
  identifies a slot by its kind, size and, for hardpoints, its node number. The exact game slot key
  remains the slot's identity, the value exchanged with hull anatomy, and available to assistive
  technology. FR-002 fixes slot identity, not slot display.
- Q: May a surface describe an engineering material requirement as a "roll"? → A: No. A material
  requirement is identified by its grade. A selected grade always represents a completed 100% grade,
  so no surface calls it a roll.
- Q: May a keyboard shortcut for reaching replacement search ship? → A: Yes, as an unrequired
  affordance. It MUST NOT become a requirement or an acceptance gate, because the constitution puts
  keyboard operation out of scope, and MUST NOT be the only route to search. Its hint is
  application-owned text: localized, and named for the Commander's platform.

### Session 2026-08-23

- Q: Is a module family the group of choices sharing a displayed package module name, or the
  Almanac's own family taxonomy? → A: The Almanac's. `@elite-dangerous-almanac/core` 0.1.7 gives
  every module an `OutfittingModuleIdentity.familyId` and publishes a localized name for it. The
  family is that package value; the application groups by it and never derives one. Both outfitting
  canvases draw a family holding two differently named articles — `Plasma Accelerator · Fixed` and
  `Plasma Accelerator · Advanced` — which a display-name group cannot produce.
- Q: Do the standard and unique-reward sections survive as a grouping level above families? → A: No.
  Both canvases withdrew them. Families are the only grouping level, and a unique reward is marked by
  its own row label inside its family. The acquisition labels themselves are unchanged.

## User Scenarios

### Story 1 — Fit modules (P1)

1. Every Almanac slot except the planetary approach mount is shown, including empty removable slots;
   every fixed mount is populated when the workspace becomes active.
2. A slot offers exactly the modules the Almanac reports as fittable for the current build.
3. Fitting, replacing or removing a module updates the build and all Almanac results.
   Replacing keeps the mount's power priority group and on/off state; the new module arrives in the
   group the old one was assigned to rather than back at the package's fresh-mount default.
4. A non-removable slot shows the package reason and offers no removal action.

### Story 2 — Find a replacement (P1)

1. Choices are grouped into families in the Almanac's own family order, then by class descending and
   by the package's own price for the article descending; a choice the package publishes no price for
   follows every priced choice of its class, and displayed module name, package rating order
   ascending, stock before variants and the package's own ordinals settle what is left. A unique
   reward is labelled where it sits rather than moved to a section of its own.
2. When a fitted module has an available family, that family alone is revealed by default; otherwise
   the wide composition reveals the first family and the compact one reveals none. A Commander can
   reveal any family without editing the build, and the families they revealed stay as they left them
   through an edit to the same mount. A family the application revealed is brought into
   view where the families are drawn as a list of their own; one the Commander revealed is left
   where they pressed it.
3. Every whitespace-separated search term must match at least one of name, class, rating or weapon
   mount type as a case- and accent-insensitive substring; a choice matches only when every term does.
   Presenting changed search results reveals every family containing a match where the match set is
   within a screenful of the compact composition, and otherwise leaves the compact families closed
   with their counts; the wide composition reveals the first family holding a match. Either way no
   family holding a match is absent.
4. No matches shows an empty result, cleared from the search field itself.
5. Acquisition and entitlement restrictions remain visible before and after fitting.

### Story 3 — Engineer and power a module (P1)

1. Only Almanac-supported blueprints, grades and experimental effects are offered.
2. A Commander can apply or replace a blueprint and grade, add, replace or remove only an
   experimental effect, or clear all ordinary engineering. Removing only the effect preserves the
   blueprint and grade.
3. Grades are always modelled at 100% quality. Resolved imported partial quality is normalised; an
   incoming build whose partial engineering cannot be resolved and completed losslessly is refused
   before activation.
4. Enabled state and priority update every affected package calculation while mass and cost remain
   because the module is still fitted.

### Story 4 — Undo and redo (P2)

1. Every Commander-authored build edit still held in the retained history can be undone and redone
   during the session.
2. A new edit after undo discards the redo path.
3. One Commander decision creates one history step.
4. Naming the ship or setting its ident is one such decision and is undone and redone like any other
   edit.

## Requirements

- **FR-001**: Outfitting MUST require an active build and MUST NOT create one.
- **FR-002**: Slots, module facts, post-engineering attributes, compatibility, removability and edit
  results MUST come from `ShipLoadout`. Slot identity MUST be the game slot key, never position.
- **FR-002a**: The ledger MUST draw every mount `ShipLoadout.slots()` returns, in the package's own
  order, with two stated exceptions. The cargo hatch MUST be drawn after the core internals and
  before the optional internals. The planetary approach mount MUST NOT be drawn at all, and MUST be
  recognised by the package's `planetaryApproachSuite` restriction rather than by the spelling of its
  slot key (FR-002). Both exceptions are presentation and nothing else: the withheld mount stays
  ordinary build state, still fitted, still read by every package calculation, still exported and
  still carried by a build link.

  > **Ruled 2026-08-31 (Commander request).** The package enumerates the cargo hatch last, after the
  > optional internals. The ledger already lists it under `CORE`, which is where both canvases draw
  > it, so the `ALL` list was the one place that put every optional mount between the core internals
  > and the hatch. Drawing it where its own category already puts it makes one order out of two.
  >
  > All 48 hulls the installed package publishes carry exactly one planetary approach mount, and
  > every default loadout fits the advanced suite in it. The mount takes two modules, and the
  > package gives them the same class, the same rating, the same 0 t of mass, the same 0 MW of draw,
  > the same 500 Cr and no engineering group either side — so the row is a choice between two names
  > and no figure this application draws. Hull detail leaves the same mount out of its counts
  > (001/FR-022).
  >
  > Two consequences are stated rather than discovered, because the mount is removable and the row
  > is the only place either was offered. There is no route to choose the plain suite over the
  > advanced one, so a build that opens with one keeps it. And there is no route to empty the
  > mount, so a build link that recorded it empty before this rule opens with it empty and draws
  > nothing for it.

- **FR-003**: Missing facts for package-resolved modules MUST remain unavailable rather than becoming
  zero or an estimate. Only package-resolved module identities are supported.
- **FR-004**: Replacement choices MUST contain the stock form and each package pre-engineered
  variant of every currently fittable module, with no application-added candidates.
- **FR-005**: Search and ordering MAY arrange package records but MUST NOT alter their values or admit
  an unfittable module. Search MUST cover exactly four fields — the displayed package name for the
  active locale, class, rating and weapon mount type — matching a choice only when every search term
  matches at least one of them. The no-match and clear-search states MUST be explicit. Within a
  family the leading order keys MUST be numeric class descending and then the package's own price for
  the article descending; a choice the package publishes no price for MUST follow every priced choice
  of the same class rather than sorting as though it were free.

  > **Ordered by class and price 2026-08-27 (Commander request).** The name led, so a family read
  > `Beam Laser` before `Burst Laser` before `Cannon` and a Commander looking for the biggest thing
  > that fits their mount read down all three. A mount is shopped by size first and by what the best
  > of that size costs second, so those are the two keys that lead; the name is a tie-break, and the
  > rating, the stock-before-variant rule and the package's ordinals still settle the rest, so the
  > order stays total and stays reproducible.
  >
  > The price is the package's own catalogue figure for that exact article — the same value the
  > choice's own `COST` cell states — read and never computed. A Merc Coin price is not converted
  > into it and not weighed against it, because there is no rate to convert at (constitution IV), so
  > an article the package prices only in coin has no credit price and takes the unpriced place.

- **FR-006**: Choice and fitted-module labels MUST reflect package acquisition and entitlement data.
  Community-goal and event rewards MUST be identified as unique rewards; Mercenary and tech-broker
  variants MUST be identified as not ordinarily available. A choice MAY carry multiple labels.
- **FR-007**: A fitted variant MUST be recognized only by `FittedModule.preEngineeredVariant`.
  Variant purchase grade and current ordinary engineering grade MUST remain distinct.
- **FR-008**: Fitting, replacing and removing MUST use package edit operations and surface their
  structured refusal results.
- **FR-009**: The cargo hatch MUST expose its facts and editable power state but MUST offer no
  replacement, search, engineering or removal because the package offers none.
- **FR-010**: On load, package construction MUST populate every absent or unusable fixed mount with
  that hull's package default before any calculation. The returned fixed module is ordinary build
  state; the application MUST NOT run a repair pass, retain source-empty provenance or model an
  empty/default-unavailable outcome.
- **FR-011**: Package-defaulted fixed mounts MUST NOT create an application edit-history entry.
- **FR-012**: Blueprint and effect identities MUST use package `fdname` values. Each module MUST
  support applying and replacing a blueprint and grade, adding, replacing and removing only an
  experimental effect, and clearing all ordinary engineering exactly as the package permits.
  Removing only the effect MUST preserve the blueprint and grade. Availability, modified attributes
  and restrictions on further engineering MUST come from the package.
- **FR-012a**: The engineering surface MUST present every numeric attribute the package publishes on
  the fitted article, and only those the article itself carries. Where a reading is drawn from more
  than one package record — the stock column of an identified pre-engineered variant is read from the
  catalogue rather than from `stats` — an attribute either record carries MUST be presented, with the
  absence stated in the reading that has no figure for it. It MUST NOT present a chosen subset, and
  MUST NOT invent, derive or estimate an attribute the package does not publish. Where the
  package calculates a figure for the kind of article the mount holds, that figure MUST be presented
  beside the catalogued attributes, on both readings, and MUST come from the package's own
  calculation rather than from arithmetic over the rows: a weapon's damage per shot and per second,
  sustained damage per second, sustained rate of fire, distributor draw and heat are what a recipe
  is chosen
  for, and a Commander MUST NOT have to multiply two rows to read one of them. A calculated figure
  MUST NOT be offered where it would not be a second reading. Three cases: an article the package
  does not measure as a weapon, which would be answered with the calculation's own defaults; a
  continuous-fire weapon, whose damage, draw and heat are already per second and whose cadence
  figures are what the calculation carries a weapon with no shots by; and a figure whose two
  readings both equal another row's, which is what a weapon that never stops to reload does to its
  sustained figures. A figure that repeats on one reading and moves on the other is a reading and
  MUST be kept. A defaulted zero, a placeholder and a repeated figure are all rows a Commander
  learns nothing from. Attribute labels
  are application-localized; the package's own field identities MUST NOT reach a screen. The stock
  reading MUST be shown whether or not the module is engineered; the modified reading MUST be shown
  exactly when there is a selection or existing engineering to compare against, and a selection the
  package refuses MUST remain unavailable rather than becoming a comparison. A published boot time of
  zero MUST NOT be drawn: it is a real reading that reports no delay, and a row stating it tells a
  Commander nothing. No other published figure may be suppressed, and a zero elsewhere is data. The
  module's purchase cost is not an attribute and MUST NOT be presented as one: it is stated by the
  choice row it is bought from and totalled for the build, not by what the article does. Attributes
  MUST be presented for every fitted article, including one the package will accept no further
  engineering for.
- **FR-012b**: Where the surface draws the details and the engineering inline, neither the surface nor
  either side of it MAY scroll within itself in the block axis: both sides MUST expand to the whole of
  what they hold, the surface MUST be as tall as the taller of them, and the page MUST carry the
  result. A labelled wide fact table keeps its own inline-axis scroller, which is the one internal
  scroll the responsive rules allow and what keeps the document from scrolling horizontally. Both sides
  MUST keep their positions for every fitted article: where there is nothing to engineer, the side
  that would carry the controls MUST state why, and the attributes MUST stay on the side they occupy
  otherwise.

  > **Ruled 2026-08-27 (Commander request).** Each side used to scroll in its own column inside a
  > panel bounded to a share of a workspace column that was itself bounded to the screen. Three
  > nested boxes, and the innermost was where the reading actually was: a weapon publishes seventy
  > attribute rows and they were read four at a time, with the recipe beside them in a second short
  > window. Nothing about that is a comparison read side by side, which is what the two columns are
  > for.
  >
  > So nothing here bounds itself any more. The panel is as tall as its taller half, the workspace
  > column releases to hold it, and the page scrolls — which is the release the anatomy region's
  > dashboards already make, for the same reason and by the same rule, and the one a short viewport
  > makes for the whole workspace. This supersedes the wave-11 ruling that gave each side its own
  > scroller: that ruling was made because one shared scroller measured both halves against the
  > taller of them, and a surface with no scroller at all cannot do that either.
  >
  > The full-screen composition is untouched. It owns the whole screen and has no page to grow into,
  > it already draws the two halves as one column, and the layer that holds it is what scrolls.

- **FR-012c**: The engineering surface MUST NOT draw a materials list of its own. Material
  requirements are stated once, as the build-wide total feature 009 draws in the status rail; that
  total already includes what a selected recipe adds, so no figure is lost by the omission.
- **FR-013**: Every selected ordinary grade MUST represent 100% quality. Partial imported quality on
  each supported resolved module MUST be normalised to 100% through the package. If the package
  cannot resolve the engineering identity or otherwise cannot complete the grade losslessly, the
  entire incoming build MUST be refused before activation, the current build MUST remain unchanged,
  and the refusal MUST identify the affected slot and engineering identity. The application MUST NOT
  change only its quality scalar, strip engineering, retain the partial roll or fabricate modifiers.
  A completion is not reported to the Commander: the notice that did so was withdrawn on
  2026-08-27, because it is a remark about a build they now have open rather than a decision they
  are being asked to take.
- **FR-014**: Engineering material costs MUST use package cost results, wherever they are stated.
  Fixed pre-engineering MUST add no craft cost unless the package reports separately selected
  ordinary engineering.
- **FR-015**: Enabled state and zero-based priority MUST be edited through `ShipLoadout`; presentation
  MUST use the Commander's one-based priority labels. Where the source states no group, presentation
  MUST show the group the package puts the module in rather than reporting the value as unavailable;
  the modelled field MUST stay absent, so nothing is written into the build. Any edit that re-fits a mount — a fit, a
  variant fit, or putting a purchase back — MUST carry the mount's power state onto the article that
  lands there: a group the outgoing module was assigned MUST be set again on the incoming one, and
  the on/off state it stated MUST be stated again. The carry MUST be part of the same package edit
  and the same Commander decision as the edit that reset it, and MUST write no field the outgoing
  module did not carry — an unstated group and an unstated on-state stay unstated, because the
  package already answers both.

  > **Ruled 2026-08-26.** The chip drew a `—` for an unstated group, on the grounds that choosing one
  > would be a decision nobody made. Nobody was being asked to: `PowerConsumer.priority` documents the
  > absent case as defaulting to group 1, and `powerBudget()` had already put the module in band 1 —
  > where the power panel lists it and where it is shed. The chip was the one place in the
  > application saying otherwise, and `ShipLoadout` resets the group on every fresh mount, so it said
  > it about every module a Commander had fitted.

  > **Carried across a swap 2026-08-27 (Commander request).** That reset is the other half of the
  > same sentence, and it was being taken as the end of it. A Commander who had put their shield
  > generator in group 3 and switched a heat sink off, and then swapped either for a bigger one, got
  > the mount back at the package's fresh-mount default — the priority spread they had built undone
  > by a size upgrade, silently, on a screen that does not draw the group beside the fit control.
  >
  > `setModule` documents exactly this and says what to do about it: "Fitting is a fresh mount: the
  > slot's `On`, `Priority` and `Health` are reset. Set them again if your screen keeps a priority
  > group across a swap." So this is not a package defect and not a rule of ours — it is the package
  > offering the decision, and the decision is that a mount's power assignment belongs to the mount
  > rather than to the article that happened to be in it. Engineering still does not carry, which is
  > the opposite answer to the neighbouring question and the right one: a blueprint is a job done to
  > an article and a priority group is where a Commander decided that mount sits in the shed order.
  >
  > **Health is not carried, because this application does not model it.** It is the third field the
  > package resets and the only one of the three no screen here reads or writes, so there is nothing
  > of a Commander's to preserve.

- **FR-016**: Undo and redo MUST restore all modelled fields exactly, recompute package results and
  cover module, engineering, power, ship name and ident edits. Captured purchase values MUST NOT be
  retained as modelled fields or history state.
- **FR-017**: History MUST retain exactly the 100 most recent Commander decisions, remain
  session-only and be discarded when the active build is replaced. It MUST NOT enter storage, links,
  SLEF or browser navigation.
- **FR-018**: Viewing conditions and automatic normalisation MUST NOT enter edit history.
- **FR-019**: While a build is active, a Commander MUST be able to set and clear its ship name and
  ident. Both are optional free text, both are modelled build state carried by feature 001's
  snapshot, and neither MUST be inferred, defaulted or derived from the hull. Applying either MUST
  go through the same package reconstruction and atomic replacement as any other edit.
  A ship's name and the name a Commander gives the saved build record are one value; the application
  MUST NOT hold a second copy of it, and a record's local identity remains independent of it
  (001 FR-008). An unnamed build MUST present an empty name rather than a hull-derived placeholder
  shown as a value.

  **Bounded 2026-08-26 (Commander request).** Free text, but not unbounded text: the game's own ship
  naming terminal takes at most 22 characters of name and a 6-character ID plate, and a build
  carrying more than either describes a ship nobody can register. Each field MUST hold a Commander to
  its bound as they type and as they paste, rather than accepting the text and refusing it
  afterwards — there is no submit here to refuse at, and no canvas draws a message under either
  field. Confirming a field MUST commit no more than its bound, so a longer value that reached the
  field from a link or a SLEF file is brought inside the limit by the edit rather than passed
  through it — and the field MUST open on the bounded value, so what a Commander confirms is what
  they were shown. A shortening applied after the field closed would be a normalisation nobody was
  told about, which constitution IV does not allow. Both bounds sit under the build link codec's own
  per-string bound, so a name and an ident that pass here always fit a shared link.

  **The two figures are held here because nothing publishes them.** They are the game's bounds and
  not this application's, so under constitution II they belong to the Almanac; the package exposes no
  record of the naming terminal's limits for them to be read from. They are therefore a recorded gap
  rather than a licence: the numbers live in one named place
  (`SHIP_NAME_MAX_LENGTH` / `SHIP_IDENT_MAX_LENGTH` in `src/app/ui/outfitting/ship-identity-fields.ts`),
  they are the only game figures this application states, and the condition for removing them is the
  package publishing the bounds — at which point the constants go and the fields read them, in the
  same change. Nothing else may be added beside them on this precedent.

- **FR-020**: Available replacement choices MUST be presented grouped into module families, which
  are the only grouping level in the chooser, with exactly one family revealed at a time in the wide
  composition and any number in the compact one. A choice's family MUST be the Almanac's own
  `familyId` for that module, and its name MUST be the Almanac's localized family name; the
  application MUST NOT derive, abbreviate, translate or override either. A variant takes the family
  of the module it is built on. Every available choice MUST appear in exactly one family.
- **FR-021**: When replacement choices are presented for a mount, a reading language or a search the
  Commander has changed, the family containing the exact fitted stock or variant choice MUST be the
  revealed one. If no available family contains that
  exact fitted choice, the family revealed on the mount the Commander came from MUST be revealed
  where this mount offers it; failing that, the wide composition MUST reveal the first family in
  package order and the compact composition MUST reveal none. The carry MUST survive exactly one
  step, MUST be consulted only where the mount has no fitted family of its own, and MUST NOT be
  taken from a chooser revealing more or fewer than one family. Revealing a family is view state
  only and MUST NOT edit the build or enter edit history.

  > **Carry added 2026-08-26.** Fitting the same kind of thing down a row of empty hardpoints or
  > utility mounts meant opening the same category once per mount, because an empty mount seeded from
  > nothing. What is in the mount still wins outright; the carry only answers where the mount itself
  > is silent.

  > **A rebuild at the same mount keeps the reveals 2026-08-31 (Commander request).** Fitting a
  > module, undoing a fit and redoing one all rebuild the chooser at a new build revision for the
  > same mount, the same language and the same search. The reveals a Commander set MUST survive that
  > rebuild rather than being seeded again: with a search in force on the compact composition, a
  > family they had closed re-opened as soon as they fitted something from another family, which is
  > their own toggle undone by an edit that had nothing to do with it. A change of mount, language or
  > search text is a different presentation and still takes the seed above.

  > **Brought into view 2026-08-27 (Commander request).** Where a composition draws the families as a
  > list of their own, a family the application reveals MUST be brought into that list's visible box;
  > a family a Commander reveals themselves MUST NOT be scrolled to. Revealing the fitted module's
  > family already brought its rows to the module. It did not move the families: the revealed one
  > could be the sixtieth of seventy-seven and off the end of a bounded list, so the rows
  > beside it changed and nothing on screen said which family they now belonged to. The second half
  > of the rule is the first one's own reasoning applied in the other direction — a Commander who has
  > just pressed a family is already looking at it, and moving the list under that press is the fault
  > this rule exists to remove.

- **FR-022**: A Commander MUST be able to reveal any module family. Each family control MUST expose
  its localized family name, available-choice count and revealed state to sighted and screen-reader
  users, and MUST remain operable by touch and pointer on desktop, tablet and mobile.
- **FR-023**: Applying or changing a non-empty replacement search MUST leave families without matches
  absent, and MUST leave every family holding at least one match present and counted. In the compact
  composition, where the search matched no more than a screenful of choices it MUST reveal every
  family containing at least one matching choice, and where it matched more it MUST reveal none, each
  family still stating how many of the matches it holds, so the Commander narrows or reveals the one
  they want rather than being handed hundreds of rows. In the wide composition it MUST reveal the
  first family holding a match, whatever the match count: that composition draws one family's rows at
  a time and cannot hand over hundreds. A Commander MAY then reveal any family. Clearing the search
  MUST restore the default from FR-021.

  > **Restated 2026-08-25.** These three were written when both canvases drew an accordion. Canvas 1c
  > now draws a family rail beside a variant pane with exactly one family selected and no caret, and
  > canvas 1d still draws the accordion, so "open" and "closed" no longer describe both. _Revealed_
  > is the accordion's open family and the rail's selected one. The measured screenful rule is
  > unchanged where it was measured, and the guarantee that mattered — a family holding a match is
  > never absent — holds at both (`design/module-replacement.md`, "What exclusive selection does to
  > FR-021, FR-022 and FR-023").

- **FR-024**: A unique-reward or otherwise route-restricted choice MUST be identified by its existing
  acquisition and entitlement labels on its own row, inside its family. The chooser MUST NOT present
  a separate standard or unique-reward section, and the removal of those sections MUST NOT remove or
  weaken any label FR-006 requires.

  > **The chooser draws three things at every width** (narrowed 2026-08-25, and again 2026-08-29).
  > Canvas 1c's manifest is `MODULE`, `CLASS` and `COST`; canvas 1d's code line is the module's
  > mount alone. So the chooser MUST draw a
  > choice as the module with its mount, its class and rating, and its price, and nothing else; the
  > package's damage, mass, power draw and weapon draw MUST NOT be drawn at either width. This is
  > presentation only: FR-003's rule that a missing package fact stays unavailable rather than
  > becoming zero is untouched wherever a fact is drawn. No requirement id is minted for it — the
  > coverage ledger registers ids against journeys that exist, and this one is not built.

## Assumptions

- "Family" is the Almanac's `OutfittingModuleIdentity.familyId` and its published family name, not a
  weapon, manufacturer or application-owned classification, and not the displayed module name.
- The Almanac names all 77 families in English and 58 of them in each other supported language. A
  family with no name in the active language is presented under the existing canonical-text rule with
  the untranslated disclosure already used for module names; it is never left blank or shown as a
  raw id.
- "Open by default" applies whenever the replacement choices are first presented or rebuilt. Manual
  family changes are temporary viewing state and do not persist after that default is restored.

## Edge Cases

- A build remains editable while invalid or incomplete.
- Unknown module identities are outside the supported import contract and have no compatibility UI
  (FR-003).
- Replacing a module does not inherit the previous module's engineering. It does keep the mount's own
  power priority group and on/off state (FR-015).
- Loading, editing, undoing or redoing a build never restores a historical purchase price; current
  cost is recalculated from the Almanac catalogue (FR-016).
- A module appearing through multiple acquisition routes remains one package variant per route.
- The fitted module can have no available family after package restrictions change. In the compact
  composition no unrelated family is opened as a substitute; in the wide one the rail selects the
  first family in package order, because the canvas's rail always has a selection and never paints an
  empty pane.
- A fitted unique-reward variant opens the family of the module it is built on; there is no separate
  unique-reward section for it to open instead.
- Changing locale relabels families and reorders choices within them without changing family
  membership, which is a package id rather than a name, and reapplies the fitted-family default.
- A family whose name the active language does not carry still groups, counts and opens normally.
- Clearing Mercenary engineering can remove the package's ability to identify the purchased variant;
  the application follows the resulting package state.

## Almanac Coverage

The package supplies slots, fittability, module limits, removability, fixed defaults, edit operations,
engineering choices and calculations, costs, variants, acquisition and entitlement data. Package
identity ingress refuses unknown hulls and construction returns every fixed mount populated. The
structured engineering-normalisation result decides whether a resolved partial grade is completed or
the incoming candidate is refused.
No game rule, value or variant-recognition heuristic is application-owned.

## Success Criteria

- **SC-001**: Every slot, candidate, edit result and modified value matches the Almanac.
- **SC-002**: Replacement search updates within 100 ms for the largest package candidate list,
  measured in Chromium at the mobile viewport under 4× CPU slowdown. The measurement is
  Chromium-only because CPU throttling has no equivalent in the other supported engine; the search
  behaviour it measures is verified in both.
- **SC-003**: Undo and redo reproduce every retained intermediate modelled build exactly.
- **SC-003a**: Any edit that re-fits a mount which carried a power priority group or a stated on/off
  state leaves both as they were, in one decision that one undo reverses.
- **SC-004**: No application-owned fitting, engineering or variant-recognition rule exists.
- **SC-005**: Every incoming build with losslessly normalisable partial engineering reaches quality
  100%; every unsupported partial-quality candidate is rejected without changing the active build.
- **SC-006**: Across desktop, tablet and mobile, 100% of available replacement choices appear in
  exactly one Almanac family, and revealing a family never changes the build. Within every family the
  rows descend by class and then by the package's price, with a choice the package publishes no price
  for after the priced ones of its class. At the wide composition every drawn choice row carries exactly
  three cells — the module, its class and rating, and its price — with no damage, mass, power or
  weapon-draw figure at that width.
- **SC-007**: Whenever the exact fitted choice has an available family, that family is the only family
  revealed on initial presentation and after a rebuild; when it has none, the wide composition reveals
  the first family in package order and the compact one reveals none. Where the composition draws the
  families as a list of their own, every family the application reveals is inside that list's visible
  box once presented, and every family the Commander reveals is left where they pressed it.
- **SC-008**: Every choice matching a newly applied or changed non-empty search is either visible
  without the Commander revealing a family manually, or counted on the family that holds it;
  no family holding a match is ever absent, and clearing the search restores the fitted-family
  default.
- **SC-009**: Every family name and every family membership on screen is a value the installed
  Almanac published; no family id, count or label is computed from module text.
