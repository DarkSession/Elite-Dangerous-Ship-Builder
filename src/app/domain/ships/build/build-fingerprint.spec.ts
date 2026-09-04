import { baselineFingerprint, isDirty } from './build-fingerprint';
import type { BuildSnapshotV1 } from './build-snapshot';

function snapshot(overrides: Partial<BuildSnapshotV1> = {}): BuildSnapshotV1 {
  return {
    format: 'ednb.build',
    version: 1,
    shipSymbol: 'Anaconda',
    shipName: null,
    shipIdent: null,
    modules: [],
    ...overrides,
  };
}

describe('baseline fingerprint', () => {
  it('is equal for equal modelled state', () => {
    expect(baselineFingerprint(snapshot())).toBe(baselineFingerprint(snapshot()));
  });

  it('changes when a modelled field changes', () => {
    expect(baselineFingerprint(snapshot({ shipName: 'Gimel' }))).not.toBe(
      baselineFingerprint(snapshot()),
    );
  });

  it('changes when a module is fitted', () => {
    const fitted = snapshot({
      modules: [
        {
          slot: 'PowerPlant',
          symbol: 'Int_PowerPlant_Size8_Class5',
          enabled: null,
          priority: null,
          preEngineered: null,
          engineering: null,
        },
      ],
    });

    expect(baselineFingerprint(fitted)).not.toBe(baselineFingerprint(snapshot()));
  });
});

describe('dirty state', () => {
  it('treats a build with no baseline as unsaved work', () => {
    expect(isDirty(baselineFingerprint(snapshot()), null)).toBe(true);
  });

  it('is clean while the build equals its baseline', () => {
    const fingerprint = baselineFingerprint(snapshot());

    expect(isDirty(fingerprint, fingerprint)).toBe(false);
  });

  it('is dirty once the build diverges from its baseline', () => {
    const baseline = baselineFingerprint(snapshot());

    expect(isDirty(baselineFingerprint(snapshot({ shipIdent: 'AC-01' })), baseline)).toBe(true);
  });

  it('has nothing to lose when there is no build at all', () => {
    expect(isDirty(null, null)).toBe(false);
    expect(isDirty(null, 'anything')).toBe(false);
  });
});
