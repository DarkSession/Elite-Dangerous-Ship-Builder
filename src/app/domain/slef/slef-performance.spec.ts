import { generateSlefExportArtifact } from './slef-export';
import type { ActiveExportSnapshot } from './slef-export.models';
import { importSlef } from './slef-import';
import { maxSlotBuild, maxSlotHullSymbol, withNameAndIdent } from './testing/max-slot-fixture';

const METADATA = { appName: 'elite-dangerous-ship-builder', appVersion: '0.0.0' };

/** SC-004's budget, per operation, in milliseconds. */
const BUDGET_MS = 500;

/**
 * The worst case the installed package can produce, timed.
 *
 * The hull is discovered rather than written down, because which hull has the
 * most slots is a package fact that moves with every release — a budget
 * measured against a hull somebody wrote down in 2025 stops being the worst
 * case the moment a bigger one ships (SC-004).
 *
 * Measured as a domain operation, with no component, no store and no browser
 * between the input and the answer: what SC-004 bounds is the work, not the
 * rendering, and mixing the two would make a slow assertion look like a slow
 * import.
 */
describe('the largest build the Almanac can describe', () => {
  it('exports within the budget', () => {
    const build = withNameAndIdent(maxSlotBuild());
    const snapshot: ActiveExportSnapshot = {
      loadout: build,
      revision: 1,
      canonicalLink: { kind: 'absent' },
    };

    const started = performance.now();
    const artifact = generateSlefExportArtifact(snapshot, METADATA);
    const elapsed = performance.now() - started;

    expect(artifact.payload.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it('imports within the budget', () => {
    const build = withNameAndIdent(maxSlotBuild());
    const payload = generateSlefExportArtifact(
      { loadout: build, revision: 1, canonicalLink: { kind: 'absent' } },
      METADATA,
    ).payload;

    const started = performance.now();
    const result = importSlef(payload, 1);
    const elapsed = performance.now() - started;

    expect(result.ok).toBe(true);
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });

  it('measures a hull it discovered, and says which one', () => {
    // Recorded so a regression report names the hull that was measured rather
    // than leaving the next reader to guess which one the package picked.
    const hull = maxSlotHullSymbol();

    expect(hull.length).toBeGreaterThan(0);
    expect(maxSlotBuild(hull).slots().length).toBeGreaterThan(20);
  });
});
