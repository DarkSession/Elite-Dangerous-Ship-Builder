# Design Reference Review

## Source reviewed

> Re-verified against the 2026-08-21 canvas re-sync (`.design/Ship Builder.dc.html`, 397 KB). All four
> canvases remain. `NODE NO.`, `None — stock module`, `None — remove effect`, `⌘K` and the identity
> pencils are unchanged, so every ruling below still applies. `CLEAR ✕`, `G5 ROLL`, the `data-delta`
> markers and the per-candidate delta chips have been removed from the design, matching four rulings
> already recorded here.
>
> **Re-verified again against the 2026-08-23 canvas re-sync (1.20 MB, wave 10).** Both outfitting
> canvases were redrawn around collapsible module families. Canvas 1c gains a family row — name,
> count, caret — inside the seven-column manifest, with rows such as `Multi-Cannon · Gimballed`
> beneath the open one. Canvas 1d gains a `FAMILIES` list with its own `5 · 24 FIT` counter, a
> two-letter family badge, a per-family `6 VARIANTS · 15.1–28.4 DPS · 4.46 MW` summary, and a
> `FITTED HERE` block above the list. Both canvases dropped the standard and unique-reward section
> headings; a reward now carries, on its own row, the icon of the route it is earned through — a
> `REWARD ONLY` chip when this was written, redrawn as a route icon the same day. Every ruling on those changes
> — three adoptions and three withdrawals — is in
> [module-replacement.md](./module-replacement.md), "Module families".

- `.design/Ship Builder.dc.html`
- Canvas **1c**: wide outfitting workspace, module manifest and engineering/material regions
- Canvas **1d**: narrow slot list, change-module layer and engineering layer

Canvas 1c is 1560px wide. Canvas 1d is 390px wide with an 844px minimum root height. No tablet or
intermediate-width canvas exists; [responsive-composition.md](./responsive-composition.md) records
the intentional tablet interpolation.

The canvas is a visual/product reference, not source code, package data or a component implementation.

## Adopted decisions

| Reference decision                                    | Planning interpretation                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Dense grouped slot ledger with exact module summaries | Render all package slots in outfitting order with semantic group/list structure and explicit keys. |
| Wide selected-slot editor and candidate manifest      | Replacement and engineering compose inline without leaving `/build`.                               |
| Narrow category controls and stacked slot cards       | Same complete package slot collection reflows for touch/mobile.                                    |
| Narrow full-screen change/engineering views           | Responsive application layers with explicit cancel/apply and inert background.                     |
| Direct wide undo/redo and compact narrow actions      | Same session-history capability at every width.                                                    |
| Per-module enabled/priority control                   | Separate accessible switch/select, with package zero-based values and one-based labels.            |
| Visible engineering/material context before apply     | Draft shows package current/candidate facts and costs before one atomic decision.                  |

Exact responsive differences retained: wide offers `ALL` plus four fitting categories while compact
offers the four categories without `ALL`; wide Mounts may show top/bottom anatomy simultaneously
while compact toggles them; wide history is direct while compact history is in the overflow action
region; compact has persistent selected-slot actions. Canvas 1d places anatomy/status before fitting,
and the plan uses that same compact order.

## Required adaptations

### Package truth and capability scope

- Every mock slot, module, count, price, stat, modifier, material and warning is illustrative. Runtime
  reads only the active `ShipLoadout` and package leaf APIs.
- Canvas anatomy nodes belong to feature 010. Headline/live statistics belong to features 003 and
  005–009. Save/import/export/help belong to features 001, 004 and 012. Feature 002 supplies
  composition outlets, not duplicate mock calculations.
- Candidate rows contain only `modulesForSlot()` stock records and package pre-engineered variants.
  “Leave empty” appears only when package removability permits an explicit remove action.
- Cargo hatch has facts and power only; it never opens replacement/engineering.
- Design “Powerplay reward” assumptions are replaced with exact package entitlement/acquisition data.
  Mercenary, tech-broker, community-goal and event-reward are not conflated.
- Variant recognition comes only from `FittedModule.preEngineeredVariant`; purchase grade stays
  separate from current ordinary grade.
- Design comparison arrows/colours **are drawn**, from an application-owned direction table rather
  than from the Almanac's unreliable `LessIsGood`. See "Attribute direction" below (revised
  2026-08-22).

