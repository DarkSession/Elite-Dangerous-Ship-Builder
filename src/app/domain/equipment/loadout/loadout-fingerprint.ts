import type { EquipmentLoadout } from '../loadout-link/equipment-loadout';
import { toStoredLoadout } from './stored-loadout.serializer';

/**
 * A fingerprint of the choices a loadout carries.
 *
 * Taken over the stored form, so it changes when — and only when — something a
 * Commander decided changed. Every figure the bench states is asked of the
 * package on read and none of them is stored, so a package upgrade moves what
 * the bench says and does not move this.
 *
 * It is the same value the record holds, which is what lets an unnamed record
 * already holding this loadout be taken over rather than copied
 * (`record-fingerprint.ts`, 001/FR-008).
 *
 * An opaque comparison value, never a game identity and never stored as one:
 * the only question it answers is "is this the same loadout as the baseline".
 */
export function loadoutFingerprint(loadout: EquipmentLoadout): string {
  return JSON.stringify(toStoredLoadout(loadout));
}
