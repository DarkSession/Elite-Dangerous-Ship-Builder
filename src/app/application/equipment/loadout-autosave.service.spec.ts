import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { newLoadout } from '../../domain/equipment/loadout/loadout-edit';
import { toBuildSnapshotV1 } from '../../domain/ships/build/build-snapshot.serializer';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { LocalRecordRepository } from '../../platform/storage/local-record.repository';
import { recordKey } from '../../platform/storage/storage-keys';
import {
  MemoryStorage,
  provideMemoryStorage,
  quotaError,
} from '../../platform/storage/storage.spec-helpers';
import { LoadoutAutosaveService } from './loadout-autosave.service';
import { LoadoutStore } from './loadout.store';

/** A lifecycle adapter a test can fire on demand. */
class FakeLifecycle {
  #flush: (() => void) | null = null;

  onFlush(flush: () => void): () => void {
    this.#flush = flush;
    return () => {
      this.#flush = null;
    };
  }

  fire(): void {
    this.#flush?.();
  }
}

class SilentChannel {
  readonly available = false;
  post(): void {}
  subscribe(): () => void {
    return () => {};
  }
}

/** The record a test hands the page, standing in for one it minted itself. */
const HELD = 'held-record';

function setup() {
  const storage = new MemoryStorage();
  const lifecycle = new FakeLifecycle();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ...provideMemoryStorage(storage),
      { provide: PageLifecycleAdapter, useValue: lifecycle },
      { provide: BroadcastChannelAdapter, useValue: new SilentChannel() },
    ],
  });

  const autosave = TestBed.inject(LoadoutAutosaveService);
  TestBed.inject(ClockAdapter).now = () => new Date('2026-01-02T03:04:05.000Z');
  return {
    autosave,
    store: TestBed.inject(LoadoutStore),
    records: TestBed.inject(LocalRecordRepository),
    storage,
    lifecycle,
  };
}

/** A loadout on the bench, in the record a test says it arrived in. */
function benchLoadout(
  store: LoadoutStore,
  suitFamily = 'tacticalsuit',
  autosaveRecordId: string | null = HELD,
): EquipmentLoadout {
  const loadout = newLoadout(suitFamily)!;
  store.open(loadout, null, { autosaveRecordId, baseline: null });
  return loadout;
}

