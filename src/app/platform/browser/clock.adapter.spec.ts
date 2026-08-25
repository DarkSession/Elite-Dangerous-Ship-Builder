import { TestBed } from '@angular/core/testing';
import { ClockAdapter } from './clock.adapter';

function adapter(): ClockAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ClockAdapter);
}

describe('ClockAdapter', () => {
  it('reads the current instant', () => {
    const before = Date.now();
    const read = adapter().now().getTime();
    const after = Date.now();

    expect(read).toBeGreaterThanOrEqual(before);
    expect(read).toBeLessThanOrEqual(after);
  });

  it('stamps an ISO-8601 instant', () => {
    const stamped = adapter().timestamp();

    expect(stamped).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Number.isNaN(Date.parse(stamped))).toBe(false);
  });

  it('derives the stamp from the instant, so overriding one moves both', () => {
    // The reason the two are not separate reads: a record stamped from one
    // clock and expired against another can be swept the moment it is written.
    const port = adapter();
    const frozen = new Date('2026-08-25T09:41:00.000Z');
    port.now = () => frozen;

    expect(port.timestamp()).toBe('2026-08-25T09:41:00.000Z');
    expect(port.now()).toBe(frozen);
  });
});
