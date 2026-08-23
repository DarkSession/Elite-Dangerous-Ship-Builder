import type { SlotView } from '../../application/outfitting/slot-view';
import type { SchematicDocument, SchematicSide, SideAssetState } from './anatomy-model';
import { projectAnatomy, type SideStates } from './anatomy-projector';

/**
 * What the projection admits, what it refuses and what it never removes.
 *
 * The inputs are hand-built rather than taken from a real hull: every case here
 * is a *disagreement* between the build and the artwork, and the installed
 * package has none of them — that is what the anatomy contract suite asserts.
 * These are the answers for the release that eventually does.
 */

function slot(partial: Partial<SlotView> & Pick<SlotView, 'key' | 'kind'>): SlotView {
  return {
    canonicalName: partial.key,
    displayName: { text: partial.key, untranslated: false },
    size: null,
    restriction: null,
    restrictionText: null,
    module: null,
    removable: true,
    immovableReason: null,
    node: 1,
    ...partial,
  } as SlotView;
}

function fitted(engineering: unknown = null): SlotView['module'] {
  return { symbol: 'Hpt_Example', engineering } as unknown as SlotView['module'];
}

function document(
  side: SchematicSide,
  annotations: { feature: string; journalSlot: string }[],
): SchematicDocument {
  return {
    side,
    symbol: 'Anaconda',
    viewBox: '0 0 10 10',
    content: { x: 0, y: 0, width: 10, height: 10 },
    annotations: annotations.map((annotation) => ({
      ...annotation,
      centre: { x: 5, y: 5 },
    })),
  };
}

function ready(document: SchematicDocument): SideAssetState {
  return { kind: 'ready', document };
}

const PENDING: SideStates = { top: { kind: 'loading' }, bottom: { kind: 'loading' } };

const SLOTS = [
  slot({ key: 'LargeHardpoint1', kind: 'hardpoint' }),
  slot({ key: 'TinyHardpoint1', kind: 'hardpoint', module: fitted() }),
  slot({ key: 'Slot01_Size6', kind: 'optional' }),
  slot({ key: 'PowerPlant', kind: 'core' }),
  slot({ key: 'TinyHardpoint2', kind: 'utility', module: fitted({ blueprint: 'x' }) }),
];

