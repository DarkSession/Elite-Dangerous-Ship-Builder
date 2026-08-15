# Import/export compression POC

## Outcome

A versioned binary representation of the minimal build model meets the build-link length targets
without compressing or reimplementing SLEF. SLEF still enters and leaves through
`@elite-dangerous-almanac/core`; the POC only serialises the non-derivable state between those two
operations.

The fixed reference corpus currently produces these complete URL lengths, using
`https://ships.example/` as the base URL:

| Reference build           | Base73 payload (without `b.`)                                                                | Complete URL length | Target |
| ------------------------- | -------------------------------------------------------------------------------------------- | ------------------: | -----: |
| Empty Sidewinder          | `1WGofBv1qz`                                                                                 |                  35 |   <100 |
| Stock Krait Mk II         | `j05F1hq4`                                                                                   |                  33 |   <300 |
| Full engineered Anaconda* | `3Id_V/elH:O/_JFVgQ0zx006wm!R-tf$-+/qWRNmbOruMIi5eZSEn@lA76nG2$$2WFV*hhORQZz~TkTDdptZVWvAwi` |                 115 |  <=500 |

\* All 39 slots are occupied and all 29 engineerable modules are engineered.

The every-hull baseline corpus covers empty and stock configurations for all 48 catalogue hulls.
Its longest complete URL is 35 characters (the alphabetical tie-break reports the Adder). A
sanitised real engineered Federal Corvette SLEF export produces a 148-character complete URL and
round-trips every calculated module stat through the Almanac.

Compact minimal JSON plus raw DEFLATE was rejected for this use case. In the initial experiment,
the same engineered Anaconda produced an encoded payload of about 1,167 characters before the base
URL was added.

## Format proved by the spike

- The fragment uses a table-independent `b.` prefix. The first field inside the decoded binary
  payload is the format version; the decoder reads it before selecting immutable version-specific
  rules and identifier tables. The field is ten bits, providing 1,024 values. Version `0` is
  reserved, so the format can publish 1,023 versions in total (1,022 more after version 1).
- Hulls, modules, blueprints, experimental effects, and hull-specific slot keys are stored as
  indexes into immutable tables generated from `@elite-dangerous-almanac/core@0.1.0-beta.5` and
  committed with the decoder. Default modules discovered through `ShipLoadout.default()` are also
  pinned, including built-in modules not exposed by the package's public module catalogue.
- A one-bit pristine-default marker reduces an unchanged stock build to its ship identity. Other
  builds choose whichever is smaller: an absolute set of occupied slots, or changes relative to the
  hull's pinned default loadout.
- Occupied, changed, power-override, and engineered slot sets independently choose between a bitmap
  and sparse lists of included or excluded indexes. The complement form reduces a fully occupied
  39-slot set from a 39-bit bitmap to a count of zero exclusions.
- Module identities use a hull-slot-specific candidate table when possible, with the global module
  table as a forward-safe fallback. Blueprints and experimental effects likewise use candidate sets
  specific to the fitted module, with global fallbacks.
- Repeated module identities use a cost-selected mode. An adjacent repeat costs one bit; a scattered
  repeat refers to the dictionary of previously emitted identities. Direct mode remains canonical
  whenever references do not save bits.
- The remaining values form one continuous bitstream. Power state and priority are carried only for
  slots that differ from their defaults; dense power states detect uniform and fully defined value
  sets rather than spending five bits per module indiscriminately.
- Engineering presence is measured only across modules which can carry recipes, fixed variants, or
  decorative transformations. A blueprint's common maximum grade is implied from its pinned grade
  set, an absent experimental effect costs one bit, common quality `1` costs one bit, quality `0`
  costs two, and a SLEF quality between them is stored exactly as its four-decimal fixed-point
  integer. A non-SLEF JavaScript value which is not exactly representable at four decimals uses an
  explicit float64 escape, so the codec remains lossless.
