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
- published versions and their game-data tables must remain decodable indefinitely;
- old tables must not accumulate in the application's initial JavaScript bundle; and
- malformed, corrupted, unsupported, or ambiguous input must fail instead of being guessed.

## Representation layers

The complete fragment is built in layers:

```text
#b.<encoded payload>
    │
    └─ Base70 digits with a Base62-only terminal digit
       └─ payload bytes: [versioned bitstream] [CRC-32, little-endian]
          └─ version 1: complete minimal build state, packed least-significant bit first
             └─ decoded and reconstructed through @elite-dangerous-almanac/core
```

The application hash marker `#` belongs to the URL and is not part of the codec value. Codec APIs
produce and accept `b.<encoded payload>`; the decoder also tolerates a leading `#` for integration
convenience.

### Outer envelope and version dispatch

`b.` permanently identifies the current Base70/Base62-terminal envelope. After decoding only that
generic radix layer, the asynchronous loader reads the first ten bits of the payload and dynamically
imports the matching codec implementation and JSON table.

The embedded version field has 1,024 values. Version `0` is reserved and version `1` is the sole
format defined before release. The remaining values are available for future immutable formats. A
compatible table or binary-layout change after release therefore keeps the `b.` prefix and
publishes a new immutable version.

A future prefix such as `c.` is appropriate only for an incompatible outer envelope that cannot be
decoded far enough to read the existing ten-bit version. Prefixes are protocol identifiers, not
release counters: once published, each prefix, version decoder, and table remains available for its
existing links.

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
the version-specific parser or the Almanac sees the data. The encoded portion after `b.` is limited
to 500 characters.

## Version 1 binary body

Fields are written least-significant bit first within each field and byte. The writer pads the final
partial byte with zero bits; the decoder rejects any non-zero or additional trailing data.

| Order | Field               | Representation                                                                |
| ----: | ------------------- | ----------------------------------------------------------------------------- |
|     1 | Codec version       | 10 bits; value `1`                                                            |
|     2 | Hull                | Fixed-width index into the pinned hull table                                  |
|     3 | Ship-name presence  | 1 bit                                                                         |
|     4 | Ship-ident presence | 1 bit                                                                         |
|     5 | Ship name           | When present: byte-length varuint followed by UTF-8 bytes                     |
|     6 | Ship ident          | When present: byte-length varuint followed by UTF-8 bytes                     |
|     7 | Pristine default    | 1 bit; when set, the hull's pinned stock loadout ends the body                |
|     8 | Module layout       | When non-pristine: cost-selected baseline or absolute outfittable modules     |
|     9 | Power states        | Explicit values for power-drawing modules and fixed components                |
|    10 | Engineering states  | Engineering presence, identities, grades, qualities, and experimental effects |
|    11 | Decorative states   | Decorated slot set followed by one pinned decorative `fdname` index per slot  |

The pristine marker describes the ordinary base: every module matches the pinned default and every
fitted module has absent power and ordinary/pre-engineered state. Decorative state follows that
base independently, so a decorated stock module keeps the pristine shortcut.

## Adaptive encodings

Each adaptive structure computes its exact bit cost before choosing a representation. Decoders
repeat that choice and reject any more expensive encoding, including non-preferred ties. This makes
the format canonical while allowing sparse and dense builds to use different layouts.

### Index sets

Slot sets are shared by module layout, power overrides, and engineering presence. A two-bit mode
selects one of three forms:

| Mode | Form             | Data                                                      |
| ---: | ---------------- | --------------------------------------------------------- |
|    0 | Bitmap           | One bit for every candidate                               |
|    1 | Included indexes | Count followed by strictly increasing fixed-width indexes |
|    2 | Excluded indexes | Count followed by the strictly increasing complement      |

Mode `3` is invalid. Equal-cost modes prefer bitmap, then included indexes, then excluded indexes.
The complement form is especially effective for nearly complete loadouts: all 38 outfittable
Anaconda slots can be represented as zero exclusions instead of a 38-bit occupancy map.

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

Decorative transformations are separate from ordinary engineering because they have no grade or
quality. A slot index set selects the decorated fitted modules, followed by each pinned decorative
`fdname`. The decoder applies each identity to only its selected slot through the Almanac's
supported loadout operation; it never rebuilds unrelated modules through journal modifier arrays.
The package's observed module list is not treated as an allowlist: any pinned transformation whose
modifiers the Almanac can resolve completely for the fitted module is accepted.

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

Ship name and ident use strict UTF-8. The encoder rejects ill-formed UTF-16 such as lone surrogates,
and the decoder rejects malformed UTF-8 rather than replacing it with U+FFFD.

## Reconstruction and validation

The decoder creates the minimal loadout event, then reconstructs ordinary engineering through
`ShipLoadout.applyBlueprint()`. That Almanac operation regenerates the journal modifier array and
all effective module statistics from blueprint, grade, quality, and experimental effect.
Pre-engineered modifiers are likewise obtained from the Almanac's supported resolver.
Decorative transformations are applied through the Almanac's slot-level operation, preserving the
already reconstructed state of every unrelated module and emitting no invented grade or quality.

Calculated module values, hull value, aggregate module value, rebuy, and modifier arrays are never
link state. Catalogue prices are recalculated by the Almanac when exporting SLEF. A captured
purchase price or other provenance belongs in a SLEF document, not a build link.

Validation occurs at every layer:

