# Research: Hull Anatomy and Hardpoint Geometry

Research used the accepted specification, constitution, feature 001/002/003/005/007/011/012
artifacts, `.design/Ship Builder.dc.html`, installed
`@elite-dangerous-almanac/core@0.1.0-beta.12`, current upstream issues and direct audits of every
installed package asset. No application geometry or game value was introduced.

## Installed assets and upstream contract

**Decision**: Treat the installed package as the sole source of ship artwork, but block
implementation until [Almanac #308](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/308)
lands in a release. That issue requests a public/tested asset path, annotation, duplicate and safe
inline-content contract. After upgrading, rerun the full asset audit before consuming it.

**Rationale**: Beta.12's README publishes
`assets/ships/<symbol>/schematic-{top,bottom}.svg`, but no installed documentation or type defines
`data-feature`, `data-journal-slot`, coverage, duplicate semantics or safe inline content. Feature
010 must use those annotations and is constitutionally prohibited from making their current spelling
an application-owned promise. The issue includes a minimal reproduction and requested contract.

**Alternatives considered**: Depending on undocumented markup, maintaining a private manifest,
reading drawing order/ids/labels and measuring geometry were rejected. Each would turn package
presentation details into application game data.

## Package coverage audit

**Decision**: Pin the current observations as upgrade-validation evidence, not as a substitute for
#308's public contract:

- `SHIPS` contains 48 hulls and the package has exactly 48 matching asset directories;
- every directory has `illustration.svg`, `schematic-top.svg` and `schematic-bottom.svg`;
- all 96 schematics use a `1200 × 800` view box;
- 240 hardpoint occurrences resolve to all 234 package hardpoint slots;
- the six extra occurrences are cross-side repeats: Federal Corvette `MediumHardpoint1/2` and Lynx
  Highliner `MediumHardpoint1`–`4`;
- no side repeats one hardpoint and no hardpoint annotation is unresolved;
- the current documents contain only `svg`, `g`, `path` and `circle`, with no active or external
  content.

**Rationale**: The audit supplies fixtures and proves there is no current bad-key or missing-asset
defect to report. It does not guarantee a future package shape.

**Alternatives considered**: Sampling one hull was rejected because irregular slot names and
cross-side repeats are catalogue-wide concerns. Treating current counts as durable app constants was
rejected because the next package may add a hull.

## Utility annotations and the corrected specification fact

**Decision**: Resolve every annotated key against the active hull's package slots, then admit an
occurrence only when both the released annotation contract identifies it as a hardpoint and the
resolved slot has `kind === 'hardpoint'`. Package utility geometry remains noninteractive artwork;
feature 002's complete ledger remains the route to utility and internal slots. The spec's stale claim
that utility positions are absent was corrected without changing FR-002 behavior.

**Rationale**: Beta.12 contains 195 utility occurrences, covering every package utility slot, in 81
of 96 side files. `TinyHardpointN` is the game's utility key vocabulary, so classifying by name would
be exactly the prohibited inference. FR-002 already limits interactive mounts to resolved
hardpoints.

**Alternatives considered**: Interacting with utilities was rejected as out of accepted scope.
Ignoring `data-feature` or treating every journal key as a weapon was rejected because it would admit
all utility markers.

## Same-origin delivery, caching and recovery

**Decision**: Extend feature 001's shared artwork path. Angular's asset pipeline copies only the
installed `**/schematic-*.svg` files from
`node_modules/@elite-dangerous-almanac/core/assets/ships` to
`assets/ships/<symbol>/schematic-{top,bottom}.svg`. Feature 001's single Angular service worker adds
that path to a versioned lazy/lazy asset group. The asset coordinator loads top and bottom
concurrently, keeps their states independent, aborts stale hull requests and retries an active failed
side explicitly or once when connectivity returns.

**Rationale**: The two schematics total about 8.8 MB across the current catalogue, and the largest
hull pair is about 634 KB. Lazy per-hull delivery preserves first load. The generated service-worker
manifest versions cache entries with the application/package release and makes an already opened
view available offline. The complete ledger remains independent of every fetch.

**Alternatives considered**: Committing generated SVGs to `public/`, bundling them as JavaScript,
prefetching all 96 files, a second/manual cache and a CDN/package-origin request were rejected as
stale copies, initial-load cost, competing cache ownership or cross-origin traffic.

## Safe SVG boundary

**Decision**: Fetch only a URL built from an already resolved package `Ship.symbol`, relative to the
application base and verified same-origin. Parse successful SVG responses as XML into a strict typed
inert tree, then render that tree through Angular SVG templates. Reject malformed XML, a wrong SVG
root namespace, doctypes, foreign elements, active/resource-bearing content, event/style/href
attributes, URL paint and anything outside the released #308 allowlist. Validate then discard
contracted non-rendering editor namespace metadata rather than inserting it. Never insert raw
markup, attach a foreign SVG document or call a trusted-markup bypass.

**Rationale**: Interaction requires inline geometry, so `<img>` cannot satisfy the feature. A typed
tree makes the accepted content testable and keeps Angular's DOM security boundary intact. Invalid
content becomes an unavailable side plus structured package-defect evidence; it is not silently
sanitized into a different asset.

**Alternatives considered**: `<object>`/`iframe`, raw `innerHTML`, generalized sanitizer output and
direct DOM insertion were rejected because they create active-document or unsafe-markup boundaries.
`<img>` was rejected because its internal annotations cannot be operated.

## Identity, duplicates and stable text order

**Decision**: Create one canonical hardpoint item for every `ShipLoadout.slots('hardpoint')` entry,
keyed only by the package slot key. Each top/bottom occurrence references that item and owns no
fitted or selection state. Present the complete unique text equivalent immediately in package
hardpoint-slot order; geometry membership is pending, located, temporarily unavailable or a package
defect and never filters the list.

**Rationale**: One slot can legitimately appear on both schematics, while an offline uncached asset
cannot prove that a slot lacks geometry. A one-to-many occurrence model keeps every instance
synchronized and a zero-occurrence location state preserves every text route honestly. Package slot
order is stable semantic order; drawing order is not.

**Alternatives considered**: Side-plus-index identity, element id, drawing order, a consumer sort and
duplicated occurrence state were rejected because they can split one build slot or depend on artwork
implementation.

## Fitted, engineering and current power state

**Decision**: Project exact slot size and fitted state from `LoadoutSlot`; module identity,
engineering presence and game text from its package module view and Almanac i18n helpers. Consume
feature 005's revision-matched `HardpointPowerObservationPort` for effective priority and current
disabled/inactive/powered/shed/qualified state under feature 003's deployed/retracted condition.
Preserve every unavailable member.

Implementation waits on [Almanac #299](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/299)
and a released per-module power projection. The existing issue's beta.12 reproduction still yields a
known 1.5 MW aggregate contribution while the fitted module's effective stats are unresolved and no
public consumer entry names that contribution.

**Rationale**: Raw `module.on` and zero-based `priority` may be absent, and aggregate band state alone
does not expose the package's effective per-module defaults/classification. Feature 005 already owns
that package-facing concern; anatomy should display its shared result, not create a second power
calculation.

**Alternatives considered**: Reading raw modifiers, joining effective stats, applying enabled or
priority defaults, subtracting aggregates and labeling raw switch state as supplied power were
rejected as incomplete or application-owned power logic. A duplicate issue was not filed because
#299 covers the dependency.

## Geometry rendering and target size

**Decision**: Render every package path/circle unchanged from the validated tree. For a valid
hardpoint occurrence, render an interaction clone from the exact same path/circle data with a
transparent tokenized non-scaling hit stroke equal to the shared 44 CSS-pixel target baseline. Add
semantic button state/name to the occurrence group and keep the unique HTML hardpoint list as the
separate, touch-sized text route. Test every current marker directly and every nearby case through
both representations.

**Rationale**: A non-scaling clone enlarges screen-space hit area without moving, measuring or
recording a coordinate. The text route makes all targets independently operable even when enlarged
hit regions meet and is required independently by FR-005/SC-003.

**Alternatives considered**: Hand-positioned badges, `getBBox()` centers, canvas hit maps, moving
package geometry and tiny visual-only markers were rejected. They invent geometry or fail target and
text-equivalence requirements.

## Selection, side reveal and panning

**Decision**: Reuse feature 002's exact `selectedSlotKey`; anatomy owns no second focus identity.
Geometry/list activation delegates `openSlot(slotKey)` to feature 002. When feature 002 selects a
located slot, keep the currently shown side if it contains the slot; otherwise choose top, then
bottom. Mark every duplicate occurrence selected. Use native bounded scrolling and the rendered
occurrence's `scrollIntoView` without coordinate reads; use smooth scrolling only when reduced motion
allows it.

**Rationale**: This defines deterministic two-way movement and keeps selection synchronized across
wide paired and narrow single-side compositions. Native scrolling supplies touch, pointer and browser
assistive behavior without a custom transform. The complete list means panning is never the only
route.

**Alternatives considered**: Persisting side/focus in a build or URL, a second anatomy selection,
custom drag/zoom matrices and always switching to top were rejected as duplicate state, geometry
math or surprising loss of current context.

## Localization, provenance and reference adaptation

**Decision**: Use feature 011 for every owned label, state, announcement and numeric formatter;
module names come from Almanac helpers with canonical fallback disclosure. Add a same-origin action
to feature 012's artwork/data provenance and Frontier media notice. Feature 010 copies no legal prose
and sends no build data to an external issue URL.

Retain the reference's paired wide views, labelled top/bottom selection, legend, selected detail and
synchronized ledger relationship. Reject its hard-coded coordinates, fabricated utility
interaction, invented node numbers, mock power values, cross-origin art, hover dependence and power/
drive/defence/offence overlays owned by other capabilities.

**Rationale**: Legal artifacts belong to the installed package and feature 012, and all visual
language belongs to feature 011. The reference is a hierarchy source, not a game-data source.

**Alternatives considered**: Duplicating notice text, translating legal prose, copying the mock and
embedding an issue URL with hull/build parameters were rejected as stale, misleading or privacy/
source-of-truth violations.

## Validation and performance

**Decision**: Gate upgrades with an installed-package/output contract test; unit-test parsing,
projection, duplicates, races and failure/retry; run primary journeys and axe over every meaningful
state in Chromium and Firefox at desktop, tablet/mobile portrait and landscape. Validate the real
Angular service worker against a production build. At 200% text and 400% zoom, require zero document
horizontal overflow and keep panning inside each schematic container. Cached selection publication
must meet the shared 100 ms mobile baseline.

**Rationale**: Development request interception cannot prove generated service-worker caching, and
axe cannot prove the text/geometry relationship. Package-wide and manual screen-reader checks are
both necessary.

**Alternatives considered**: Sampling assets, testing Chromium only, mocking the worker as the only
offline proof, visual snapshots and axe-only accessibility were rejected as incomplete.

## Dependency conclusion

No bad-key or missing-asset Almanac defect exists in beta.12. Two unresolved dependencies remain:

1. newly filed Almanac #308 for the public/tested schematic annotation and inline-content contract;
2. existing Almanac #299 for authoritative per-module power presentation.

Both are implementation gates. All planning unknowns are resolved.
