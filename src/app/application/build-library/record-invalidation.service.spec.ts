import { TestBed } from '@angular/core/testing';
import {
  BroadcastChannelAdapter,
  type PersistenceBroadcast,
} from '../../platform/browser/broadcast-channel.adapter';
import { RecordInvalidationService } from './record-invalidation.service';
import { recordKey } from '../../platform/storage/storage-keys';

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

  deliver(message: PersistenceBroadcast): void {
    for (const listener of this.#listeners) {
      listener(message);
    }
  }
}

function setup() {
  const channel = new FakeChannel();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: BroadcastChannelAdapter, useValue: channel }],
  });
  return { service: TestBed.inject(RecordInvalidationService), channel };
}

/** A storage event as another tab's write would produce it. */
function storageEvent(key: string | null, newValue: string | null): StorageEvent {
  return new StorageEvent('storage', { key, newValue });
}

describe('RecordInvalidationService', () => {
  it('invalidates when another tab writes an owned record', () => {
    const { service } = setup();
    const stop = service.listen();
    const before = service.revision();

    window.dispatchEvent(storageEvent(recordKey('r1'), '{}'));

    expect(service.revision()).toBe(before + 1);
    stop();
  });

  it('ignores a key this application does not own', () => {
    const { service } = setup();
    const stop = service.listen();
    const before = service.revision();

    window.dispatchEvent(storageEvent('another-app:record:x', '{}'));

    expect(service.revision()).toBe(before);
    stop();
  });

  it('treats the whole store being cleared as an invalidation', () => {
    const { service } = setup();
    const stop = service.listen();
    const before = service.revision();

    window.dispatchEvent(storageEvent(null, null));

    expect(service.revision()).toBe(before + 1);
    stop();
  });

  it('notices a record deleted elsewhere, so a tab can pause its own saving', () => {
    const { service } = setup();
    const stop = service.listen();

    window.dispatchEvent(storageEvent(recordKey('r1'), null));

    expect(service.deleted()).toEqual(['r1']);
    stop();
  });

  it('notices a delete announced over the channel', () => {
    const { service, channel } = setup();
    const stop = service.listen();

    channel.deliver({ kind: 'record-deleted', recordId: 'r2' });

    expect(service.deleted()).toEqual(['r2']);
    expect(service.revision()).toBeGreaterThan(0);
    stop();
  });

  it('invalidates on another page’s write announcement', () => {
    const { service, channel } = setup();
    const stop = service.listen();
    const before = service.revision();

    channel.deliver({ kind: 'record-written', recordId: 'r1', revisionId: 'v2' });

    expect(service.revision()).toBe(before + 1);
    expect(service.deleted()).toEqual([]);
    stop();
  });

  it('records a deleted id once, however many times it is announced', () => {
    const { service, channel } = setup();
    const stop = service.listen();

    channel.deliver({ kind: 'record-deleted', recordId: 'r2' });
    channel.deliver({ kind: 'record-deleted', recordId: 'r2' });

    expect(service.deleted()).toEqual(['r2']);
    stop();
  });

  it('forgets a delete once it has been acted on', () => {
    const { service, channel } = setup();
    const stop = service.listen();
    channel.deliver({ kind: 'record-deleted', recordId: 'r2' });

    service.acknowledgeDeleted('r2');

    expect(service.deleted()).toEqual([]);
    stop();
  });

  it('announces its own writes and deletes to sibling pages', () => {
    const { service, channel } = setup();

    service.announceWrite('r1', 'v2');
    service.announceDelete('r1');

    expect(channel.sent).toEqual([
      { kind: 'record-written', recordId: 'r1', revisionId: 'v2' },
      { kind: 'record-deleted', recordId: 'r1' },
    ]);
  });

  it('stops listening once unsubscribed', () => {
    const { service } = setup();
    const stop = service.listen();
    stop();
    const before = service.revision();

    window.dispatchEvent(storageEvent(recordKey('r1'), '{}'));

    expect(service.revision()).toBe(before);
  });
});