describe('projectAnatomy', () => {
  describe('what exists', () => {
    it('creates one item per package hardpoint and utility, in package order', () => {
      const { items } = projectAnatomy(SLOTS, PENDING);

      expect(items.map((item) => item.key)).toEqual([
        'LargeHardpoint1',
        'TinyHardpoint1',
        'TinyHardpoint2',
      ]);
    });

    it('creates no item for a core, optional, armour or cargo-hatch slot', () => {
      const { items } = projectAnatomy(SLOTS, PENDING);

      expect(items.map((item) => item.key)).not.toContain('Slot01_Size6');
      expect(items.map((item) => item.key)).not.toContain('PowerPlant');
    });

    it('keeps the package kind, so a utility is never presented as a hardpoint', () => {
      const { items } = projectAnatomy(SLOTS, PENDING);

      expect(items.find((item) => item.key === 'TinyHardpoint2')?.kind).toBe('utility');
    });

    it('states fitted and engineered from the same revision the ledger read', () => {
      const { items } = projectAnatomy(SLOTS, PENDING);

      expect(items.map((item) => [item.key, item.fitted, item.engineered])).toEqual([
        ['LargeHardpoint1', false, false],
        ['TinyHardpoint1', true, false],
        ['TinyHardpoint2', true, true],
      ]);
    });

    it('keeps every mount before either side has loaded', () => {
      const { items, occurrences } = projectAnatomy(SLOTS, PENDING);

      expect(items).toHaveLength(3);
      expect(items.every((item) => item.sides.length === 0)).toBe(true);
      expect(occurrences).toEqual({ top: [], bottom: [] });
    });

    it.each([
      ['temporarily unavailable', { kind: 'temporarilyUnavailable' } as const],
      ['a package defect', { kind: 'contractDefect' } as const],
    ])('keeps every mount when a side is %s', (_name, state) => {
      const { items } = projectAnatomy(SLOTS, { top: state, bottom: state });

      expect(items).toHaveLength(3);
    });

    it('creates no item from an annotation naming a slot the hull does not have', () => {
      const { items, occurrences } = projectAnatomy(SLOTS, {
        ...PENDING,
        top: ready(document('top', [{ feature: 'hardpoint', journalSlot: 'HugeHardpoint9' }])),
      });

      expect(items.map((item) => item.key)).not.toContain('HugeHardpoint9');
      expect(occurrences.top).toEqual([]);
    });
  });

  describe('what is located', () => {
    it('admits a hardpoint annotation over a hardpoint slot', () => {
      const { occurrences } = projectAnatomy(SLOTS, {
        ...PENDING,
        top: ready(document('top', [{ feature: 'hardpoint', journalSlot: 'LargeHardpoint1' }])),
      });

      expect(occurrences.top.map((o) => o.item.key)).toEqual(['LargeHardpoint1']);
      expect(occurrences.top[0].side).toBe('top');
    });

    it('admits a utility_mount annotation over a utility slot', () => {
      const { occurrences } = projectAnatomy(SLOTS, {
        ...PENDING,
        top: ready(document('top', [{ feature: 'utility_mount', journalSlot: 'TinyHardpoint2' }])),
      });

      expect(occurrences.top.map((o) => o.item.key)).toEqual(['TinyHardpoint2']);
    });

    it.each([
      ['a utility_mount drawn over a hardpoint key', 'utility_mount', 'LargeHardpoint1'],
      ['a hardpoint drawn over a utility key', 'hardpoint', 'TinyHardpoint2'],
      ['an unannotated feature that names a slot', 'canopy', 'LargeHardpoint1'],
    ])('refuses %s', (_name, feature, journalSlot) => {
      const state = { ...PENDING, top: ready(document('top', [{ feature, journalSlot }])) };

      const { occurrences, items } = projectAnatomy(SLOTS, state);

      expect(occurrences.top).toEqual([]);
      expect(items.find((item) => item.key === journalSlot)?.sides).toEqual([]);
    });

    it('drops both drawings of a key repeated on one side rather than choosing by order', () => {
      const { occurrences, items } = projectAnatomy(SLOTS, {
        ...PENDING,
        top: ready(
          document('top', [
            { feature: 'hardpoint', journalSlot: 'LargeHardpoint1' },
            { feature: 'hardpoint', journalSlot: 'LargeHardpoint1' },
          ]),
        ),
      });

      expect(occurrences.top).toEqual([]);
      expect(items.find((item) => item.key === 'LargeHardpoint1')?.sides).toEqual([]);
    });

    it('preserves the package drawing order within a side', () => {
      const { occurrences } = projectAnatomy(SLOTS, {
        ...PENDING,
        top: ready(
          document('top', [
            { feature: 'hardpoint', journalSlot: 'TinyHardpoint1' },
            { feature: 'hardpoint', journalSlot: 'LargeHardpoint1' },
          ]),
        ),
      });

      expect(occurrences.top.map((o) => o.item.key)).toEqual(['TinyHardpoint1', 'LargeHardpoint1']);
    });

    it('locates a ready side immediately while its peer is still loading', () => {
      const { items, occurrences } = projectAnatomy(SLOTS, {
        top: ready(document('top', [{ feature: 'hardpoint', journalSlot: 'LargeHardpoint1' }])),
        bottom: { kind: 'loading' },
      });

      expect(items.find((item) => item.key === 'LargeHardpoint1')?.sides).toEqual(['top']);
      expect(occurrences.bottom).toEqual([]);
    });
  });

  describe('a mount drawn on both sides', () => {
    const both: SideStates = {
      top: ready(document('top', [{ feature: 'hardpoint', journalSlot: 'TinyHardpoint1' }])),
      bottom: ready(document('bottom', [{ feature: 'hardpoint', journalSlot: 'TinyHardpoint1' }])),
    };

    it('remains one item naming both sides', () => {
      const { items } = projectAnatomy(SLOTS, both);

      expect(items.filter((item) => item.key === 'TinyHardpoint1')).toHaveLength(1);
      expect(items.find((item) => item.key === 'TinyHardpoint1')?.sides).toEqual(['top', 'bottom']);
    });

    it('gives both occurrences the same item, so their state cannot disagree', () => {
      const { occurrences } = projectAnatomy(SLOTS, both);

      expect(occurrences.top[0].item).toBe(occurrences.bottom[0].item);
    });
  });
});
