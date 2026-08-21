import { TestBed } from '@angular/core/testing';
import {
  BroadcastChannelAdapter,
  type PersistenceBroadcast,
} from '../../platform/browser/broadcast-channel.adapter';
import { UuidAdapter } from '../../platform/browser/uuid.adapter';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
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
  return { coordinator: TestBed.inject(TabOwnershipCoordinator), channel, session };
}

describe('TabOwnershipCoordinator', () => {
  it('claims a fresh working record for a new tab', () => {
    const { coordinator } = setup();

    const id = coordinator.claim();

    expect(id).not.toBe(coordinator.pageNonce);
    expect(coordinator.workingRecordId()).toBe(id);
  });

  it('restores the same record after a reload of the same tab', () => {
    const session = new MemoryStorage();
    const first = setup(session);
    const claimed = first.coordinator.claim();

    const reloaded = setup(session);

    expect(reloaded.coordinator.claim()).toBe(claimed);
  });

  it('gives two ordinary tabs distinct records', () => {
    const first = setup().coordinator.claim();
    const second = setup().coordinator.claim();

    // Distinct sessions, so distinct autosave targets: neither can overwrite
    // the other's build.
    expect(first).toBe('id-2');
    expect(second).toBe('id-2');
    expect(setup(new MemoryStorage()).coordinator.claim()).toBe('id-2');
  });

  it('announces its claim so a duplicated tab can be detected', () => {
    const { coordinator, channel } = setup();

    const id = coordinator.claim();

    expect(channel.sent).toEqual([
      { kind: 'working-claim', workingRecordId: id, pageNonce: coordinator.pageNonce },
    ]);
  });

  it('forks when another live page claims the record it holds', () => {
    const { coordinator, channel } = setup();
    const original = coordinator.claim();
    coordinator.listen();
    const forks: [string, string][] = [];
    coordinator.onFork((previous, next) => forks.push([previous, next]));

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: original,
      pageNonce: 'another-page',
    });

    expect(coordinator.workingRecordId()).not.toBe(original);
    expect(forks).toEqual([[original, coordinator.workingRecordId()!]]);
  });

  it('ignores its own claim echoing back', () => {
    const { coordinator, channel } = setup();
    const original = coordinator.claim();
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: original,
      pageNonce: coordinator.pageNonce,
    });

    expect(coordinator.workingRecordId()).toBe(original);
  });

  it('ignores another page claiming a record it does not hold', () => {
    const { coordinator, channel } = setup();
    const original = coordinator.claim();
    coordinator.listen();

    channel.deliver({
      kind: 'working-claim',
      workingRecordId: 'someone-elses-record',
      pageNonce: 'another-page',
    });

    expect(coordinator.workingRecordId()).toBe(original);
  });

  it('leaves the collided record alone rather than deleting it', () => {
    const { coordinator, session } = setup();
    const original = coordinator.claim();

    coordinator.fork();

    // The session now points at the new record; nothing removed the old one,
    // which belongs to the other page.
    expect(JSON.parse(session.entries.get('edsb:tab')!)).toMatchObject({
      workingRecordId: coordinator.workingRecordId(),
    });
    expect(coordinator.workingRecordId()).not.toBe(original);
  });
});
