# Module Replacement Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-004–FR-008

## Purpose

Find and fit exactly one package-authorized stock or pre-engineered choice, or remove the current
module when the package permits. The surface is a draft/choice view; selection alone does not mutate
the build.

## Wide composition

- The mount's own heading, the search and `REMOVE MODULE` on **one line**, as canvas 1c draws the
  panel head (wave 5). A hardpoint is named by the number the ledger draws beside it and the class it
  takes — `Fitting · Hardpoint 1 · Huge`. The package's own slot name counts _huge_ hardpoints rather
  than hardpoints, so on a hull with several classes it names a different mount from the one the
  ledger marked (wave 6). Every other kind keeps the package's name.
- Visibly labeled `CandidateSearch` and clear action. The result count is drawn in canvas 1d's screen
  header only; canvas 1c's panel head carries no count, and the search announces it at both widths.
- A focus shortcut and its hint, as canvas 1c draws beside the field. **Ruled 2026-08-21: adopted as
  an unrequired affordance.** Constitution V puts the keyboard criteria out of scope and forbids any
  requirement in this repository from demanding them, so this MUST NOT become a normative
  requirement, an acceptance gate or the only route to the field: pointer and touch reach the search
  exactly as canvas 1d shows, with no hint. The hint is application-owned text, so it resolves through
  localization (constitution VI) and names the modifier for the Commander's platform — `⌘K` is
  macOS-only and MUST NOT ship as a literal on Windows or Linux.
- Standard-choice section followed by explicit unique-reward section.
- Responsive semantic manifest grouped by localized package module name and ordered by class/rating.
- Rows expose explicit fitted/stock/variant state, class/rating/mount, acquisition and entitlement
  labels, and package-provided DPS, mass, power, weapon draw, credit and other in-scope facts where
  available. Unavailable columns/facts remain labeled unavailable rather than zero.
- **No fit and no cancel inline.** Canvas 1c draws neither: the panel is already open beside the
  ledger for the marked mount, so choosing a row _is_ the fit and there is nothing to leave. Both
  controls belong to canvas 1d's screen (wave 4). At wide width the foot those two controls sit on is
  not drawn at all — a ruled bar with nothing on it read as a divider between the manifest and the
  engineering panel under it, and canvas 1c has none (wave 8).
- An explicit remove action operates only when `LoadoutSlot.removable` is true, but **its place in
  the panel head is kept either way** (wave 8). Canvas 1c keeps it, and closing the gap up made the
  search field beside it grow and shrink as a Commander moved down the ledger. It is withdrawn with
  `visibility: hidden`, which takes it out of the reading order and the tab order as surely as
  removing it would — the canvas's own device for a control whose measure is wanted and whose
  operation is not.

The region may scroll internally. It cannot cause page-level horizontal overflow.

## The manifest's own columns

**Ruled 2026-08-22 (wave 7, corrected wave 9).** The wide manifest is canvas 1c's seven-column grid
at the canvas's own measures — `2.2fr 62px 74px 74px 78px 86px 128px` — and the columns **abut**.
There is no gap track between them: their measures already carry the space, and a gap laid on top of
them narrows every figure column below what the canvas gives it. The cost column is nearly twice a
mass or a power column because it holds nine digits and a unit. Wave 7 lifted these by the same ~1.25
the type ramp then carried; the lift is gone from both.

**Ruled 2026-08-22 (wave 9).** The table is **capped at the width canvas 1c gives it** — 1002 px less
its own side padding, the centre track of the canvas's `392px 1fr 306px` workspace. The cap exists
because the third track, live stats and export, is not built yet: the bench spans two columns instead
of three, and without a cap the whole 306 px that track will take is handed to the `2.2fr` name
column by the grid. The name took 58% of the table to hold a string that fits in a third of it, while
every figure column sat at its canvas measure beside it. Capped, the name is 436 px against 502 px of
figures — the canvas's own proportion. The cap comes out when the third column goes in.

