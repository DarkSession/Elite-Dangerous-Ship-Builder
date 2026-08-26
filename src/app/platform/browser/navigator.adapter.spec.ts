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

  describe('putting a link where a Commander can use it', () => {
    it('copies text and says it happened', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      expect(await adapterFor({ clipboard: { writeText } }).copyText('b.abc')).toBe(true);
      expect(writeText).toHaveBeenCalledWith('b.abc');
    });

    it('reports a refused, absent or failing clipboard as an ordinary outcome', async () => {
      const refused = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } };

      expect(await adapterFor(refused).copyText('b.abc')).toBe(false);
      expect(await adapterFor({}).copyText('b.abc')).toBe(false);
      expect(await adapterFor(null).copyText('b.abc')).toBe(false);
    });

    it('offers sharing only where the platform actually has it', () => {
      expect(adapterFor({ share: () => Promise.resolve() }).canShare()).toBe(true);
      expect(adapterFor({}).canShare()).toBe(false);
      expect(adapterFor(null).canShare()).toBe(false);
    });
  });

  describe('handing a payload to the platform', () => {
    it('reports a clipboard only where there is one to try', () => {
      expect(
        adapterFor({ clipboard: { writeText: () => Promise.resolve() } }).clipboardAvailable(),
      ).toBe(true);
      expect(adapterFor({ clipboard: {} }).clipboardAvailable()).toBe(false);
      expect(adapterFor({}).clipboardAvailable()).toBe(false);
      expect(adapterFor(null).clipboardAvailable()).toBe(false);
    });

    it('asks the platform about the actual file, not about files in general', () => {
      const file = new File(['[]'], 'build.slef.json', { type: 'application/json' });
      const canShare = vi.fn().mockReturnValue(true);

      expect(adapterFor({ share: () => Promise.resolve(), canShare }).canShareFiles([file])).toBe(
        true,
      );
      expect(canShare).toHaveBeenCalledWith({ files: [file] });
    });

    it('refuses file sharing where the platform has no share sheet or no canShare', () => {
      const file = new File(['[]'], 'build.slef.json', { type: 'application/json' });

      expect(adapterFor({ canShare: () => true }).canShareFiles([file])).toBe(false);
      expect(adapterFor({ share: () => Promise.resolve() }).canShareFiles([file])).toBe(false);
      expect(
        adapterFor({
          share: () => Promise.resolve(),
          canShare: () => {
            throw new Error('no');
          },
        }).canShareFiles([file]),
      ).toBe(false);
    });

    it('tells a dismissed share sheet apart from a failed one', async () => {
      const abort = Object.assign(new Error('dismissed'), { name: 'AbortError' });

      expect(await adapterFor({ share: vi.fn().mockRejectedValue(abort) }).shareData({})).toBe(
        'cancelled',
      );
      expect(
        await adapterFor({ share: vi.fn().mockRejectedValue(new Error('boom')) }).shareData({}),
      ).toBe('failed');
      expect(await adapterFor({ share: vi.fn().mockResolvedValue(undefined) }).shareData({})).toBe(
        'shared',
      );
      expect(await adapterFor({}).shareData({})).toBe('failed');
    });

    it('hands the payload straight to the platform, with nothing awaited first', async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      const data = { title: 'Build', text: '[]' };

      await adapterFor({ share }).shareData(data);

      expect(share).toHaveBeenCalledWith(data);
    });
  });
});