describe('LoadoutAutosaveService', () => {
  it('keeps the equipment tool’s work, and says so', () => {
    expect(setup().autosave.tool).toBe('equipment');
  });

  it('writes the loadout to this page’s working record and nowhere else', () => {
    const { autosave, store, storage } = setup();
    benchLoadout(store);

    autosave.flush();

    expect([...storage.entries.keys()]).toEqual([recordKey(HELD)]);
    expect(JSON.parse(storage.entries.get(recordKey(HELD))!)).toMatchObject({
      tool: 'equipment',
      kind: 'working',
      name: null,
      // The listing reads the suit from the record rather than rebuilding the
      // loadout to find out what is on it.
      suitFamily: 'tacticalsuit',
    });
    expect(store.persistence()).toBe('saved');
  });

  it('writes on a lifecycle flush without waiting for the coalescing window', () => {
    const { autosave, store, storage, lifecycle } = setup();
    const stop = autosave.start();
    benchLoadout(store);

    lifecycle.fire();

    expect(storage.entries.has(recordKey(HELD))).toBe(true);
    stop();
  });

  it('writes nothing while the bench is empty', () => {
    const { autosave, storage } = setup();

    autosave.flush();

    expect(storage.entries.size).toBe(0);
  });

  it('mints a record for a loadout that arrived in none', () => {
    const { autosave, store, storage } = setup();
    benchLoadout(store, 'tacticalsuit', null);

    autosave.flush();

    const minted = store.autosaveRecordId();
    expect(minted).not.toBeNull();
    expect([...storage.entries.keys()]).toEqual([recordKey(minted!)]);
  });

  it('takes over an unnamed record already holding this loadout, rather than storing a second copy', () => {
    const { autosave, store, storage } = setup();
    // One loadout, stored once. Then the same loadout arrives again in no
    // record of its own — one suit chosen twice, or one link opened twice.
    benchLoadout(store);
    autosave.flush();
    const bytes = storage.entries.get(recordKey(HELD))!;

    benchLoadout(store, 'tacticalsuit', null);
    autosave.flush();

    expect(store.autosaveRecordId()).toBe(HELD);
    expect([...storage.entries.keys()]).toEqual([recordKey(HELD)]);
    // Taken over, not rewritten: the bytes and the instant on them are the
    // ones the first write left.
    expect(storage.entries.get(recordKey(HELD))).toBe(bytes);
    expect(store.dirty()).toBe(false);
  });

  it('never takes over a record of the other tool (017/FR-010)', () => {
    // The one record this browser holds is a build's. A loadout minting its own
    // rather than writing into it is the whole rule: the two hold different
    // content and are never the same state.
    const { autosave, store, records, storage } = setup();
    records.write({
      id: 'a-build',
      kind: 'working',
      revisionId: 'r',
      createdAt: '2026-01-02T03:04:05.000Z',
      modifiedAt: '2026-01-02T03:04:05.000Z',
      name: null,
      note: null,
      sourceNamed: null,
      payload: {
        tool: 'ship',
        build: toBuildSnapshotV1(ShipLoadout.default('Anaconda')),
        validation: { valid: true, complete: true },
      },
    });

    benchLoadout(store, 'tacticalsuit', null);
    autosave.flush();

    expect(store.autosaveRecordId()).not.toBe('a-build');
    expect(storage.entries.size).toBe(2);
    expect(storage.entries.get(recordKey('a-build'))).toContain('"tool":"ship"');
  });

  it('keeps the instant a record it takes over was created (001/FR-013)', () => {
    // Taking over is not creating. Stamping the entry with now would restart
    // the seven days it has been counting down, which is the one thing the
    // take-over rule exists to avoid.
    const { autosave, store, records, storage } = setup();
    const loadout = newLoadout('utilitysuit')!;
    records.write({
      id: 'older',
      kind: 'working',
      revisionId: 'r',
      createdAt: '2025-12-01T00:00:00.000Z',
      modifiedAt: '2025-12-01T00:00:00.000Z',
      name: null,
      note: null,
      sourceNamed: null,
      payload: { tool: 'equipment', loadout },
    });

    // A page that has already written a record of its own, so its own instant
    // is the one it would otherwise carry over.
    benchLoadout(store);
    autosave.flush();
    // Then the same loadout the stored record holds, arriving in no record.
    store.open(loadout, null, {});
    autosave.flush();
    expect(store.autosaveRecordId()).toBe('older');

    store.dispatch({ kind: 'setSuitGrade', grade: 2 });
    autosave.flush();

    expect(JSON.parse(storage.entries.get(recordKey('older'))!)).toMatchObject({
      createdAt: '2025-12-01T00:00:00.000Z',
      modifiedAt: '2026-01-02T03:04:05.000Z',
    });
  });

  it('writes nothing while the loadout matches what its record already holds', () => {
    // A flush with nothing owed is not a write. If it were, `modifiedAt` would
    // move and the seven days the entry is counting down would restart
    // (001/FR-013).
    const { autosave, store, storage } = setup();
    benchLoadout(store);
    autosave.flush();
    store.markSaved(null);
    const written = storage.entries.get(recordKey(HELD))!;

    autosave.flush();

    expect(storage.entries.get(recordKey(HELD))).toBe(written);
  });

  it('refuses a named record as a target, whatever the page believes it holds', () => {
    // The check reads the stored record rather than this page's belief about
    // it, so a record named in another tab is covered too (001/FR-008).
    const { autosave, store, records, storage } = setup();
    records.write({
      id: HELD,
      kind: 'named',
      revisionId: 'r',
      createdAt: '2026-01-02T03:04:05.000Z',
      modifiedAt: '2026-01-02T03:04:05.000Z',
      name: 'Their save',
      note: null,
      sourceNamed: null,
      payload: { tool: 'equipment', loadout: newLoadout('utilitysuit')! },
    });
    const named = storage.entries.get(recordKey(HELD))!;
    benchLoadout(store);

    autosave.flush();

    expect(storage.entries.get(recordKey(HELD))).toBe(named);
    expect(store.loadout()).not.toBeNull();
  });

  it('keeps the loadout editable when the store is full', () => {
    const { autosave, store, storage } = setup();
    benchLoadout(store);
    storage.writeError = quotaError();

    autosave.flush();

    expect(store.persistence()).toBe('quota-full');
    expect(store.loadout()).not.toBeNull();
  });

  it('keeps the loadout editable when the store is blocked', () => {
    const { autosave, store, storage } = setup();
    benchLoadout(store);
    storage.accessError = new DOMException('denied', 'SecurityError');

    autosave.flush();

    expect(store.persistence()).toBe('unavailable');
    expect(store.loadout()).not.toBeNull();
  });

  it('reports a generic failure without losing the loadout', () => {
    const { autosave, store, storage } = setup();
    benchLoadout(store);
    storage.writeError = new Error('disk on fire');

    autosave.flush();

    expect(store.persistence()).toBe('write-failed');
    expect(store.loadout()).not.toBeNull();
  });

  it('coalesces a burst of choices into one write', async () => {
    const { autosave, store, storage } = setup();
    const stop = autosave.start();
    benchLoadout(store);

    for (const grade of [2, 3, 4, 5]) {
      store.dispatch({ kind: 'setSuitGrade', grade });
    }
    TestBed.tick();
    expect(storage.entries.has(recordKey(HELD))).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(storage.entries.has(recordKey(HELD))).toBe(true);
    stop();
  });
});
