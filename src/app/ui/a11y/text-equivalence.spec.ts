import {
  bidiIsolate,
  describedBy,
  readTextEquivalent,
  relationId,
  stripBidiIsolation,
} from './text-equivalence';

describe('relationId', () => {
  it('namespaces ids to the application', () => {
    expect(relationId('error')).toMatch(/^edsb-error-\d+$/);
  });

  it('never repeats an id, so two instances cannot share a description', () => {
    const ids = new Set(Array.from({ length: 50 }, () => relationId('label')));

    expect(ids.size).toBe(50);
  });
});

describe('describedBy', () => {
  it('joins the ids that are present', () => {
    expect(describedBy('a', 'b')).toBe('a b');
  });

  it('drops absent ids rather than emitting a broken reference', () => {
    expect(describedBy('a', null, undefined, '')).toBe('a');
  });

  it('returns null when nothing describes the control', () => {
    expect(describedBy(null, undefined, '')).toBeNull();
  });
});

describe('bidiIsolate', () => {
  it('wraps a value in isolation characters', () => {
    const isolated = bidiIsolate('-5.2');

    expect(isolated.startsWith('⁨')).toBe(true);
    expect(isolated.endsWith('⁩')).toBe(true);
  });

  it('does not change the value itself', () => {
    expect(stripBidiIsolation(bidiIsolate('Int_Powerplant_Size4_Class5'))).toBe(
      'Int_Powerplant_Size4_Class5',
    );
  });

  it('round-trips a signed number, which bidi reordering would corrupt', () => {
    expect(stripBidiIsolation(bidiIsolate('-5.2'))).toBe('-5.2');
  });
});

describe('readTextEquivalent', () => {
  it('reads meaning, then value, then unit, then condition', () => {
    const text = stripBidiIsolation(
      readTextEquivalent({
        label: 'Jump range',
        value: '20.45',
        unit: 'ly',
        condition: 'laden',
      }),
    );

    expect(text).toBe('Jump range 20.45 ly laden');
  });

  it('omits an absent unit and condition', () => {
    const text = stripBidiIsolation(
      readTextEquivalent({ label: 'Hardpoints', value: '4', unit: null, condition: null }),
    );

    expect(text).toBe('Hardpoints 4');
  });

  it('isolates the value so a right-to-left context cannot reorder it', () => {
    const text = readTextEquivalent({
      label: 'Change',
      value: '-5.2',
      unit: null,
      condition: null,
    });

    expect(text).toContain('⁨-5.2⁩');
  });
});
