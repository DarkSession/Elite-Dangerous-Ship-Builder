# Drives & Mass Reference Review

## Reference scope

Reviewed `.design/Ship Builder.dc.html`, canvases **1c** (wide outfitting, 1560px) and **1d**
(compact outfitting, 390px with an 844px minimum root height) — the two screens applicable to
features 002–010:

- canvas 1c's Drives tab, `data-anat-layer="mass"` and `data-anat-detail="mass"` (especially the
  paired Thruster Load and Frame Shift Drive cards); and
- canvas 1d's Drives tab, `data-m-mode="mass"`.

The reference supplies information hierarchy only. The accepted specification, Almanac contracts,
constitution and repository design system override its sample values, labels, interactions and
inline styles.

## Adopted direction

- Keep the workspace mode label “Drives” and capability heading “Drives & Mass”.
- Keep mobility/thruster and jump/FSD as adjacent logical cards at wide widths.
- Keep source module identity beside the values/issues it qualifies.
- Put selected load and ENG-pip context before selected mobility values.
- Stack the same complete semantic content at narrow and zoomed widths.
- Prefer compact labelled value/unit rows and definition groups.

## Required departures

| Reference element                                                      | Decision                | Reason                                                                                                     |
| ---------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `1,142 t` labelled “Hull Mass” / “Thruster Load”                       | Replace                 | It is neither hull mass nor the required `unladenMassResult`; use exact package values with exact meaning. |
| Hull/modules/fuel stacked bar and `Modules 662`                        | Remove                  | The package exposes no feature-008 decomposition/subtotal contract; local summing is prohibited.           |
| “91% of optimal”, optimal marker and headroom                          | Remove                  | These are locally derived comparisons, not returned results.                                               |
| Speed/rotation/jump bar widths                                         | Remove                  | Their scales are arbitrary and cannot carry exact/accessibility meaning.                                   |
| Saved-build deltas/arrows                                              | Remove                  | Build comparison is outside scope and values are authored.                                                 |
| “Fuelled”, “Current”, “Full Cargo”                                     | Replace                 | Use exact maximum/unladen/laden identities; selected context never replaces one summary profile.           |
| `MASS LOCK`                                                            | Remove                  | Outside feature 008's accepted scope.                                                                      |
| `Fuel per jump`                                                        | Remove as a calculation | `maxFuel` may appear only as the returned FSD maximum-fuel parameter.                                      |
| `SCO` badge                                                            | Omit                    | No accepted requirement needs it; never infer capability from module name/symbol.                          |
| Mass-sized anatomy nodes and centre of mass                            | Remove                  | No package slot-coordinate/mass-placement result supports them; feature 010 remains hardpoint-only.        |
| Hover `title` disclosures and clickable `div` tabs                     | Replace                 | Use visible text and semantic tab/button relationships that work by touch and screen reader.               |
| Inline colours, fixed sizes, nowrap, English and external fonts/assets | Replace                 | Feature 011 tokens/components/localization are the only implementation source.                             |

## Missing reference content restored by the plan

The wide mock lacks both mobility multipliers, complete three-by-three jump results, aggregate
diagnostics and every module mass. The narrow mock additionally omits roll, ENG context, thruster
identity/issues/curve facts, true maximum/total/count jump results, FSD facts, all capacity results,
all diagnostics and the module list. Both are incomplete examples.

[mobility-and-jump-profile.md](./mobility-and-jump-profile.md) restores every required field and state
at every width. No anatomy artwork or other `.design` asset is needed for feature 008.
