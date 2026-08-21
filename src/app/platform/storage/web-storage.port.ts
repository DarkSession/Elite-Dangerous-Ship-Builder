import { InjectionToken } from '@angular/core';

/**
 * Why a storage operation could not be completed.
 *
 * Three outcomes, because the Commander is told three different things and
 * offered three different actions: a blocked store means persistence is
 * unavailable for the session, a full one means records can be discarded and
 * the write retried, and anything else means this write failed and the previous
 * bytes still stand (persistence contract, "Failure behavior").
 */
export type StorageFailureCode = 'blocked' | 'quota' | 'failed';

/**
 * The result of one storage operation.
 *
 * Every operation returns one of these rather than throwing, because every
 * caller has to handle failure — persistence failing may never take the active
 * build with it — and an exception that has to be caught at every call site is
 * an exception that will eventually not be.
 */
export type StorageOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: StorageFailureCode };

/** A successful outcome. */
export function storageOk<T>(value: T): StorageOutcome<T> {
  return { ok: true, value };
}

/** A failed outcome, named by what a Commander can do about it. */
export function storageFailure<T>(code: StorageFailureCode): StorageOutcome<T> {
  return { ok: false, code };
}

/**
 * One Web Storage area, behind an exception boundary.
 *
 * Acquiring the storage object is itself an operation that can throw — a
 * browser with site data blocked raises on the property access, not on the
 * first read — so acquisition sits inside the boundary too, and there is no
 * method here that reaches a global directly.
 */
export interface WebStoragePort {
  /** The keys this application owns, filtered by the caller's prefix. */
  keys(prefix: string): StorageOutcome<readonly string[]>;
  /** The stored value, or `null` when no such key exists. */
  read(key: string): StorageOutcome<string | null>;
  /** Replaces one key's value in a single call. */
  write(key: string, value: string): StorageOutcome<void>;
  /** Removes one key. Removing an absent key succeeds. */
  remove(key: string): StorageOutcome<void>;
}

/** Durable local records live here. */
export const LOCAL_STORAGE_PORT = new InjectionToken<WebStoragePort>('LOCAL_STORAGE_PORT');

/** This browsing context's tab descriptor and catalogue session live here. */
export const SESSION_STORAGE_PORT = new InjectionToken<WebStoragePort>('SESSION_STORAGE_PORT');
