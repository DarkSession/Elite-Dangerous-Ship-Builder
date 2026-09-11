import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { App } from './app';
import { NAVIGATION_WAITING_THRESHOLD_MS } from './application/navigation/navigation-waiting.store';
import { provideLocalization } from './i18n/i18n.providers';
import { BUNDLED_ENGLISH } from './i18n/locale-registry';
import {
  ApplicationUpdateAdapter,
  type VersionEvent,
} from './platform/browser/application-update.adapter';
import { MemoryStorage, provideMemoryStorage } from './platform/storage/storage.spec-helpers';
import { AnnouncementService } from './ui/announcements/announcement.service';

/**
 * What the shell puts up while a screen is on its way, and what it says when
 * one never arrives.
 *
 * Real navigations over real routes, one of which is held open, because the
 * behaviour is about a navigation rather than about a signal: a chunk the
 * browser resolves at once has to draw nothing, and one that is still coming
 * has to draw the statement over whatever screen was on.
 */

/** A screen, standing in for one the build would split into its own chunk. */
@Component({ selector: 'ednb-a-screen', template: '<h1>A screen</h1>' })
class AScreen {}

@Component({ selector: 'ednb-another-screen', template: '<h1>Another screen</h1>' })
class AnotherScreen {}

/** The worker port, reporting only what a test tells it to. */
class FakeUpdates {
  available = true;
  restartable = true;
  #listener: ((event: VersionEvent) => void) | null = null;
  readonly #pending: (() => void)[] = [];

  onVersionEvent(listener: (event: VersionEvent) => void): () => void {
    this.#listener = listener;
    return () => (this.#listener = null);
  }
  async check(): Promise<void> {}
  async activate(): Promise<void> {}
  reload(): boolean {
    return this.restartable;
  }
  every(): () => void {
    return () => {};
  }
  after(_milliseconds: number, run: () => void): () => void {
    this.#pending.push(run);
    return () => {};
  }
  report(event: VersionEvent): void {
    this.#listener?.(event);
  }
}

/**
 * `<dialog>` without the modal methods, which jsdom does not implement.
 *
 * Returns what puts the prototype back. The environment is shared with every
 * other file in the run, so a stub left on it is a stub the next file inherits.
 */
function stubNativeDialog(): () => void {
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  const original = { showModal: prototype['showModal'], close: prototype['close'] };
  prototype['showModal'] = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype['close'] = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
  return () => {
    prototype['showModal'] = original.showModal;
    prototype['close'] = original.close;
  };
}

describe('App and a screen that is on its way', () => {
  let updates: FakeUpdates;

  /** The screen whose code the test holds, and how it is let go. */
  let arrive: () => void;

  /** Puts the modal methods back on the prototype the whole run shares. */
  let restoreNativeDialog: () => void;

  beforeEach(async () => {
    restoreNativeDialog = stubNativeDialog();
    updates = new FakeUpdates();
    const held = new Promise<typeof AnotherScreen>((resolve) => {
      arrive = () => resolve(AnotherScreen);
    });

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideLocalization(),
        provideRouter([
          { path: '', pathMatch: 'full', component: AScreen },
          { path: 'held', loadComponent: () => held },
          { path: '**', redirectTo: '' },
        ]),
        { provide: ApplicationUpdateAdapter, useValue: updates },
        ...provideMemoryStorage(new MemoryStorage(), new MemoryStorage()),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.inject(Location).go('/');
    restoreNativeDialog();
  });

  /** The shell, with the session's first navigation already behind it. */
  async function started(): Promise<ComponentFixture<App>> {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    return fixture;
  }

  const overlay = (fixture: ComponentFixture<App>) =>
    (fixture.nativeElement as HTMLElement).querySelector('ednb-waiting-overlay dialog[open]');

  const textIn = (fixture: ComponentFixture<App>) =>
    ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

  it('draws nothing for a navigation the browser resolves inside the threshold', async () => {
    const fixture = await started();

    // The route is already loaded, so this ends in the same task the threshold
    // was started in.
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    expect(overlay(fixture)).toBeNull();
  });

  it('draws the statement over the screen that was on, once the threshold passes', async () => {
    const fixture = await started();
    vi.useFakeTimers();

    void TestBed.inject(Router).navigateByUrl('/held');
    await vi.advanceTimersByTimeAsync(NAVIGATION_WAITING_THRESHOLD_MS);
    fixture.detectChanges();

    expect(overlay(fixture)).not.toBeNull();
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['navigation.waiting.notice']);
    // The screen the Commander pressed from is still what is behind it.
    expect((fixture.nativeElement as HTMLElement).querySelector('ednb-a-screen')).not.toBeNull();
  });

  it('offers nothing to press while it stands', async () => {
    const fixture = await started();
    vi.useFakeTimers();

    void TestBed.inject(Router).navigateByUrl('/held');
    await vi.advanceTimersByTimeAsync(NAVIGATION_WAITING_THRESHOLD_MS);
    fixture.detectChanges();

    // The navigation is already running. Nothing removes the statement but the
    // navigation ending — including the native cancel, which the overlay
    // refuses.
    const standing = overlay(fixture);
    expect(standing?.querySelectorAll('button, a, [role="button"]').length).toBe(0);

    const cancel = new Event('cancel', { cancelable: true });
    standing?.dispatchEvent(cancel);
    fixture.detectChanges();

    expect(cancel.defaultPrevented).toBe(true);
    expect(overlay(fixture)).not.toBeNull();
  });

  it('takes the statement down when the screen arrives', async () => {
    const fixture = await started();
    vi.useFakeTimers();

    void TestBed.inject(Router).navigateByUrl('/held');
    await vi.advanceTimersByTimeAsync(NAVIGATION_WAITING_THRESHOLD_MS);
    fixture.detectChanges();
    expect(overlay(fixture)).not.toBeNull();

    arrive();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(overlay(fixture)).toBeNull();
  });

  it('draws nothing at all while the restart announcement stands', async () => {
    const fixture = await started();
    vi.useFakeTimers();

    // The wait first, then the restart. The text that precedes a restart has to
    // stay visible (011/FR-025), and a navigation running under it is not going
    // to finish.
    void TestBed.inject(Router).navigateByUrl('/held');
    await vi.advanceTimersByTimeAsync(NAVIGATION_WAITING_THRESHOLD_MS);
    fixture.detectChanges();
    expect(overlay(fixture)).not.toBeNull();

    updates.report('ready');
    fixture.detectChanges();

    expect(fixture.componentInstance.updateOverlay()).toBe(true);
    expect(overlay(fixture)).toBeNull();
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['update.applying.notice']);
  });

