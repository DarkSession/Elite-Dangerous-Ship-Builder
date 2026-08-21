import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
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
import { TabOwnershipCoordinator } from './tab-ownership.coordinator';
import { WORKING_RECORD_LIMIT } from './retention.service';

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
  autosave.now = () => '2026-01-02T03:04:05.000Z';
  const active = TestBed.inject(ActiveBuildStore);
  const ownership = TestBed.inject(TabOwnershipCoordinator);

  return { autosave, active, ownership, storage, lifecycle };
}

function commitBuild(active: ActiveBuildStore, symbol = 'Anaconda'): ShipLoadout {
  const loadout = ShipLoadout.default(symbol);
  active.commit({
    loadout,
    hullName: symbol,
    provenance: 'stock',
    sourceNamed: null,
    baseline: null,
  });
  return loadout;
}

describe('AutosaveService', () => {
  it('writes the build to this tab’s working record and nowhere else', () => {
    const { autosave, active, ownership, storage } = setup();
    const id = ownership.claim();
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
    const { autosave, active, ownership, storage } = setup();
    const id = ownership.claim();
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
    const { autosave, active, ownership, storage } = setup();
    const id = ownership.claim();
    commitBuild(active);

    autosave.flush();

    expect(JSON.parse(storage.entries.get(recordKey(id))!)).toMatchObject({
      validation: { valid: true, complete: true },
    });
  });

  it('writes on a lifecycle flush without waiting for the coalescing window', () => {
    const { autosave, active, ownership, storage, lifecycle } = setup();
    const id = ownership.claim();
    const stop = autosave.start();
    commitBuild(active);

    lifecycle.fire();

    expect(storage.entries.has(recordKey(id))).toBe(true);
    stop();
  });

  it('writes nothing when there is no build', () => {
    const { autosave, ownership, storage } = setup();
    ownership.claim();

    autosave.flush();

    expect(storage.entries.size).toBe(0);
  });

  it('keeps the build editable when the store is full', () => {
    const { autosave, active, ownership, storage } = setup();
    ownership.claim();
    commitBuild(active);
    storage.writeError = quotaError();

    autosave.flush();

    expect(active.persistence()).toBe('quota-full');
    expect(active.loadout()).not.toBeNull();
  });

  it('keeps the build editable when the store is blocked', () => {
    const { autosave, active, ownership, storage } = setup();
    ownership.claim();
    commitBuild(active);
    storage.accessError = new DOMException('denied', 'SecurityError');

    autosave.flush();

    expect(active.persistence()).toBe('unavailable');
    expect(active.loadout()).not.toBeNull();
  });

  it('reports a generic failure without losing the build', () => {
    const { autosave, active, ownership, storage } = setup();
    ownership.claim();
    commitBuild(active);
    storage.writeError = new Error('disk on fire');

    autosave.flush();

    expect(active.persistence()).toBe('write-failed');
    expect(active.loadout()).not.toBeNull();
  });

  it('writes nothing and deletes nothing at the retention limit', () => {
    const { autosave, active, ownership, storage } = setup((store) => {
      for (let index = 0; index < WORKING_RECORD_LIMIT; index += 1) {
        store.setItem(
          recordKey(`existing-${index}`),
          JSON.stringify({
            format: 'edsb.local-record',
            version: 1,
            id: `existing-${index}`,
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
          }),
        );
      }
    });
    const before = storage.entries.size;
    ownership.claim();
    commitBuild(active);

    autosave.flush();

    expect(active.persistence()).toBe('retention-limit');
    expect(storage.entries.size).toBe(before);
    expect(active.loadout()).not.toBeNull();
  });

  it('pauses after the record is discarded elsewhere, until an explicit resume', () => {
    const { autosave, active, ownership, storage } = setup();
    const id = ownership.claim();
    commitBuild(active);

    autosave.pauseAfterExternalDelete();
    storage.entries.delete(recordKey(id));
    autosave.flush();

    expect(active.persistence()).toBe('record-deleted-externally');
    expect(storage.entries.has(recordKey(id))).toBe(false);

    autosave.resume();
    expect(storage.entries.has(recordKey(id))).toBe(true);
  });

  it('coalesces a burst of edits into one write', async () => {
    const { autosave, active, ownership, storage } = setup();
    const id = ownership.claim();
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
