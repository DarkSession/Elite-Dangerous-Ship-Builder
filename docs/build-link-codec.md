# Build-link codec

## Purpose

The build-link codec serialises the smallest non-derivable representation of a ship loadout into a
URL fragment. It is an application-owned interchange format for sharing builds; it is not a second
implementation of SLEF.

SLEF import, build reconstruction, calculated statistics, and SLEF export remain the responsibility
of `@elite-dangerous-almanac/core`. The codec carries only the state needed to reconstruct the same
application loadout after invariant-quality normalisation: hull, optional ship labels, outfittable
module identities, explicit power settings, and engineering choices. Every blueprint grade is
treated as complete at 100% quality, so engineering quality is not link state. Fixed components
such as the cargo hatch are implied by the hull; only their variable power state is carried. The
codec deliberately omits calculated values, catalogue and purchase prices, aggregate module value,
hull value, rebuy, health, and ammunition.

The format is designed around these constraints:

- links must remain compact for empty, stock, and fully engineered ships;
- every accepted link must decode deterministically and losslessly for every field the application
  models;
- alternate encodings of the same build must be rejected;
- published table versions must remain protocol-decodable indefinitely;
- old tables must not accumulate in the application's initial JavaScript bundle; and
- malformed, corrupted, unsupported, or ambiguous input must fail instead of being guessed.

## Representation layers

The complete fragment is built in layers:

```text
#b.<encoded payload>
    │
    └─ Base70 digits with a Base62-only terminal digit
       └─ payload bytes: [table version + adaptive build state] [CRC-32, little-endian]
          └─ identities resolved through the selected immutable JSON table
             └─ decoded and reconstructed through @elite-dangerous-almanac/core
```

The application hash marker `#` belongs to the URL and is not part of the codec value. Codec APIs
produce and accept `b.<encoded payload>`; the decoder also tolerates a leading `#` for integration
convenience.

### Outer envelope and table dispatch

`b.` permanently identifies the current Base70/Base62-terminal envelope. After decoding only that
generic radix layer, the asynchronous loader reads the first ten bits of the payload and dynamically
imports the matching immutable JSON table. The binary codec is shared by every table snapshot.

The table-version field has 1,024 values. Table `0` is reserved and table `1` is the sole snapshot
defined before release. A catalogue update keeps the `b.` prefix and binary layout, publishes a new
immutable numbered JSON table, and makes that number current for new links. Older table files remain
available for existing links. Two or three new table snapshots per year do not require cloned codec
implementations.

A future prefix such as `c.` is appropriate for an incompatible binary layout or outer envelope.
Prefixes identify codecs, while the embedded field identifies data tables; neither is a release
counter. Once published, each prefix and referenced table remains available for its existing links.

### Radix envelope

The payload bytes are interpreted as one unsigned big-endian integer and encoded with this
70-character fragment-safe alphabet:

```text
0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-.!_/:@,
```

Leading zero bytes are represented by leading `0` digits. The terminal digit uses only Base62
alphanumerics, preventing bare-link autolinkers from dropping trailing punctuation. Decoding must
re-encode to the exact original text, which rejects invalid characters, redundant leading zeros,
and other non-canonical integer spellings. Underscore is URI-unreserved; comma is permitted in a
fragment but cannot appear as the terminal digit. Dollar is deliberately absent because paired
dollar signs delimit inline mathematics in GitHub Markdown.

The binary body is followed by its four-byte, little-endian CRC-32. The checksum is verified before
the table-indexed parser or the Almanac sees the data. A complete codec value is limited to 500
characters, `b.` counted among them, which leaves 498 encoded digits.

That is the bound FR-028 states. The requirement was amended to say so: it had been written over a
complete URL, which no codec can enforce, since the origin, path and `#` around a value belong to
wherever the application is deployed. Stating it over the value makes it a bound the layer that has
to satisfy it can actually see. What the URL adds is still real — on the `https://ships.example/#`
origin the tests use, 23 characters — but a deployment long enough for that to matter is the sharing
feature's to notice.

## Binary body

The first ten bits are always the directly readable codec-table version. The next fixed-width hull
tag also selects the body representation. For a table with `h` hulls, its width is
`ceil(log2(h + 1))`:

- tag values below `h` select bit packing and are the hull index;
- tag values from `h` upward select arithmetic coding and carry the hull-index remainder across the
  unused tag values; the arithmetic stream begins with the corresponding quotient when needed.

For table 1, `h = 48`, so its six-bit values `0..47` are packed hulls and `48..63` are arithmetic
markers. This uses capacity the hull tag already needed and preserves small packed bodies exactly.
That no-penalty reuse applies when `h` is not a power of two; a future power-of-two hull count makes
the combined tag one bit wider than a packed hull index alone. The writer finalises both
representations and uses arithmetic coding only when its padded body is strictly shorter; a tie uses
bit packing.

Packed fields are written least-significant bit first within each field and byte. Arithmetic output
bits continue immediately after the hull tag, without byte alignment. Both forms pad the final
partial byte with zero bits, and exact canonical reserialization rejects non-zero or additional
trailing data.

| Order | Field               | Representation                                                                  |
| ----: | ------------------- | ------------------------------------------------------------------------------- |
|     1 | Codec-table version | 10 raw bits; currently `1`                                                      |
|     2 | Representation/hull | Fixed-width packed hull index or arithmetic marker described above              |
|     3 | Ship-name presence  | Boolean                                                                         |
|     4 | Ship-ident presence | Boolean                                                                         |
|     5 | Ship name           | When present: tagged varuint length followed by compact symbols or UTF-8        |
|     6 | Ship ident          | When present: tagged varuint length followed by compact symbols or UTF-8        |
|     7 | Pristine default    | Boolean; when set, the hull's pinned stock loadout ends the logical symbol list |
|     8 | Module layout       | When non-pristine: cost-selected baseline or absolute outfittable modules       |
|     9 | Power states        | Explicit values for power-drawing modules and fixed components                  |
|    10 | Engineering states  | Engineering presence, identities, grades, and experimental effects              |

### Arithmetic representation

