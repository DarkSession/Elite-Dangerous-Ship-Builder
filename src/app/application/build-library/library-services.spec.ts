import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import {
  FIXTURE_IDS,
  MALFORMED_RECORD,
  NAMED_RECORD_V1,
  UNKNOWN_HULL_RECORD,
  UNSUPPORTED_NEWER_RECORD,
  WORKING_RECORD_V1,
} from '../../domain/build/fixtures/records';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { recordKey } from '../../platform/storage/storage-keys';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { ReplacementCoordinator } from '../active-build/replacement-coordinator';
import { BuildLibraryStore } from './build-library.store';
import { RecordDuplicationService } from './record-duplication.service';
import { RecordOpenService } from './record-open.service';
import { RetentionService, WORKING_RECORD_LIMIT } from './retention.service';

class SilentChannel {
  readonly available = false;
  post(): void {}
  subscribe(): () => void {
    return () => {};
  }
}

class CountingUuid {
  #next = 0;

  create(): string {
    this.#next += 1;
    return `new-${this.#next}`;
  }
}

const NOW = '2026-01-02T03:04:05.000Z';

function setup(seed: (storage: MemoryStorage) => void = () => {}) {
  const storage = new MemoryStorage();
  seed(storage);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideIsolatedLocaleEnvironment(),
      ...provideMemoryStorage(storage),
      { provide: BroadcastChannelAdapter, useValue: new SilentChannel() },
      { provide: UuidAdapter, useValue: new CountingUuid() },
    ],
  });
  return {
    storage,
    library: TestBed.inject(BuildLibraryStore),
    open: TestBed.inject(RecordOpenService),
    duplication: TestBed.inject(RecordDuplicationService),
    retention: TestBed.inject(RetentionService),
    records: TestBed.inject(LocalRecordRepository),
    active: TestBed.inject(ActiveBuildStore),
    coordinator: TestBed.inject(ReplacementCoordinator),
  };
}

/** Seeds one working record per index, so the retention limit can be reached. */
function seedWorkingRecords(storage: MemoryStorage, count: number): void {
  for (let index = 0; index < count; index += 1) {
    storage.setItem(
      recordKey(`working-${index}`),
      JSON.stringify({
        format: 'edsb.local-record',
        version: 1,
        id: `working-${index}`,
        kind: 'working',
        revisionId: `revision-${index}`,
        createdAt: NOW,
        modifiedAt: `2026-01-02T03:04:${String(index).padStart(2, '0')}.000Z`,
        name: null,
        note: null,
        hullSymbol: 'Anaconda',
        validation: { valid: true, complete: true },
        build: {
          format: 'edsb.build',
          version: 1,
          shipSymbol: 'Anaconda',
          shipName: null,
          shipIdent: null,
          modules: [],
        },
        sourceNamed: null,
        autosaveRecordId: null,
      }),
    );
  }
}

describe('BuildLibraryStore', () => {
  it('says so when there is nothing stored', () => {
    const { library } = setup();

    expect(library.isEmpty()).toBe(true);
    expect(library.status()).toBe('ready');
  });

  it('groups working and named records separately', () => {
    const { library } = setup((storage) => {
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1);
      storage.setItem(recordKey(FIXTURE_IDS.working), WORKING_RECORD_V1);
    });

    expect(library.named()).toHaveLength(1);
    expect(library.working()).toHaveLength(1);
    expect(library.total()).toBe(2);
  });

  it('orders by modified instant, newest first, with a stable tie-breaker', () => {
    const { library } = setup((storage) => seedWorkingRecords(storage, 3));

    const ids = library.working().map((entry) => (entry.available ? entry.record.id : null));

    expect(ids).toEqual(['working-2', 'working-1', 'working-0']);
    // Ordering twice gives the same answer, so an action lands on the row it
    // was aimed at.
    expect(library.working().map((entry) => (entry.available ? entry.record.id : null))).toEqual(
      ids,
    );
  });

  it('lists a record it cannot open rather than hiding it', () => {
    const { library } = setup((storage) => {
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1);
      storage.setItem(recordKey('broken'), MALFORMED_RECORD);
      storage.setItem(recordKey(FIXTURE_IDS.unsupported), UNSUPPORTED_NEWER_RECORD);
    });

    expect(library.unavailable()).toHaveLength(2);
    expect(library.named()).toHaveLength(1);
  });

  it('reports an unavailable store without pretending it is empty', () => {
    const { library, storage } = setup();
    storage.accessError = new DOMException('denied', 'SecurityError');

    library.refresh();

    expect(library.status()).toBe('unavailable');
    expect(library.failure()).toBe('blocked');
  });

  it('counts how many records already carry a display name', () => {
    const { library } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );

    expect(library.countByName('Anaconda explorer')).toBe(1);
    expect(library.countByName('anaconda EXPLORER')).toBe(1);
    expect(library.countByName('Something else')).toBe(0);
    expect(library.countByName('   ')).toBe(0);
  });
});

