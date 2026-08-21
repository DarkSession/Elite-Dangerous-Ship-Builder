import { LOCAL_STORAGE_PORT, SESSION_STORAGE_PORT } from './web-storage.port';
import { createWebStoragePort } from './web-storage.adapter';

/** An in-memory `Storage` a test can inspect, seed and break. */
export class MemoryStorage implements Storage {
  readonly entries = new Map<string, string>();

  /** Set to throw from the next `setItem`, to exercise a failed write. */
  writeError: Error | null = null;

  /** Set to throw from acquisition, to exercise a blocked store. */
  accessError: Error | null = null;

  get length(): number {
    return this.entries.size;
  }

  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.writeError) {
      throw this.writeError;
    }
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

/** A quota failure, spelled the way a browser spells it. */
export function quotaError(): DOMException {
  return new DOMException('exceeded', 'QuotaExceededError');
}

/** A blocked-store failure. */
export function blockedError(): DOMException {
  return new DOMException('denied', 'SecurityError');
}

/** Providers binding both storage ports to in-memory stores. */
export function provideMemoryStorage(local: MemoryStorage, session = new MemoryStorage()) {
  const acquire = (storage: MemoryStorage) => () => {
    if (storage.accessError) {
      throw storage.accessError;
    }
    return storage;
  };

  return [
    { provide: LOCAL_STORAGE_PORT, useValue: createWebStoragePort(acquire(local)) },
    { provide: SESSION_STORAGE_PORT, useValue: createWebStoragePort(acquire(session)) },
  ];
}
