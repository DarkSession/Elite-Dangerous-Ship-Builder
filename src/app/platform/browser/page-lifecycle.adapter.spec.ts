import { TestBed } from '@angular/core/testing';
import { PageLifecycleAdapter } from './page-lifecycle.adapter';

function adapter(): PageLifecycleAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(PageLifecycleAdapter);
}

describe('PageLifecycleAdapter', () => {
  it('flushes when the page is hidden away', () => {
    let flushes = 0;
    const unsubscribe = adapter().onFlush(() => (flushes += 1));

    window.dispatchEvent(new PageTransitionEvent('pagehide'));

    expect(flushes).toBe(1);
    unsubscribe();
  });

  it('flushes when the document becomes hidden, and not when it becomes visible', () => {
    let flushes = 0;
    const unsubscribe = adapter().onFlush(() => (flushes += 1));
    const visibility = (state: DocumentVisibilityState) =>
      Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });

    visibility('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    visibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    expect(flushes).toBe(1);
    unsubscribe();
  });

  it('stops flushing once unsubscribed', () => {
    let flushes = 0;
    const unsubscribe = adapter().onFlush(() => (flushes += 1));

    unsubscribe();
    window.dispatchEvent(new PageTransitionEvent('pagehide'));

    expect(flushes).toBe(0);
  });
});