describe('RetentionService', () => {
  it('allows a new working record below the limit', () => {
    const { retention } = setup((storage) => seedWorkingRecords(storage, 3));

    expect(retention.workingCount()).toBe(3);
    expect(retention.mayWrite('a-new-record')).toEqual({ allowed: true });
  });

  it('always allows an existing record to be updated, even at the limit', () => {
    const { retention } = setup((storage) => seedWorkingRecords(storage, WORKING_RECORD_LIMIT));

    expect(retention.mayWrite('working-0')).toEqual({ allowed: true });
  });

  it('refuses a record beyond the limit without deleting anything', () => {
    const { retention, storage } = setup((store) =>
      seedWorkingRecords(store, WORKING_RECORD_LIMIT),
    );
    const before = storage.entries.size;

    expect(retention.mayWrite('one-too-many')).toEqual({
      allowed: false,
      reason: 'retention-limit',
      limit: WORKING_RECORD_LIMIT,
    });
    expect(storage.entries.size).toBe(before);
  });

  it('does not count named records against the working limit', () => {
    const { retention } = setup((storage) => {
      seedWorkingRecords(storage, WORKING_RECORD_LIMIT - 1);
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1);
    });

    expect(retention.workingCount()).toBe(WORKING_RECORD_LIMIT - 1);
    expect(retention.mayWrite('one-more')).toEqual({ allowed: true });
  });

  it('allows the write when storage cannot even be listed', () => {
    const { retention, storage } = setup();
    storage.accessError = new DOMException('denied', 'SecurityError');

    // The write itself will report the real failure; refusing here would add a
    // second, wrong explanation.
    expect(retention.mayWrite('anything')).toEqual({ allowed: true });
  });
});

