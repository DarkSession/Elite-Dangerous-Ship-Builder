import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  BroadcastChannelAdapter,
  type PersistenceBroadcast,
} from '../../platform/browser/broadcast-channel.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { TabOwnershipCoordinator } from './tab-ownership.coordinator';

/** A channel two coordinators in one test can talk over. */
class FakeChannel {
  readonly sent: PersistenceBroadcast[] = [];
  readonly #listeners: ((message: PersistenceBroadcast) => void)[] = [];

  readonly available = true;

  post(message: PersistenceBroadcast): void {
    this.sent.push(message);
  }

  subscribe(listener: (message: PersistenceBroadcast) => void): () => void {
    this.#listeners.push(listener);
    return () => {};
  }

  /** Delivers a message as though another page had sent it. */
  deliver(message: PersistenceBroadcast): void {
    for (const listener of this.#listeners) {
      listener(message);
    }
  }
}

/** Predictable identities, so a test can say which one it means. */
class CountingUuid {
  #next = 0;

  create(): string {
    this.#next += 1;
    return `id-${this.#next}`;
  }
}

function setup(session = new MemoryStorage(), channel = new FakeChannel()) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      ...provideMemoryStorage(new MemoryStorage(), session),
      { provide: BroadcastChannelAdapter, useValue: channel },
      { provide: UuidAdapter, useValue: new CountingUuid() },
    ],
  });
  return {
    coordinator: TestBed.inject(TabOwnershipCoordinator),
    active: TestBed.inject(ActiveBuildStore),
    channel,
    session,
  };
}

/** Puts a build in the store, held in the record the caller names. */
function hold(active: ActiveBuildStore, autosaveRecordId: string | null): void {
  active.commit({
    loadout: ShipLoadout.default('Anaconda'),
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId,
    baseline: null,
  });
}

describe('TabOwnershipCoordinator', () => {
  it('claims nothing for a tab that has never held a record', () => {
    // A fresh tab has no build and nothing to restore. That is the ordinary
    // state of one, not a failure, and it mints no record for a build that does
    // not exist yet (FR-008).
    expect(setup().coordinator.claim()).toBeNull();
  });

  it('restores the record the same tab was working from after a reload', () => {
    const session = new MemoryStorage();
    const first = setup(session);
    hold(first.active, 'id-held');
    const stop = first.coordinator.track();
    TestBed.tick();
    stop();

    expect(setup(session).coordinator.claim()).toBe('id-held');
  });

  it('gives two ordinary tabs distinct records', () => {
    const first = setup();
    hold(first.active, 'first-record');
    const second = setup(new MemoryStorage());

    // Distinct sessions, so distinct autosave targets: neither can overwrite
    // the other's build.
    expect(second.coordinator.claim()).toBeNull();
  });

  it('announces the record the store holds, so a duplicated tab can be detected', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');

    const stop = coordinator.track();
    TestBed.tick();

    expect(channel.sent).toEqual([
      { kind: 'working-claim', workingRecordId: 'id-held', pageNonce: coordinator.pageNonce },
    ]);
    stop();
  });

  it('announces one record once, however often the store is read', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track();
    TestBed.tick();

    active.touch();
    TestBed.tick();

    expect(channel.sent).toHaveLength(1);
    stop();
  });

  it('announces nothing while the page holds only a named record', () => {
    // Two pages may hold one named save open, because neither autosaves into
    // it. That is not a collision and must not be announced as one (FR-012).
    const { coordinator, active, channel } = setup();
    hold(active, null);

    const stop = coordinator.track();
    TestBed.tick();

    expect(channel.sent).toEqual([]);
    stop();
  });

  it('forks when another live page claims the record it writes to', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.listen();
    const forks: [string, string][] = [];
    coordinator.onFork((previous, next) => forks.push([previous, next]));

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'id-held',
      pageNonce: 'another-page',
    });

    expect(coordinator.autosaveRecordId()).not.toBe('id-held');
    expect(forks).toEqual([['id-held', coordinator.autosaveRecordId()!]]);
  });

  it('ignores its own claim echoing back', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'id-held',
      pageNonce: coordinator.pageNonce,
    });

    expect(coordinator.autosaveRecordId()).toBe('id-held');
  });

  it('ignores another page claiming a record it does not write to', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'someone-elses-record',
      pageNonce: 'another-page',
    });

    expect(coordinator.autosaveRecordId()).toBe('id-held');
  });

  it('knows the record it is holding is live, so the sweep leaves it alone', () => {
    const { coordinator, active } = setup();
    hold(active, 'id-held');

    expect(coordinator.heldLive('id-held')).toBe(true);
    expect(coordinator.heldLive('someone-elses-record')).toBe(false);
  });

  it('knows a record another live page announced', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'their-record',
      pageNonce: 'another-page',
    });

    expect(coordinator.heldLive('their-record')).toBe(true);
  });

  it('forgets a record another page has stepped off', () => {
    // Held by page, not as a growing set of ids: a page that forks stops
    // protecting the record it left behind, which is free to expire.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.listen();

    channel.deliver({ kind: 'working-claim', workingRecordId: 'first', pageNonce: 'them' });
    channel.deliver({ kind: 'working-claim', workingRecordId: 'second', pageNonce: 'them' });

    expect(coordinator.heldLive('first')).toBe(false);
    expect(coordinator.heldLive('second')).toBe(true);
  });

  it('answers a page it has not heard from before, so its own record is known', () => {
    // Claims are made once, when a page takes a record. Without this answer a
    // page that started first would be invisible to one that started later, and
    // the later page's sweep would expire a record still being written.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track();
    TestBed.tick();
    coordinator.listen();
    channel.sent.length = 0;

    channel.deliver({ kind: 'working-claim', workingRecordId: 'theirs', pageNonce: 'newcomer' });
    channel.deliver({ kind: 'working-claim', workingRecordId: 'theirs', pageNonce: 'newcomer' });

    // Once per newly seen page, and never in answer to itself.
    expect(channel.sent).toEqual([
      { kind: 'working-claim', workingRecordId: 'id-held', pageNonce: coordinator.pageNonce },
    ]);
    stop();
  });

  it('answers a collision by forking rather than by re-announcing', () => {
    // Answering first would tell the duplicate to fork as well, and both pages
    // would step off the record, leaving it held by nobody.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track();
    TestBed.tick();
    coordinator.listen();
    channel.sent.length = 0;

    channel.deliver({ kind: 'working-claim', workingRecordId: 'id-held', pageNonce: 'duplicate' });
    TestBed.tick();

    expect(coordinator.autosaveRecordId()).not.toBe('id-held');
    expect(channel.sent).toEqual([
      {
        kind: 'working-claim',
        workingRecordId: coordinator.autosaveRecordId(),
        pageNonce: coordinator.pageNonce,
      },
    ]);
    stop();
  });

  it('leaves the collided record alone rather than deleting it', () => {
    const { coordinator, active, session } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track();
    TestBed.tick();

    coordinator.fork();
    TestBed.tick();

    // The session now points at the new record; nothing removed the old one,
    // which belongs to the other page.
    expect(JSON.parse(session.entries.get('ednb:tab')!)).toMatchObject({
      workingRecordId: coordinator.autosaveRecordId(),
    });
    expect(coordinator.autosaveRecordId()).not.toBe('id-held');
    stop();
  });
});
