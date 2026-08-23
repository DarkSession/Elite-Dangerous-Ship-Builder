# Research: Hull Anatomy and Mount Geometry

Research used the accepted specification, constitution, current repository, feature
001/002/003/005/011/012 artifacts, `.design/Ship Builder.dc.html`, and the installed
`@elite-dangerous-almanac/core`. All package observations below are regression evidence, not
application-owned game data.

## Installed schematic contract

**Decision**: Consume the installed Almanac package's published asset and annotation contract for both hardpoints and
utility mounts. Read `assets/ships/<Ship.symbol>/schematic-{top,bottom}.svg` from the installed
package at build time; admit only a group with `data-feature="hardpoint"` or
`data-feature="utility_mount"` whose exact `data-journal-slot` resolves to the matching active-hull
package slot kind.

**Rationale**: The package README explicitly promises exact journal-compatible keys for both mount
kinds, complete top/bottom coverage, at most one occurrence per side and cross-side repetitions as
views of one game slot. It explicitly excludes ids, model sockets, coordinates, colours and drawing
order from the identity contract.

**Alternatives considered**: SVG ids/labels, `data-model-socket`, element or slot position, key-prefix
classification, node numbers, coordinate maps and private manifests were rejected because they are
unstable presentation details or application-owned game data.

## Package-wide coverage evidence

**Decision**: Add an installed-package regression audit over every hull and both sides, without
encoding the current counts as runtime constants.

The audit derives its expected hulls, sides and mount identities from the installed package. It
requires a matching asset directory and both side schematics for every hull, complete representation
of every hardpoint and utility, and no missing, bad-key, wrong-kind or same-side duplicate
annotations. Cross-side repeats are treated as multiple views of one package slot and do not become
application-owned exceptions.

**Rationale**: Catalogue-wide checking catches irregular exact keys, wrong-kind joins and duplicate
semantics that a sampled hull misses. It also proves the clarified utility scope has no direct
Almanac geometry gap.

**Alternatives considered**: Sampling Anaconda or assuming every key is globally unique were
rejected. Current counts are not product limits and must not reject a future package release.

## Same-origin delivery, caching and recovery

**Decision**: Extend feature 001's shared package-artwork boundary. Two reproduction scripts read
the installed `**/schematic-top.svg` and `**/schematic-bottom.svg` and write into
`public/assets/ships/<symbol>/`: `scripts/convert-ship-artwork.mjs` rasterises each side to a PNG,
and `scripts/extract-schematic-mounts.mts` writes the few hundred bytes a plate reads — the
package's own `viewBox`, the rectangle the file draws in, and the middle of every annotated mount —
as a JSON extract carrying the digest of the SVG it came from. The package SVG itself is never
served and never fetched. The loader constructs a relative URL from an already resolved exact hull
symbol — relative, so it can only resolve against the document's own base, with no host, no scheme
and no user string in it — loads top and bottom independently, aborts stale hull requests and
retries a failed active side on explicit intent or once after connectivity returns. Feature 001's
asset boundary extends feature 011's single versioned service-worker configuration with the lazy
ship-schematic asset group; feature 011 retains registration and cache ownership.

**Rationale**: The full schematic set is too large to charge to first load. Per-side loading renders
available artwork promptly and keeps an opened side available offline while the complete ledger
works regardless of either response.

**Rationale (extract over SVG)**: A plate needs a picture and a set of coordinates. Ninety kilobytes
of sub-pixel path data per side delivers both, but a fixed-ratio plate then re-rasterises all of it
on every resize, and the parse that guards the package contract runs in the Commander's browser
rather than in this repository's build. Splitting it moves both costs to the build: the extractor
runs the application's own parser, so the promise being checked and the geometry being written
cannot drift, and refuses by name any file the parser rejects. `pnpm run policy` recomputes each
extract's recorded digest against the installed SVG, so a package upgrade that moves the geometry
fails the build rather than shipping stale coordinates.

**Alternatives considered**: Serving the package SVG itself, committing copied SVGs to `public/`,
importing them into JavaScript, prefetching the full catalogue, adding a second/manual cache, or
fetching a package/CDN origin were rejected as delivery cost, stale duplication, initial-load cost,
competing cache ownership or prohibited network traffic. Hand-writing the extracted coordinates was
rejected as exactly the private geometry catalogue FR-009 forbids.

## Safe SVG boundary

**Decision**: Verify the package's released safe-inline contract _at build time_, in the extractor.
Parse each installed file as XML into a typed inert `svg/g/path/circle` tree, and refuse — by hull
and side, failing the build — malformed XML, a wrong root or namespace, a doctype, an element
outside the allowlist, a script or style, an event, a link or reference, a media or foreign element,
a CSS `url()` value, and any path command but `M`, `L` and `Z`. Nothing of that tree is served: what
ships is a rendering and the mount extract taken from it.

