# Drives & Mass Reference Review

## Reference scope

Reviewed `.design/Ship Builder.dc.html`, canvases **1c** (wide outfitting, 1560px) and **1d**
(compact outfitting, 390px with an 844px minimum root height) — the two screens applicable to
features 002–010:

- canvas 1c's Drives tab, `data-anat-layer="mass"` and `data-anat-detail="mass"` (especially the
  paired Thruster Load and Frame Shift Drive cards); and
- canvas 1d's Drives tab, `data-m-mode="mass"`.

The reference is the template. Its information hierarchy, its readings and its labels are what is
built; the Almanac contracts, the constitution and the repository design system decide how each
reading is obtained and drawn, never whether it appears. Nothing user-facing is added that the
canvases do not draw, and nothing they draw is dropped for being inconvenient to source: a reading
the package cannot answer is raised against the library rather than cut.

Only the reference's authored sample numbers, inline styles, English strings, external assets and
`div`-as-control interactions are replaced — with package answers, feature 011 tokens and
components, localized messages and real semantic controls.

> **Revised.** An earlier version of this review resolved every gap between the canvases and the
> installed Almanac by deleting the canvas element. That inverted the precedence: the design is the
> template, so a reading the library does not publish is a library gap, not a design error. The
> departures table below is the corrected one, and the four gaps it named were raised upstream
> rather than cut — the library has since published all four.

## Adopted direction

- Keep the workspace mode label “Drives” and capability heading “Drives & Mass”.
- Keep Thruster Load and Frame Shift Drive as the two cards, side by side where the region has the
  width for them and stacked where it does not — one DOM at both widths, the arrangement chosen from
  the space the region is given rather than from the viewport, so 400% zoom selects the stacked one
  for the same reason a phone does.
- Keep source module identity beside the values it qualifies (`7A · DIRTY DRIVES G5`) — the
  class, rating and blueprint of the fitted module, at the far end of the card heading's own line.
- Keep the headline loaded mass, the hull/modules/fuel bar, the optimal and maximum curve marks and
  the three legend rows in the left card, in that order. The bar is additive as the canvas draws it:
  one band carrying the three parts laid end to end on a track that ends at the thrusters' maximum
  supported mass, with the optimal mass marked on the same track. Its two figures are written
  between the band and the legend, where the canvas sets them, each under the position it marks. The legend is the canvas's `Hull` /
  `Modules` / `Fuel`, each with the swatch of the part it explains and the qualifier the canvas sets
  beside it — `ANACONDA · MILITARY GRADE`, `22 FITTED`, `TANK`. There is no fourth
  group: the canvas draws no unladen mass and no cargo capacity.

  **Amended 2026-08-25.** The fuel row's qualifier was `TANK 32 T + RESERVE`; the canvas revision of
  that date cut it to `TANK` on both canvases. So `fuelCapacity` is no longer drawn anywhere, and by
  feature 005's rule — a package field no canvas draws is not read at all — it is no longer read
  either. It joins `unladenMass` and `cargoCapacity` as a real package figure this screen does not
  have. The row's own figure is unchanged: it is the fuel part of the one `buildMass(load)` answer
  the whole legend comes from, not a tank capacity.

- Keep the speed envelope's five readings, under the canvas's own `SPEED ENVELOPE AT THIS MASS` and
  nothing beside it.
- Keep the drive card's headline trio on its hairline ground — `JUMP LADEN`, `JUMP UNLADEN`,
  `MASS LOCK` — above `RANGE BY LOAD`, where the canvas draws it.
- Keep `RANGE BY LOAD` as three rows in the canvas's own label / bar / figure shape, each carrying
  the one figure the canvas puts on it: what this build jumps on that load. The load's name is all
  the canvas writes on the row, so it is all the row writes — an earlier pass glossed each name with
  what that load carries (`One jump of fuel, empty hold`), which is a line neither canvas draws. The
  three loads and what each carries are set out in `mobility-and-jump-profile.md` instead.
- Keep the legend under the ranges as the canvas draws it: FSD optimal mass, fuel per jump and
  `Total range` with the jumps that tank makes, in the same swatch / name / figure rows the mass
  legend takes — the canvas draws both legends the same way.
- Keep the hairlines the canvas rules its blocks off with: one in the thruster card, under the mass
  legend, and two in the drive card, under the headline trio and between the ranges and the legend.
- Keep the `JUMP`, `SPEED` and `MASS` cells of the status rail, closing the six-cell grid features
  006 and 007 open.
