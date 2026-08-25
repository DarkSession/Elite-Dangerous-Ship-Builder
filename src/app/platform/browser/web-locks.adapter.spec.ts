import { TestBed } from '@angular/core/testing';
import { LocksUnavailableError, WebLocksAdapter } from './web-locks.adapter';

function adapter(): WebLocksAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(WebLocksAdapter);
}

describe('WebLocksAdapter', () => {
  it('reports availability rather than pretending to lock', () => {
    expect(adapter().available).toBe(typeof navigator.locks?.request === 'function');
  });

  it('refuses to run a guarded operation when locking is unavailable', async () => {
    const port = adapter();
    if (port.available) {
      const value = await port.request('edsb:record:a', async () => 'ran');
      expect(value).toBe('ran');
      return;
    }

    await expect(port.request('edsb:record:a', async () => 'ran')).rejects.toBeInstanceOf(
      LocksUnavailableError,
    );
  });
});