The arithmetic branch is a 64-bit integer Witten–Neal–Cleary coder with inclusive `low` and `high`
intervals and deterministic E1/E2/E3 renormalisation. Every logical value is encoded against its
actual uniform cardinality: booleans use `2`, bytes use `256`, contextual identities use the size of
their candidate set, and an eligible combination rank uses its exact combination count.

The immutable arithmetic constants are:

```text
P    = 2^64
MAX  = P - 1
HALF = P / 2
Q1   = P / 4
Q3   = 3 * P / 4
low  = 0
high = MAX
```

For a symbol `s` in a uniform alphabet of cardinality `N`, `2 <= N <=
Number.MAX_SAFE_INTEGER` and `0 <= s < N`, the encoder updates the inclusive interval with exact
`BigInt` arithmetic:

```text
range   = high - low + 1
newHigh = low + floor(range * (s + 1) / N) - 1
newLow  = low + floor(range * s / N)
```

After each update, renormalisation repeats the first applicable case:

```text
E1: high < HALF              => emit 0 and all pending complements
E2: low >= HALF              => emit 1 and all pending complements; subtract HALF
E3: low >= Q1 and high < Q3  => increment pending underflow; subtract Q1
otherwise                    => stop renormalising
```

Each completed E1/E2/E3 step then sets `low = 2 * low` and `high = 2 * high + 1`. Emitting a bit
also emits every pending-underflow bit as its complement, then clears the pending count. Arithmetic
stream bits are stored in emission order at successive physical bit positions; because physical
positions increase least-significant position first within a byte, they are not reversed or grouped
as a multi-bit integer.

The decoder initialises `code` from the first 64 arithmetic stream bits in emission order, shifting
the previous code left before adding each bit. Missing physical bits are zero. It selects the next
symbol with:

```text
range = high - low + 1
s     = floor((((code - low + 1) * N) - 1) / range)
```

It applies the same interval update. During E2 it subtracts `HALF` from `low`, `high`, and `code`;
during E3 it subtracts `Q1` from all three. Every completed renormalisation step doubles `low` and
sets `high = 2 * high + 1` and `code = 2 * code + nextBit`.

Termination increments the pending-underflow count once. If `low < Q1`, it emits `0` followed by
pending `1` bits; otherwise it emits `1` followed by pending `0` bits. The grammar supplies the
symbol count, so no EOF symbol or eight-byte code flush is needed. Exact body reserialization makes
virtual zero extension safe: truncated input, alternate termination, extra bytes, a non-preferred
representation, and non-zero padding all fail canonical validation.

The pristine marker describes the ordinary base: every module matches the pinned default and every
fitted module has absent power and engineering state.

## Adaptive encodings

Each adaptive structure computes its exact packed-bit cost before choosing a representation.
Decoders repeat that choice and reject any more expensive encoding, including non-preferred ties.
The packed cost is the deliberate stable proxy even when the final body uses arithmetic coding.
This makes the format canonical while allowing sparse and dense builds to use different layouts.

### Index sets

Slot sets are shared by module layout, power overrides, and engineering presence. A two-bit mode
selects one of four forms:

| Mode | Form             | Data                                                        |
| ---: | ---------------- | ----------------------------------------------------------- |
|    0 | Bitmap           | One bit for every candidate                                 |
|    1 | Included indexes | Count followed by strictly increasing fixed-width indexes   |
|    2 | Excluded indexes | Count followed by the strictly increasing complement        |
|    3 | Combination rank | Count, then `ceil(log2(C(n,k)))` bits of lexicographic rank |

Equal-cost modes prefer bitmap, then included indexes, then excluded indexes, then combination
rank. A universe containing zero or one candidate explicitly uses bitmap mode; it does not rely on
that tie order to avoid a one-cardinality bounded symbol. Here `n` is the candidate count and `k` is
the selected count. A zero-bit rank represents the only possible subset when `C(n,k) = 1`. The
combination count for the largest 38-slot hull remains a safe JavaScript integer. The arithmetic
primitive can encode any safe-integer cardinality, but the codec rejects a logical symbol when its
packed width would exceed 31 bits because canonical selection requires both renderers to succeed.
The shared index-set grammar likewise makes mode 3 eligible only when its bit-packed rank fits in at
most 31 bits. With the pinned maximum of 38 slots, any wider rank already loses to the bitmap after
including its count. The packed reader rejects such a mode before reading its rank; the arithmetic
path rejects it during canonical reserialization. The complement form is especially effective for
nearly complete loadouts: all 38 outfittable Anaconda slots can be represented as zero exclusions
instead of a 38-bit occupancy map.

### Module layout and identities

A non-pristine build first chooses between two complete layout strategies:

- **baseline-relative:** start with the hull's pinned stock loadout, encode the set of changed slots,
  then encode presence and identity only for those changes; or
- **absolute:** start empty, encode the set of occupied slots, then encode their identities.

The lower exact bit cost wins; a tie uses baseline-relative mode. The fully fitted reference
Anaconda is cheaper relative to its default loadout than from empty, so the codec selects the stock
baseline.

Module identity is constrained by hull and slot. A default identity has a one-bit shortcut. Other
identities use the pinned slot-specific candidate set when possible; a fixed-width global table
index is a fallback only when the identity is absent from that context. A contextual candidate set
containing one module consumes no index bits. The decoder rejects a global identity that could have
used the contextual form.

Sequences of two or more identities also compare direct encoding with backward references. The
first identity is literal. Later values can identify the immediately previous value or an earlier
distinct identity; otherwise they remain literal. Reference mode is selected only when it is
strictly smaller, so it can never add overhead to a build that does not repeat modules.

### Power state

Power data includes only occupied outfittable modules and fixed components whose pinned catalogue
power draw is greater than zero. Passive modules cannot be switched off or assigned a priority, so
any redundant `On` or `Priority` fields in an imported event are discarded rather than encoded.
The cargo hatch draws power and therefore has no presence or identity bit but retains an enabled
state and priority at a stable position.

Data begins with a one-bit `has overrides` marker. An override exists when either `on` or priority is
explicitly present, including priority `0`; absence remains distinct from an explicit value. When
overrides exist, a two-bit, exact-cost-selected mode chooses among:

