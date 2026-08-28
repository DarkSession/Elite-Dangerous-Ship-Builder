# The SLEF interchange boundary

How a build gets in and out of this application, and what is deliberately not part of it.

SLEF is somebody else's format. Coriolis, EDSY and Inara write it, the game writes the journal
`Loadout` event it wraps, and the Almanac package owns every rule about both. This document is the
short version of where the boundary sits, so the next change lands on the right side of it.

## What comes in

One paste, and exactly one build.

- **64 KiB, measured in UTF-8 bytes of the original text.** The gate runs before anything else looks
  at the payload — before whitespace is considered and before the package is asked. A draft that is
  small in characters and large in bytes is refused for its size, because bytes are what the limit is
  about.
- **Exactly one entry.** A SLEF envelope, a one-element array and a bare journal `Loadout` event are
  all one entry. `[]` is zero, two entries are two, and a payload holding one valid entry beside one
  the package rejected is refused whole. Nothing picks index zero.
- **The exact string reaches the package.** No trim, no repair, no second parser, no heuristic
  decoding. `inspectSlef` is the only thing in the application that reads SLEF, and a thrown
  `SyntaxError` is classified without its prose being shown.

## What the package owns

Everything about the format and the game:

| Concern                                       | Package leaf         |
| --------------------------------------------- | -------------------- |
| Inspecting and validating a payload           | `ships/slef`         |
| Constructing, editing and serializing a build | `ships/ship-loadout` |
| Module identities and catalogue records       | `ships/modules`      |
| The words for a diagnostic                    | `i18n/diagnostics`   |

Those four leaves are the whole surface, enforced by `scripts/policy/slef-ownership.mjs`. There is no
broad barrel import, no local table of module symbols and no application-side calculation of a credit
figure, a mass or a jump range.

## The two normalizations, and nothing else

An accepted import is normalized in exactly two ways, both of them the package's:

1. **A supported partial engineering roll is completed to quality 1.** The application captures the
   source quality first; an unsupported partial refuses the whole import rather than arriving as
   something the Commander did not paste.
2. **Every fixed mount arrives populated.** `ShipLoadout.fromLoadout` fills a fixed mount the payload
   omitted or filled with something unusable. The application performs no second repair pass, keeps
   no "was defaulted" provenance, and exposes no empty-fixed-mount state.

What the package says about the result is reported where the workspace already reports it: feature
003's build-status rail. Feature 004 draws no report of its own.

### A stated recipe without its modifiers, and what is left of it

A journal `Loadout` event carries a `Modifiers` block beside each engineered module, and the package
reads its figures out of that block. Inara's SLEF writes none: it states `BlueprintName`, `Level` and
`Quality` and stops. Until Almanac 0.2.1 the package held that faithfully and published the
unengineered figure for every such module — an imported Anaconda read 19.36 Ly where the same build
in the game read 26.84.

