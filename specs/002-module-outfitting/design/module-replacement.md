# Module Replacement Surface

**Parent route**: `/build` application state  
**Requirements**: FR-002, FR-004–FR-008, FR-020–FR-024

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
- **A family rail beside a variant pane**, since the 2026-08-25 canvas revision — see "The wide
  manifest is a rail and a pane" below. The rail carries the package family name and the family's
  choice count; the pane carries the selected family's rows. There is no caret and no section
  heading above them: see "Module families".
- Responsive semantic manifest grouped by package family and ordered inside a family by localized
  module name, then class/rating.
- Rows expose explicit fitted/stock/variant state, class/rating/mount, acquisition and entitlement
  labels, and the credit and Merc Coin price. **The DPS, mass, power and weapon-draw columns are
  withdrawn at this width** by the same revision; they survive where canvas 1d draws them, on the
  compact row's own code line. An unavailable fact remains labeled unavailable rather than zero
  wherever it is drawn.
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

## The wide manifest is a rail and a pane

**Ruled 2026-08-25, against the canvas revision of that date.** Canvas 1c no longer draws the wide
manifest as one accordion. It draws `#fit-table` as
`grid-template-columns: 216px minmax(0, 1fr); column-gap: 14px`, with:

- **column 1, row 2** — the family rail: every family in package order, one row each carrying the
  family's name and its choice count in a chip, bounded at `max-height: 470px` and scrolling on its
  own. The selected row takes the amber left rail (`border-left: 3px solid var(--amber)`) and the
  amber gradient ground, and the others take `var(--panel-2)` with a transparent border in the same
  place. **There is no caret**: `wireFamilies`' rail branch keeps its `.fam-car` update behind a
  null check, and the revised markup carries none;
- **column 2, row 1** — the column head, over the pane alone;
- **column 2, row 2** — the selected family's rows, `border-left: 1px solid var(--amber-a16)`,
  bounded at the same `max-height: 470px` and scrolling on its own.

**Selection is exclusive.** The revised script's rail branch shows the chosen family's `.fam-v` and
hides every other, and returns before the accordion branch it replaced. Exactly one family is
selected at all times, and the pane is never empty.

The accordion is not gone — canvas 1d still draws it, unchanged, with its badge, its variants
summary and its caret. So the two compositions now differ in kind and not only in arrangement: a
rail with one pane at wide, an accordion at compact. What that costs FR-021 to FR-023 is ruled in
"Module families" below.

## The manifest's own columns

**Ruled 2026-08-25.** The wide manifest is three columns, not seven:
`grid-template-columns: 2.6fr 70px 150px` — `MODULE`, `CLASS` and a right-aligned `COST` — on both
the head and every row of the pane. The canvas revision withdrew `DPS`, `MASS t`, `PWR MW` and
`DRAW WEP` from this width entirely.

They are not moved and not folded into a second line: canvas 1c draws a row as one line of three
cells. The facts survive only where canvas 1d draws them, in the compact row's own code line
(`GIMBALLED · 23.3 DPS · 4.46 MW · 16.0 t`), which that canvas did not change. A wide manifest that
kept them would be the screen not being the design.

**Superseded, kept for the record — ruled 2026-08-22 (wave 7, corrected wave 9).** The wide manifest
was canvas 1c's seven-column grid
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
the Commander's thumb.

**SC-002 is not met at the compact composition, and this rule is why. Recorded 2026-08-22.** The
manifest being whole costs what it costs: on the Panther Mk II's 478-choice mount at 390 px, the
compact list lays out and paints 478 full cards, and a keystroke settles at about 113 ms against the
100 ms SC-002 allows. Two things were measured and rejected rather than assumed.

Skipping the offscreen cards the way the wide manifest does brings it to about 84 ms, and is not
honest here: a card is as tall as its own text, so `contain-intrinsic-block-size` can only be an
estimate, and an estimate is right at one width only. Measured at 834 px the scroller's height fell
from 59,246 px to 50,539 px as the list was scrolled — the bar shrinking under the Commander's thumb,
which is the exact thing this rule exists to prevent. `contain-intrinsic-block-size: auto` behaves
identically. The repository's own `renders the whole expansion, so the scroller knows how tall it is`
catches it in all four tablet projects.

Nor is the cost Angular's. Building the list from the _results_ and hiding the unmatched rows instead
— so a query destroys and creates no views at all — was implemented and measured at both
compositions and moved the figure by less than the run-to-run spread. What is expensive is the
browser laying out and painting hundreds of cards, not the framework making them.

**What would close it** is the one thing that makes an exact intrinsic size possible: a compact card
of one declared height. Canvas 1d draws exactly that — a `min-height: 64px` row with the facts on one
mono line rather than the wrapping block of labelled cells this composition grew — so the fix is a
return to the canvas, not a departure from it. Until then the criterion is unmet at this composition
and stated as unmet.

