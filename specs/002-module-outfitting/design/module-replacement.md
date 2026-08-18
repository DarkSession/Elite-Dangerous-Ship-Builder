# Module Replacement Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-004–FR-008

## Purpose

Find and fit exactly one package-authorized stock or pre-engineered choice, or remove the current
module when the package permits. The surface is a draft/choice view; selection alone does not mutate
the build.

## Wide composition

- Selected slot heading with exact key, size/kind/restriction and current module summary.
- Visibly labeled `CandidateSearch`, result count and clear action.
- Standard-choice section followed by explicit unique-reward section.
- Responsive semantic manifest grouped by localized package module name and ordered by class/rating.
- Rows expose explicit fitted/stock/variant state, class/rating/mount, acquisition and entitlement
  labels, and package-provided DPS, mass, power, weapon draw, credit and other in-scope facts where
  available. Unavailable columns/facts remain labeled unavailable rather than zero.
- Explicit fit/replace action for the selected choice; explicit remove action only when
  `LoadoutSlot.removable` is true; cancel/close leaves the build unchanged.

The region may scroll internally. It cannot cause page-level horizontal overflow.

## Narrow and 400%-zoom composition

- Full-screen layer inspired by canvas 1d with associated title/slot description and back/cancel.
- Sticky or persistent labeled search and textual result count.
- Choices become semantic cards preserving section/group order and every label.
- A choice expands/selects with native radio/button semantics; a separate full-width fit action
  confirms the decision.
- Background workspace is inert while the layer is open. Closing it returns to the same selected slot
  without build/history change.

## States

| State                | Required presentation and behavior                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Loading/rebuilding   | Existing committed build remains visible; chooser is busy and cannot fit stale records.         |
| Ready                | All and only current package choices, ordered and labeled.                                      |
| Search results       | Every term matched against name/class/rating/mount; result count announced politely.            |
| No matches           | Retain query, explain no match, expose clear action; no empty-slot ambiguity.                   |
| Empty package result | Explain no replacement offered; this is distinct from search no-match.                          |
| Stale revision       | Discard selection, rebuild from current loadout and explain that choices changed.               |
| Fit success          | Commit once, close/return to selected slot, refresh every package result, add one history step. |
| Structured refusal   | Localized code/constraint/params; keep active build/history; rebuild choices.                   |
| Removable            | Explicit remove action and package consequences; one successful decision.                       |
| Non-removable        | Reason visible; remove absent.                                                                  |

## Candidate facts and labels

- Stock/variant status is textual.
- Package localized module name is primary; class, rating and mount are separate values.
- Variant purchase grade is never labeled as current ordinary grade.
- Community-goal/event-reward choices appear only in the final unique section.
- Mercenary/tech-broker variants show route plus not-ordinarily-available.
- Entitlement adds another label and does not replace acquisition.
- Missing translation uses canonical package text plus untranslated disclosure.
- Canvas 1d's weapon-family chips are intentionally omitted. Required AND search covers only the
  package-localized name, class, rating and mount; no local family taxonomy is introduced.

Do not show invented suitability rankings, “recommended” badges, inferred compatibility, local
comparison deltas or design-mock purchase labels. Choosing a package record is not proof it can still
fit after another tab/component edit; the detached transaction remains final authority.

## Accessibility and performance

- Search has visible label/instructions; result count is a polite live region; no-match is a status,
  not just blank content.
- Group/section headings describe list structure. Selected state and acquisition restrictions are
  text/programmatic, not border/icon/color only.
- Candidate action names include module form and class/rating context needed to distinguish choices.
- Targets are at least 44 CSS px. Long package/canonical names and tokens wrap.
- Browser input-to-result DOM update stays below 100 ms for the 481-choice 0.1.2 maximum.
- Axe/semantic/no-overflow tests cover full, searched, no-match, empty, stale and refusal states at all
  browser/viewport combinations.
