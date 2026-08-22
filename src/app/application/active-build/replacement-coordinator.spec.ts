import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { baselineFingerprint } from '../../domain/build/replacement-policy';
import { ActiveBuildStore } from './active-build.store';
import type { BuildCandidate } from './active-build.models';
import { ReplacementCoordinator, type CandidateOutcome } from './replacement-coordinator';

function setup(): { store: ActiveBuildStore; coordinator: ReplacementCoordinator } {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return {
    store: TestBed.inject(ActiveBuildStore),
    coordinator: TestBed.inject(ReplacementCoordinator),
  };
}

function candidateFor(symbol: string, saved = false): BuildCandidate {
  const loadout = ShipLoadout.default(symbol);
  return {
    loadout,
    hullName: symbol,
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    baseline: saved ? baselineFingerprint(toBuildSnapshotV1(loadout)) : null,
  };
}

const succeeds =
  (symbol: string, saved = false) =>
  (): CandidateOutcome => ({
    ok: true,
    candidate: candidateFor(symbol, saved),
  });

describe('ReplacementCoordinator', () => {
  it('commits when there is no unsaved work to lose', async () => {
    const { store, coordinator } = setup();

    const result = await coordinator.replace(succeeds('SideWinder'));

    expect(result.kind).toBe('committed');
    expect(store.loadout()?.shipSymbol).toBe('SideWinder');
  });

  it('asks before replacing unsaved work, and cancelling changes nothing', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder'));
    expect(store.dirty()).toBe(true);

    const asked: string[] = [];
    coordinator.setConfirmer(async (question) => {
      asked.push(`${question.currentHull}->${question.incomingHull}`);
      return false;
    });

    const result = await coordinator.replace(succeeds('Anaconda'));

    expect(asked).toEqual(['SideWinder->Anaconda']);
    expect(result.kind).toBe('cancelled');
    expect(store.loadout()?.shipSymbol).toBe('SideWinder');
  });

  it('commits once the Commander confirms', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder'));
    coordinator.setConfirmer(async () => true);

    await coordinator.replace(succeeds('Anaconda'));

    expect(store.loadout()?.shipSymbol).toBe('Anaconda');
  });

  it('does not ask when the current build is saved', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder', true));
    expect(store.dirty()).toBe(false);

    let asked = 0;
    coordinator.setConfirmer(async () => {
      asked += 1;
      return true;
    });
    await coordinator.replace(succeeds('Anaconda'));

    expect(asked).toBe(0);
    expect(store.loadout()?.shipSymbol).toBe('Anaconda');
  });

  it('refuses to replace unsaved work when nobody can ask', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder'));

    const result = await coordinator.replace(succeeds('Anaconda'));

    expect(result.kind).toBe('cancelled');
    expect(store.loadout()?.shipSymbol).toBe('SideWinder');
  });

  it('leaves active state untouched when construction fails', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder', true));

    const result = await coordinator.replace(() => ({ ok: false, reason: 'unknown hull' }));

    expect(result).toEqual({ kind: 'failed', reason: 'unknown hull' });
    expect(store.loadout()?.shipSymbol).toBe('SideWinder');
  });

  it('leaves active state untouched when construction throws', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder', true));

    const result = await coordinator.replace(() => {
      throw new Error('the package refused');
    });

    expect(result).toMatchObject({ kind: 'failed', reason: 'the package refused' });
    expect(store.loadout()?.shipSymbol).toBe('SideWinder');
  });

  it('discards a candidate a newer request has already superseded', async () => {
    const { store, coordinator } = setup();
    let release: (() => void) | null = null;
    const slow = new Promise<void>((resolve) => (release = resolve));

    const first = coordinator.replace(async () => {
      await slow;
      return { ok: true, candidate: candidateFor('SideWinder') };
    });
    const second = await coordinator.replace(succeeds('Anaconda'));
    release!();

    expect(await first).toEqual({ kind: 'superseded' });
    expect(second.kind).toBe('committed');
    expect(store.loadout()?.shipSymbol).toBe('Anaconda');
  });

  it('discards a confirmed replacement a newer request has superseded', async () => {
    const { store, coordinator } = setup();
    await coordinator.replace(succeeds('SideWinder'));

    let answer: ((replace: boolean) => void) | null = null;
    coordinator.setConfirmer(() => new Promise<boolean>((resolve) => (answer = resolve)));

    const first = coordinator.replace(succeeds('Anaconda'));
    await Promise.resolve();
    coordinator.setConfirmer(async () => true);
    const second = await coordinator.replace(succeeds('Python'));
    answer!(true);

    expect(await first).toEqual({ kind: 'superseded' });
    expect(second.kind).toBe('committed');
    expect(store.loadout()?.shipSymbol).toBe('Python');
  });

  it('runs every registered sink after a commit, and none after a refusal', async () => {
    const { coordinator } = setup();
    const committed: string[] = [];
    const unregister = coordinator.addSink({
      onCommitted: (candidate) => committed.push(candidate.loadout.shipSymbol),
    });

    await coordinator.replace(succeeds('SideWinder', true));
    await coordinator.replace(() => ({ ok: false, reason: 'no' }));
    expect(committed).toEqual(['SideWinder']);

    unregister();
    await coordinator.replace(succeeds('Anaconda'));
    expect(committed).toEqual(['SideWinder']);
  });
});