### Normalization and engineering

- The canvas/help statement that imported modules keep a partial roll contradicts the constitution.
  Unknown modules are outside the supported import contract. Package-supported partials on resolved
  modules complete to 100% with notice;
  unsupported partial candidates are refused atomically before activation.
- Package construction populates absent or unusable fixed mounts before workspace/calculations render;
  no second repair or provenance surface is needed.
- The engineering surface has distinct effect-only and clear-all behavior. It cannot rewrite raw
  modifier blocks or turn a fixed reward into an ordinary roll; it uses the package's structured
  `setExperimentalEffect()` operation.
- Material images cannot be fetched from the external source named in the canvas. Use package or
  repository same-origin assets where licensed/available, otherwise accessible text; never a runtime
  third-party request.

### Interaction and semantics

- Canvas clickable `div` rows/tabs/dropdowns become shared native/semantic controls.
- A slot row cannot be one interactive container around nested power controls. Selection/edit,
  enabled and priority are distinct named controls.
- Candidate selection uses radio/button semantics and explicit apply; editor draft changes are not
  immediate history steps.
- Canvas 1c does not show desktop Fit/Apply/Cancel controls. Adding explicit confirmation and draft
  semantics at every width is a deliberate safety/history deviation: selection has no side effect and
  one confirmation produces one atomic Commander decision.
- Search gains a visible label, exact result count, polite announcement, explicit no-match status and
  clear action.
- Canvas 1d's weapon-family chips are omitted because neither the specification nor a required package
  grouping supplies that filter. The required four-field AND search remains.
- Selected, engineered, disabled, invalid/incomplete and reward states gain text/programmatic state;
  amber border, opacity, dots and icons are never the sole cue.

### Design system, localization and accessibility

- Inline canvas colors, typography, sizes, spacing, radii, elevations, durations and hover effects are
  translated into feature 011 tokens/shared components; canvas CSS is not copied.
- Google Fonts requests do not ship. Any retained typeface is licensed and self-hosted same-origin
  through feature 011/012.
- Every application label/help/refusal uses localization messages. Module, blueprint, effect and
  material names use package i18n helpers; canonical fallback is disclosed where missing.
- Abbreviations and one-based priority values have localized visible/accessibility expansions.
- Every target is at least 44 CSS px. Hover is enhancement only. Wide manifests own internal overflow;
  400% zoom uses narrow composition with no document horizontal scrolling.
- Screen-reader order follows semantic content, not three-column visual placement. Expanded/RTL text,
  200% text, 400% zoom, both orientations and reduced motion are explicit acceptance states.

## Divergence from FR-019 (ship name and ident)

**What the reference draws.** Canvas 1c's 54px command bar draws `PACIFIER ✎` on the first line and
`ANACONDA · FD-11X ✎` on the second: two pencil affordances editing in place, no labelled fields and
no separate screen. Canvas 1d draws `PACIFIER ✎` and `ANACONDA · FD-11X` — **the ident carries no
pencil at compact width**.

**What was withdrawn.** The labelled header text inputs first written into T083a. They are not on
either canvas, and a labelled field pair beside the identity line is the addition-beside-the-design
failure this repository has already made three times.

**What survives at the facade.** The pencil affordance on the identity line at both widths, as a
native control with a `visually-hidden` accessible name and a 44 CSS px target. Editing happens in
place on the identity line; nothing else is added to the command bar.

**What is left open** (needs a ruling before T083a is scheduled):

1. ~~Is `PACIFIER` the record name or the modelled `shipName`?~~ **Ruled 2026-08-21: they are one
   field.** The canvas showing the same string in the header, the save dialog and the export title is
   correct and literal — feature 001's save dialog and this feature's identity control read and write
   the same modelled `shipName`. Neither keeps a second copy. Record identity stays a local id
   independent of that name (001 FR-008), so no feature 001 requirement changes.
2. ~~Canvas 1d omits the ident pencil.~~ **Ruled 2026-08-21: the ident carries a pencil at both
   widths.** 1d's omission is an omission in the reference, not a capability boundary, so the wide
   affordance is mirrored at compact width using the same design-system element. Nothing is invented.

## Open collisions — awaiting ruling

