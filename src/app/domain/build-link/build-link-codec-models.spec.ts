import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { makeFullyEngineeredAnaconda, minimalState } from './build-link-codec.spec-helpers';
import { createBuildLinkCodec } from './build-link-codec';
import type { BuildLinkSymbolModels } from './build-link-codec';
import codecTable1 from './codec-table-1.json';
import realisticEngineeredCorvette from './realistic-engineered-corvette.fixture.json';

/**
 * Proof-of-concept model weights. The boolean and power skews are defensible priors for real
 * builds (grades are usually maximal, engineered modules usually carry an experimental effect,
 * identities are almost always contextual, explicit enabled states are usually `on`). Names get
 * English-like character weights while idents get callsign-like ones (uppercase, digits, dash).
 * Back-reference indexes use per-run adaptive contexts, so a record or module referenced
 * repeatedly within one build gets cheaper as the stream progresses; candidate-set literals stay
 * static because the grammar's own back-referencing leaves them repetition-poor. The static
 * context-index decay is pinned uniform: table 1's candidate sets are catalogue-ordered, which
 * carries no popularity signal (measured decays help one reference build and hurt another), so a
 * production table would pin popularity-ordered sets or per-set weights instead of one decay.
 */
const POC_MODELS: BuildLinkSymbolModels = {
  GRADE_IS_MAX: [1, 7],
  EXPERIMENTAL_PRESENT: [1, 3],
  CONTEXT_HIT: [1, 31],
  POWER_ON: [2, 1, 5],
  POWER_PRIORITY: [4, 4, 8, 5, 3, 2],
  CONTEXT_INDEX_DECAY: [1, 1],
  CONTEXT_ADAPTATION: 8,
  NAME_CHARACTERS: [
    // A-Z
    41, 8, 14, 22, 64, 11, 10, 31, 35, 2, 4, 20, 12, 34, 38, 10, 2, 30, 32, 46, 14, 5, 12, 2, 10, 2,
    // a-z
    82, 15, 28, 43, 127, 22, 20, 61, 70, 2, 8, 40, 24, 67, 75, 19, 1, 60, 63, 91, 28, 10, 24, 2, 20,
    1,
    // 0-9
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
    // space, dash
    40, 12,
  ],
  IDENT_CHARACTERS: [
    // A-Z
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30, 30,
    // a-z
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    // 0-9
    40, 40, 40, 40, 40, 40, 40, 40, 40, 40,
    // space, dash
    2, 60,
  ],
};

const modelledTable = {
  ...codecTable1,
  $generated: { ...codecTable1.$generated, tableVersion: 2 },
  MODELS: POC_MODELS,
};
const table1Codec = createBuildLinkCodec(1, codecTable1);
const modelledCodec = createBuildLinkCodec(2, modelledTable);
/**
 * The models' own effect is measured against the same table without models. Comparing against
 * table 1 directly would fold in an unrelated ±1-character artifact: the version value changes
 * the payload bytes and the CRC, which can move the Base70 digit count on its own.
 */
const baselineCodec = createBuildLinkCodec(2, {
  ...codecTable1,
  $generated: { ...codecTable1.$generated, tableVersion: 2 },
});

