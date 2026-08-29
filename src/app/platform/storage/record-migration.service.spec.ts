import { TestBed } from '@angular/core/testing';
import {
  FIXTURE_IDS,
  MALFORMED_RECORD,
  NAMED_RECORD_V1,
  UNKNOWN_HULL_RECORD,
  UNSUPPORTED_NEWER_RECORD,
} from '../../domain/build/fixtures/records';
import { RecordMigrationService } from './record-migration.service';
import { MemoryStorage, provideMemoryStorage, quotaError } from './storage.spec-helpers';
import { recordKey } from './storage-keys';

function setup(seed: (storage: MemoryStorage) => void = () => {}): {
  service: RecordMigrationService;
  storage: MemoryStorage;
} {
  const storage = new MemoryStorage();
  seed(storage);
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [...provideMemoryStorage(storage)] });
  return { service: TestBed.inject(RecordMigrationService), storage };
}

describe('opening a stored record', () => {
  it('opens a current record without rewriting it', () => {
    const { service, storage } = setup((store) =>
      store.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );
    const before = storage.entries.get(recordKey(FIXTURE_IDS.named));

    const opened = service.open(FIXTURE_IDS.named);

    expect(opened.ok).toBe(true);
    expect(storage.entries.get(recordKey(FIXTURE_IDS.named))).toBe(before);
  });

  it('refuses a record naming a hull the package does not carry, leaving it stored', () => {
    const { service, storage } = setup((store) =>
      store.setItem(recordKey(FIXTURE_IDS.unknownHull), UNKNOWN_HULL_RECORD),
    );

    const opened = service.open(FIXTURE_IDS.unknownHull);

    expect(opened.ok).toBe(false);
    expect(opened.ok === false && opened.reason).toContain('Nonexistent_Hull');
    // Stored but unopened: the bytes are untouched (FR-014).
    expect(storage.entries.get(recordKey(FIXTURE_IDS.unknownHull))).toBe(UNKNOWN_HULL_RECORD);
  });

  it('refuses an unsupported newer record and leaves it byte-for-byte', () => {
    const { service, storage } = setup((store) =>
      store.setItem(recordKey(FIXTURE_IDS.unsupported), UNSUPPORTED_NEWER_RECORD),
    );

    expect(service.open(FIXTURE_IDS.unsupported).ok).toBe(false);
    expect(storage.entries.get(recordKey(FIXTURE_IDS.unsupported))).toBe(UNSUPPORTED_NEWER_RECORD);
  });

  it('refuses a malformed record without repairing or removing it', () => {
    const { service, storage } = setup((store) =>
      store.setItem(recordKey('broken'), MALFORMED_RECORD),
    );

    expect(service.open('broken').ok).toBe(false);
    expect(storage.entries.get(recordKey('broken'))).toBe(MALFORMED_RECORD);
  });

  it('says so when there is nothing stored under that identity', () => {
    expect(setup().service.open('never-written').ok).toBe(false);
  });

  it('reports a blocked store as a read failure rather than as a missing record', () => {
    const { service, storage } = setup();
    storage.accessError = new DOMException('denied', 'SecurityError');

    const opened = service.open(FIXTURE_IDS.named);

    expect(opened.ok).toBe(false);
    expect(opened.ok === false && opened.reason).toContain('blocked');
  });

  it('keeps a full store from turning a successful open into a failure', () => {
    const { service, storage } = setup((store) =>
      store.setItem(recordKey(FIXTURE_IDS.named), NAMED_RECORD_V1),
    );
    storage.writeError = quotaError();

    // Nothing needed migrating, so no write was attempted and the open stands.
    expect(service.open(FIXTURE_IDS.named).ok).toBe(true);
  });
});
