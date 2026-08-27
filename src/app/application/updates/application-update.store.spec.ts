import { TestBed } from '@angular/core/testing';
import {
  ApplicationUpdateAdapter,
  type VersionEvent,
} from '../../platform/browser/application-update.adapter';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
import { EDSB_UPDATE_APPLIED_KEY } from '../../platform/storage/storage-keys';
import { MemoryStorage, provideMemoryStorage } from '../../platform/storage/storage.spec-helpers';
import {
  ApplicationUpdateStore,
  UPDATE_CHECK_INTERVAL_MS,
  UPDATE_OVERLAY_MS,
} from './application-update.store';

/** An update port a test can drive, standing in for the worker. */
class FakeUpdates {
  available = true;
  checks = 0;
  interval: number | null = null;

  /** What the port was asked to do, in the order it was asked. */
  readonly calls: ('activate' | 'reload')[] = [];

  /** Whether there is a page to start over. False stands in for no window. */
  restartable = true;

  #listener: ((event: VersionEvent) => void) | null = null;
  #scheduled: (() => void) | null = null;
  #grace: (() => void) | null = null;

  /** How long the grace period before a restart was set to, if one is running. */
  grace: number | null = null;

  onVersionEvent(listener: (event: VersionEvent) => void): () => void {
    this.#listener = listener;
    return () => (this.#listener = null);
  }

  async check(): Promise<void> {
    this.checks += 1;
  }

  async activate(): Promise<void> {
    this.calls.push('activate');
  }

  reload(): boolean {
    this.calls.push('reload');
    return this.restartable;
  }

  every(milliseconds: number, run: () => void): () => void {
    this.interval = milliseconds;
    this.#scheduled = run;
    return () => (this.#scheduled = null);
  }

  after(milliseconds: number, run: () => void): () => void {
    this.grace = milliseconds;
    this.#grace = run;
    return () => {
      this.grace = null;
      this.#grace = null;
    };
  }

  /** The grace period running out. */
  expire(): void {
    this.#grace?.();
  }

  /** The worker reporting on this page's version. */
  report(event: VersionEvent): void {
    this.#listener?.(event);
  }

  /** The scheduled check coming round. */
  tick(): void {
    this.#scheduled?.();
  }
}

/** The lifecycle port, reduced to the one moment this store cares about. */
class FakeLifecycle {
  #resumed: (() => void) | null = null;

  onVisible(resumed: () => void): () => void {
    this.#resumed = resumed;
    return () => (this.#resumed = null);
  }

  returnToTab(): void {
    this.#resumed?.();
  }
}

/** The connectivity port, reduced to the one moment this store cares about. */
class FakeConnectivity {
  #online: (() => void) | null = null;

  onOnline(listener: () => void): () => void {
    this.#online = listener;
    return () => (this.#online = null);
  }

  goOnline(): void {
    this.#online?.();
  }
}

interface Harness {
  readonly store: ApplicationUpdateStore;
  readonly updates: FakeUpdates;
  readonly lifecycle: FakeLifecycle;
  readonly connectivity: FakeConnectivity;
  /** The session area the restart leaves its marker in. */
  readonly session: MemoryStorage;
}

function setup(
  options: { available?: boolean; session?: MemoryStorage; restartable?: boolean } = {},
): Harness {
  const updates = new FakeUpdates();
  updates.available = options.available ?? true;
  updates.restartable = options.restartable ?? true;
  const lifecycle = new FakeLifecycle();
  const connectivity = new FakeConnectivity();
  const session = options.session ?? new MemoryStorage();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ApplicationUpdateAdapter, useValue: updates },
      { provide: PageLifecycleAdapter, useValue: lifecycle },
      { provide: ConnectivityAdapter, useValue: connectivity },
      ...provideMemoryStorage(new MemoryStorage(), session),
    ],
  });

  return {
    store: TestBed.inject(ApplicationUpdateStore),
    updates,
    lifecycle,
    connectivity,
    session,
  };
}

