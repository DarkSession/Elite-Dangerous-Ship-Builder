import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SHIPS, getShipSlots } from '@elite-dangerous-almanac/core/ships/ships';
import { enumerateSlots } from '@elite-dangerous-almanac/core/ships/slots';
import { parseSchematic } from '../../../platform/assets/schematic-svg-parser';
import { MOUNT_FEATURE_OF, SCHEMATIC_SIDES } from './anatomy-model';

/**
 * What the installed Almanac's hull schematics actually contain, written down.
 *
 * This suite tests the *package*, over every hull it ships, and it is the whole
 * of the anatomy audit: the real parser reads the real files, so the promise
 * being characterized and the code relying on it can never drift apart the way
 * a second validator written in a build script would. Nothing here runs in a
 * browser — `scripts/extract-schematic-mounts.mts` runs this same parser over
 * the same files and writes what a plate reads, so this is a characterization
 * of the input to the build rather than of anything a Commander fetches.
 *
 * It asserts no catalogue counts. How many hulls the package ships and how many
 * mounts each one has are the package's business; what is asserted is that
 * *every* one of them is complete, which is a property that stays true as the
 * catalogue grows (tasks, T007).
 */

/**
 * The installed package's asset root, from the repository the runner started in.
 *
 * Resolved off the working directory rather than off `import.meta.url`: the
 * suite is bundled before it runs, so its own module URL is not a file path.
 */
const ASSET_ROOT = resolve(
  process.cwd(),
  'node_modules/@elite-dangerous-almanac/core/assets/ships',
);

/**
 * One side's file, or the empty string when the package does not ship it.
 *
 * Never throws. A hull with no schematic is exactly what the first test below
 * is for, and a read that threw here would happen during collection and take
 * the whole file down without naming the hull.
 */
function readSchematic(symbol: string, side: string): string {
  try {
    return readFileSync(`${ASSET_ROOT}/${symbol}/schematic-${side}.svg`, 'utf8');
  } catch {
    return '';
  }
}

/** Every hull, both sides, read once. */
const documents = SHIPS.map((ship) => ({
  symbol: ship.symbol,
  slots: enumerateSlots(getShipSlots(ship.symbol)!),
  sides: SCHEMATIC_SIDES.map((side) => ({ side, source: readSchematic(ship.symbol, side) })),
}));

describe('installed Almanac hull schematics', () => {
  it('ships a top and a bottom schematic for every catalogued hull', () => {
    for (const hull of documents) {
      for (const { side, source } of hull.sides) {
        expect(source.length, `${hull.symbol}/${side}`).toBeGreaterThan(0);
      }
    }
  });

  it('carries only static drawing the safe parser accepts', () => {
    const refused = documents.flatMap((hull) =>
      hull.sides
        .filter(({ side, source }) => parseSchematic(source, side, hull.symbol) === null)
        .map(({ side }) => `${hull.symbol}/${side}`),
    );

    expect(refused).toEqual([]);
  });

  it('annotates every mount feature with an exact journal slot of the matching kind', () => {
    const wrong: string[] = [];

    for (const hull of documents) {
      const kindOf = new Map(hull.slots.map((slot) => [slot.key, slot.kind]));

      for (const { side, source } of hull.sides) {
        const document = parseSchematic(source, side, hull.symbol);
        for (const annotation of document?.annotations ?? []) {
          const kind = kindOf.get(annotation.journalSlot);
          const expected = kind === undefined ? undefined : MOUNT_FEATURE_OF[kind as never];
          if (expected !== annotation.feature) {
            wrong.push(`${hull.symbol}/${side}/${annotation.journalSlot}=${annotation.feature}`);
          }
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  it('draws each annotated slot at most once per side', () => {
    const duplicated: string[] = [];

    for (const hull of documents) {
      for (const { side, source } of hull.sides) {
        const seen = new Set<string>();
        for (const annotation of parseSchematic(source, side, hull.symbol)?.annotations ?? []) {
          if (seen.has(annotation.journalSlot)) {
            duplicated.push(`${hull.symbol}/${side}/${annotation.journalSlot}`);
          }
          seen.add(annotation.journalSlot);
        }
      }
    }

    expect(duplicated).toEqual([]);
  });

  it('draws every hardpoint and utility the hull has on at least one side', () => {
    const missing: string[] = [];

    for (const hull of documents) {
      const drawn = new Set(
        hull.sides.flatMap(
          ({ side, source }) =>
            parseSchematic(source, side, hull.symbol)?.annotations.map(
              (annotation) => annotation.journalSlot,
            ) ?? [],
        ),
      );

      for (const slot of hull.slots) {
        if ((slot.kind === 'hardpoint' || slot.kind === 'utility') && !drawn.has(slot.key)) {
          missing.push(`${hull.symbol}/${slot.key}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it('repeats a slot across sides rather than within one, and keeps both drawings', () => {
    const repeated = documents.flatMap((hull) => {
      const perSide = hull.sides.map(
        ({ side, source }) =>
          new Set(
            parseSchematic(source, side, hull.symbol)?.annotations.map((a) => a.journalSlot) ?? [],
          ),
      );
      return [...perSide[0]]
        .filter((key) => perSide[1].has(key))
        .map((key) => `${hull.symbol}/${key}`);
    });

    // Not a fixed list — the package may draw more of them — but the two the
    // projection suite pins as cross-side identities have to be among them, or
    // that suite is asserting against geometry the package no longer ships.
    expect(repeated).toContain('Federation_Corvette/MediumHardpoint1');
    expect(repeated).toContain('Federation_Corvette/MediumHardpoint2');
    expect(repeated).toContain('MediumTransport01/MediumHardpoint1');
  });

  it('never annotates a core, optional, armour or cargo-hatch slot', () => {
    const invented: string[] = [];

    for (const hull of documents) {
      const kindOf = new Map(hull.slots.map((slot) => [slot.key, slot.kind]));
      for (const { side, source } of hull.sides) {
        for (const annotation of parseSchematic(source, side, hull.symbol)?.annotations ?? []) {
          const kind = kindOf.get(annotation.journalSlot);
          if (kind !== 'hardpoint' && kind !== 'utility') {
            invented.push(`${hull.symbol}/${side}/${annotation.journalSlot}`);
          }
        }
      }
    }

    expect(invented).toEqual([]);
  });
});
