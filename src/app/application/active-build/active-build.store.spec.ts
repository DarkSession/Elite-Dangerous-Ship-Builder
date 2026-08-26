import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { baselineFingerprint } from '../../domain/build/build-fingerprint';
import { toBuildSnapshotV1 } from '../../domain/build/build-snapshot.serializer';
import { ActiveBuildStore } from './active-build.store';
import type { BuildCandidate } from './active-build.models';

function store(): ActiveBuildStore {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  return TestBed.inject(ActiveBuildStore);
}

function candidate(overrides: Partial<BuildCandidate> = {}): BuildCandidate {
  const loadout = ShipLoadout.default('Anaconda');
  return {
    loadout,
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId: null,
    baseline: null,
    ...overrides,
  };
}

describe('ActiveBuildStore', () => {
  it('starts with no build and nothing to lose', () => {
    const active = store();

    expect(active.loadout()).toBeNull();
    expect(active.provenance()).toBe('none');
    expect(active.dirty()).toBe(false);
    expect(active.snapshot()).toBeNull();
  });

  it('commits a candidate’s build and provenance in one write', () => {
    const active = store();
    const incoming = candidate({ provenance: 'link' });

    active.commit(incoming);

    expect(active.loadout()).toBe(incoming.loadout);
    expect(active.provenance()).toBe('link');
    expect(active.snapshot()?.shipSymbol).toBe('Anaconda');
  });

  it('treats a freshly created build as unsaved work', () => {
    const active = store();

    active.commit(candidate());

    expect(active.dirty()).toBe(true);
  });

  it('treats a build opened at its own baseline as clean', () => {
    const active = store();
    const incoming = candidate({ provenance: 'named' });

    active.commit({
      ...incoming,
      baseline: baselineFingerprint(toBuildSnapshotV1(incoming.loadout)),
    });

    expect(active.dirty()).toBe(false);
  });

  it('follows an in-place edit once the editor announces it', () => {
    const active = store();
    const incoming = candidate();
    active.commit({
      ...incoming,
      baseline: baselineFingerprint(toBuildSnapshotV1(incoming.loadout)),
    });
    expect(active.dirty()).toBe(false);

    incoming.loadout.setModuleEnabled('FrameShiftDrive', false);
    active.touch();

    expect(active.dirty()).toBe(true);
    expect(active.snapshot()?.modules.find((m) => m.slot === 'FrameShiftDrive')?.enabled).toBe(
      false,
    );
  });

  it('takes a new baseline only when the build is actually saved', () => {
    const active = store();
    active.commit(candidate());
    expect(active.dirty()).toBe(true);

    active.markSaved({ recordId: 'r1', baseRevisionId: 'v1' });

    expect(active.dirty()).toBe(false);
    expect(active.provenance()).toBe('named');
    expect(active.sourceNamed()).toEqual({ recordId: 'r1', baseRevisionId: 'v1' });
  });

  it('does not carry the previous build’s named source into the next one', () => {
    const active = store();
    active.commit(candidate());
    active.markSaved({ recordId: 'r1', baseRevisionId: 'v1' });

    active.commit(candidate({ provenance: 'link' }));

    expect(active.sourceNamed()).toBeNull();
    expect(active.link()).toEqual({ kind: 'absent' });
  });

  it('publishes the package’s own validation verdict', () => {
    const active = store();
    active.commit(candidate());

    expect(active.validation()).toEqual(ShipLoadout.default('Anaconda').validation());
  });

  it('ignores an edit announcement when there is no build', () => {
    const active = store();
    const before = active.revision();

    active.touch();

    expect(active.revision()).toBe(before);
  });

  it('records persistence and link state without touching the build', () => {
    const active = store();
    const incoming = candidate();
    active.commit(incoming);

    active.setPersistence('quota-full');
    active.setLink({ kind: 'published', fragment: 'b.abc', revision: 1 });
    active.setAutosaveRecordId('w1');

    expect(active.state()).toMatchObject({
      loadout: incoming.loadout,
      persistence: 'quota-full',
      link: { kind: 'published', fragment: 'b.abc', revision: 1 },
      autosaveRecordId: 'w1',
    });
  });

  it('clears everything about the build on an explicit discard', () => {
    const active = store();
    active.commit(candidate());

    active.clear();

    expect(active.loadout()).toBeNull();
    expect(active.provenance()).toBe('none');
    expect(active.dirty()).toBe(false);
  });

  it('reports quality completion notices as transient workflow state', () => {
    const active = store();
    active.commit(candidate());

    active.setQualityCompletionNotices([
      {
        kind: 'qualityCompleted',
        slotKey: 'FrameShiftDrive',
        moduleSymbol: 'Int_Hyperdrive_Size6_Class5',
        blueprintFdname: 'FSD_LongRange',
        previousQuality: 0.4,
        quality: 1,
      },
    ]);
    expect(active.qualityCompletionNotices()).toHaveLength(1);

    active.commit(candidate());
    expect(active.qualityCompletionNotices()).toEqual([]);
  });

  it('clears the build when the record it lives in is deleted here', () => {
    const active = store();
    active.commit(candidate({ autosaveRecordId: 'held' }));

    expect(active.clearIfHolding('held')).toBe(true);
    expect(active.loadout()).toBeNull();
    expect(active.autosaveRecordId()).toBeNull();
  });

  it('keeps the build when some other record is deleted', () => {
    const active = store();
    active.commit(candidate({ autosaveRecordId: 'held' }));

    expect(active.clearIfHolding('someone-elses')).toBe(false);
    expect(active.loadout()).not.toBeNull();
    expect(active.autosaveRecordId()).toBe('held');
  });
});
