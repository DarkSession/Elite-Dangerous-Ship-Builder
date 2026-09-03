import { TestBed } from '@angular/core/testing';
import { LoadoutStore } from './loadout.store';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';

const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';

describe('LoadoutStore', () => {
  const store = (): LoadoutStore => TestBed.inject(LoadoutStore);

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('starts empty, pointing at the suit, with nothing to undo', () => {
    expect(store().loadout()).toBeNull();
    expect(store().hasLoadout()).toBe(false);
    // Canvas 2a marks the suit row while it is still a choice: it is the row
    // the gate beside it is asking about.
    expect(store().selected()).toBe('suit');
    expect(store().canUndo()).toBe(false);
    expect(store().mounts()).toEqual([]);
  });

  it('starts a loadout when a suit is chosen on an empty bench', () => {
    expect(store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' })).toBe(true);

    expect(store().loadout()?.suitFamily).toBe('tacticalsuit');
    expect(store().selected()).toBe('suit');
    // Starting the bench is not a choice there is anything behind to undo.
    expect(store().canUndo()).toBe(false);
  });

  it('takes no other choice on an empty bench', () => {
    expect(store().dispatch({ kind: 'setSuitGrade', grade: 3 })).toBe(false);
    expect(store().loadout()).toBeNull();
  });

  it('spends no revision and no history frame on a refused choice', () => {
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const revision = store().revision();

    // A rifle does not go on the secondary mount.
    expect(store().dispatch({ kind: 'fitWeapon', mount: 'SecondaryWeapon', symbol: RIFLE })).toBe(
      false,
    );
    expect(store().revision()).toBe(revision);
    expect(store().canUndo()).toBe(false);
  });

  it('undoes and redoes every outfitting choice', () => {
    // Suit, grade, weapon, weapon grade, modification and clearing a slot are
    // all one kind of thing to the tape: a committed loadout (FR-022).
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store().dispatch({ kind: 'setSuitGrade', grade: 5 });
    store().dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
    store().dispatch({ kind: 'setWeaponGrade', mount: 'PrimaryWeapon1', grade: 5 });
    store().dispatch({
      kind: 'fitModification',
      target: 'PrimaryWeapon1',
      slot: 0,
      symbol: 'weapon_clipsize',
    });
    const assembled = store().loadout();

    store().dispatch({ kind: 'clearSlot', target: 'PrimaryWeapon1', slot: 0 });
    expect(store().loadout()?.weapons[0]?.modifications[0]).toBeNull();

    expect(store().undo()).toBe(true);
    expect(store().loadout()).toEqual(assembled);
    expect(store().redo()).toBe(true);
    expect(store().loadout()?.weapons[0]?.modifications[0]).toBeNull();
  });

  it('reports when there is nothing left to undo or redo', () => {
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store().dispatch({ kind: 'setSuitGrade', grade: 4 });

    expect(store().undo()).toBe(true);
    expect(store().undo()).toBe(false);
    expect(store().redo()).toBe(true);
    expect(store().redo()).toBe(false);
  });

  it('states what each catalogue mount is to the worn suit', () => {
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store().dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon2', symbol: RIFLE });
    store().dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });

    // The Maverick carries one primary mount, so the weapon on the second is
    // held: retained, named, and counted in nothing (FR-007).
    expect(store().mounts()).toEqual(['offered', 'held', 'offered']);
    expect(store().loadout()?.weapons[1]?.symbol).toBe(RIFLE);
  });

  it('opens a loadout from elsewhere without a tape behind it', () => {
    // Opening a saved loadout or a link is not an edit. Undoing onto the
    // loadout that was open before would restore something the Commander never
    // had on this bench.
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store().dispatch({ kind: 'setSuitGrade', grade: 5 });
    expect(store().canUndo()).toBe(true);

    const opened: EquipmentLoadout = {
      suitFamily: 'utilitysuit',
      suitGrade: 2,
      suitModifications: [null, null, null, null],
      weapons: [null, null, null],
    };
    store().open(opened);

    expect(store().loadout()).toEqual(opened);
    expect(store().canUndo()).toBe(false);
    expect(store().canRedo()).toBe(false);
  });

  it('empties the bench when nothing is opened', () => {
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store().open(null);

    expect(store().loadout()).toBeNull();
    expect(store().selected()).toBe('suit');
    expect(store().undo()).toBe(false);
  });

  it('keeps the selection out of the loadout', () => {
    // Which item the item view shows is workflow. It is never saved, encoded
    // into a link or exported.
    store().dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const loadout = store().loadout();

    store().select('SecondaryWeapon');

    expect(store().selected()).toBe('SecondaryWeapon');
    expect(store().loadout()).toBe(loadout);
    expect(store().revision()).toBe(1);
  });
});
