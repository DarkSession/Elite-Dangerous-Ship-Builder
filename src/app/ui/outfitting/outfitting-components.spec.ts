import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import {
  accessibleName,
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from '../components/ui-component.spec-helpers';
import { EditRefusalNotice } from './edit-refusal-notice';
import { ModuleIdentityBadge } from './module-identity-badge';
import { OutfittingNotice } from './outfitting-notice';
import { QualityCompletionNotice } from './quality-completion-notice';
import { SlotCard } from './slot-card';
import { SlotGroup } from './slot-group';
import { UnavailableFact } from './unavailable-fact';

/**
 * What the outfitting primitives promise a reader.
 *
 * Every assertion here is about meaning rather than markup: that an absence is
 * a word and not a zero, that selection is stated and not merely coloured, that
 * a slot key reaches assistive technology without reaching the screen, and that
 * the application's framing and the Almanac's reason stay two separate voices.
 */

const LOCALIZED: GameTextPresentation = {
  text: 'Multi-Cannon',
  language: 'en',
  translationState: 'localized',
  disclosureKey: null,
};

const CANONICAL: GameTextPresentation = {
  text: 'Corrosion Resistant Cargo Rack',
  language: 'en',
  translationState: 'canonical',
  disclosureKey: 'game-text.untranslated.description',
};

/** A slot view shaped like the package's, with the parts a test varies. */
function slotView(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    key: 'HugeHardpoint1',
    canonicalName: 'Huge Hardpoint 1',
    displayName: { ...LOCALIZED, text: 'Huge Hardpoint 1' },
    kind: 'hardpoint',
    size: 4,
    restriction: null,
    restrictionText: null,
    removable: true,
    immovableReason: null,
    node: 1,
    module: {
      slotKey: 'HugeHardpoint1',
      symbol: 'Hpt_MultiCannon_Gimbal_Huge',
      displayName: LOCALIZED,
      enabled: undefined,
      priority: 0,
      article: { class: 4, rating: 'A', mount: 'Gimballed' },
      effectiveArticle: null,
      engineering: null,
      variant: null,
      entitlement: null,
    },
    ...overrides,
  };
}

const EVERY_CAPABILITY = {
  canOpenReplacement: true,
  canFitSelection: true,
  canRemove: true,
  canOpenEngineering: true,
  canSetEnabled: true,
  canSetPriority: true,
  packageEmpty: false,
};

describe('unavailable fact', () => {
  it('renders a package value with its unit', () => {
    const fixture = renderComponent(UnavailableFact, {
      label: 'Power draw',
      value: '0.88',
      unit: 'MW',
    });

    expect(textOf(query(fixture, '.fact__value'))).toBe('0.88');
    expect(textOf(query(fixture, '.fact__unit'))).toBe('MW');
  });

  it('states an absence in words rather than as a zero', () => {
    const fixture = renderComponent(UnavailableFact, { label: 'Weapon draw', value: null });

    const text = textOf(element(fixture));
    expect(text).toContain('Weapon draw');
    expect(text.toLowerCase()).toContain('unavailable');
    expect(text).not.toContain('0');
  });

  it('associates the reason with the absence', () => {
    const fixture = renderComponent(UnavailableFact, {
      label: 'Weapon draw',
      value: null,
      reason: 'The Almanac reports no value.',
    });

    const absence = query(fixture, '.unavailable');
    expect(describedText(absence)).toContain('The Almanac reports no value.');
  });
});

describe('module identity badge', () => {
  it('renders class, rating and mount as separate package values', () => {
    const fixture = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      moduleClass: 4,
      rating: 'A',
      mount: 'Gimballed',
    });

    expect(textOf(query(fixture, '.identity__code'))).toBe('4A');
    expect(textOf(query(fixture, '.identity__mount'))).toBe('Gimballed');
  });

  it('spells the code out for anyone reading it aloud', () => {
    const fixture = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      moduleClass: 4,
      rating: 'A',
    });

    expect(textOf(query(fixture, '.visually-hidden'))).toContain('Class 4');
  });

  it('leaves the code out rather than inventing one', () => {
    const fixture = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      moduleClass: null,
      rating: null,
    });

    expect(element(fixture).querySelector('.identity__code')).toBeNull();
  });

  it('discloses canonical package text as untranslated', () => {
    const fixture = renderComponent(ModuleIdentityBadge, { name: CANONICAL });

    expect(textOf(element(fixture))).toContain('Corrosion Resistant Cargo Rack');
    expect(textOf(element(fixture)).toLowerCase()).toContain('untranslated');
  });

  it('shows the package symbol only where a caller asks for it', () => {
    const hidden = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      symbol: 'Hpt_MultiCannon_Gimbal_Huge',
    });
    expect(element(hidden).querySelector('.identity__symbol')).toBeNull();

    const shown = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      symbol: 'Hpt_MultiCannon_Gimbal_Huge',
      showSymbol: true,
    });
    expect(textOf(query(shown, '.identity__symbol'))).toBe('Hpt_MultiCannon_Gimbal_Huge');
  });
});

