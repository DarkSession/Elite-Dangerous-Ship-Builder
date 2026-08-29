import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { ClockAdapter } from '../../platform/browser/clock.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { BroadcastChannelAdapter } from '../../platform/browser/broadcast-channel.adapter';
import {
  MemoryStorage,
  provideMemoryStorage,
  quotaError,
} from '../../platform/storage/storage.spec-helpers';
import { recordKey } from '../../platform/storage/storage-keys';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { AutosaveService } from './autosave.service';

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

function setup(seed: (storage: MemoryStorage) => void = () => {}) {
  const storage = new MemoryStorage();
  const lifecycle = new FakeLifecycle();
  seed(storage);

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ...provideMemoryStorage(storage),
      { provide: PageLifecycleAdapter, useValue: lifecycle },
      { provide: BroadcastChannelAdapter, useValue: new SilentChannel() },
    ],
  });

  const autosave = TestBed.inject(AutosaveService);
  TestBed.inject(ClockAdapter).now = () => new Date('2026-01-02T03:04:05.000Z');
  const active = TestBed.inject(ActiveBuildStore);
  return { autosave, active, storage, lifecycle };
}

/** The record a test hands the page, standing in for one it minted itself. */
const HELD = 'held-record';

function commitBuild(
  active: ActiveBuildStore,
  symbol = 'Anaconda',
  autosaveRecordId: string | null = HELD,
): ShipLoadout {
  const loadout = ShipLoadout.default(symbol);
  active.commit({
    loadout,
    hullName: symbol,
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId,
    baseline: null,
  });
  return loadout;
}

/** One stored named record, as a Commander's own save. */
function storedNamedRecord(id: string): string {
  return storedWorkingRecord(id)
    .replace('"kind":"working"', '"kind":"named"')
    .replace('"name":null', '"name":"Their save"');
}

/** One stored unnamed record, in the shape the repository writes. */
function storedWorkingRecord(id: string): string {
  return JSON.stringify({
    format: 'edsb.local-record',
    version: 1,
    id,
    kind: 'working',
    revisionId: 'r',
    createdAt: '2026-01-02T03:04:05.000Z',
    modifiedAt: '2026-01-02T03:04:05.000Z',
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
  });
}