describe('RecordOpenService', () => {
  it('opens a named record as a clean build with its own provenance', async () => {
    const { open, active } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );

    const result = await open.open(FIXTURE_IDS.named);

    expect(result.kind).toBe('committed');
    expect(active.provenance()).toBe('named');
    expect(active.sourceNamed()).toEqual({
      recordId: FIXTURE_IDS.named,
      baseRevisionId: '22222222-2222-4222-8222-222222222222',
    });
    // Opened at its own baseline, so it is not immediately "unsaved".
    expect(active.dirty()).toBe(false);
  });

  it('takes an unnamed record over, clean, rather than copying it', async () => {
    const { open, active } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.working), WORKING_RECORD_V1),
    );

    await open.open(FIXTURE_IDS.working);

    expect(active.provenance()).toBe('working');
    // The page autosaves into the record it opened rather than a copy beside
    // it, and it arrives clean: nothing is owed, so nothing is written, so the
    // seven days the entry is counting down do not restart (FR-008, FR-013).
    expect(active.autosaveRecordId()).toBe(FIXTURE_IDS.working);
    expect(active.dirty()).toBe(false);
  });

  it('holds a named record without making it an autosave target', async () => {
    const { open, active } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );

    await open.open(FIXTURE_IDS.named);

    // Autosave has no path to a named record. The first modelled edit forks an
    // unnamed one, and the save stays exactly where its Commander put it
    // (FR-008, ruled 2026-08-25).
    expect(active.autosaveRecordId()).toBeNull();
  });

  it('cannot replace active work with a record that fails to open', async () => {
    const { open, active, coordinator } = setup((storage) => {
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1);
      storage.setItem(recordKey(FIXTURE_IDS.unknownHull), UNKNOWN_HULL_RECORD);
      storage.setItem(recordKey('broken'), MALFORMED_RECORD);
    });
    coordinator.setConfirmer(async () => true);
    await open.open(FIXTURE_IDS.named);
    const before = active.loadout();

    for (const id of [FIXTURE_IDS.unknownHull, 'broken', 'never-written']) {
      const result = await open.open(id);
      expect(result.kind, id).toBe('failed');
    }

    expect(active.loadout()).toBe(before);
  });

  it('leaves the source record untouched when it is opened', async () => {
    const { open, storage } = setup((store) =>
      store.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );
    const before = storage.entries.get(recordKey(FIXTURE_IDS.named));

    await open.open(FIXTURE_IDS.named);

    expect(storage.entries.get(recordKey(FIXTURE_IDS.named))).toBe(before);
  });

  it('names the hull in the Commander’s language for the replacement question', async () => {
    const { open, active } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );

    await open.open(FIXTURE_IDS.named);

    expect(active.hullName()).toBe('Anaconda');
  });
});

describe('RecordDuplicationService', () => {
  it('copies a record under a fresh record and revision identity', () => {
    const { duplication, records } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );

    const result = duplication.duplicate(FIXTURE_IDS.named, 'Anaconda explorer', NOW);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.record.id).not.toBe(FIXTURE_IDS.named);
    expect(result.record.revisionId).not.toBe('22222222-2222-4222-8222-222222222222');
    // A duplicate name is allowed: identity is a UUID, not a label (FR-009).
    expect(result.record.name).toBe('Anaconda explorer');
    const listed = records.list();
    expect(listed.ok && listed.value).toHaveLength(2);
  });

  it('preserves the source record and its recorded validation', () => {
    const { duplication, records } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );

    const result = duplication.duplicate(FIXTURE_IDS.named, 'A copy', NOW);

    const source = records.open(FIXTURE_IDS.named);
    expect(source.ok && source.value?.record.name).toBe('Anaconda explorer');
    expect(result.ok && result.record.validation).toEqual({ valid: true, complete: true });
    expect(result.ok && result.record.build).toEqual(source.ok ? source.value?.record.build : null);
  });

  it('names a working build as a new named record, leaving the working one alone', () => {
    const { duplication, records } = setup((storage) =>
      storage.setItem(recordKey(FIXTURE_IDS.working), WORKING_RECORD_V1),
    );

    const result = duplication.duplicate(FIXTURE_IDS.working, 'Now it has a name', NOW);

    expect(result.ok && result.record.kind).toBe('named');
    const working = records.open(FIXTURE_IDS.working);
    expect(working.ok && working.value?.record.kind).toBe('working');
  });

  it('copies a live build that has never been stored', () => {
    const { duplication } = setup();
    const source = {
      format: 'edsb.local-record' as const,
      version: 1 as const,
      id: 'unstored',
      kind: 'working' as const,
      revisionId: 'r',
      createdAt: NOW,
      modifiedAt: NOW,
      name: null,
      note: null,
      hullSymbol: 'Anaconda',
      validation: { valid: true, complete: true },
      build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
      sourceNamed: null,
      autosaveRecordId: null,
    };

    expect(duplication.copy(source, 'Saved at last', NOW).ok).toBe(true);
  });

  it('says so when the record to copy is not there', () => {
    expect(setup().duplication.duplicate('never-written', 'A copy', NOW)).toEqual({
      ok: false,
      code: 'missing',
    });
  });
});
