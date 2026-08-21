import { TestBed } from '@angular/core/testing';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { ArtworkCoordinator } from './artwork.coordinator';

/** A connectivity adapter a test can drive. */
class FakeConnectivity {
  readonly #listeners: (() => void)[] = [];

  onOnline(listener: () => void): () => void {
    this.#listeners.push(listener);
    return () => {};
  }

  goOnline(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}

function setup(): { coordinator: ArtworkCoordinator; connectivity: FakeConnectivity } {
  const connectivity = new FakeConnectivity();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: ConnectivityAdapter, useValue: connectivity }],
  });
  return { coordinator: TestBed.inject(ArtworkCoordinator), connectivity };
}

describe('ArtworkCoordinator', () => {
  it('treats an illustration it has not seen as still loading', () => {
    const { coordinator } = setup();

    expect(coordinator.stateOf('Anaconda')).toBe('loading');
  });

  it('records what happened to each illustration separately', () => {
    const { coordinator } = setup();

    coordinator.markAvailable('Anaconda');
    coordinator.markUnavailable('Adder');

    expect(coordinator.stateOf('Anaconda')).toBe('available');
    expect(coordinator.stateOf('Adder')).toBe('temporarily-unavailable');
  });

  it('retries the failed illustrations when connectivity returns', () => {
    const { coordinator, connectivity } = setup();
    coordinator.markAvailable('Anaconda');
    coordinator.markUnavailable('Adder');
    const before = coordinator.attempt();

    connectivity.goOnline();

    expect(coordinator.stateOf('Adder')).toBe('loading');
    expect(coordinator.attempt()).toBe(before + 1);
    // An illustration that already arrived is not fetched again.
    expect(coordinator.stateOf('Anaconda')).toBe('available');
  });

  it('does nothing when connectivity returns and nothing had failed', () => {
    const { coordinator, connectivity } = setup();
    coordinator.markAvailable('Anaconda');
    const before = coordinator.attempt();

    connectivity.goOnline();

    expect(coordinator.attempt()).toBe(before);
  });

  it('retries on request as well as on the browser’s own signal', () => {
    const { coordinator } = setup();
    coordinator.markUnavailable('Adder');

    coordinator.retryUnavailable();

    expect(coordinator.stateOf('Adder')).toBe('loading');
    expect(coordinator.attempt()).toBe(1);
  });

  it('does not republish an unchanged state', () => {
    const { coordinator } = setup();
    coordinator.markAvailable('Anaconda');
    const states = coordinator.states();

    coordinator.markAvailable('Anaconda');

    expect(coordinator.states()).toBe(states);
  });

  it('can return to loading before a fresh attempt', () => {
    const { coordinator } = setup();
    coordinator.markUnavailable('Adder');

    coordinator.markLoading('Adder');

    expect(coordinator.stateOf('Adder')).toBe('loading');
  });
});
