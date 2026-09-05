import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import {
  NavigationCancel,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
  type Route,
} from '@angular/router';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { provideLocalization } from '../../i18n/i18n.providers';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
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

  it('holds the hull’s place while the hull’s own chunk is fetched', () => {
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    expect(skeletonOf(host)).toBeNull();

    publish(new RouteConfigLoadStart(detailRoute()));
    fixture.detectChanges();

    expect(skeletonOf(host)).not.toBeNull();
  });

  it('holds it past the chunk, until the hull’s screen is there', () => {
    // The chunk landing and the screen arriving are two moments. Taking the
    // skeleton down at the first leaves the rail a named group with nothing in
    // it for the gap between them.
    const { fixture, publish } = page();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(detailRoute()));
    publish(new RouteConfigLoadEnd(detailRoute()));
    fixture.detectChanges();

    expect(skeletonOf(host)).not.toBeNull();

    fixture.componentInstance.detailActivated();
    fixture.detectChanges();

    expect(skeletonOf(host)).toBeNull();
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
