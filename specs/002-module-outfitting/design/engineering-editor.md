# Engineering Editor Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-007, FR-012–FR-014

## Purpose

Apply or replace package-supported ordinary engineering, change only an experimental effect, clear
ordinary engineering, compare package-provided before/current candidate attributes and show exact
package material requirements. Draft changes do not mutate the active build until confirmed.

## Wide composition

- The editor is a **bordered box inside the bench**, as canvas 1c draws it: a hairline amber edge,
  the panel's own ground inside it, and a ruled bar across the top carrying the tracked `ENGINEERING`
  heading. What scrolls is the body under that bar, so the bar stays where the canvas puts it. A
  heading floating over loose choices is not what the canvas draws (wave 7). The canvas's `CLEAR ✕`
  at the far end of that bar stays withdrawn — see "Clearing engineering".
- Blueprint choices from `availableBlueprints()` with localized package/canonical disclosed names,
  drawn as canvas 1c draws them: one dropdown, its value in the canvas's amber. On a
  package-identified purchase the recipe is **stated rather than offered** — the article arrived
  with it and there is no other recipe it could carry, so no control is drawn for it (wave 5).
- Grade cells run 1 to the selected descriptor's highest. Grades below the one the descriptor starts
  at are drawn **striped and pressable**: a bespoke Mercenary table begins at grade 2, the article
  was bought at grade 1, and that grade is one the article really has (wave 5, wave 6).
- Experimental choices from `availableExperimentalEffects()`, including explicit no-effect — drawn
  only once a recipe is chosen. An effect menu, a `MATERIALS` heading or a "no values are
  resolved" line standing over an empty selection is a section about nothing (wave 4).
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
  (reference review, "Attribute column headings"). It sits in the **choices column**, directly under
  the recipe, the grade bar and the effect menu and ruled off from them — not across the rule beside
  the materials, where it read as a second list rather than as the consequence of the three choices
  above it (wave 8).
- **Ruled 2026-08-22 (wave 9).** The effect's cost is **what the effect costs**, whether or not the
  module already carries it — the same rule the climb follows, and for the same reason. Inline a
  choice commits as it is made, so by the time anyone reads the figure the effect is always "already
  applied"; charging nothing for it made the material list unchanging whatever was picked. The one
  exception is the effect a reward article **arrived** with, which is not a job any engineer will do —
  exactly as the blueprint branch treats the recipe a reward came with.
- **Ruled 2026-08-22 (wave 9).** Where there is **no requirement, there is no requirement region** —
  no `MATERIALS · G1`, no `REQUIRED`, nothing. On an article bought rather than crafted there is no
  job at the grade it was bought at, so a heading naming that grade headed an empty column. Nor is
  there a rule above the heading: the requirement stands in its own column of canvas 1c's panel with
  the choices beside it rather than above it, so the line was drawn across the top of a column with
  nothing on the other side of it.
- **One material list, not one per part. Ruled 2026-08-22 (wave 9), superseding the split this line
  once specified.** The recipe and the effect are two halves of one job and a Commander gathers the
  materials for it once; drawn as `BLUEPRINT PROGRESSION`, `EXPERIMENTAL EFFECT` and `TOGETHER` the
  same material appeared three times with three different counts and only the last was worth acting
  on. The list is the package's own `sumMaterials` fold of both halves, which is `unavailable`
  whenever either half is — so the three states stay distinct and nothing is lost by drawing only it.
  Its heading names the grade only, as the canvas draws it — `MATERIALS · G5`. The application models
  a completed grade, never a roll, so no surface may call the recipe a roll (constitution IV,
  FR-013).
- **Ruled 2026-08-22 (wave 9).** Each part's materials are ordered **by rarity, then by name** —
  commonest first, the order a Commander gathers a list in. The package returns a recipe's materials
  in its own catalogue order, which is neither, so two grade-1 commons sat either side of a grade-5
  rarity. A material the package grades no rarity for sorts **last**: an unknown rarity is not a low
  one.