- a fixed representation which detects uniform and all-defined fields across the sequence;
- a sparse representation relative to absent `on` and priority fields; and
- a journal baseline of `on = true` and `priority = 1`, with independent index sets and values only
  for fields which differ.

The journal baseline retains the distinction between an absent field and an explicit value; it is
selected only when cheaper than the other lossless forms. Equal costs prefer fixed, then sparse,
then journal-baseline mode. The mappings reserve invalid codes so the decoder can reject
out-of-range state:

- `on`: absent = `0`, off = `1`, on = `2`, with `3` invalid;
- priority: absent = `0`, priorities `0` through `4` = `1` through `5`, with `6` and `7` invalid.

### Engineering state

Engineering presence is measured only across fitted modules which have an ordinary blueprint or
pre-engineered variant in the pinned tables. One bit distinguishes all eligible modules from an
explicit index set.

For multiple engineered modules, ordinary engineering records may refer backward to an identical
ordinary record already emitted. The direct and reference forms are costed in full, and reference
mode is used only when smaller. Fixed pre-engineered records do not participate in this record
dictionary because their identities carry different reconstruction semantics.

An ordinary record contains:

- a blueprint index, normally constrained to the fitted module's candidate set;
- a grade, with the common maximum grade represented by one bit; when a blueprint has exactly two
  grades, that maximum/non-maximum bit identifies both and no bounded grade index follows; and
- an optional experimental effect, normally constrained to the module's candidate set.

Pre-engineered records use a pinned contextual identity composed from module, blueprint, grade, and
acquisition method. The pinned default experimental effect is implied unless explicitly changed.
Their modifier arrays are not encoded, because decoding regenerates them from the pinned identity.
A module therefore takes this record only while that regeneration would reproduce the engineering it
carries; see the Mercenary case below.

Almanac beta.12 publishes modifier signatures for 54 fixed variants, which makes those articles
identifiable and shareable. Its 22 Mercenary-system variants still have no published modifier
signatures, but beta.12 identifies them by their purchase-exclusive blueprint instead, so they are
identifiable and shareable too. The codec continues to take every identity from the package and
re-derives nothing from blueprint metadata itself.

The difference between the two identification routes matters to the encoder. A reward article is
recognised _from_ its published block, so a module carrying that identity is carrying that state and
the record restores exactly what identified it. A Mercenary article is recognised from a blueprint
instead, so its identity says nothing about its state, and it is the one fixed variant that can hold
engineering the record cannot describe. Two ways: its purchase is grade 1 while the same blueprint
crafts grades 2 to 5 with the identity surviving the upgrade, so the fitted grade can be past the one
the record replays; and no modifier block is published for the purchase, so the record restores only
whatever an experimental effect contributes, and a capture stating anything else would decode to
different values.

For a Mercenary article, therefore, the record is used only when decoding it would reproduce the
module's engineering outright — same grade, same modifiers. Reward articles keep taking the record
whenever the package identifies them, unchanged. Anything a record cannot describe is written as an
ordinary record, blueprint and grade, exactly as beta.11 wrote it while the article was
unidentifiable, and the Almanac re-derives the purchase identity on reconstruction. The two forms
stay unambiguous because no Mercenary blueprint offers grade 1 as a craftable grade, so the purchase
grade is unspellable in the ordinary form and grades 2 to 5 are unspellable in the pre-engineered
one.

Where neither form fits, the encoder refuses, naming the slot. That covers a purchase whose capture
states modifiers the record cannot account for — there is no craftable grade 1 to fall back to — and
it covers three of the 22 whenever they are engineered above their purchase grade: the two small
mining tools and the class-2 size-5 module reinforcement package. Those three still share correctly
at their purchase grade, which is the state the record was made for. The package reports no ordinary
blueprint for those modules, so table 1 records none, and the discriminator that would select the
ordinary form is not even written for a module with an empty blueprint set: the reader infers the
pre-engineered form from the table alone. Note this is the discriminator, not the blueprint index —
an ordinary record can name a blueprint outside its module's candidate set, and all nineteen working
Mercenary articles do exactly that. None of this is new; beta.11 refused the same builds. Closing it
means a later table that carries Mercenary-route blueprints in each module's candidate set, which
changes what the discriminator can express rather than the record layouts themselves.

Festive launchers are normal fixed pre-engineered variants in the Almanac model. They therefore use
the same contextual pre-engineered identity as every other fixed article; the codec has no separate
decorative state or application-specific modifier resolver.

### Scalar values

Engineering quality consumes no bits. The application models every selected or imported grade as
complete at quality `1`; a partial value in an imported journal or SLEF capture is deliberately
normalised rather than retained in the link model.

