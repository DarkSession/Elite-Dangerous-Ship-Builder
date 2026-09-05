import { Injectable, computed, inject, signal } from '@angular/core';
import { NO_FILTERS, type CatalogueFilters } from '../../domain/ships/catalogue/catalogue-query';
import { DEFAULT_SORT, type CatalogueSort } from '../../domain/ships/catalogue/catalogue-sort';
import { SESSION_STORAGE_PORT } from '../../platform/storage/web-storage.port';

/** Where the Commander was in the list, so returning puts them back there. */
export interface ResultAnchor {
  readonly symbol: string;
  /** Pixels from the top of that hull's own row or card. */
  readonly offsetWithinItem: number;
}

/** The catalogue's browsing state for this tab. */
export interface CatalogueSessionState {
  readonly filters: CatalogueFilters;
  readonly sort: CatalogueSort;
  readonly anchor: ResultAnchor | null;
}

/** The key this store owns in `sessionStorage`, and the shape it writes. */
const SESSION_KEY = 'ednb:catalogue';
const SESSION_VERSION = 2;

/**
 * How the Commander is currently looking at the catalogue.
 *
 * Search text, facets, order and scroll position, and nothing else. This is
 * emphatically **not** build state: it never becomes part of a build, a saved
 * record, a route query parameter or a link, because none of it is something a
 * Commander means to share when they share a build (FR-003).
 *
 * It survives a reload through `sessionStorage`, which is scoped to this tab,
 * so two windows can browse the catalogue differently. A storage failure loses
 * the browsing position and nothing else, so every write here is best-effort.
 */
@Injectable({ providedIn: 'root' })
export class CatalogueSessionStore {
  readonly #session = inject(SESSION_STORAGE_PORT);

  readonly #filters = signal<CatalogueFilters>(NO_FILTERS);
  readonly #sort = signal<CatalogueSort>(DEFAULT_SORT);
  readonly #anchor = signal<ResultAnchor | null>(null);

  readonly filters = this.#filters.asReadonly();
  readonly sort = this.#sort.asReadonly();
  readonly anchor = this.#anchor.asReadonly();

  readonly state = computed<CatalogueSessionState>(() => ({
    filters: this.#filters(),
    sort: this.#sort(),
    anchor: this.#anchor(),
  }));

  constructor() {
    this.restore();
  }

  setFilters(filters: CatalogueFilters): void {
    this.#filters.set(filters);
    // Constraints changed, so the remembered position is about a list that no
    // longer exists. Keeping it would scroll to the wrong hull.
    this.#anchor.set(null);
    this.#persist();
  }

  setSort(sort: CatalogueSort): void {
    this.#sort.set(sort);
    this.#anchor.set(null);
    this.#persist();
  }

  clearFilters(): void {
    this.setFilters(NO_FILTERS);
  }

  setAnchor(anchor: ResultAnchor | null): void {
    this.#anchor.set(anchor);
    this.#persist();
  }

  /** Reads the tab's browsing state back. Anything unreadable is simply ignored. */
  restore(): void {
    const read = this.#session.read(SESSION_KEY);
    if (!read.ok || read.value === null) {
      return;
    }

    const parsed = parseSession(read.value);
    if (parsed === null) {
      return;
    }

    this.#filters.set(parsed.filters);
    this.#sort.set(parsed.sort);
    this.#anchor.set(parsed.anchor);
  }

  #persist(): void {
    // Best effort by design: browsing position is a convenience, and a browser
    // that refuses to store it must not interrupt browsing to say so.
    this.#session.write(SESSION_KEY, JSON.stringify({ version: SESSION_VERSION, ...this.state() }));
  }
}

/**
 * Reads a stored session as untrusted input.
 *
 * Returns `null` for anything that is not exactly what this version writes,
 * including a newer version: browsing state is cheap to rebuild and there is
 * nothing to gain by guessing at a shape we do not recognise.
 */
function parseSession(raw: string): CatalogueSessionState | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const stored = value as Record<string, unknown>;
  if (stored['version'] !== SESSION_VERSION) {
    return null;
  }

  const filters = stored['filters'];
  const sort = stored['sort'];
  if (!isFilters(filters) || !isSort(sort)) {
    return null;
  }

  return { filters, sort, anchor: isAnchor(stored['anchor']) ? stored['anchor'] : null };
}

function isFilters(value: unknown): value is CatalogueFilters {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const filters = value as Record<string, unknown>;
  return typeof filters['query'] === 'string' && isStringArray(filters['sizes']);
}

function isSort(value: unknown): value is CatalogueSort {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const sort = value as Record<string, unknown>;
  return (
    ['name', 'manufacturer', 'size', 'hardpoints', 'price'].includes(sort['field'] as string) &&
    ['ascending', 'descending'].includes(sort['direction'] as string)
  );
}

function isAnchor(value: unknown): value is ResultAnchor {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const anchor = value as Record<string, unknown>;
  return typeof anchor['symbol'] === 'string' && typeof anchor['offsetWithinItem'] === 'number';
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}