At run time the question is narrower and different in kind — not whether the package kept its
promise, but whether this deployment served this build's own extract. The JSON is validated field by
field, and one malformed mount refuses the whole document rather than being dropped, because a plate
missing one mount looks exactly like a hull that has none there. No package markup reaches the DOM
at all, so `innerHTML`, a trusted-markup bypass, `<object>`, `<iframe>` and a foreign active
document are all moot as well as forbidden.

**Rationale**: The package guarantees exactly those four static element kinds for unmodified files,
and checking that in the browser meant parsing ninety kilobytes per side to keep a few hundred bytes
of it. Moving the check to the build makes package drift a failed build rather than a side-local
defect a Commander meets, and leaves the runtime a smaller surface to defend.

**Alternatives considered**: Parsing the SVG in the browser was the original decision and is what
this replaced — it put the whole contract check on every Commander. Rasterising alone, without the
extract, cannot expose annotations, which is what an interactive mount needs; generalized
sanitization can silently change artwork; raw markup and active document embedding expand the
security boundary beyond the package promise.

## Canonical mount projection and ordering

**Decision**: Build one `MountItem` from every `ShipLoadout.slots()` entry whose package kind is
`hardpoint` or `utility`, in returned outfitting order. Resolve annotation keys to those canonical
items and attach at most one occurrence per side. An occurrence owns only side/render data and
references canonical state; it never owns fitted, engineering, selection or power state.

**Rationale**: Package slot snapshots already provide exact key, kind, size and fitted module. A
single slot may legitimately occur on both sides. One-to-many references keep both drawings
synchronized from one place and give feature 002's ledger a stable package-owned order to agree
with.

**Alternatives considered**: Side/index identity, SVG traversal order, ids, consumer sorting and
duplicated occurrence state can split one build slot or depend on artwork implementation.

## Fitted and engineering state

**Decision**: Consume feature 002's immutable exact-slot view over the same loadout revision. Preserve
empty and package-resolved fitted states. Module identity remains `FittedModule.symbol`; names
use Almanac i18n helpers through feature 011. Engineering presence comes from the package fitted
article/feature 002 projection and is never inferred from icon, module family or modifiers.

For display, hardpoint class is the package size. Utility size `0` is the package's documented
not-size-based placeholder and is presented as a localized “not class-sized” state, not fabricated as
class zero or another size.

**Rationale**: The exact slot snapshot is already feature 002's editing truth. Reusing it avoids a
second module/engineering interpretation; package ingress has already removed unknown identities.

**Alternatives considered**: Looking up unknown symbols, parsing module names, presenting utility
class zero or copying the mock's size/node badges were rejected as invented meaning.

## Current priority and power state

**Decision, superseded**: This capability projects no priority and no power. Both canvases put them
behind the strip's `POWER` segment, which reads the same plates and belongs to feature 005; the
`MOUNTS` mode draws kind, fitted state, engineering and selection, which is what the canvas's own
legend explains (design/hull-anatomy.md, "Divergence from FR-005 and the legend"). The segment ships
disabled rather than opening an empty panel.

**Rationale**: `ShipLoadout.powerBudget().consumers` already includes utility consumers and owns
post-engineering draw, enabled defaults, effective priority and deployment classification, so there
is no Almanac gap behind this — only an owner. Reading it here would be this capability publishing a
verdict feature 005 exists to own, and doing it twice.

**Alternatives considered**: Raw optional `FittedModule.on`/zero-based `priority`, symbol parsing,
modifier inspection, a local consumer/band join, aggregate subtraction and labelling raw switch state
as current power were rejected as duplicate or incomplete power logic.

## Text equivalent and complete ledger

**Decision, superseded**: Feature 002's complete ledger _is_ the text equivalent. It already lists
every hardpoint and utility in package order with kind, key, size, fitted and engineering state, it
is on screen beside the plates at every width, and it is the route to every slot including the
internal ones no schematic draws. A second list of the same mounts, immediately beside it, would be
two lists of one thing — and this capability's own second answer to which mounts the hull has
(design/hull-anatomy.md, "Divergence from FR-004 and SC-003").

Each mark on a plate carries its complete state as its accessible name instead, so nothing the
treatment shows is left to the treatment.

**Rationale**: Geometry alone cannot provide stable reading order or independently operable targets,
and an uncached side cannot prove a slot has no location — which is exactly why the answer is the
ledger that does not depend on either.

**Alternatives considered**: Using SVG drawing order as reading order, hiding items until load,
duplicating cross-side entries or relying only on hover/title text were rejected.

## Geometry state and target size

**Decision, superseded**: The canvas does not tint the hull's own shapes. It sets a small numbered
box over the hull at each mount's position, and that box is the control — so the package's shapes
stay inert in the artwork and no clone of them is drawn. The box is positioned from the annotation's
own centre, as a percentage of the turned frame, in the four treatments the canvas draws and the
legend explains.

