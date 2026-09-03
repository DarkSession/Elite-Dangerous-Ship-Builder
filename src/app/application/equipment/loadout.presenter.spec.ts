import { TestBed } from '@angular/core/testing';
import { getSuitByFamily, getSuitGrade } from '@elite-dangerous-almanac/core/equipment/suits';
import {
  getPersonalWeaponBySymbol,
  personalWeaponMetrics,
} from '@elite-dangerous-almanac/core/equipment/weapons';
import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import { LoadoutPresenter } from './loadout.presenter';
import { LoadoutStore } from './loadout.store';
import { provideLocalization } from '../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';

const RIFLE = 'wpn_m_assaultrifle_plasma_fauto';
const PISTOL = 'wpn_s_pistol_kinetic_sauto';

describe('LoadoutPresenter', () => {
  let store: LoadoutStore;
  let presenter: LoadoutPresenter;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalization()] });
    store = TestBed.inject(LoadoutStore);
    presenter = TestBed.inject(LoadoutPresenter);
  });

  const dominator = (): void => {
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
  };

  it('draws the bench inert rather than empty while no suit is on it (canvas 2a)', () => {
    // The gate keeps every region drawn: a Commander can see the mounts, the
    // figures and the slots a suit will fill in. What is not drawn is a tool
    // list, because carriage is a property of a suit and none is worn.
    const ledger = presenter.ledger();

    expect(ledger.suit?.emptyLabel).toBe('Choose a suit');
    expect(ledger.weapons.map((row) => row.target)).toEqual([
      'PrimaryWeapon1',
      'PrimaryWeapon2',
      'SecondaryWeapon',
    ]);
    expect(ledger.weapons.every((row) => row.held)).toBe(true);
    expect(ledger.tools).toEqual([]);
    expect([ledger.suitCount, ledger.weaponCount, ledger.toolCount]).toEqual(['0', '—', '—']);

    // Nothing is selected, so there is no item; the figures a suit answers are
    // named with the canvas's dash rather than left out.
    expect(presenter.item()).toBeNull();
    expect(presenter.stats()?.shieldStrength).toBe('—');
    expect(presenter.stats()?.firepower).toEqual([]);
    expect(presenter.materials().lines).toEqual([]);
    expect(presenter.materials().summary).toBe('None');
  });

  describe('the ledger', () => {
    it('names the suit through the package and states its mounts', () => {
      dominator();
      const suit = presenter.ledger().suit!;

      expect(suit.name?.text).toBe('Dominator Suit');
      expect(suit.meta).toBe('2 primary / 1 secondary');
      expect(suit.grade).toBe('G5');
      expect(suit.modifications).toBe('0/4');
    });

    it('draws one row per offered mount, and none for an absent one', () => {
      dominator();
      expect(presenter.ledger().weapons.map((row) => row.target)).toEqual([
        'PrimaryWeapon1',
        'PrimaryWeapon2',
        'SecondaryWeapon',
      ]);

      // The Maverick carries one primary mount. The second is empty and not
      // carried, so nothing is drawn for it.
      store.dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });
      expect(presenter.ledger().weapons.map((row) => row.target)).toEqual([
        'PrimaryWeapon1',
        'SecondaryWeapon',
      ]);
    });

    it('names a held mount’s weapon and says the mount is unavailable', () => {
      // An unavailable row whose weapon vanished would lose the very thing the
      // loadout retains (FR-007).
      dominator();
      store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon2', symbol: RIFLE });
      store.dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });

      const held = presenter.ledger().weapons.find((row) => row.target === 'PrimaryWeapon2')!;

      expect(held.held).toBe(true);
      expect(held.name?.text).toBe('Manticore Oppressor');
      expect(held.meta).toContain('Primary Weapon 2');
      // Held and unavailable read as text, not as dimming.
      expect(held.accessibleName).toContain('Manticore Oppressor');
      expect(held.accessibleName).toContain(
        BUNDLED_ENGLISH['equipment.mount.held'].split('·')[0]!.trim(),
      );
    });

    it('states an empty mount as empty, with the mount named for a reader', () => {
      dominator();
      const empty = presenter.ledger().weapons[0]!;

      expect(empty.name).toBeNull();
      expect(empty.emptyLabel).toBe(BUNDLED_ENGLISH['equipment.mount.empty']);
      expect(empty.grade).toBeNull();
      expect(empty.accessibleName).toContain('Primary Weapon 1');
    });

    it('states a weapon’s class, damage type and fire mode', () => {
      dominator();
      store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });

      expect(presenter.ledger().weapons[0]!.meta).toBe('Rifle · Plasma · Automatic');
    });

    it('lists the tools the suit carries, each stating it cannot be changed', () => {
      dominator();
      const ledger = presenter.ledger();

      expect(ledger.toolCount).toBe(String(ledger.tools.length));
      expect(ledger.tools.map((tool) => tool.name.text)).toContain('Energylink');
      for (const tool of ledger.tools) {
        expect(tool.accessibleName).toContain(tool.name.text!);
        expect(tool.accessibleName).not.toBe(tool.name.text);
      }
    });
  });

  describe('the item view', () => {
    it('shows the suit with its grade ladder and the package’s figures', () => {
      dominator();
      const item = presenter.item()!;
      const grade = getSuitGrade(getSuitByFamily('tacticalsuit')!, 5)!;

      expect(item.name.text).toBe('Dominator Suit');
      expect(item.grades).toEqual([1, 2, 3, 4, 5]);
      expect(item.grade).toBe(5);
      expect(item.attributes.find((attribute) => attribute.id === 'shieldStrength')?.value).toBe(
        grade.shieldStrength.toFixed(1),
      );
      expect(item.attributes.map((attribute) => attribute.id)).toContain('kinetic');
    });

    it('states the Flight Suit honestly rather than drawing four locked slots', () => {
      // Grade 1 only, and a suit that unlocks no slot at any grade says so
      // (spec Edge Cases).
      store.dispatch({ kind: 'selectSuit', suitFamily: 'flightsuit' });
      const item = presenter.item()!;

      expect(item.grades).toEqual([1]);
      expect(item.slots).toBeNull();
      expect(item.noUpgradeNotice).toBe(BUNDLED_ENGLISH['equipment.item.noUpgrade']);
    });

    it('takes the weapon’s derived figures from the package’s own call', () => {
      dominator();
      store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
      store.dispatch({ kind: 'setWeaponGrade', mount: 'PrimaryWeapon1', grade: 5 });
      store.select('PrimaryWeapon1');

      const item = presenter.item()!;
      const metrics = personalWeaponMetrics(getPersonalWeaponBySymbol(RIFLE)!, 5, [], {})!;
      const value = (id: string) => item.attributes.find((attribute) => attribute.id === id)?.value;

      expect(value('sustainedDps')).toBe(metrics.sustainedDamagePerSecond.toFixed(1));
      expect(value('dps')).toBe(metrics.damagePerSecond.toFixed(1));
      expect(value('headshotDamage')).toBe(String(metrics.headshotDamagePerShot));
      expect(value('damagePerShot')).toBe(String(metrics.damagePerShot));
    });

    it('draws four slots, locked ones present and naming the grade they want', () => {
      dominator();
      store.dispatch({ kind: 'setSuitGrade', grade: 3 });
      store.dispatch({
        kind: 'fitModification',
        target: 'suit',
        slot: 0,
        symbol: 'suit_nightvision',
      });
      const slots = presenter.item()!.slots!;

      expect(slots.length).toBe(4);
      expect(slots.map((slot) => slot.locked)).toEqual([false, false, true, true]);
      expect(slots[2]!.status).toBe(
        BUNDLED_ENGLISH['equipment.slot.requires'].replace('{{grade}}', '4'),
      );
      expect(slots[0]!.name?.text).toBe('Night Vision');
    });

    it('says a locked slot is holding what is in it', () => {
      // A locked slot keeps its modification and states nothing (FR-011).
      dominator();
      store.dispatch({
        kind: 'fitModification',
        target: 'suit',
        slot: 3,
        symbol: 'suit_nightvision',
      });
      store.dispatch({ kind: 'setSuitGrade', grade: 2 });
      const slots = presenter.item()!.slots!;

      expect(slots[3]!.locked).toBe(true);
      expect(slots[3]!.name?.text).toBe('Night Vision');
      expect(slots[3]!.status).toBe(
        BUNDLED_ENGLISH['equipment.slot.heldRequires'].replace('{{grade}}', '5'),
      );
    });

    it('states a recipe with no published magnitude as no numeric change', () => {
      // Never a zero, a dash meaning zero, or an invented figure
      // (constitution IV).
      dominator();
      store.dispatch({
        kind: 'fitModification',
        target: 'suit',
        slot: 0,
        symbol: 'suit_nightvision',
      });
      store.dispatch({
        kind: 'fitModification',
        target: 'suit',
        slot: 1,
        symbol: 'suit_increasedshieldregen',
      });
      const slots = presenter.item()!.slots!;

      expect(getPersonalModification('suit_nightvision')!.modifiers).toEqual([]);
      expect(slots[0]!.status).toBe(BUNDLED_ENGLISH['equipment.slot.noChange']);
      expect(slots[1]!.status).toBe(BUNDLED_ENGLISH['equipment.slot.fitted']);
    });
  });

  describe('the commander stats', () => {
    it('states the shields and every resistance with its sign', () => {
      dominator();
      const stats = presenter.stats()!;
      const grade = getSuitGrade(getSuitByFamily('tacticalsuit')!, 5)!;

      expect(stats.shieldStrength).toBe(grade.shieldStrength.toFixed(1));
      expect(stats.shieldRegeneration).toBe(grade.shieldRegeneration.toFixed(2));
      expect(stats.resistances.map((resistance) => resistance.key)).toEqual([
        'kinetic',
        'thermal',
        'plasma',
        'explosive',
      ]);
      // The figure carries the direction, so a bar is decoration a reader can
      // do without (constitution V).
      for (const resistance of stats.resistances) {
        expect(resistance.value).toMatch(/^[+−-]/);
      }
    });

    it('states a negative resistance with its sign, and the bar as its magnitude', () => {
      store.dispatch({ kind: 'selectSuit', suitFamily: 'flightsuit' });
      const kinetic = presenter.stats()!.resistances[0]!;

      expect(kinetic.negative).toBe(true);
      expect(kinetic.magnitude).toBeGreaterThan(0);
    });

    it('states one firepower row per counted weapon, and none for a held one', () => {
      dominator();
      store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });
      store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon2', symbol: RIFLE });
      store.dispatch({ kind: 'fitWeapon', mount: 'SecondaryWeapon', symbol: PISTOL });

      expect(presenter.stats()!.firepower.map((row) => row.mount)).toEqual([
        'PrimaryWeapon1',
        'PrimaryWeapon2',
        'SecondaryWeapon',
      ]);

      store.dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });
      expect(presenter.stats()!.firepower.map((row) => row.mount)).toEqual([
        'PrimaryWeapon1',
        'SecondaryWeapon',
      ]);
    });
  });

  describe('the material requirement', () => {
    it('states nothing to gather when nothing is fitted', () => {
      dominator();

      expect(presenter.materials().lines).toEqual([]);
      expect(presenter.materials().summary).toBeNull();
      expect(presenter.materials().emptyLabel).toBe(BUNDLED_ENGLISH['equipment.materials.empty']);
    });

    it('names every micro resource through the package and sums the summary', () => {
      dominator();
      store.dispatch({
        kind: 'fitModification',
        target: 'suit',
        slot: 0,
        symbol: 'suit_nightvision',
      });
      const materials = presenter.materials();

      expect(materials.lines.length).toBeGreaterThan(0);
      for (const line of materials.lines) {
        expect(line.name.text).not.toBeNull();
        expect(line.name.text).not.toBe(line.symbol);
      }
      expect(materials.summary).toContain(String(materials.lines.length));
    });
  });

  describe('the choosers', () => {
    it('offers a mount only its own weapons, each with the damage it would do', () => {
      dominator();
      const choices = presenter.weaponChoices('SecondaryWeapon');

      expect(choices.length).toBeGreaterThan(0);
      for (const choice of choices) {
        expect(getPersonalWeaponBySymbol(choice.symbol)!.slot).toBe('secondary');
        expect(choice.name.text).not.toBeNull();
        expect(choice.figure).not.toBe('');
      }
    });

    it('marks the weapon already on the mount', () => {
      dominator();
      store.dispatch({ kind: 'fitWeapon', mount: 'PrimaryWeapon1', symbol: RIFLE });

      expect(
        presenter.weaponChoices('PrimaryWeapon1').find((choice) => choice.current)?.symbol,
      ).toBe(RIFLE);
    });

    it('offers every suit, marking the one worn', () => {
      dominator();
      const choices = presenter.suitChoices();

      expect(choices.length).toBe(4);
      expect(choices.find((choice) => choice.current)?.family).toBe('tacticalsuit');
      for (const choice of choices) {
        expect(choice.name.text).not.toBeNull();
      }
    });

    it('names the engineers who grant each modification', () => {
      // FR-010: the canvas's own recipe list carries them and its render drops
      // them; the requirement keeps them.
      dominator();
      const choices = presenter.modificationChoices('suit', 0);
      const nightVision = choices.find((choice) => choice.symbol === 'suit_nightvision')!;

      expect(nightVision.engineers).toBe(
        getPersonalModification('suit_nightvision')!.engineers.join(' · '),
      );
      expect(nightVision.engineers.length).toBeGreaterThan(0);
    });

    it('marks a recipe another slot already holds rather than hiding it', () => {
      dominator();
      store.dispatch({
        kind: 'fitModification',
        target: 'suit',
        slot: 0,
        symbol: 'suit_nightvision',
      });
      const choices = presenter.modificationChoices('suit', 1);

      expect(choices.find((choice) => choice.symbol === 'suit_nightvision')?.fitted).toBe(true);
    });

    it('names a modification chooser by the slot it is for', () => {
      expect(presenter.modificationChooserTitle(0)).toBe(
        BUNDLED_ENGLISH['equipment.chooser.modification'].replace('{{slot}}', '1'),
      );
    });
  });
});