describe('slot card', () => {
  it('carries the exact game slot key for assistive technology, never as visible text', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });

    const row = query(fixture, '.slot');
    expect(row.getAttribute('data-slot-key')).toBe('HugeHardpoint1');
    expect(describedText(query(fixture, '.slot__select'))).toContain('HugeHardpoint1');

    // The drawn label is what a Commander reads: kind, size and node number.
    expect(textOf(query(fixture, '.slot__drawn-label'))).toBe('Hardpoints · Size 4 · Node 1');
  });

  it('states selection in words and in programmatic state, not by the marker alone', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
      selected: true,
    });

    expect(query(fixture, '.slot__select').getAttribute('aria-pressed')).toBe('true');
    expect(query(fixture, '.slot').getAttribute('data-selected')).toBe('true');
    expect(textOf(element(fixture)).toLowerCase()).toContain('selected mount');
  });

  it('names an empty mount rather than leaving it blank', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView({ module: null }),
      capabilities: EVERY_CAPABILITY,
    });

    expect(textOf(query(fixture, '.slot__empty')).toLowerCase()).toBe('empty');
  });

  it('marks a mount the Almanac reports as immovable', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView({ removable: false, immovableReason: 'requiredSlot' }),
      capabilities: { ...EVERY_CAPABILITY, canRemove: false },
    });

    expect(textOf(query(fixture, '.slot__marker')).toLowerCase()).toContain('required');
  });

  it('emits a selection intent rather than acting on one', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });

    const emitted: unknown[] = [];
    fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));
    query(fixture, '.slot__select').click();

    expect(emitted).toEqual([{ kind: 'select' }]);
  });

  it('renders the mount restriction the package supplies', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView({
        kind: 'optional',
        restriction: 'military',
        restrictionText: { ...LOCALIZED, text: 'reinforcement packages and shield cell banks' },
      }),
      capabilities: EVERY_CAPABILITY,
    });

    expect(textOf(query(fixture, '.slot__note'))).toContain('reinforcement packages');
  });
});

describe('slot group', () => {
  it('names the mount kind as a heading and lists its mounts', () => {
    const fixture = renderComponent(SlotGroup, {
      group: { kind: 'hardpoint', slots: [slotView(), slotView({ key: 'LargeHardpoint1' })] },
    });

    expect(textOf(query(fixture, '.group__heading'))).toBe('Hardpoints');
    expect(accessibleName(query(fixture, '.group'))).toBe('Hardpoints');
    expect(textOf(query(fixture, '.group__count'))).toBe('2 mounts');
    expect(element(fixture).querySelector('ul')).not.toBeNull();
  });
});

describe('outfitting notice', () => {
  it('renders each line and names its tone in words', () => {
    const fixture = renderComponent(OutfittingNotice, {
      title: 'Imported build',
      revision: 1,
      lines: [
        { id: 'a', messageKey: 'outfitting.refusal.staleDraft' },
        { id: 'b', messageKey: 'outfitting.refusal.blocked' },
      ],
    });

    expect(element(fixture).querySelectorAll('.notice__line')).toHaveLength(2);
    // The tone is a word beside the colour, never the colour alone.
    expect(textOf(query(fixture, '.status__tone')).length).toBeGreaterThan(0);
  });

  it('renders nothing when there is nothing to say', () => {
    const fixture = renderComponent(OutfittingNotice, {
      title: 'Imported build',
      revision: 1,
      lines: [],
    });

    expect(element(fixture).querySelector('.notice')).toBeNull();
  });

  it('treats a refusal as an alert and a report as a status', () => {
    const status = renderComponent(OutfittingNotice, {
      title: 'Imported build',
      revision: 1,
      mode: 'status',
      lines: [{ id: 'a', messageKey: 'outfitting.refusal.blocked' }],
    });
    expect(query(status, '.status').getAttribute('role')).toBe('status');

    const alert = renderComponent(OutfittingNotice, {
      title: 'That change was not made',
      revision: 2,
      mode: 'alert',
      lines: [{ id: 'a', messageKey: 'outfitting.refusal.packageEdit' }],
    });
    expect(query(alert, '.status').getAttribute('role')).toBe('alert');
  });
});

describe('quality completion notice', () => {
  it('names the mount and the quality the module arrived at', () => {
    const fixture = renderComponent(QualityCompletionNotice, {
      revision: 2,
      slotLabels: { MainEngines: 'Thrusters' },
      notices: [
        {
          kind: 'qualityCompleted',
          slotKey: 'MainEngines',
          moduleSymbol: 'Int_Engine_Size7_Class5',
          blueprintFdname: 'Engine_Dirty',
          previousQuality: 0.37,
          quality: 1,
        },
      ],
    });

    const text = textOf(element(fixture));
    expect(text).toContain('Thrusters');
    expect(text).toContain('37%');
  });

  it('says nothing when the Almanac completed nothing', () => {
    const fixture = renderComponent(QualityCompletionNotice, { revision: 2, notices: [] });

    expect(element(fixture).querySelector('.notice')).toBeNull();
  });
});

describe('edit refusal notice', () => {
  it('renders nothing while no edit has been refused', () => {
    const fixture = renderComponent(EditRefusalNotice, { failure: null, revision: 1 });

    expect(element(fixture).querySelector('.notice')).toBeNull();
  });

  it('frames the outcome and names the mount, leaving the reason to the Almanac', () => {
    const fixture = renderComponent(EditRefusalNotice, {
      revision: 2,
      slotLabel: 'Huge Hardpoint 1',
      failure: {
        category: 'packageEdit',
        slotKey: 'HugeHardpoint1',
        code: 'incompatibleModule',
        constraint: 'oversized',
        params: {},
        diagnostic: null,
        framingKey: 'outfitting.refusal.packageEdit',
      },
    });

    const text = textOf(element(fixture));
    expect(text).toContain('your build is exactly as it was');
    // The mount is named the way the ledger names it, not by its raw key.
    expect(text).toContain('Huge Hardpoint 1');
    expect(text).not.toContain('HugeHardpoint1');
  });
});
