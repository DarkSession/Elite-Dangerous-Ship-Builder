import { describe, expect, it } from 'vitest';
import { HISTORY_CAPACITY } from '../../domain/ships/outfitting/session-edit-history';
import { emptyLoadoutHistory, recordLoadout, redoLoadout, undoLoadout } from './loadout-history';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';

const loadout = (suitGrade: number): EquipmentLoadout => ({
  suitFamily: 'tacticalsuit',
  suitGrade,
  suitModifications: [null, null, null, null],
  weapons: [null, null, null],
});

describe('loadout history', () => {
  it('offers nothing to undo or redo when nothing has been decided', () => {
    const history = emptyLoadoutHistory();

    expect(undoLoadout(history, loadout(1))).toBeNull();
    expect(redoLoadout(history, loadout(1))).toBeNull();
  });

  it('restores the loadout as it was before the last choice', () => {
    const history = recordLoadout(emptyLoadoutHistory(), loadout(1));
    const step = undoLoadout(history, loadout(2))!;

    expect(step.restore).toEqual(loadout(1));
    expect(step.next.past).toEqual([]);
    expect(redoLoadout(step.next, step.restore)!.restore).toEqual(loadout(2));
  });

  it('discards the branch a new choice left', () => {
    // The bench has left the branch those loadouts described. Offering to redo
    // onto one would offer a loadout nobody had.
    const undone = undoLoadout(recordLoadout(emptyLoadoutHistory(), loadout(1)), loadout(2))!;
    const decided = recordLoadout(undone.next, loadout(3));

    expect(decided.future).toEqual([]);
  });

  it('retains the ship tape’s own number of loadouts, newest kept', () => {
    // One bound for both tools, stated where the ship tape states it.
    let history = emptyLoadoutHistory();
    for (let grade = 1; grade <= HISTORY_CAPACITY + 10; grade += 1) {
      history = recordLoadout(history, loadout(grade));
    }

    expect(history.past.length).toBe(HISTORY_CAPACITY);
    expect(history.past[0]).toEqual(loadout(11));
  });

  it('does not grow the retained path by stepping back and forth', () => {
    let history = emptyLoadoutHistory();
    for (let grade = 1; grade <= HISTORY_CAPACITY; grade += 1) {
      history = recordLoadout(history, loadout(grade));
    }
    const back = undoLoadout(history, loadout(0))!;

    expect(redoLoadout(back.next, back.restore)!.next.past.length).toBe(HISTORY_CAPACITY);
  });
});
