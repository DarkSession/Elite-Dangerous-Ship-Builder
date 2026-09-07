import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import {
  BroadcastChannelAdapter,
  type PersistenceBroadcast,
} from '../../platform/browser/broadcast-channel.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { TabDescriptorRepository } from '../../platform/storage/tab-descriptor.repository';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { TabOwnershipCoordinator } from './tab-ownership.coordinator';
import type { WorkingRecordSubject } from './working-record.port';

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
    sourceNamed: null,
    autosaveRecordId,
    baseline: null,
  });
}

/** A second tool tracking here, as the port describes one. */
function otherTool(recordId: string | null): WorkingRecordSubject {
  const held = signal<string | null>(recordId);
  return {
    tool: 'equipment',
    revision: signal(0),
    fingerprint: signal<string | null>('a-loadout'),
    dirty: signal(true),
    autosaveRecordId: held.asReadonly(),
    sourceNamed: signal(null),
    payload: () => null,
    setAutosaveRecordId: (id) => held.set(id),
    markSaved: () => {},
    setPersistence: () => {},
  };
}

describe('TabOwnershipCoordinator', () => {
  it('mints no page identity until one is needed', () => {
    // The shell reaches this coordinator to offer the bar's re-entry action,
    // and the prerender pass builds that shell in a runtime with no
    // cryptographic random source at all. Constructing it there has to cost
    // nothing, or every prerendered address fails to render.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideMemoryStorage(new MemoryStorage(), new MemoryStorage()),
        { provide: BroadcastChannelAdapter, useValue: new FakeChannel() },
        {
          provide: UuidAdapter,
          useValue: {
            create: () => {
              throw new Error('no cryptographic random source');
            },
          },
        },
      ],
    });

    const coordinator = TestBed.inject(TabOwnershipCoordinator);

    // Reading what this tab was working from asks for no identity of its own.
    expect(coordinator.claim('equipment')).toBeNull();
  });

  it('claims nothing for a tab that has never held a record', () => {
    // A fresh tab has no build and nothing to restore. That is the ordinary
    // state of one, not a failure, and it mints no record for a build that does
    // not exist yet (FR-008).
    expect(setup().coordinator.claim('ship')).toBeNull();
  });

  it('restores the record the same tab was working from after a reload', () => {
    const session = new MemoryStorage();
    const first = setup(session);
    hold(first.active, 'id-held');
    const stop = first.coordinator.track(first.active);
    TestBed.tick();
    stop();

    expect(setup(session).coordinator.claim('ship')).toBe('id-held');
  });

  it('lets go of one tool’s claim without touching the other tool’s', () => {
    // Starting an empty bench is where a tool stops writing to a record and
    // takes up no other. A claim left behind would restore the loadout a
    // Commander deliberately cleared, and a page holds a build and a loadout at
    // once, so only the one tool lets go (017/FR-006, FR-010).
    const session = new MemoryStorage();
    const { coordinator, active } = setup(session);
    hold(active, 'id-held');
    const stop = coordinator.track(active);
    TestBed.tick();
    TestBed.inject(TabDescriptorRepository).write('equipment', 'a-loadout');

    coordinator.release('ship');

    expect(coordinator.claim('ship')).toBeNull();
    expect(coordinator.claim('equipment')).toBe('a-loadout');

    // And the tool is not finished: the next record it takes up is claimed the
    // way any other is.
    hold(active, 'id-next');
    TestBed.tick();

    expect(coordinator.claim('ship')).toBe('id-next');
    stop();
  });

  it('gives two ordinary tabs distinct records', () => {
    const first = setup();
    hold(first.active, 'first-record');
    const second = setup(new MemoryStorage());

    // Distinct sessions, so distinct autosave targets: neither can overwrite
    // the other's build.
    expect(second.coordinator.claim('ship')).toBeNull();
  });

  it('announces the record the store holds, so a duplicated tab can be detected', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');

    const stop = coordinator.track(active);
    TestBed.tick();

    expect(channel.sent).toEqual([
      {
        kind: 'working-claim',
        tool: 'ship',
        workingRecordId: 'id-held',
        pageNonce: coordinator.pageNonce,
      },
    ]);
    stop();
  });

  it('announces one record once, however often the store is read', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track(active);
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

    const stop = coordinator.track(active);
    TestBed.tick();

    expect(channel.sent).toEqual([]);
    stop();
  });

  it('forks when another live page claims the record it writes to', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
    coordinator.listen();
    const forks: [string, string][] = [];
    coordinator.onFork('ship', (previous: string, next: string) => forks.push([previous, next]));

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'id-held',
      pageNonce: 'another-page',
    });

    expect(active.autosaveRecordId()).not.toBe('id-held');
    expect(forks).toEqual([['id-held', active.autosaveRecordId()!]]);
  });

  it('ignores its own claim echoing back', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'id-held',
      pageNonce: coordinator.pageNonce,
    });

    expect(active.autosaveRecordId()).toBe('id-held');
  });

  it('ignores another page claiming a record it does not write to', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'someone-elses-record',
      pageNonce: 'another-page',
    });

    expect(active.autosaveRecordId()).toBe('id-held');
  });

  it('knows the record it is holding is live, so the sweep leaves it alone', () => {
    const { coordinator, active } = setup();
    hold(active, 'id-held');
    coordinator.track(active);

    expect(coordinator.heldLive('id-held')).toBe(true);
    expect(coordinator.heldLive('someone-elses-record')).toBe(false);
  });

  it('knows a record another live page announced', () => {
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
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
    coordinator.track(active);
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'first',
      pageNonce: 'them',
    });
    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'second',
      pageNonce: 'them',
    });

    expect(coordinator.heldLive('first')).toBe(false);
    expect(coordinator.heldLive('second')).toBe(true);
  });

  it('answers a page it has not heard from before, so its own record is known', () => {
    // Claims are made once, when a page takes a record. Without this answer a
    // page that started first would be invisible to one that started later, and
    // the later page's sweep would expire a record still being written.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track(active);
    TestBed.tick();
    coordinator.listen();
    channel.sent.length = 0;

    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'theirs',
      pageNonce: 'newcomer',
    });
    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'theirs',
      pageNonce: 'newcomer',
    });

    // Once per newly seen page, and never in answer to itself.
    expect(channel.sent).toEqual([
      {
        kind: 'working-claim',
        tool: 'ship',
        workingRecordId: 'id-held',
        pageNonce: coordinator.pageNonce,
      },
    ]);
    stop();
  });

  it('answers a collision by forking rather than by re-announcing', () => {
    // Answering first would tell the duplicate to fork as well, and both pages
    // would step off the record, leaving it held by nobody.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track(active);
    TestBed.tick();
    coordinator.listen();
    channel.sent.length = 0;

    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'id-held',
      pageNonce: 'duplicate',
    });
    TestBed.tick();

    expect(active.autosaveRecordId()).not.toBe('id-held');
    expect(channel.sent).toEqual([
      {
        kind: 'working-claim',
        tool: 'ship',
        workingRecordId: active.autosaveRecordId(),
        pageNonce: coordinator.pageNonce,
      },
    ]);
    stop();
  });

  it('claims, announces and forks one record per tool', () => {
    // A page holds a build and a loadout at once. A duplicated tab colliding on
    // one of them moves that one and leaves the other exactly where it is
    // (017/FR-010).
    const { coordinator, active, channel, session } = setup();
    hold(active, 'the-build');
    const loadout = otherTool('the-loadout');
    coordinator.track(active);
    coordinator.track(loadout);
    TestBed.tick();
    coordinator.listen();

    expect(JSON.parse(session.entries.get('ednb:tab')!).workingRecords).toEqual({
      ship: 'the-build',
      equipment: 'the-loadout',
    });
    expect(channel.sent.map((message) => message)).toEqual([
      {
        kind: 'working-claim',
        tool: 'ship',
        workingRecordId: 'the-build',
        pageNonce: coordinator.pageNonce,
      },
      {
        kind: 'working-claim',
        tool: 'equipment',
        workingRecordId: 'the-loadout',
        pageNonce: coordinator.pageNonce,
      },
    ]);

    channel.deliver({
      kind: 'working-claim',
      tool: 'equipment',
      workingRecordId: 'the-loadout',
      pageNonce: 'duplicate',
    });

    expect(loadout.autosaveRecordId()).not.toBe('the-loadout');
    expect(active.autosaveRecordId()).toBe('the-build');
  });

  it('protects both of this page’s records from the sweep', () => {
    const { coordinator, active } = setup();
    hold(active, 'the-build');
    coordinator.track(active);
    coordinator.track(otherTool('the-loadout'));

    expect(coordinator.heldLive('the-build')).toBe(true);
    expect(coordinator.heldLive('the-loadout')).toBe(true);
  });

  it('protects both records another live page announced', () => {
    // Held by page and tool: a page announcing its loadout must not take the
    // protection off the build it announced a moment earlier.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'their-build',
      pageNonce: 'them',
    });
    channel.deliver({
      kind: 'working-claim',
      tool: 'equipment',
      workingRecordId: 'their-loadout',
      pageNonce: 'them',
    });

    expect(coordinator.heldLive('their-build')).toBe(true);
    expect(coordinator.heldLive('their-loadout')).toBe(true);
  });

  it('reads a claim that names no tool as the ship tool’s', () => {
    // What a page running a version that held one record per tab announces. It
    // meant the build, and a claim read as being about nothing would leave two
    // pages autosaving into one record.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'id-held',
      pageNonce: 'older-page',
    });

    expect(active.autosaveRecordId()).not.toBe('id-held');
  });

  it('opens one subscription however many screens listen', () => {
    // Two screens listening would answer one claim twice: two forks for one
    // collision, and the second onto a record nothing announced.
    const { coordinator, active, channel } = setup();
    hold(active, 'id-held');
    coordinator.track(active);
    TestBed.tick();
    const stopFirst = coordinator.listen();
    const stopSecond = coordinator.listen();
    channel.sent.length = 0;

    channel.deliver({
      kind: 'working-claim',
      tool: 'ship',
      workingRecordId: 'theirs',
      pageNonce: 'newcomer',
    });

    expect(channel.sent).toHaveLength(1);
    stopFirst();
    stopSecond();
  });

  it('leaves the collided record alone rather than deleting it', () => {
    const { coordinator, active, session } = setup();
    hold(active, 'id-held');
    const stop = coordinator.track(active);
    TestBed.tick();

    coordinator.fork('ship');
    TestBed.tick();

    // The session now points at the new record; nothing removed the old one,
    // which belongs to the other page.
    expect(JSON.parse(session.entries.get('ednb:tab')!)).toMatchObject({
      workingRecords: { ship: active.autosaveRecordId() },
    });
    expect(active.autosaveRecordId()).not.toBe('id-held');
    stop();
  });
});
