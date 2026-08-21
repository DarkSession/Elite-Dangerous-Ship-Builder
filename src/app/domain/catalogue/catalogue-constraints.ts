import type { CatalogueFilters } from './catalogue-query';
import type { CatalogueSort } from './catalogue-sort';

/** One removable constraint, named so a Commander can undo exactly it. */
export interface ActiveConstraint {
  /** Stable identity, so removing one never depends on its translated words. */
  readonly id: string;
  /** Which control it came from. */
  readonly kind: 'query' | 'size' | 'manufacturer' | 'hardpoint' | 'price-min' | 'price-max';
  /** The raw value, for the presentation layer to format and label. */
  readonly value: string | number;
}

/**
 * Everything currently narrowing the catalogue, as removable items.
 *
 * A list rather than a sentence: "search: cutter, size: large" can be read as
 * two things a Commander can take off individually, and a sentence cannot. The
 * words come later — this names what is on, and the screen says it.
 */
export function activeConstraints(filters: CatalogueFilters): readonly ActiveConstraint[] {
  const constraints: ActiveConstraint[] = [];
  const query = filters.query.trim();

  if (query.length > 0) {
    constraints.push({ id: 'query', kind: 'query', value: query });
  }
  for (const size of filters.sizes) {
    constraints.push({ id: `size:${size}`, kind: 'size', value: size });
  }
  for (const manufacturer of filters.manufacturers) {
    constraints.push({
      id: `manufacturer:${manufacturer}`,
      kind: 'manufacturer',
      value: manufacturer,
    });
  }
  for (const hardpointClass of filters.hardpointClasses) {
    constraints.push({
      id: `hardpoint:${hardpointClass}`,
      kind: 'hardpoint',
      value: hardpointClass,
    });
  }
  if (filters.price.min !== null) {
    constraints.push({ id: 'price-min', kind: 'price-min', value: filters.price.min });
  }
  if (filters.price.max !== null) {
    constraints.push({ id: 'price-max', kind: 'price-max', value: filters.price.max });
  }

  return constraints;
}

/** Removes exactly one constraint, leaving every other one in place. */
export function withoutConstraint(
  filters: CatalogueFilters,
  constraint: ActiveConstraint,
): CatalogueFilters {
  switch (constraint.kind) {
    case 'query':
      return { ...filters, query: '' };
    case 'size':
      return { ...filters, sizes: filters.sizes.filter((size) => size !== constraint.value) };
    case 'manufacturer':
      return {
        ...filters,
        manufacturers: filters.manufacturers.filter((name) => name !== constraint.value),
      };
    case 'hardpoint':
      return {
        ...filters,
        hardpointClasses: filters.hardpointClasses.filter((size) => size !== constraint.value),
      };
    case 'price-min':
      return { ...filters, price: { ...filters.price, min: null } };
    case 'price-max':
      return { ...filters, price: { ...filters.price, max: null } };
  }
}

/** How many hulls a constrained catalogue is showing, and out of how many. */
export interface MatchCount {
  readonly shown: number;
  readonly total: number;
  /** True when nothing is narrowing the catalogue, so the count is the whole of it. */
  readonly unconstrained: boolean;
}

export function matchCount(shown: number, total: number, constrained: boolean): MatchCount {
  return { shown, total, unconstrained: !constrained };
}

/** A stable description of the order, for the sort control's own text. */
export function describeSort(sort: CatalogueSort): { field: string; direction: string } {
  return { field: sort.field, direction: sort.direction };
}
