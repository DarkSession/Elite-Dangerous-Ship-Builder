import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RenderingTarget } from './rendering-target';

function target(platform?: string): RenderingTarget {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: platform === undefined ? [] : [{ provide: PLATFORM_ID, useValue: platform }],
  });
  return TestBed.inject(RenderingTarget);
}

describe('RenderingTarget', () => {
  it('reports a browser where the platform is one', () => {
    expect(target('browser').isBrowser).toBe(true);
  });

  it('reports no browser while the build renders a document', () => {
    expect(target('server').isBrowser).toBe(false);
  });

  it('reports a browser under the test platform, which is one', () => {
    // The default in this suite. Stated rather than assumed: a component that
    // skips work when this is false would silently skip it in every unit test
    // if the test platform ever reported otherwise.
    expect(target().isBrowser).toBe(true);
  });

  it('answers the same way every time it is asked', () => {
    // Read once at construction rather than per call. A capability that could
    // change its answer mid-render is one a component could render two ways
    // in one frame, which is the hydration mismatch 015/FR-009 forbids.
    const port = target('server');

    expect(port.isBrowser).toBe(false);
    expect(port.isBrowser).toBe(false);
  });
});
