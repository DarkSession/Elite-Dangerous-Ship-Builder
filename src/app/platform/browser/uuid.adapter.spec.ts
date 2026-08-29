import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UuidAdapter } from './uuid.adapter';

function adapter(source?: Crypto): UuidAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers:
      source === undefined
        ? []
        : [{ provide: DOCUMENT, useValue: { defaultView: { crypto: source } } }],
  });
  return TestBed.inject(UuidAdapter);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('UuidAdapter', () => {
  it('creates a distinct identity every time', () => {
    const port = adapter();
    const identities = new Set(Array.from({ length: 100 }, () => port.create()));

    expect(identities.size).toBe(100);
  });

  it('creates a version-4 identity', () => {
    expect(adapter().create()).toMatch(UUID);
  });

  it('is not derived from the clock, so two identities in one tick still differ', () => {
    const port = adapter();

    expect(port.create()).not.toBe(port.create());
  });

  it('uses random bytes when an insecure context offers no randomUUID helper', () => {
    const values = Uint8Array.from({ length: 16 }, (_, index) => index);
    const source = {
      getRandomValues(target: Uint8Array): Uint8Array {
        target.set(values);
        return target;
      },
    } as unknown as Crypto;

    expect(adapter(source).create()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
  });
});
