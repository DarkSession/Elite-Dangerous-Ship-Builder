import { RawBitReader, RawBitWriter } from '../../build-link/build-link-bits';
import { BuildLinkCodecError } from '../../build-link/build-link-codec-error';
import type { LinkEnvelope } from '../../build-link/build-link-envelope';
import { decodeLinkBody, encodeLinkBody } from '../../build-link/build-link-envelope';
import type {
  EquipmentLoadout,
  FittedPersonalWeapon,
  ModificationSlots,
} from './equipment-loadout';
import table from './equipment-link-table-1.json';

/**
 * The equipment builder's link codec.
 *
 * A codec of its own, and separate for one reason: a fragment claims itself by
 * its prefix, so `e.` says which tool minted a value and a ship link is never
 * offered to this decoder or the other way round. What the two share is
 * everything below the format — the Base70 alphabet, the CRC envelope and the
 * bit packer — which lives in `domain/build-link`.
 *
 * The body is bit-packed. The ship builder codes its own arithmetically because
 * a fully engineered hull is hundreds of choices; a loadout is a suit, at most
 * three weapons and their modification slots, and packs into a handful of bytes
 * without it.
 *
 * Every identity is a position in `equipment-link-table-1.json`, which is
 * generated from the package and pinned by content hash: an index means what
 * the table version inside the payload says it means, whichever release is
 * installed (`scripts/generate-equipment-link-codec-tables.mjs`).
 *
 * The 500-character bound is what the application will attempt to read from a
 * fragment at all, and this format uses a twentieth of it. It bounds what may
 * be tried; it is not a budget the format was drawn against.
 */
const EQUIPMENT_LINK_ENVELOPE: LinkEnvelope = { prefix: 'e.', maxCharacters: 500 };

const TABLE_VERSION_BITS = 10;
const CURRENT_TABLE_VERSION = table.$generated.tableVersion;
const MODIFICATION_SLOTS = table.MODIFICATION_SLOTS;

/** What a refusal names when it is about the suit itself rather than a mount. */
const SUIT_MOUNT = 'suit';

/** How many bits it takes to name one of `count` things. */
function bitsFor(count: number): number {
  let bits = 1;
  while (2 ** bits < count) bits += 1;
  return bits;
}

const SUIT_BITS = bitsFor(table.SUITS.length);
const WEAPON_BITS = bitsFor(table.WEAPONS.length + 1);
const GRADE_BITS = bitsFor(
  Math.max(...table.SUIT_GRADES.flat(), ...table.WEAPON_GRADES.flat()) + 1,
);
const SUIT_MODIFICATION_BITS = bitsFor(table.SUIT_MODIFICATIONS.length + 1);
const WEAPON_MODIFICATION_BITS = bitsFor(table.WEAPON_MODIFICATIONS.length + 1);

