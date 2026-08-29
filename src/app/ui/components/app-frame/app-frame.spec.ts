import { TestBed } from '@angular/core/testing';
import { AppFrame, type ScreenReturn } from './app-frame';
import { provideLocalization } from '../../../i18n/i18n.providers';

/** Canvas 1b's sheet bar, as the hull sheet publishes it. */
const HULL_SHEET: ScreenReturn = {
  back: { id: 'catalogue', label: 'Back to Ship Builder', href: '/ships', current: false },
  title: 'Anaconda',
  detail: 'Faulcon deLacy · Large landing pad',
};

describe('AppFrame', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFrame],
      providers: [provideLocalization()],
    }).compileComponents();
  });

  function render(back: ScreenReturn | null): HTMLElement {
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('routeContext', 'Ship Builder');
    fixture.componentRef.setInput('routeCount', '48 ships');
    fixture.componentRef.setInput('back', back);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the ordinary bar when no screen is layered over another', () => {
    const element = render(null);

    expect(element.querySelector('.frame__return')).toBeNull();
    expect(element.querySelector('.frame__title')?.textContent?.trim()).toBe('Ship Builder');
  });

  it('gives a layered screen the way back and its own name', () => {
    const element = render(HULL_SHEET);

    const back = element.querySelector('.frame__return-back');

    // A real link: an address that opens in a new tab and copies, named by
    // where it goes rather than by the arrow drawn in it.
    expect(back?.getAttribute('href')).toBe('/ships');
    expect(back?.textContent).toContain('Back to Ship Builder');

    const identity = element.querySelector('.frame__return-identity');
    expect(identity?.querySelector('h1')?.textContent?.trim()).toBe('Anaconda');
    expect(identity?.textContent).toContain('Faulcon deLacy · Large landing pad');
  });

  it('leaves the bar underneath in the document, for the width that draws it', () => {
    const element = render(HULL_SHEET);

    // Both compositions are rendered and the stylesheet shows one, the way the
    // wide action row and the folded action layer already are. Which one is
    // on screen is a media query's decision, so the shipyard's own title is
    // still here for the width that draws it.
    const titles = [...element.querySelectorAll('h1')].map((heading) =>
      heading.textContent?.trim(),
    );
    expect(titles).toEqual(['Anaconda', 'Ship Builder']);
  });

  it('carries the way back alone when the package could name no hull', () => {
    const element = render({ ...HULL_SHEET, title: null });

    expect(element.querySelector('.frame__return-back')).not.toBeNull();
    expect(element.querySelector('.frame__return-identity')).toBeNull();
  });

  it('sets the release mark after a plain title and before an editable one', () => {
    // Canvas 1a draws `SHIPYARD BETA · 48 SHIPS`, which reads as a beta
    // shipyard. Canvases 1c and 1d put the mark ahead of the build's name,
    // because a chip after a name a Commander can edit reads as part of that
    // name — and the build is not the thing in beta.
    const shipyard = render(null);
    const marks = [...shipyard.querySelectorAll('.frame__beta, .frame__title')];
    expect(marks.map((node) => node.className)).toEqual(['frame__title', 'frame__beta']);

    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('routeContext', 'Build');
    fixture.componentRef.setInput('identity', {
      name: 'Anaconda',
      detail: null,
      ident: null,
      editing: null,
    });
    fixture.detectChanges();

    const bar = fixture.nativeElement as HTMLElement;
    const chip = bar.querySelector('.frame__beta');
    const identity = bar.querySelector('.frame__screen-identity');
    expect(chip).not.toBeNull();
    expect(identity).not.toBeNull();
    const order = chip!.compareDocumentPosition(identity!);
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    // And the mark is drawn once either way: two chips in one bar would be the
    // release stated twice.
    expect(shipyard.querySelectorAll('.frame__beta')).toHaveLength(1);
    expect(bar.querySelectorAll('.frame__beta')).toHaveLength(1);
  });

  it('emits the way back as an intent rather than navigating itself', () => {
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('back', HULL_SHEET);
    fixture.detectChanges();

    let followed: string | null = null;
    fixture.componentInstance.navigationSelected.subscribe(({ entry }) => {
      followed = entry.href;
    });

    const back = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.frame__return-back',
    );
    back?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(followed).toBe('/ships');
  });
});
