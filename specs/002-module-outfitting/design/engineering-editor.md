# Engineering Editor Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-007, FR-012–FR-014

## Purpose

Apply or replace package-supported ordinary engineering, change only an experimental effect, clear
ordinary engineering, and compare package-provided before/current candidate attributes. Material
requirements are feature 009's, stated once as a build-wide total in the status rail. Draft changes
do not mutate the active build until confirmed.

## Wide composition

- The editor is a **bordered box inside the bench**, as canvas 1c draws it: a hairline amber edge,
  the panel's own ground inside it, and a ruled bar across the top carrying the tracked
  `DETAILS AND ENGINEERING` heading. What scrolls is the body under that bar, so the bar stays where
  the canvas puts it. A heading floating over loose choices is not what the canvas draws (wave 7).
  The canvas's `CLEAR ✕` at the far end of that bar stays withdrawn — see "Clearing engineering".
- **The panel is two halves, and the heading names both (wave 10, Commander request).** Canvas 1c's
  `eng-grid` is `1.1fr 1fr`: the engineering on the left — the blueprint, the grade, the effect and
  the shopping list those three decide — and the article's own attributes on the right. This
  supersedes wave 8, which put the attribute table under the controls in the left column on the
  reading that it was "the consequence of the three choices above it". The canvas draws it as the
  other half of the panel, and it is no longer only a consequence: it is drawn for a module nothing
  has been done to yet. Nothing else stands in either column: the material list that wave 9 put
  under the controls was withdrawn in wave 11, below.
- **The frozen family bar keeps its own top rule. Ruled 2026-08-23 (wave 11, Commander report).**
  The bar is pulled two pixels above the scroller's edge to cover the sliver the browser's rounding
  leaves between them, and the scroller clips what hangs over — which took the bar's own
  `border-block-start` with it. A Commander reported watching the list scroll through the band that
  rule had vacated.

  The overhang stays: nothing painted _at_ the edge can close a seam that opens above it. A shadow
  reaching up from a bar frozen at `inset-block-start: 0` was tried and does not work here, and the
  reason it works for the hull manifest's frozen column head is written beside that rule — the head
  is frozen under the document, which has no clip. This scroller has one, so the box has to
  overhang and whatever is drawn in its first two pixels is forfeit. The rule is therefore drawn
  **inside** the box, set in by exactly the overhang, so the clip lands on the bar's own ground and
  the rule sits precisely on the scroller's edge once frozen. In flow it reads two pixels into the
  bar rather than flush against its top; that is the whole price, and it is paid against the bar's
  own gradient.

- **Each half scrolls in its own column. Ruled 2026-08-23 (wave 11, Commander request).** Side by
  side, one shared scroller still measured both halves against the taller of them: the attribute
  table set the height, so reaching its end carried the recipe controls off the top with it. The
  halves are read side by side and now scroll
  that way, each bounded by the panel rather than by the other, and the rule the canvas draws between
  them runs the whole height. Stacked, the two halves are one column and one scroller — which is
  what the compact canvas draws, not a fault to correct.
- Blueprint choices from `availableBlueprints()` with localized package/canonical disclosed names,
  drawn as canvas 1c draws them: one dropdown, its value in the canvas's amber. On a
  package-identified purchase the recipe is **stated rather than offered** — the article arrived
  with it and there is no other recipe it could carry, so no control is drawn for it (wave 5).
- Grade cells run 1 to the selected descriptor's highest. Grades below the one the descriptor starts
  at are drawn **striped and pressable**: a bespoke Mercenary table begins at grade 2, the article
  was bought at grade 1, and that grade is one the article really has (wave 5, wave 6).
- Experimental choices from `availableExperimentalEffects()`, including explicit no-effect — drawn
  only once a recipe is chosen. An effect menu or a "no values are resolved" line standing over an
  empty selection is a section about nothing (wave 4).
