# Research: Hull Anatomy and Mount Geometry

Research used the accepted specification, constitution, current repository, feature
001/002/003/005/011/012 artifacts, `.design/Ship Builder.dc.html`, and the installed
`@elite-dangerous-almanac/core@0.1.1`. All package observations below are regression evidence, not
application-owned game data.

## Installed schematic contract

**Decision**: Consume Almanac 0.1.1's published asset and annotation contract for both hardpoints and
utility mounts. Load `assets/ships/<Ship.symbol>/schematic-{top,bottom}.svg`; admit only a group with
`data-feature="hardpoint"` or `data-feature="utility_mount"` whose exact `data-journal-slot` resolves
to the matching active-hull package slot kind.

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

Current 0.1.1 observations:

| Evidence                                                        |                     Result |
| --------------------------------------------------------------- | -------------------------: |
| Package hulls / matching asset directories                      |                    48 / 48 |
| Side schematics                                                 |                         96 |
| Schematic bytes                                                 | 9,026,731 (about 8.61 MiB) |
| Unique hardpoints / occurrences                                 |                  234 / 240 |
| Unique utilities / occurrences                                  |                  195 / 195 |
| Missing, bad-key, wrong-kind or same-side duplicate annotations |                          0 |

The six intentional cross-side repeats are `MediumHardpoint1/2` on `Federation_Corvette` and
`MediumHardpoint1`–`4` on `MediumTransport01`. No utility currently repeats, but the contract allows
future utilities to do so.

**Rationale**: Catalogue-wide checking catches irregular exact keys, wrong-kind joins and duplicate
semantics that a sampled hull misses. It also proves the clarified utility scope has no direct
Almanac geometry gap.

**Alternatives considered**: Sampling Anaconda or assuming every key is globally unique were
rejected. Current counts are not product limits and must not reject a future package release.

## Same-origin delivery, caching and recovery

**Decision**: Extend feature 001's shared package-artwork boundary. `angular.json` copies only the
installed `**/schematic-top.svg` and `**/schematic-bottom.svg` files into
`assets/ships/<symbol>/`. The loader constructs a relative URL from an already resolved exact hull
symbol, verifies same origin, loads top and bottom independently, aborts stale hull requests and
retries a failed active side on explicit intent or once after connectivity returns. Feature 001's
single versioned service worker owns lazy response caching.

**Rationale**: The full schematic set is too large to charge to first load. Per-side loading renders
available artwork promptly and keeps an opened side available offline while the complete ledger
works regardless of either response.

**Alternatives considered**: Committing copied SVGs to `public/`, importing them into JavaScript,
prefetching the full catalogue, adding a second/manual cache, or fetching a package/CDN origin were
rejected as stale duplication, initial-load cost, competing cache ownership or prohibited network
traffic.

## Safe SVG boundary

**Decision**: Parse a successful response as XML, verify the package's released safe-inline contract,
and convert it into a typed inert `svg/g/path/circle` tree rendered by Angular SVG templates. Reject
malformed XML, a wrong root/namespace, doctypes, elements outside the allowlist, scripts/styles,
events, links/references, media/foreign elements and CSS `url()` values. Never use `innerHTML`, a
trusted-markup bypass, `<object>`, `<iframe>` or a foreign active document.

**Rationale**: The package guarantees exactly those four static element kinds for unmodified files.
Inline geometry is required for interaction, while typed rendering keeps package drift and unsafe
content outside the live DOM. A schema mismatch becomes a side-local package defect; it never
removes the complete slot route.

**Alternatives considered**: `<img>` cannot expose annotations; generalized sanitization can silently
change artwork; raw markup and active document embedding expand the security boundary beyond the
package promise.

## Canonical mount projection and ordering

**Decision**: Build one `MountItem` from every `ShipLoadout.slots()` entry whose package kind is
`hardpoint` or `utility`, in returned outfitting order. Resolve annotation keys to those canonical
items and attach at most one occurrence per side. An occurrence owns only side/render data and
references canonical state; it never owns fitted, engineering, selection or power state.

**Rationale**: Package slot snapshots already provide exact key, kind, size and fitted module. A
single slot may legitimately occur on both sides. One-to-many references keep both drawings and the
unique text item synchronized and give the text equivalent a stable package-owned order.

**Alternatives considered**: Side/index identity, SVG traversal order, ids, consumer sorting and
duplicated occurrence state can split one build slot or depend on artwork implementation.

## Fitted and engineering state

**Decision**: Consume feature 002's immutable exact-slot view over the same loadout revision. Preserve
empty, resolved and unresolved fitted states. Module identity remains `FittedModule.symbol`; names
use Almanac i18n helpers through feature 011. Engineering presence comes from the package fitted
article/feature 002 projection and is never inferred from icon, module family or modifiers.

For display, hardpoint class is the package size. Utility size `0` is the package's documented
not-size-based placeholder and is presented as a localized “not class-sized” state, not fabricated as
class zero or another size.

**Rationale**: The exact slot snapshot is already feature 002's editing truth. Reusing it avoids a
second module/engineering interpretation and preserves unresolved identities and unavailable text.

