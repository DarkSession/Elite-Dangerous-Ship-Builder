import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { WebLocksAdapter } from '../../platform/browser/web-locks.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { NamedRecordService, type NamedSaveRequest } from './named-record.service';
import { SaveConflictService } from './save-conflict.service';

class FakeLocks {
  available = true;
  /** Records whether a lock was held while a question was outstanding. */
  holding = 0;

  async request<T>(_name: string, operation: () => Promise<T>): Promise<T> {
    this.holding += 1;
    try {
      return await operation();
    } finally {
      this.holding -= 1;
    }
  }
}

class CountingUuid {
  #next = 0;

  create(): string {
    this.#next += 1;
    return `id-${this.#next}`;
  }
}

const NOW = '2026-01-02T03:04:05.000Z';

function setup(locks = new FakeLocks()) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ...provideMemoryStorage(new MemoryStorage()),
      { provide: WebLocksAdapter, useValue: locks },
      { provide: UuidAdapter, useValue: new CountingUuid() },
    ],
  });
  return {
    conflicts: TestBed.inject(SaveConflictService),
    named: TestBed.inject(NamedRecordService),
    records: TestBed.inject(LocalRecordRepository),
    locks,
  };
}

function attempt(recordId: string, expectedRevisionId: string, name = 'From this tab') {
  return {
    recordId,
    expectedRevisionId,
    name,
    note: null,
    build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
    validation: { valid: true, complete: true },
    now: NOW,
  } satisfies NamedSaveRequest & { recordId: string };
}

/** A record saved once, then changed by "another tab". */
async function contested(setUp: ReturnType<typeof setup>) {
  const created = await setUp.named.createNamed({
    name: 'Anaconda explorer',
    note: null,
    build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
    validation: { valid: true, complete: true },
    now: NOW,
  });
  if (created.kind !== 'saved') {
    throw new Error('expected a save');
  }

  await setUp.named.overwriteNamed(
    attempt(created.record.id, created.record.revisionId, 'From the other tab'),
  );

  return created.record;
}

describe('SaveConflictService', () => {
  it('raises a conflict rather than replacing a version this tab never saw', async () => {
    const harness = setup();
    const original = await contested(harness);

    const result = await harness.conflicts.save(
      attempt(original.id, original.revisionId, 'From this tab'),
    );

    expect(result.kind).toBe('conflict');
    expect(harness.conflicts.conflict()).toMatchObject({
      recordId: original.id,
      expectedRevisionId: original.revisionId,
    });
    expect(harness.conflicts.conflict()?.observed.name).toBe('From the other tab');
  });

  it('holds no lock while the question is outstanding', async () => {
    const harness = setup();
    const original = await contested(harness);

    await harness.conflicts.save(attempt(original.id, original.revisionId));

    expect(harness.locks.holding).toBe(0);
  });

  it('cancel writes nothing and keeps the stored version', async () => {
    const harness = setup();
    const original = await contested(harness);
    await harness.conflicts.save(attempt(original.id, original.revisionId));

    expect(await harness.conflicts.resolve('cancel')).toBeNull();

    const stored = harness.records.open(original.id);
    expect(stored.ok && stored.value?.record.name).toBe('From the other tab');
    expect(harness.conflicts.conflict()).toBeNull();
  });

  it('keep both creates a second record and preserves the first', async () => {
    const harness = setup();
    const original = await contested(harness);
    await harness.conflicts.save(attempt(original.id, original.revisionId));

    const result = await harness.conflicts.resolve('keep-both');

    expect(result?.kind).toBe('saved');
    if (result?.kind !== 'saved') {
      return;
    }
    expect(result.record.id).not.toBe(original.id);

    const listed = harness.records.list();
    expect(listed.ok && listed.value).toHaveLength(2);
    const stored = harness.records.open(original.id);
    expect(stored.ok && stored.value?.record.name).toBe('From the other tab');
  });

  it('overwrite replaces exactly the version the Commander was shown', async () => {
    const harness = setup();
    const original = await contested(harness);
    await harness.conflicts.save(attempt(original.id, original.revisionId));

    const result = await harness.conflicts.resolve('overwrite');

    expect(result?.kind).toBe('saved');
    const stored = harness.records.open(original.id);
    expect(stored.ok && stored.value?.record.name).toBe('From this tab');
    expect(harness.conflicts.conflict()).toBeNull();
  });

  it('asks again when a third version appeared while the Commander decided', async () => {
    const harness = setup();
    const original = await contested(harness);
    await harness.conflicts.save(attempt(original.id, original.revisionId));
    const shown = harness.conflicts.conflict()!;

    // A third tab writes while the dialog is open.
    await harness.named.overwriteNamed(
      attempt(original.id, shown.observedRevisionId, 'From a third tab'),
    );

    const result = await harness.conflicts.resolve('overwrite');

    expect(result?.kind).toBe('conflict');
    expect(harness.conflicts.conflict()?.observed.name).toBe('From a third tab');
    const stored = harness.records.open(original.id);
    expect(stored.ok && stored.value?.record.name).toBe('From a third tab');
  });

  it('re-reads storage rather than trusting the version it is displaying', async () => {
    const harness = setup();
    const original = await contested(harness);
    await harness.conflicts.save(attempt(original.id, original.revisionId));
    const shown = harness.conflicts.conflict()!;

    await harness.named.overwriteNamed(
      attempt(original.id, shown.observedRevisionId, 'From a third tab'),
    );
    harness.conflicts.refresh();

    expect(harness.conflicts.conflict()?.observed.name).toBe('From a third tab');
    expect(harness.conflicts.conflict()?.observedRevisionId).not.toBe(shown.observedRevisionId);
  });

  it('clears the question when the record it is about has been deleted', async () => {
    const harness = setup();
    const original = await contested(harness);
    await harness.conflicts.save(attempt(original.id, original.revisionId));

    harness.records.remove(original.id);
    harness.conflicts.refresh();

    expect(harness.conflicts.conflict()).toBeNull();
  });

  it('offers no in-place replacement when locking is unavailable', async () => {
    const locks = new FakeLocks();
    locks.available = false;
    const harness = setup(locks);

    expect(harness.conflicts.canOverwrite).toBe(false);
  });

  it('answers nothing when there is no question outstanding', async () => {
    expect(await setup().conflicts.resolve('overwrite')).toBeNull();
  });
});
