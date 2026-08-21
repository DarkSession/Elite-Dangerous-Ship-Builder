# Engineering Editor Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-007, FR-012–FR-014

## Purpose

Apply or replace package-supported ordinary engineering, change only an experimental effect, clear
ordinary engineering, compare package-provided before/current candidate attributes and show exact
package material requirements. Draft changes do not mutate the active build until confirmed.

## Wide composition

- Selected module/slot identity, acquisition/entitlement and fixed purchase grade.
- Blueprint choices from `availableBlueprints()` with localized package/canonical disclosed names and
  route where needed.
- Grade choices containing exactly the selected package descriptor's grades.
- Experimental choices from `availableExperimentalEffects()`, including explicit no-effect.
- Current versus candidate package attributes without locally interpreted better/worse arrows.
- Material list separating blueprint progression, effect, combined/unavailable status and Merc Coin.
  Its heading names the grade only, as the canvas now draws it — `MATERIALS · G5`. The application
  models a completed grade, never a roll, so no surface may call the recipe a roll (constitution IV,
  FR-013).
- Explicit apply and cancel/revert-draft actions. Clearing is not a separate control — see
  "Clearing engineering" below.

## Narrow and 400%-zoom composition

- Full-screen layer inspired by canvas 1d with associated title/module description and inert
  background.
- Blueprint, grade, effect, attributes and materials stack in semantic sections.
- Apply/cancel remain reachable without horizontal scrolling; clearing is the blueprint list's first
  option and needs no separate confirmable control
  where loss of Mercenary identity must be explained.
- Closing without apply restores no build because only draft state changed.

## Operations

| Commander action                  | Required result                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apply/replace blueprint and grade | One package operation at explicit quality 1; optional selected effect included; one history step.                                                                                                                    |
| Add/replace/remove only effect    | Released operation preserves blueprint/grade, fixed identity and base modifiers while recomputing effect-dependent stats; one step.                                                                                  |
| Clear ordinary engineering        | Selecting the blueprint list's `None — stock module` option and applying. Dispatches `clearEngineering`; removes blueprint/effect together; follows package loss of Mercenary identity; one step, one history frame. |
| Cancel/revert draft               | Active build and history unchanged.                                                                                                                                                                                  |

The editor calls the installed package's structured `setExperimentalEffect()` for fixed-reward
effect-only edits. It never merges raw modifiers locally. `updated`, `unchanged` and `unsupported`
remain distinct outcomes.

## States

| State                                | Required presentation and behavior                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Unengineered, package menu present   | Blueprint first; no grade/effect until applicable; no quality control.                                                 |
| Ordinary engineered                  | Current fdname/grade/effect, package values and appropriate change/clear actions.                                      |
| Mercenary article                    | Purchase grade/route separate from current grade; later costs start above purchase grade; clear consequence disclosed. |
| Fixed re-engineerable reward         | Fixed route/stats retained; only package-supported later operations.                                                   |
| Final article                        | Package restriction and current fixed state visible; no apply/clear actions.                                           |
| Empty/incomplete/cargo hatch/no menu | Explain package offers no engineering; no fabricated choices.                                                          |
| Known zero cost                      | Explicit zero remaining cost from `[]`; not presented as unavailable.                                                  |
| Unavailable cost                     | Explain package has no cost result from `null`; never show zero.                                                       |
| Partial import normalized            | Workspace notice reports original quality and 100% result; editor shows only quality-1 current state.                  |
| Partial import refused               | Candidate never activates and this editor never opens; the owning ingress surface names exact affected identities.     |
| Stale draft                          | Refuse apply, rebuild current menus/state and retain no history step.                                                  |
| Package refusal                      | Structured localized error; current build/history unchanged.                                                           |

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
- Do not derive arrows, “better/worse,” percentages or modified values from raw data. The design
  mock's green/red deltas are omitted unless a future package API supplies that semantics.
- Blueprint/effect/material names use package i18n leaf helpers; canonical text has untranslated
  disclosure when no locale value exists.
- Fixed baked reward engineering has no crafting material cost. Only separately selected ordinary
  engineering/effects add package costs.
- `null` and `[]` cost results remain visibly distinct.

## Accessibility

- Blueprint/effect choices use native radio/list semantics; grade is a named radio group/select.
- Each option exposes current/selected/unavailable state and associated route/restriction text.
- Attribute comparison uses headers/definition relationships and never relies on column position or
  color alone.
- Material counts have localized number/unit labels and accessible association to material names.
- Status updates are polite; apply/refusal is announced once. Dialog/layer titles and descriptions are
  associated; background content is inert.
- All controls meet 44 CSS px and work by touch/pointer. Text expansion, RTL, reduced motion,
  portrait/landscape and no-page-overflow are tested.

Preview/test states cover every row in the states table at desktop, tablet and mobile widths.
