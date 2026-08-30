import { TestBed } from '@angular/core/testing';
import { getOutfittingFamilyName } from '@elite-dangerous-almanac/core/i18n/module-families';
import { getModuleName } from '@elite-dangerous-almanac/core/i18n/modules';
import {
  OUTFITTING_FAMILIES,
  type OutfittingFamilyId,
} from '@elite-dangerous-almanac/core/ships/module-families';
import { getShipBySymbol } from '@elite-dangerous-almanac/core/ships/ships';
import { provideIsolatedLocaleEnvironment } from './testing/localization-harness';
import { GameTextPresenter, presentGameText } from './game-text.presenter';
import { provideLocalization } from './i18n.providers';

/**
 * Fixtures are real package lookups, not copies of package data.
 *
 * The strings are asserted through the package, so a package update that
 * changes a name changes this test's expectation with it rather than leaving a
 * stale literal behind (constitution II).
 */
const LOCALIZED_MODULE = 'Int_Hyperdrive_Size6_Class5';
const CANONICAL_ONLY_MODULE = 'Int_LargeCargoRack_Size8_class1';
const UNKNOWN_MODULE = 'Not_A_Real_Module_Symbol';
const UNKNOWN_FAMILY = 'notAFamilyTheAlmanacPublishes';

/** Every family id the installed package publishes, in its own order. */
const FAMILY_IDS = Object.keys(OUTFITTING_FAMILIES) as readonly OutfittingFamilyId[];

describe('presentGameText', () => {
  it('presents package text in the active locale when the package has it', () => {
    const presentation = presentGameText(getModuleName, LOCALIZED_MODULE, 'de');

    expect(presentation.translationState).toBe('localized');
    expect(presentation.text).toBe(getModuleName(LOCALIZED_MODULE, 'de'));
    expect(presentation.language).toBe('de');
    expect(presentation.disclosureKey).toBeNull();
  });

  it('falls back to the package canonical text and says so', () => {
    const presentation = presentGameText(getModuleName, CANONICAL_ONLY_MODULE, 'de');

    expect(getModuleName(CANONICAL_ONLY_MODULE, 'de')).toBeNull();
    expect(presentation.translationState).toBe('canonical');
    expect(presentation.text).toBe(getModuleName(CANONICAL_ONLY_MODULE, 'en'));
    expect(presentation.language).toBe('en');
    expect(presentation.disclosureKey).toBe('game-text.untranslated.description');
  });

  it('states an unknown identity as unavailable rather than echoing it', () => {
    const presentation = presentGameText(getModuleName, UNKNOWN_MODULE, 'de');

    expect(presentation.translationState).toBe('unavailable');
    expect(presentation.text).toBeNull();
    expect(presentation.language).toBeNull();
    expect(presentation.disclosureKey).toBe('game-text.unavailable');
  });

  it('never uses the identity as display fallback', () => {
    const presentation = presentGameText(getModuleName, UNKNOWN_MODULE, 'de');

    expect(presentation.text).not.toBe(UNKNOWN_MODULE);
  });

  it('states a known identity with no canonical source as unavailable', () => {
    // Modelled with an explicit lookup rather than a package fixture: the
    // installed package answers every known symbol in English, so this branch
    // has no natural fixture — but the contract requires it to exist, because a
    // family that carries no canonical field can reach it.
    const withoutCanonical = (): string | null => null;
    const presentation = presentGameText(withoutCanonical, 'known-identity', 'de');

    expect(presentation.translationState).toBe('unavailable');
    expect(presentation.text).toBeNull();
  });

  it('treats a blank package value as no value rather than as text', () => {
    const blank = (_identity: string, locale: string): string | null =>
      locale === 'de' ? '' : 'Canonical';
    const presentation = presentGameText(blank, 'identity', 'de');

    expect(presentation.translationState).toBe('canonical');
    expect(presentation.text).toBe('Canonical');
  });

  it('reports English text as localized rather than as a fallback', () => {
    const presentation = presentGameText(getModuleName, CANONICAL_ONLY_MODULE, 'en');

    expect(presentation.translationState).toBe('localized');
    expect(presentation.disclosureKey).toBeNull();
  });
});

describe('GameTextPresenter', () => {
  function presenter(): GameTextPresenter {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideLocalization(), ...provideIsolatedLocaleEnvironment()],
    });
    return TestBed.inject(GameTextPresenter);
  }

  it('requests package text for the committed effective locale', () => {
    const presented = presenter();

    expect(presented.locale).toBe('en');
    expect(presented.moduleName(LOCALIZED_MODULE).text).toBe(getModuleName(LOCALIZED_MODULE, 'en'));
  });

  it('covers every package family through one presentation rule', () => {
    const presented = presenter();

    expect(presented.shipName('sidewinder').text).toBe(getShipBySymbol('sidewinder')?.name);
    expect(presented.blueprintName('not-a-blueprint').translationState).toBe('unavailable');
    expect(presented.materialName('not-a-material').translationState).toBe('unavailable');
    expect(presented.microResourceName('not-a-resource').translationState).toBe('unavailable');
    expect(presented.experimentalEffectName('not-an-effect').translationState).toBe('unavailable');
    expect(presented.experimentalEffectDescription('not-an-effect').translationState).toBe(
      'unavailable',
    );
    expect(presented.shipManufacturer('not-a-ship').translationState).toBe('unavailable');
  });

  /**
   * Families are the one leaf where the canonical arm is ordinary, not rare.
   *
   * Nineteen of the seventy-seven have no name outside English, so a chooser in
   * German reads them in English with the untranslated disclosure — the same
   * thing a module name does. What must never happen is the third arm: a blank
   * heading or a raw `plasmaAccelerators` on screen (FR-020, decision 13).
   */
  it('names every family the package publishes, in the reading language', () => {
    const presented = presenter();

    expect(FAMILY_IDS.length).toBeGreaterThan(0);
    for (const familyId of FAMILY_IDS) {
      const presentation = presented.outfittingFamilyName(familyId);

      expect(presentation.translationState).toBe('localized');
      expect(presentation.text).toBe(getOutfittingFamilyName(familyId, 'en'));
      expect(presentation.disclosureKey).toBeNull();
    }
  });

  it('reads a family the language does not name as canonical English, disclosed', () => {
    const untranslated = FAMILY_IDS.filter((id) => getOutfittingFamilyName(id, 'de') === null);
    expect(untranslated.length).toBeGreaterThan(0);

    for (const familyId of untranslated) {
      const presentation = presentGameText(getOutfittingFamilyName, familyId, 'de');

      expect(presentation.translationState).toBe('canonical');
      expect(presentation.text).toBe(getOutfittingFamilyName(familyId, 'en'));
      expect(presentation.text).not.toBe('');
      expect(presentation.text).not.toBe(familyId);
      expect(presentation.language).toBe('en');
      expect(presentation.disclosureKey).toBe('game-text.untranslated.description');
    }
  });

  it('states an unknown family as unavailable rather than echoing its id', () => {
    const presentation = presenter().outfittingFamilyName(UNKNOWN_FAMILY);

    expect(presentation.translationState).toBe('unavailable');
    expect(presentation.text).toBeNull();
    expect(presentation.disclosureKey).toBe('game-text.unavailable');
  });
});
