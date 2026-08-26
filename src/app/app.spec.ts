import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { App, HELP_ACTION } from './app';
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

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideLocalization()],
    }).compileComponents();
  });

  it('creates the application root', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders inside the shared application frame', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('edsb-app-frame')).not.toBeNull();
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

  it('offers the same primary navigation from every screen', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const named = (selector: string) =>
      [...(fixture.nativeElement as HTMLElement).querySelectorAll(selector)].map((link) =>
        link.textContent?.trim(),
      );

    // The reference's command bar offers the library as a chip, and never a
    // chip for the build screen (canvas 1a/1b/1c).
    const expected = [BUNDLED_ENGLISH['navigation.library']];

    // The same list in both placements: on the bar's trailing edge where there
    // is room (canvas 1c), and in the `⋮` menu where there is not (canvas 1d).
    // One is drawn at a time, and which one is a stylesheet's decision.
    expect(named('.frame__navigation a')).toEqual(expected);
    expect(named('.action-layer__navigation a')).toEqual(expected);
  });

  it('carries the way back to the shipyard on the bar\u2019s own insignia', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const insignia = element.querySelector('.frame__flag--home');

    // The 2026-08-26 revision puts the mark where the `SHIPYARD` word used to
    // be, so the mark is the control and the word is not drawn twice. It is a
    // link, so it opens in a new tab and copies like any other address, and it
    // says where it goes for a reader who cannot see the mark.
    expect(insignia?.getAttribute('href')).toBe('/ships');
    expect(insignia?.textContent?.trim()).toBe(BUNDLED_ENGLISH['navigation.catalogue']);
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

  #listener: ((event: VersionEvent) => void) | null = null;
  #grace: (() => void) | null = null;

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
    return true;
  }

  every(): () => void {
    return () => {};
  }

  after(_milliseconds: number, run: () => void): () => void {
    this.#grace = run;
    return () => (this.#grace = null);
  }

  /** The worker reporting on this page's version. */
  report(event: VersionEvent): void {
    this.#listener?.(event);
  }

  /** The grace period under the overlay running out. */
  expire(): void {
    this.#grace?.();
  }
}

/**
 * `<dialog>` without the native modal methods, which jsdom does not implement.
 *
 * The overlay is a layer, and a layer calls them the moment it opens. What
 * these tests are about is what the shell decides to put up, not what a
 * browser does with a dialog element once it is up.
 */
function stubNativeDialog(): void {
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  prototype['showModal'] = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype['close'] = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

describe('App and a newly published version', () => {
  let updates: FakeUpdates;

  beforeEach(async () => {
    stubNativeDialog();
    updates = new FakeUpdates();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideLocalization(), { provide: ApplicationUpdateAdapter, useValue: updates }],
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
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.applying.detail']);
    // Both ways out of it are named on it: go now, or not now.
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.applying.now']);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.applying.postpone']);
    // Nothing has been replaced yet.
    expect(updates.activations).toBe(0);
    expect(updates.reloads).toBe(0);
  });

  it('says the same thing once, on the overlay and not on the shell behind it', () => {
    // The shell under a modal is inert, so a notice and a control there would
    // be a second copy of this one that nobody can reach (feedback contract).
    const fixture = render('ready');

    expect(fixture.componentInstance.updateStatus()).toBeNull();
    expect(fixture.componentInstance.updateAction()).toBeNull();
  });

  it('offers the version again on the shell once the overlay is postponed', async () => {
    const fixture = render('ready');

    fixture.componentInstance.postponeUpdate();
    fixture.detectChanges();

    expect(fixture.componentInstance.updateOverlay()).toBe(false);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.ready.notice']);
    expect(actionNamed(fixture, BUNDLED_ENGLISH['update.ready.action'])).not.toBeNull();
    // And nothing restarts behind the dismissal.
    updates.expire();
    await settled();
    expect(updates.reloads).toBe(0);
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

  it('goes at once when a Commander would rather not wait it out', async () => {
    const fixture = render('ready');

    fixture.componentInstance.applyUpdateNow();
    await settled();

    expect(updates.activations).toBe(1);
    expect(updates.reloads).toBe(1);
  });

  it('announces a waiting version politely, once, and says only what stays true', () => {
    // The published version, not the restart. An announcement is spoken once
    // and cannot be taken back, and the restart can be called off — so the
    // sentence that reaches the outlet is the one that survives a "not now".
    const fixture = render('ready');
    const announcements = TestBed.inject(AnnouncementService);

    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['update.ready.notice']);
    expect(announcements.assertive()).toBe('');

    updates.report('ready');
    fixture.detectChanges();
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['update.ready.notice']);
  });

  it('does not republish the version event when a locale commits behind it', () => {
    const fixture = render('ready');
    const announcements = TestBed.inject(AnnouncementService);
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