**Ruled 2026-08-22 (wave 9).** The header row is **outside the scroller**, not frozen inside it. A
sticky box is placed at a rounded device pixel while the rows beneath it move at a fractional one, so
at any scale factor other than 1 a sliver of the row behind it shows in the seam above — and nothing
painted inside the scroller can cover that sliver, because the scroller clips its own top edge. Three
attempts to close that seam from inside (a shadow above the head, a negative offset, a negative
margin with the pixel paid back as padding) each left it visible at some scale factor. The manifest
is therefore a column of two: the head, which does not scroll, and the scroller under it, which holds
every row. Canvas 1c draws the head with no ground, no rule under it and no offset — `padding:
0 12px 7px` and nothing else — which is what it can be once it is not standing in front of anything.

**Ruled 2026-08-22 (wave 8).** Nothing in the manifest is picked out in the accent but the row a
Commander is on. `CLASS` carries the same ink as the figures beside it — canvas 1c gives `4A` no
colour of its own, and a class set in amber on every one of two hundred rows reads as two hundred
rows all marked. The class and the five figures share one rung of the ramp, the canvas's 11px mono,
which is a step _above_ the 8.5px the column headings take: at the heading's rung the figures stood
smaller than their own labels, and at the metric rung they stood taller than the module names beside
them.

## The cost cell carries two prices, and they do not add up

**Ruled 2026-08-22 (wave 8, refined wave 9).** The column is headed `COST`, and every row writes its
unit after its own figure, in the quieter ink. The unit is set in the **figure's own type** — same
mono, same rung, same weight, no tracking and no capitals, exactly as canvas 1c sets it. Drawn as a
tracked uppercase micro-label it came out as `CR`: a column heading that had slipped down into the
row. Where the Almanac states a Merc Coin price for an article, that price
is drawn on a second line inside the same cell, in the Merc ink, with the coin beside it.

The two figures are never summed and never traded off against each other: Merc Coin has no credit
equivalent, so a single number in that cell would be an exchange rate the game does not have
(constitution IV). Both lines are laid out on the same two-column template — the figure, then a
column of one unit's width holding `cr` or the coin — which is what lines the credit figure up with
the coin figure under it.

A row with two prices is taller than a row with one, exactly as canvas 1c draws it. It therefore
takes its own height rather than the manifest's declared one, and is **never skipped**: see below.

## The manifest is whole, and the scroller knows how tall it is

**Ruled 2026-08-22.** No paging, no growing window, no `Showing 60 of 478`: every row the package
offers is in the DOM from the first frame. At wide width each row is drawn at one fixed height, and
rows outside the scroller are skipped with `content-visibility: auto` over a **fixed**
`contain-intrinsic-block-size` — a declared figure, never `auto`, so the scroller's height is added
up before anything is laid out and its bar is right from the first frame rather than shrinking under
the Commander's thumb. The card composition has no such height — a card is as tall as its own text —
so it is rendered whole rather than declared at a size that is only ever an estimate.

The one row that is not that height is the row with two prices in its cost cell. A declared figure
that is wrong for even a handful of rows moves the bar as those rows are reached, which is the whole
thing the figure exists to prevent — so those rows declare nothing and are never skipped. They are a
handful out of hundreds, and their real height is counted from the first frame like every card's.

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
- A fitted row is matched on the **whole variant** — name, blueprint and grade — not on the module
  symbol alone. A stock article and its pre-engineered variant share a symbol, and two rewards can
  share a variant name, so anything less marks two rows fitted for one fitted module (wave 4).
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
- Targets are at least 44 CSS px, except the dense inline chips the canvas itself draws small — a
  ledger row's power cell is 20px there, and forty rows of a 44px chip is a different interface.
  Those clear the WCAG 2.2 AA floor of 24 CSS px instead, and the exemption is a named list
  (`DENSE_TARGETS`), never a loosened baseline (wave 4).
- Browser input-to-result DOM update stays below 100 ms for the installed package's largest choice set.
- Axe/semantic/no-overflow tests cover full, searched, no-match, empty, stale and refusal states at all
  browser/viewport combinations.
