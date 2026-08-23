import { TestBed } from '@angular/core/testing';
import { AlmanacSchematicLoader } from './almanac-schematic-loader';
import { hullSchematicPath } from './hull-artwork-path';

/** One side's extract, in the shape `scripts/extract-schematic-mounts.mts` writes. */
function extract(symbol = 'Anaconda', side: 'top' | 'bottom' = 'bottom'): string {
  return JSON.stringify({
    symbol,
    side,
    viewBox: '0 0 1200 800',
    source: 'a'.repeat(64),
    content: { x: 100, y: 100, width: 200, height: 600 },
    mounts: [{ feature: 'hardpoint', slot: 'TinyHardpoint1', x: 200, y: 300 }],
  });
}

function ok(body: string): Response {
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
}

describe('hullSchematicPath', () => {
  it('names the extract under the shared artwork root, not the package SVG', () => {
    // The Almanac's own ninety-kilobyte drawing is never fetched: what a plate
    // reads is the few hundred bytes extracted from it at build time.
    expect(hullSchematicPath('Anaconda', 'top')).toBe('assets/ships/Anaconda/schematic-top.json');
    expect(hullSchematicPath('Anaconda', 'bottom')).toBe(
      'assets/ships/Anaconda/schematic-bottom.json',
    );
  });

  it('is relative, so it can only resolve against this document base', () => {
    expect(hullSchematicPath('Anaconda', 'top').startsWith('/')).toBe(false);
    expect(hullSchematicPath('Anaconda', 'top')).not.toContain('//');
  });

  it('keeps the package symbol exactly, because the directories are the package own', () => {
    expect(hullSchematicPath('Federation_Corvette', 'top')).toContain('/Federation_Corvette/');
    expect(hullSchematicPath('TypeX_3', 'bottom')).toContain('/TypeX_3/');
  });

  it('encodes a symbol as one segment, so nothing can climb out or name a host', () => {
    expect(hullSchematicPath('../../evil', 'top')).toBe(
      'assets/ships/..%2F..%2Fevil/schematic-top.json',
    );
    expect(hullSchematicPath('https://example.invalid/x', 'top')).not.toContain('//example');
  });
});

describe('AlmanacSchematicLoader', () => {
  let loader: AlmanacSchematicLoader;
  let calls: string[];

  function respond(handler: (url: string) => Promise<Response> | Response): void {
    vi.stubGlobal('fetch', (url: string) => {
      calls.push(url);
      return Promise.resolve(handler(url));
    });
  }

  beforeEach(() => {
    calls = [];
    loader = TestBed.inject(AlmanacSchematicLoader);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('requests the side it was asked for and returns the parsed document', async () => {
    respond(() => ok(extract()));

    const state = await loader.load('Anaconda', 'bottom');

    expect(calls).toEqual(['assets/ships/Anaconda/schematic-bottom.json']);
    expect(state.kind).toBe('ready');
    expect(state.kind === 'ready' && state.document.annotations[0].journalSlot).toBe(
      'TinyHardpoint1',
    );
  });

  it('carries no build, slot, module or user string into the request', async () => {
    respond(() => ok(extract('Anaconda', 'top')));

    await loader.load('Anaconda', 'top');

    expect(calls[0]).toBe('assets/ships/Anaconda/schematic-top.json');
  });

  it('reports an HTTP failure as temporary, because the file is usually there', async () => {
    respond(() => new Response('', { status: 404 }));

    expect(await loader.load('Anaconda', 'top')).toEqual({ kind: 'temporarilyUnavailable' });
  });

  it('reports a network failure as temporary', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('offline')));

    expect(await loader.load('Anaconda', 'top')).toEqual({ kind: 'temporarilyUnavailable' });
  });

  it('reports a body that is not JSON at all as temporary', async () => {
    // A deployment answering with its index page for a file it does not have.
    // That is a fetch that did not arrive, and asking again can fix it.
    respond(() => ok('<!doctype html><title>Not found</title>'));

    expect(await loader.load('Anaconda', 'top')).toEqual({ kind: 'temporarilyUnavailable' });
  });

  it('reports an extract that is not this build own as a defect, not as missing', async () => {
    respond(() => ok(JSON.stringify({ symbol: 'Anaconda', side: 'top', mounts: [] })));

    expect(await loader.load('Anaconda', 'top')).toEqual({ kind: 'contractDefect' });
  });

  it('refuses another hull extract served from this hull path', async () => {
    // Otherwise this hull's mounts would be drawn at another hull's coordinates.
    respond(() => ok(extract('Sidewinder', 'top')));

    expect(await loader.load('Anaconda', 'top')).toEqual({ kind: 'contractDefect' });
  });

  it('passes the abort signal through, so a hull change can cancel in flight', async () => {
    let seen: AbortSignal | undefined;
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      seen = init.signal ?? undefined;
      return Promise.resolve(ok(extract('Anaconda', 'top')));
    });
    const controller = new AbortController();

    await loader.load('Anaconda', 'top', controller.signal);

    expect(seen).toBe(controller.signal);
  });

  it('classifies an aborted request as temporary rather than as a package defect', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('aborted', 'AbortError')));

    expect(await loader.load('Anaconda', 'top')).toEqual({ kind: 'temporarilyUnavailable' });
  });
});