1. Check the permanent envelope prefix and encoded-length bound.
2. Decode and canonically re-encode the Base70/Base62-terminal text.
3. Verify CRC-32 before parsing the body.
4. Select an immutable decoder from the ten-bit version.
5. Parse a table-indexed intermediate representation while validating every identity, contextual
   candidate, mode, range, count, and ordered index.
6. Reject non-zero padding and trailing data.
7. Canonically reserialise that intermediate representation and require the exact original body.
8. Only after protocol validation, reconstruct the `ShipLoadout` through the Almanac.

Canonicality therefore depends only on the immutable decoder and tables, not on Almanac object
normalisation. Corruption tests also exercise re-checksummed body mutations so structurally valid
but non-canonical alternatives cannot bypass the CRC check. Almanac reconstruction fidelity remains
a separately tested compatibility property.

## Versioned tables and lazy loading

Version 1 uses immutable JSON generated from
`@elite-dangerous-almanac/core@0.1.0-beta.7`. The table pins hulls, hull-specific outfittable slots,
fixed components, stock modules, module identities, blueprints and their grades, experimental
effects, decorative identities, contextual candidate sets, power-drawing module identities, and
pre-engineered identities. Stable game identities originate from the package; indexes exist only
inside this version's frozen wire table. Before the first release it can be regenerated with
`pnpm run codec:tables`. After release, a catalogue change publishes a new codec version, decoder,
and JSON file while retaining the earlier version unchanged.

The public asynchronous loader imports only the generic radix code initially. Encoding dynamically
loads the current codec. Decoding obtains the version from the first two payload bytes and imports
the sole matching implementation and table. Future versions can retain this dispatch without
placing every historical table in the initial bundle.

The current application dependency is exactly pinned to Almanac `0.1.0-beta.7`. Every future
Almanac upgrade must pass the frozen literal-link reconstruction corpus. Those literals are protocol
fixtures and must never be regenerated merely to make an upgrade pass; an incompatible upgrade
requires retaining a compatible reconstruction path for the affected codec version.

## Reference corpus

The fixed corpus currently produces these encoded data lengths. Each value and length includes the
`b.` protocol prefix:

| Reference build               | Base70 encoded data                                                                                                        | Data length |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------: |
| Empty Sidewinder              | `b.21B7zk:1Zz`                                                                                                             |          12 |
| Stock Krait Mk II             | `b.vz,jdQ_4`                                                                                                               |          10 |
| Decorative flak Krait         | `b.7pRwpmneNRBGzeI`                                                                                                        |          17 |
| Full engineered Anaconda*     | `b.13CwRAylKDDE1INC0JR96D3Kmyo!u4FKqe/TLGEQfXt6azZWV3jjGJAlpaakay6LK-k@,b,8cIqRF4errK`                                     |          84 |
| Supplied engineered Corvette† | `b.AphGgXEP9!tHU4OsP8_QG6u3RRXyHQXxGHTY5fSB@rgT3x4M8iuL-IjiCwfvNmBUAkhF8QdaAdush_Y6id.X6.VsIYnfHgKSWTcM6,6kTjIIMdZrCXdnMh` |         120 |

\* All 38 outfittable slots are occupied, all 29 engineerable modules are engineered, and the
fixed cargo hatch has an explicit power state.

† All 37 outfittable modules present in the supplied journal event are represented, plus the fixed
cargo hatch's power state. Sixteen cosmetic and livery slots are outside the outfitting feature's
scope and are not part of the codec model. Identifying ship metadata and all calculated, health,
ammo, engineer, localisation, and purchase fields were removed from the checked-in reference.

The every-hull baseline corpus covers empty and stock configurations for all 48 catalogue hulls.
Its longest encoded value is 12 characters (the alphabetical tie-break reports the Adder). The
decorative literal covers an otherwise unengineered Krait Mk II whose medium hardpoint carries a
festive green flak launcher, including the package-resolved damage modifier. The sanitised real
engineered Federal Corvette produces 120 characters of encoded data. It is a preservation fixture:
one small hardpoint records a partial quality even though its modifier values match the completed
grade-5 roll. The codec preserves that captured quality exactly; the fixture is not treated as an
independent oracle for effective-stat reconstruction.

Compact minimal JSON plus raw DEFLATE is unsuitable for this data model. The same engineered
Anaconda produced about 1,167 characters of encoded data; the specialised codec produces 84,
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

A general compression pass was also measured after these changes. The fair comparison compresses
the body and then appends the unchanged four-byte CRC:

| Build               | Current bytes | Raw DEFLATE + CRC | Brotli + CRC |
| ------------------- | ------------: | ----------------: | -----------: |
| Empty Sidewinder    |             8 |                10 |           12 |
| Stock Krait Mk II   |             7 |                 9 |           11 |
| Engineered Anaconda |            63 |                68 |           67 |

Both compressors make every reference larger. At 84 encoded characters for the largest synthetic
reference and 120 for the sanitised real build, a second compression path is not a reasonable
trade-off. Base70 still needs interoperability testing in the actual sharing applications. Its
radix conversion uses bounded byte/digit arithmetic rather than a whole-payload `BigInt`.

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

Almanac beta.7 supplies the package-owned decorative modifier resolver delivered for
[issue 260](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/260) and the grade-less,
slot-level loadout operation delivered for
[issue 264](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/264). Neither decorative
values nor ordinary blueprint arithmetic is reimplemented or adjusted by the application.
