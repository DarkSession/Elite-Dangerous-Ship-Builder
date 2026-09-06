import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DeferBlockBehavior,
  DeferBlockState,
  TestBed,
  type ComponentFixture,
} from '@angular/core/testing';
import {
  NavigationCancel,
  NavigationError,
  RouteConfigLoadEnd,
  RouteConfigLoadStart,
  Router,
  provideRouter,
  type Route,
} from '@angular/router';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { App, HELP_ACTION } from './app';
import { routes } from './app.routes';
import { EquipmentBenchPage } from './features/equipment/equipment-bench.page';
import { NAVIGATION_ROUTES } from './features/shared/app-navigation';
import { ScreenChrome, WORKSPACE_EXPORT_ACTION } from './features/shared/screen-chrome';
import { ActiveBuildStore } from './application/active-build/active-build.store';
import { SlefStore } from './application/slef/slef.store';
import { FIXTURE_HULL } from './domain/ships/outfitting/outfitting.fixtures';
import {
  ApplicationUpdateAdapter,
  type VersionEvent,
} from './platform/browser/application-update.adapter';
import { provideLocalization } from './i18n/i18n.providers';
import { BUNDLED_ENGLISH, type MessageCatalogue } from './i18n/locale-registry';
import germanCatalogue from './i18n/locales/de.json';
import { LocaleStore } from './i18n/locale.store';
import { AnnouncementService } from './ui/announcements/announcement.service';
import { HelpPresenter } from './application/help/help.presenter';
import { HELP_MANIFEST } from './platform/build/help-manifest.generated';
import { EDNB_UPDATE_APPLIED_KEY } from './platform/storage/storage-keys';
import { MemoryStorage, provideMemoryStorage } from './platform/storage/storage.spec-helpers';
import { stubNativeDialog } from './ui/components/layer/layer.spec-helpers';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // The shell holds the update store, which reads the session area for the
      // marker a restart leaves behind. In-memory here, so a test never sees a
      // marker another test wrote.
      providers: [provideLocalization(), ...provideMemoryStorage(new MemoryStorage())],
    }).compileComponents();
  });

  // The shell seeds itself from the address it was loaded at, so a test that
  // sets one is writing real history. Put it back, or every test declared after
  // it builds the shell somewhere other than the shipyard.
  afterEach(() => {
    TestBed.inject(Location).go('/');
  });

  it('creates the application root', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders inside the shared application frame', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('ednb-app-frame')).not.toBeNull();
    expect(element.querySelector('header')).not.toBeNull();
    expect(element.querySelector('main')).not.toBeNull();
  });

  it('synthesizes no heading of its own, leaving the h1 to the route', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    // A shell-owned h1 would name every screen the same thing, so the shell
    // owns none: the route inside `main` supplies it.
    expect(element.querySelectorAll('h1').length).toBe(0);
    expect(element.querySelector('header')?.querySelector('h1') ?? null).toBeNull();
  });

  it('offers the saved builds as an action, from every screen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const named = (selector: string) =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll(selector)].map((control) =>
        control.textContent?.trim(),
      );

    // A control and not a chip. The library has no address of its own
    // (Commander request 2026-09-04, `build-library/library-presence.ts`), so
    // the one entry the bar's navigation ever held became a shell action, and
    // the row it was the only occupant of went with it.
    //
    // Both compositions, because the folded bar is where a Commander reaches it
    // at narrow widths: the frame renders the wide row and the `⋮` layer
    // together and lets a media query present one of them.
    expect(named('.frame__actions .action__label')).toContain(
      BUNDLED_ENGLISH['navigation.library'],
    );
    expect(named('.action-layer__panel .action__label')).toContain(
      BUNDLED_ENGLISH['navigation.library'],
    );

    // Nothing links to it, at either width — an `href` here would point at an
    // address the route table no longer serves.
    const links = [...(fixture.nativeElement as HTMLElement).querySelectorAll('a[href]')].map(
      (link) => link.getAttribute('href'),
    );
    expect(links).not.toContain('/builds');
  });

  it('carries the way back to the shipyard on the bar\u2019s own insignia', () => {
    // Away from the shipyard, which is the one screen where the way home is no
    // way anywhere. The shell reads the address it was loaded at rather than
    // waiting for the router's first navigation, so the address has to be set
    // before the component reads it (Commander request 2026-09-04).
    TestBed.inject(Location).go(NAVIGATION_ROUTES.outfitting);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const insignia = element.querySelector('.frame__flag-home');

    // The 2026-08-26 revision puts the mark where the `SHIPYARD` word used to
    // be, so the mark is the control and the word is not drawn twice. It is a
    // link, so it opens in a new tab and copies like any other address, and it
    // says where it goes for a reader who cannot see the mark.
    expect(insignia?.getAttribute('href')).toBe('/ships');
    expect(insignia?.textContent?.trim()).toBe(BUNDLED_ENGLISH['navigation.catalogue']);

    // The mark is inside the link rather than being it, so the press keeps the
    // target baseline while the insignia keeps the size the canvas draws it.
    expect(insignia?.querySelector('.frame__flag')).not.toBeNull();
  });

  it('resolves its text through the message facade', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain(BUNDLED_ENGLISH['navigation.library']);
    expect(text).not.toMatch(/\{\{/);
  });

  it('offers exactly one way to help, from the frame and from nowhere else', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const help = fixture.componentInstance.actions().filter(({ id }) => id === HELP_ACTION);

    // One entry, named and described in words a Commander reads. The wide bar
    // draws it as the reference's own `?`, but the mark never becomes the name:
    // the label is what a reader is told at either width, and it is a word
    // rather than a glyph the frame would have to explain (012/FR-002,
    // 012/FR-011).
    expect(help.length).toBe(1);
    expect(help[0].label).toBe(BUNDLED_ENGLISH['help.action.label']);
    expect(help[0].symbol).toBe(BUNDLED_ENGLISH['help.action.symbol']);
    expect(help[0].description).toBe(BUNDLED_ENGLISH['help.action.description']);
    expect(help[0].label).not.toBe(help[0].symbol);

    // And it is the only action drawn as a mark. Every other entry on the bar
    // is its own words, which is what keeps the mark readable as "the help one"
    // rather than as one of a row of glyphs.
    const marked = fixture.componentInstance.actions().filter(({ symbol }) => symbol);
    expect(marked.map(({ id }) => id)).toEqual([HELP_ACTION]);
  });

  it('opens the modal when the frame reports the help action, and nothing else', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const help = TestBed.inject(HelpPresenter);

    expect(help.open()).toBe(false);

    // A shell action nobody claims must not open it: the frame publishes one
    // list for every capability, and the root dispatches by id.
    fixture.componentInstance.selectAction('nothing.claims.this');
    expect(help.open()).toBe(false);

    fixture.componentInstance.selectAction(HELP_ACTION);
    expect(help.open()).toBe(true);
  });

  it('lets the shell handle a published action that has no screen handler', () => {
    const fixture = TestBed.createComponent(App);
    const help = TestBed.inject(HelpPresenter);
    fixture.componentInstance.chrome.setActions([
      { action: { id: HELP_ACTION, label: 'Help test action' } },
    ]);

    fixture.componentInstance.selectAction(HELP_ACTION);

    expect(help.open()).toBe(true);
  });

  it('connects the workspace export action to the exchange layer', () => {
    const fixture = TestBed.createComponent(App);
    const active = TestBed.inject(ActiveBuildStore);
    const slef = TestBed.inject(SlefStore);
    slef.selectExportMode('link');

    fixture.componentInstance.selectAction(WORKSPACE_EXPORT_ACTION);
    expect(slef.layer()).toBe('none');

    active.commit({
      loadout: ShipLoadout.default(FIXTURE_HULL),
      hullName: 'Anaconda',
      provenance: 'working',
      qualityNotices: [],
      sourceNamed: null,
      autosaveRecordId: null,
      baseline: null,
    });
    fixture.componentInstance.selectAction(WORKSPACE_EXPORT_ACTION);

    expect(slef.layer()).toBe('export');
    expect(slef.exportMode()).toBe('link');

    slef.closeLayer();
    active.setLink({ kind: 'refused', code: 'tooLong', slot: null });
    fixture.componentInstance.selectAction(WORKSPACE_EXPORT_ACTION);

    expect(slef.layer()).toBe('export');
    expect(slef.exportMode()).toBe('slef');
  });

  it('mounts exactly one assertive and one polite announcement outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('[data-announcement-outlet="assertive"]').length).toBe(1);
    expect(element.querySelectorAll('[data-announcement-outlet="polite"]').length).toBe(1);
    expect(element.querySelectorAll('[aria-live]').length).toBe(2);
  });
});

