import { TestBed } from '@angular/core/testing';
import { UuidAdapter, formatUuid } from './uuid.adapter';

function adapter(): UuidAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
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

  it('formats raw random bytes as a version-4 identity', () => {
    const formatted = formatUuid(new Uint8Array(16).fill(0xff));

    expect(formatted).toMatch(UUID);
  });

  it('is not derived from the clock, so two identities in one tick still differ', () => {
    const port = adapter();

    expect(port.create()).not.toBe(port.create());
  });
});
