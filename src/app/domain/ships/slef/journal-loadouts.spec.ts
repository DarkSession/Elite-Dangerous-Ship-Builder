import { scanJournalText } from '../../journal/journal-scan';
import { FIXTURE_HULL, FIXTURE_SLOTS } from '../outfitting/outfitting.fixtures';
import { SHIP_JOURNAL_READER } from './journal-loadouts';

const MODULES = [
  { Slot: FIXTURE_SLOTS.core, Item: 'Int_Powerplant_Size8_Class5' },
  { Slot: FIXTURE_SLOTS.thrusters, Item: 'Int_Engine_Size7_Class5' },
];

function loadoutLine(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    timestamp: '2026-09-01T10:00:00Z',
    event: 'Loadout',
    Ship: FIXTURE_HULL,
    ShipName: 'Night Watch',
    ShipIdent: 'NW-01',
    Modules: MODULES,
    ...overrides,
  });
}

function factsIn(text: string) {
  return scanJournalText(text, SHIP_JOURNAL_READER).map((entry) => entry.value);
}

describe('what a journal line says about a build', () => {
  it('reads the ship name, the ident, the hull and the module count', () => {
    const [facts] = factsIn(loadoutLine());

    expect(facts?.shipName).toBe('Night Watch');
    expect(facts?.ident).toBe('NW-01');
    expect(facts?.hullSymbol).toBe(FIXTURE_HULL);
    expect(facts?.moduleCount).toBe(MODULES.length);
  });

  it('carries the hull as the package read it, and derives no name from the symbol', () => {
    const [facts] = factsIn(loadoutLine({ Ship: 'federal_corvette', Modules: [] }));

    expect(facts?.hullSymbol).toBe('federal_corvette');
    expect(Object.keys(facts ?? {})).not.toContain('hullName');
  });

  it('reports an absent ship name and ident as absent rather than as text', () => {
    const [facts] = factsIn(loadoutLine({ ShipName: '   ', ShipIdent: undefined }));

    expect(facts?.shipName).toBeNull();
    expect(facts?.ident).toBeNull();
  });

  it('hands on the entry the import path takes', () => {
    const [facts] = factsIn(loadoutLine());

    expect(facts?.entry.data.Ship).toBe(FIXTURE_HULL);
    expect(facts?.entry.data.Modules.length).toBe(MODULES.length);
  });

  it('reads every entry of an exported file', () => {
    const exported = JSON.stringify([
      { header: { appName: 'EDSY', appVersion: '1' }, data: { Ship: FIXTURE_HULL, Modules: [] } },
      { header: { appName: 'EDSY', appVersion: '1' }, data: { Ship: 'python_nx', Modules: [] } },
    ]);

    expect(factsIn(exported).map((facts) => facts.hullSymbol)).toEqual([FIXTURE_HULL, 'python_nx']);
  });

  it('leaves out a line the package refuses', () => {
    const log = [loadoutLine(), JSON.stringify({ event: 'Loadout', Ship: 42 })].join('\n');

    expect(factsIn(log).length).toBe(1);
  });

  it('lists one build once however many times the journal wrote it', () => {
    const log = [
      loadoutLine({ timestamp: '2026-09-01T10:00:00Z' }),
      loadoutLine({ timestamp: '2026-09-02T10:00:00Z' }),
    ].join('\n');

    expect(factsIn(log).length).toBe(1);
  });

  it('tells two builds of one hull apart by what the list shows', () => {
    const log = [
      loadoutLine(),
      loadoutLine({ ShipName: 'Day Watch', timestamp: '2026-09-02T10:00:00Z' }),
      loadoutLine({ Modules: [MODULES[0]], timestamp: '2026-09-03T10:00:00Z' }),
    ].join('\n');

    expect(factsIn(log).length).toBe(3);
  });
});