/** The shipped German catalogue, so a commit really does change the messages. */
const GERMAN: MessageCatalogue = germanCatalogue;

/** An update port a test can drive, standing in for the worker. */
class FakeUpdates {
  available = true;
  activations = 0;
  reloads = 0;

  /** Whether there is a page to start over. False stands in for no window. */
  restartable = true;

  #listener: ((event: VersionEvent) => void) | null = null;

  /**
   * The one-shot periods pending, in the order they were scheduled.
   *
   * A list rather than a slot, for the reason `application-update.store.spec.ts`
   * keeps one: the store runs two of them — the grace before a restart and the
   * arrival notice's own clock — and a slot silently loses whichever was
   * scheduled first.
   */
  readonly #pending: (() => void)[] = [];

  onVersionEvent(listener: (event: VersionEvent) => void): () => void {
    this.#listener = listener;
    return () => (this.#listener = null);
  }

  async check(): Promise<void> {}

  async activate(): Promise<void> {
    this.activations += 1;
  }

  reload(): boolean {
    this.reloads += 1;
    return this.restartable;
  }

  every(): () => void {
    return () => {};
  }

  after(_milliseconds: number, run: () => void): () => void {
    this.#pending.push(run);
    return () => {
      const index = this.#pending.indexOf(run);
      if (index >= 0) {
        this.#pending.splice(index, 1);
      }
    };
  }

  /** The worker reporting on this page's version. */
  report(event: VersionEvent): void {
    this.#listener?.(event);
  }

  /** The most recently scheduled period running out. */
  expire(): void {
    this.#pending.pop()?.();
  }
}

describe('App and a newly published version', () => {
  let updates: FakeUpdates;
  let sessionArea: MemoryStorage;

  beforeEach(async () => {
    stubNativeDialog();
    updates = new FakeUpdates();
    sessionArea = new MemoryStorage();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideLocalization(),
        { provide: ApplicationUpdateAdapter, useValue: updates },
        ...provideMemoryStorage(new MemoryStorage(), sessionArea),
      ],
    }).compileComponents();
  });

  /** The rendered shell, with the worker having reported `event` if it did. */
  function render(event?: VersionEvent): ComponentFixture<App> {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    if (event !== undefined) {
      updates.report(event);
      fixture.detectChanges();
    }
    return fixture;
  }

  /** Waits for every pending microtask, which is where the restart runs. */
  function settled(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function textIn(fixture: ComponentFixture<App>): string {
    return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');
  }

  /** The command bar button carrying `label`, or null when none does. */
  function actionNamed(fixture: ComponentFixture<App>, label: string): HTMLElement | null {
    return (
      [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
          '.frame__actions button',
        ),
      ].find((button) => (button.textContent ?? '').includes(label)) ?? null
    );
  }

  it('says nothing at all while the running version is the published one', () => {
    const fixture = render();

    expect(fixture.componentInstance.updateAction()).toBeNull();
    expect(fixture.componentInstance.updateStatus()).toBeNull();
    expect(textIn(fixture)).not.toContain(BUNDLED_ENGLISH['update.ready.notice']);
  });

  it('says what is about to happen on the overlay, before anything happens', () => {
    const fixture = render('ready');

    expect(fixture.componentInstance.updateOverlay()).toBe(true);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.applying.notice']);
    // Nothing has been replaced yet.
    expect(updates.activations).toBe(0);
    expect(updates.reloads).toBe(0);
  });

  it('offers nothing to press on the overlay, because the restart is not a question', () => {
    // Owner's decision, 2026-08-27. The layer is drawn with no dismiss label,
    // which takes its control, its Escape and its ground away together — a
    // time limit a Commander cannot stop, which is why constitution V names
    // WCAG 2.2.1 among the excluded criteria.
    const fixture = render('ready');
    const overlay = (fixture.nativeElement as HTMLElement).querySelectorAll('dialog[open]');

    expect(overlay.length).toBe(1);
    expect(overlay[0]?.querySelectorAll('button').length).toBe(0);
  });

  it('says the same thing once, on the overlay and not on the shell behind it', () => {
    // The shell under a modal is inert, so a notice and a control there would
    // be a second copy of this one that nobody can reach (feedback contract).
    const fixture = render('ready');

    expect(fixture.componentInstance.updateStatus()).toBeNull();
    expect(fixture.componentInstance.updateAction()).toBeNull();
  });

  it('offers the version on the shell when there was no page to start over', async () => {
    // The one path back to the shell control. A frame that may not navigate
    // itself leaves a session on the old version with the overlay down, and a
    // control it can reach is all it has left.
    updates.restartable = false;
    const fixture = render('ready');

    updates.expire();
    await settled();
    fixture.detectChanges();

    expect(fixture.componentInstance.updateOverlay()).toBe(false);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.ready.notice']);
    expect(actionNamed(fixture, BUNDLED_ENGLISH['update.ready.action'])).not.toBeNull();
  });

  it('activates the waiting version and starts over when the grace period runs out', async () => {
    render('ready');

    updates.expire();
    // The restart is asynchronous: activation has to land before the page is
    // started over, or the shell would come back asking the old version for
    // chunks the new one renamed.
    await settled();

    expect(updates.activations).toBe(1);
    expect(updates.reloads).toBe(1);
  });

  it('says the update was applied in the session that came up after the restart', () => {
    // The overlay above went with the page that drew it. This is the half a
    // Commander who looked away is certain to read, and it names the version
    // they landed on.
    sessionArea.entries.set(EDNB_UPDATE_APPLIED_KEY, '1');
    const fixture = render();

    expect(fixture.componentInstance.updateApplied()).toBe(true);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.applied.notice']);
    expect(textIn(fixture)).toContain(HELP_MANIFEST.build.applicationVersion);

    fixture.componentInstance.acknowledgeUpdate();
    fixture.detectChanges();
    expect(fixture.componentInstance.updateApplied()).toBe(false);
  });

  it('says nothing into the outlet while the overlay stands over it', () => {
    // The overlay is a modal layer, so the page behind it — the outlet
    // included, it is mounted inside the frame — is inert and out of the
    // accessibility tree. An announcement published here is one no reader is
    // ever offered, and the overlay is what speaks in that state.
    const fixture = render('ready');
    const announcements = TestBed.inject(AnnouncementService);

    expect(fixture.componentInstance.updateOverlay()).toBe(true);
    expect(announcements.polite()).toBe('');
    expect(announcements.assertive()).toBe('');
  });

  it('announces a waiting version politely, once, and says only what stays true', async () => {
    // The published version, not the restart. An announcement is spoken once
    // and cannot be taken back, so this waits for the overlay to come down on
    // a restart that could not be carried out: only then is there a reader to
    // hear it and a sentence that stays true.
    updates.restartable = false;
    const fixture = render('ready');
    const announcements = TestBed.inject(AnnouncementService);

    updates.expire();
    await settled();
    fixture.detectChanges();

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['update.ready.notice']);
    expect(announcements.assertive()).toBe('');

    // A further version behind the first is the same sentence for the same
    // revision, and the overlay going up and down again does not repeat it.
    // Asserted on what the service did with the request, not on what the outlet
    // holds: a republished event writes the same string, so reading the outlet
    // again would pass either way. The effect does re-run — the overlay going
    // up and coming down is a change it tracks — and the identity is what
    // refuses it, which is the half worth proving.
    const published = vi.spyOn(announcements, 'announce');

    updates.report('ready');
    fixture.detectChanges();
    updates.expire();
    await settled();
    fixture.detectChanges();

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['update.ready.notice']);
    expect(published.mock.calls.length).toBeGreaterThan(0);
    expect(published.mock.results.map(({ value }) => value)).not.toContain(true);
  });

  it('does not republish the version event when a locale commits behind it', async () => {
    updates.restartable = false;
    const fixture = render('ready');
    const announcements = TestBed.inject(AnnouncementService);

    updates.expire();
    await settled();
    fixture.detectChanges();
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['update.ready.notice']);

    const published = vi.spyOn(announcements, 'announce');

    // Announcing resolves a message, and a message reads the catalogue. If that
    // read were tracked, this commit would re-run the version effect and put an
    // event that already happened back over whatever the outlet had moved on to.
    TestBed.inject(LocaleStore).commitCandidate(
      { requested: 'de', catalogue: GERMAN, source: 'asset', failure: null },
      'browser',
    );
    fixture.detectChanges();

    expect(published.mock.calls.filter(([request]) => request.kind === 'app.update')).toEqual([]);
  });

  it('treats a cached version that cannot be repaired as a blocking error', () => {
    const fixture = render('unusable');

    expect(fixture.componentInstance.updateStatus()?.tone).toBe('error');
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.unusable.notice']);
    expect(actionNamed(fixture, BUNDLED_ENGLISH['update.unusable.action'])).not.toBeNull();
  });

  it('summarizes the blocking error in the outlet rather than repeating it', () => {
    render('unusable');
    const announcements = TestBed.inject(AnnouncementService);

    // An error notice is exposed as an alert, so it is spoken where it stands.
    // An outlet carrying the same sentence would say it to a reader twice; it
    // carries the summary instead, the way hull detail's unknown hull does.
    expect(announcements.assertive()).toBe(BUNDLED_ENGLISH['update.unusable.announcement']);
    expect(announcements.assertive()).not.toBe(BUNDLED_ENGLISH['update.unusable.notice']);
  });
});

