import { TestBed } from '@angular/core/testing';
import { SESSION_STORAGE_PORT, type WebStoragePort } from '../../platform/storage/web-storage.port';
import { CatalogueSessionStore } from '../../application/catalogue/catalogue-session.store';
import { ANCHOR_ATTRIBUTE, CatalogueAnchorRestorer } from './catalogue-anchor.restorer';

const memoryStorage: WebStoragePort = {
  keys: () => ({ ok: true, value: [] }),
  read: () => ({ ok: true, value: null }),
  write: () => ({ ok: true, value: undefined }),
  remove: () => ({ ok: true, value: undefined }),
};

function setup(): { restorer: CatalogueAnchorRestorer; session: CatalogueSessionStore } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: SESSION_STORAGE_PORT, useValue: memoryStorage }],
  });
  return {
    restorer: TestBed.inject(CatalogueAnchorRestorer),
    session: TestBed.inject(CatalogueSessionStore),
  };
}

/** Puts a row in the document that the restorer can find by hull symbol. */
function addRow(symbol: string, top: number): HTMLElement {
  const row = document.createElement('div');
  row.setAttribute(ANCHOR_ATTRIBUTE, symbol);
  row.getBoundingClientRect = () => ({ top }) as DOMRect;
  document.body.append(row);
  return row;
}

describe('CatalogueAnchorRestorer', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('tracks which hull is currently open, for the selected marker', () => {
    const { restorer } = setup();

    expect(restorer.selectedSymbol()).toBeNull();

    restorer.setSelected('Anaconda');
    expect(restorer.selectedSymbol()).toBe('Anaconda');

    restorer.setSelected(null);
    expect(restorer.selectedSymbol()).toBeNull();
  });

  it('measures how far into a hull’s own row the viewport is', () => {
    const { restorer } = setup();
    addRow('Anaconda', -120);

    expect(restorer.offsetOf('Anaconda')).toBe(120);
  });

  it('measures nothing for a hull that is not on screen', () => {
    const { restorer } = setup();

    expect(restorer.offsetOf('Anaconda')).toBe(0);
  });

  it('does not scroll when nothing was remembered', () => {
    const { restorer } = setup();

    expect(restorer.restore()).toBe(false);
  });

  it('does not scroll when the remembered hull is no longer in the list', () => {
    const { restorer, session } = setup();
    session.setAnchor({ symbol: 'Anaconda', offsetWithinItem: 24 });

    // Filtered out since the anchor was taken: leaving the list alone is more
    // honest than jumping somewhere arbitrary.
    expect(restorer.restore()).toBe(false);
  });

  it('scrolls the remembered hull back to where it was', () => {
    const { restorer, session } = setup();
    addRow('Anaconda', 300);
    session.setAnchor({ symbol: 'Anaconda', offsetWithinItem: 24 });
    let scrolledTo: number | null = null;
    window.scrollTo = ((options: ScrollToOptions) => {
      scrolledTo = options.top ?? null;
    }) as typeof window.scrollTo;

    expect(restorer.restore()).toBe(true);
    expect(scrolledTo).toBe(300 + window.scrollY - 24);
  });

  it('waits for the list to settle before measuring', async () => {
    const { restorer, session } = setup();
    session.setAnchor({ symbol: 'Anaconda', offsetWithinItem: 24 });
    let scrolls = 0;
    window.scrollTo = (() => {
      scrolls += 1;
    }) as typeof window.scrollTo;

    restorer.restoreWhenSettled();
    // The row only exists after the first frame, which is exactly the race the
    // second attempt is for.
    addRow('Anaconda', 300);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(scrolls).toBe(1);
  });
});
