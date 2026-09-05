import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { toBuildSnapshotV1 } from '../../domain/ships/build/build-snapshot.serializer';
import {
  FIXTURE_IDS,
  MALFORMED_RECORD,
  NAMED_RECORD_V1,
  UNSUPPORTED_NEWER_RECORD,
} from '../../domain/records/fixtures/records';
import type { RecordDraft } from '../../domain/records/local-record.serializer';
import { LocalRecordRepository } from './local-record.repository';
import { MemoryStorage, provideMemoryStorage, quotaError } from './storage.spec-helpers';
import { recordKey } from './storage-keys';

function setup(seed: (storage: MemoryStorage) => void = () => {}): {
  repository: LocalRecordRepository;
  storage: MemoryStorage;
} {
  const storage = new MemoryStorage();
  seed(storage);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [...provideMemoryStorage(storage)] });
  return { repository: TestBed.inject(LocalRecordRepository), storage };
}

function draft(id: string, overrides: Partial<RecordDraft> = {}): RecordDraft {
  return {
    id,
    kind: 'named',
    revisionId: 'revision-1',
    createdAt: '2026-01-02T03:04:05.000Z',
    modifiedAt: '2026-01-02T03:04:05.000Z',
    name: 'Anaconda explorer',
    note: null,
    payload: {
      tool: 'ship',
      build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
      validation: { valid: true, complete: true },
    },
    sourceNamed: null,
    ...overrides,
  };
}

describe('LocalRecordRepository', () => {
  it('writes a record as one complete value under its own key', () => {
    const { repository, storage } = setup();

    expect(repository.write(draft('r1')).ok).toBe(true);

    expect([...storage.entries.keys()]).toEqual([recordKey('r1')]);
    expect(JSON.parse(storage.entries.get(recordKey('r1'))!)).toMatchObject({
      format: 'ednb.local-record',
      id: 'r1',
    });
  });

  it('keeps no index beside the records', () => {
    const { repository, storage } = setup();

    repository.write(draft('r1'));
    repository.write(draft('r2'));

    expect([...storage.entries.keys()].sort()).toEqual([recordKey('r1'), recordKey('r2')].sort());
  });

  it('reads back exactly what it wrote', () => {
    const { repository } = setup();
    repository.write(draft('r1'));

    const opened = repository.open('r1');

    expect(opened.ok && opened.value?.record).toMatchObject({
      id: 'r1',
      name: 'Anaconda explorer',
      hullSymbol: 'Anaconda',
    });
  });

  it('lists only its own keys, ignoring another application’s', () => {
    const { repository } = setup((storage) => {
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1);
      storage.setItem('another-app:record:x', '{}');
      storage.setItem('unrelated', 'value');
    });

    const listed = repository.list();

    expect(listed.ok && listed.value).toHaveLength(1);
    expect(listed.ok && listed.value[0]?.available).toBe(true);
  });

  it('validates each record independently, so one bad one does not hide the rest', () => {
    const { repository } = setup((storage) => {
      storage.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1);
      storage.setItem(recordKey('broken'), MALFORMED_RECORD);
      storage.setItem(recordKey(FIXTURE_IDS.unsupported), UNSUPPORTED_NEWER_RECORD);
    });

    const listed = repository.list();
    expect(listed.ok).toBe(true);
    if (!listed.ok) {
      return;
    }

    expect(listed.value).toHaveLength(3);
    expect(listed.value.filter((entry) => entry.available)).toHaveLength(1);
    expect(
      listed.value
        .filter((entry) => !entry.available)
        .map((entry) => (entry.available ? null : entry.reason))
        .sort(),
    ).toEqual(['malformed', 'unsupported-version']);
  });

  it('leaves an unreadable record’s bytes exactly as they were', () => {
    const { repository, storage } = setup((store) => {
      store.setItem(recordKey('broken'), MALFORMED_RECORD);
    });

    repository.list();
    repository.read('broken');
    repository.open('broken');

    expect(storage.entries.get(recordKey('broken'))).toBe(MALFORMED_RECORD);
  });

  it('retains the prior bytes when a write fails', () => {
    const { repository, storage } = setup();
    repository.write(draft('r1'));
    const before = storage.entries.get(recordKey('r1'));
    storage.writeError = quotaError();

    const result = repository.write(draft('r1', { name: 'Replacement' }));

    expect(result).toEqual({ ok: false, code: 'quota' });
    expect(storage.entries.get(recordKey('r1'))).toBe(before);
  });

  it('reports a blocked store rather than pretending it is empty', () => {
    const { repository, storage } = setup();
    storage.accessError = new DOMException('denied', 'SecurityError');

    expect(repository.list()).toEqual({ ok: false, code: 'blocked' });
    expect(repository.available()).toBe(false);
  });

  it('answers a missing record with nothing, not with a guess', () => {
    const { repository } = setup();

    const opened = repository.open('never-written');

    expect(opened).toEqual({ ok: true, value: null });
  });

  it('deletes one key and nothing else', () => {
    const { repository, storage } = setup();
    repository.write(draft('r1'));
    repository.write(draft('r2'));

    expect(repository.remove('r1').ok).toBe(true);

    expect([...storage.entries.keys()]).toEqual([recordKey('r2')]);
  });
});