describe('AutosaveService', () => {
  it('writes the build to this tab’s working record and nowhere else', () => {
    const { autosave, active, storage } = setup();
    const id = HELD;
    commitBuild(active);

    autosave.flush();

    expect([...storage.entries.keys()]).toEqual([recordKey(id)]);
    expect(JSON.parse(storage.entries.get(recordKey(id))!)).toMatchObject({
      kind: 'working',
      name: null,
      hullSymbol: 'Anaconda',
    });
    expect(active.persistence()).toBe('saved');
  });

  it('stores package-defaulted fixed modules as ordinary build state', () => {
    const { autosave, active, storage } = setup();
    const id = HELD;
    commitBuild(active);

    autosave.flush();
    const stored = storage.entries.get(recordKey(id))!;
    const record = JSON.parse(stored) as { build: { modules: { slot: string }[] } };

    expect(record.build.modules.some((module) => module.slot === 'Armour')).toBe(true);
    expect(record.build.modules.some((module) => module.slot === 'CargoHatch')).toBe(true);
    // No source-empty, repair or defaulting provenance anywhere in the bytes.
    expect(stored).not.toMatch(/repair|defaulted|sourceEmpty|provenance/i);
  });

  it('records the package’s validation result at that revision', () => {
    const { autosave, active, storage } = setup();
    const id = HELD;
    commitBuild(active);

    autosave.flush();

    expect(JSON.parse(storage.entries.get(recordKey(id))!)).toMatchObject({
      validation: { valid: true, complete: true },
    });
  });

  it('writes on a lifecycle flush without waiting for the coalescing window', () => {
    const { autosave, active, storage, lifecycle } = setup();
    const id = HELD;
    const stop = autosave.start();
    commitBuild(active);

    lifecycle.fire();

    expect(storage.entries.has(recordKey(id))).toBe(true);
    stop();
  });

  it('writes nothing when there is no build', () => {
    const { autosave, storage } = setup();

    autosave.flush();

    expect(storage.entries.size).toBe(0);
  });

  it('keeps the build editable when the store is full', () => {
    const { autosave, active, storage } = setup();
    commitBuild(active);
    storage.writeError = quotaError();

    autosave.flush();

    expect(active.persistence()).toBe('quota-full');
    expect(active.loadout()).not.toBeNull();
  });

  it('keeps the build editable when the store is blocked', () => {
    const { autosave, active, storage } = setup();
    commitBuild(active);
    storage.accessError = new DOMException('denied', 'SecurityError');

    autosave.flush();

    expect(active.persistence()).toBe('unavailable');
    expect(active.loadout()).not.toBeNull();
  });

  it('reports a generic failure without losing the build', () => {
    const { autosave, active, storage } = setup();
    commitBuild(active);
    storage.writeError = new Error('disk on fire');

    autosave.flush();

    expect(active.persistence()).toBe('write-failed');
    expect(active.loadout()).not.toBeNull();
  });

  it('writes however many records already exist, refusing nothing', () => {
    // The twenty-record limit was withdrawn on 2026-08-25: nothing refuses to
    // store a build because many are stored, and no number evicts anything. The
    // bound that replaced it is the seven-day expiry, which the sweep applies
    // and autosave knows nothing about (FR-013).
    const { autosave, active, storage } = setup((store) => {
      for (let index = 0; index < 25; index += 1) {
        store.setItem(recordKey(`existing-${index}`), storedWorkingRecord(`existing-${index}`));
      }
    });
    const before = storage.entries.size;
    commitBuild(active);

    autosave.flush();

    expect(active.persistence()).toBe('saved');
    expect(storage.entries.size).toBe(before + 1);
  });

  it('leaves the named record it came from untouched when the store is full', () => {
    // The fork has nowhere to go, and the answer is a persistence state rather
    // than a write somewhere else: the save the build was opened from is not a
    // fallback target, then or ever (FR-008, FR-013, T153b).
    const { autosave, active, storage } = setup((store) =>
      store.setItem(recordKey('their-save'), storedNamedRecord('their-save')),
    );
    const before = storage.entries.get(recordKey('their-save'));
    // A build opened from that save and then edited: it holds no record of its
    // own yet, so this write is the fork.
    active.commit({
      loadout: ShipLoadout.default('Anaconda'),
      hullName: 'Anaconda',
      provenance: 'named',
      qualityNotices: [],
      sourceNamed: { recordId: 'their-save', baseRevisionId: 'r' },
      autosaveRecordId: null,
      baseline: null,
    });
    storage.writeError = quotaError();

    autosave.flush();

    expect(active.persistence()).toBe('quota-full');
    expect(storage.entries.get(recordKey('their-save'))).toBe(before);
    expect(active.loadout()).not.toBeNull();
  });

  it('pauses after the record is discarded elsewhere, until an explicit resume', () => {
    const { autosave, active, storage } = setup();
    const id = HELD;
    commitBuild(active);

    autosave.pauseAfterExternalDelete();
    storage.entries.delete(recordKey(id));
    autosave.flush();

    expect(active.persistence()).toBe('record-deleted-externally');
    expect(storage.entries.has(recordKey(id))).toBe(false);

    autosave.resume();
    expect(storage.entries.has(recordKey(id))).toBe(true);
  });

  it('writes nothing while the build matches what its record already holds', () => {
    // Taking a record over is not modifying it. If this wrote, `modifiedAt`
    // would move and the seven days the entry is counting down would restart
    // (FR-013, clarification 2026-08-25).
    const { autosave, active, storage } = setup();
    const loadout = commitBuild(active);
    autosave.flush();
    const written = storage.entries.get(recordKey(HELD))!;

    active.markSaved(null);
    loadout.setModulePriority('FrameShiftDrive', 2);
    active.touch();
    active.markSaved(null);
    autosave.flush();

    expect(storage.entries.get(recordKey(HELD))).toBe(written);
  });

  it('takes over an unnamed record already holding this build, rather than storing a second copy', () => {
    const { autosave, active, storage } = setup();
    // One build, stored once. Then the same build arrives again with no record
    // of its own — a stock hull built twice, or one link opened twice.
    commitBuild(active);
    autosave.flush();
    const first = active.autosaveRecordId();
    const bytes = storage.entries.get(recordKey(HELD))!;

    commitBuild(active, 'Anaconda', null);
    autosave.flush();

    expect(active.autosaveRecordId()).toBe(first);
    expect([...storage.entries.keys()]).toEqual([recordKey(HELD)]);
    // Taken over, not rewritten: the bytes and the instant on them are the
    // ones the first write left.
    expect(storage.entries.get(recordKey(HELD))).toBe(bytes);
    expect(active.dirty()).toBe(false);
  });

  it('mints a record when nothing stored matches, rather than taking over a different build', () => {
    const { autosave, active, storage } = setup();
    commitBuild(active);
    autosave.flush();

    commitBuild(active, 'Sidewinder', null);
    autosave.flush();

    expect(active.autosaveRecordId()).not.toBe(HELD);
    expect(storage.entries.size).toBe(2);
  });

  it('refuses a named record as a target, whatever the page believes it holds', () => {
    // The check reads the stored record rather than this page's belief about
    // it, so a record named in another tab is covered too (FR-008).
    const { autosave, active, storage } = setup((store) =>
      store.setItem(
        recordKey(HELD),
        JSON.stringify({
          format: 'edsb.local-record',
          version: 1,
          id: HELD,
          kind: 'named',
          revisionId: 'r',
          createdAt: '2026-01-02T03:04:05.000Z',
          modifiedAt: '2026-01-02T03:04:05.000Z',
          name: 'PACIFIER',
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
        }),
      ),
    );
    const named = storage.entries.get(recordKey(HELD))!;
    commitBuild(active);

    autosave.flush();

    expect(storage.entries.get(recordKey(HELD))).toBe(named);
    expect(active.loadout()).not.toBeNull();
  });

  it('coalesces a burst of edits into one write', async () => {
    const { autosave, active, storage } = setup();
    const id = HELD;
    const stop = autosave.start();
    const loadout = commitBuild(active);

    for (let index = 0; index < 5; index += 1) {
      loadout.setModulePriority('FrameShiftDrive', index % 5);
      active.touch();
    }
    TestBed.tick();
    expect(storage.entries.has(recordKey(id))).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(storage.entries.has(recordKey(id))).toBe(true);
    stop();
  });
});