describe('build-link codec pinned symbol models (proof of concept)', () => {
  it('round-trips the reference corpus canonically under the modelled table', () => {
    for (const { label, source, assumeFullQuality } of referenceCorpus()) {
      const fragment = modelledCodec.encodeBuildLinkFragment(source);
      const decoded = modelledCodec.decodeBuildLinkFragment(fragment);

      expect(minimalState(decoded), label).toEqual(minimalState(source, assumeFullQuality));
      expect(modelledCodec.encodeBuildLinkFragment(decoded), label).toBe(fragment);
    }
  });

  it('round-trips empty and stock configurations for every pinned hull', () => {
    for (const { symbol } of SHIPS) {
      for (const source of [ShipLoadout.empty(symbol), ShipLoadout.default(symbol)]) {
        const fragment = modelledCodec.encodeBuildLinkFragment(source);

        expect(minimalState(modelledCodec.decodeBuildLinkFragment(fragment))).toEqual(
          minimalState(source),
        );
      }
    }
  });

  it('never lengthens a reference link and shrinks the engineered references', () => {
    const rows = referenceCorpus().map(({ label, source }) => {
      const table1Length = table1Codec.encodeBuildLinkFragment(source).length;
      const baselineLength = baselineCodec.encodeBuildLinkFragment(source).length;
      const modelledLength = modelledCodec.encodeBuildLinkFragment(source).length;
      return { label, table1Length, baselineLength, modelledLength };
    });
    console.info(
      ['POC symbol-model link lengths (characters, including the b. prefix):']
        .concat(
          rows.map(
            ({ label, table1Length, baselineLength, modelledLength }) =>
              `  ${label}: table 1 ${table1Length}, unmodelled ${baselineLength} -> ` +
              `modelled ${modelledLength}`,
          ),
        )
        .join('\n'),
    );

    for (const { label, baselineLength, modelledLength } of rows) {
      expect(modelledLength, label).toBeLessThanOrEqual(baselineLength);
    }
    for (const engineered of ['engineered Anaconda', 'supplied engineered Corvette']) {
      const row = rows.find(({ label }) => label === engineered)!;
      expect(row.modelledLength, engineered).toBeLessThan(row.baselineLength);
      expect(row.modelledLength, engineered).toBeLessThan(row.table1Length);
    }
  });

  it('never lengthens any empty or stock hull link', () => {
    for (const { symbol } of SHIPS) {
      for (const source of [ShipLoadout.empty(symbol), ShipLoadout.default(symbol)]) {
        expect(modelledCodec.encodeBuildLinkFragment(source).length, symbol).toBeLessThanOrEqual(
          baselineCodec.encodeBuildLinkFragment(source).length,
        );
      }
    }
  });

  it('shrinks compact metadata under the character model', () => {
    const named = makeNamedBuild('Interstellar Explorer', 'IX-01');

    const baselineFragment = baselineCodec.encodeBuildLinkFragment(named);
    const modelledFragment = modelledCodec.encodeBuildLinkFragment(named);

    expect(modelledFragment.length).toBeLessThan(baselineFragment.length);
    const decoded = modelledCodec.decodeBuildLinkFragment(modelledFragment);
    expect(decoded.shipName).toBe('Interstellar Explorer');
    expect(decoded.shipIdent).toBe('IX-01');
  });

  it('round-trips fallback UTF-8 metadata, which the character model does not touch', () => {
    const named = makeNamedBuild('Astraea 星', 'TST-42');

    const decoded = modelledCodec.decodeBuildLinkFragment(
      modelledCodec.encodeBuildLinkFragment(named),
    );

    expect(decoded.shipName).toBe('Astraea 星');
    expect(decoded.shipIdent).toBe('TST-42');
  });

  it('round-trips canonically under a non-uniform context-index decay', () => {
    // The decay models candidate-set positions and composes with the reference-stream
    // adaptation; both are active here.
    const decayCodec = createBuildLinkCodec(2, {
      ...modelledTable,
      MODELS: { ...POC_MODELS, CONTEXT_INDEX_DECAY: [63, 64] },
    });
    const source = makeFullyEngineeredAnaconda();

    const fragment = decayCodec.encodeBuildLinkFragment(source);
    const decoded = decayCodec.decodeBuildLinkFragment(fragment);

    expect(minimalState(decoded)).toEqual(minimalState(source));
    expect(decayCodec.encodeBuildLinkFragment(decoded)).toBe(fragment);
  });

  it('adaptation cheapens repetition-heavy builds beyond the static priors', () => {
    // The Anaconda reference repeats a handful of engineering records across many mounts, so its
    // back-reference stream is where adaptation pays. The Corvette's references are diverse and
    // must not regress; the corpus test above holds it at the static-prior length.
    const staticCodec = createBuildLinkCodec(2, {
      ...modelledTable,
      MODELS: { ...POC_MODELS, CONTEXT_ADAPTATION: 0 },
    });
    const anaconda = makeFullyEngineeredAnaconda();

    const adaptiveFragment = modelledCodec.encodeBuildLinkFragment(anaconda);

    expect(adaptiveFragment.length).toBeLessThan(
      staticCodec.encodeBuildLinkFragment(anaconda).length,
    );
    const decoded = modelledCodec.decodeBuildLinkFragment(adaptiveFragment);
    expect(minimalState(decoded)).toEqual(minimalState(anaconda));
    expect(modelledCodec.encodeBuildLinkFragment(decoded)).toBe(adaptiveFragment);
  });

  it('shrinks a callsign ident under the ident character model', () => {
    // A short ident like TST-42 saves a handful of bits, which byte padding can absorb; the
    // bound-length callsign makes the model's saving visible in whole characters.
    const named = makeNamedBuild(null, 'REG-0042-ALPHA-NINER-XRAY-04-TST');

    const baselineFragment = baselineCodec.encodeBuildLinkFragment(named);
    const modelledFragment = modelledCodec.encodeBuildLinkFragment(named);

    expect(modelledFragment.length).toBeLessThan(baselineFragment.length);
    const decoded = modelledCodec.decodeBuildLinkFragment(modelledFragment);
    expect(decoded.shipName).toBeNull();
    expect(decoded.shipIdent).toBe('REG-0042-ALPHA-NINER-XRAY-04-TST');
    const shortIdent = makeNamedBuild(null, 'TST-42');
    expect(modelledCodec.encodeBuildLinkFragment(shortIdent).length).toBeLessThanOrEqual(
      baselineCodec.encodeBuildLinkFragment(shortIdent).length,
    );
  });

  it('rejects malformed model weight tables', () => {
    const withModels = (models: unknown) => () =>
      createBuildLinkCodec(2, {
        ...modelledTable,
        MODELS: models as BuildLinkSymbolModels,
      });
    const expectedError = 'The build-link codec table models are invalid.';

    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [0, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [1, 1.5] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, GRADE_IS_MAX: [2 ** 24, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, POWER_ON: [1, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_INDEX_DECAY: [2, 1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_INDEX_DECAY: [1, 128] })).toThrowError(
      expectedError,
    );
    expect(withModels({ ...POC_MODELS, CONTEXT_INDEX_DECAY: [1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_ADAPTATION: -1 })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_ADAPTATION: 1.5 })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, CONTEXT_ADAPTATION: 2 ** 17 })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, NAME_CHARACTERS: [1] })).toThrowError(expectedError);
    expect(withModels({ ...POC_MODELS, IDENT_CHARACTERS: [1] })).toThrowError(expectedError);
  });
});

type CorpusEntry = {
  readonly label: string;
  readonly source: ShipLoadout;
  readonly assumeFullQuality?: boolean;
};

function referenceCorpus(): readonly CorpusEntry[] {
  return [
    { label: 'empty Sidewinder', source: ShipLoadout.empty('SideWinder') },
    { label: 'stock Krait Mk II', source: ShipLoadout.default('Krait_MkII') },
    { label: 'engineered Anaconda', source: makeFullyEngineeredAnaconda() },
    {
      label: 'supplied engineered Corvette',
      source: ShipLoadout.fromSlef(
        realisticEngineeredCorvette as Parameters<typeof ShipLoadout.fromSlef>[0],
      ),
      assumeFullQuality: true,
    },
    {
      label: 'named stock Krait Mk II',
      source: makeNamedBuild('Interstellar Explorer', 'IX-01'),
    },
  ];
}

function makeNamedBuild(name: string | null, ident: string): ShipLoadout {
  const stock = ShipLoadout.default('Krait_MkII').toLoadoutEvent({ moduleOrder: 'slots' });
  return ShipLoadout.fromLoadout({
    ...stock,
    ...(name === null ? {} : { ShipName: name }),
    ShipIdent: ident,
  });
}
