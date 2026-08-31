import { parseSchematicMounts } from './schematic-mounts';

/**
 * What the runtime accepts as a mount extract, and what it refuses.
 *
 * The package contract is checked where the extract is made, so this suite is
 * about the other half: what arrives over the wire is this build's own output
 * for the hull and side that were asked for, and anything else is refused
 * rather than repaired.
 */

function extract(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    symbol: 'Anaconda',
    side: 'top',
    viewBox: '0 0 1200 800',
    source: 'a'.repeat(64),
    content: { x: 452.568, y: 38.401, width: 294.863, height: 723.2 },
    mounts: [
      { feature: 'hardpoint', slot: 'LargeHardpoint2', x: 570.15, y: 247.903 },
      { feature: 'utility_mount', slot: 'TinyHardpoint1', x: 600, y: 300 },
    ],
    ...overrides,
  };
}

function parse(value: unknown) {
  return parseSchematicMounts(value, 'top', 'Anaconda');
}

describe('parseSchematicMounts', () => {
  it('reads the box, the drawn rectangle and every mount', () => {
    const document = parse(extract());

    expect(document?.viewBox).toBe('0 0 1200 800');
    expect(document?.content).toEqual({ x: 452.568, y: 38.401, width: 294.863, height: 723.2 });
    expect(document?.annotations).toEqual([
      { feature: 'hardpoint', journalSlot: 'LargeHardpoint2', centre: { x: 570.15, y: 247.903 } },
      { feature: 'utility_mount', journalSlot: 'TinyHardpoint1', centre: { x: 600, y: 300 } },
    ]);
  });

  it('takes the side and symbol it was asked for, not the ones in the file', () => {
    // They have to agree, and the caller's are what the projection uses.
    const document = parse(extract());
    expect(document?.side).toBe('top');
    expect(document?.symbol).toBe('Anaconda');
  });

  it('accepts a side that annotates no mount at all', () => {
    expect(parse(extract({ mounts: [] }))?.annotations).toEqual([]);
  });

  it.each([
    ['a wrong hull', { symbol: 'Sidewinder' }],
    ['a wrong side', { side: 'bottom' }],
    ['a missing viewBox', { viewBox: undefined }],
    ['a viewBox that is not four numbers', { viewBox: '0 0 1200' }],
    ['a missing content rectangle', { content: undefined }],
    [
      'a content rectangle with a non-numeric edge',
      { content: { x: 0, y: 0, width: '5', height: 5 } },
    ],
    ['a content rectangle of no area', { content: { x: 0, y: 0, width: 0, height: 5 } }],
    ['an inside-out content rectangle', { content: { x: 0, y: 0, width: -5, height: 5 } }],
    ['a non-finite coordinate', { content: { x: Number.NaN, y: 0, width: 5, height: 5 } }],
    ['mounts that are not a list', { mounts: {} }],
    ['a mount with no slot', { mounts: [{ feature: 'hardpoint', x: 1, y: 1 }] }],
    ['a mount with no feature', { mounts: [{ slot: 'TinyHardpoint1', x: 1, y: 1 }] }],
    ['a mount with no position', { mounts: [{ feature: 'hardpoint', slot: 'TinyHardpoint1' }] }],
    [
      'a slot key that is not a word',
      { mounts: [{ feature: 'hardpoint', slot: '../../evil', x: 1, y: 1 }] },
    ],
    [
      'a feature word that is not a word',
      { mounts: [{ feature: 'a b', slot: 'TinyHardpoint1', x: 1, y: 1 }] },
    ],
  ])('refuses %s', (_name, overrides) => {
    expect(parse(extract(overrides))).toBeNull();
  });

  it.each([
    ['nothing at all', null],
    ['a bare string', 'schematic'],
    ['a list', []],
  ])('refuses %s', (_name, value) => {
    expect(parse(value)).toBeNull();
  });

  it('refuses one bad mount rather than dropping it', () => {
    // A drawing missing a mount nobody was told about is worse than a side that
    // says it could not be read: the ledger still reaches every mount it draws
    // either way, and it draws every hardpoint.
    const document = parse(
      extract({
        mounts: [
          { feature: 'hardpoint', slot: 'LargeHardpoint2', x: 570, y: 247 },
          { feature: 'hardpoint', slot: 'LargeHardpoint3', x: 'nowhere', y: 247 },
        ],
      }),
    );

    expect(document).toBeNull();
  });
});