- **Ruled 2026-08-22 (wave 9), reversing wave 5's own line for it.** The article's **Merc Coin shop
  price is not in this panel at all.** It is the price of _buying_ the module, which the manifest row
  it is bought from already states; at the foot of a job's shopping list it read as the price of that
  job. At the purchase grade there is therefore nothing to draw — no job, no list — which is the same
  answer the material cost gives there, and for the same reason: the article was bought, not crafted.

  **What is not drawn, and why.** If the game charges further Merc Coin for grades 2–5, the Almanac
  publishes no figure for it. `PreEngineeredVariant.mercCoinCost` is one fixed shop price per article
  — the package's own words are that "the current grade does not change the original shop price" —
  and no per-grade Merc Coin appears anywhere in the catalogues. Only the material half of those
  grades can be stated, and it is; a Merc Coin figure beside it would be one the game does not have.
  This is an upstream data gap, not something this surface may work around, and it is filed as one:
  https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/337.

- **No apply and no revert.** Canvas 1c draws neither, and inline there is nothing for them to act
  on: a choice _is_ the decision as it is made, and undo is what takes it back. The controls belong
  to canvas 1d's screen, which holds a draft that has to be left on purpose (wave 4). Clearing is not
  a separate control either — see "Clearing engineering" below.

## Narrow and 400%-zoom composition

- Full-screen layer inspired by canvas 1d with associated title/module description and inert
  background.
- Blueprint, grade, effect, attributes and materials stack in semantic sections.
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

| State                                | Required presentation and behavior                                                                                                                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unengineered, package menu present   | Blueprint first; no grade/effect until applicable; no quality control.                                                                                                                                                                                |
| Ordinary engineered                  | Current fdname/grade/effect, package values and appropriate change/clear actions.                                                                                                                                                                     |
| Mercenary article                    | Recipe stated, not offered. The purchase's own grade is a pressable cell however far the article has since been climbed. Merc Coin is not priced here at all: it is the price of buying the module, and the manifest row it is bought from states it. |
| Fixed re-engineerable reward         | Fixed route/stats retained; only package-supported later operations.                                                                                                                                                                                  |
| Final article                        | Package restriction and current fixed state visible; no apply/clear actions.                                                                                                                                                                          |
| Empty/incomplete/cargo hatch/no menu | Explain package offers no engineering; no fabricated choices.                                                                                                                                                                                         |
| Known zero cost                      | A **defect signal**, not a state to design for. Engineering always costs materials, so an empty list from the package means the wrong thing was priced (wave 5).                                                                                      |
| Unavailable cost                     | Explain package has no cost result from `null`; never show zero.                                                                                                                                                                                      |
| Partial import normalized            | Workspace notice reports original quality and 100% result; editor shows only quality-1 current state.                                                                                                                                                 |
| Partial import refused               | Candidate never activates and this editor never opens; the owning ingress surface names exact affected identities.                                                                                                                                    |
| Stale draft                          | Refuse apply, rebuild current menus/state and retain no history step.                                                                                                                                                                                 |
| Package refusal                      | Structured localized error; current build/history unchanged.                                                                                                                                                                                          |

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
- **Ruled 2026-08-22, reversing the earlier omission.** The canvas's ▲/▼ and its green/red are drawn.
  Which way is better is an application-owned table (`HIGHER_IS_BETTER`, beside `COMPARED_ATTRIBUTES`)
  covering exactly the six attributes this surface compares, never the Almanac's unreliable
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
- Material counts have localized number/unit labels and accessible association to material names.
- Status updates are polite; apply/refusal is announced once. Dialog/layer titles and descriptions are
  associated; background content is inert.
- All controls meet 44 CSS px and work by touch/pointer, except the grade bar's cells, which the
  canvas draws at 28px: those clear the 24px WCAG 2.2 AA floor and are named in `DENSE_TARGETS`. Text expansion, RTL, reduced motion,
  portrait/landscape and no-page-overflow are tested.

## Known limitation: a climbed Mercenary article cannot be shared as a link

**Recorded 2026-08-22.** Engineering a Merc-Coin article above the grade it was bought at produces a
build the link codec cannot encode. The pre-engineered record no longer reproduces the module, and
the ordinary record needs an ordinary blueprint the codec table records none of for that module —
so `encode` refuses with `unknownIdentity` and the workspace says the build cannot be shared. This
is a codec-table gap, not something this feature may work around: writing some other blueprint into
the link would hand a Commander a build that is not theirs (constitution IV). It is upstream work.

Preview/test states cover every row in the states table at desktop, tablet and mobile widths.
