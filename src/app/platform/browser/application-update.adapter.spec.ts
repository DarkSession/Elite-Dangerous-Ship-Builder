import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { ApplicationUpdateAdapter, type VersionEvent } from './application-update.adapter';

/** The two channels the adapter listens to, driveable from a test. */
class FakeWorker {
  readonly versionUpdates = new Subject<{ type: string }>();
  readonly unrecoverable = new Subject<{ reason: string }>();

  isEnabled = true;
  checks = 0;
  activations = 0;
  checkRejects = false;
  activateRejects = false;

  async checkForUpdate(): Promise<boolean> {
    this.checks += 1;
    if (this.checkRejects) {
      throw new Error('no network');
    }
    return true;
  }

  async activateUpdate(): Promise<boolean> {
    this.activations += 1;
    if (this.activateRejects) {
      throw new Error('nothing to activate');
    }
    return true;
  }
}

/** A window stand-in exposing exactly what the adapter reaches for. */
class FakeWindow {
  reloads = 0;
  /** Whether this frame is allowed to navigate itself at all. */
  reloadRefused = false;
  readonly location = {
    reload: () => {
      if (this.reloadRefused) {
        throw new Error('SecurityError');
      }
      this.reloads += 1;
    },
  };
  readonly scheduled = new Map<number, () => void>();
  #handle = 0;

  setInterval(run: () => void): number {
    this.#handle += 1;
    this.scheduled.set(this.#handle, run);
    return this.#handle;
  }

  clearInterval(handle: number): void {
    this.scheduled.delete(handle);
  }

  /** Fires every live interval once. */
  tick(): void {
    for (const run of this.scheduled.values()) {
      run();
    }
  }
}

interface Harness {
  readonly adapter: ApplicationUpdateAdapter;
  readonly worker: FakeWorker;
  readonly view: FakeWindow;
}

function setup(options: { worker?: FakeWorker | null } = {}): Harness {
  const worker = options.worker === undefined ? new FakeWorker() : options.worker;
  const view = new FakeWindow();

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: { defaultView: view } },
      ...(worker === null ? [] : [{ provide: SwUpdate, useValue: worker }]),
    ],
  });

  return {
    adapter: TestBed.inject(ApplicationUpdateAdapter),
    worker: worker ?? new FakeWorker(),
    view,
  };
}

describe('ApplicationUpdateAdapter', () => {
  it('reports a downloaded version as ready to be used', () => {
    const { adapter, worker } = setup();
    const seen: VersionEvent[] = [];
    adapter.onVersionEvent((event) => seen.push(event));

    worker.versionUpdates.next({ type: 'VERSION_READY' });

    expect(seen).toEqual(['ready']);
  });

  it('reports a cached version the worker cannot repair', () => {
    const { adapter, worker } = setup();
    const seen: VersionEvent[] = [];
    adapter.onVersionEvent((event) => seen.push(event));

    worker.unrecoverable.next({ reason: 'a cached file is gone' });

    expect(seen).toEqual(['unusable']);
  });

  it('says nothing about a version that is only detected or failed to install', () => {
    const { adapter, worker } = setup();
    const seen: VersionEvent[] = [];
    adapter.onVersionEvent((event) => seen.push(event));

    worker.versionUpdates.next({ type: 'VERSION_DETECTED' });
    worker.versionUpdates.next({ type: 'VERSION_INSTALLATION_FAILED' });
    worker.versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED' });

    expect(seen).toEqual([]);
  });

  it('stops reporting once the listener is released', () => {
    const { adapter, worker } = setup();
    const seen: VersionEvent[] = [];
    const release = adapter.onVersionEvent((event) => seen.push(event));

    release();
    worker.versionUpdates.next({ type: 'VERSION_READY' });
    worker.unrecoverable.next({ reason: 'gone' });

    expect(seen).toEqual([]);
  });

  it('asks the worker to look again', async () => {
    const { adapter, worker } = setup();

    await adapter.check();

    expect(worker.checks).toBe(1);
  });

  it('treats a check that could not be made as no answer rather than a failure', async () => {
    const { adapter, worker } = setup();
    worker.checkRejects = true;

    await expect(adapter.check()).resolves.toBeUndefined();
    expect(worker.checks).toBe(1);
  });

  it('activates the downloaded version and survives an activation that cannot happen', async () => {
    const { adapter, worker } = setup();

    await adapter.activate();
    expect(worker.activations).toBe(1);

    worker.activateRejects = true;
    await expect(adapter.activate()).resolves.toBeUndefined();
  });

  it('starts the page over, and says that it could', () => {
    const { adapter, view } = setup();

    expect(adapter.reload()).toBe(true);
    expect(view.reloads).toBe(1);
  });

  it('reports a restart a frame is not allowed to make', () => {
    const { adapter, view } = setup();
    view.reloadRefused = true;

    // A sandboxed frame raises rather than refusing quietly. A caller left
    // waiting for a page that is not going anywhere is the failure this exists
    // to prevent, so the refusal is an answer and never an exception.
    expect(adapter.reload()).toBe(false);
    expect(view.reloads).toBe(0);
  });

  it('repeats a check until the schedule is released', () => {
    const { adapter, view } = setup();
    let runs = 0;
    const release = adapter.every(1000, () => (runs += 1));

    view.tick();
    expect(runs).toBe(1);

    release();
    view.tick();
    expect(runs).toBe(1);
  });

  it('does nothing at all where no worker is registered', async () => {
    const { adapter } = setup({ worker: null });
    const seen: VersionEvent[] = [];

    expect(adapter.available).toBe(false);
    expect(adapter.onVersionEvent((event) => seen.push(event))()).toBeUndefined();
    await expect(adapter.check()).resolves.toBeUndefined();
    await expect(adapter.activate()).resolves.toBeUndefined();
  });

  it('does nothing while the registered worker is disabled', async () => {
    const { adapter, worker } = setup();
    worker.isEnabled = false;
    const seen: VersionEvent[] = [];

    expect(adapter.available).toBe(false);
    adapter.onVersionEvent((event) => seen.push(event));
    worker.versionUpdates.next({ type: 'VERSION_READY' });
    await adapter.check();
    await adapter.activate();

    expect(seen).toEqual([]);
    expect(worker.checks).toBe(0);
    expect(worker.activations).toBe(0);
  });

  it('schedules nothing in a document with no window', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: { defaultView: null } },
        { provide: SwUpdate, useValue: new FakeWorker() },
      ],
    });
    const adapter = TestBed.inject(ApplicationUpdateAdapter);
    let runs = 0;

    expect(adapter.every(1000, () => (runs += 1))()).toBeUndefined();

    // A restart nobody can make has to be reported, not swallowed: the caller
    // is waiting for a page that is not going anywhere.
    expect(adapter.reload()).toBe(false);
    expect(runs).toBe(0);
  });
});
