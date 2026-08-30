# Schematic Asset Contract

## Source and output paths

The only accepted source is the installed package:

```text
node_modules/@elite-dangerous-almanac/core/assets/ships/<symbol>/schematic-top.svg
node_modules/@elite-dangerous-almanac/core/assets/ships/<symbol>/schematic-bottom.svg
```

`<symbol>` is an exact resolved Almanac `Ship.symbol`. Two reproduction scripts read those files and
write, per hull and side, the pair a plate actually needs:

```text
public/assets/ships/<symbol>/schematic-top.png     scripts/convert-ship-artwork.mjs
public/assets/ships/<symbol>/schematic-top.json    scripts/extract-schematic-mounts.mts
public/assets/ships/<symbol>/schematic-bottom.png
public/assets/ships/<symbol>/schematic-bottom.json
```

The package SVG is never served, never fetched and never committed — not in `public/`, not in
`src/`, not imported into JavaScript, not renamed per hull and not loaded from a package or CDN
origin. Nothing else may produce these files: each extract records the SHA-256 of the SVG it was
made from, and `pnpm run policy` fails when an extract is missing, unreadable, or made from a
different file than the one the pinned package now installs.

The extract is:

```json
{
  "symbol": "<symbol>",
  "side": "top" | "bottom",
  "viewBox": "<the package's own viewBox>",
  "source": "<sha256 of the source SVG>",
  "content": { "x": 0, "y": 0, "width": 0, "height": 0 },
  "mounts": [{ "feature": "hardpoint", "slot": "<data-journal-slot>", "x": 0, "y": 0 }]
}
```

`content` is the rectangle the file draws in, grown by half its widest stroke; each mount's `x`/`y`
is the middle of what that annotation draws. Both are arithmetic over the package's published
coordinates, in the package's own `viewBox` space, so the picture and the marks over it share one
coordinate system by construction.

## Feature highlights in the raster

The package fills nine categories of feature, each in the hue its own `data-feature-color` names:
`hardpoint`, `utility_mount`, `canopy`, `engine`, `thruster`, `heat_vent`, `landing_gear`,
`cargo_hatch` and `fighter_bay`. The hull's line art is the last layer in the file, so it is drawn
over those fills.

The raster keeps three of them: `hardpoint`, `utility_mount` and `canopy`. Every other category is
drawn with its fill removed, so its shapes stay in the picture as the outlines the package strokes
them with. The plate is a map of the mounts a Commander can fit, and the canopy says which end of
the hull is the front. An engine bell or a landing-gear bay answers no question the plate asks, and
a filled one competes with the marks drawn over it.

A side draws only the categories its own view has, so a plate keeps whichever of the three its side
carries. The canopy is drawn on every top view and on no bottom view.

The suppression belongs to the rendering and to nothing else. It is applied while the PNG is drawn,
it moves no coordinate, and `scripts/extract-schematic-mounts.mts` reads the package's own file, so
the marks and the geometry under them are unchanged.

## Build-time audit

The extractor runs the application's own parser, so a file the parser refuses is a file that never
becomes an extract: extraction fails, naming the hull and side. It refuses a file that:

- resolves outside the package asset root;
- has malformed XML or a root other than SVG in the SVG namespace;
- violates the released `svg/g/path/circle` static-content guarantee;
- carries an event, script/style, link/reference, media/foreign element or CSS URL;
- draws with any path command but absolute `M`, `L` and `Z`; or
- carries a `hardpoint` or `utility_mount` annotation without `data-journal-slot` — the one
  malformation nothing downstream could catch, because it would be read as artwork and the extract
  would be written without that mount.

Three further conditions are about the _hull_, not the file, so no parser can see them. They are
checked by `src/app/domain/anatomy/almanac-anatomy-contract.spec.ts` over every catalogued hull and
both sides, and fail `pnpm run test`: a matching asset directory and both schematics for every hull;
no journal key absent from the exact hull slot catalogue or resolving to the wrong kind, and none
repeated on one side; and no package hardpoint or utility omitted across both sides.