Found on 2026-08-21 and not covered by the 2026-08-16 rulings above.

**Per-row change/engineer/remove actions, ruled 2026-08-21 during US1 implementation.**
Withdrawn. An earlier draft of the slot card put `Change module`, `Engineer` and `Remove module` on
every ledger row. Neither canvas draws them there: canvas 1c's ledger row carries a size, a node
badge, the module's identity and its power control, and canvas 1d's row carries the same. The row's
job is to select. Where the actions went is ruled separately below, because the two canvases do not
agree on that and an earlier pass carried canvas 1d's answer to both widths.

The Almanac's _reason_ a mount cannot be emptied moved with them, and the full sentence is published
on the bench, where it answers a question a Commander is asking rather than repeating down seven core
rows. The row itself carried a short `FIXED` marker beside it until the 2026-08-25 revision withdrew
it; see below.

**The `FIXED` chip is withdrawn, 2026-08-25 (canvas revision).** The resynced canvas draws the cargo
hatch as an ordinary ledger row — a size, the name `Cargo Hatch 1E` and an ordinary power-priority
control — and writes no chip beside it, on the row or on the bench. What it does carry is a `title`:
`Cargo Hatch cannot be replaced or engineered — power priority only`, plus `cursor: default` and no
selection affordance. So the canvas states the fact in prose and in behaviour, not as a drawn label,
which is what this feature already publishes on the bench. Under the standing rule — is it on the
design? no → remove it — the chip goes, with its two computed markers, its two style rules and its
`outfitting.immovable.short.cargoHatch` string in both catalogues. The full sentence stays: it is the
reading, and it is now the only one.

**Two-pane threshold, ruled 2026-08-21 during US1 implementation.** The wide composition is selected
at the sum of the two declared content minimums (24.5rem + 22.5rem = 47rem; **corrected 2026-08-22,
wave 9**, from a 20rem ledger — the wide grid's leading track is canvas 1c's fixed 392px rail, not
the width a slot card's wrapped name needs, so the composition had been opening 4.5rem before it
could hold itself),
not at feature 011's generic wide container step. The generic step is smaller, and granting two panes
below the sum produces exactly the state
[responsive-composition.md](./responsive-composition.md) rules out: both panes present and neither
able to hold its content. Expressed in rem, so a reader at 200% text steps down to the compact
composition instead of overflowing the document. The same two minimums drive the TypeScript observer
that decides whether the bench is inline or a full-screen layer, so the CSS and the layer decision
cannot disagree.

**Region heading, ruled 2026-08-21 during US1 implementation.** Neither canvas draws a heading over
the outfitting region. One is present and `visually-hidden`: without it the document jumps from the
route's `h1` to the ledger's kind headings, which leaves a reader unable to tell whether they have
moved into a subsection or out of one. This is the invisible accessibility floor the design-canvas
rule already permits, not an addition to either canvas.

**`⌘K` search shortcut, ruled 2026-08-21.** Adopted as drawn, as an _unrequired_ affordance, and
wired on 2026-08-28. It cannot be a requirement or an acceptance gate — constitution V puts criterion
2.1.4 out of scope and forbids any requirement demanding keyboard operation — and it is never the
only route to the field. The hint is application text: localized, and resolved per platform rather
than shipping the macOS `⌘` literal everywhere. The key event is cancelled, or the browser claims it
for its own address bar and the hint names a key the page never receives. See
[module-replacement.md](./module-replacement.md).

**`G5 ROLL` label, ruled 2026-08-21 — since adopted by the design.** The canvas now draws
`MATERIALS · G5`, so specification and design agree and the heading is the canvas's own form. A
selected grade always represents a completed 100% grade (constitution IV, FR-013), so no surface
calls the recipe a roll. Same contradiction as the help modal's roll sentence, ruled on 2026-08-16.

**Visible slot key, ruled 2026-08-21.** Withdrawn. Neither canvas draws a game slot key; they draw
`SIZE · NODE NO.` in the ledger and `FITTING · HARDPOINT 1` at the bench. Screens show those labels.
The exact key remains the internal identity, the anatomy/ledger exchange value and `visually-hidden`
text beside the drawn label — the invisible accessibility floor, not an addition to the design.
FR-002 is unaffected: it fixes slot _identity_, not slot display.