- Keep the `SCO` badge inside the drive card's heading, on its line, where the canvas puts it.
- Keep compact labelled value/unit rows and definition groups.

## Required departures

Only these. Each replaces _how_ a reading is produced or drawn, never whether the canvas's reading
appears.

| Reference element                                                      | Decision | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every authored sample number                                           | Replace  | Each is read from the installed Almanac for the active build; none is transcribed.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `1,142 t` labelled both “Hull Mass” and “Thruster Load”                | Relabel  | The canvas names one figure two ways. The card keeps the headline and the hull segment as the two separate readings they are.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| The headline's `t LADEN` qualifier                                     | Rename   | The canvas's own arithmetic decides this, not its wording: `1,142` is exactly the three rows drawn under it — `400` hull, `662` modules, `080` fuel — and there is no cargo row for a fourth part to appear in. That is a full main tank over an empty hold, which the package calls `unladen` and this card, following the canvas's `RANGE BY LOAD` vocabulary, calls `FUELLED`. Read at the package's `laden`, the headline would carry a hold the bar has nowhere to show: a stock Anaconda would head 1,210 t over rows summing to 1,096 t. |
| Saved-build deltas and arrows                                          | Remove   | Build comparison is another feature's, and the mock's figures are authored. Nothing on this screen compares to a saved build.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `CURRENT` as a fourth range row                                        | Remove   | Not the fuelled profile under another name, by the canvas's own arithmetic: canvas 1d sets `CURRENT` at `21.4 ly` beside `FUELLED 23.5`, and `21.4` is what canvas 1c heads `JUMP LADEN`. It is a jump at some arbitrary current fuel and cargo state, and this application carries no current-load viewing condition to read one at. The three loads the package publishes are the three it can state, and the card draws those three.                                                                                                         |
| `658 T OF HEADROOM` under the ranges                                   | Remove   | A comparison nothing publishes, and unlike the four gaps below it is not a reading — it restates two figures already on the card.                                                                                                                                                                                                                                                                                                                                                                                                               |
| The drive card's `JUMP LADEN` headline figure                          | Refill   | The trio itself is drawn as the canvas draws it. Its `21.4 LY` is not: canvas 1d puts that figure on a `CURRENT` row, and this application carries no current-load viewing condition to read one at. The cell is filled from the load it is named for — the package's `laden`, the fully loaded end of the `RANGE BY LOAD` list below it — so the card's head can never disagree with its own rows.                                                                                                                                             |
| Hover `title` disclosures and clickable `div` tabs                     | Replace  | Real semantic controls with visible names and states, reachable by touch and screen reader.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Bar widths as the reading                                              | Qualify  | Every bar is `aria-hidden` decoration with the package's own number beside it; no meaning rests on a length, a colour or a position.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Inline colours, fixed sizes, nowrap, English and external fonts/assets | Replace  | Feature 011 tokens, components and localization are the only implementation source.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| The `OPTIMAL` / `MAX` labels as absolutely positioned text             | Reflow   | Both stay under the positions they mark — the optimal centred on its own tick, the maximum against the end of the track — but they stay in the flow of one row rather than being pinned over it. Pinned, `Optimale Masse` meets `Max` inside this card at a doubled text size in German; in flow the row wraps and the maximum drops to a line of its own, and two readings painted over each other is the one failure a bar's own labels must not have.                                                                                        |
| A build heavier than its thrusters' maximum supported mass             | Clip     | The band fills and is clipped rather than rescaled to fit. Rescaling would move the optimal mark, and the mark's position on the scale is the reading; the exact tonnage is in the legend either way. A thruster publishing no curve has no scale at all, so the band and its two marks are absent rather than drawn against a maximum chosen here.                                                                                                                                                                                             |
| The heading above the mass block                                       | Unheaded | Canvas 1c has none and canvas 1d's is `HULL MASS` above the headline number, which the relabel above already resolves. The name is the list's accessible name and is never drawn.                                                                                                                                                                                                                                                                                                                                                               |

### Added to it

