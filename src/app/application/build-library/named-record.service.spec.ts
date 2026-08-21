import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { WebLocksAdapter } from '../../platform/browser/web-locks.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import {
  MemoryStorage,
  provideMemoryStorage,
  quotaError,
} from '../../platform/storage/storage.spec-helpers';
import { NamedRecordService, type NamedSaveRequest } from './named-record.service';

/** A lock that actually serializes, so the precondition is what is being tested. */
class FakeLocks {
  available = true;
  readonly held: string[] = [];

  async request<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.held.push(name);
    return operation();
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
const LATER = '2026-01-02T04:05:06.000Z';

function setup(locks = new FakeLocks()) {
  const storage = new MemoryStorage();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ...provideMemoryStorage(storage),
      { provide: WebLocksAdapter, useValue: locks },
      { provide: UuidAdapter, useValue: new CountingUuid() },
    ],
  });
  return {
    named: TestBed.inject(NamedRecordService),
    records: TestBed.inject(LocalRecordRepository),
    storage,
    locks,
  };
}

const build = () => toBuildSnapshotV1(ShipLoadout.default('Anaconda'));

/** A save request, with only the fields a test cares about spelled out. */
function request(overrides: Partial<NamedSaveRequest> = {}): NamedSaveRequest {
  return {
    recordId: null,
    expectedRevisionId: null,
    name: 'Anaconda explorer',
    note: null,
    build: build(),
    validation: { valid: true, complete: true },
    now: NOW,
    ...overrides,
  };
}

/** The same request, narrowed to the record it is replacing. */
function overwrite(
  recordId: string,
  expectedRevisionId: string,
  overrides: Partial<NamedSaveRequest> = {},
): NamedSaveRequest & { recordId: string } {
  return { ...request({ ...overrides, recordId, expectedRevisionId }), recordId };
}

describe('NamedRecordService', () => {
  it('creates a named record with fresh record and revision identities', async () => {
    const { named } = setup();

    const result = await named.createNamed(request());

    expect(result.kind).toBe('saved');
    if (result.kind !== 'saved') {
      return;
    }
    expect(result.record.kind).toBe('named');
    expect(result.record.name).toBe('Anaconda explorer');
    expect(result.record.id).not.toBe(result.record.revisionId);
  });

  it('replaces a record when the revision is still the one this tab saw', async () => {
    const { named } = setup();
    const created = await named.createNamed(request());
    if (created.kind !== 'saved') {
      throw new Error('expected a save');
    }

    const result = await named.overwriteNamed(
      overwrite(created.record.id, created.record.revisionId, { name: 'Renamed', now: LATER }),
    );

    expect(result.kind).toBe('saved');
    expect(result.kind === 'saved' && result.record.name).toBe('Renamed');
    // A fresh revision, so another tab's stale precondition can never match.
    expect(result.kind === 'saved' && result.record.revisionId).not.toBe(created.record.revisionId);
    expect(result.kind === 'saved' && result.record.createdAt).toBe(created.record.createdAt);
    expect(result.kind === 'saved' && result.record.modifiedAt).toBe(LATER);
  });

  it('reports a conflict rather than replacing a version it never saw', async () => {
    const { named } = setup();
    const created = await named.createNamed(request());
    if (created.kind !== 'saved') {
      throw new Error('expected a save');
    }
    // Another tab writes first.
    await named.overwriteNamed(
      overwrite(created.record.id, created.record.revisionId, {
        name: 'From the other tab',
        now: LATER,
      }),
    );

    const result = await named.overwriteNamed(
      overwrite(created.record.id, created.record.revisionId, {
        name: 'From this tab',
        now: LATER,
      }),
    );

    expect(result.kind).toBe('conflict');
    expect(result.kind === 'conflict' && result.observed.name).toBe('From the other tab');
  });

  it('writes nothing when it reports a conflict', async () => {
    const { named, records } = setup();
    const created = await named.createNamed(request());
    if (created.kind !== 'saved') {
      throw new Error('expected a save');
    }
    await named.overwriteNamed(
      overwrite(created.record.id, created.record.revisionId, {
        name: 'From the other tab',
        now: LATER,
      }),
    );
    const before = records.open(created.record.id);

    await named.overwriteNamed(
      overwrite(created.record.id, created.record.revisionId, {
        name: 'From this tab',
        now: LATER,
      }),
    );

    const after = records.open(created.record.id);
    expect(after.ok && after.value?.record).toEqual(before.ok ? before.value?.record : null);
  });

  it('takes the lock for exactly the record it is writing', async () => {
    const { named, locks } = setup();
    const created = await named.createNamed(request());
    if (created.kind !== 'saved') {
      throw new Error('expected a save');
    }

    await named.overwriteNamed(overwrite(created.record.id, created.record.revisionId));

    expect(locks.held).toEqual([`edsb:named:${created.record.id}`]);
  });

  it('refuses an in-place replacement when locking is unavailable', async () => {
    const locks = new FakeLocks();
    locks.available = false;
    const { named } = setup(locks);

    expect(named.canOverwrite).toBe(false);
    expect(await named.overwriteNamed(overwrite('r1', 'v1'))).toEqual({
      kind: 'locks-unavailable',
    });
  });

  it('still creates a new named record when locking is unavailable', async () => {
    const locks = new FakeLocks();
    locks.available = false;
    const { named } = setup(locks);

    // Keep-both stays available: it writes a record nobody else holds.
    expect((await named.createNamed(request())).kind).toBe('saved');
  });

  it('renames without disturbing the build or its recorded validation', async () => {
    const { named } = setup();
    const created = await named.createNamed(
      request({ validation: { valid: false, complete: false } }),
    );
    if (created.kind !== 'saved') {
      throw new Error('expected a save');
    }

    const renamed = await named.rename(
      created.record.id,
      'A better name',
      created.record.revisionId,
      LATER,
    );

    expect(renamed.kind).toBe('saved');
    if (renamed.kind !== 'saved') {
      return;
    }
    expect(renamed.record.name).toBe('A better name');
    expect(renamed.record.build).toEqual(created.record.build);
    expect(renamed.record.validation).toEqual({ valid: false, complete: false });
  });

  it('says so when the record it was asked to write is gone', async () => {
    const { named } = setup();

    expect(await named.overwriteNamed(overwrite('never-written', 'v1'))).toEqual({
      kind: 'missing',
    });
  });

  it('reports a failed write rather than claiming a save', async () => {
    const { named, storage } = setup();
    const created = await named.createNamed(request());
    if (created.kind !== 'saved') {
      throw new Error('expected a save');
    }
    storage.writeError = quotaError();

    const result = await named.overwriteNamed(
      overwrite(created.record.id, created.record.revisionId),
    );

    expect(result).toEqual({ kind: 'failed', code: 'quota' });
  });
});