/** Encode a loadout as the fragment that restores it. */
export function encodeEquipmentLinkFragment(loadout: EquipmentLoadout): string {
  const suitIndex = table.SUITS.indexOf(loadout.suitFamily);
  if (suitIndex < 0) {
    throw unknownIdentity(`No suit is named ${loadout.suitFamily}.`, SUIT_MOUNT);
  }

  const writer = new RawBitWriter();
  writer.writeBits(CURRENT_TABLE_VERSION, TABLE_VERSION_BITS);
  writer.writeBits(suitIndex, SUIT_BITS);
  writer.writeBits(
    publishedGrade(loadout.suitGrade, table.SUIT_GRADES[suitIndex]!, SUIT_MOUNT),
    GRADE_BITS,
  );
  writeModifications(
    writer,
    loadout.suitModifications,
    table.SUIT_MODIFICATIONS.map((_, index) => index),
    SUIT_MODIFICATION_BITS,
    table.SUIT_MODIFICATIONS,
    SUIT_MOUNT,
  );

  const mounts = mountNames(suitIndex);
  if (loadout.weapons.length !== mounts.length) {
    throw invalidPayload(
      `The suit offers ${mounts.length} mounts and the loadout names ${loadout.weapons.length}.`,
      null,
    );
  }

  for (const [position, mount] of mounts.entries()) {
    const fitted = loadout.weapons[position] ?? null;
    if (fitted === null) {
      writer.writeBits(0, WEAPON_BITS);
      continue;
    }

    const weaponIndex = table.WEAPONS.indexOf(fitted.symbol);
    if (weaponIndex < 0) {
      throw unknownIdentity(`No handheld weapon is named ${fitted.symbol}.`, mount);
    }
    const kind = mountKind(mount);
    if (table.WEAPON_MOUNTS[weaponIndex] !== kind) {
      throw invalidPayload(`${fitted.symbol} does not fit a ${kind} mount.`, mount);
    }

    writer.writeBits(weaponIndex + 1, WEAPON_BITS);
    writer.writeBits(
      publishedGrade(fitted.grade, table.WEAPON_GRADES[weaponIndex]!, mount),
      GRADE_BITS,
    );
    writeModifications(
      writer,
      fitted.modifications,
      table.WEAPON_MODIFICATION_SETS[weaponIndex]!,
      WEAPON_MODIFICATION_BITS,
      table.WEAPON_MODIFICATIONS,
      mount,
    );
  }

  return encodeLinkBody(writer.toUint8Array(), EQUIPMENT_LINK_ENVELOPE);
}

/** Restore the loadout a fragment carries, or refuse it. */
export function decodeEquipmentLinkFragment(fragment: string): EquipmentLoadout {
  const body = decodeLinkBody(fragment, EQUIPMENT_LINK_ENVELOPE);
  const reader = new RawBitReader(body);

  const tableVersion = reader.readBits(TABLE_VERSION_BITS);
  if (tableVersion !== CURRENT_TABLE_VERSION) {
    throw new BuildLinkCodecError(
      'unsupportedTableVersion',
      `Equipment-link table version ${tableVersion} is not supported.`,
    );
  }

  const suitIndex = reader.readBits(SUIT_BITS);
  const suitFamily = table.SUITS[suitIndex];
  // Unreachable while the suit field is exactly wide enough for the table: four
  // suits in two bits leaves no index to miss on. Kept because the width and the
  // table length are free to diverge, and because the type is optional.
  if (suitFamily === undefined) {
    throw unknownIdentity('The link names a suit that is not available here.', SUIT_MOUNT);
  }
  const suitGrade = readGrade(reader, table.SUIT_GRADES[suitIndex]!, SUIT_MOUNT);
  const suitModifications = readModifications(
    reader,
    table.SUIT_MODIFICATIONS.map((_, index) => index),
    SUIT_MODIFICATION_BITS,
    table.SUIT_MODIFICATIONS,
    SUIT_MOUNT,
  );

  const weapons = mountNames(suitIndex).map((mount) => readWeapon(reader, mount));

  if (!reader.done) {
    throw invalidPayload('The equipment-link payload carries trailing data.', null);
  }
  return { suitFamily, suitGrade, suitModifications, weapons };
}

function readWeapon(reader: RawBitReader, mount: string): FittedPersonalWeapon | null {
  const value = reader.readBits(WEAPON_BITS);
  if (value === 0) return null;

  const weaponIndex = value - 1;
  const symbol = table.WEAPONS[weaponIndex];
  if (symbol === undefined) {
    throw unknownIdentity('The link names a handheld weapon that is not available here.', mount);
  }
  const kind = mountKind(mount);
  if (table.WEAPON_MOUNTS[weaponIndex] !== kind) {
    throw invalidPayload(`${symbol} does not fit a ${kind} mount.`, mount);
  }
  return {
    symbol,
    grade: readGrade(reader, table.WEAPON_GRADES[weaponIndex]!, mount),
    modifications: readModifications(
      reader,
      table.WEAPON_MODIFICATION_SETS[weaponIndex]!,
      WEAPON_MODIFICATION_BITS,
      table.WEAPON_MODIFICATIONS,
      mount,
    ),
  };
}

/**
 * The suit's mounts, in the order a loadout lists them, named rather than
 * numbered so a refusal can say which one it is about
 * (`EquipmentLoadout.weapons` for the gap this stands in for).
 */