describe('routes', () => {
  it('serves the equipment bench at its own address, lazily and named', async () => {
    // Both tools answer an address of their own, so either can be opened,
    // bookmarked and returned to without going through the other (013/FR-027).
    // Lazy, so the ship tool's initial bundle does not carry the bench.
    const bench = routes.find((route) => route.path === 'equipment');

    expect(bench?.title).toBe('equipment.title');
    expect(bench?.data?.['description']).toBe('equipment.description');
    expect(await bench?.loadComponent?.()).toBe(EquipmentBenchPage);
  });
});

/** A screen with nothing in it, so a navigation activates the outlet. */
@Component({
  selector: 'ednb-waiting-screen',
  template: '<p>screen</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WaitingScreen {}

/**
 * The frame's own waiting state.
 *
 * Driven from router events rather than from a rendered screen, because that is
 * what the shell reads: the events say a chunk is on the wire, and nothing else
 * in the frame knows (011/FR-029).
 */
describe('App, waiting for a screen', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideLocalization(),
        // A screen of its own, so a navigation activates the outlet without
        // fetching one of the application's real chunks.
        provideRouter([{ path: 'screen', component: WaitingScreen }]),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(Location).go('/');
  });

  /** A route object standing in for one the router would report. */
  const someRoute = (path: string): Route => ({ path });

  function shell() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const events = TestBed.inject(Router).events as unknown as {
      next: (event: unknown) => void;
    };
    return { fixture, publish: (event: unknown) => events.next(event) };
  }

  const skeletonOf = (fixture: ComponentFixture<App>) =>
    (fixture.nativeElement as HTMLElement).querySelector('ednb-skeleton');

  it('holds the frame open past the fetch, until the screen is there', () => {
    // The chunk landing and the screen arriving are two moments, and one
    // navigation can ask for more than one chunk: a cold arrival at a child
    // address resolves the parent's component and the child's together. The
    // wait ends where the screen does, so neither gap leaves the frame blank.
    const { fixture, publish } = shell();
    const parent = someRoute('ships');
    const child = someRoute(':hull');

    publish(new RouteConfigLoadStart(parent));
    publish(new RouteConfigLoadStart(child));
    publish(new RouteConfigLoadEnd(parent));
    publish(new RouteConfigLoadEnd(child));
    fixture.detectChanges();

    expect(skeletonOf(fixture)).not.toBeNull();

    fixture.componentInstance.routeActivated();
    fixture.detectChanges();

    expect(skeletonOf(fixture)).toBeNull();
  });

  it('keeps the screen a Commander is reading while the next one loads', async () => {
    // The router leaves a screen activated until the next is ready, which is
    // the behaviour worth having. A skeleton over it would take a screen away
    // to say another was coming (011/FR-029).
    //
    // The screen is activated by navigating rather than by calling the handler,
    // so the outlet's own binding is what carries this. Without it the frame
    // has no way to know a screen is there, and covers it.
    const { fixture, publish } = shell();
    await TestBed.inject(Router).navigate(['/screen']);
    fixture.detectChanges();

    publish(new RouteConfigLoadStart(someRoute('equipment')));
    fixture.detectChanges();

    expect(skeletonOf(fixture)).toBeNull();
  });

  it('stops waiting for a chunk that never arrives', () => {
    // The router reports the end of a fetch that succeeded and says nothing
    // about one that failed. Without this the frame would say a screen is
    // loading for the rest of the session, which is the false statement
    // FR-029 forbids.
    const { fixture, publish } = shell();

    publish(new RouteConfigLoadStart(someRoute('ships')));
    fixture.detectChanges();
    expect(skeletonOf(fixture)).not.toBeNull();

    publish(new NavigationError(1, '/ships', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(skeletonOf(fixture)).toBeNull();
  });

  it('says so when the screen’s chunk does not arrive', () => {
    // A skeleton taken down over a frame with no screen behind it leaves the
    // shell around an empty page. The frame says what happened, and names the
    // way out: the router asks again on the next navigation.
    const { fixture, publish } = shell();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(someRoute('ships')));
    publish(new NavigationError(1, '/ships', new Error('chunk unavailable')));
    fixture.detectChanges();

    const notice = host.querySelector('ednb-status-notice .status');
    expect(notice?.textContent).toContain(BUNDLED_ENGLISH['route.failed.notice']);
    expect(notice?.getAttribute('role')).toBe('alert');

    // The frame drew the sentence, and that notice is an alert in its own
    // right. Speaking it as well tells a Commander the same thing twice for
    // one refused chunk.
    expect(TestBed.inject(AnnouncementService).polite()).toBe('');
  });

  it('takes the failure down when the next screen is asked for', () => {
    const { fixture, publish } = shell();
    const host = fixture.nativeElement as HTMLElement;

    publish(new RouteConfigLoadStart(someRoute('ships')));
    publish(new NavigationError(1, '/ships', new Error('chunk unavailable')));
    fixture.detectChanges();
    expect(host.querySelector('ednb-status-notice')).not.toBeNull();

    publish(new RouteConfigLoadStart(someRoute('equipment')));
    fixture.detectChanges();

    expect(host.querySelector('ednb-status-notice')).toBeNull();
    expect(skeletonOf(fixture)).not.toBeNull();
  });

  it('ends the wait on a navigation that is cancelled', () => {
    // A guard turns the navigation away and the router reports neither an end
    // nor an error. A skeleton raised by the fetch and lowered by those two
    // alone would stand over the frame for the rest of the session.
    const { fixture, publish } = shell();

    publish(new RouteConfigLoadStart(someRoute('equipment')));
    fixture.detectChanges();
    expect(skeletonOf(fixture)).not.toBeNull();

    publish(new NavigationCancel(1, '/equipment', ''));
    fixture.detectChanges();

    expect(skeletonOf(fixture)).toBeNull();
  });

  it('leaves the screen a Commander is reading alone when a navigation fails', async () => {
    // The router keeps them where they were. A notice over that would report a
    // failure by taking away the screen that did not fail.
    const { fixture, publish } = shell();
    const host = fixture.nativeElement as HTMLElement;
    await TestBed.inject(Router).navigate(['/screen']);
    fixture.detectChanges();

    publish(new RouteConfigLoadStart(someRoute('equipment')));
    publish(new NavigationError(1, '/equipment', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(host.querySelector('ednb-status-notice')).toBeNull();
  });

  it('says the screen did not arrive, to the reader on the screen it kept', async () => {
    // Keeping the screen is not the same as saying nothing. Nothing on the page
    // moves when the chunk is refused, so the press reads as a control that did
    // nothing, and it will do nothing again for the rest of the session. The
    // sentence is spoken rather than drawn, because drawing it would take away
    // the screen the frame is keeping.
    const { fixture, publish } = shell();
    const announcements = TestBed.inject(AnnouncementService);
    await TestBed.inject(Router).navigate(['/screen']);
    fixture.detectChanges();

    publish(new NavigationError(1, '/equipment', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['route.failed.notice']);

    // Pressing again is the same dead control, and a reader who has moved on
    // hears nothing unless the second attempt is its own event.
    announcements.clearOutlets();
    publish(new NavigationError(2, '/equipment', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['route.failed.notice']);
  });

  it('stays quiet where the screen draws the sentence itself', async () => {
    // The shipyard's rail holds the sentence in place of the hull, and an error
    // notice is an alert in its own right. Speaking it as well would tell a
    // Commander the same thing twice, in two places, for one refused chunk
    // (011 contracts/feedback-and-semantics.md).
    const { fixture, publish } = shell();
    const announcements = TestBed.inject(AnnouncementService);
    await TestBed.inject(Router).navigate(['/screen']);
    fixture.detectChanges();

    TestBed.inject(ScreenChrome).setOwnsRouteFailure(true);
    publish(new NavigationError(1, '/ships/anaconda', new Error('chunk unavailable')));
    fixture.detectChanges();

    expect(announcements.polite()).toBe('');
  });
});

/**
 * The two layers a Commander asks for, while the chunk that draws them is on
 * its way.
 *
 * Neither layer is in the shell's own chunk, so a press has a wait behind it.
 * What stands in the meantime is a layer of the same name, with a skeleton in
 * it, and a way out that takes back the request (011/FR-029).
 */
describe('App, waiting for a layer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideLocalization(),
        provideRouter([]),
        ...provideMemoryStorage(new MemoryStorage()),
      ],
      // The blocks are driven by hand. Left to itself a block resolves before a
      // test can read the state it is being asked about.
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
  });

  /** Renders the placeholder of the block at `index`, and returns the frame. */
  async function waitingLayer(index: number): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const blocks = await fixture.getDeferBlocks();
    await blocks[index].render(DeferBlockState.Loading);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  const titleOf = (host: HTMLElement) =>
    host.querySelector('.layer__title')?.textContent?.trim() ?? '';

  it('names the exchange layer a Commander asked for', async () => {
    TestBed.inject(SlefStore).openLayer('import');

    const host = await waitingLayer(0);

    expect(host.querySelector('ednb-layer ednb-skeleton')).not.toBeNull();
    expect(titleOf(host)).toContain(BUNDLED_ENGLISH['slef.import.title']);
  });

  it('names the export layer for the exchange it is, before the build is known', async () => {
    // The name the layer settles on carries the hull, which needs the presenter
    // whose chunk this is waiting for. The name it stands under is the one the
    // shell can reach without loading that chunk.
    TestBed.inject(SlefStore).openLayer('export');

    const host = await waitingLayer(0);

    expect(titleOf(host)).toContain(BUNDLED_ENGLISH['slef.export.title']);
  });

  it('stands at the width of the layer it is standing in for', async () => {
    // A placeholder narrower than what lands grows under the hand that opened
    // it. The import layer is a panel at the default measure and the export
    // layer is a wide one, so the placeholder takes whichever was asked for.
    TestBed.inject(SlefStore).openLayer('export');

    const host = await waitingLayer(0);

    expect(host.querySelector('.layer')?.classList).toContain('layer--wide');
  });

  it('stands at the default measure for the import layer', async () => {
    TestBed.inject(SlefStore).openLayer('import');

    const host = await waitingLayer(0);

    expect(host.querySelector('.layer')?.classList).not.toContain('layer--wide');
  });

  it('closes the exchange layer that is not there yet', async () => {
    // The way out cancels the opening rather than the fetch, so the layer that
    // lands a moment later lands closed.
    const store = TestBed.inject(SlefStore);
    store.openLayer('import');

    const host = await waitingLayer(0);
    host.querySelector<HTMLButtonElement>('.layer__dismiss')?.click();

    expect(store.layer()).toBe('none');
  });

  it('says so, and stays open, when the chunk does not arrive', async () => {
    // The block does not try again. Without a word here the layer a Commander
    // asked for would close on its own, and the control that opened it would do
    // nothing for the rest of the session.
    const store = TestBed.inject(SlefStore);
    store.openLayer('import');

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const blocks = await fixture.getDeferBlocks();
    await blocks[0].render(DeferBlockState.Error);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    // The words, and the role that carries them. A layer that failed and still
    // says it is loading is the state this branch exists to replace, and an
    // error read as an incidental update is not read as a problem.
    const notice = host.querySelector('ednb-layer ednb-status-notice .status');
    expect(notice?.textContent).toContain(BUNDLED_ENGLISH['layer.failed.notice']);
    expect(notice?.getAttribute('role')).toBe('alert');
    expect(titleOf(host)).toContain(BUNDLED_ENGLISH['slef.import.title']);
    expect(host.querySelector('.layer')?.classList).not.toContain('layer--wide');

    host.querySelector<HTMLButtonElement>('.layer__dismiss')?.click();
    expect(store.layer()).toBe('none');
  });

  it('says so when the library’s own chunk does not arrive', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.library.raise();
    fixture.detectChanges();

    const blocks = await fixture.getDeferBlocks();
    await blocks[1].render(DeferBlockState.Error);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const notice = host.querySelector('ednb-layer ednb-status-notice .status');
    expect(notice?.textContent).toContain(BUNDLED_ENGLISH['layer.failed.notice']);
    expect(notice?.getAttribute('role')).toBe('alert');
    expect(titleOf(host)).toContain(BUNDLED_ENGLISH['library.title']);
    expect(host.querySelector('.layer')?.classList).toContain('layer--widest');

    host.querySelector<HTMLButtonElement>('.layer__dismiss')?.click();
    expect(fixture.componentInstance.library.open()).toBe(false);
  });

  it('names the library layer, and closes it', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    fixture.componentInstance.library.raise();
    fixture.detectChanges();

    const blocks = await fixture.getDeferBlocks();
    await blocks[1].render(DeferBlockState.Loading);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(titleOf(host)).toContain(BUNDLED_ENGLISH['library.title']);
    // The library's own measure. A narrower placeholder would widen under the
    // hand when the chunk lands.
    expect(host.querySelector('.layer')?.classList).toContain('layer--widest');

    host.querySelector<HTMLButtonElement>('.layer__dismiss')?.click();
    expect(fixture.componentInstance.library.open()).toBe(false);
  });
});