**Alternatives considered**: Looking up unresolved symbols, parsing module names, presenting utility
class zero or copying the mock's size/node badges were rejected as invented meaning.

## Current priority and power state

**Decision**: Require feature 005 to generalize its hardpoint observation port into a located-mount
port accepting exact hardpoint and utility keys. Consume its build/condition-revision-stamped result
unchanged: not applicable, disabled, inactive while retracted, powered, priority-shed or qualified,
with normalized one-based priority or unavailable.

**Rationale**: `ShipLoadout.powerBudget().consumers` already includes utility consumers and owns
post-engineering draw, enabled defaults, effective priority and deployment classification. Matching
package bands owns the current supplied/shed verdict. Direct probes confirm both always-powered and
deployed-only utility consumers. Feature 005 is the application owner of that interpretation.

**Alternatives considered**: Raw optional `FittedModule.on`/zero-based `priority`, symbol parsing,
modifier inspection, a local consumer/band join, aggregate subtraction and labelling raw switch state
as current power were rejected as duplicate or incomplete power logic.

## Text equivalent and complete ledger

**Decision**: Present one semantic located-mount item for every package hardpoint and utility in the
same package order, regardless of asset readiness. Each item contains kind, exact key, size, fitted/
empty/unresolved, engineered/stock, selection, priority, current power and top/bottom/both/pending/
unavailable/defect location text. Feature 002's separate complete ledger remains the route to every
slot and the editor; activating either route uses the same exact selected key.

**Rationale**: Geometry alone cannot provide stable reading order or independently operable targets,
and an uncached side cannot prove a slot has no location. The unique list collapses legitimate
cross-side repeats while the complete ledger covers internal and unlocated/defective slots.

**Alternatives considered**: Using SVG drawing order as reading order, hiding items until load,
duplicating cross-side entries or relying only on hover/title text were rejected.

## Geometry state and target size

**Decision**: Render package path/circle geometry unchanged. Each admitted occurrence receives a
state class driven by its canonical item and an interaction clone of the same package shape using a
tokenized transparent non-scaling hit stroke sized to feature 011's 44 CSS-pixel baseline. The
unique HTML list provides an independent 44-pixel action for every mount, including nearby or
overlapping geometry.

**Rationale**: Exact-shape clones enlarge the screen-space target without measuring, moving or
recording geometry. Text, icon/pattern and programmatic state supplement colour. Independent list
actions keep every mount separately operable when enlarged SVG hit regions overlap.

**Alternatives considered**: Percentage badges, `getBBox()` centres, canvas hit maps, shifted nodes,
tiny visual markers and hover-only expansion were rejected as invented geometry or inaccessible
interaction.

## Selection, side reveal and panning

**Decision**: Reuse feature 002's single `selectedSlotKey`. Geometry or unique-list activation emits
`openSlot(slotKey)`. A selected located ledger slot retains the currently displayed narrow side when
that side contains it; otherwise reveal top, then bottom. Wide layouts show both ready sides. Mark
every occurrence for the selected key. Use bounded native overflow and nearest `scrollIntoView`;
smooth motion is optional and disabled under reduced motion.

**Rationale**: One identity gives geometry, text, ledger and editor atomic selection. The deterministic
side rule avoids surprising switches and requires no coordinate read or transform model. Native pan
supports touch, pointer and assistive tools; text/ledger routes ensure it is never mandatory.

**Alternatives considered**: A second anatomy selection, persistent side state, custom drag/zoom
matrices, coordinate reads and always forcing top were rejected as duplicate state or geometry math.

## Reference adaptation

**Decision**: Retain canvas 1c's paired wide schematics, ledger relationship, legend and selected
context, plus canvas 1d's single-side selector and anatomy-before-ledger compact order. Keep feature
010 limited to mounts; other mock modes and the full module/engineering bench remain in their owning
features.

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
feature 011. Almanac slot/module names use package leaf helpers with canonical fallback or unavailable
disclosure. Anatomy exposes a contextual intent to feature 012's accepted in-place help/provenance
modal. Any package-defect external navigation is deliberate, identified as leaving the app and
contains no hull, slot, build or local data.

**Rationale**: Feature 011 owns language and feature 012 owns legal/provenance content. Feature 012's
accepted artifacts define one shared in-place modal, so feature 010 only emits its contextual intent.

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

**Decision**: Mark the direct Almanac geometry/power-data gate PASS and complete implementation
blocked on features 001, 002, 003, 005, 011 and 012. The required feature 005 utility-port
generalization is project contract work, not an upstream defect.

**Rationale**: Almanac issues #308 (schematic contract) and #299 (per-consumer power projection) are
released in 0.1.1. Exact-slot editing, owner-authored power presentation, strict/shared UI and modal
provenance boundaries are not implemented, and their owners retain unresolved gates.

**Alternatives considered**: Reimplementing editing, power, localization, cache or legal behavior
inside feature 010 would violate ownership and source-of-truth principles.

All planning unknowns are resolved. The remaining items are explicit delivery dependencies, not
clarification questions.
