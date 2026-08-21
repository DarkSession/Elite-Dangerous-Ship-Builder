import { DOCUMENT, inject } from '@angular/core';
import {
  LOCAL_STORAGE_PORT,
  SESSION_STORAGE_PORT,
  type StorageFailureCode,
  type StorageOutcome,
  type WebStoragePort,
  storageFailure,
  storageOk,
} from './web-storage.port';

/**
 * Classifies a thrown storage error into an outcome a Commander can act on.
 *
 * `QuotaExceededError` is matched by name as well as by the legacy numeric
 * codes, because Firefox and Safari have historically reported a full store
 * under different codes and one of them (`1014`) is not in the DOM standard at
 * all. Getting this wrong would tell a Commander their browser blocks storage
 * when in fact it is simply full — and offer them the wrong remedy.
 */
export function classifyStorageError(error: unknown): StorageFailureCode {
  if (typeof error !== 'object' || error === null) {
    return 'failed';
  }

  // Read defensively rather than narrowing on `instanceof`: a `DOMException` is
  // not an `Error` in every runtime this code runs in, and a failed narrowing
  // would classify a full store as an unexplained failure.
  const { name, code } = error as { name?: unknown; code?: unknown };

  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return 'quota';
  }
  if (code === 22 || code === 1014) {
    return 'quota';
  }
  if (name === 'SecurityError' || code === 18) {
    return 'blocked';
  }

  return 'failed';
}

/**
 * A `WebStoragePort` over one browser storage area.
 *
 * The storage object is acquired per operation rather than held, because the
 * failure it can raise is not permanent: a browser can block the area, and a
 * Commander can then allow it without reloading. Holding a reference taken at
 * construction would keep reporting the state at startup forever.
 */
export function createWebStoragePort(acquire: () => Storage | null): WebStoragePort {
  function attempt<T>(operation: (storage: Storage) => T): StorageOutcome<T> {
    try {
      const storage = acquire();
      if (storage === null) {
        return storageFailure('blocked');
      }
      return storageOk(operation(storage));
    } catch (error) {
      return storageFailure(classifyStorageError(error));
    }
  }

  return {
    keys: (prefix) =>
      attempt((storage) => {
        const found: string[] = [];
        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          // Only ever our own keys. Another application's value on this origin
          // is not ours to read, list, migrate or remove.
          if (key !== null && key.startsWith(prefix)) {
            found.push(key);
          }
        }
        return found as readonly string[];
      }),
    read: (key) => attempt((storage) => storage.getItem(key)),
    write: (key, value) => attempt((storage) => void storage.setItem(key, value)),
    remove: (key) => attempt((storage) => void storage.removeItem(key)),
  };
}

/** The production ports, bound to the real browser areas. */
export const WEB_STORAGE_PROVIDERS = [
  {
    provide: LOCAL_STORAGE_PORT,
    useFactory: () => {
      const view = inject(DOCUMENT).defaultView;
      return createWebStoragePort(() => view?.localStorage ?? null);
    },
  },
  {
    provide: SESSION_STORAGE_PORT,
    useFactory: () => {
      const view = inject(DOCUMENT).defaultView;
      return createWebStoragePort(() => view?.sessionStorage ?? null);
    },
  },
];
