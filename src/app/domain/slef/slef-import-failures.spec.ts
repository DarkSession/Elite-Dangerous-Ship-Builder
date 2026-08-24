import type { PartialEngineeringFailure } from '../build/build-ingress-result';
import { FIXTURE_HULL, FIXTURE_SLOTS } from '../outfitting/outfitting.fixtures';
import { classifyConstructionFailure, classifyNormalizationFailure } from './slef-import-failures';

const SOURCE = {
  slotKey: FIXTURE_SLOTS.frameShiftDrive,
  moduleSymbol: 'Int_Hyperdrive_Size6_Class5',
  blueprintFdname: 'FSD_LongRange',
  effectFdname: null,
  grade: 5,
  quality: 0.42,
} as const;

function failure(
  reason: PartialEngineeringFailure['reason'],
  code: PartialEngineeringFailure['code'] = null,
  params: PartialEngineeringFailure['params'] = null,
): PartialEngineeringFailure {
  return { source: SOURCE, reason, code, params };
}

describe('why an import was refused', () => {
  describe('construction', () => {
    it('names the exact hull identity the package does not carry', () => {
      expect(classifyConstructionFailure('Nonexistent_Hull')).toEqual({
        kind: 'unknownHull',
        sourceHull: 'Nonexistent_Hull',
      });
    });

    it('quotes the source hull rather than a tidied version of it', () => {
      const refusal = classifyConstructionFailure('  Anaconda‮  ');

      expect(refusal).toEqual({ kind: 'unknownHull', sourceHull: '  Anaconda‮  ' });
    });

    it('reports a generic construction failure for a hull the package does carry', () => {
      // The hull is fine, so whatever went wrong was not the hull. Saying
      // "unknown hull" here would name a cause that was asked about and denied.
      expect(classifyConstructionFailure(FIXTURE_HULL)).toEqual({ kind: 'construction' });
    });

    it('invents no package code, path or reason for either answer', () => {
      for (const hull of ['Nonexistent_Hull', FIXTURE_HULL]) {
        const refusal = classifyConstructionFailure(hull);

        expect(Object.keys(refusal).sort()).not.toContain('code');
        expect(Object.keys(refusal).sort()).not.toContain('diagnostics');
      }
    });
  });

  describe('normalization', () => {
    it('reports an ordinary package refusal as unsupported, keeping its code and params', () => {
      const refusal = classifyNormalizationFailure([
        failure('packageResult', 'unsupportedEngineering', { slot: SOURCE.slotKey }),
      ]);

      expect(refusal).toEqual({
        kind: 'normalizationUnsupported',
        failures: [
          {
            source: SOURCE,
            code: 'unsupportedEngineering',
            params: { slot: SOURCE.slotKey },
          },
        ],
      });
    });

    it('carries the exact source slot, article and roll the payload stated', () => {
      const refusal = classifyNormalizationFailure([failure('packageResult')]);

      expect(refusal.kind).toBe('normalizationUnsupported');
      const [only] = (refusal as { failures: readonly { source: unknown }[] }).failures;
      expect(only?.source).toEqual(SOURCE);
    });

    it('invents no code for a refusal the package gave none for', () => {
      const refusal = classifyNormalizationFailure([failure('packageResult')]);

      expect((refusal as { failures: readonly { code: unknown }[] }).failures[0]?.code).toBeNull();
    });

    it('reports an answer the released contract excludes as its own failure', () => {
      const refusal = classifyNormalizationFailure([failure('packageContract')]);

      expect(refusal.kind).toBe('packageContractFailure');
    });

    it('reports a defect ahead of an ordinary refusal when both are present', () => {
      // An answer the released contract excludes is the more serious of the
      // two, and the one worth a defect report rather than a shrug.
      expect(
        classifyNormalizationFailure([failure('packageResult'), failure('packageContract')]).kind,
      ).toBe('packageContractFailure');
    });

    it('keeps every refused roll, in order, whichever kind it reports', () => {
      const second = { ...SOURCE, slotKey: FIXTURE_SLOTS.thrusters, quality: 0.11 };
      const refusal = classifyNormalizationFailure([
        failure('packageResult', 'unsupportedEngineering'),
        { source: second, reason: 'packageContract', code: null, params: null },
      ]);

      const failures = (refusal as { failures: readonly { source: { slotKey: string } }[] })
        .failures;
      expect(failures.map((entry) => entry.source.slotKey)).toEqual([
        SOURCE.slotKey,
        FIXTURE_SLOTS.thrusters,
      ]);
    });

    it('carries no ingress reason through to the layer', () => {
      // `reason` is how the gate told the three apart; the failure kind already
      // says which one it was. Passing it on as well would put an internal
      // vocabulary in front of a Commander.
      const refusal = classifyNormalizationFailure([failure('packageContract')]);

      expect(JSON.stringify(refusal)).not.toContain('packageContract"');
    });
  });
});
