# Design Reference Review: Hull Anatomy

`.design/Ship Builder.dc.html` canvases 1c and 1d establish a useful dense desktop anatomy area and
a compact mobile transformation. They are composition references only; their mock DOM, data and CSS
are not implementation inputs.

## Adopted hierarchy

- Hull Anatomy stays inside the active build workspace beside the complete outfitting ledger.
- Wide layouts can compare top and bottom while sharing one selected-slot detail.
- Narrow layouts use a clearly labelled top/bottom selector and retain the full hardpoint list.
- A concise legend explains visible state supplements.
- Selecting geometry and selecting a ledger item are synchronized.
- Selected facts stay close to geometry without becoming a second editor.
- Internal overflow may contain a larger schematic without creating page-level horizontal scroll.

## Required corrections

| Reference detail                                    | Planned correction                                                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Percentage/absolute node coordinates                | Remove. Geometry and target clones come only from package SVG paths/circles; no coordinates are measured or stored.               |
| Authored numeric hardpoint/node badges              | Remove. Exact package journal slot keys are identity; any short visual label remains derived text, never a map.                   |
| Utility nodes presented as anatomy hardpoints       | Remove from interaction. Current package utility geometry stays inert under FR-002; feature 002 ledger remains the route.         |
| Hard-coded Anaconda technical image paths           | Replace with exact active package symbol and installed `schematic-top/bottom.svg` build assets.                                   |
| Mock fitted, engineering, priority and power values | Replace with one revision-coherent package/feature 005 projection, preserving unavailable and qualified states.                   |
| Visual-only selected/empty/utility distinctions     | Add complete associated text/programmatic state and a unique package-ordered text equivalent.                                     |
| Small markers and hover titles                      | Add exact-geometry non-scaling hit clones, visible matching names and independent 44-pixel list controls; hover remains optional. |
| Mount/power/drives/defence/offence anatomy modes    | Keep feature 010 only as hardpoint anatomy. Other capability results remain in their owning feature surfaces.                     |
| Unbounded desktop canvas                            | Use fluid regions and bounded native schematic scrolling; stack at narrow/zoomed sizes with no document overflow.                 |
| Inline colors, type, spacing and motion             | Replace every application-owned visual value with feature 011 tokens and reduced-motion behavior.                                 |
| Hard-coded English labels                           | Resolve through feature 011; package game names use Almanac localization/fallback disclosure.                                     |
| No loading/offline/schema failure states            | Add independent side loading/unavailable/retry/defect states while preserving lists/editing.                                      |
| No artwork terms route                              | Add feature 012's same-origin installed-package provenance/legal target.                                                          |

## Package fact correction

The reference draws utilities, and beta.12's real SVGs also annotate all 195 package utility slots.
The original feature-spec prose saying the package carries no utility positions was therefore stale
and has been corrected. This does not expand scope: FR-002 explicitly admits only resolved
hardpoints, so utilities remain noninteractive artwork and complete-ledger entries.

## Accessibility and semantics absent from the mock

- One workspace `main`/`h1`; anatomy uses nested headings and named side regions.
- Typed SVG has an image description; every interactive occurrence exposes button and selected/
  detail relationships.
- One canonical semantic list supplies every hardpoint and complete state exactly once.
- Side availability, package defects and current viewing condition are text and announced once.
- Touch, pointer, screen reader, 200% text, 400% zoom, portrait/landscape and RTL expansion are
  explicit preview/test states.
- Automated axe coverage and manual screen-reader journeys run across Chromium and Firefox.

The result retains the reference's compact technical-instrument character while removing every
mock-only game assertion and inaccessible interaction.
