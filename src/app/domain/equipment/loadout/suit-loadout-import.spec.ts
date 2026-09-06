import { scanJournalText } from '../../journal/journal-scan';
import { SUIT_JOURNAL_READER, importSuitLoadout } from './suit-loadout-import';

/** The package's own documented example, which is a real journal payload. */
const EVENT = {
  timestamp: '2026-09-01T10:00:00Z',
  event: 'SwitchSuitLoadout',
  SuitID: 1700482757598197,
  SuitName: 'tacticalsuit_class5',
  SuitMods: ['suit_nightvision', 'suit_increasedammoreserves'],
  LoadoutID: 4293000007,
  LoadoutName: 'Double Trouble',
  Modules: [
    {
      SlotName: 'PrimaryWeapon1',
      SuitModuleID: 1701103603778031,
      ModuleName: 'wpn_m_launcher_rocket_sauto',
      Class: 5,
      WeaponMods: ['weapon_clipsize'],
    },
  ],
} as const;

function event(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...EVENT, ...overrides };
}

describe('reading a journal suit loadout', () => {
  it('takes the suit, its grade, its modifications and the weapon at each mount', () => {
    const result = importSuitLoadout(event());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.loadout.suitFamily).toBe('tacticalsuit');
    expect(result.value.loadout.suitGrade).toBe(5);
    expect(result.value.loadout.suitModifications.slice(0, 2)).toEqual([
      'suit_nightvision',
      'suit_increasedammoreserves',
    ]);
    expect(result.value.loadout.weapons[0]?.symbol).toBe('wpn_m_launcher_rocket_sauto');
    expect(result.value.loadout.weapons[0]?.grade).toBe(5);
    expect(result.value.loadout.weapons[0]?.modifications[0]).toBe('weapon_clipsize');
    expect(result.value.name).toBe('Double Trouble');
  });

  it('addresses four modification slots, whatever the event stated', () => {
    const result = importSuitLoadout(event());

    expect(result.ok && result.value.loadout.suitModifications).toHaveLength(4);
    expect(result.ok && result.value.loadout.suitModifications[3]).toBeNull();
  });

  it('counts the weapons and the modifications the list shows', () => {
    const result = importSuitLoadout(event());

    expect(result.ok && result.value.weaponCount).toBe(1);
    expect(result.ok && result.value.modificationCount).toBe(3);
  });

  it('reports an unknown weapon rather than substituting one', () => {
    const result = importSuitLoadout(
      event({
        Modules: [{ SlotName: 'PrimaryWeapon1', ModuleName: 'wpn_not_a_weapon', Class: 5 }],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.loadout.weapons.every((weapon) => weapon === null)).toBe(true);
    expect(result.value.outcomes.map((outcome) => outcome.action)).toEqual(['unknownWeapon']);
  });

  it('reports a mount the suit does not carry', () => {
    const result = importSuitLoadout(
      event({
        Modules: [
          {
            SlotName: 'NotAMount',
            ModuleName: 'wpn_m_launcher_rocket_sauto',
            Class: 5,
          },
        ],
      }),
    );

    expect(result.ok && result.value.outcomes.map((outcome) => outcome.action)).toEqual([
      'unknownMount',
    ]);
  });

  it('reports a grade outside the published range', () => {
    const result = importSuitLoadout(
      event({
        Modules: [
          { SlotName: 'PrimaryWeapon1', ModuleName: 'wpn_m_launcher_rocket_sauto', Class: 9 },
        ],
      }),
    );

    expect(result.ok && result.value.outcomes.map((outcome) => outcome.action)).toEqual([
      'unknownGrade',
    ]);
  });

  it('reports a modification recipe it cannot resolve', () => {
    const result = importSuitLoadout(event({ SuitMods: ['not_a_recipe'] }));

    expect(result.ok && result.value.outcomes.map((outcome) => outcome.action)).toEqual([
      'unknownModification',
    ]);
  });

  it('names recipes the bench has no slot for rather than dropping them', () => {
    const result = importSuitLoadout(
      event({
        SuitMods: [
          'suit_nightvision',
          'suit_increasedammoreserves',
          'suit_increasedsprintduration',
          'suit_increasedbatterycapacity',
          'suit_improvedjumpassist',
        ],
      }),
    );

    expect(result.ok && result.value.heldBack.length).toBe(1);
  });

  it('refuses an unknown suit whole, and says it was the suit', () => {
    const result = importSuitLoadout(event({ SuitName: 'not_a_suit_class5' }));

    expect(result).toEqual({
      ok: false,
      failure: { kind: 'unknownSuit', sourceSuit: 'not_a_suit_class5' },
    });
  });

  it('refuses a malformed event without blaming the suit', () => {
    const result = importSuitLoadout({ SuitName: 'tacticalsuit_class5', Modules: 'not an array' });

    expect(result).toEqual({ ok: false, failure: { kind: 'malformed' } });
  });
});

describe('what the bench looks for in a journal', () => {
  it('takes all three event names the game writes', () => {
    for (const name of ['SuitLoadout', 'SwitchSuitLoadout', 'CreateSuitLoadout']) {
      const log = JSON.stringify(event({ event: name }));

      expect(scanJournalText(log, SUIT_JOURNAL_READER)).toHaveLength(1);
    }
  });

  it('lists one loadout once however many times the journal wrote it', () => {
    const log = [
      JSON.stringify(event({ timestamp: '2026-09-01T10:00:00Z' })),
      JSON.stringify(event({ timestamp: '2026-09-02T10:00:00Z' })),
    ].join('\n');

    expect(scanJournalText(log, SUIT_JOURNAL_READER)).toHaveLength(1);
  });

  it('leaves out an event the package refuses', () => {
    const log = [
      JSON.stringify(event()),
      JSON.stringify(event({ SuitName: 'not_a_suit_class5' })),
    ].join('\n');

    expect(scanJournalText(log, SUIT_JOURNAL_READER)).toHaveLength(1);
  });

  it('ignores a ship loadout in the same journal', () => {
    const log = JSON.stringify({
      timestamp: '2026-09-01T10:00:00Z',
      event: 'Loadout',
      Ship: 'anaconda',
      Modules: [],
    });

    expect(scanJournalText(log, SUIT_JOURNAL_READER)).toEqual([]);
  });
});