The one row that is not that height is the row with two prices in its cost cell. A declared figure
that is wrong for even a handful of rows moves the bar as those rows are reached, which is the whole
thing the figure exists to prevent — so those rows declare nothing and are never skipped. They are a
handful out of hundreds, and their real height is counted from the first frame like every card's.

## Module families

**Ruled 2026-08-23 (wave 10), amended 2026-08-25.** Both canvases were redrawn around families, and
both are adopted. Canvas 1d draws them as an accordion under a `FAMILIES` heading with its own
`5 · 24 FIT` counter, a fitted-module block pinned above it under `FITTED HERE`, and one family
open. **Canvas 1c no longer draws an accordion**: since the 2026-08-25 revision it draws a family
rail beside a variant pane, with exactly one family selected and no caret at all — see "The wide
manifest is a rail and a pane" above.

### What exclusive selection does to FR-021, FR-022 and FR-023

**Ruled 2026-08-25.** The three requirements were written when both canvases drew an accordion, so
all three are worded in "open" and "closed". A rail has neither: it has one selected family, always,
and a pane that is never empty. The requirements are restated in terms both compositions satisfy —
_revealed_ is the accordion's open family and the rail's selected one — and one consequence follows
that has to be written down rather than smoothed over:

- **FR-021's "every other family closed" has no rail form, and needs none.** Revealing exactly one
  is what a rail does by construction.
- **Where no available family holds the fitted choice, the rail selects the first family in package
  order and the accordion opens none.** This is not a substitute chosen by this application: the
  canvas's rail always has a selection and always paints a pane, and an empty pane beside a full
  rail is a state it does not draw. The accordion's "all closed" is unchanged, because the compact
  canvas does draw that.
- **FR-023's screenful rule is compact-only, and always was in effect.** Its purpose is to keep a
  broad search from painting several hundred cards in one keystroke; the rail cannot do that at any
  match count, because it paints one family's rows whatever the search matched. At wide, a search
  narrows the rail to the families holding matches and selects the first of them. At compact, the
  twenty-five-choice rule stands exactly as measured.
- **A family holding a match is never absent at either composition.** That is the part of FR-023
  that mattered, and neither composition weakens it.

**The family is the Almanac's, not ours.** `@elite-dangerous-almanac/core` 0.1.7 gives every module
an `OutfittingModuleIdentity.familyId` and publishes a localized name for each of the 77. That is the
grouping, and it is the only thing that reproduces the canvas: canvas 1c's Plasma Accelerator family
holds both `Plasma Accelerator · Fixed` and `Plasma Accelerator · Advanced`, and the second is a
pre-engineered variant with a different package name of its own. Grouping by displayed name — which
is what the shipped `CandidateGroup` does — splits that family in two.

**The package's own words ship, including where they read oddly.** The Almanac writes families in the
plural, `Multi-cannons`, where the canvas letters them `Multi-Cannon`. The canvas's casing is a
mock-up of a value the package now supplies, and constitution II settles which one is on screen. The
19 of 77 families the package has not yet named outside English fall to the canonical English name
with the untranslated disclosure module names already use; there is no local table for them.

**Withdrawn: the standard and unique-reward sections.** Neither canvas draws them any more. A reward
is marked where it sits — canvas 1c puts a `REWARD ONLY` chip on `Plasma Accelerator · Advanced`
directly under the ordinary article it is built on — so the heading has nothing left to say that the
row does not. Every FR-006 label survives unchanged; only the level of the tree that carried them is
gone. Sorting no longer has a section key, and `CandidateSection` narrows to being the input the
`uniqueReward` label is projected from.

**Withdrawn: the two-letter family badge.** Canvas 1d draws `MC`, `PA`, `BL`, `CN`, `FC` in a filled
square beside each family name. The Almanac publishes no abbreviation, and any rule that produces
`MC` from `Multi-cannons` is this application shortening game text — a private naming rule in a two
character box, and one with no answer at all for the 19 families whose only name is English. The
square is not drawn. The family name, count and caret carry the row.

**Withdrawn: the family summary line.** Canvas 1d writes `6 VARIANTS · 15.1–28.4 DPS · 4.46 MW`
beneath each family name. The count survives — it is a count of package records. The DPS and power
ranges do not: a min–max across a family is an aggregate the Almanac does not publish, drawn from
figures that are `null` for any choice the package has no stats for, and a range whose ends come from
two different articles invites a comparison neither of them supports. The count stands alone.

**What this does to SC-002. Measured 2026-08-23, and with one rule added it is met at last.** With
one family open the compact composition lays out that family's rows and one control per family
instead of all 478 cards. On its own that was not enough: opening every family a search matched moved
the cost rather than removing it, because the first letter of a broad term matches nearly everything
and built several hundred cards cold in one keystroke — 538.7 ms on the Panther Mk II's 478-choice
mount at 390 px under 4x CPU throttling, against the 113 ms the sectioned list recorded on
2026-08-22 and the 100 ms the criterion allows.