Ship name and ident use a tagged varuint header. In compact form, the header is
`2 * character count + 1`, followed by one six-bit index per character into this exact ordered
alphabet:

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -
```

Every other value uses strict UTF-8: its header is `2 * UTF-8 byte count`, followed by that many
bytes. Thus an odd header identifies compact character count and an even header identifies UTF-8
byte count. A compact value is limited to 32 characters and a fallback value to 32 UTF-8 bytes, a
bound derived from the link budget below rather than chosen for its own sake.
The encoder rejects ill-formed UTF-16 such as lone surrogates, and the decoder rejects
malformed UTF-8 rather than replacing it with U+FFFD. It also rejects a UTF-8 spelling when every
decoded character belongs to the compact alphabet, because that spelling is non-canonical.

## Reconstruction and validation

The decoder creates the minimal loadout event, then reconstructs ordinary engineering through
`ShipLoadout.applyBlueprint()`. That Almanac operation regenerates the journal modifier array and
all effective module statistics from blueprint, grade, invariant quality `1`, and experimental effect.
Pre-engineered modifiers are likewise obtained from the Almanac's supported journal resolver.

Calculated module values, hull value, aggregate module value, rebuy, and modifier arrays are never
link state. Catalogue prices are recalculated by the Almanac when exporting SLEF. A captured
purchase price or other provenance belongs in a SLEF document, not a build link.

Validation occurs at every layer:

1. Check the permanent envelope prefix and encoded-length bound.
2. Decode and canonically re-encode the Base70/Base62-terminal text.
3. Verify CRC-32 before parsing the body.
4. Select the immutable JSON table named by the ten-bit table version.
5. Parse a table-indexed intermediate representation while validating every identity, contextual
   candidate, mode, range, count, and ordered index.
6. Reject non-zero padding and trailing data.
7. Finalise both packed and arithmetic forms, select the strictly shorter padded body (packed on a
   tie), and require that canonical body to match the input exactly.
8. Only after protocol validation, reconstruct the `ShipLoadout` through the Almanac.

Canonicality therefore depends only on the immutable decoder and tables, not on Almanac object
normalisation. The final intermediate-state reserialization is authoritative; inner readers retain
structural bounds and reference checks but do not duplicate the writer's adaptive cost model.
Corruption tests also exercise re-checksummed body mutations so structurally valid but non-canonical
alternatives cannot bypass the CRC check. Almanac reconstruction fidelity remains a separately
tested compatibility property, and a reconstruction failure is reported separately from malformed
protocol data.

## Growth limits and the link budget

No table dimension is capped by the codec. Every width is derived from the table a link names, so
a bigger catalogue widens fields rather than breaking the format, and the binary layout keeps
working until a bounded symbol would need more than 31 bits — the packed writer's limit, which both
renderers must satisfy. That puts every structural ceiling around 2^31: 2,147,483,647 hulls (the
representation tag is `ceil(log2(h + 1))` raw bits), 2^31 modules, blueprints, experimental effects
or candidates per set, and 2^31 − 1 mounts on one hull. Grades are bounded at five by the game's own
range, which the generator checks. The ten-bit table-version field is the one small structural
limit: 1,023 snapshots, one of them spent.

What growth actually costs is link length, and links are bounded. Five hundred characters, two of
them `b.`, hold 381 payload bytes: a 377-byte body plus its four-byte CRC-32, or 3,016 bits. The
reference builds use a fraction of it — the fully engineered Anaconda body is 440 bits and the
supplied Corvette 624, about 17 bits for each of its 37 engineered modules.

The table below is the growth this format promises to absorb. `CODEC_TABLE_CAPACITY` in
[`scripts/build-link-codec-capacity.mjs`](../scripts/build-link-codec-capacity.mjs) holds these
numbers, and generation refuses a table that exceeds one.

| Dimension                          | Table 1 | Budgeted for | Encoded width at that size   |
| ---------------------------------- | ------: | -----------: | ---------------------------- |
| Hulls                              |      48 |          128 | 8-bit representation tag     |
| Modules                            |   1,200 |        2,048 | 11-bit global fallback index |
| Blueprints                         |     110 |          256 | 8-bit global fallback index  |
| Experimental effects               |      86 |          256 | 8-bit global fallback index  |
| Outfittable mounts on one hull     |      38 |           48 | 48-bit bitmap, 6-bit indexes |
| Fixed mounts on one hull           |       1 |            4 | power state only             |
| Grades on one blueprint            |       5 |            5 | 1 bit, or 3 below the top    |
| Largest module candidate set       |     473 |        1,024 | 10 bits per fitted module    |
| Largest blueprint candidate set    |       9 |           32 | 5 bits per engineered module |
| Largest experimental candidate set |      12 |           32 | 5 bits per engineered module |
| Largest pre-engineered set         |       6 |           32 | 5 bits per engineered module |

Those numbers are a promise, so generation prices them as though a table had already grown into
every one: **339 of the 377 bytes** a link carries, for a build with every mount filled and
engineered, every identity reached through its widest index, and both labels at their unit bound in
UTF-8. The table as it actually stands prices at 272, and both figures print on every run. Two
properties of the writer keep so blunt a bound sound: each adaptive structure is written in
whichever mode costs least, so pricing one arbitrary mode can only over-count, and the canonical
body is the shorter of the packed and arithmetic renderings, so the packed cost bounds both. Real
builds sit far below either figure — the supplied Corvette carrying a 32-byte name and a 32-byte
ident encodes to 195 of the 500 characters.

Pricing capacity rather than the current table is what makes the budget honest, and it is the
constraint that sets both the mount and label limits. Mounts are much the most expensive dimension
at roughly 44 bits each, and the two limits trade directly against one another: 64 mounts, an
earlier draft of this table, needs 427 bytes at the 32-unit label bound and 493 at a 64-unit one —
either way beyond a link. The pair had to give, and it gave on labels, because of an asymmetry in
which of them can move later. `MAX_STRING_UNITS` is shared by every table's decoder, so raising it
is free while lowering it would strand links already published; a mount count is data, and refusing
to mint a table for a hull the game has actually shipped is the worse failure. So the label bound is
set low now — 32 units, which is 32 compact characters, 16 accented Latin characters or 10 CJK
characters, since the fallback form counts UTF-8 bytes — and the mounts keep their headroom. Should
the game ship a hull past 48 mounts, versioning the label bound per table is the move that buys
capacity back without touching a published link's decoder.

## Versioned tables and lazy loading

Table 1 is the immutable `codec-table-1.json`, generated from
`@elite-dangerous-almanac/core@0.1.0-beta.12`. It pins hulls, hull-specific outfittable slots,
fixed components, stock modules, module identities, blueprints and their grades, experimental
effects, contextual candidate sets, power-drawing module identities, and pre-engineered identities.
Stable game identities originate from the package; indexes exist only
inside the selected frozen table. Before the first release, table 1 can be regenerated with
`pnpm run codec:tables`. After release, a catalogue change publishes the next numbered JSON table
while retaining every earlier table unchanged; it does not duplicate or version the codec logic.

The public asynchronous loader initially imports only the generic envelope, radix, and CRC code.
It radix-decodes the envelope and verifies CRC-32 once before using the table-version field, then
passes that verified body through the asynchronous table load without decoding it again. Encoding
dynamically loads the shared codec and current table. Decoding then imports only the matching JSON
file alongside the shared codec. Adding table snapshots to the loader therefore does not place
every historical table in the initial bundle.

A table's identity is its content, not the release it was generated from, and
`$generated.contentHash` — a SHA-256 over the table with its `$generated` block removed — is what
states that identity. That block is excluded because it holds the table's label and the hash itself
rather than any encoded value, and it holds nothing else: a table records what it encodes and the
fingerprint of that content, not the release or the script it came from. Which Almanac version
reproduces a given table is recorded here and in git history, where it can be corrected without
touching a frozen artefact. `pnpm run codec:tables` hashes the committed payload, verifies its
declared hash and compares that actual content with the freshly generated content. It **refuses to
write when either check differs**, because every published link names the table version that decodes
it, so a table whose content moved is a new encoding and belongs under the next number with this one
retained. A table committed before the hash existed is re-hashed the same way for the comparison, so
the rule has no bootstrap hole. `--overwrite` replaces a table in place and is sound only while no
link has been published against it.

The current application dependency is exactly pinned to Almanac `0.1.0-beta.12`. Every future
Almanac upgrade must pass the frozen literal-link reconstruction corpus. Those literals are protocol
fixtures and must never be regenerated merely to make an upgrade pass. All four upgrades so far were
checked this way. The `0.1.0-beta.8` to `0.1.0-beta.9` upgrade reproduced every pinned array byte for
byte, and `0.1.0-beta.9` to `0.1.0-beta.10` did the same — beta.10 carries one
calculation change, the power-aware cell bank pool, and alters no hull, module, blueprint,
experimental-effect, pre-engineered or stock-loadout identity. `0.1.0-beta.10` to `0.1.0-beta.11`
and `0.1.0-beta.11` to `0.1.0-beta.12` likewise reproduced the table exactly, at content hash
`a2c4980d26089ce806d985f7f9f97e6e147687248a1f0f0ca1afbb9de9ba36c0`; `ALL_MODULES` is 1199 throughout
and the `assets/ships` tree is byte-identical across all five releases. So the snapshot carries
forward under its existing number, unchanged on disk, and the frozen literals decode unchanged.

beta.12 changed no catalogue, but it did change an answer the encoder reads. Mercenary articles now
resolve to their variant, so a module the encoder used to see as ordinarily engineered — a Rail Gun
carrying grade 5 of `RailGun_LongShot`, say — now arrives carrying a pre-engineered identity as well.
Written as a pre-engineered record, that build came back at the purchase grade: the Commander's
upgrade was silently discarded on decode. A purchase-grade article whose capture stated modifiers
lost those the same way, decoding to the values the record regenerates instead — stock where no
experimental effect was applied, the effect's own where one was — in each case where beta.11 had
refused the build outright. The record choice now asks whether decoding it would reproduce the
engineering the module carries, grade and modifiers both, and asks it only of Mercenary articles,
since a reward article is identified by the very block the record restores. That restores the beta.11
outcome for every affected build, leaves reward encoding untouched, and leaves every frozen literal
untouched with it. This was the application's own inference to correct, not an Almanac defect: the
package reported the fitted grade, the modifiers and the purchase identity accurately, and it was the
encoder that treated the identity as standing in for the rest.

beta.11 did, however, require a correction to how the generator partitions mounts, and it is worth
recording why. The generator used to split slots on the package's `removable` flag: everything
removable was encoded, the rest carried as fixed. beta.11 closed
[almanac issue #283](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/283), so armour
and the seven core internals now correctly report `removable: false`. Under the old split that would
have moved 384 mounts out of the encoded set and into the fixed set, changing the table and — worse —
leaving a build's chosen power plant, thrusters and drive unrepresentable, since a fixed mount is
encoded as its stock module. The flag never meant what the generator read it as: `removable` is about
what may be **emptied**, and the codec cares about what may be **fitted**. Those coincided until
beta.11 and no longer do. The partition now keys on the built-in cargo hatch, the only mount that
offers no choice of module at all, which reproduces the committed table exactly. The content hash is
what turned a silent format break into a refusal to write.

Note that the generator writes raw `JSON.stringify` output while the committed file
is Prettier-formatted, so an upgrade check must compare against `pnpm run codec:tables`, which pairs
the two: a bare generator run differs from the committed file in whitespace alone, which reads
alarmingly like drift. Frozen tables preserve
protocol interpretation, but full `ShipLoadout` reconstruction also depends on compatible Almanac
identities and behaviour; an incompatible upgrade requires retaining a compatible reconstruction
path for the affected table version.

## Reference corpus

The fixed corpus currently produces these encoded data lengths. Each value and length includes the
`b.` protocol prefix:

| Reference build               | Base70 encoded data                                                                                            | Data length |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------: |
| Empty Sidewinder              | `b.21B7zk:1Zz`                                                                                                 |          12 |
| Stock Krait Mk II             | `b.vz,jdQ_4`                                                                                                   |          10 |
| Festive flak Krait            | `b.eXcP/8q9Kv9i`                                                                                               |          14 |
| Full engineered Anaconda*     | `b.dtb4q.j:qTZT5gT0CpDtwq0DVlkN10dKElN9u44u0lRCUMZ99PuBBp5N!ufEu!TCDPaC2f7Xox_9`                               |          78 |
| Supplied engineered Corvette† | `b.hfy5atU9-z7gB1fvx3TiSKQFgEHdz3i1IBStLuSV17_GAM1L@5/prYCrg3:WS/.z,h,g8h6:qrjxukg03UFrNC65Bb68Ny2TBmPMc5k623` |         108 |

\* All 38 outfittable slots are occupied, all 29 engineerable modules are engineered, and the
fixed cargo hatch has an explicit power state.

† All 37 outfittable modules present in the supplied journal event are represented, plus the fixed
cargo hatch's power state. Sixteen cosmetic and livery slots are outside the outfitting feature's
scope and are not part of the codec model. Identifying ship metadata and all calculated, health,
ammo, engineer, localisation, and purchase fields were removed from the checked-in reference.

The every-hull baseline corpus covers empty and stock configurations for all 48 catalogue hulls.
Its longest encoded value is 12 characters (the alphabetical tie-break reports the Adder). The
festive literal covers an otherwise unengineered Krait Mk II whose medium hardpoint carries a
package-owned green flak-launcher variant. The sanitised real engineered Federal Corvette produces
108 characters of encoded data. Its source capture records a partial quality on one small
hardpoint even though its modifier values match the completed grade-5 roll. The codec deliberately
normalises that field to quality `1`; the fixture is not treated as an independent oracle for
effective-stat reconstruction.

Compact minimal JSON plus raw DEFLATE is unsuitable for this data model. The same engineered
Anaconda produced about 1,167 characters of encoded data; the specialised codec produces 78,
including its `b.` prefix.

## Complete reference build definitions

These definitions list every field the codec models. The engineering column also displays invariant
quality `Q1` to make the reconstructed result explicit, but that value is not encoded. Tables
contain outfittable modules; the fixed cargo hatch is listed separately because only its power
state is variable. `—` means the optional value is absent; it is different from an explicit `on`,
`off`, or priority `0`. Calculated modifier arrays are deliberately not repeated because the
decoder rebuilds them through the Almanac.

<details>
<summary>Empty Sidewinder</summary>

- Hull: `SideWinder`
- Ship name: absent
- Ship ident: absent
- Outfittable modules: none
- Fixed cargo-hatch power: enabled absent, priority absent

</details>

<details>
<summary>Stock Krait Mk II</summary>

- Hull: `Krait_MkII`
- Ship name: absent
- Ship ident: absent

| Slot                   | Module                            | Enabled | Priority | Engineering |
| ---------------------- | --------------------------------- | ------: | -------: | ----------- |
| MediumHardpoint1       | Hpt_PulseLaser_Fixed_Small        |       — |        — | —           |
| MediumHardpoint2       | Hpt_PulseLaser_Fixed_Small        |       — |        — | —           |
| Armour                 | Krait_MkII_Armour_Grade1          |       — |        — | —           |
| PowerPlant             | Int_Powerplant_Size7_Class1       |       — |        — | —           |
| MainEngines            | Int_Engine_Size6_Class1           |       — |        — | —           |
| FrameShiftDrive        | Int_Hyperdrive_Size5_Class1       |       — |        — | —           |
| LifeSupport            | Int_LifeSupport_Size4_Class1      |       — |        — | —           |
| PowerDistributor       | Int_PowerDistributor_Size7_Class1 |       — |        — | —           |
| Radar                  | Int_Sensors_Size6_Class1          |       — |        — | —           |
| FuelTank               | Int_FuelTank_Size5_Class3         |       — |        — | —           |
| Slot01_Size6           | Int_ShieldGenerator_Size6_Class1  |       — |        — | —           |
| Slot02_Size6           | Int_CargoRack_Size5_Class1        |       — |        — | —           |
| Slot03_Size5           | Int_CargoRack_Size5_Class1        |       — |        — | —           |
| Slot04_Size5           | Int_CargoRack_Size4_Class1        |       — |        — | —           |
| Slot08_Size2           | Int_CargoRack_Size1_Class1        |       — |        — | —           |
| Slot09_Size1           | Int_SuperCruiseAssist             |       — |        — | —           |
| PlanetaryApproachSuite | int_planetapproachsuite_advanced  |       — |        — | —           |

Fixed cargo-hatch power: enabled absent, priority absent.

</details>

<details>
<summary>Fully outfitted and engineered Anaconda</summary>

- Hull: `Anaconda`
- Ship name: absent
- Ship ident: absent

| Slot                   | Module                            | Enabled | Priority | Engineering                                                          |
| ---------------------- | --------------------------------- | ------: | -------: | -------------------------------------------------------------------- |
| SmallHardpoint1        | Hpt_PulseLaser_Fixed_Small        |     off |        0 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| SmallHardpoint2        | Hpt_PulseLaser_Fixed_Small        |      on |        1 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| Armour                 | Anaconda_Armour_Grade1            |       — |        — | Armour_Thermic G5 Q1 + special_armour_thermic                        |
| PowerPlant             | Int_Powerplant_Size8_Class1       |       — |        — | PowerPlant_Stealth G5 Q1 + special_powerplant_toughened              |
| MainEngines            | Int_Engine_Size7_Class1           |      on |        4 | Engine_Tuned G5 Q1 + special_engine_toughened                        |
| FrameShiftDrive        | Int_Hyperdrive_Size6_Class1       |      on |        0 | FSD_Shielded G5 Q1 + special_fsd_toughened                           |
| LifeSupport            | Int_LifeSupport_Size5_Class1      |      on |        1 | LifeSupport_Shielded G5 Q1                                           |
| PowerDistributor       | Int_PowerDistributor_Size8_Class1 |     off |        2 | PowerDistributor_Shielded G5 Q1 + special_powerdistributor_toughened |
| Radar                  | Int_Sensors_Size8_Class1          |      on |        3 | Sensor_WideAngle G5 Q1                                               |
| FuelTank               | Int_FuelTank_Size5_Class3         |       — |        — | —                                                                    |
| Slot01_Size7           | Int_CargoRack_Size6_Class1        |       — |        — | CargoRack_IncreasedCapacity G5 Q1                                    |
| Slot02_Size6           | Int_CargoRack_Size5_Class1        |       — |        — | CargoRack_IncreasedCapacity G5 Q1                                    |
| Slot03_Size6           | Int_ShieldGenerator_Size6_Class1  |      on |        2 | ShieldGenerator_Thermic G5 Q1 + special_shield_toughened             |
| Slot05_Size5           | Int_CargoRack_Size4_Class1        |       — |        — | CargoRack_IncreasedCapacity G5 Q1                                    |
| Slot13_Size2           | Int_CargoRack_Size1_Class1        |       — |        — | CargoRack_IncreasedCapacity G5 Q1                                    |
| Slot14_Size1           | Int_SuperCruiseAssist             |      on |        0 | —                                                                    |
| PlanetaryApproachSuite | int_planetapproachsuite_advanced  |       — |        — | —                                                                    |
| HugeHardpoint1         | Hpt_PulseLaser_Fixed_Small        |      on |        3 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| LargeHardpoint1        | Hpt_PulseLaser_Fixed_Small        |      on |        4 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| LargeHardpoint2        | Hpt_PulseLaser_Fixed_Small        |      on |        0 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| LargeHardpoint3        | Hpt_PulseLaser_Fixed_Small        |     off |        1 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| MediumHardpoint1       | Hpt_PulseLaser_Fixed_Small        |      on |        2 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| MediumHardpoint2       | Hpt_PulseLaser_Fixed_Small        |      on |        3 | Weapon_Sturdy G5 Q1 + special_weapon_toughened                       |
| TinyHardpoint1         | Hpt_ChaffLauncher_Tiny            |      on |        4 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint2         | Hpt_ChaffLauncher_Tiny            |      on |        0 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint3         | Hpt_ChaffLauncher_Tiny            |      on |        1 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint4         | Hpt_ChaffLauncher_Tiny            |      on |        2 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint5         | Hpt_ChaffLauncher_Tiny            |     off |        3 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint6         | Hpt_ChaffLauncher_Tiny            |      on |        4 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint7         | Hpt_ChaffLauncher_Tiny            |      on |        0 | Misc_Shielded G5 Q1                                                  |
| TinyHardpoint8         | Hpt_ChaffLauncher_Tiny            |      on |        1 | Misc_Shielded G5 Q1                                                  |
| Slot04_Size6           | Int_FuelTank_Size1_Class3         |       — |        — | —                                                                    |
| Slot06_Size5           | Int_FuelTank_Size1_Class3         |       — |        — | —                                                                    |
| Slot07_Size5           | Int_FuelTank_Size1_Class3         |       — |        — | —                                                                    |
| Military01             | Int_ShieldCellBank_Size1_Class1   |     off |        0 | ShieldCellBank_Specialised G4 Q1 + special_shieldcell_toughened      |
| Slot08_Size4           | Int_FuelTank_Size1_Class3         |       — |        — | —                                                                    |
| Slot09_Size4           | Int_FuelTank_Size1_Class3         |       — |        — | —                                                                    |
| Slot10_Size4           | Int_FuelTank_Size1_Class3         |       — |        — | —                                                                    |

Fixed cargo-hatch power: on, priority `2`.

</details>

<details>
<summary>Supplied engineered Federal Corvette (sanitised)</summary>

- Hull: `federation_corvette`
- Ship name: removed from the reference
- Ship ident: removed from the reference

| Slot                   | Module                                   | Enabled | Priority | Engineering                                                          |
| ---------------------- | ---------------------------------------- | ------: | -------: | -------------------------------------------------------------------- |
| HugeHardpoint1         | hpt_beamlaser_gimbal_huge                |      on |        1 | Weapon_Efficient G5 Q1 + special_thermal_vent                        |
| HugeHardpoint2         | hpt_beamlaser_gimbal_huge                |      on |        1 | Weapon_Efficient G5 Q1 + special_thermal_vent                        |
| LargeHardpoint1        | hpt_drunkmissilerack_fixed_medium        |      on |        3 | Weapon_HighCapacity G5 Q1 + special_drag_munitions                   |
| MediumHardpoint1       | hpt_beamlaser_gimbal_medium              |      on |        3 | Weapon_LongRange G5 Q1 + special_regeneration_sequence               |
| MediumHardpoint2       | hpt_beamlaser_gimbal_medium              |      on |        3 | Weapon_LongRange G5 Q1 + special_regeneration_sequence               |
| SmallHardpoint1        | hpt_multicannon_gimbal_small             |      on |        1 | Weapon_HighCapacity G5 Q1 + special_corrosive_shell                  |
| SmallHardpoint2        | hpt_multicannon_gimbal_small             |      on |        2 | Weapon_HighCapacity G5 Q1 + special_emissive_munitions               |
| TinyHardpoint1         | hpt_shieldbooster_size0_class5           |      on |        2 | ShieldBooster_Resistive G5 Q1 + special_shieldbooster_chunky         |
| TinyHardpoint2         | hpt_shieldbooster_size0_class5           |      on |        2 | ShieldBooster_HeavyDuty G5 Q1 + special_shieldbooster_chunky         |
| TinyHardpoint3         | hpt_shieldbooster_size0_class5           |      on |        1 | ShieldBooster_Resistive G5 Q1 + special_shieldbooster_chunky         |
| TinyHardpoint4         | hpt_shieldbooster_size0_class5           |      on |        2 | ShieldBooster_Resistive G5 Q1 + special_shieldbooster_chunky         |
| TinyHardpoint5         | hpt_shieldbooster_size0_class5           |      on |        1 | ShieldBooster_Resistive G5 Q1 + special_shieldbooster_chunky         |
| TinyHardpoint6         | hpt_shieldbooster_size0_class5           |      on |        2 | ShieldBooster_Kinetic G5 Q1 + special_shieldbooster_chunky           |
| TinyHardpoint7         | hpt_shieldbooster_size0_class5           |      on |        2 | ShieldBooster_HeavyDuty G5 Q1 + special_shieldbooster_chunky         |
| TinyHardpoint8         | hpt_shieldbooster_size0_class5           |      on |        0 | ShieldBooster_HeavyDuty G5 Q1 + special_shieldbooster_chunky         |
| Armour                 | federation_corvette_armour_grade3        |       — |        — | Armour_HeavyDuty G5 Q1 + special_armour_chunky                       |
| PowerPlant             | int_powerplant_size8_class5              |       — |        — | PowerPlant_Boosted G5 Q1 + special_powerplant_cooled                 |
| MainEngines            | int_engine_size7_class5                  |      on |        0 | Engine_Dirty G5 Q1 + special_engine_overloaded                       |
| FrameShiftDrive        | int_hyperdrive_overcharge_size6_class3   |      on |        0 | FSD_LongRange G5 Q1 + special_fsd_heavy                              |
| LifeSupport            | int_lifesupport_size5_class2             |      on |        1 | Misc_LightWeight G5 Q1                                               |
| PowerDistributor       | int_powerdistributor_size8_class5        |      on |        1 | PowerDistributor_HighFrequency G5 Q1 + special_powerdistributor_fast |
| Radar                  | int_sensors_size8_class5                 |      on |        1 | Sensor_LongRange G5 Q1                                               |
| FuelTank               | int_fueltank_size5_class3                |       — |        — | —                                                                    |
| Slot01_Size7           | int_shieldgenerator_size7_class3_fast    |      on |        1 | ShieldGenerator_Thermic G5 Q1 + special_shield_regenerative          |
| Slot02_Size7           | int_shieldcellbank_size7_class5          |      on |        3 | ShieldCellBank_Specialised G4 Q1 + special_shieldcell_oversized      |
| Slot03_Size7           | int_shieldcellbank_size7_class5          |      on |        3 | ShieldCellBank_Specialised G4 Q1 + special_shieldcell_oversized      |
| Slot04_Size6           | int_fuelscoop_size6_class5               |      on |        4 | —                                                                    |
| Slot05_Size6           | int_fighterbay_size6_class1              |      on |        3 | —                                                                    |
| Slot06_Size5           | int_cargorack_size5_class1               |       — |        — | —                                                                    |
| Slot07_Size5           | int_guardianfsdbooster_size5             |      on |        3 | —                                                                    |
| Slot08_Size4           | int_fsdinterdictor_size4_class2          |      on |        4 | FSDinterdictor_Expanded G5 Q1                                        |
| Slot09_Size4           | int_fueltank_size4_class3                |       — |        — | —                                                                    |
| Slot10_Size3           | int_dronecontrol_collection_size3_class5 |      on |        3 | Misc_LightWeight G5 Q1                                               |
| Slot11_Size1           | int_dockingcomputer_advanced             |      on |        4 | —                                                                    |
| Military01             | int_hullreinforcement_size5_class2       |       — |        — | HullReinforcement_HeavyDuty G5 Q1 + special_hullreinforcement_chunky |
| Military02             | int_hullreinforcement_size5_class2       |       — |        — | HullReinforcement_HeavyDuty G5 Q1 + special_hullreinforcement_chunky |
| PlanetaryApproachSuite | int_planetapproachsuite_advanced         |       — |        — | —                                                                    |

Fixed cargo-hatch power: on, priority `4`.

</details>

## Measured alternatives

The remaining fixed overhead buys format selection, byte alignment, and a CRC-32. Shortening the
checksum would save only a few encoded characters while weakening corruption detection, so CRC-32
is retained deliberately. Engineering quality is invariant at `1` and omitted entirely.
Complement sets, repeated-module identities, and repeated ordinary engineering records are all
enabled only when their packed-bit cost comparison wins.

A general compression pass was also measured. The fair comparison compresses the body and then
appends the unchanged four-byte CRC:

| Build               | Bit-packed + CRC | Raw DEFLATE + CRC | Brotli + CRC |
| ------------------- | ---------------: | ----------------: | -----------: |
| Empty Sidewinder    |                8 |                10 |           12 |
| Stock Krait Mk II   |                7 |                 9 |           11 |
| Engineered Anaconda |               60 |                65 |           64 |

Both general-purpose compressors make every reference larger. The adopted arithmetic path is
different: it encodes the codec's existing semantic values against their exact cardinalities and is
selected only when its final padded body is smaller. With the quality-free grammar, it reduces the
Anaconda body from 56 to 55 bytes and produces 78 encoded characters including `b.`. The Corvette
body falls from 82 to 78 bytes and produces 108 characters. Empty, stock, festive, and every other
build where bit packing wins retain the packed form without a representation-bit penalty. Base70
still needs interoperability testing in the actual sharing applications. Its radix conversion uses
bounded byte/digit arithmetic rather than a whole-payload `BigInt`.

The adaptive combination-rank index-set mode leaves empty and stock references at 12 and 10
characters and remains part of the packed-cost grammar used before arithmetic rendering. A
fixed-width truncated-binary index evaluation saved at most one character and changed several
equally sized literals, so the combination rank was the stronger trade-off.

The compact metadata path reduced an ASCII `Astraea` / `TST-42` build from 31 to 27 characters, the
mixed `Astraea 星` / `TST-42` case from 36 to 35, and a longer ASCII example from 50 to 40. A
short Unicode-only example remained 17 characters. The tag itself costs no additional byte for
UTF-8 values shorter than 64 bytes. Doubling the tagged length does cross a varuint boundary at 64
bytes, however, so a 64–127-byte fallback value uses one more header byte than the untagged
encoding. Eligible metadata gains six-bit storage; other metadata preserves exact text with that
documented boundary cost.

An empty-loadout template was also tried. A dedicated flag shortened empty builds but enlarged
some small non-empty builds; using the reserved index-set code avoided that regression but changed
none of the 48 empty-hull data lengths because byte padding absorbed the saved bits. Neither form
is retained.

Engineering quality was subsequently made invariant across the application. Removing it from every
record, instead of adding another adaptive group header, leaves empty and stock references
unchanged while reducing the engineered Anaconda from 80 to 78 characters and the supplied
Corvette from 114 to 108.

Module-identity back-references, engineering-record back-references, index-set complements, and the
baseline-relative module layout are retained because they are selected only when their measured
cost is lower. Base70 uses underscore and comma but excludes dollar, tilde, asterisk, and plus.
Keeping an alphanumeric terminal digit prevents punctuation trimming without giving GitHub a pair
of dollar signs it could interpret as inline mathematics.

## Known limitations and integration work

The codec is currently a domain implementation, not the feature UI or complete URL lifecycle. It
does not update `location.hash`, manage browser history, import pasted links, or present localised
diagnostics. Those responsibilities belong to the sharing feature which consumes this format.

FR-028's other half is among them: SLEF has to be offered when a build cannot meet the limit, and
the offer is part of the sharing feature rather than the codec, which can only refuse. The same
feature owns whatever its deployed origin costs on top of a codec value — 23 characters on the
`https://ships.example/#` origin the tests use, against which the largest reference build spends
108 of its 500.

Almanac beta.12 models festive modules as fixed pre-engineered variants and exposes journal-shaped
modifier reconstruction for known fixed articles. The application does not reimplement or adjust
those values or ordinary blueprint arithmetic.