**Clear-all, ruled 2026-08-21 — since adopted by the design.** `CLEAR ✕` no longer appears on either
canvas. It was withdrawn as duplicative rather than
mirrored into 1d: both canvases already draw `None — stock module · REMOVES ENGINEERING` in the
blueprint list and `None — remove effect` in the effect list, so every clear route already exists
identically at both widths. See [engineering-editor.md](./engineering-editor.md) "Clearing
engineering". This removes the asymmetry without adding to either canvas.

**Per-candidate delta chips, ruled 2026-08-21 during US2 implementation.** Withdrawn. Canvas 1c's
`data-delta` ▲/▼ markers and its `Δ VS SAVED` labels are gone from the design — only the tooltip
script that once wired them survives, attached to nothing. Canvas 1d's chooser rows still draw two,
`−2.4 DPS` and `−8.6 DPS` in `--hot-2`, against the module currently fitted. Those are not
implemented. A delta is a comparison this feature does not own: it needs the fitted module's
performance and the candidate's computed side by side, and colouring one row warm is a statement
about which module is better for this build. Both are excluded independently by
[module-replacement.md](./module-replacement.md) "no local comparison deltas",
[module-catalogue.md](../contracts/module-catalogue.md) "no suitability delta", task T050 and
quickstart scenario 11, and the accepted specification governs where it and the canvas disagree. The
package facts the row is built from — mount, DPS, power, mass, cost — are all drawn and all kept; it
is only the _difference between two of them_ that is withdrawn.

The chooser's cost column is already adopted by
[module-catalogue.md](../contracts/module-catalogue.md); only credit _formatting_ differs between the
canvases, and that belongs to feature 009.

**Weapon-family chips, confirmed withdrawn 2026-08-21 during US2 implementation.** Canvas 1d still
draws a horizontally scrolling chip row above the compact chooser — `ALL · MULTI-CANNON · BEAM ·
CANNON · PLASMA`. [module-replacement.md](./module-replacement.md) "Candidate facts and labels"
already omits it, and implementation confirms why: the rows those chips filter are named `Huge
Multi-Cannon` and `Huge Beam Laser`, so a `MULTI-CANNON` chip is not one of the package's names. It
is a family cut out of them, and cutting it out means this application deciding where a game name
divides — a private taxonomy over package text, which FR-007 and the localization contract both
forbid. Search covers exactly name, class, rating and mount, and that is the whole filter.

**Paged chooser, ruled 2026-08-21 during US2 implementation.** Canvas 1c draws six candidate rows
and canvas 1d seven. The Almanac's largest mount — the Panther Mk II's size-8 optional internal —
offers 478, and building all of them costs more than the whole hundred milliseconds SC-002 allows
between a keystroke and the result on screen: measured under Chromium at the mobile viewport with the
CPU throttled fourfold, a full list settles at about 120 ms and a page of sixty at about 75 ms. The
chooser therefore builds a page at a time, growing as the list is scrolled and through an explicit
`Show more modules` control beside a `Showing 60 of 478` count.

