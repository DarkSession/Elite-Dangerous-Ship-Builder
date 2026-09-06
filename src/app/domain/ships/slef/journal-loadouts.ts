import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import type { SlefEntry } from '@elite-dangerous-almanac/core/ships/slef';
import type { JournalReader } from '../../journal/journal-scan';

/**
 * One build a journal line or an exported file holds.
 *
 * The facts are what tells one build from another in a list, and every one of
 * them is the package's own reading of the entry. The hull is carried as its
 * symbol: what a hull is called is game text, and game text is resolved where
 * the active locale is known, not here.
 */
export interface JournalLoadoutFacts {
  readonly shipName: string | null;
  readonly ident: string | null;
  readonly hullSymbol: string;
  readonly moduleCount: number;
  /** The entry itself, ready for the import path that takes one. */
  readonly entry: SlefEntry;
}

/**
 * What the Ship Builder looks for in a journal.
 *
 * The package inspects rather than parses: an inspection keeps every valid entry
 * and reports the rest, so one malformed line in a log does not cost the
 * Commander the build on the line above it. The diagnostics are dropped here on
 * purpose — a line the package refused is a line this list does not offer, and
 * there is nothing for a Commander to do about a journal the game wrote.
 */
export const SHIP_JOURNAL_READER: JournalReader<JournalLoadoutFacts> = {
  events: ['loadout'],
  read: (payload) => {
    let entries: readonly SlefEntry[];
    try {
      entries = inspectSlef(payload).entries;
    } catch {
      // `inspectSlef` throws only on a string that is not JSON, and this reader
      // is handed parsed payloads. A refusal here is still a refusal.
      return [];
    }

    return entries.map((entry) => {
      const facts = factsOf(entry);
      return { key: identity(facts), value: facts };
    });
  },
};

/** The entry as the list reads it. */
function factsOf(entry: SlefEntry): JournalLoadoutFacts {
  const loadout = entry.data;
  return {
    shipName: text(loadout.ShipName),
    ident: text(loadout.ShipIdent),
    hullSymbol: loadout.Ship,
    moduleCount: loadout.Modules.length,
    entry,
  };
}

/**
 * What makes two entries the same build.
 *
 * A journal writes the loadout again at every session start and after every
 * outfitting change, so a Commander who flew one ship for a week has the same
 * build on twenty lines. The four facts the list itself shows are what tells
 * those apart from a build that actually differs.
 */
function identity(facts: JournalLoadoutFacts): string {
  return [facts.shipName ?? '', facts.ident ?? '', facts.hullSymbol, facts.moduleCount].join('|');
}

function text(value: string | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
