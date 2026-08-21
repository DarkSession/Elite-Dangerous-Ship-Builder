import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigatorAdapter } from './navigator.adapter';

/** Builds a document stand-in exposing exactly the navigator shape under test. */
function documentWith(navigator: unknown): unknown {
  return { defaultView: navigator === null ? null : { navigator } };
}

function adapterFor(navigator: unknown): NavigatorAdapter {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: DOCUMENT, useValue: documentWith(navigator) }],
  });
  return TestBed.inject(NavigatorAdapter);
}

describe('NavigatorAdapter', () => {
  it('returns the declared language list in preference order', () => {
    expect(adapterFor({ languages: ['de-DE', 'de', 'en'] }).languages()).toEqual([
      'de-DE',
      'de',
      'en',
    ]);
  });

  it('falls back to the single language when no list is declared', () => {
    expect(adapterFor({ language: 'fr-CA' }).languages()).toEqual(['fr-CA']);
  });

  it('falls back to the single language when the list is empty', () => {
    expect(adapterFor({ languages: [], language: 'fr-CA' }).languages()).toEqual(['fr-CA']);
  });

  it('drops blank entries that could never match a shipped locale', () => {
    expect(adapterFor({ languages: ['', '  ', 'de'] }).languages()).toEqual(['de']);
  });

  it('returns nothing when the runtime declares no language at all', () => {
    expect(adapterFor({}).languages()).toEqual([]);
  });

  it('returns nothing when there is no window', () => {
    expect(adapterFor(null).languages()).toEqual([]);
  });

  it('does not expose the platform array for mutation', () => {
    const declared = ['de-DE', 'en'];
    const result = adapterFor({ languages: declared }).languages();

    expect(result).not.toBe(declared);
    expect(declared).toEqual(['de-DE', 'en']);
  });
});
