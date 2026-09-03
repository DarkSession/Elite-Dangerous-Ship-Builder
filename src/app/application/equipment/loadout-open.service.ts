import { Injectable, inject } from '@angular/core';
import { isEquipmentRecord } from '../../domain/records/local-record';
import { reconstructLoadout } from '../../domain/equipment/loadout/loadout-reconstructor';
import { RecordMigrationService } from '../../platform/storage/record-migration.service';
import { LoadoutStore } from './loadout.store';

/** What happened when a stored loadout was opened onto the bench. */
export type LoadoutOpenResult =
  { readonly ok: true } | { readonly ok: false; readonly reason: string };

/**
 * Opening a saved loadout onto the bench.
 *
 * The ship tool's `RecordOpenService` with the bench's own two steps: the
 * shared open path decodes, migrates and rebuilds through the package, and only
 * a loadout that survived all of that reaches the store. A record naming a suit,
 * weapon or recipe this Almanac no longer carries is refused whole, the bench
 * keeps what is on it, and the stored bytes are left exactly as they were
 * (FR-019).
 *
 * Opening writes nothing to the record. What is remembered is which save the
 * open loadout belongs to, so the save layer can offer to replace it.
 */
@Injectable({ providedIn: 'root' })
export class LoadoutOpenService {
  readonly #migration = inject(RecordMigrationService);
  readonly #store = inject(LoadoutStore);

  open(recordId: string): LoadoutOpenResult {
    const opened = this.#migration.open(recordId);
    if (!opened.ok) {
      return { ok: false, reason: opened.reason };
    }

    const record = opened.record;
    if (!isEquipmentRecord(record)) {
      return { ok: false, reason: 'This record is a ship build, and belongs to the ship tool.' };
    }

    // The migration service has already rebuilt it once to decide whether the
    // record could be opened at all; this is the loadout that rebuild produced.
    const rebuilt = reconstructLoadout(record.loadout);
    if (!rebuilt.ok) {
      return { ok: false, reason: rebuilt.reason };
    }

    this.#store.open(
      rebuilt.loadout,
      record.kind === 'named' ? { recordId: record.id, baseRevisionId: record.revisionId } : null,
    );
    return { ok: true };
  }
}
