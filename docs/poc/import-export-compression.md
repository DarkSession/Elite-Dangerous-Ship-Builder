# Import/export compression POC

## Outcome

A versioned binary representation of the minimal build model meets the build-link length targets
without compressing or reimplementing SLEF. SLEF still enters and leaves through
`@elite-dangerous-almanac/core`; the POC only serialises the non-derivable state between those two
operations.

The fixed reference corpus currently produces these complete URL lengths, using
`https://ships.example/` as the base URL:

| Reference build           | Base64URL payload (without `b.`)                                                                                       | Complete URL length | Target |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------: | -----: |
| Empty Sidewinder          | `AQAEAH19lP0`                                                                                                          |                  36 |   <100 |
| Stock Krait Mk II         | `ASABEacAHA`                                                                                                           |                  35 |   <300 |
| Full engineered Anaconda* | `ARL4_____wcIECBAQMCBQCAQCAQC_w9gAAEEBBBAAP9v37__7thojBqNjcZGY6ONbDQ22rEzdsbO2Bk7Y2fsjJ3P8zzP8zzZt2-zzWabjcj7uRkRAVol` |                 141 |  <=500 |

\* All 39 slots are occupied and all 29 engineerable modules are engineered.

The every-hull baseline corpus covers empty and stock configurations for all 48 catalogue hulls.
Its longest complete URL is 36 characters (the alphabetical tie-break reports the Adder).

Compact minimal JSON plus raw DEFLATE was rejected for this use case. In the initial experiment,
the same engineered Anaconda produced an encoded payload of about 1,167 characters before the base
URL was added.

## Format proved by the spike

- The fragment uses a table-independent `b.` prefix. The first field inside the decoded binary
  payload is the format version; the decoder reads it before selecting immutable version-specific
  rules and identifier tables.
- Hulls, modules, blueprints, experimental effects, and hull-specific slot keys are stored as
  indexes into immutable tables generated from `@elite-dangerous-almanac/core@0.1.0-beta.4` and
  committed with the decoder. Default modules discovered through `ShipLoadout.default()` are also
  pinned, including built-in modules not exposed by the package's public module catalogue.
- A one-bit pristine-default marker reduces an unchanged stock build to its ship identity. Other
  builds choose whichever is smaller: an absolute set of occupied slots, or changes relative to the
  hull's pinned default loadout.
- Occupied, changed, power-override, and engineered slot sets independently choose between a bitmap
  and a sparse list. Fitted modules do not repeat slot identities.
- Module identities use a hull-slot-specific candidate table when possible, with the global module
  table as a forward-safe fallback. Blueprints and experimental effects likewise use candidate sets
  specific to the fitted module, with global fallbacks.
- The remaining values form one continuous bitstream. Power state and priority are carried only for
  slots that differ from their defaults; dense power states detect uniform and fully defined value
  sets rather than spending five bits per module indiscriminately.
- Engineering presence is measured only across modules which can carry recipes, fixed variants, or
  decorative transformations. A blueprint's common maximum grade is implied from its pinned grade
  set, an absent experimental effect costs one bit, common quality `1` costs one bit, quality `0`
  costs two, and other qualities retain their exact 64-bit JavaScript number.
- Package-identified fixed pre-engineered variants and decorative modifications have their own
  contextual identities. Their hand-set modifiers are rebuilt with the Almanac resolver, preserving
  mechanically distinct modules without repeating calculated modifier arrays in the payload.
- No credit figure is encoded: hull value, per-module values, aggregate modules value and rebuy are
  omitted. Catalogue prices are recalculated by the Almanac during SLEF export; captured purchase
  provenance requires SLEF rather than a build link.
- Ship name and ident are UTF-8, so the codec is not limited to ASCII.
- A CRC-32 detects truncation and accidental payload changes before the Almanac reconstructs the
  `ShipLoadout`.
- Unknown versions, missing table identities, malformed encodings, duplicate slots, invalid ranges,
  trailing bytes, and integrity failures are refused rather than guessed.

The generated tables can be refreshed with `pnpm run codec:tables`. A released version-1 table must
never be regenerated in place; future catalogue changes require a new codec version while the v1
decoder and tables remain available.

## Practical stopping point

The remaining fixed overhead buys format selection, byte alignment, and a CRC-32. Shortening the
checksum would save only a few URL characters while weakening corruption detection. A custom radix
or general-purpose entropy coder would add significantly more implementation and compatibility risk
for a small, corpus-dependent gain. Quantising engineering quality would save more, but would make
the round trip lossy. At 141 characters for the largest reference build, those trade-offs are not
reasonable for this POC.

## What remains before production

This is a domain POC, not the feature UI or URL lifecycle. It does not update `location.hash`, manage
browser history, import pasted links, or present localised diagnostics.
