import { TestBed } from '@angular/core/testing';
import {
  BroadcastChannelAdapter,
  isPersistenceBroadcast,
  type PersistenceBroadcast,
} from './broadcast-channel.adapter';

function adapter(): BroadcastChannelAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(BroadcastChannelAdapter);
}

describe('BroadcastChannelAdapter', () => {
  it('recognises only the messages this application sends', () => {
    expect(isPersistenceBroadcast({ kind: 'working-claim' })).toBe(true);
    expect(isPersistenceBroadcast({ kind: 'record-written' })).toBe(true);
    expect(isPersistenceBroadcast({ kind: 'record-deleted' })).toBe(true);
    expect(isPersistenceBroadcast({ kind: 'someone-elses-event' })).toBe(false);
    expect(isPersistenceBroadcast(null)).toBe(false);
    expect(isPersistenceBroadcast('working-claim')).toBe(false);
  });

  it('reports whether other pages can actually be reached', () => {
    expect(adapter().available).toBe(typeof BroadcastChannel === 'function');
  });

  it('subscribes and unsubscribes without throwing when the API is absent', () => {
    const port = adapter();
    const received: PersistenceBroadcast[] = [];

    const unsubscribe = port.subscribe((message) => received.push(message));
    port.post({ kind: 'record-deleted', recordId: 'a' });
    unsubscribe();

    expect(received.every(isPersistenceBroadcast)).toBe(true);
  });
});