The generated-output audit compares each committed extract's recorded source digest against the
SHA-256 of the file the installed package now provides, and fails on a missing, stale or unreadable
extract or on any tracked package SVG under `public/` or `src/`. It does not pin catalogue or
occurrence counts as product constants; the audit derives its expectations from the installed
package.

## Runtime request boundary

The loader receives only a resolved hull symbol and side. "Resolved" means the package's own
`Ship.symbol`, which is what the asset directories are named — not whatever string the build's source
spelled the hull with. A journal `Loadout` event, and every SLEF export made from one, names the hull
in lower case; the shared ingress gate resolves that to the package's symbol before the build is
activated (`specs/002-module-outfitting/contracts/outfitting-editor.md`, "Mandatory ingress
normalization"), so this feature reads `shipSymbol` and asks for nothing further.

The loader then:

1. chooses the fixed side filename;
2. URI-encodes the symbol as one path segment;
3. resolves the relative asset URL against the application base — relative by construction, so it
   carries no host and no scheme and cannot resolve anywhere but this origin; and
4. fetches with ordinary same-origin credentials and referrer policy, on the abort signal tied to
   the hull request. A retry carries the same signal, so it is cancelled by a hull change too.

No user string, slot key, build name, module identity or URL parameter forms an asset path.

## Independent lifecycle and recovery

Top and bottom start concurrently after an active build is available. Each publishes loading,
ready, temporary-unavailable or contract-defect independently. A ready side renders without waiting
for its peer. A failed side never hides its peer, feature 002's complete ledger or editing.

On active hull change, abort pending requests and discard any completion whose hull/request identity
no longer matches. An offline/network/HTTP failure is temporary and offers retry; retry also occurs
once after the browser reports connectivity for the still-active side. Malformed/unsafe package
content is a contract defect and is not retried continuously within the same app/package version.

## Parsing and rendering

The package contract is parsed at build time, not in the browser. `schematic-svg-parser.ts` emits
only typed root/group/path/circle records and validated static presentation fields, and rejects
rather than silently sanitizes a contract violation; Inkscape and editor metadata not needed to
render or identify a mount is discarded. What remains at runtime is the narrower question of whether
a deployment served this build's own extract: the JSON is validated field by field — the declared
symbol and side must be the ones asked for, the `viewBox` must be four numbers, the content
rectangle must have a positive extent, and every mount must carry a word-shaped feature and slot
with finite coordinates. A single bad mount refuses the whole file rather than being dropped, because
a plate missing one mount looks exactly like a hull that has none there.

The hull is drawn as one `image` at the package's own `viewBox` inside the same turned group the
marks are placed from. Prohibited sinks include raw `innerHTML`, `bypassSecurityTrustHtml`, direct
unvalidated DOM insertion, `<object>`, `<iframe>` and an active SVG document from the network.
Application interaction and state markup is added by the renderer and uses design tokens only;
source geometry remains unchanged.

## Cache and offline behavior

`ngsw-config.json` is unchanged by this feature. Feature 001's existing ship-asset group already
caches `/assets/ships/**` lazily, which is where both of a side's files are written, so a second
pattern would be a second overlapping group for files the first one already holds. Feature 011
retains the only registration and cache ownership; no separate Cache API owner exists. An already opened side remains available offline
after the worker has cached it. An uncached offline side reports temporary unavailability and loads
after connectivity returns without a page reload.

Production validation uses the built static output and real generated service-worker manifest.
Development request interception is not accepted as the only offline proof.

## Verification

- Audit every installed hull and both sides for path, schema, annotation key/kind, duplicates and
  complete hardpoint/utility coverage.
- Verify every extract's recorded digest matches the installed file and no package SVG is tracked in
  source.
- Unit-test URL construction — that the path is relative, encodes the symbol as one segment and can
  name no host — extract validation, abort and stale completion, and side-local retry.
- Test a body that is not JSON, an extract for another hull or side, and a malformed mount, against
  the build-time tests for malformed XML, doctype, every disallowed element/attribute/reference and
  contract-valid static presentation attributes.
- Production-test cached reload, uncached-offline fallback and automatic online recovery.
