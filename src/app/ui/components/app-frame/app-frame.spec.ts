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

  it('draws one mark on a bar that has not been told what screen it is on', () => {
    // The frame a Commander sees while the application boots. A generated
    // document is rendered for a route whose name is known and draws the mark
    // after the title; the application boots before the router has resolved
    // that name. If the two disagreed about where the mark goes, the boot would
    // add a second one beside the one the document already drew and take it
    // away a second later — content appearing, moving and disappearing across
    // the takeover (015/FR-009).
    const fixture = TestBed.createComponent(AppFrame);
    fixture.detectChanges();
    const bar = fixture.nativeElement as HTMLElement;

    expect(bar.querySelectorAll('.frame__beta')).toHaveLength(1);
    // The same one the document draws: the block is empty, so it is in the same
    // place either way, and the question is which template branch drew it.
    fixture.componentRef.setInput('routeContext', 'Ship Builder');
    fixture.detectChanges();
    const marks = [...bar.querySelectorAll('.frame__beta, .frame__title')];

    expect(marks.map((node) => node.className)).toEqual(['frame__title', 'frame__beta']);
  });

  it('draws the insignia as a link where it is given a destination', () => {
    // The application gives it one on every screen. The link is named by the
    // screen it reaches and the mark carries no alternative text, so the mark
    // is never announced as a picture of nothing (017/FR-001).
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('home', {
      id: 'start',
      label: 'Nav Beacon',
      href: '/',
      current: false,
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const insignia = element.querySelector('a.frame__flag-home');

    expect(insignia?.getAttribute('href')).toBe('/');
    expect(insignia?.textContent?.trim()).toBe('Nav Beacon');
    // The mark is inside the link rather than being it, so the press box takes
    // the target baseline and the drawing keeps its own size (011/FR-012).
    expect(insignia?.querySelector('img.frame__flag')?.getAttribute('alt')).toBe('');
  });

  it('draws the insignia as decoration where it is given none', () => {
    // The component preview catalogue composes the frame with no destination.
    // A picture that leads nowhere is a picture, not a control.
    const element = render(null);

    expect(element.querySelector('.frame__flag-home')).toBeNull();
    expect(element.querySelector('img.frame__flag')).not.toBeNull();
  });

  it('emits the insignia as an intent rather than navigating itself', () => {
    // The frame never decides what activating it means: the application answers
    // a click that leads to the address already open with nothing, and the
    // preview catalogue lets the browser follow the link (017/FR-002).
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('home', {
      id: 'start',
      label: 'Nav Beacon',
      href: '/',
      current: false,
    });
    fixture.detectChanges();

    let followed: string | null = null;
    fixture.componentInstance.navigationSelected.subscribe(({ entry }) => {
      followed = entry.href;
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('.frame__flag-home')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(followed).toBe('/');
  });

  it('names the tool a Commander is in, and offers it as well', () => {
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('tools', [
      { id: 'ship', label: 'Ship', href: '/ships', current: true },
      { id: 'foot', label: 'On foot', href: '/equipment', current: false },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const region = element.querySelector('.frame__tools');

    // A landmark of its own name: the bar below already carries one called
    // "Primary navigation".
    expect(region?.getAttribute('aria-label')).toBe('Tools');

    // Every tab is a link, so re-entering the open tool is one press on the bar
    // a Commander is already reading (017/FR-003).
    const tabs = [...element.querySelectorAll('a.frame__tool')];
    expect(tabs.map((tab) => tab.getAttribute('href'))).toEqual(['/ships', '/equipment']);
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual(['Ship', 'On foot']);

    const current = element.querySelector('.frame__tool--current');
    expect(current).toBe(tabs[0]);
    // The state is in the tree, not only in the amber the stylesheet draws, and
    // only the open tool carries it.
    expect(tabs.map((tab) => tab.getAttribute('aria-current'))).toEqual(['true', null]);
  });

  it('emits the open tool with the re-entry the registry declared for it', () => {
    // The frame hands the id back untouched. What re-entering a tool means is
    // the application's answer, not the bar's (017/FR-004).
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('tools', [
      { id: 'foot', label: 'On foot', href: '/equipment', current: true, reentry: 'equipment.new' },
    ]);
    fixture.detectChanges();

    let chosen: { href: string; reentry?: string } | null = null;
    fixture.componentInstance.toolSelected.subscribe(({ entry }) => {
      chosen = { href: entry.href, reentry: entry.reentry };
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('a.frame__tool')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(chosen).toEqual({ href: '/equipment', reentry: 'equipment.new' });
  });

  it('leaves the tool region out of the document where there are no tools', () => {
    // The component preview catalogue composes the frame with none. A
    // navigation landmark with nothing in it is a landmark a reader lands on
    // and leaves again.
    const element = render(null);

    expect(element.querySelector('.frame__tools')).toBeNull();
  });

  it('emits a tool as an intent rather than navigating itself', () => {
    const fixture = TestBed.createComponent(AppFrame);
    fixture.componentRef.setInput('tools', [
      { id: 'foot', label: 'On foot', href: '/equipment', current: false },
    ]);
    fixture.detectChanges();

    let followed: string | null = null;
    fixture.componentInstance.toolSelected.subscribe(({ entry }) => {
      followed = entry.href;
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('a.frame__tool')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(followed).toBe('/equipment');
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
