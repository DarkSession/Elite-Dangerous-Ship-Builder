import { getShipManufacturer, getShipName } from '@elite-dangerous-almanac/core/i18n/ships';
import { getLoadoutEditErrorMessage } from '@elite-dangerous-almanac/core/i18n/diagnostics';
import { getModuleName } from '@elite-dangerous-almanac/core/i18n/modules';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { SHIPS } from '@elite-dangerous-almanac/core/ships/ships';
import { presentGameText } from './game-text.presenter';
import germanCatalogue from './locales/de.json';
import { BUNDLED_ENGLISH } from './locale-registry';

/**
 * Game text comes from the installed package, and from nowhere else.
 *
 * A hull's name, its manufacturer and the package's own diagnostics are the
 * Almanac's nouns. This application resolves them through the package's i18n
 * leaves, renders the canonical text with a disclosure when a translation is
 * missing, and says so plainly when the package has nothing — it never invents
 * a string, never echoes a raw symbol as a display name, and keeps no private
 * catalogue of translated game text (FR-020, constitution II).
 */

/** A locale the package certainly does not translate into. */
const UNTRANSLATED_LOCALE = 'qps-ploc';

describe('package text', () => {
  it('resolves every installed hull’s name and manufacturer through the package', () => {
    let renamed = 0;

    for (const ship of SHIPS) {
      const name = presentGameText(getShipName, ship.symbol, 'en');
      const manufacturer = presentGameText(getShipManufacturer, ship.symbol, 'en');

      expect(name.translationState, ship.symbol).toBe('localized');
      expect(name.text, ship.symbol).toBe(getShipName(ship.symbol, 'en'));
      expect(manufacturer.translationState, ship.symbol).toBe('localized');
      expect(manufacturer.text, ship.symbol).toBe(getShipManufacturer(ship.symbol, 'en'));

      if (name.text !== ship.symbol) {
        renamed += 1;
      }
    }

    // Some symbols happen to read as their own name — an Eagle is an "Eagle" —
    // so the guarantee is not that every name differs. It is that the names
    // come from the package: if they were symbols echoed as display text, none
    // would differ.
    expect(renamed).toBeGreaterThan(SHIPS.length / 2);
  });

  it('renders canonical package text with an untranslated disclosure', () => {
    const presented = presentGameText(getShipName, SHIPS[0]!.symbol, UNTRANSLATED_LOCALE);

    expect(presented.text).toBe(getShipName(SHIPS[0]!.symbol, 'en'));
    expect(presented.language).toBe('en');
    expect(presented.translationState).toBe('canonical');
    expect(presented.disclosureKey).toBe('game-text.untranslated.description');
  });

  it('states an absence rather than echoing the identity', () => {
    const presented = presentGameText(getShipName, 'No_Such_Hull', 'en');

    expect(presented).toEqual({
      text: null,
      language: null,
      translationState: 'unavailable',
      disclosureKey: 'game-text.unavailable',
    });
  });

  it('resolves package diagnostics through the package too', () => {
    // A real diagnostic, refused by the package itself rather than a shape
    // invented here: a power plant does not go in a hardpoint.
    const loadout = ShipLoadout.default('Anaconda');
    const plant = loadout.modulesForSlot('PowerPlant')[0];
    expect(plant).toBeDefined();

    let refusal: unknown = null;
    try {
      loadout.setModule('SmallHardpoint1', plant!);
    } catch (error) {
      refusal = error;
    }
    expect(refusal).not.toBeNull();

    const issue = refusal as Parameters<typeof getLoadoutEditErrorMessage>[0];
    const presented = presentGameText(getLoadoutEditErrorMessage, issue, 'en');

    // Whatever the package says is what is presented. No application sentence
    // is substituted for a diagnostic.
    expect(presented.text).toBe(getLoadoutEditErrorMessage(issue, 'en'));
    expect(presented.translationState).toBe('localized');
  });

  it('adds no private translation of a game noun', () => {
    // Every application message key is application framing. A hull name, a
    // module name or a manufacturer appearing as a value here would be a second
    // catalogue that the package could contradict on its next release.
    const nouns = new Set<string>();
    for (const ship of SHIPS) {
      for (const text of [getShipName(ship.symbol, 'en'), getShipManufacturer(ship.symbol, 'en')]) {
        if (text !== null && text.length > 0) {
          nouns.add(text.toLowerCase());
        }
      }
    }
    nouns.add((getModuleName('Int_Powerplant_Size8_Class1', 'en') ?? '').toLowerCase());

    const catalogues: readonly Record<string, string>[] = [
      BUNDLED_ENGLISH as Record<string, string>,
      germanCatalogue as Record<string, string>,
    ];

    for (const catalogue of catalogues) {
      for (const [key, value] of Object.entries(catalogue)) {
        expect(nouns.has(value.trim().toLowerCase()), `${key} restates a package noun`).toBe(false);
      }
    }
  });
});
