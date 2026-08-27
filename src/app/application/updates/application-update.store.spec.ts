import { TestBed } from '@angular/core/testing';
import {
  ApplicationUpdateAdapter,
  type VersionEvent,
} from '../../platform/browser/application-update.adapter';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { PageLifecycleAdapter } from '../../platform/browser/page-lifecycle.adapter';
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
}

function setup(options: { available?: boolean } = {}): Harness {
  const updates = new FakeUpdates();
  updates.available = options.available ?? true;
  const lifecycle = new FakeLifecycle();
  const connectivity = new FakeConnectivity();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ApplicationUpdateAdapter, useValue: updates },
      { provide: PageLifecycleAdapter, useValue: lifecycle },
      { provide: ConnectivityAdapter, useValue: connectivity },
    ],
  });

  return { store: TestBed.inject(ApplicationUpdateStore), updates, lifecycle, connectivity };
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
    // Reversed 2026-08-26. This used to assert the opposite — that nothing
    // restarts without a Commander pressing a control — and what that produced
    // was a fleet of sessions on old builds behind a notice nobody pressed.
    // What is kept is that the restart is announced before it happens and can
    // be called off (Commander request; FR-025).
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

  it('gives a Commander at least the twenty seconds the rule asks for', () => {
    // A restart on a clock is a time limit. It stands only because the overlay
    // warns before it expires and `postpone()` calls it off with one action,
    // and that branch of WCAG 2.2.1 sets the floor at twenty seconds.
    const { updates } = setup();

    updates.report('ready');

    expect(updates.grace).toBeGreaterThanOrEqual(20_000);
  });

  it('calls the restart off when a Commander says not now, and keeps the version ready', () => {
    const { store, updates } = setup();
    updates.report('ready');

    store.postpone();

    expect(store.overlay()).toBe(false);
    // The countdown is gone, so the page is not restarted behind the dismissal.
    expect(updates.grace).toBeNull();
    updates.expire();
    expect(updates.calls).toEqual([]);
    // And the version is still waiting, so the shell can offer it again.
    expect(store.state()).toBe('ready');
  });

  it('warns again when a further version is published after a "not now"', () => {
    // One "not now" answers for the version it was said to. A version published
    // behind it is a different question, and a session that stopped asking it
    // would be exactly the stale session this whole mechanism exists to
    // prevent — reached through the one control that was meant to be harmless
    // (FR-025).
    const { store, updates } = setup();
    updates.report('ready');
    store.postpone();
    expect(store.overlay()).toBe(false);

    updates.report('ready');

    expect(store.overlay()).toBe(true);
    expect(updates.grace).toBe(UPDATE_OVERLAY_MS);
    // And still one thing to say: the sentence on the shell was already true,
    // so nothing interrupts a reader to repeat it.
    expect(store.snapshot()).toEqual({ state: 'ready', revision: 1 });
  });

  it('calls off a restart a Commander dismissed while the worker was activating', async () => {
    // Activation is a round trip, and the overlay can be dismissed while it is
    // in the air. This is the one path where the way out has to hold: it is the
    // whole reason the time limit is allowed to stand at all (WCAG 2.2.1).
    const { store, updates } = setup();
    updates.report('ready');

    const restarting = store.apply();
    store.postpone();
    await restarting;

    expect(updates.calls).toEqual(['activate']);
    expect(store.state()).toBe('ready');
    // And the control that applies it is armed again, rather than left disabled
    // for the rest of the session.
    expect(store.applying()).toBe(false);
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
