import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CatalogueLoader, interpolationVariables, validateCatalogue } from './catalogue-loader';
import {
  BUNDLED_ENGLISH,
  MESSAGE_KEYS,
  SHIPPED_LOCALES,
  findShippedLocale,
} from './locale-registry';

const GERMAN = findShippedLocale('de');
const ENGLISH = findShippedLocale('en');

/** A complete candidate: English values under the English key set. */
function completeCandidate(): Record<string, string> {
  return { ...BUNDLED_ENGLISH };
}

function loaderWith(fetcher: unknown): CatalogueLoader {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: DOCUMENT, useValue: { defaultView: { fetch: fetcher } } }],
  });
  return TestBed.inject(CatalogueLoader);
}

/** A response object with only what the loader reads. */
function response(body: unknown, ok = true): unknown {
  return {
    ok,
    json: async () => {
      if (typeof body === 'string') {
        throw new SyntaxError('Unexpected token');
      }
      return body;
    },
  };
}

describe('interpolationVariables', () => {
  it('reads every declared variable, in a stable order', () => {
    expect(interpolationVariables('{{page}} · {{app}}')).toEqual(['app', 'page']);
  });

  it('tolerates whitespace inside the braces', () => {
    expect(interpolationVariables('{{  value }} CR')).toEqual(['value']);
  });

  it('finds none in a plain message', () => {
    expect(interpolationVariables('Save build')).toEqual([]);
  });
});

describe('validateCatalogue', () => {
  it('accepts a candidate with exactly the English keys and no blank values', () => {
    const { catalogue, problems } = validateCatalogue(completeCandidate());

    expect(problems).toEqual([]);
    expect(catalogue).not.toBeNull();
    expect(Object.keys(catalogue ?? {}).length).toBe(MESSAGE_KEYS.length);
  });

  it('rejects anything that is not a JSON object', () => {
    for (const value of [null, [], 'text', 42]) {
      const { catalogue, problems } = validateCatalogue(value);

      expect(catalogue).toBeNull();
      expect(problems[0]?.kind).toBe('wrong-type');
    }
  });

  it('rejects a missing key and names it', () => {
    const candidate = completeCandidate();
    delete candidate['app.name'];

    const { catalogue, problems } = validateCatalogue(candidate);

    expect(catalogue).toBeNull();
    expect(problems).toContainEqual(
      expect.objectContaining({ kind: 'missing-key', key: 'app.name' }),
    );
  });

  it('rejects a key English does not have', () => {
    const candidate = { ...completeCandidate(), 'app.invented': 'Something' };

    const { catalogue, problems } = validateCatalogue(candidate);

    expect(catalogue).toBeNull();
    expect(problems).toContainEqual(
      expect.objectContaining({ kind: 'unknown-key', key: 'app.invented' }),
    );
  });

  it('rejects a blank value rather than publishing an empty label', () => {
    const candidate = { ...completeCandidate(), 'app.name': '   ' };

    const { catalogue, problems } = validateCatalogue(candidate);

    expect(catalogue).toBeNull();
    expect(problems).toContainEqual(
      expect.objectContaining({ kind: 'blank-value', key: 'app.name' }),
    );
  });

  it('rejects a value that is not a string', () => {
    const candidate = { ...completeCandidate(), 'app.name': 42 } as unknown;

    expect(validateCatalogue(candidate).catalogue).toBeNull();
  });

  it('rejects a translation that drops an interpolation variable', () => {
    const candidate = { ...completeCandidate(), 'app.document-title': 'Nur der Titel' };

    const { catalogue, problems } = validateCatalogue(candidate);

    expect(catalogue).toBeNull();
    expect(problems).toContainEqual(
      expect.objectContaining({ kind: 'interpolation', key: 'app.document-title' }),
    );
  });

  it('rejects a translation that invents an interpolation variable', () => {
    const candidate = { ...completeCandidate(), 'app.name': '{{brand}}' };

    expect(validateCatalogue(candidate).catalogue).toBeNull();
  });

  it('reports every problem at once rather than the first', () => {
    const candidate = completeCandidate();
    delete candidate['app.name'];
    delete candidate['app.tagline'];

    expect(validateCatalogue(candidate).problems.length).toBeGreaterThan(1);
  });
});

describe('CatalogueLoader', () => {
  it('answers English from the bundle without a request', async () => {
    let requests = 0;
    const loader = loaderWith(() => {
      requests += 1;
      return Promise.resolve(response({}));
    });

    const candidate = await loader.load(ENGLISH!);

    expect(requests).toBe(0);
    expect(candidate.source).toBe('bundle');
    expect(candidate.catalogue).toBe(BUNDLED_ENGLISH);
    expect(candidate.failure).toBeNull();
  });

  it('requests a shipped locale from its same-origin asset path', async () => {
    const requested: string[] = [];
    const loader = loaderWith((path: string) => {
      requested.push(path);
      return Promise.resolve(response(completeCandidate()));
    });

    const candidate = await loader.load(GERMAN!);

    expect(requested).toEqual([GERMAN!.assetPath]);
    expect(requested[0]?.startsWith('i18n/')).toBe(true);
    expect(candidate.source).toBe('asset');
    expect(candidate.catalogue).not.toBeNull();
  });

  it('reports a failed response as a stable code, not as a message', async () => {
    const loader = loaderWith(() => Promise.resolve(response({}, false)));

    const candidate = await loader.load(GERMAN!);

    expect(candidate.catalogue).toBeNull();
    expect(candidate.failure).toBe('load-failed');
  });

  it('reports a network failure without letting the exception escape', async () => {
    const loader = loaderWith(() => Promise.reject(new Error('offline')));

    const candidate = await loader.load(GERMAN!);

    expect(candidate.failure).toBe('load-failed');
  });

  it('reports a body that is not JSON as a load failure', async () => {
    const loader = loaderWith(() => Promise.resolve(response('<!doctype html>')));

    expect((await loader.load(GERMAN!)).failure).toBe('load-failed');
  });

  it('reports an incomplete catalogue as invalid rather than publishing part of it', async () => {
    const incomplete = completeCandidate();
    delete incomplete['app.name'];
    const loader = loaderWith(() => Promise.resolve(response(incomplete)));

    const candidate = await loader.load(GERMAN!);

    expect(candidate.catalogue).toBeNull();
    expect(candidate.failure).toBe('invalid-catalogue');
  });

  it('reports a runtime with no fetch as a load failure', async () => {
    const loader = loaderWith(undefined);

    expect((await loader.load(GERMAN!)).failure).toBe('load-failed');
  });

  it('never requests another origin', () => {
    for (const locale of SHIPPED_LOCALES) {
      // Relative to the document base, which is what keeps a sub-path
      // deployment reading its own catalogues. A root-absolute path would
      // still admit a protocol-relative `//host/...`; this rejects both.
      expect(locale.assetPath.startsWith('/')).toBe(false);
      expect(locale.assetPath).not.toMatch(/^[a-z]+:/i);
    }
  });
});
