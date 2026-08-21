import { NO_FILTERS, type CatalogueFilters } from './catalogue-query';
import { activeConstraints, matchCount, withoutConstraint } from './catalogue-constraints';

function filters(overrides: Partial<CatalogueFilters>): CatalogueFilters {
  return { ...NO_FILTERS, ...overrides };
}

describe('active constraints', () => {
  it('names nothing when nothing is narrowed', () => {
    expect(activeConstraints(NO_FILTERS)).toEqual([]);
    expect(activeConstraints(filters({ query: '   ' }))).toEqual([]);
  });

  it('names every constraint separately, so each can be removed alone', () => {
    const active = activeConstraints(
      filters({
        query: 'cutter',
        sizes: ['large', 'small'],
        manufacturers: ['Gutamaya'],
        hardpointClasses: [4],
        price: { min: 100, max: 200 },
      }),
    );

    expect(active.map((constraint) => constraint.id)).toEqual([
      'query',
      'size:large',
      'size:small',
      'manufacturer:Gutamaya',
      'hardpoint:4',
      'price-min',
      'price-max',
    ]);
  });

  it('identifies a constraint by identity, never by its translated words', () => {
    const active = activeConstraints(filters({ manufacturers: ['Faulcon DeLacy'] }));

    expect(active[0]?.value).toBe('Faulcon DeLacy');
    expect(active[0]?.id).toBe('manufacturer:Faulcon DeLacy');
  });

  it('removes exactly one constraint, leaving the others in place', () => {
    const all = filters({
      query: 'cutter',
      sizes: ['large', 'small'],
      manufacturers: ['Gutamaya'],
      hardpointClasses: [4, 1],
      price: { min: 100, max: 200 },
    });

    for (const constraint of activeConstraints(all)) {
      const remaining = activeConstraints(withoutConstraint(all, constraint));

      expect(remaining.map((entry) => entry.id)).not.toContain(constraint.id);
      expect(remaining).toHaveLength(activeConstraints(all).length - 1);
    }
  });

  it('keeps the other bound when one price bound is removed', () => {
    const both = filters({ price: { min: 100, max: 200 } });
    const constraint = activeConstraints(both).find((entry) => entry.kind === 'price-min')!;

    const remaining = withoutConstraint(both, constraint);

    expect(remaining.price).toEqual({ min: null, max: 200 });
  });
});

describe('match count', () => {
  it('reports what is shown out of the whole catalogue', () => {
    expect(matchCount(3, 48, true)).toEqual({ shown: 3, total: 48, unconstrained: false });
  });

  it('says when the count is the whole catalogue rather than a result', () => {
    expect(matchCount(48, 48, false).unconstrained).toBe(true);
  });
});
