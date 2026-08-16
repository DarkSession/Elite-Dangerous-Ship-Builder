# Build-link codec

## Purpose

The build-link codec serialises the smallest non-derivable representation of a ship loadout into a
URL fragment. It is an application-owned interchange format for sharing builds; it is not a second
implementation of SLEF.

SLEF import, build reconstruction, calculated statistics, and SLEF export remain the responsibility
of `@elite-dangerous-almanac/core`. The codec carries only the state needed to reconstruct the same
loadout: hull, optional ship labels, outfittable module identities, explicit power settings, and
engineering choices. Fixed components such as the cargo hatch are implied by the hull; only their
variable power state is carried. The codec deliberately omits calculated values, catalogue and
purchase prices, aggregate module value, hull value, rebuy, health, and ammunition.

The format is designed around these constraints:

- links must remain compact for empty, stock, and fully engineered ships;
- every accepted link must decode deterministically and losslessly;
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
the table-indexed parser or the Almanac sees the data. The encoded portion after `b.` is limited
to 500 characters.

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
|    10 | Engineering states  | Engineering presence, identities, grades, qualities, and experimental effects   |

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

Each adaptive structure computes its exact bit cost before choosing a representation. Decoders
repeat that choice and reject any more expensive encoding, including non-preferred ties. This makes
the format canonical while allowing sparse and dense builds to use different layouts.

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
rank. Here `n` is the candidate count and `k` is the selected count. A zero-bit rank represents the
only possible subset when `C(n,k) = 1`. The combination count for the largest 38-slot hull remains a
safe JavaScript integer. The generic arithmetic primitive can encode any safe-integer cardinality
without narrowing it to 32 bits, but the shared index-set grammar deliberately makes mode 3
eligible only when its bit-packed rank fits in at most 31 bits. Both canonical candidates must
render the same logical grammar, and with the pinned maximum of 38 slots any wider rank already
loses to the bitmap after including its count. The decoder rejects such a mode before reading its
rank. The complement form is especially
effective for nearly complete loadouts: all 38 outfittable Anaconda slots can be represented as
zero exclusions instead of a 38-bit occupancy map.

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
- a grade, with the common maximum grade represented by one bit;
- an exact quality value; and
- an optional experimental effect, normally constrained to the module's candidate set.

Pre-engineered records use a pinned contextual identity composed from module, blueprint, grade, and
acquisition method. The pinned default experimental effect is implied unless explicitly changed.
Their quality is still encoded, while their modifier arrays are not.

Almanac beta.8 publishes modifier signatures for 54 fixed variants, which makes those articles
identifiable and shareable. Its 22 Mercenary-system variants have no published modifier signatures;
Almanac reports those fitted modules as unidentified, so the codec rejects them rather than
re-deriving a package result from blueprint metadata.

Festive launchers are normal fixed pre-engineered variants in the Almanac model. They therefore use
the same contextual pre-engineered identity as every other fixed article; the codec has no separate
decorative state or application-specific modifier resolver.

### Scalar values

Engineering quality is constrained to the inclusive range from `0` to `1` and uses four canonical
forms:

| Value                            | Representation                                     |
| -------------------------------- | -------------------------------------------------- |
| `1`                              | 1 bit                                              |
| `0`                              | 2 bits                                             |
| Exact interior four-decimal SLEF | 3 flag bits plus a 14-bit integer scaled by 10,000 |
| Other exact JavaScript value     | 3 flag bits plus a float64 escape                  |

The float64 escape preserves non-SLEF callers losslessly. The decoder rejects an escaped value that
has a shorter canonical fixed-point form, and rejects fixed-point encodings of the two endpoints.