**That was an Almanac defect and it was fixed in the Almanac**
([Elite-Dangerous-Almanac#371](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/371),
released in 0.2.1). The package now rolls the recipe at the grade and quality the block names, so the
module arrives carrying the package's own modifiers. An earlier revision of this work spelled the
modifiers out through the package instead, and was reverted: whether a stated recipe applies without
its modifier block, and what it does to each attribute, is game data, and a pass here would have been
correcting a package result. This paragraph is kept so that workaround is not reintroduced the next
time a figure looks low.

What is left is narrower and is not swept here either. Where the package can resolve neither a recipe
the module's menu offers nor a catalogued article carrying it, it reports `unresolvedEngineering` and
the module keeps its unengineered figures. Almanac 0.2.2 added two further entries beside it, each
reporting a _reading_ the import chose rather than a change it made: `ambiguousEngineering`, where the
menu offers the recipe and a catalogued article answers to it just as well — a pre-engineered SCO
drive is the case a Commander meets most often — carrying the article passed over so
`setPreEngineeredVariant` can take the other reading; and `rerolledEngineering`, where a stated
modifier block moved nothing the module has and the recipe beside it was rolled in its place. Nothing
in this application reads any of the three: such a module is either carrying a partial quality, in
which case the whole candidate is refused over the package's own `unsupported`, or it is not, in
which case there is no surface here that states it yet.

## Which hull the build is

A journal `Loadout` event writes `sidewinder` where the package carries `SideWinder`, and
`ShipLoadout` keeps whatever string it was handed. The ingress gate asks `getShipBySymbol` which
hull the source named and constructs on the symbol the package answers with.

That is identity resolution, not a third normalization. Nothing a Commander stated is replaced by
something they did not: the source's string is a _key_, the package's `Ship.symbol` is the
_identity_ it resolves to, and principle II requires the identity. A hull the package does not carry
is passed on exactly as it arrived, so the refusal is the package's own and names what was sent.

It matters because a hull symbol is also a directory name. `assets/ships/<symbol>/` holds the
artwork and the schematics feature 010 draws, and those directories are named the package's way — so
on a case-sensitive host a build carrying the source's spelling asks for files nothing serves.

No exported byte changes: the package's serializer writes the hull in journal case on the way back
out, whichever spelling the build holds. A stored record does — it writes the hull symbol twice, as
listing metadata and again inside the snapshot, and a record written before this is reconstructed on
the package's symbol when it is opened, so its next save stores that in both. A build link never
carried the source's spelling at all: the codec stores an index into a table of the package's own
symbols, so a decoded link has always named the hull the package's way.

## What goes out

One entry, generated by the package, in one call:

```ts
loadout.toSlefString({ moduleOrder: 'fitted', explicitPower: false, indent: 2, header });
```

- **Credits are current catalogue retail.** A captured purchase value is not application state; it is
  never read, retained, displayed or compared.
- **The header identifies this application**, from `package.json` at build time, never from a runtime
  request and never from a literal typed into a source file.
- **`appURL` appears only for a link certified for exactly this revision.** Absent, pending, refused
  and stale links are omitted, and the layer says which.
- **An invalid or incomplete build still exports**, with the package's verdict beside it.

## What is never modelled and never persisted

Capture-only journal state is outside the application's model entirely: `timestamp`, `ShipID`,
per-module `Health`, `Hot`, ammunition counts, engineer identity and historical purchase values. Their
presence or absence changes neither acceptance nor a single modelled field, which is what makes the
round trip stable. Post-engineering integrity is a property of the fitted article and comes from the
package's own results, never from a captured condition snapshot.

Nothing feature 004 holds outlives the session. A draft, a candidate in flight and a generated
payload are all session memory: an exchange left half-finished when the tab closed is not something to
restore. Feature 004 owns no storage key.

## Delivery, honestly

- **Copy** reports `copied` only after the Clipboard promise resolves, and never falls back to
  `document.execCommand`.
- **Download** reports that it was handed to the browser. Whether a file reached a disk is not
  observable, and claiming it did would be a fabricated success.
- **Share** is offered only where `navigator.share` is callable, prefers a `File` only where
  `canShare({ files })` agrees, and treats a dismissed sheet as a neutral cancellation.
- **Every failure keeps the payload on screen and selectable.** Selecting the text is the one way out
  that no permission, platform or failure can take away.

## Where the code is

| Layer                             | Path                                             |
| --------------------------------- | ------------------------------------------------ |
| Format-facing domain              | `src/app/domain/slef/`                           |
| Store, coordinators and presenter | `src/app/application/slef/`                      |
| The two surfaces                  | `src/app/features/slef/`                         |
| Producer identity                 | `src/app/platform/build/application-metadata.ts` |
| Delivery ports                    | `src/app/platform/browser/`                      |

Feature 001 owns the active build and the only path that replaces it; feature 002 owns the ingress
normalizer; feature 003 owns the verdict rail. All three arrows point one way, and
`scripts/policy/slef-ownership.mjs` fails the build if one is reversed.
