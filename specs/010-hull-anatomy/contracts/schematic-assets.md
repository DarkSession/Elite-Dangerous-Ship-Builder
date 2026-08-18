# Schematic Asset Contract

## Build-time source and output

The build copies only installed package files matching:

```text
node_modules/@elite-dangerous-almanac/core/assets/ships/**/schematic-*.svg
```

into:

```text
assets/ships/<package-symbol>/schematic-top.svg
assets/ships/<package-symbol>/schematic-bottom.svg
```

`angular.json` uses a workspace-relative asset glob rooted at the top-level pnpm package symlink.
Generated files are never checked into `public/` or edited. A package upgrade replaces build output
through the normal clean build and service-worker manifest version.

Almanac 0.1.1 satisfies [#308](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/308).
Its installed README and package tests govern accepted paths and markup.

## URL construction and fetch

1. Accept only the exact `symbol` of the already resolved active package hull.
2. Construct the side URL relative to the application base; route/user text is never interpolated.
3. Require the resolved URL origin to equal the application origin and its path to remain under the
   configured ship-asset prefix.
4. Refuse redirects and require a successful response with SVG content.
5. Guard completion by request id, hull symbol and active build revision.

Top and bottom requests are concurrent and independent. A side success publishes without waiting
for the other; a side failure changes no slot/build state.

## Inert parsing boundary

The parser follows the released #308 safe-content contract. At minimum it rejects:

- malformed XML, doctypes, a wrong SVG root namespace or foreign elements;
- scripts, links, images, objects, embedded documents and foreign content;
- event, `style`, `href`/`xlink:href` and URL-bearing attributes/paint;
- any element or attribute outside the explicit released allowlist.

Contracted non-rendering editor namespace declarations/attributes are validated and omitted from the
render tree; current package Inkscape metadata is an example. It returns a typed
`ValidatedSchematic`, never a markup string or foreign document. Raw HTML/SVG insertion,
`[innerHTML]`, trusted-markup bypasses and `<object>`/`iframe` are prohibited. Unexpected rendering
content rejects the whole side and creates a structured `PackageAssetDefect`; the application does
not silently sanitize package art into a different document.

## Annotation admission

For each annotation defined by #308:

1. take the source journal key exactly as supplied;
2. resolve the exact key against the active `ShipLoadout.slots()` collection;
3. require the annotation feature and resolved package kind to both be `hardpoint`;
4. preserve the canonical `LoadoutSlot.key` in the occurrence;
5. group every repeated occurrence according to the released duplicate semantics under the same
   canonical slot identity, regardless of side.

Unknown keys and wrong kinds are omitted from interaction, recorded as package defects and never
guessed. A duplicate that violates the released contract is a `contractMismatch`; all ambiguous
occurrences for that key are omitted rather than choosing one by drawing order. Utility annotations
remain inert artwork.

## Cache and recovery

Feature 001's single Angular service worker owns a versioned lazy/lazy asset group for schematics.
No second worker or direct Cache Storage implementation is added.

- A successfully opened schematic is expected to remain available offline for that application
  version.
- An uncached/offline or HTTP-failed side is presented as temporarily unavailable.
- The user can retry explicitly.
- The shared coordinator retries each active failed side once on the browser's `online` event.
- Stale requests and retries cannot replace a newer hull's state.
- Parsed data is retained only for the active hull; browser/service-worker caches own durable bytes.

## Release verification

An installed-package contract test run by `pnpm run check` must, for every current `SHIPS` symbol:

- locate both side assets under the released convention;
- validate the released safe schema;
- resolve every admitted annotation to the same hull's package hardpoint;
- ensure every package hardpoint has at least one admitted occurrence;
- verify every repeated key follows the released duplicate semantics and groups to one slot item;
- prove utility/non-hardpoint annotations are excluded.

A generated-output test must verify exact relative copy paths. A production static-server Playwright
scenario must install the real service worker, open a hull online, reload offline and obtain both
previously opened sides. Development-server interception alone is not accepted as cache proof.