function mountNames(suitIndex: number): readonly string[] {
  const [primary, secondary] = table.SUIT_MOUNTS[suitIndex]!;
  return [
    ...Array.from({ length: primary! }, (_, position) => `primary${position + 1}`),
    ...Array.from({ length: secondary! }, (_, position) => `secondary${position + 1}`),
  ];
}

/** Which kind of weapon a mount takes, as `PersonalWeapon.slot` names it. */
function mountKind(mount: string): string {
  return mount.startsWith('primary') ? 'primary' : 'secondary';
}

/** A grade the item publishes, refused where it does not publish it. */
function publishedGrade(grade: number, published: readonly number[], mount: string): number {
  if (!published.includes(grade)) {
    throw invalidPayload(`Grade ${grade} is not published for this item.`, mount);
  }
  return grade;
}

function readGrade(reader: RawBitReader, published: readonly number[], mount: string): number {
  return publishedGrade(reader.readBits(GRADE_BITS), published, mount);
}

/**
 * One field per modification slot, in slot order.
 *
 * Every slot is written whether or not it holds anything, because which slot a
 * modification is in is part of what the loadout says (`equipment-loadout.ts`,
 * `ModificationSlots`). It is also what leaves the format one spelling for one
 * loadout: there is no second way to say which slot is empty.
 *
 * `available` is the recipes this item can take, which is the whole list for a
 * suit and the weapon's own set for a weapon: Greater Range, Headshot Damage
 * and Improved Hip Fire Accuracy are three recipes each, one per damage
 * technology, and the package settles which one a weapon takes. A recipe this
 * release does not publish at all is an unknown identity; one it publishes for
 * other weapons is a payload this item cannot hold, the same refusal as a rifle
 * on a sidearm mount.
 */
function writeModifications(
  writer: RawBitWriter,
  slots: ModificationSlots,
  available: readonly number[],
  width: number,
  recipes: readonly string[],
  mount: string,
): void {
  if (slots.length !== MODIFICATION_SLOTS) {
    throw invalidPayload(
      `An item has ${MODIFICATION_SLOTS} modification slots and the loadout names ${slots.length}.`,
      mount,
    );
  }

  for (const symbol of slots) {
    if (symbol === null) {
      writer.writeBits(0, width);
      continue;
    }
    const index = recipes.indexOf(symbol);
    if (index < 0) {
      throw unknownIdentity(`No modification is named ${symbol}.`, mount);
    }
    if (!available.includes(index)) {
      throw invalidPayload(`This item does not take ${symbol}.`, mount);
    }
    writer.writeBits(index + 1, width);
  }
  refuseRepeats(slots, mount);
}

function readModifications(
  reader: RawBitReader,
  available: readonly number[],
  width: number,
  recipes: readonly string[],
  mount: string,
): ModificationSlots {
  const slots = Array.from({ length: MODIFICATION_SLOTS }, () => {
    const value = reader.readBits(width);
    if (value === 0) return null;
    const index = value - 1;
    const symbol = recipes[index];
    if (symbol === undefined) {
      throw unknownIdentity('The link names a modification that is not available here.', mount);
    }
    if (!available.includes(index)) {
      throw invalidPayload('The link fits a modification this item does not take.', mount);
    }
    return symbol;
  });
  refuseRepeats(slots, mount);
  return slots;
}

/** One recipe is fitted once. Two slots holding it is not a loadout the game can hold. */
function refuseRepeats(slots: ModificationSlots, mount: string): void {
  const fitted = slots.filter((symbol) => symbol !== null);
  if (new Set(fitted).size !== fitted.length) {
    throw invalidPayload('An item holds the same modification twice.', mount);
  }
}

function invalidPayload(message: string, slot: string | null): BuildLinkCodecError {
  return new BuildLinkCodecError('invalidPayload', message, { slot });
}

function unknownIdentity(message: string, slot: string | null): BuildLinkCodecError {
  return new BuildLinkCodecError('unknownIdentity', message, { slot });
}