- **The details half does not depend on the engineering half. Ruled 2026-08-23 (wave 11, Commander
  request).** `DETAILS AND ENGINEERING` names two halves, and an article the package refuses to
  engineer further still has every attribute it was catalogued with. The grid was gated on there
  being choices left to make, so a final article — and a mount the Almanac offers no recipe for —
  drew its restriction sentence over an empty panel. Both halves are now drawn for any fitted
  article. The apply and revert controls stay with the choices: they act on a selection, and there
  is none to act on.

  **Amended 2026-08-23 (same wave, Commander request):** the panel keeps both columns even when one
  of them has no controls in it. The first correction collapsed to a single column where there was
  nothing to engineer, which put the sentence above the table and made the panel a different shape
  for exactly the articles a Commander cannot predict — a final reward, the cargo hatch. The
  restriction now takes the half the controls would have taken and the table stays in the half it
  occupies on every other article, so the canvas's rule and the two column positions are the same
  wherever the panel is opened.

- Where the mount has **no recipe to offer and none already on it**, the panel is **still drawn**,
  and what it says is that there is no engineering for this mount (wave 9, reversing wave 5).
  **Ruled 2026-08-22 (wave 9):** that condition is the recipe list alone, not the recipe list _and_
  the effect list. The effect menu is drawn only once a recipe is chosen, so an empty recipe list is
  an empty panel however many effects the package holds — a stock Abrasion Blaster has effects and no
  ordinary blueprint, and requiring both to be empty left it drawing a `BLUEPRINT` menu whose only
  entry was `None`: a control over nothing (FR-009). The recipe list is also the **offered** one, with
  Mercenary-only recipes filtered out for a module that was not bought that way, because a mount whose
  only recipe is one nobody here can take has no engineering either. That filter belongs to the draft
  rather than to the component that draws it, so the emptiness is decided once. The panel is the one region a Commander looks in to find out what a module can
  be engineered to; a bench that simply omits it answers that question by saying nothing, and nothing
  on the ledger outside the panel distinguishes "no recipe exists" from "the panel failed to draw".
  `canOpenEngineering` is therefore `fitted` alone — whether the Almanac offers a recipe is what the
  panel reports, not a condition on the panel existing. Both compositions follow it: the compact
  `Engineer` action opens the same panel with the same sentence (constitution V).
- The comparison both canvases draw, under the headings they use: `Stock` — the package's catalogue
  record for the fitted article, which on a recognised reward is that article's own record — against
  `Modified`, what the current selection would make of it. No locally interpreted better/worse arrows
  (reference review, "Attribute column headings"). Wave 8 put it in the **choices column** under the
  three controls, reading it as their consequence; wave 10 moved it across the rule into `eng-right`,
  where the canvas draws it and where it is also the article's own record before anything is chosen.
  See "The panel is two halves" above.
