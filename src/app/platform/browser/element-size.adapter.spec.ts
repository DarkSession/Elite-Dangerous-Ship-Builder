import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { ElementSizeAdapter, type ElementSize } from './element-size.adapter';

/**
 * What the adapter promises: a size when the browser reports one, zero when it
 * cannot, and no observer left running after `stop`.
 *
 * `ResizeObserver` is stubbed rather than awaited. The suite runs in jsdom,
 * which lays nothing out and so never delivers a real entry — a test that
 * waited for one would be waiting for something that cannot arrive. What is
 * being asserted here is this adapter's own contract, not the browser's.
 *
 * The no-browser case matters most. This is the only place in the anatomy's
 * path that touches layout at all, and a plate that threw where
 * `ResizeObserver` is missing would take the whole schematic down over a
 * measurement it is designed to fall back from.
 */
describe('ElementSizeAdapter', () => {
  const real = window.ResizeObserver;

  afterEach(() => {
    window.ResizeObserver = real;
  });

  function adapter(): ElementSizeAdapter {
    TestBed.configureTestingModule({});
    return TestBed.inject(ElementSizeAdapter);
  }

  /** A `ResizeObserver` whose deliveries this test decides. */
  function stubObserver(): {
    deliver: (width: number, height: number) => void;
    stopped: () => number;
  } {
    let callback: ResizeObserverCallback | null = null;
    let disconnects = 0;
    window.ResizeObserver = class {
      constructor(given: ResizeObserverCallback) {
        callback = given;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {
        disconnects += 1;
      }
    } as unknown as typeof ResizeObserver;

    return {
      deliver: (width, height) =>
        callback?.([{ contentRect: { width, height } }] as unknown as ResizeObserverEntry[], {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
        }),
      stopped: () => disconnects,
    };
  }

  it('says nothing until the browser has, then reports what it said', () => {
    const stub = stubObserver();
    const seen: ElementSize[] = [];
    adapter().observe(document.createElement('div'), (size) => seen.push(size));

    expect(seen).toEqual([]);
    stub.deliver(240, 80);
    expect(seen).toEqual([{ width: 240, height: 80 }]);
  });

  it('reports the most recent entry when several arrive at once', () => {
    const stub = stubObserver();
    const seen: ElementSize[] = [];
    adapter().observe(document.createElement('div'), (size) => seen.push(size));

    stub.deliver(240, 80);
    stub.deliver(300, 100);

    expect(seen.at(-1)).toEqual({ width: 300, height: 100 });
  });

  it('keeps reporting through one observer rather than rebuilding it', () => {
    // The defect this rules out: an earlier version handed back a signal, and
    // the caller's effect re-entered itself on every resize, tore the observer
    // down and published the replacement's unmeasured zero. A plate fed that
    // way reported a zero-width frame for ever after its first resize.
    const stub = stubObserver();
    const seen: ElementSize[] = [];
    adapter().observe(document.createElement('div'), (size) => seen.push(size));

    stub.deliver(240, 80);
    stub.deliver(300, 100);
    stub.deliver(180, 60);

    expect(seen).toEqual([
      { width: 240, height: 80 },
      { width: 300, height: 100 },
      { width: 180, height: 60 },
    ]);
    expect(stub.stopped()).toBe(0);
  });

  it('disconnects the observer when it is stopped', () => {
    const stub = stubObserver();
    const stop = adapter().observe(document.createElement('div'), () => {});

    stop();

    expect(stub.stopped()).toBe(1);
  });

  it('reports nothing where the browser has no ResizeObserver, rather than throwing', () => {
    // A plate must still draw its marks: an unmeasured separation is the
    // module's own fallback, and the alternative is no schematic at all.
    Reflect.deleteProperty(window, 'ResizeObserver');
    const seen: ElementSize[] = [];
    const stop = adapter().observe(document.createElement('div'), (size) => seen.push(size));

    expect(seen).toEqual([]);
    expect(() => stop()).not.toThrow();
  });
});