| Added element                                                  | Reason                                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Switched off`, on a mount the outfitting panel has turned off | Neither canvas has an off state to draw, and the readings a switched-off mount produces are not the ones beside it. Feature 005 records the same addition for the same reason (`specs/005-power-and-heat/design/reference-review.md`, "Added to it"). |

`Switched off` is the only one. Two further additions stood in this table and have since been taken
out, because an addition has to earn its place against the template every time it is read and
neither of these did:

| Withdrawn addition                                                 | Why it is gone                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The ENG allocation, in the speed envelope's heading                | The canvas heads the block `SPEED ENVELOPE AT THIS MASS` and puts nothing beside it. The argument for stating the pips — that the five readings are functions of an allocation set in another mode — is an argument about a control this screen does not own, and it was answered by adding words the template does not have. The heading is the canvas's now. |
| The fitted module's name, before its `7A · DIRTY DRIVES G5` rating | See "The identity line" below.                                                                                                                                                                                                                                                                                                                                 |

### The identity line

The canvas writes `7A · DIRTY DRIVES G5` at the end of the thruster card's heading line and
`6A · INCREASED RANGE G5` at the end of the drive's. Both are the class, rating and applied
blueprint of the fitted module — and neither repeats the module's name, because the heading beside
it (`THRUSTER LOAD`, `FRAME SHIFT DRIVE`) has already said what the card reads.

An earlier pass drew the name in front of the rating, reasoning that a rating alone does not identify
a module in general — Enhanced Performance Thrusters and standard ones are both rated `3A`. That is
true and it is still not this card's problem: the card reads whatever is fitted, and what a reader
needs from the line is the size and grade of it and the engineering applied to it, which is exactly
what the canvas writes. The module ledger feature 002 owns is where a module is named. So the line
is the canvas's three parts and nothing else, and it stays on the heading's own line rather than
dropping to one of its own.

### The one figure counted here

`22 FITTED` is not an addition — canvas 1c draws it. It is the one figure on either card that is not
copied whole: the package publishes the fitted rows rather than their number, so
`fittedModules().length` counts them. A count of what the package returned is not a game value
calculated from one, and it is a ruled exception recorded here rather than an unstated liberty. Every
other figure on both cards is a package answer copied as given.

## The four readings that were raised upstream

Four of the canvas's readings had no result in the version of
`@elite-dangerous-almanac/core` this feature started against. Each was raised against the library
(see the upstream issue accompanying this branch) rather than cut, because the design is the
template and a reading the library does not publish is a library gap. The library published all
four, and each is drawn in the place the canvas puts it, from the getter named below.

| Canvas reading                                       | How it is read now                                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headline loaded mass                                 | `buildMass(load).total`, at the load the speed envelope is read at. The total is read, never summed from the parts beside it.                                         |
| `Modules` segment of the hull/modules/fuel bar       | `buildMass(load).modules` — the mass counterpart of `buildCost()`'s `{ total, hull, modules }` split. The whole legend is one answer, so no segment is a local total. |
| `91% of optimal` position on the thruster mass curve | `MobilityMetrics.loadedMass` against the module's own `optMass`, which is the comparison the package's `thrusters` getter documents.                                  |
| `SCO` badge                                          | `OutfittingModule.supercruiseOvercharge` on the fitted drive record. Capability is still never inferred from a symbol.                                                |

`MASS LOCK` and the drive's fuel per jump were never in this table: the hull record publishes
`masslock` and the drive's `maxFuel` is its own post-engineering maximum-fuel parameter. Both are
package facts and both are drawn.

## Missing reference content restored by the plan

Both mocks are examples rather than exhaustive states. The wide mock as first drawn put no figure on
the reserve tank it named, and the revision of 2026-08-25 removed the naming too — the amendment
above records it; the narrow mock omits roll, both module identities, the `OPTIMAL` curve mark, the
total range with its jump count, mass lock and the `SCO` badge. It does draw `MAX 1,890 t`,
`OPT MASS 1,800 t` and `MAX FUEL 8.30 t`, so the drive's facts and the maximum mark are not among
what it leaves out.

Restoring is not the same as adding, and the test is narrow: each restored element is a reading the
wide canvas already establishes, drawn in the same place at the narrower width, or a figure it names
without a number. A reading neither canvas draws at all is **not** restored, whatever the
specification says — not an unladen mass, not a cargo capacity, and not the two mass-curve
multipliers `mobilityMetricsResult()` returns. On this feature the design is the template and the
specification is what gets corrected; FR-004 and FR-006 in [spec.md](../spec.md) carry those
corrections.

Neither mock can illustrate the unavailable state — the package's own reasons in place of the speed
envelope when it cannot say how the build moves, which FR-005 requires. That is a state rather than a
reading, so it is not the addition the table above records; it is what the screen does when a reading
the canvas draws cannot be obtained.

The narrow arrangement is the wide one stacked. There is no width at which a field is dropped.

[mobility-and-jump-profile.md](./mobility-and-jump-profile.md) sets out every field and state.
No anatomy artwork or other `.design` asset is needed for feature 008.
