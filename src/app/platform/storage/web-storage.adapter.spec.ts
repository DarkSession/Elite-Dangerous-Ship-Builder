import { EDNB_RECORD_KEY_PREFIX } from './storage-keys';
import { classifyStorageError, createWebStoragePort } from './web-storage.adapter';

/** A storage area whose behaviour a test can dictate per operation. */
class FakeStorage implements Storage {
  readonly #entries = new Map<string, string>();
  throwOnWrite: Error | null = null;

  get length(): number {
    return this.#entries.size;
  }

  key(index: number): string | null {
    return [...this.#entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.#entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnWrite) {
      throw this.throwOnWrite;
    }
    this.#entries.set(key, value);
  }

  removeItem(key: string): void {
    this.#entries.delete(key);
  }

  clear(): void {
    this.#entries.clear();
  }
}

function quotaError(): DOMException {
  return new DOMException('exceeded', 'QuotaExceededError');
}

describe('storage error classification', () => {
  it('names a blocked store', () => {
    expect(classifyStorageError(new DOMException('denied', 'SecurityError'))).toBe('blocked');
  });

  it('names a full store, including the legacy Firefox spelling', () => {
    expect(classifyStorageError(quotaError())).toBe('quota');
    expect(classifyStorageError(new DOMException('full', 'NS_ERROR_DOM_QUOTA_REACHED'))).toBe(
      'quota',
    );
  });

  it('names anything else a plain failure rather than guessing', () => {
    expect(classifyStorageError(new Error('something'))).toBe('failed');
    expect(classifyStorageError('not an error')).toBe('failed');
  });
});

describe('web storage port', () => {
  it('reads and writes one key at a time', () => {
    const storage = new FakeStorage();
    const port = createWebStoragePort(() => storage);

    expect(port.write('ednb:record:a', '{"a":1}')).toEqual({ ok: true, value: undefined });
    expect(port.read('ednb:record:a')).toEqual({ ok: true, value: '{"a":1}' });
    expect(port.read('ednb:record:missing')).toEqual({ ok: true, value: null });
  });

  it('enumerates only the keys this application owns', () => {
    const storage = new FakeStorage();
    storage.setItem('ednb:record:a', '1');
    storage.setItem('ednb:record:b', '2');
    storage.setItem('another-app:record:c', '3');
    storage.setItem('ednb:tab', '4');
    const port = createWebStoragePort(() => storage);

    expect(port.keys(EDNB_RECORD_KEY_PREFIX)).toEqual({
      ok: true,
      value: ['ednb:record:a', 'ednb:record:b'],
    });
  });

  it('reports a blocked store rather than throwing', () => {
    const port = createWebStoragePort(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    expect(port.read('ednb:record:a')).toEqual({ ok: false, code: 'blocked' });
    expect(port.keys(EDNB_RECORD_KEY_PREFIX)).toEqual({ ok: false, code: 'blocked' });
    expect(port.write('ednb:record:a', '{}')).toEqual({ ok: false, code: 'blocked' });
    expect(port.remove('ednb:record:a')).toEqual({ ok: false, code: 'blocked' });
  });

  it('reports an absent storage area as blocked', () => {
    const port = createWebStoragePort(() => null);

    expect(port.read('ednb:record:a')).toEqual({ ok: false, code: 'blocked' });
  });

  it('reports a full store and leaves the prior value in place', () => {
    const storage = new FakeStorage();
    storage.setItem('ednb:record:a', 'original');
    storage.throwOnWrite = quotaError();
    const port = createWebStoragePort(() => storage);

    expect(port.write('ednb:record:a', 'replacement')).toEqual({ ok: false, code: 'quota' });
    expect(storage.getItem('ednb:record:a')).toBe('original');
  });

  it('reports a generic write failure without losing the prior value', () => {
    const storage = new FakeStorage();
    storage.setItem('ednb:record:a', 'original');
    storage.throwOnWrite = new Error('disk on fire');
    const port = createWebStoragePort(() => storage);

    expect(port.write('ednb:record:a', 'replacement')).toEqual({ ok: false, code: 'failed' });
    expect(storage.getItem('ednb:record:a')).toBe('original');
  });

  it('removes a key, and removing an absent key succeeds', () => {
    const storage = new FakeStorage();
    storage.setItem('ednb:record:a', '1');
    const port = createWebStoragePort(() => storage);

    expect(port.remove('ednb:record:a').ok).toBe(true);
    expect(port.remove('ednb:record:a').ok).toBe(true);
    expect(storage.getItem('ednb:record:a')).toBeNull();
  });
});
