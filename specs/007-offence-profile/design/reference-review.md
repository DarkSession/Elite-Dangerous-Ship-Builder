# Visual Reference Review

## Source and authority

The relevant content is `.design/Ship Builder.dc.html` canvas 1c (wide outfitting Offence Analysis)
and canvas 1d (390 px mobile Offence mode). The file is a composition reference only. The accepted
spec, constitution, package results and repository design system override its sample values,
interactions, calculations and inline CSS.

## What canvas 1c actually shows

Selecting Offence in the central outfitting panel replaces anatomy with:

1. a two-column region;
2. a Weapons card with mounted count, prominent burst/sustained figures and five inert summary rows
   containing name/engineering text, DPS, piercing and falloff;
3. a Damage Profile card containing a kinetic/thermal percentage bar, four locally calculated
   damage-at-range rows and three normalized capacitor rows;
4. a full-width Shot Convergence region with locally maintained mount geometry and a draggable target
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

| Observed reference idea                            | Planned adaptation                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Offence is a first-class build-workspace mode      | Keep one `offenceProfile` capability inside `/build`; feature 003 owns selection.                       |
| Burst/sustained output leads wide analysis         | Retain prominence with correct labels and every exact package total.                                    |
| Name, DPS, piercing and range are adjacent in 1c   | Keep a scannable summary, then add all required details, state and an exact-slot action.                |
| Damage and capacitor facts share the right region  | Keep neighboring semantic groups where room permits; use complete text and no calculated scale.         |
| Canvas 1d uses vertical cards                      | Use vertical-card direction only; preserve full content parity rather than its omissions/additions.     |
| Persistent outfitting context can reach hardpoints | Add the spec-required direct action on every returned weapon and retain the narrow selected-slot layer. |

Direct offence-row navigation, row-owned disclosures, complete narrow weapon data, shared WEP
context, distributor observation, semantic error/empty states, tablet behavior, announcements and
RTL/zoom support are required extensions. They are not claimed as behavior already present in the
mock.

## Rejected calculations and data

- Kinetic/thermal percentages and stacked widths locally calculate shares and omit explosive,
  absolute, optional unclassified and anti-xeno semantics.
- Four DPS-by-range rows aggregate local falloff calculations, explicitly outside feature scope.
- Shot convergence maintains mount names/coordinates and calculates impact points, spans, spread and
  widest mount. The entire region is out of scope.
- “VS 45% resist,” “VS shield,” “VS hull,” target range, alpha and corrosion bonus are target or
  unreturned aggregate simulations.
- Capacitor bars normalize unrelated values locally. Feature 007 shows the six package fields as
  semantic facts.
- Desktop labels capacitor draw/recharge as MW while the accepted result fields are MJ/s. Package
  units win.
- The wide weapon list omits exact slot/symbol/enabled/ammunition, most metrics, both complete damage
  splits, optional states and direct actions.
- The mobile canvas omits the weapon list and most capacitor fields; no data may be dropped for a
  narrow viewport.
- Every sample value is non-authoritative. In particular, desktop calls 248.6 burst and 186.4
  sustained, while mobile calls 248.6 sustained and separately reports 318.4 burst.

## Interaction and implementation departures

- Inert offence rows become semantic summaries with distinct detail and exact-slot controls.
- Canvas div-tabs, drag surfaces, tiny controls, hover titles and color/bar-only meanings are not
  copied. Feature 011 components supply role, name, state, text equivalence and target sizing.
- Whole-pip blocks shown in the reference's separate Power mode do not define Offence input. Feature
  003's accepted shared half-pip control and exact returned WEP value do.
- Fixed 1560 px/390 px layouts are reference snapshots, not breakpoints. Tablet portrait/landscape,
  mobile landscape, 200% text and actual 400% zoom use fluid/container-driven composition.
- Hard-coded English, `en-US` formatting, inline visual literals, local fonts/assets and third-party
  runtime resources are not copied. Feature 011 messages, formatters, tokens and same-origin assets
  define implementation.

## Missing reference states

Neither canvas defines no build, pending, failure, no weapons, unresolved occupied hardpoint, all
disabled, genuine zero, unclassified absent/present, missing range/piercing, projectile boundary zero,
no/finite/zero-reserve/unlimited ammunition, zero capacity, finite/immediate/infinite endurance,
distributor power observations, expanded language, RTL, reduced motion or screen-reader behavior.
The feature design and
[component-state-preview-matrix.md](./component-state-preview-matrix.md) supply them before task
generation.

## Source-of-truth conclusion

Accept the wide information hierarchy, first-class workspace placement, scannable weapon adjacency
and narrow vertical-card direction. Reject the canvases as numeric, responsive, interaction or
accessibility contracts. Repository tokens/components and exact Almanac results remain authoritative.