- **The panel prices no job. Ruled 2026-08-23 (wave 11, Commander request), superseding every
  materials ruling this section once carried.** Canvas 1c's `eng-grid` holds the blueprint, the grade
  and the experimental effect on the left and the article's attributes on the right, and nothing
  else; the only `MATERIALS` block on either canvas is the build-wide one feature 009 draws in the
  status rail. The panel's own list was this application's addition, and the design-canvas rule
  removes it. Waves 5 and 9 spent four rulings on how to head it, how to fold its two halves, how to
  order its rows and where to put the Merc Coin the climb bills; all four go with the list. The
  rulings that survive them are feature 009's, because the rail draws the same materials for the same
  build: `sortMaterialLines` still orders commonest first and still sorts an ungraded row last, and
  `sortMaterialLines` stays in `ui/outfitting` rather than moving into the rail, because that order
  is how a Commander gathers a shopping list and not how one block happens to sort.

  **Nothing is lost by the removal, and that was checked rather than assumed.** `buildCost()` folds in
  both the Mercenary purchase price and every ordinary recipe that charges Merc Coin — including the
  per-grade figure Almanac 0.1.5 added for the climb
  ([#337](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/337)) — so the rail's one row
  states a total that already contains what this panel used to state alone. What a Commander gives up
  is the per-module breakdown: the rail says what the build needs, not what this grade would add.
  That is the Commander's own call, made twice and in the canvas's favour.

- **No apply and no revert.** Canvas 1c draws neither, and inline there is nothing for them to act
  on: a choice _is_ the decision as it is made, and undo is what takes it back. The controls belong
  to canvas 1d's screen, which holds a draft that has to be left on purpose (wave 4). Clearing is not
  a separate control either — see "Clearing engineering" below.

## Narrow and 400%-zoom composition

- Full-screen layer inspired by canvas 1d with associated title/module description and inert
  background.
- Blueprint, grade, effect and attributes stack in semantic sections.
- Apply/cancel remain reachable without horizontal scrolling; clearing is the blueprint list's first
  option and needs no separate confirmable control
  where loss of Mercenary identity must be explained.
- Closing without apply restores no build because only draft state changed.

## Operations

| Commander action                   | Required result                                                                                                                                                                                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apply/replace blueprint and grade  | One package operation at explicit quality 1; optional selected effect included; one history step.                                                                                                                                                     |
| Add/replace/remove only effect     | Released operation preserves blueprint/grade, fixed identity and base modifiers while recomputing effect-dependent stats; one step.                                                                                                                   |
| Clear ordinary engineering         | Selecting the blueprint list's `None — stock module` option and applying. Dispatches `clearEngineering`; removes blueprint/effect together; follows package loss of Mercenary identity; one step, one history frame.                                  |
| Cancel/revert draft                | Layer composition only. Active build and history unchanged. Inline there is no draft: undo is the route back.                                                                                                                                         |
| Return a purchase to its own grade | Dispatches `restorePurchase`, which the store performs as `setPreEngineeredVariant`. A bespoke recipe's table starts above the purchase, so `applyBlueprint` refuses that grade outright — coming back down is the article again, not a job (wave 6). |

The editor calls the installed package's structured `setExperimentalEffect()` for fixed-reward
effect-only edits. It never merges raw modifiers locally. `updated`, `unchanged` and `unsupported`
remain distinct outcomes.

## States

| State                                | Required presentation and behavior                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unengineered, package menu present   | Blueprint first; no grade/effect until applicable; no quality control.                                                                                                                                                                                                  |
| Ordinary engineered                  | Current fdname/grade/effect, package values and appropriate change/clear actions.                                                                                                                                                                                       |
| Mercenary article                    | Recipe stated, not offered. The purchase's own grade is a pressable cell however far the article has since been climbed. Nothing is priced in this panel at all: both the purchase price and the Merc Coin a climb bills are read off the rail's build total (wave 11). |
| Fixed re-engineerable reward         | Fixed route/stats retained; only package-supported later operations.                                                                                                                                                                                                    |
| Final article                        | Package restriction and current fixed state visible; no apply/clear actions.                                                                                                                                                                                            |
| Empty/incomplete/cargo hatch/no menu | Explain package offers no engineering; no fabricated choices.                                                                                                                                                                                                           |
| Known zero cost                      | A **defect signal**, not a state to design for. Engineering always costs materials, so an empty list from the package means the wrong thing was priced — a judgement that now belongs to feature 009's block (wave 5, wave 11).                                         |
| Unavailable cost                     | Explain package has no cost result from `null`; never show zero.                                                                                                                                                                                                        |
| Partial import normalized            | Workspace notice reports original quality and 100% result; editor shows only quality-1 current state.                                                                                                                                                                   |
| Partial import refused               | Candidate never activates and this editor never opens; the owning ingress surface names exact affected identities.                                                                                                                                                      |
| Stale draft                          | Refuse apply, rebuild current menus/state and retain no history step.                                                                                                                                                                                                   |
| Package refusal                      | Structured localized error; current build/history unchanged.                                                                                                                                                                                                            |

## Clearing engineering

**Ruled 2026-08-21.** Canvas 1c's `CLEAR ✕` header control is withdrawn as duplicative. Both canvases
already draw `None — stock module · REMOVES ENGINEERING` as the first option of the blueprint list and
`None — remove effect` as the first option of the experimental effect list, so every clear route
exists identically at both widths with no addition to either canvas:

- clear all ordinary engineering — choose `None — stock module`, then apply;
- remove only the experimental effect — choose `None — remove effect`, then apply, which preserves
  blueprint and grade as FR-012 requires.

Both are ordinary applications of the draft, so each is one Commander decision producing one history
frame, and neither needs a second confirmation step. This also removes the constitution V asymmetry
that `CLEAR ✕` created by existing at wide width only.

## Attribute and cost honesty

- `stats`/`effectiveStats` and package modifiers are the only attribute values.
- Missing `stats`, missing modifiers or missing fields render unavailable.
- **Every attribute the article carries, ruled 2026-08-23 (wave 10, Commander request).**
  `COMPARED_ATTRIBUTES` is every numeric field the Almanac publishes on a module, and the article's
  own record decides which of them it has — a pulse laser lists thirteen, a power distributor a
  different eleven. An earlier pass named six fields by hand, which was this application deciding
  that a Commander engineering a frame shift drive did not need to see its optimal mass. `class` is
  the one number left out: it is identity, drawn in the panel's own header as `HUGE MULTI-CANNON 4A`,
  and no recipe changes it. Each field carries an application-owned localized label, because a
  journal modifier name (`FSDOptimalMass`) has no translation anywhere in the Almanac.
- **A boot time of zero is left off. Ruled 2026-08-23 (wave 11, Commander request).** The Almanac
  publishes `bootTime: 0` on 244 modules, and it is a real reading — the module has no boot delay —
  rather than a gap. `Boot time s 0` is still a row that tells a Commander nothing, and alphabetical
  order put it at the top of the table on every weapon. It is dropped in the application, at the same
  filter that drops a field the article does not carry, and the package is not asked to call it
  absent. This is the only suppressed figure: a zero elsewhere is data, and a weapon whose published
  damage is 0 is stating something.
- **`cost` is not an attribute. Ruled 2026-08-23 (wave 11, Commander request).** It is what the
  module costs to buy, not something the article does and not something a recipe moves. The manifest
  row it is bought from already states it in the canvas's own `COST cr` column, and the rail totals
  it for the whole build. It is left out for the same reason `class` is: identity and price are
  facts about the article, and this table is what the article does.
- **The table is drawn before anything is chosen, and gains its second column when something is.**
  An unengineered mount is not an unresolved one: it has every attribute it was catalogued with, and
  the panel is where they are read. `MODIFIED` appears only once there is something to compare
  against — a column repeating the stock figures reads as a recipe that did nothing. The one
  remaining unavailable case is a selection the package refuses. Before this, an unengineered module
  reported that no values could be resolved for it, which was untrue of every one of them.
- **Ruled 2026-08-22, reversing the earlier omission.** The canvas's ▲/▼ and its green/red are drawn.
  Which way is better is an application-owned table (`HIGHER_IS_BETTER`, beside `COMPARED_ATTRIBUTES`)
  covering every attribute this surface compares, never the Almanac's unreliable
  `LessIsGood`. ▲ means _better_ and ▼ means _worse_ — not which way the number moved, which is how
  the canvas draws a power draw that rose. Colour is never the only carrier: the glyph and a
  `visually-hidden` word carry it too. Percentages and modified values are still never derived.
- Blueprint/effect/material names use package i18n leaf helpers; canonical text has untranslated
  disclosure when no locale value exists.
- **The cost is the whole recipe, from stock to the selected grade, every time.** Not what is left of
  one: a choice commits as it is made, so "what is left" is nothing by the time anybody reads it
  (wave 5, superseding the incremental climb this once specified).
- The article _as it was bought_ is priced at nothing at all — there is no shopping list for what it
  arrived with, and its Merc Coin price belongs to the purchase rather than to this panel.
  Engineering it **further** costs materials like any other job, and it stays priced once that climb
  is applied.
- `null` and `[]` cost results remain visibly distinct.
- The rarity mark is the design's own `edassets.org` file, taken once at build time and served from
  this origin. Nothing is redrawn from the idea of it and nothing is fetched at runtime
  (constitution I; wave 6, superseding the locally drawn mark).

## Accessibility

- Blueprint/effect choices use native radio/list semantics; grade is a named radio group/select.
- Each option exposes current/selected/unavailable state and associated route/restriction text.
- Attribute comparison uses headers/definition relationships and never relies on column position or
  color alone.
- Status updates are polite; apply/refusal is announced once. Dialog/layer titles and descriptions are
  associated; background content is inert.
- All controls meet 44 CSS px and work by touch/pointer, except the grade bar's cells, which the
  canvas draws at 28px: those clear the 24px WCAG 2.2 AA floor and are named in `DENSE_TARGETS`. Text expansion, RTL, reduced motion,
  portrait/landscape and no-page-overflow are tested.

## Closed 2026-08-22: six climbed reward articles could not be shared as a link

**Recorded 2026-08-22, corrected the same day after measuring it, fixed the same day.** Six of the
Almanac's 76 pre-engineered variants could be engineered into a state the link codec refused to
encode — the build's link simply disappeared. All six are Merc-Coin articles, and what they had in
common was not the Merc-Coin route: it is that the module under them has **no ordinary engineering
menu at all**.

| Article                      | Module                                 | Recipe                          |
| ---------------------------- | -------------------------------------- | ------------------------------- |
| Abrasion Blaster             | `Hpt_Mining_AbrBlstr_Fixed_Small`      | `AbrasionBlaster_FarReaching`   |
| Enzyme Missile Rack          | `Hpt_CausticMissile_Fixed_Medium`      | `EnzymeMissileRack_HighYield`   |
| Mining Laser                 | `Hpt_MiningLaser_Fixed_Small`          | `MiningLaser_LongRange`         |
| Cargo Rack (size 5)          | `Int_CargoRack_Size5_Class1`           | `CargoRackS5C1_Extended`        |
| Cargo Rack (size 6)          | `Int_CargoRack_Size6_Class1`           | `CargoRackS6C1_Extended`        |
| Module Reinforcement Package | `Int_ModuleReinforcement_Size5_Class2` | `ModuleReinforcement_HeavyDuty` |

**Why.** Climbing off the purchase grade leaves the pre-engineered record unable to reproduce the
module — it records the grade the article was sold at — so the engineering has to be written as the
ordinary record instead. The codec's per-module blueprint set came from the Almanac's
`getBlueprintsForModule`, which is _every blueprint in a stock module's ordinary engineering menu_,
so a bespoke recipe was never in it — for all 22 Merc articles. That alone is harmless: where the
module has an ordinary menu, `writeContextualIndex` writes a not-in-set flag and the blueprint's
global index, and the link round-trips whole, purchase identity included. Where the set was
**empty**, the format had no discriminator left: `readEngineering` derives which record follows from
whether the module has any ordinary blueprints at all, so with none it always read the
pre-engineered branch and there was no bit that could say otherwise. `encode` refused rather than
write a link that would decode as the grade-1 article.

**Measured, not inferred.** A Merc Rail Gun and a Merc Detailed Surface Scanner — the latter with an
ordinary menu of exactly one blueprint — both encoded at grade 2 and reloaded with `Bought as … at
grade 1` intact. The Abrasion Blaster at grade 2 refused.

**Whose gap it was.** Not upstream: the Almanac reports everything needed, and resolves
`preEngineeredVariant` on all 22 at grade 2. It was **this repository's codec table**. The fix is in
`scripts/generate-build-link-codec-tables.mjs`: a module's blueprint set is now its own engineering
menu **plus the blueprints its own pre-engineered variants carry**. No menu is invented — the six
gain a set of exactly their variants' recipes — and with a non-empty set the discriminator bit
exists again. Table 1 was overwritten in place rather than minted as table 2, because it is still
pre-release and no link has been published against it; its content hash moved to `0a030271f232…`.

**What it cost.** Nothing at the envelope: `pnpm run codec:capacity` reports the same 272 of 377
bytes for the largest expressible build, and the widest blueprint candidate set is still 9, so no
index got wider. Measured across 457 builds — every stock hull, the fully engineered Anaconda, the
imported Corvette, and every pre-engineered variant both as bought and at every craftable grade — 308
encodings are byte-identical, 81 lost one character, 10 gained one, and **58 that could not be
encoded at all now encode**. The rescued 58 are not only the Merc six: the community-goal and
tech-broker variants sitting on those same modules were refused for the same reason. The table's own
JSON grew 129,684 → 130,434 bytes, which is lazy-loaded application payload and not link length.

## Still open: the encode direction borrows the decode direction's sentence

When the encoder does refuse — a Merc purchase whose capture states modifiers the record cannot
account for is the case that remains — `unknownIdentity` renders "This build link names a hull or
module that is not available here", and both the hull and the module are installed and on screen.
Only `unknownIdentity`, `invalidPayload` and `tooLong` can arise while encoding; the encode
direction needs its own wording for them.

Preview/test states cover every row in the states table at desktop, tablet and mobile widths.
