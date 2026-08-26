import { describe, expect, it } from 'vitest';
import { slotName } from './slot-naming';

const LEDGER = {
  Slot08_Size4: 'Optional 8',
  MainEngines: 'Thrusters',
};

describe('slotName', () => {
  it('names a mount by the label the ledger draws for it', () => {
    expect(slotName(LEDGER, 'MainEngines')).toBe('Thrusters');
  });

  it('names it however the source spelled the key', () => {
    // The reported case: an import named the mount `slot08_size4`, the package
    // accepted it, and the notice printed the raw key back at the Commander
    // because the ledger lists it as `Slot08_Size4`.
    expect(slotName(LEDGER, 'slot08_size4')).toBe('Optional 8');
    expect(slotName(LEDGER, 'SLOT08_SIZE4')).toBe('Optional 8');
  });

  it('falls back to the key rather than naming no mount at all', () => {
    expect(slotName(LEDGER, 'Slot99_Size9')).toBe('Slot99_Size9');
  });
});
