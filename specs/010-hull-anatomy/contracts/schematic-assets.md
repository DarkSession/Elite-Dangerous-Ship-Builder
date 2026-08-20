# Schematic Asset Contract

## Source and output paths

The only accepted source is the installed package:

```text
node_modules/@elite-dangerous-almanac/core/assets/ships/<symbol>/schematic-top.svg
node_modules/@elite-dangerous-almanac/core/assets/ships/<symbol>/schematic-bottom.svg
```

`<symbol>` is an exact resolved Almanac `Ship.symbol`. `angular.json` copies the installed schematic
glob unchanged to:

```text
assets/ships/<symbol>/schematic-top.svg
assets/ships/<symbol>/schematic-bottom.svg
```

No generated/package SVG is committed in `public/`, imported into JavaScript, renamed per hull or
fetched from a package/CDN origin.

## Build-time audit

The installed-package audit fails before application build when any catalogued hull:

- has no matching asset directory or either schematic;
- resolves outside the package asset root;
- has malformed XML or a root other than SVG in the SVG namespace;
- violates the released `svg/g/path/circle` static-content guarantee;
- carries an event, script/style, link/reference, media/foreign element or CSS URL;
- has a `hardpoint`/`utility_mount` annotation without `data-journal-slot`;
- has a journal key absent from the exact hull slot catalogue or resolving to the wrong kind;
- repeats a key on one side; or
- omits a package hardpoint or utility across both sides.

The generated-output audit repeats path, file-count and content-hash comparisons against the
installed input. It does not pin catalogue or occurrence counts as product constants; the audit
derives its expectations from the installed package.

## Runtime request boundary

The loader receives only a resolved hull symbol and side. It:

1. chooses the fixed side filename;
2. URI-encodes the symbol as one path segment;
3. resolves the relative asset URL against the application base;
4. verifies the resolved origin equals the document origin; and
5. fetches with ordinary same-origin credentials/referrer policy and an abort signal tied to the
   hull request.

No user string, slot key, build name, module identity or URL parameter forms an asset path.

## Independent lifecycle and recovery

Top and bottom start concurrently after an active build is available. Each publishes loading,
ready, temporary-unavailable or contract-defect independently. A ready side renders without waiting
for its peer. A failed side never hides selected facts, the unique located-mount list, feature 002's
complete ledger or editing.

On active hull change, abort pending requests and discard any completion whose hull/request identity
no longer matches. An offline/network/HTTP failure is temporary and offers retry; retry also occurs
once after the browser reports connectivity for the still-active side. Malformed/unsafe package
content is a contract defect and is not retried continuously within the same app/package version.

## Parsing and rendering

A successful response is parsed as XML and validated before live rendering. The parser emits only
typed root/group/path/circle records and validated static presentation fields. It rejects rather than
silently sanitizes a contract violation. Inkscape/editor metadata not needed to render or identify a
mount is discarded.

Angular templates render the typed tree. Prohibited sinks include raw `innerHTML`,
`bypassSecurityTrustHtml`, direct unvalidated DOM insertion, `<object>`, `<iframe>` and a second
active SVG document. Application interaction/state markup is added by the renderer and uses design
tokens only; source geometry remains unchanged.

## Cache and offline behavior

Feature 001 extends feature 011's sole Angular service-worker configuration with the copied
schematic path as a versioned lazy asset group. Feature 011 retains the only registration and cache
ownership; no separate Cache API owner exists. An already opened side remains available offline
after the worker has cached it. An uncached offline side reports temporary unavailability and loads
after connectivity returns without a page reload.

Production validation uses the built static output and real generated service-worker manifest.
Development request interception is not accepted as the only offline proof.

## Verification

- Audit every installed hull and both sides for path, schema, annotation key/kind, duplicates and
  complete hardpoint/utility coverage.
- Verify copied output bytes/hashes match installed files and no generated SVG is tracked in source.
- Unit-test URL construction, same-origin refusal, parsing, abort/stale completion and side-local
  retry.
- Test malformed XML, doctype, every disallowed element/attribute/reference and contract-valid
  static presentation attributes.
- Production-test cached reload, uncached-offline fallback and automatic online recovery.
