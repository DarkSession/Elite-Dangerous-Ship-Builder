import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { makeFullyEngineeredAnaconda, minimalState } from './build-link-codec.spec-helpers';
import { createBuildLinkCodec } from './build-link-codec';
import type { BuildLinkSymbolModels } from './build-link-codec';
import codecTable1 from './codec-table-1.json';
import realisticEngineeredCorvette from './realistic-engineered-corvette.fixture.json';

/**
 * Table 1 carries the symbol models the generator pins alongside its catalogue. The boolean and
 * power skews are defensible priors for real builds (grades are usually maximal, engineered
 * modules usually carry an experimental effect, identities are almost always contextual,
 * explicit enabled states are usually `on`). Names get English-like character weights while
 * idents get callsign-like ones (uppercase, digits, dash). Back-reference indexes use per-run
 * adaptive contexts, so a record or module referenced repeatedly within one build gets cheaper
 * as the stream progresses; candidate-set literals stay static because the grammar's own
 * back-referencing leaves them repetition-poor. The static context-index decay is pinned
 * uniform: the candidate sets are catalogue-ordered, which carries no popularity signal
 * (measured decays help one reference build and hurt another), so a table with usage data
 * behind it would pin popularity-ordered sets or per-set weights instead of one decay.
 */
const shippedModels: BuildLinkSymbolModels = codecTable1.MODELS;
const modelledCodec = createBuildLinkCodec(1, codecTable1);
/**
 * The models' own effect is measured against the same table without its models block. Bit
 * packing ignores models entirely, so the unmodelled codec reproduces every packed body — and
 * with it every empty and stock reference — byte for byte.
 */
const { MODELS: _strippedForBaseline, ...unmodelledTable } = codecTable1;
const baselineCodec = createBuildLinkCodec(1, unmodelledTable);

describe('build-link codec pinned symbol models', () => {
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

  it('freezes the reference corpus literals in the encode direction', () => {
    // Freeze before release; once table 1 ships, never regenerate these fixtures to make a
    // build pass. The decode direction and canonical reserialization are covered by the
    // round-trip test above.
    const fragments = referenceCorpus().map(({ source }) =>
      modelledCodec.encodeBuildLinkFragment(source),
    );

    expect(fragments).toEqual([
      'b.1S..A@YX6Cjy!R',
      'b.vz,jdQ_4',
      'b.Fe22sXs1VYx8!NVMtCk!psrGUkIV-ECpUjGE0xXgXOFkqJ25PNA@tSqnpD8XpmV70,ONRNW',
      'b.6lNEFSYnYR0i,rdWhJz8H7mFTPR@@DRYR3SD6cWNd1A4!PTC4.,JMc/y1Uhh9M_uk5yKmUPRDlI/iyfgDRolLhJF/v!4SUos',
      'b.7yvr6:PyEpDGgEs9aI:gxA@uHybdm4IM',
    ]);
  });

  it('never lengthens a reference link and shrinks the engineered references', () => {
    const rows = referenceCorpus().map(({ label, source }) => {
      const baselineLength = baselineCodec.encodeBuildLinkFragment(source).length;
      const modelledLength = modelledCodec.encodeBuildLinkFragment(source).length;
      return { label, baselineLength, modelledLength };
    });
    // Both columns are pinned because `docs/build-link-codec.md` publishes them as the models'
    // measured effect. A runner shows no console output for a passing spec, so a printed table
    // would let either column drift unnoticed; an assertion cannot.
    expect(rows).toEqual([
      { label: 'empty Sidewinder', baselineLength: 16, modelledLength: 16 },
      { label: 'stock Krait Mk II', baselineLength: 10, modelledLength: 10 },
      { label: 'engineered Anaconda', baselineLength: 85, modelledLength: 73 },
      { label: 'supplied engineered Corvette', baselineLength: 110, modelledLength: 98 },
      { label: 'named stock Krait Mk II', baselineLength: 38, modelledLength: 34 },
    ]);

    for (const { label, baselineLength, modelledLength } of rows) {
      expect(modelledLength, label).toBeLessThanOrEqual(baselineLength);
    }
    for (const engineered of ['engineered Anaconda', 'supplied engineered Corvette']) {
      const row = rows.find(({ label }) => label === engineered)!;
      expect(row.modelledLength, engineered).toBeLessThan(row.baselineLength);
    }
  });

  it('spells every empty and stock hull link identically with and without models', () => {
    // Every empty and stock hull keeps its packed rendering, and bit packing ignores models, so
    // the two tables must agree character for character. That is stricter than merely never
    // lengthening, and it is the claim the codec document makes.
    let longest = 0;
    for (const { symbol } of SHIPS) {
      for (const source of [ShipLoadout.empty(symbol), ShipLoadout.default(symbol)]) {
        const modelledFragment = modelledCodec.encodeBuildLinkFragment(source);
        longest = Math.max(longest, modelledFragment.length);
        expect(modelledFragment, symbol).toBe(baselineCodec.encodeBuildLinkFragment(source));
      }
    }
    expect(longest).toBe(18);
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
    const decayCodec = createBuildLinkCodec(1, {
      ...codecTable1,
      MODELS: { ...shippedModels, CONTEXT_INDEX_DECAY: [63, 64] },
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
    const staticCodec = createBuildLinkCodec(1, {
      ...codecTable1,
      MODELS: { ...shippedModels, CONTEXT_ADAPTATION: 0 },
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
      createBuildLinkCodec(1, {
        ...codecTable1,
        MODELS: models as BuildLinkSymbolModels,
      });
    const expectedError = 'The build-link codec table models are invalid.';

    expect(withModels({ ...shippedModels, GRADE_IS_MAX: [0, 1] })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, GRADE_IS_MAX: [1] })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, GRADE_IS_MAX: [1, 1.5] })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, GRADE_IS_MAX: [2 ** 24, 1] })).toThrowError(
      expectedError,
    );
    expect(withModels({ ...shippedModels, POWER_ON: [1, 1] })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, CONTEXT_INDEX_DECAY: [2, 1] })).toThrowError(
      expectedError,
    );
    expect(withModels({ ...shippedModels, CONTEXT_INDEX_DECAY: [1, 128] })).toThrowError(
      expectedError,
    );
    expect(withModels({ ...shippedModels, CONTEXT_INDEX_DECAY: [1] })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, CONTEXT_ADAPTATION: -1 })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, CONTEXT_ADAPTATION: 1.5 })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, CONTEXT_ADAPTATION: 2 ** 17 })).toThrowError(
      expectedError,
    );
    expect(withModels({ ...shippedModels, NAME_CHARACTERS: [1] })).toThrowError(expectedError);
    expect(withModels({ ...shippedModels, IDENT_CHARACTERS: [1] })).toThrowError(expectedError);
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