  it('draws nothing when the restart announcement was up first', async () => {
    const fixture = await started();
    vi.useFakeTimers();

    updates.report('ready');
    fixture.detectChanges();

    void TestBed.inject(Router).navigateByUrl('/held');
    await vi.advanceTimersByTimeAsync(NAVIGATION_WAITING_THRESHOLD_MS);
    fixture.detectChanges();

    expect(overlay(fixture)).toBeNull();
  });
});

describe('App and a screen that never arrives', () => {
  let refuse: () => void;

  /** Puts the modal methods back on the prototype the whole run shares. */
  let restoreNativeDialog: () => void;

  beforeEach(async () => {
    restoreNativeDialog = stubNativeDialog();
    const held = new Promise<typeof AnotherScreen>((_resolve, reject) => {
      refuse = () => reject(new Error('The chunk could not be fetched.'));
    });
    held.catch(() => {});

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideLocalization(),
        provideRouter([
          { path: '', pathMatch: 'full', component: AScreen },
          { path: 'held', loadComponent: () => held },
          // An address other than the one the shell starts on, so a test can
          // run a navigation that actually opens a screen: a press on the
          // address a Commander is already at is skipped rather than run.
          { path: 'elsewhere', component: AnotherScreen },
          { path: '**', redirectTo: '' },
        ]),
        { provide: ApplicationUpdateAdapter, useValue: new FakeUpdates() },
        ...provideMemoryStorage(new MemoryStorage(), new MemoryStorage()),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(Location).go('/');
    restoreNativeDialog();
  });

  /** The shell, with the held screen asked for and refused. */
  async function failed(): Promise<ComponentFixture<App>> {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();

    const navigation = TestBed.inject(Router)
      .navigateByUrl('/held')
      .catch(() => false);
    refuse();
    await navigation;
    fixture.detectChanges();
    return fixture;
  }

  const textIn = (fixture: ComponentFixture<App>) =>
    ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s+/g, ' ');

  /**
   * The node the polite outlet is holding, which is what a reader is told about.
   *
   * Text nodes only: the framework's own anchors are comments, and they stay put
   * across a change.
   */
  const spokenNode = (fixture: ComponentFixture<App>): ChildNode | null => {
    const outlet = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-announcement-outlet="polite"]',
    );
    return (
      [...(outlet?.childNodes ?? [])].find(
        (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
      ) ?? null
    );
  };

  it('says the screen could not be opened, in words that stay on the page', async () => {
    const fixture = await failed();

    expect(fixture.componentInstance.statusNotices().map((notice) => notice.message)).toEqual([
      BUNDLED_ENGLISH['navigation.failed.notice'],
    ]);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['navigation.failed.notice']);
    expect(textIn(fixture)).toContain(BUNDLED_ENGLISH['navigation.failed.detail']);
  });

  it('leaves the Commander on a screen they can still use', async () => {
    const fixture = await failed();

    expect((fixture.nativeElement as HTMLElement).querySelector('ednb-a-screen')).not.toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('ednb-waiting-overlay dialog[open]'),
    ).toBeNull();
  });

  it('announces it once, without interrupting current speech', async () => {
    const fixture = await failed();

    const announcements = TestBed.inject(AnnouncementService);
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['navigation.failed.notice']);
    expect(announcements.assertive()).toBe('');

    // A second pass over the same failure is the same event, and says nothing.
    fixture.detectChanges();
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['navigation.failed.notice']);
  });

  it('draws the notice as a status, so nothing interrupts what a reader was saying', async () => {
    const fixture = await failed();

    // The outlets are not the only live region on the page: the notice is one
    // too, so an assertive outlet that is empty proves nothing on its own. A
    // `status` is the polite one — it waits its turn — where the `alert` an
    // error tone would draw speaks over whatever was being said. Whether a
    // reader then says the sentence twice, once from each polite region, is a
    // judgment no scan can make: step 21 of
    // `e2e/manual/screen-reader.protocol.md` is where that is settled.
    const notice = (fixture.nativeElement as HTMLElement).querySelector(
      '.frame__status ednb-status-notice [role]',
    );

    expect(notice?.getAttribute('role')).toBe('status');
  });

  it('states a second failure as a second event', async () => {
    const announcements = TestBed.inject(AnnouncementService);
    const announce = vi.spyOn(announcements, 'announce');

    const fixture = await failed();
    expect(announce).toHaveBeenCalledTimes(1);
    const first = spokenNode(fixture);

    // A screen that opens is the answer to the failure before it, and the
    // press after that is a new event rather than the one already spoken. The
    // effect runs on the failure count, so the second press publishes a second
    // time and the policy adds nothing of its own.
    //
    // It goes to another address rather than back to the one the shell is on:
    // the router skips a press on the address it is already at, and a skip
    // opens no screen and would answer nothing here.
    await TestBed.inject(Router).navigateByUrl('/elsewhere');
    fixture.detectChanges();
    expect(fixture.componentInstance.statusNotices().map((notice) => notice.message)).toEqual([]);

    const second = TestBed.inject(Router)
      .navigateByUrl('/held')
      .catch(() => false);
    await second;
    fixture.detectChanges();

    expect(announce).toHaveBeenCalledTimes(2);
    expect(announcements.polite()).toBe(BUNDLED_ENGLISH['navigation.failed.notice']);
    expect(announcements.assertive()).toBe('');

    // What was published is not what a reader hears. Both failures say the
    // same sentence, so the outlet holding that sentence at the end says
    // nothing about whether the second one reached anyone. The node is what a
    // live region announces, so the node is what is read.
    const spoken = spokenNode(fixture);
    expect(first, 'the first failure put nothing in the polite outlet').not.toBeNull();
    expect(spoken, 'the second failure emptied the polite outlet').not.toBeNull();
    expect(spoken, 'the polite outlet was left holding the first failure').not.toBe(first);
  });

  it('keeps the version notice first when both are standing', async () => {
    const fixture = await failed();

    const updates = TestBed.inject(ApplicationUpdateAdapter) as unknown as FakeUpdates;
    updates.report('unusable');
    fixture.detectChanges();

    // The version notice is about the whole session; the failure is about one
    // press. Neither displaces the other.
    expect(fixture.componentInstance.statusNotices().map((notice) => notice.message)).toEqual([
      BUNDLED_ENGLISH['update.unusable.notice'],
      BUNDLED_ENGLISH['navigation.failed.notice'],
    ]);
  });
});