**Ruled: a search opens what it matched only up to a screenful, twenty-five choices.** Above that
every family stays closed, each still stating how many of the matches it holds. A search that matched
three hundred choices has not answered anything a Commander can read; what they can read is which
families hold them and how many, which is the same information the closed list already carries. So
the rows are not drawn, and the Commander narrows the term or opens the family they meant. FR-023 and
SC-008 are amended to this rather than the rule being bent around them: a family holding a match is
never absent at either size, which is the part that mattered.

**Scoped to the compact composition on 2026-08-25.** The wide manifest is a rail with one pane and
cannot paint hundreds of cards at any match count, so the twenty-five-choice rule is the compact
composition's and the measurement above is the measurement that matters for it.

Measured with that rule, `m mu mul mult multi` settles at **50.4, 56.8, 33.0, 33.6, 33.5 ms** —
three consecutive runs at 59 ms worst or better, against a 100 ms budget. **SC-002 is met at the
compact composition.**

The diagnosis recorded above is unchanged and still the reason this works: what is expensive is the
browser laying out and painting hundreds of compact cards, so the fix that counts is painting fewer
of them. The one declared compact card height canvas 1d draws is still what a list of _open_ rows
would need, and is still not built. The rule above is unchanged too: whatever is open is whole — no
paging, no growing window — and the scroller still knows its own height.

## Acquisition icons

**Ruled 2026-08-23 (wave 10).** Canvas 1c was redrawn again and the `REWARD ONLY` chip is gone from
it: where a row carried that chip it now carries a small icon naming the _route_ the article is
earned through — `community-goal.svg` on `Beam Laser · Gimballed`, `powerplay.svg` on
`Plasma Accelerator · Advanced`. The icon is adopted and the chip is withdrawn with it. "You cannot
buy this" is the smaller half of what "this is a community goal reward" already says, and the chip
was only ever short for a sentence that is still beside it.

**Both icons ship. Powerplay is keyed on the entitlement, not on a route.** The Almanac publishes
four acquisition routes — `mercenary`, `communityGoal`, `techBroker`, `eventReward` — and Powerplay is
not among them, which is why an earlier pass here recorded the icon as undrawable. That was looking
in one place only. Powerplay is published, on the other axis: an `OutfittingModule.entitlement` of
`ELITE_SPECIFIC_V_POWER_*` names it, and 0.1.7 carries twelve of them — `Advanced Plasma Accelerator`
among them, which is the article the canvas draws the icon on. The rule is the token's own prefix and
no table of game data: the application decides nothing about which articles are Powerplay rewards, it
reads the entitlement the package already states. A Powerplay entitlement takes the icon and its own
sentence; every other entitlement keeps the generic sentence with the raw token, unchanged.

**`techBroker` has a mark too, and it was missed.** Canvas 1c draws
`edassets.org/static/img/misc/tech_broker.svg` beside `Cannon · Gimballed`, at the same 14px and in
the same place as the other two route icons. An earlier pass here read only the files under
`.design/assets/icons/` — where the community-goal and Powerplay marks live — and concluded the route
had none, then wrote down the consequence as the canvas's to accept: that a tech-broker row stands in
its family beside the stock article it was built on with nothing to tell them apart, and reads as
absent. The row was never absent — every package variant is emitted and counted — but it was
unreadable, and the fix was in the reference all along. The file is vendored under the reference
review's **Icons** ruling; see there for the origin and the canvas's own recolouring filter.

**`eventReward` alone is marked in words only.** It has no mark anywhere in the reference, so it gets
none here; its sentence is unchanged and is what a reader is given either way. `mercenary` already
had its own mark, the Merc Coin, and keeps it. This is the same floor the rest of this component
works to: the drawn markers are a subset of the spoken ones, never the other way round.

**The 2026-08-25 revision hung a description on each mark, and it confirms the words already
shipping.** Every acquisition icon in the revised canvas carries a `data-tip` — `Merc Coin purchase`,
`Tech Broker unlock`, `Powerplay module`, `Community goal reward` — shown on hover. Nothing changes
here: hover-only meaning is unreachable by touch (011 FR-006), and this component has carried the
same four routes as spoken sentences beside the mark since wave 10. The revision is evidence that
those sentences are the right words, not a new element to build. The drawn markers stay a subset of
the spoken ones.

**The mark sits on the name's own line, in the ledger as in the manifest.** Canvas 1c draws the
fitted `Advanced Plasma Accelerator` with its Powerplay mark 7px after the name and the
`FIXED · 51.7 DPS · 1.97 MW · 24.0 t` code line under both. The ledger row therefore projects the
marker into the identity badge rather than placing it after the badge, where it fell under the code
line and made a third line the canvas does not have.

