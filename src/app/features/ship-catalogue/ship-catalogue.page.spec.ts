import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
  type Route,
} from '@angular/router';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { provideLocalization } from '../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import { ScreenChrome } from '../shared/screen-chrome';
import { ShipCataloguePage } from './ship-catalogue.page';

/**
 * The rail's own waiting state.
 *
 * A hull's screen is a chunk of its own, so opening one from the manifest
 * fetches it. What the rail draws in the meantime is read from the fetch the
 * router reports, not from the screen that has not arrived (011/FR-029).
 */
describe('ShipCataloguePage, waiting for a hull', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipCataloguePage],
      providers: [
        provideLocalization(),
        provideRouter(routes),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(Location).go('/');
  });

  /**
   * The hull screen's own route, as the router holds it.
   *
   * Taken from the router rather than from the exported table: `provideRouter`
   * copies what it is given, and the events the page reads carry the router's
   * own objects.
   */
  function detailRoute(): Route {
    const catalogue = TestBed.inject(Router).config.find((route) => route.path === 'ships');
    return catalogue?.children?.[0] as Route;
  }

  function page() {
    const fixture = TestBed.createComponent(ShipCataloguePage);
    fixture.detectChanges();
    const events = TestBed.inject(Router).events as unknown as {
      next: (event: unknown) => void;
    };
    return { fixture, publish: (event: unknown) => events.next(event) };
  }

  const skeletonOf = (host: HTMLElement) => host.querySelector('ednb-skeleton');

  const ownsFailure = () => TestBed.inject(ScreenChrome).ownsRouteFailure();

  /**
   * The claim the shell reads before it speaks.
   *
   * The rail draws the sentence for its own hull, and a drawn error notice is
   * an alert already, so the shell stays quiet while this stands. It therefore
   * has to stand for exactly the wait it describes: left up, it silences the
   * shell for a chunk refused somewhere else, which no rail draws and nothing
   * then says at all.
   */
  describe('the claim on the sentence', () => {
    it('is made while the hull is on its way', () => {
      const { publish } = page();
      expect(ownsFailure()).toBe(false);

      publish(new RouteConfigLoadStart(detailRoute()));

      expect(ownsFailure()).toBe(true);
    });

    it('is given up when the hull arrives', () => {
      const { publish } = page();

      publish(new RouteConfigLoadStart(detailRoute()));
      publish(new NavigationEnd(1, '/ships/Anaconda', '/ships/Anaconda'));

      expect(ownsFailure()).toBe(false);
    });

    it('is given up when the hull does not arrive', () => {
      // The rail says this one itself, and the sentence it drew is the reader's
      // answer. The next failure is a different question.
      const { publish } = page();

      publish(new RouteConfigLoadStart(detailRoute()));
      publish(new NavigationError(1, '/ships/Anaconda', new Error('chunk unavailable')));

      expect(ownsFailure()).toBe(false);
    });

    it('is given up when the hull is no longer wanted', () => {
      const { publish } = page();

      publish(new RouteConfigLoadStart(detailRoute()));
      publish(new NavigationCancel(1, '/ships/Anaconda', ''));

      expect(ownsFailure()).toBe(false);
    });

    it('is not made for a chunk refused after a hull opened', () => {
      // The case the rail cannot answer: a hull is open, the rail draws it, and
      // a Commander presses a tool link whose chunk is refused. Nothing is
      // drawn anywhere, so the shell is the only thing that can say it.
      const { publish } = page();

      publish(new RouteConfigLoadStart(detailRoute()));
      publish(new NavigationEnd(1, '/ships/Anaconda', '/ships/Anaconda'));
      publish(new NavigationError(2, '/equipment', new Error('chunk unavailable')));

      expect(ownsFailure()).toBe(false);
    });

    it('is given up by a rail that is taken away mid-fetch', () => {
      // A destroyed rail never sees the event that would have lowered it.
      const { fixture, publish } = page();

      publish(new RouteConfigLoadStart(detailRoute()));
      expect(ownsFailure()).toBe(true);

      fixture.destroy();

      expect(ownsFailure()).toBe(false);
    });
  });

  it('holds the hull’s place while the hull’s own chunk is fetched', () => {
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    expect(skeletonOf(host)).toBeNull();

    publish(new RouteConfigLoadStart(detailRoute()));
    fixture.detectChanges();

    expect(skeletonOf(host)).not.toBeNull();
  });

  it('holds it past the chunk, until the navigation that fetched it ends', () => {
    // The chunk landing and the screen arriving are two moments: the router
    // reports the fetch, then creates the screen, then ends the navigation.
    // Taking the skeleton down at the first leaves the rail a named group with
    // nothing in it for the gap between them.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(detailRoute()));
    publish(new RouteConfigLoadEnd(detailRoute()));
    fixture.detectChanges();

    expect(skeletonOf(host)).not.toBeNull();

    publish(new NavigationEnd(1, '/ships/Anaconda', '/ships/Anaconda'));
    fixture.detectChanges();

    expect(skeletonOf(host)).toBeNull();
  });

  it('draws the rail while it waits, rather than leaving it hidden', () => {
    // The rail is not drawn until a hull is open, and the symbol that says one
    // is open is written by the hull screen itself. A skeleton in a region the
    // stylesheet has taken out of the layout is a wait a Commander cannot see,
    // which FR-029 counts as no wait at all.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(detailRoute()));
    fixture.detectChanges();

    expect(host.querySelector('.catalogue')?.classList).toContain('catalogue--detail-open');
  });

  it('says so when the hull’s screen does not arrive', () => {
    // A skeleton that appears and goes, over a rail the stylesheet then takes
    // out of the layout, leaves a Commander back on the manifest with nothing
    // said about the hull they asked for.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(detailRoute()));
    publish(new NavigationError(1, '/ships/Anaconda', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(skeletonOf(host)).toBeNull();
    const notice = host.querySelector('ednb-status-notice .status');
    expect(notice?.textContent).toContain(BUNDLED_ENGLISH['route.failed.notice']);
    expect(notice?.getAttribute('role')).toBe('alert');
    // The rail has to be in the layout for any of that to be read.
    const catalogue = host.querySelector('.catalogue')?.classList;
    expect(catalogue).toContain('catalogue--detail-failed');
    // And under its own modifier rather than the open one, which below the wide
    // step takes the manifest off the screen. No hull screen is coming, so that
    // would leave a Commander an error notice and nothing else to press.
    expect(catalogue).not.toContain('catalogue--detail-open');
  });

  it('takes the failure down when a hull arrives after it', () => {
    // The hull opened next may be one whose chunk is already fetched, and the
    // router then reports no fetch at all. A failure only the next fetch
    // cleared would stand over the hull screen that did arrive.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(detailRoute()));
    publish(new NavigationError(1, '/ships/Anaconda', new Error('chunk unavailable')));
    fixture.detectChanges();
    expect(host.querySelector('ednb-status-notice')).not.toBeNull();

    publish(new NavigationEnd(2, '/ships/Python', '/ships/Python'));
    fixture.detectChanges();

    expect(host.querySelector('ednb-status-notice')).toBeNull();
    expect(skeletonOf(host)).toBeNull();
  });

  it('leaves the rail alone when some other screen’s chunk fails', () => {
    // The rail answers its own child. A failure it was not waiting for belongs
    // to the frame around this screen, not to this rail.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new NavigationError(1, '/equipment', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(host.querySelector('ednb-status-notice')).toBeNull();
  });

  it('draws nothing for a chunk that is not the hull screen’s', () => {
    // The rail answers its own child and nothing else. Every other screen in
    // the application is a chunk too, and one fetched from here would otherwise
    // put a skeleton in a rail that is not waiting for it.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;
    const other = TestBed.inject(Router).config.find(
      (route) => route.path !== 'ships' && route.loadComponent !== undefined,
    );

    expect(other).toBeDefined();

    publish(new RouteConfigLoadStart(other as Route));
    fixture.detectChanges();

    expect(skeletonOf(host)).toBeNull();
  });

  it('gives up the wait when the navigation ends without a hull', () => {
    // The router reports the end of a fetch that succeeded and says nothing
    // about one that failed, so nothing else would take this skeleton down.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(detailRoute()));
    fixture.detectChanges();
    expect(skeletonOf(host)).not.toBeNull();

    publish(new NavigationCancel(1, '/ships/Anaconda', ''));
    fixture.detectChanges();

    expect(skeletonOf(host)).toBeNull();
  });
});