Ship name and ident use a tagged varuint header. In compact form, the header is
`2 * character count + 1`, followed by one six-bit index per character into this exact ordered
alphabet:

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -
```

Every other value uses strict UTF-8: its header is `2 * UTF-8 byte count`, followed by that many
bytes. Thus an odd header identifies compact character count and an even header identifies UTF-8
byte count. The encoder rejects ill-formed UTF-16 such as lone surrogates, and the decoder rejects
malformed UTF-8 rather than replacing it with U+FFFD. It also rejects a UTF-8 spelling when every
decoded character belongs to the compact alphabet, because that spelling is non-canonical.

## Reconstruction and validation

The decoder creates the minimal loadout event, then reconstructs ordinary engineering through
`ShipLoadout.applyBlueprint()`. That Almanac operation regenerates the journal modifier array and
all effective module statistics from blueprint, grade, quality, and experimental effect.
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

## Versioned tables and lazy loading

Table 1 is the immutable `codec-table-1.json`, generated from
`@elite-dangerous-almanac/core@0.1.0-beta.8`. It pins hulls, hull-specific outfittable slots,
fixed components, stock modules, module identities, blueprints and their grades, experimental
effects, contextual candidate sets, power-drawing module identities, and pre-engineered identities.
Stable game identities originate from the package; indexes exist only
inside the selected frozen table. Before the first release, table 1 can be regenerated with
`pnpm run codec:tables`. After release, a catalogue change publishes the next numbered JSON table
while retaining every earlier table unchanged; it does not duplicate or version the codec logic.

The public asynchronous loader initially imports only the generic envelope, radix, and CRC code.
It verifies integrity before using the table-version field. Encoding dynamically loads the shared
codec and current table. Decoding then imports only the matching JSON file alongside the shared
codec. Adding table snapshots to the loader therefore does not place every historical table in the
initial bundle.

The current application dependency is exactly pinned to Almanac `0.1.0-beta.8`. Every future
Almanac upgrade must pass the frozen literal-link reconstruction corpus. Those literals are protocol
fixtures and must never be regenerated merely to make an upgrade pass. Frozen tables preserve
protocol interpretation, but full `ShipLoadout` reconstruction also depends on compatible Almanac
identities and behaviour; an incompatible upgrade requires retaining a compatible reconstruction
path for the affected table version.

## Reference corpus

The fixed corpus currently produces these encoded data lengths. Each value and length includes the
`b.` protocol prefix:

| Reference build               | Base70 encoded data                                                                                                  | Data length |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------: |
| Empty Sidewinder              | `b.21B7zk:1Zz`                                                                                                       |          12 |
| Stock Krait Mk II             | `b.vz,jdQ_4`                                                                                                         |          10 |
| Festive flak Krait            | `b.eXcP/8q9Kv9i`                                                                                                     |          14 |
| Full engineered Anaconda*     | `b.25b5dRYu7rn.aOZ84kdGWEwCnDyLUBm3l.l6hx0nnmZhXXN@VTHDZSvOZ2hRWc.T0WG!P1V87u2Chb`                                   |          80 |
| Supplied engineered Corvette† | `b.1fS.w,QYTD@6C@euGl/xHC3xdSJdr_IK-E7404@cI:778Ms,DzYtn/!gk,Ei0YHT7vg27GLnj38AzCh2P@67y/Cnp2,uhN/U-QjW160,rrnvyuOT` |         114 |

\* All 38 outfittable slots are occupied, all 29 engineerable modules are engineered, and the
fixed cargo hatch has an explicit power state.

† All 37 outfittable modules present in the supplied journal event are represented, plus the fixed
cargo hatch's power state. Sixteen cosmetic and livery slots are outside the outfitting feature's
scope and are not part of the codec model. Identifying ship metadata and all calculated, health,
ammo, engineer, localisation, and purchase fields were removed from the checked-in reference.

The every-hull baseline corpus covers empty and stock configurations for all 48 catalogue hulls.
Its longest encoded value is 12 characters (the alphabetical tie-break reports the Adder). The
festive literal covers an otherwise unengineered Krait Mk II whose medium hardpoint carries a
package-owned green flak-launcher variant. The sanitised real
engineered Federal Corvette produces 114 characters of encoded data. It is a preservation fixture:
one small hardpoint records a partial quality even though its modifier values match the completed
grade-5 roll. The codec preserves that captured quality exactly; the fixture is not treated as an
independent oracle for effective-stat reconstruction.

Compact minimal JSON plus raw DEFLATE is unsuitable for this data model. The same engineered
Anaconda produced about 1,167 characters of encoded data; the specialised codec produces 80,
including its `b.` prefix.

## Complete reference build definitions

These definitions list every field the codec models. Tables contain outfittable modules; the fixed
cargo hatch is listed separately because only its power state is variable. `—` means the optional
value is absent; it is different from an explicit `on`, `off`, or priority `0`. Calculated modifier
arrays are deliberately not repeated because the decoder rebuilds them through the Almanac.

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
| SmallHardpoint2        | hpt_multicannon_gimbal_small             |      on |        2 | Weapon_HighCapacity G5 Q0.9438 + special_emissive_munitions          |
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
checksum would save only a few encoded characters while weakening corruption detection. The
four-decimal quality representation is exact for real SLEF exports and retains a float escape rather
than quantising exceptional values. Complement sets, repeated-module identities, and repeated
ordinary engineering records are all enabled only when their exact bit-cost comparison wins.

A general compression pass was also measured. The fair comparison compresses the body and then
appends the unchanged four-byte CRC:

| Build               | Bit-packed + CRC | Raw DEFLATE + CRC | Brotli + CRC |
| ------------------- | ---------------: | ----------------: | -----------: |
| Empty Sidewinder    |                8 |                10 |           12 |
| Stock Krait Mk II   |                7 |                 9 |           11 |
| Engineered Anaconda |               62 |                67 |           66 |

Both general-purpose compressors make every reference larger. The adopted arithmetic path is
different: it encodes the codec's existing semantic values against their exact cardinalities and is
selected only when its final padded body is smaller. It reduces the Anaconda body from 58 to 56
bytes and its encoded data from 82 to 80 characters. The Corvette body falls from 86 to 82 bytes
and its encoded data from 119 to 114 characters. Empty, stock, festive, and every other build where
bit packing wins retain the packed form without a representation-bit penalty. Base70 still needs
interoperability testing in the actual sharing applications. Its radix conversion uses bounded
byte/digit arithmetic rather than a whole-payload `BigInt`.

The adaptive combination-rank index-set mode leaves empty and stock references at 12 and 10
characters, while reducing the bit-packed engineered Anaconda from 84 to 82 and the supplied
Corvette from 120 to 119. Arithmetic coding then produces the 80- and 114-character canonical
forms above. A fixed-width truncated-binary index evaluation saved at most one
character and changed several equally sized literals, so the combination rank was the stronger
trade-off.

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

Engineering already gives a blueprint's maximum grade and quality `1` their shortest individual
forms. Making those defaults global to the engineered set was also evaluated. Because repeated
engineering records are already back-references, it saves only about 20 to 23 bits on the dense
references—roughly three Base70 characters before the additional group-mode signalling. That gain
does not justify coupling every engineering record to another adaptive group header.

Module-identity back-references, engineering-record back-references, index-set complements, and the
baseline-relative module layout are retained because they are selected only when their measured
cost is lower. Base70 uses underscore and comma but excludes dollar, tilde, asterisk, and plus.
Keeping an alphanumeric terminal digit prevents punctuation trimming without giving GitHub a pair
of dollar signs it could interpret as inline mathematics.

## Known limitations and integration work

The codec is currently a domain implementation, not the feature UI or complete URL lifecycle. It
does not update `location.hash`, manage browser history, import pasted links, or present localised
diagnostics. Those responsibilities belong to the sharing feature which consumes this format.

Almanac beta.8 models festive modules as fixed pre-engineered variants and exposes journal-shaped
modifier reconstruction for known fixed articles. The application does not reimplement or adjust
those values or ordinary blueprint arithmetic.