## Narrow and 400%-zoom composition

- Full-screen layer inspired by canvas 1d with associated title/slot description and back/cancel.
- Sticky or persistent labeled search and textual result count.
- Choices become semantic cards preserving family order and every label, beneath **the accordion
  canvas 1d still draws**. Since the 2026-08-25 revision the wide composition's family control is a
  rail rather than a disclosure, so the two are no longer the same control: this is the composition
  that keeps the caret, the open/closed state and the screenful rule.
- The DPS, mass and power figures the wide manifest no longer draws survive here, on canvas 1d's own
  code line under the module name — which that canvas did not change.
- Canvas 1d's `FITTED HERE` block stands above the family list, showing the module currently in the
  mount. It is the same fitted row the family list marks `FITTED`, drawn twice on purpose: at 390 px
  the family holding it may be scrolled far below the fold.
- A choice expands/selects with native radio/button semantics; a separate full-width fit action
  confirms the decision.
- Background workspace is inert while the layer is open. Closing it returns to the same selected slot
  without build/history change.

## States

| State                | Required presentation and behavior                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading/rebuilding   | Existing committed build remains visible; chooser is busy and cannot fit stale records.                                                                                                                                    |
| Ready                | All and only current package choices, ordered and labeled.                                                                                                                                                                 |
| Search results       | Every term matched against name/class/rating/mount; result count announced politely. Every family holding a match is present and counted, open where the match set is within a screenful; families without one are absent. |
| Family toggled       | One family opens or closes. No build revision, no history step, no rebuilt index.                                                                                                                                          |
| No matches           | Retain query, explain no match, expose clear action; no empty-slot ambiguity.                                                                                                                                              |
| Empty package result | Explain no replacement offered; this is distinct from search no-match.                                                                                                                                                     |
| Stale revision       | Discard selection, rebuild from current loadout and explain that choices changed.                                                                                                                                          |
| Fit success          | Commit once, close/return to selected slot, refresh every package result, add one history step.                                                                                                                            |
| Structured refusal   | Localized code/constraint/params; keep active build/history; rebuild choices.                                                                                                                                              |
| Removable            | Explicit remove action and package consequences; one successful decision.                                                                                                                                                  |
| Non-removable        | Reason visible; remove absent.                                                                                                                                                                                             |

## Candidate facts and labels

- Stock/variant status is textual.
- Package localized module name is primary; class, rating and mount are separate values.
- Variant purchase grade is never labeled as current ordinary grade.
- A fitted row is matched on the **whole variant** — name, blueprint and grade — not on the module
  symbol alone. A stock article and its pre-engineered variant share a symbol, and two rewards can
  share a variant name, so anything less marks two rows fitted for one fitted module (wave 4).
- Community-goal/event-reward choices sit in the family of the module they are built on, marked on their own row.
- Mercenary/tech-broker variants show route plus not-ordinarily-available.
- Entitlement adds another label and does not replace acquisition.
- Missing translation uses canonical package text plus untranslated disclosure.
- Search still covers only the package-localized module name, class, rating and mount. A family name
  is not a fifth search field: a term that matches a family but no row inside it would open a control
  in front of nothing.

Do not show invented suitability rankings, “recommended” badges, inferred compatibility, local
comparison deltas or design-mock purchase labels. Choosing a package record is not proof it can still
fit after another tab/component edit; the detached transaction remains final authority.

## Accessibility and performance

- Search has visible label/instructions; result count is a polite live region; no-match is a status,
  not just blank content.
- Family controls describe list structure: each publishes its name, its current choice count and its
  revealed state programmatically, not by glyph or ground alone — `aria-expanded` on the compact
  accordion's disclosure, and the selected-state attribute on the wide rail's row, whose amber ground
  and left rule are otherwise the whole difference between it and its neighbours. Selected state and
  acquisition restrictions are text/programmatic, not border/icon/color only.
- A family control is a real control at every width: at least 44 CSS px of target, operable by touch
  and pointer, and not part of the `DENSE_TARGETS` exemption.
- Candidate action names include module form and class/rating context needed to distinguish choices.
- Targets are at least 44 CSS px, except the dense inline chips the canvas itself draws small — a
  ledger row's power cell is 20px there, and forty rows of a 44px chip is a different interface.
  Those clear the WCAG 2.2 AA floor of 24 CSS px instead, and the exemption is a named list
  (`DENSE_TARGETS`), never a loosened baseline (wave 4).
- Browser input-to-result DOM update stays below 100 ms for the installed package's largest choice set.
- Axe/semantic/no-overflow tests cover full, searched, no-match, empty, stale and refusal states at all
  browser/viewport combinations.
