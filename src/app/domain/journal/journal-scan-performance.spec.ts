import { JOURNAL_FILE_LIMIT_BYTES, scanJournalFiles } from './journal-scan';
import { SHIP_JOURNAL_READER } from '../ships/slef/journal-loadouts';
import { FIXTURE_HULL, FIXTURE_SLOTS } from '../ships/outfitting/outfitting.fixtures';

/** 016/SC-001's budget for one file at the bound, in milliseconds. */
const BUDGET_MS = 5_000;

const MODULES = [
  { Slot: FIXTURE_SLOTS.core, Item: 'Int_Powerplant_Size8_Class5' },
  { Slot: FIXTURE_SLOTS.thrusters, Item: 'Int_Engine_Size7_Class5' },
];

function loadoutLine(index: number): string {
  return JSON.stringify({
    timestamp: `2026-09-01T10:00:${String(index % 60).padStart(2, '0')}Z`,
    event: 'Loadout',
    Ship: FIXTURE_HULL,
    ShipName: `Night Watch ${index}`,
    ShipIdent: `NW-${index}`,
    Modules: MODULES,
  });
}

/**
 * A journal the size of the bound, shaped like a real one.
 *
 * Almost every line is an event this scan is not looking for, because that is
 * what a session log is: the pre-filter walks all of it, and only the handful
 * of loadouts reach the package. A file made of nothing but loadouts would
 * measure a case no Commander has.
 */
function journalAtTheBound(): string {
  const noise = JSON.stringify({
    timestamp: '2026-09-01T09:59:00Z',
    event: 'FSSSignalDiscovered',
    SystemAddress: 3107241104074,
    SignalName: '$MULTIPLAYER_SCENARIO42_TITLE;',
  });

  const lines: string[] = [];
  let size = 0;
  let loadouts = 0;
  while (size + noise.length + 1 < JOURNAL_FILE_LIMIT_BYTES) {
    const line = lines.length % 500 === 499 ? loadoutLine(loadouts++) : noise;
    lines.push(line);
    size += line.length + 1;
  }
  return lines.join('\n');
}

describe('a journal file at the stated bound', () => {
  it('is scanned within the budget', async () => {
    const text = journalAtTheBound();
    const file = {
      name: 'Journal.2026-09-01T100000.01.log',
      size: text.length,
      text: () => Promise.resolve(text),
    };

    const started = performance.now();
    const result = await scanJournalFiles([file], SHIP_JOURNAL_READER);
    const elapsed = performance.now() - started;

    expect(result.ok).toBe(true);
    expect(result.ok && result.entries.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(BUDGET_MS);
  });
});