describe('ApplicationUpdateStore', () => {
  it('starts on the version it was served, with nothing to say', () => {
    const { store } = setup();

    expect(store.state()).toBe('current');
    expect(store.snapshot()).toEqual({ state: 'current', revision: 0 });
  });

  it('asks once at startup, so a session that was opened on a stale build learns about it', () => {
    const { updates } = setup();

    expect(updates.checks).toBe(1);
  });

  it('asks again on the schedule, on returning to the tab and on regaining a network', async () => {
    const { updates, lifecycle, connectivity } = setup();

    updates.tick();
    lifecycle.returnToTab();
    connectivity.goOnline();

    expect(updates.interval).toBe(UPDATE_CHECK_INTERVAL_MS);
    expect(updates.checks).toBe(4);
  });

  it('publishes a downloaded version as one thing to say', () => {
    const { store, updates } = setup();

    updates.report('ready');

    expect(store.snapshot()).toEqual({ state: 'ready', revision: 1 });
  });

  it('does not repeat itself when a further version arrives behind the first', () => {
    const { store, updates } = setup();

    updates.report('ready');
    updates.report('ready');

    expect(store.snapshot()).toEqual({ state: 'ready', revision: 1 });
  });

  it('lets a broken cached version supersede a waiting one, and never the other way round', () => {
    const { store, updates } = setup();

    updates.report('ready');
    updates.report('unusable');
    expect(store.snapshot()).toEqual({ state: 'unusable', revision: 2 });
    // And the restart the waiting version had scheduled is called off with it:
    // the page must not start over on a clock while an error is on screen.
    expect(store.overlay()).toBe(false);
    expect(updates.grace).toBeNull();

    updates.report('ready');
    expect(store.snapshot()).toEqual({ state: 'unusable', revision: 2 });
  });

  it('puts the overlay up the moment a version is ready, and restarts under it', async () => {
    // The restart is applied rather than offered: a notice that waits to be
    // pressed produces a fleet of sessions on old builds behind a notice nobody
    // presses, which is the failure this mechanism exists to prevent (FR-025).
    const { store, updates } = setup();

    updates.report('ready');
    expect(store.overlay()).toBe(true);
    expect(updates.calls).toEqual([]);
    expect(updates.grace).toBe(UPDATE_OVERLAY_MS);

    updates.expire();
    await Promise.resolve();
    await Promise.resolve();

    expect(updates.calls).toEqual(['activate', 'reload']);
  });

  it('stands the overlay long enough for its sentence to be read', () => {
    // The number is not a rule any more. WCAG 2.2.1's twenty-second floor
    // applied while the overlay carried a control that called the restart off;
    // there is none, the criterion is excluded for this mechanism, and what
    // sets the period now is one sentence at reading speed.
    const { updates } = setup();

    updates.report('ready');

    expect(updates.grace).toBeGreaterThanOrEqual(3_000);
  });

  it('leaves the marker the session after the restart reads, and only for an update', async () => {
    const { store, updates, session } = setup();
    updates.report('ready');

    await store.apply();

    // Written before the reload, because after it there is no code here to
    // write anything.
    expect(session.entries.get(EDSB_UPDATE_APPLIED_KEY)).toBe('1');
    expect(updates.calls).toEqual(['activate', 'reload']);
  });

  it('leaves no marker when a repair restarts an unusable cache', async () => {
    // A repair restarts onto the version this session was already supposed to
    // be running. That is not an update, and announcing one would be a claim
    // about a version that never changed.
    const { store, updates, session } = setup();
    updates.report('unusable');

    await store.apply();

    expect(session.entries.has(EDSB_UPDATE_APPLIED_KEY)).toBe(false);
    expect(updates.calls).toEqual(['reload']);
  });

  it('takes the marker back when there was no page to start over', async () => {
    const { store, updates, session } = setup();
    updates.restartable = false;
    updates.report('ready');

    await store.apply();

    // Otherwise the next session is greeted with news of a restart that never
    // happened.
    expect(session.entries.has(EDSB_UPDATE_APPLIED_KEY)).toBe(false);
    expect(store.applying()).toBe(false);
    expect(store.overlay()).toBe(false);
  });

  it('says the update was applied in the session that comes up after it', () => {
    const session = new MemoryStorage();
    session.entries.set(EDSB_UPDATE_APPLIED_KEY, '1');

    const { store } = setup({ session });

    expect(store.applied()).toBe(true);
    // Cleared as it is read, so a second navigation in the same tab does not
    // repeat it.
    expect(session.entries.has(EDSB_UPDATE_APPLIED_KEY)).toBe(false);

    store.acknowledgeApplied();
    expect(store.applied()).toBe(false);
  });

  it('says nothing about an update in a session that did not restart onto one', () => {
    const { store, session } = setup();

    expect(store.applied()).toBe(false);
    expect(session.entries.has(EDSB_UPDATE_APPLIED_KEY)).toBe(false);
  });

  it('reads the marker even where no worker is registered', () => {
    // The development server registers none, and a restart that happened
    // before one was registered still happened.
    const session = new MemoryStorage();
    session.entries.set(EDSB_UPDATE_APPLIED_KEY, '1');

    const { store } = setup({ available: false, session });

    expect(store.applied()).toBe(true);
  });

  it('restarts again for a further version, where the first restart could not happen', async () => {
    // Each `ready` is a version that was not there before, and this is the only
    // session that can act on two of them: one whose restart found no page to
    // start over. A session that stopped acting on them would be the stale
    // session this whole mechanism exists to prevent (FR-025).
    //
    // Ordinarily a restart is the last thing a page does, so `apply()` holds
    // its flag and there is no second attempt to make. Releasing that flag when
    // the reload reports there was nothing to reload is what leaves this
    // session able to try again.
    const { store, updates } = setup({ restartable: false });
    updates.report('ready');
    updates.expire();
    await Promise.resolve();
    await Promise.resolve();
    expect(updates.calls).toEqual(['activate', 'reload']);
    expect(store.overlay()).toBe(false);

    updates.report('ready');
    expect(store.overlay()).toBe(true);
    expect(updates.grace).toBe(UPDATE_OVERLAY_MS);
    updates.expire();
    await Promise.resolve();
    await Promise.resolve();

    expect(updates.calls).toEqual(['activate', 'reload', 'activate', 'reload']);
    // And still one thing to say: the sentence on the shell was already true,
    // so nothing interrupts a reader to repeat it.
    expect(store.snapshot()).toEqual({ state: 'ready', revision: 1 });
  });

  it('never puts the overlay over a cached version it cannot repair', () => {
    // An error is not an improvement. Its restart is a repair a Commander asks
    // for, and there is no working page underneath to protect from the reload.
    const { store, updates } = setup();

    updates.report('unusable');

    expect(store.overlay()).toBe(false);
    expect(updates.grace).toBeNull();
    expect(updates.calls).toEqual([]);
  });

  it('activates the waiting version and only then starts the page over', async () => {
    const { store, updates } = setup();
    updates.report('ready');

    await store.apply();

    // The order is the point, not the count. A page that started over first
    // would come back as a shell from one build asking for chunks from another.
    // An activation the port could not make is swallowed there and the restart
    // still happens: coming back on the version it already had is recoverable,
    // and a page told to restart that did not is what a Commander is stuck in.
    expect(updates.calls).toEqual(['activate', 'reload']);
  });

  it('repairs a broken cached version by starting over, with nothing to activate', async () => {
    const { store, updates } = setup();
    updates.report('unusable');

    await store.apply();

    expect(updates.calls).toEqual(['reload']);
  });

  it('does nothing when asked to apply a version that is already the current one', async () => {
    const { store, updates } = setup();

    await store.apply();

    expect(updates.calls).toEqual([]);
  });

  it('acts on one restart however many times it is asked for', async () => {
    const { store, updates } = setup();
    updates.report('ready');

    const first = store.apply();
    const second = store.apply();
    await Promise.all([first, second]);

    expect(store.applying()).toBe(true);
    expect(updates.calls).toEqual(['activate', 'reload']);
  });

  it('offers the restart again when there was no page to start over', async () => {
    const { store, updates } = setup();
    updates.restartable = false;
    updates.report('ready');

    await store.apply();

    // The flag exists to stop a second press of a control that is on its way
    // out. A restart that could not happen leaves the control the only way back
    // out of this session, so it must not stay disabled.
    expect(store.applying()).toBe(false);
    expect(updates.calls).toEqual(['activate', 'reload']);

    await store.apply();
    expect(updates.calls).toEqual(['activate', 'reload', 'activate', 'reload']);
  });

  it('asks nothing and says nothing where no worker caches the application', () => {
    const { store, updates, lifecycle, connectivity } = setup({ available: false });

    updates.tick();
    lifecycle.returnToTab();
    connectivity.goOnline();
    updates.report('ready');

    expect(updates.checks).toBe(0);
    expect(updates.interval).toBeNull();
    expect(store.state()).toBe('current');
  });
});