**Superseded 2026-08-22 by [module-replacement.md](./module-replacement.md) "The manifest is whole,
and the scroller knows how tall it is".** There is no paging, no growing window, no `Show more
modules` and no built count: every choice is in the document from the first frame, and at wide width
the rows outside the scroller are skipped over a height each row is given. The paragraph above is
kept as the record of the decision it replaced, and the two below belong to it. Note that the
measurement quoted in it is the one the newer rule has since had to record as **unmet at the compact
composition** — see that rule's own note.

The control is the one thing here that neither canvas draws. It stays because scrolling cannot be the
only way to reach the rest of a list — constitution V puts the keyboard criteria out of scope, which
means an interface may not _depend_ on them, and "scroll to load" is exactly such a dependency for a
Commander reading rather than scrolling. The count beside it is what keeps the paging honest: the
number the surface publishes is always how many choices there are, never how many are built.

**Section and group headings, ruled 2026-08-21 during US2 implementation.** Neither canvas draws one:
1c draws a flat six-row table under a single column header, and 1d a flat card list, with the
unique-reward choices marked by a `REWARD ONLY` badge on the row rather than gathered under a
heading. [module-replacement.md](./module-replacement.md) requires headings that "describe list
structure". Both hold: the sections and name groups are real structure with real accessible names,
and those names are `visually-hidden`, so a screen reader hears where a list changes and the screen
stays the flat list the canvas draws. Same invisible accessibility floor as the region heading and
the slot key above, and the `REWARD ONLY` badge is kept as the visible marker the canvas gives the
unique-reward section.

**Superseded in part, 2026-08-23 (wave 10).** The canvases are no longer flat: both now draw a
visible family control with a name, a count and a caret, so the family heading stops being an
invisible accessibility floor and becomes the structure a Commander sees and operates. The section
level is gone from the canvases and from the requirement with it. The `REWARD ONLY` badge does not
survive either: canvas 1c was redrawn again later the same day and replaced it with an icon naming
the route the article is earned through, so the badge is withdrawn and that icon is what marks a
reward — and a route the canvas draws no icon for is marked in words only. The name group survives as
ordering inside a family, not as a level of the tree. See
[module-replacement.md](./module-replacement.md), "Module families" and "Acquisition icons".

**Blueprint option descriptions, ruled 2026-08-21 during US3 implementation.** Withdrawn. Both
canvases write a summary under each recipe — `DAMAGE ▲ · THERMAL LOAD ▲`, `RATE OF FIRE ▲ · ACCURACY
▼`. The Almanac publishes no description for a blueprint and no direction for what one moves, so
those lines would have to be authored here: a private claim about game mechanics, which FR-007 and
the localization contract both forbid. The explicit `None — stock module · REMOVES ENGINEERING` line
stays, because it describes an _operation this application performs_ rather than a game mechanic, and
the route line stays where the package itself says a recipe is not an ordinary one. What each recipe
does is shown instead in the comparison the draft actually computes.

The **experimental effect** descriptions are kept exactly as drawn: `getExperimentalEffectDescription`
publishes one per effect, so `−3% ENEMY HULL RESIST · −20% AMMO` is package text rather than a claim
of ours. Where the package has none, the row says so.

**Attribute column headings, ruled 2026-08-21 during US3 implementation, corrected the same day.**
Adopted as drawn. The columns read `Stock` and `Modified`, the canvas's own headings, and they hold
the canvas's own pair: the package's catalogue record for the fitted article — `FittedModule.stats`,
which is the resolved article record on a recognised reward — against what the selection would make
of it. An earlier pass headed them `Current` and `Candidate` and compared the module _as it now
stands_ instead; that was invented text over an invented pair, and it also diverged from the game's
own engineering panel, which shows stock beside modified. Where a module is unengineered the two
readings coincide, which is why the substitution survived a first review.

**Attribute direction, ruled 2026-08-22, reversing the withdrawal recorded above.** The canvas's
green/red and its ▲/▼ are drawn. The earlier ruling was right that the Almanac publishes no
trustworthy direction — `LessIsGood` is documented as unreliable and is not read — and wrong to
conclude that nothing may be said. Whether more damage is better than less is not a fact about the
Almanac's data; it is a fact about the game, and it is one answer per attribute this surface
compares. They live in `HIGHER_IS_BETTER`, beside `COMPARED_ATTRIBUTES`, owned by this application
and stated as such — exhaustive over that list by type, so a field the Almanac adds cannot reach the
panel without someone stating which way is better for it.

Two things follow from the canvas rather than from arithmetic. ▲ means **better** and ▼ means
**worse** — not which way the number moved: the canvas draws a power draw that rose from 0.73 to 0.88
with a ▼ in `--hot`, because a heavier draw is a worse module. And colour is never the only carrier:
the glyph and a `visually-hidden` word carry the same claim.

**Opening controls for the two surfaces, ruled 2026-08-21 after a design pass.** Canvas 1c draws no
control that opens either surface. The fitting panel — `FITTING · HARDPOINT 1`, a search field, a
`REMOVE MODULE` control and the candidate manifest — and the `ENGINEERING` panel below it are simply
present, under the anatomy, for whichever row is marked in the ledger. `CHANGE MODULE` and `ENGINEER`
exist only on canvas 1d, in a sticky bar of exactly two controls, because at that width each panel is
a screen of its own over an inert background.

An earlier pass drew canvas 1d's bar at every width. That is the mobile interface on the desktop, and
it puts a control in front of a panel that the reference shows without one. Corrected: the bar is
drawn only in the compact composition, and the inline compositions render both panels directly for
the selected mount, gated on what the package permits rather than on a surface flag. The selection
itself follows the same rule — neither canvas draws an outfitting screen with nothing selected, so an
unset selection resolves to the first mount rather than to a bench with a sentence in it.

**Undo and redo are published, not drawn, ruled 2026-08-21 during US4 implementation.** Canvas 1c
draws `↶ UNDO` and `REDO ↷` in the command bar's action row and canvas 1d puts the same two in its
`⋮` menu — which is exactly the pair of placements feature 011's frame already renders from one
action list, with identical names in both. So the workspace publishes them through the shell's action
channel rather than drawing its own pair inside the region: a second pair would be the same two
actions twice, in a place neither canvas puts them. Task T093 named a component file for them; what
was built is the channel, and the task text now says so.

**Where the two ways in sit on that row, ruled 2026-08-26 (Commander request).** No canvas draws
either of them there. The shipyard's `IMPORT` sits alone beside `?` on canvas 1a's bar, and its
`OPEN SAVED BUILD` is a control on the page — beside the filters on the manifest, beside
`BUILD STOCK HULL` on the hull detail — so a bar carrying both is this application's own composition
and their order is its own decision. They belong beside each other: they are the same question with
two answers, and the screen's history pair and `EXPORT` sat between them. Importing now opens the
action row and the screen's own actions are grouped off after it, which puts it next to the library
link the frame draws immediately before that row. The library stays a link: it is a route, and a
button for it could not be opened in a new tab or have its address copied.

The next-action summary the contract asks for is exposed by the store and carried as the control's
`aria-describedby` — invisible, because neither canvas draws a summary beside either control. It is
the same accessibility floor as the ledger's hidden slot keys.

**Power state the build link could not carry, found 2026-08-21 during US4 implementation, closed
2026-08-26.** Recorded rather than resolved at the time, because the codec is feature 001's. Both
canvases draw a power chip on every ledger row _including the power plant_, and the package accepts
`setModulePriority` there — but the compact link codec wrote power state only for modules the
Almanac prices above zero draw, so a priority set on the plant was dropped from the link while the
local record kept it. Reloading a page whose only unsaved change was a plant priority then asked
"Replace the build you are working on?", because the address bar and the stored record disagreed
about the build.

Feature 001's own FR-019 says a build the codec cannot represent losslessly must be _refused_ with
the affected slot and reason rather than silently reduced, so this was a defect in that codec rather
than a rule of this feature: nothing here fabricates or drops a value. It is fixed there: the codec
table now carries power state for every module the Almanac does not positively price at no draw,
which is the chip's own rule — a figure the Almanac has not published is not a zero (constitution
IV). The chip this feature draws on the plant, the tank, the rack and the bulkhead therefore
survives a share, and this feature keeps the chip the canvas draws on every row unchanged.

**Short viewports take the compact composition, ruled 2026-08-21 after a design pass.** A consequence
of the rule above, found by measurement: with the two panels inline, a 844 x 390 landscape viewport
produced a document about 15,000 px long — the complete ledger, a page of sixty candidate rows and the
engineering panel stacked, with the panel a Commander is trying to reach below all of it and moving
while they scroll. The composition observer now reads the stylesheets' own `max-height: 30rem` query,
so a short viewport selects canvas 1d's composition at any width. See
[responsive-composition.md](./responsive-composition.md) "Declared content minimums".

**`REMOVE MODULE` placement, ruled 2026-08-21 after a design pass.** Canvas 1c draws it once, in the
fitting panel's own header beside the search. Canvas 1d draws no remove control at all: its chooser
list ends with a `Leave empty` row that does the same thing. Emptying a mount is part of choosing
what goes in it, so the control lives in the chooser's header at both widths — the position canvas 1c
draws, reached at compact through the same screen that offers every other choice for the mount. The
alternative, a third button in canvas 1d's two-control bar, would add to that canvas rather than
follow it.

**Current-state sentences in the engineering editor, ruled 2026-08-21 after a design pass.**
Withdrawn. The editor opened with two lines above the choices — `Currently Increased range at grade
5.` and `Experimental effect: Corrosive Shell.` — that neither canvas draws. Both canvases say the
same thing the way an editor says it: the recipe the module carries is the marked choice and carries
the `APPLIED` marker, the grade row shows that grade, and the effect it carries is the marked effect.
The editor opens with exactly that selection, so the sentences restated drawn state in prose. The
`Applied` marker is kept, because it is drawn.

What stays is the purchase line — `Bought as Ax Frame Shift Drive at grade 1` — and the clear
consequence. Neither is drawn, and neither is duplicative: the grade an article was _bought at_ is not
the grade now applied and no choice on screen carries it, and losing the article's identity is a
consequence of an operation this application performs rather than a fact about the module. Same carve
out as the drawn `None — stock module · REMOVES ENGINEERING` line.

**The power chip's wording, ruled 2026-08-21 after a design pass.** Both canvases draw one hairline
chip at the end of a ledger row: a coloured dot and a bare number, `--good` when powered and `--hot`
when not, titled `Power priority 3` and, on the wide canvas, `Power priority — click the dot to
unpower this module`. Neither canvas writes the word _group_ anywhere. An earlier pass labelled the
five options `Group 1`–`Group 5` with a `No group` entry above them; that is text the design does not
have, and it names a concept the game's own outfitting panel does not name either. The options are
the numbers `1`–`5`, the dot is the switch, and the accessible names — `Power priority for {module}
in {mount}` — carry the wording the canvas keeps in a tooltip.

Where the package reports no group at all, the control shows the shared `Unavailable` value and that
option cannot be chosen back: the canvas draws no case for an absent group, the package publishes no
operation that unsets one, and writing `1` there would be inventing a value the Almanac never stated
(constitution IV).

**Material rarity icons, ruled 2026-08-21 during US3 implementation.** Both canvases draw each
material's rarity as an image from `edassets.org`. Constitution I forbids any cross-origin runtime
request, so the rarity is drawn as the package's own grade in words — `Grade 4` — in the icon's
place. Same fact, same source, no request. The row composition the canvas draws is otherwise
unchanged, and the Merc Coin line keeps its own row exactly as drawn.

| #   | What canvas 1c/1d draws                                                                                                            | What the specification says                                      | Why it collides                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Canvas 1c's anatomy legend reads `SELECTED · FITTED · EMPTY · UTILITY · ENGINEERED`; canvas 1d's reads `FITTED · EMPTY · UTILITY`. | The workspace composes the shared anatomy outlet at both widths. | The two canvases disagree on the legend; feature 010 owns the resolution but feature 002 composes the result. |

## Reconciliation, 2026-08-21

Every collision listed above has been ruled on and closed in place, with one exception, which is
carried rather than closed: the anatomy legend in the table below disagrees between the two canvases
and is **feature 010's** to resolve. Feature 002 composes whatever that feature publishes and draws
no legend of its own, so nothing here depends on the ruling.

The built asset tree carries no value from the reference canvas. Checked against
`dist/elite-dangerous-ship-builder` after a production build:

| Looked for                                              | Found                                                        |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `edassets.org` — the canvas's material rarity icons     | **the five files, served from this origin** (see below)      |
| `assets/merc-coin.png` — the canvas's Merc Coin icon    | present, served from this origin                             |
| `2,613,410`, `18,364,200` — the canvas's mock prices    | absent                                                       |
| `Huge Multi-Cannon`, `OVERCHARGED G5` — mock identities | absent                                                       |
| `FD-11X` — the canvas's mock ship ID                    | absent                                                       |
| `Pacifier` — the canvas's mock build name               | present **as the Almanac's own `Pacifier Frag-Cannon`** only |

No mock module, price, stat, modifier or material value from `.design/` reaches the product. Every
figure a Commander reads comes from the installed package or is stated as unavailable.

**Icons, ruled 2026-08-22.** The canvas points at `edassets.org/static/img/materials/grade-N.svg` and
at a Merc Coin image. Constitution I forbids reaching another origin _at runtime_; it does not forbid
shipping the design's own artwork. The five rarity files and the coin were taken once at build time
and are served from `assets/`, so the mark a Commander sees is the mark the game uses. An earlier pass
redrew the rarity mark from the idea of it — a hexagon with one blade per grade — which is a
different icon wearing the same description, and was withdrawn.

**Voice, ruled 2026-08-22 (wave 9), amended 2026-08-28.** Commander-facing copy no longer names the
Almanac. The package is the source of every figure and every refusal, and the design's own drawings
state facts — `There is no engineering for this mount.` — without crediting a dependency for them.
Naming it made a library the speaker of sentences about a Commander's ship, and the credit belongs
to feature 012, once per application rather than in thirty strings. Where that credit is made is
feature 012's to decide: it is the licence summary's library line, which names the bundled library's
own terms and links them (012/FR-003, 012/FR-008). The name stays in code comments, spec prose and
diagnostics that never reach a screen, because there it says which system is being described.

**Utility node ground, ruled 2026-08-23 (wave 10, Commander request).** The canvas's `paintNodes`
gives every unselected node in the ledger the one dark ground — `rgba(11,11,12,.88)` — and turns only
the number's ink and the box's edge to the anatomy's blue on a utility mount. The ground is washed
with the same blue here as well. It is a departure, recorded rather than absorbed: the box is what a
Commander scans forty rows for, and two digits of blue inside a ground shared with every hardpoint
was not finding them. The selected node is unchanged and still takes the solid accent, so the mark
that says which mount is being outfitted is not the one that says which kind it is.

**Tech Broker mark, ruled 2026-08-23 (wave 10, Commander request).** Canvas 1c draws a third route
icon beside a module's name — `edassets.org/static/img/misc/tech_broker.svg` on `Cannon · Gimballed`
— and an earlier pass here read only the two icons under `.design/assets/` and concluded the route
had no mark. It has one. The file is taken once at authoring time and served from this origin as
`assets/icons/tech-broker.svg`, under the same **Icons** ruling above that brought in the rarity
marks and the Merc Coin: Constitution I forbids reaching another origin at runtime, not shipping the
reference's own artwork. It arrives as unpainted black line art, so the canvas's own
`filter: brightness(0) invert(1) sepia(1) saturate(6) hue-rotate(350deg)` comes with it, as
`--edsb-filter-route-broker`, rather than a colour of ours being baked into the file.

`eventReward` remains the one route with no mark anywhere in the reference, and still draws none.

## Canvas revision, 2026-08-25

Canvas 1c's chooser was redrawn. Canvas 1d's was not, so the two now differ in kind and not only in
arrangement.

| Change                                                                   | Status against the build                                                                                                         |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Canvas 1c's accordion becomes a 216 px family rail beside a variant pane | **Built** (T147).                                                                                                                |
| Exactly one family selected at wide; no caret at that width              | **Built** (T146, T147). Selection is exclusive and total, and never empty.                                                       |
| Both panes bounded at `max-height: 470px`, each scrolling on its own     | **Built** (T147).                                                                                                                |
| The wide manifest narrows to `MODULE` / `CLASS` / `COST`                 | **Built** (T148).                                                                                                                |
| `DPS`, `MASS t`, `PWR MW`, `DRAW WEP` withdrawn from the wide manifest   | **Built** (T148). They survive on canvas 1d's card, which that canvas did not change.                                            |
| Canvas 1d's accordion, badge, variants summary and code line             | **Unchanged.** Every existing ruling on them stands.                                                                             |
| Hover descriptions on the acquisition marks (`data-tip`)                 | **Already answered.** The four routes have carried spoken sentences since wave 10; hover-only meaning is not built (011 FR-006). |

The two-price cost cell, the acquisition icons, the family taxonomy and the whole-manifest rule are
untouched by the revision. What the exclusive rail costs FR-021 to FR-023 is ruled in
[module-replacement.md](./module-replacement.md), "What exclusive selection does to FR-021, FR-022
and FR-023"; the columns are ruled in "The manifest's own columns" in the same file.

## Released API constraint

Visual implementation consumes the released Almanac operations in
[../research.md](../research.md). Hiding effect-only actions for supported fixed rewards or merging
modifiers in the screen would violate the accepted spec and constitution.

## Acceptance

Feature 002 is visually accepted only when it remains recognizably consistent with the workspace and
mobile hierarchy of canvases 1c/1d **and** every adaptation above is present. Pixel similarity cannot
override package truth, feature boundaries, localization, accessibility or lossless behavior.
