import { TestBed } from '@angular/core/testing';
import { HistoryLocationAdapter } from './history-location.adapter';

function adapter(): HistoryLocationAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(HistoryLocationAdapter);
}

describe('HistoryLocationAdapter', () => {
  // Every test here writes the document's own address, and the document outlives
  // the file. The address is put back before and after each of them, so neither
  // a test here nor a spec that runs after this one reads a fragment or a query
  // it was never given.
  const address = `${location.pathname}${location.search}`;
  const restore = () => history.replaceState(null, '', address);
  beforeEach(restore);
  afterEach(restore);

  it('reads the current fragment without its leading hash', () => {
    history.replaceState(null, '', `${location.pathname}#b.abc`);

    expect(adapter().fragment()).toBe('b.abc');
  });

  it('reports an empty fragment when the URL has none', () => {
    expect(adapter().fragment()).toBe('');
  });

  it('replaces the fragment without adding a history entry', () => {
    const port = adapter();
    const before = history.length;

    port.replaceFragment('b.xyz');

    expect(location.hash).toBe('#b.xyz');
    expect(port.fragment()).toBe('b.xyz');
    expect(history.length).toBe(before);
  });

  it('preserves the path and query when replacing', () => {
    history.replaceState(null, '', `${location.pathname}?keep=1`);
    const port = adapter();

    port.replaceFragment('b.xyz');

    expect(location.search).toBe('?keep=1');
    expect(location.pathname).toBe(location.pathname);
  });

  it('removes the fragment entirely when given null', () => {
    const port = adapter();
    port.replaceFragment('b.stale');

    port.replaceFragment(null);

    expect(location.hash).toBe('');
    expect(port.fragment()).toBe('');
  });

  it('follows a hashchange the Commander caused', () => {
    const port = adapter();

    history.replaceState(null, '', `${location.pathname}#b.pasted`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    expect(port.fragment()).toBe('b.pasted');
  });

  it('builds the canonical link for the current document', () => {
    const port = adapter();

    expect(port.urlWithFragment('b.abc')).toBe(
      `${location.origin}${location.pathname}${location.search}#b.abc`,
    );
  });
});