The boxes are the canvas's size, which is below the 44-pixel baseline. They take SC 2.5.8's
Equivalent exception through feature 002's ledger beside them, which offers the same mounts at full
size, and the axe harness is configured to read them that way (design/hull-anatomy.md, "Divergence
from FR-012").

**Rationale**: A numbered box needs no shape clone, no measurement and no `getBBox`: the position is
the extract's, and the mark is a button drawn on top of it. Text and programmatic state supplement
colour.

**Alternatives considered**: Percentage badges, `getBBox()` centres, canvas hit maps, shifted nodes,
tiny visual markers and hover-only expansion were rejected as invented geometry or inaccessible
interaction.

## Selection, side reveal and panning

**Decision**: Reuse feature 002's single `selectedSlotKey`; activating a mark calls the same
`select(slotKey)` a ledger row does. A selected located ledger slot retains the currently displayed
narrow side when that side contains it; otherwise reveal top, then bottom. Wide layouts show both
ready sides. Mark every occurrence for the selected key.

Nothing pans, and nothing is scrolled into view: each plate takes the hull's own proportions and the
drawing fits itself into the frame, so the whole side is always in view at every width. There is no
bounded overflow to move and no `scrollIntoView` call.

**Rationale**: One identity gives geometry, ledger and editor atomic selection. The deterministic
side rule avoids surprising switches and requires no coordinate read or transform model. A plate that
always fits removes panning as a requirement rather than making it accessible.

**Alternatives considered**: A second anatomy selection, persistent side state, custom drag/zoom
matrices, coordinate reads and always forcing top were rejected as duplicate state or geometry math.

## Reference adaptation

**Decision**: Retain canvas 1c's paired wide schematics, ledger relationship and legend, plus canvas
1d's single-side selector. Keep feature 010 limited to mounts; the other mock modes and the full
module/engineering bench remain in their owning features. Canvas 1d's anatomy-before-ledger order is
the one part not retained — the workspace grid's source order is its wide left-to-right order, and
re-ordering it belongs to feature 002's composition (design/hull-anatomy.md, "Narrow, mobile and
zoomed").

The mock's alleged utility nodes are especially non-authoritative: it relabels numbered weapon
hardpoints as utilities and classifies mobile nodes with `Number(hp) > 6`. Production utility
identity comes only from Almanac `utility_mount` plus a resolved package `utility` slot.

**Rationale**: The design is a hierarchy reference, not a geometry, data or CSS source. The accepted
layout remains recognizable while the package, design system and accessibility contracts remain
authoritative.

**Alternatives considered**: Copying the fixed canvases, Anaconda technical SVGs, Google Fonts,
coordinates, node numbers, mock values or cross-capability overlays was rejected.

## Localization, provenance and feedback

**Decision**: Resolve all owned labels, state text, announcements and number/unit formatting through
feature 011. Almanac slot/module names come from feature 002's already-resolved slot views, so the
plate and the ledger row say one word rather than two. Neither canvas draws a provenance control on
the anatomy, so none is published and no external navigation is introduced here.

**Rationale**: Feature 011 owns language and feature 012 owns provenance content and where the
application offers it. A control this capability drew for it would be a surface the design does not
have (design/hull-anatomy.md, "Divergence from FR-011").

**Alternatives considered**: Feature-local translations/legal prose, raw package ids as fallback, a
hard-coded `/help` route and parameterized issue URLs were rejected as stale ownership or privacy
violations.

## Validation and performance

**Decision**: Gate package upgrades with exhaustive installed-input and generated-output audits;
unit-test parser/projector/duplicates/kind mismatch/races/retry; and run primary two-way journeys,
fallbacks and axe over all five layouts in Chromium and Firefox. Validate real production service-
worker behavior, actual 400% browser zoom and screen-reader relationships. Measure cached projection
publication against the shared 100 ms mobile/4x-CPU baseline.

**Rationale**: Request interception cannot prove output copying or service-worker caching. Axe cannot
prove geometry/list identity, duplicate synchronization or understandable reading order. Both
automated and manual evidence are required.

**Alternatives considered**: Asset sampling, Chromium-only tests, development-only offline mocks,
visual snapshots and axe-only accessibility were rejected as incomplete.

## Dependency conclusion

**Decision**: Mark the direct Almanac geometry/power-data gate PASS. Implementation depends on
features 001, 002 and 011, all of which shipped; features 003, 005 and 012 gate only the modes and
surfaces this capability does not build, and their segments ship disabled rather than blocking it.

**Rationale**: The installed Almanac package includes the schematic and per-consumer power
contracts. Exact-slot editing, the shared design system and localization are in place; owner-authored
power presentation and provenance are not, and are left to their owners.

**Alternatives considered**: Reimplementing editing, power, localization, cache or legal behavior
inside feature 010 would violate ownership and source-of-truth principles.

All planning unknowns are resolved. The remaining items are explicit delivery dependencies, not
clarification questions.
