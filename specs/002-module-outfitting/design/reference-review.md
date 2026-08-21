# Design Reference Review

## Source reviewed

> Re-verified against the 2026-08-21 canvas re-sync (`.design/Ship Builder.dc.html`, 397 KB). All four
> canvases remain. `NODE NO.`, `None — stock module`, `None — remove effect`, `⌘K` and the identity
> pencils are unchanged, so every ruling below still applies. `CLEAR ✕`, `G5 ROLL`, the `data-delta`
> markers and the per-candidate delta chips have been removed from the design, matching four rulings
> already recorded here.

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
- Design comparison arrows/colors are omitted because the package provides no trustworthy
  better/worse direction. Exact package before/current values can still be shown.

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
badge, the module's identity and its power control, and the actions live on the selected mount's
bench under `FITTING · HARDPOINT 1`; canvas 1d's row carries the same and puts the actions in the
persistent selected-slot bar. The row's job is to select. The actions moved to the bench at both
widths, which is what the reference draws and what
[outfitting-workspace.md](./outfitting-workspace.md) "Selected slot exposes explicit `Change module`
and `Engineer` actions" already said.

The Almanac's _reason_ a mount cannot be emptied moved with them. The row keeps a short marker —
canvas 1d's `FIXED` on the cargo hatch — and the full sentence is published on the bench, where it
answers a question a Commander is asking rather than repeating down seven core rows.

**Two-pane threshold, ruled 2026-08-21 during US1 implementation.** The wide composition is selected
at the sum of the two declared content minimums plus their gap (20rem + 22.5rem + one region gap),
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

**`⌘K` search shortcut, ruled 2026-08-21.** Adopted as drawn, as an _unrequired_ affordance. It
cannot be a requirement or an acceptance gate — constitution V puts criterion 2.1.4 out of scope and
forbids any requirement demanding keyboard operation — and it is never the only route to the field.
The hint is application text: localized, and resolved per platform rather than shipping the macOS
`⌘` literal everywhere. See [module-replacement.md](./module-replacement.md).

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

**Attribute column headings, ruled 2026-08-21 during US3 implementation.** The two columns are drawn
as the canvas draws them; their headings read `Current` and `Candidate` rather than the canvas's
`STOCK` and `MODIFIED`. The editor holds an unapplied draft, and the question it answers is what this
change would do to the module as it is now — which is what
[engineering-editor.md](./engineering-editor.md) and task T070 both specify. Carrying the canvas's
words over a different pair of numbers would be the one thing worse than changing them. The canvas's
green/red deltas and ▲/▼ markers stay withdrawn for the reason already recorded above: the Almanac
documents its own `LessIsGood` as unreliable and nothing else publishes a direction.

**Material rarity icons, ruled 2026-08-21 during US3 implementation.** Both canvases draw each
material's rarity as an image from `edassets.org`. Constitution I forbids any cross-origin runtime
request, so the rarity is drawn as the package's own grade in words — `Grade 4` — in the icon's
place. Same fact, same source, no request. The row composition the canvas draws is otherwise
unchanged, and the Merc Coin line keeps its own row exactly as drawn.

| #   | What canvas 1c/1d draws                                                                                                            | What the specification says                                      | Why it collides                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Canvas 1c's anatomy legend reads `SELECTED · FITTED · EMPTY · UTILITY · ENGINEERED`; canvas 1d's reads `FITTED · EMPTY · UTILITY`. | The workspace composes the shared anatomy outlet at both widths. | The two canvases disagree on the legend; feature 010 owns the resolution but feature 002 composes the result. |

## Released API constraint

Visual implementation consumes the released Almanac operations in
[../research.md](../research.md). Hiding effect-only actions for supported fixed rewards or merging
modifiers in the screen would violate the accepted spec and constitution.

## Acceptance

Feature 002 is visually accepted only when it remains recognizably consistent with the workspace and
mobile hierarchy of canvases 1c/1d **and** every adaptation above is present. Pixel similarity cannot
override package truth, feature boundaries, localization, accessibility or lossless behavior.
