# Contract: the equipment link, amended for held content

The format is specified in [`docs/equipment-link-codec.md`](../../../docs/equipment-link-codec.md)
and implemented at `src/app/domain/equipment/loadout-link/`. This contract freezes the one change
this feature makes to it, and what does not change.

## The change

**Every loadout writes the catalogue's widest mount set, not the selected suit's.**

| Before                                                            | After                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| one mount field per mount `SUIT_MOUNTS` gives the encoded suit    | one mount field per key in `MOUNTS`, the catalogue's whole mount set |
| `loadout.weapons.length !== mounts.length` is `invalidPayload`    | `loadout.weapons.length !== MOUNT_SLOTS` is `invalidPayload`         |
| a weapon on a mount the suit does not offer cannot be represented | it is held content, and round-trips                                  |

`MOUNTS` joins the table beside `MODIFICATION_SLOTS`: every distinct `PersonalMount.key` across
`SUITS`, in the game's own order — `PrimaryWeapon1`, `PrimaryWeapon2`, `SecondaryWeapon`. A mount
field's position in the payload is its position in that list, and `MOUNT_SLOTS` is its length.

**These are Frontier's own keys**, published on `Suit.mounts` since Almanac 0.2.9 ([#24](https://github.com/DarkSession/Elite-Dangerous-Almanac/issues/24)).
The positional names this format reserved — `primary1`, `primary2`, `secondary1` — are withdrawn,
and with them the one departure from constitution II this feature had recorded: a mount is now
addressed by the game's slot key like a ship's, not by an index.

## What each mount field still refuses

Unchanged from the committed codec, and applied per mount rather than per offered mount:

- a weapon whose `PersonalWeapon.slot` is not the mount's kind — a rifle on `secondary1` — is
  `invalidPayload`, whether the mount is offered or held;
- a grade the weapon does not publish is `invalidPayload`;
- a recipe outside `WEAPON_MODIFICATION_SETS` for that weapon is `invalidPayload`;
- a recipe the release does not publish at all is `unknownIdentity`;
- one recipe fitted twice on one item is `invalidPayload`;
- a modification in a slot the item's own grades never unlock — the Flight Suit, per `SUIT_SLOTS` —
  is `invalidPayload`.

A held weapon is checked against the **mount**, never against the selected suit. Holding is what the
format now expresses; a loadout the game could never produce is still refused.

## What does not change

- the `e.` prefix, the 500-character bound, the Base70 alphabet, the CRC-32 envelope and the bit
  packer, all of which live in `src/app/domain/build-link/` and are shared with the ship codec;
- ten bits of table version first;
- all four modification fields written for every item, held or locked or neither;
- one spelling per loadout — the addressed-slot rule and the fixed mount count together leave no
  second way to say anything;
- nothing the library can answer is carried: stats, resistances, firepower, material requirements
  and upgrade costs are recomputed from identities on the way back in.

## Table version

Table 1 is **regenerated in place** with `pnpm run codec:tables:equipment -- --overwrite`, and its
pinned content hash in `equipment-link-codec.spec.ts` is updated in the same change. This is sound
for exactly as long as no link has been published, which
[`docs/equipment-link-codec.md`](../../../docs/equipment-link-codec.md) states is true until the
bench's first release — nothing imports the codec today. The first published link ends the rule, and
every later change is a new table number with the old file kept.

## Size

The largest loadout the catalogue can state grows by two empty mount fields when the suit offers
fewer than three: eight bits. The Flight Suit with nothing on it goes from 35 to 43 bits. The
Dominator at grade 5 with every mount and slot filled is unchanged at 112 bits, 25 characters,
against a bound of 500. No capacity script is warranted.

## Refusal wording

Both codecs raise `BuildLinkCodecError` with the same codes. `link-error.mapper.ts` selects the
message by the envelope that refused, because two codes read wrongly for equipment:

| Code              | Ship wording (unchanged)                  | Equipment wording                                                    |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `unknownIdentity` | names a hull or module not available here | names a suit, weapon or modification this version does not have      |
| `invalidPayload`  | describes a build that cannot be made     | describes a loadout a Commander could not assemble, naming the mount |

Every refusal that names a mount names it through `getPersonalMountName`, which is the library's
text like every other game noun. `PrimaryWeapon1` never reaches a screen (FR-021, constitution VI).

## Round-trip obligation

For every loadout the bench can assemble — including one holding weapons on unoffered mounts and
modifications in locked slots — `decode(encode(loadout))` is that loadout, field for field (SC-005).
The committed suite's absolute-encoding fixtures are extended with held content rather than replaced
by a round-trip sweep.