- Repeated ordinary engineering records may refer back to their first occurrence. The encoder
  measures the direct and reference modes and only enables references when they reduce the payload.
- Decoding ordinary engineering applies its blueprint, grade, quality, and experimental effect
  through `ShipLoadout.applyBlueprint()`. The Almanac therefore rebuilds both the journal modifier
  array and every effective module statistic rather than treating the decoded module as
  unengineered.
- Package-identified fixed pre-engineered variants have contextual identities. Their hand-set
  modifiers are rebuilt with the Almanac resolver, preserving mechanically distinct modules without
  repeating calculated modifier arrays in the payload. Decorative identities are pinned but refused
  until the package exposes its own supported modifier resolver.
- No credit figure is encoded: hull value, per-module values, aggregate modules value and rebuy are
  omitted. Catalogue prices are recalculated by the Almanac during SLEF export; captured purchase
  provenance requires SLEF rather than a build link.
- Ship name and ident are UTF-8, so the codec is not limited to ASCII. Ill-formed UTF-16 input is
  rejected instead of being silently replaced with U+FFFD.
- The binary payload is encoded in Base73 using RFC-fragment-safe characters. Its final mixed-radix
  digit is restricted to alphanumeric Base62, so a bare-link autolinker cannot strip trailing
  punctuation. This saves four characters over Base64URL on the pre-reference payload without the
  quote, parenthesis, comma, semicolon, ampersand, equals, and question-mark characters rejected
  with Base81.
- A CRC-32 detects truncation and accidental payload changes before the Almanac reconstructs the
  `ShipLoadout`.
- Unknown versions, missing table identities, malformed encodings, duplicate slots, invalid ranges,
  non-canonical alternate spellings, trailing bytes, and integrity failures are refused rather than
  guessed. Decoding also re-encodes the reconstructed build and requires a byte-identical canonical
  fragment.

The generated JSON tables can be refreshed with `pnpm run codec:tables`. A released version-1 table
must never be regenerated in place; future catalogue changes require a new codec version while the
v1 decoder and JSON table remain available. Each codec imports only its own versioned JSON file.
Production callers use the table-independent asynchronous loader, which decodes only the generic
radix layer, reads the first ten payload bits, and dynamically imports the selected codec chunk and
its table; old version tables therefore do not accumulate in the initial application bundle.

## Practical stopping point

The remaining fixed overhead buys format selection, byte alignment, and a CRC-32. Shortening the
checksum would save only a few URL characters while weakening corruption detection. The
four-decimal quality representation is exact for real SLEF exports and retains a float escape rather
than quantising exceptional values. Complement sets, repeated-module identities, and repeated
ordinary engineering records are all enabled only when their exact bit-cost comparison wins.

A general compression pass was also measured after these changes. The fair comparison compresses
the body and then appends the unchanged four-byte CRC:

| Build               | Current bytes | Raw DEFLATE + CRC | Brotli + CRC |
| ------------------- | ------------: | ----------------: | -----------: |
| Empty Sidewinder    |             8 |                10 |           12 |
| Stock Krait Mk II   |             7 |                 9 |           11 |
| Engineered Anaconda |            70 |                75 |           74 |

Both compressors make every reference larger. At 115 characters for the largest synthetic
reference and 148 for the sanitised real build, a second compression path is not a reasonable
trade-off. Base73 still needs interoperability testing in the actual sharing applications, and its
whole-value `BigInt` conversion should become a bounded block converter before production.

## What remains before production

This is a domain POC, not the feature UI or URL lifecycle. It does not update `location.hash`, manage
browser history, import pasted links, or present localised diagnostics.

Decorative modifier reconstruction needs a supported Almanac resolver before this can ship. The
codec refuses those builds rather than using the pre-engineered resolver through a synthesised
structural cast. The package exposes the decorative catalogue record but not its journal-style
calculated modifiers. That API gap is tracked upstream in
[Elite-Dangerous-Almanac issue 260](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/260);
production work must consume the released package fix rather than reproduce the calculation locally.
