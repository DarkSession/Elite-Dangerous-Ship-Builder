import { TestBed } from '@angular/core/testing';
import { SESSION_STORAGE_PORT, type WebStoragePort } from '../../platform/storage/web-storage.port';
import { CatalogueSessionStore } from './catalogue-session.store';

/** A session store a test can inspect and break on demand. */
class FakeSession implements WebStoragePort {
  readonly entries = new Map<string, string>();
  failing = false;

  keys(prefix: string) {
    return this.failing
      ? ({ ok: false, code: 'blocked' } as const)
      : ({
          ok: true,
          value: [...this.entries.keys()].filter((key) => key.startsWith(prefix)),
        } as const);
  }

  read(key: string) {
    return this.failing
      ? ({ ok: false, code: 'blocked' } as const)
      : ({ ok: true, value: this.entries.get(key) ?? null } as const);
  }

  write(key: string, value: string) {
    if (this.failing) {
      return { ok: false, code: 'blocked' } as const;
    }
    this.entries.set(key, value);
    return { ok: true, value: undefined } as const;
  }

  remove(key: string) {
    this.entries.delete(key);
    return { ok: true, value: undefined } as const;
  }
}

function setup(session = new FakeSession()): {
  store: CatalogueSessionStore;
  session: FakeSession;
} {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SESSION_STORAGE_PORT, useValue: session }],
  });
  return { store: TestBed.inject(CatalogueSessionStore), session };
}

describe('CatalogueSessionStore', () => {
  it('starts unconstrained, in the package’s own order', () => {
    const { store } = setup();

    expect(store.constrained()).toBe(false);
    expect(store.filters().query).toBe('');
    expect(store.sort()).toEqual({ field: 'name', direction: 'ascending' });
    expect(store.anchor()).toBeNull();
  });

  it('remembers filters, order and position for this tab', () => {
    const { store, session } = setup();

    store.setFilters({ ...store.filters(), query: 'cutter' });
    store.setSort({ field: 'price', direction: 'descending' });
    store.setAnchor({ symbol: 'Anaconda', offsetWithinItem: 24 });

    const restored = setup(session).store;

    expect(restored.filters().query).toBe('cutter');
    expect(restored.sort()).toEqual({ field: 'price', direction: 'descending' });
    expect(restored.anchor()).toEqual({ symbol: 'Anaconda', offsetWithinItem: 24 });
  });

  it('writes browsing state nowhere but its own session key', () => {
    const { store, session } = setup();

    store.setFilters({ ...store.filters(), query: 'cutter' });

    expect([...session.entries.keys()]).toEqual(['edsb:catalogue']);
    // Not a build, not a record, not a URL.
    expect([...session.entries.keys()].some((key) => key.startsWith('edsb:record:'))).toBe(false);
  });

  it('forgets the remembered position when the list changes underneath it', () => {
    const { store } = setup();
    store.setAnchor({ symbol: 'Anaconda', offsetWithinItem: 24 });

    store.setFilters({ ...store.filters(), query: 'adder' });

    expect(store.anchor()).toBeNull();
  });

  it('forgets the remembered position when the order changes', () => {
    const { store } = setup();
    store.setAnchor({ symbol: 'Anaconda', offsetWithinItem: 24 });

    store.setSort({ field: 'price', direction: 'ascending' });

    expect(store.anchor()).toBeNull();
  });

  it('clears every constraint at once', () => {
    const { store } = setup();
    store.setFilters({
      query: 'cutter',
      sizes: ['large'],
      manufacturers: ['Gutamaya'],
      hardpointClasses: [4],
      price: { min: 1, max: 2 },
    });

    store.clearFilters();

    expect(store.constrained()).toBe(false);
  });

  it('ignores a stored session written by another version', () => {
    const session = new FakeSession();
    session.entries.set('edsb:catalogue', JSON.stringify({ version: 99, filters: {}, sort: {} }));

    expect(setup(session).store.filters().query).toBe('');
  });

  it('ignores a stored session that is not readable at all', () => {
    const session = new FakeSession();
    session.entries.set('edsb:catalogue', 'not json');

    expect(setup(session).store.filters().query).toBe('');
  });

  it('ignores a stored session whose shape does not match', () => {
    const session = new FakeSession();
    session.entries.set(
      'edsb:catalogue',
      JSON.stringify({ version: 1, filters: { query: 7 }, sort: { field: 'name' } }),
    );

    expect(setup(session).store.filters().query).toBe('');
  });

  it('keeps browsing when the browser refuses to store anything', () => {
    const session = new FakeSession();
    session.failing = true;
    const { store } = setup(session);

    store.setFilters({ ...store.filters(), query: 'cutter' });

    expect(store.filters().query).toBe('cutter');
    expect(store.constrained()).toBe(true);
  });
});
