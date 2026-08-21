import { TestBed } from '@angular/core/testing';
import { getModuleName } from '@elite-dangerous-almanac/core/i18n/modules';
import { getShipName } from '@elite-dangerous-almanac/core/i18n/ships';
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

    expect(presented.shipName('sidewinder').text).toBe(getShipName('sidewinder', 'en'));
    expect(presented.blueprintName('not-a-blueprint').translationState).toBe('unavailable');
    expect(presented.materialName('not-a-material').translationState).toBe('unavailable');
    expect(presented.microResourceName('not-a-resource').translationState).toBe('unavailable');
    expect(presented.experimentalEffectName('not-an-effect').translationState).toBe('unavailable');
    expect(presented.experimentalEffectDescription('not-an-effect').translationState).toBe(
      'unavailable',
    );
    expect(presented.engineeringGroupName('not-a-group').translationState).toBe('unavailable');
    expect(presented.shipManufacturer('not-a-ship').translationState).toBe('unavailable');
  });
});
