# Visual Reference Review

## Source and authority

The relevant content is `.design/Ship Builder.dc.html` canvas 1c (wide outfitting Offence Analysis)
and canvas 1d (390 px mobile Offence mode). [canvas-contract.md](./canvas-contract.md) is the
verbatim extraction and the template; this document is the reasoning behind it. The constitution and
the package results override the canvas's sample values, calculations and inline CSS — never its
choice of what is on the screen.

## What canvas 1c actually shows

Selecting Offence in the central outfitting panel replaces anatomy with:

1. a two-column region;
2. a Weapons card with mounted count, prominent burst/sustained figures and five inert summary rows
   containing name/engineering text, DPS, piercing and falloff;
3. a Damage Profile card containing a kinetic/thermal stacked bar with percentages, four
   damage-at-range rows and three capacitor rows, each with a bar;
4. a full-width Shot Convergence region with a gunsight plate, mount geometry and a draggable target
   range.

The persistent left outfitting ledger remains available, but the offence weapon rows themselves have
no direct slot action or details disclosure.

## What canvas 1d actually shows

The separate mobile composition stacks:

1. sustained DPS, a kinetic/thermal bar and four damage-at-range rows;
2. convergence geometry, a touch/pointer target-range control and four calculated spread facts;
3. target-resistance damage rows for alpha, burst, shield and hull, followed by abbreviated capacitor
   and corrosion facts;
4. the generic compact outfitting ledger and selected-slot actions below the mode content.

It omits the wide canvas's weapon summary and full capacitor region, while adding target/convergence
calculations. It is not canvas 1c merely stacked.

## Adopted direction

| Observed reference idea                           | Planned adaptation                                                                                   |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Offence is a mode of the anatomy strip            | Enable the `OFFENCE` segment feature 010 left disabled; the region retitles and the plates give way. |
| Burst/sustained output leads wide analysis        | Retain prominence with correct labels and every exact package total.                                 |
| Name, DPS, piercing and range are adjacent in 1c  | Keep the four columns and keep the row inert, as the canvas draws it.                                |
| Damage and capacitor facts share the right region | Keep neighbouring semantic groups where room permits; bar what shares a scale, state everything.     |
| The stacked bar and its percentages               | Build both: the shares are one package amount over another, and both are written in the legend.      |
| The four damage-at-range rows                     | Build them from the package's own `damageFalloff()` at the canvas's own four distances.              |
| The Shot Convergence region                       | Build it from the package's published hardpoint offsets and its own projection at range.             |
| Canvas 1d uses vertical cards                     | Use vertical-card direction only; preserve full content parity rather than its omissions/additions.  |
| The status rail's `DPS` cell                      | One rail cell carrying sustained damage per second, with the canvas's bare label and no unit.        |

The WEP condition the figures were read at, the shot sentences beside the gunsight plate, and the
semantic empty, disabled, absent, unavailable-gunsight and infinity states are required extensions.
They are not claimed as behaviour already present in the mock. No distributor power observation is
among them: no canvas draws one beside the capacitor, and a zero capacity is stated as the package's
own result with no cause attached.

Direct offence-row navigation and row-owned disclosures were once on this list. They are withdrawn
([canvas-contract.md](./canvas-contract.md), review note 5): the canvas draws the rows inert, and two
invented controls on every row is a larger departure than the omission they were meant to cure.

## The scope error this review previously recorded

Three of the four regions above were rejected here on 2026-08-24 as local calculations outside
feature scope: the stacked bar's shares, the four damage-at-range rows and the whole Shot Convergence
region. That rejection was wrong, and it is the reason the first implementation shipped a third of
the canvas.

The package publishes `damageFalloff()` — the per-weapon multiplier at a distance — and
`ships/gunsights` — every player-flyable hull's hardpoint offsets from the cockpit, with
`projectGunsight()` to place them at a range. Neither region needed a local calculation, and neither
needed inventing. The shares are one package amount over another, with both stated on the same
screen, which is the form feature 006 already established for a bar fill.

The record is kept rather than deleted, because a rejection that reads as reasoned is exactly the
kind that survives review.

## Rejected calculations and data

- “VS 45% resist,” “VS shield,” “VS hull,” alpha and the corrosion bonus are target or unreturned
  aggregate simulations. The package returns no result against a target, and the canvas states no
  target model.
- A bar where its figures share no scale. `CAPACITY` in megajoules and `FULL FIRE` in seconds keep
  their figures and lose their tracks; `DRAW` and `RECHARGE` are both MJ/s and keep theirs. The four
  capacitor fields are capacity from canvas 1d's `WEP CAP 61 MJ`, and draw, recharge and time to
  drain from canvas 1c's three rows. `netDrainRate` and the returned allocation are drawn by neither
  canvas and are therefore not read at all, which is the rule feature 005 set for `headroom`,
  `utilisation` and `withinBudget`.
- Desktop labels capacitor draw/recharge as MW while the accepted result fields are MJ/s. Package
  units win.
- The bar's hover-only `title` tooltips, unreachable by touch. The legend beside the bar carries both
  figures instead.
- The mobile canvas omits the weapon list and most capacitor fields; no data may be dropped for a
  narrow viewport.
- Every sample value is non-authoritative. In particular, desktop calls 248.6 burst and 186.4
  sustained, while mobile calls 248.6 sustained and separately reports 318.4 burst.

## Interaction and implementation departures

- Inert offence rows stay inert. The mount control is in `HULL ANATOMY`, where the canvas puts it.
- The canvas's draggable range track becomes a native range input at feature 011's target size,
  announcing the distance in words.
- The gunsight plate is hidden from assistive technology and every shot it draws is stated as a
  sentence beside it. A diagram is not a reading.
- Canvas div-tabs, drag surfaces, tiny controls, hover titles and colour/bar-only meanings are not
  copied. Feature 011 components supply role, name, state, text equivalence and target sizing.
- The pip control belongs to the reference's `POWER` mode and stays there. Offence reads the
  allocation feature 005's shared conditions hold and offers no control over it. The one control this
  panel owns is the convergence target range, which is the one the canvas draws in it.
- Fixed 1560 px/390 px layouts are reference snapshots, not breakpoints. Tablet portrait/landscape,
  mobile landscape, 200% text and actual 400% zoom use fluid/container-driven composition.
- Hard-coded English, `en-US` formatting, inline visual literals, local fonts/assets and third-party
  runtime resources are not copied. Feature 011 messages, formatters, tokens and same-origin assets
  define implementation.

## Missing reference states

Neither canvas defines no build, pending, failure, no weapons, unavailable hardpoint coverage, all
disabled, genuine zero, unclassified absent/present, missing range/piercing, no conventional damage
at all, nothing landing at any range band, an unpublished hull gunsight, a shot outside the plate's
field of view, zero capacity, finite/immediate/infinite endurance, distributor power observations,
expanded language, RTL, reduced motion or screen-reader behaviour.
The feature design and
[component-state-preview-matrix.md](./component-state-preview-matrix.md) supply them before task
generation.

## Source-of-truth conclusion

Accept the wide information hierarchy, first-class workspace placement, scannable weapon adjacency
and narrow vertical-card direction. Reject the canvases as numeric, responsive, interaction or
accessibility contracts. Repository tokens/components and exact Almanac results remain authoritative.
