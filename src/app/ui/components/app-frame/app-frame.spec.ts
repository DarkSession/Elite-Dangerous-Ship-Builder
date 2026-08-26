import { TestBed } from '@angular/core/testing';
import { AppFrame, type ScreenReturn } from './app-frame';
import { provideLocalization } from '../../../i18n/i18n.providers';

/** Canvas 1b's sheet bar, as the hull sheet publishes it. */
const HULL_SHEET: ScreenReturn = {
  back: { id: 'catalogue', label: 'Back to the shipyard', href: '/ships', current: false },
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
    fixture.componentRef.setInput('routeContext', 'Shipyard');
    fixture.componentRef.setInput('routeCount', '48 ships');
    fixture.componentRef.setInput('back', back);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the ordinary bar when no screen is layered over another', () => {
    const element = render(null);

    expect(element.querySelector('.frame__return')).toBeNull();
    expect(element.querySelector('.frame__title')?.textContent?.trim()).toBe('Shipyard');
  });

  it('gives a layered screen the way back and its own name', () => {
    const element = render(HULL_SHEET);

    const back = element.querySelector('.frame__return-back');

    // A real link: an address that opens in a new tab and copies, named by
    // where it goes rather than by the arrow drawn in it.
    expect(back?.getAttribute('href')).toBe('/ships');
    expect(back?.textContent).toContain('Back to the shipyard');

    const identity = element.querySelector('.frame__return-identity');
    expect(identity?.querySelector('h1')?.textContent?.trim()).toBe('Anaconda');
    expect(identity?.textContent).toContain('Faulcon deLacy · Large landing pad');
  });

  it('leaves the bar underneath in the document, for the width that draws it', () => {
    const element = render(HULL_SHEET);

    // Both compositions are rendered and the stylesheet shows one, the way the
    // wide action row and the compact action layer already are. Which one is
    // on screen is a media query's decision, so the shipyard's own title is
    // still here for the width that draws it.
    const titles = [...element.querySelectorAll('h1')].map((heading) =>
      heading.textContent?.trim(),
    );
    expect(titles).toEqual(['Anaconda', 'Shipyard']);
  });

  it('carries the way back alone when the package could name no hull', () => {
    const element = render({ ...HULL_SHEET, title: null });

    expect(element.querySelector('.frame__return-back')).not.toBeNull();
    expect(element.querySelector('.frame__return-identity')).toBeNull();
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
