import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import {
  accessibleName,
  element,
  query,
  renderComponent,
  textOf,
} from '../components/ui-component.spec-helpers';
import type { ComponentFixture } from '@angular/core/testing';
import { AttributeComparison } from './attribute-comparison';
import { BlueprintChoiceList } from './blueprint-choice-list';
import { ExperimentalEffectList } from './experimental-effect-list';
import { GradeSelector } from './grade-selector';
import { IngressRefusalNotice } from './ingress-refusal-notice';
import { MaterialCostList } from './material-cost-list';
import { PowerControls } from './power-controls';
import { ShipIdentityFields } from './ship-identity-fields';

/**
 * What the engineering primitives promise a reader.
 *
 * The recurring subject is honesty about absence and about direction: `[]` and
 * `null` never look alike, a value the Almanac does not publish is a word
 * rather than a zero, and nothing anywhere says which way is better —
 * because nothing in the package says so either (FR-007, FR-013).
 */

const LOCALIZED: GameTextPresentation = {
  text: 'Overcharged',
  language: 'en',
  translationState: 'localized',
  disclosureKey: null,
};

function named(text: string): GameTextPresentation {
  return { ...LOCALIZED, text };
}

describe('blueprint choice list', () => {
  const CHOICES = [
    { fdname: 'Weapon_Overcharged', name: named('Overcharged'), route: 'ordinary', applied: true },
    { fdname: 'Weapon_LongRange', name: named('Long Range'), route: 'mercenary', applied: false },
  ];

  it('opens with the explicit no-blueprint option, at every width', () => {
    const fixture = renderComponent(BlueprintChoiceList, { choices: CHOICES });

    const options = queryAll(fixture, '.blueprint');
    // First, and always present. It is the only route to clearing ordinary
    // engineering, so a composition without it would be a width that cannot
    // clear (engineering editor design, "Clearing engineering").
    expect(options[0]?.classList.contains('blueprint--none')).toBe(true);
    expect(textOf(options[0]!)).toContain('None — stock module');
    expect(textOf(options[0]!).toLowerCase()).toContain('removes engineering');
  });

  it('offers no separate clear control anywhere', () => {
    const fixture = renderComponent(BlueprintChoiceList, { choices: CHOICES });

    expect(queryAll(fixture, 'button')).toHaveLength(0);
  });

  it('names the route only where the package says it is not an ordinary one', () => {
    const fixture = renderComponent(BlueprintChoiceList, { choices: CHOICES });

    const text = textOf(element(fixture));
    expect(text).toContain('Merc-Coin');
    // The ordinary recipe says nothing: "this is the normal kind" is not news
    // on a list where most of them are.
    expect(text.match(/Merc-Coin/g)).toHaveLength(1);
  });

  it('states which recipe is applied rather than only colouring it', () => {
    const fixture = renderComponent(BlueprintChoiceList, { choices: CHOICES });

    expect(textOf(element(fixture))).toContain('Applied');
  });

  it('discloses what clearing would also cost, on the option that would do it', () => {
    const fixture = renderComponent(BlueprintChoiceList, {
      choices: CHOICES,
      clearConsequence: 'This also removes the purchase record.',
    });

    expect(textOf(query(fixture, '.blueprint--none'))).toContain('removes the purchase record');
  });

  it('carries no derived claim about what a recipe does', () => {
    const fixture = renderComponent(BlueprintChoiceList, { choices: CHOICES });

    // The canvas draws `DAMAGE ▲ · THERMAL LOAD ▲`. The Almanac publishes no
    // such description, so writing one would be a private claim about game
    // mechanics (FR-007).
    const text = textOf(element(fixture));
    expect(text).not.toContain('▲');
    expect(text).not.toContain('▼');
  });
});

describe('grade selector', () => {
  it('offers exactly the grades it was given, not a fixed five', () => {
    // A bespoke Mercenary recipe starts at grade 2. Drawing a grade 1 cell
    // would offer a job the Almanac has no recipe for.
    const fixture = renderComponent(GradeSelector, { grades: [2, 3, 4, 5], selected: 5 });

    const cells = queryAll(fixture, '.grade');
    expect(cells).toHaveLength(4);
    expect(cells.map((cell) => textOf(cell))).toEqual(['2', '3', '4', '5']);
  });

  it('names each cell, so a bare number is never the whole label', () => {
    const fixture = renderComponent(GradeSelector, { grades: [1, 2], selected: 1 });

    expect(accessibleName(query(fixture, '.grade__radio'))).toBe('Grade 1');
  });

  it('states the chosen grade beside the label, not by the fill alone', () => {
    const fixture = renderComponent(GradeSelector, { grades: [1, 2, 3], selected: 3 });

    expect(textOf(query(fixture, '.grades__selected'))).toBe('3');
    expect(
      (query(fixture, '.grade[data-selected="true"] .grade__radio') as HTMLInputElement).checked,
    ).toBe(true);
  });

  it('exposes no quality or roll control of any kind', () => {
    const fixture = renderComponent(GradeSelector, { grades: [1, 2, 3, 4, 5], selected: 5 });

    const text = textOf(element(fixture)).toLowerCase();
    expect(text).not.toContain('roll');
    expect(text).not.toContain('quality');
    expect(element(fixture).querySelector('input[type="range"]')).toBeNull();
  });
});

describe('experimental effect list', () => {
  const EFFECTS = [
    {
      fdname: 'special_corrosive_shell',
      name: named('Corrosive Shell'),
      description: named('Rounds reduce the target’s hull resistance.'),
      applied: true,
    },
  ];

  it('opens with the explicit no-effect option', () => {
    const fixture = renderComponent(ExperimentalEffectList, { effects: EFFECTS });

    const options = queryAll(fixture, '.effect');
    expect(options[0]?.classList.contains('effect--none')).toBe(true);
    expect(textOf(options[0]!)).toContain('None — remove effect');
  });

  it('shows the package’s own description rather than one of ours', () => {
    const fixture = renderComponent(ExperimentalEffectList, { effects: EFFECTS });

    expect(textOf(element(fixture))).toContain('reduce the target’s hull resistance');
  });

  it('says the effect is unavailable rather than going quiet', () => {
    const fixture = renderComponent(ExperimentalEffectList, {
      effects: [
        {
          ...EFFECTS[0]!,
          description: {
            text: null,
            language: null,
            translationState: 'unavailable',
            disclosureKey: 'game-text.unavailable',
          },
        },
      ],
    });

    expect(textOf(query(fixture, '.effect__description')).length).toBeGreaterThan(0);
  });
});

describe('attribute comparison', () => {
  const ROWS = [
    { key: 'damage', label: 'Damage', stock: '5.72', modified: '6.90' },
    { key: 'mass', label: 'Mass t', stock: null, modified: '4.00' },
  ];

  it('relates every figure to its attribute through a row header', () => {
    const fixture = renderComponent(AttributeComparison, { rows: ROWS });

    const header = query(fixture, '.comparison__attribute');
    expect(header.tagName).toBe('TH');
    expect(header.getAttribute('scope')).toBe('row');
    expect(queryAll(fixture, 'th[scope="col"]').map((cell) => textOf(cell))).toEqual([
      'Attribute',
      'Stock',
      'Modified',
    ]);
  });

  it('says a value is unavailable rather than writing a zero', () => {
    const fixture = renderComponent(AttributeComparison, { rows: ROWS });

    const cells = queryAll(fixture, '.comparison__value');
    expect(textOf(cells[2]!)).not.toBe('0');
    expect(textOf(cells[2]!).length).toBeGreaterThan(0);
  });

  it('claims no direction, because nothing published one', () => {
    const fixture = renderComponent(AttributeComparison, { rows: ROWS });

    const text = textOf(element(fixture));
    expect(text).not.toContain('▲');
    expect(text).not.toContain('▼');
    expect(text).not.toContain('%');
  });
});

describe('material cost list', () => {
  const MATERIAL = {
    symbol: 'ConductivePolymers',
    name: named('Conductive Polymers'),
    grade: 4,
    count: '5',
  };

  it('heads the requirement with the grade, and never calls it a roll', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [MATERIAL] }],
      grade: 5,
    });

    const text = textOf(element(fixture));
    expect(text).toContain('Materials · G5');
    expect(text.toLowerCase()).not.toContain('roll');
  });

  it('associates each count with the material it belongs to', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [MATERIAL] }],
      grade: 5,
    });

    expect(query(fixture, '.material__name').tagName).toBe('DT');
    expect(query(fixture, '.material__count').tagName).toBe('DD');
    expect(textOf(query(fixture, '.material__count'))).toBe('5');
  });

  it('carries the package’s own rarity rather than fetching an icon', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [MATERIAL] }],
      grade: 5,
    });

    expect(textOf(query(fixture, '.material__grade'))).toBe('Grade 4');
    // Nothing here reaches another origin at runtime (constitution I).
    expect(element(fixture).querySelector('img')).toBeNull();
  });

  it('shows a known zero as nothing more needed, not as unavailable', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [] }],
      grade: 3,
    });

    const text = textOf(element(fixture));
    expect(text).toContain('Nothing more is needed');
    expect(text).not.toContain('publishes no material cost');
  });

  it('shows an unavailable cost as unavailable, never as a zero', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'unavailable', materials: [] }],
      grade: 3,
    });

    const text = textOf(element(fixture));
    expect(text).toContain('publishes no material cost');
    expect(text).not.toContain('Nothing more is needed');
  });

  it('draws nothing for a part nothing is selected for', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'experimental', state: 'notSelected', materials: [] }],
      grade: null,
    });

    expect(textOf(element(fixture))).not.toContain('Experimental effect');
  });

  it('keeps Merc Coin out of every material list', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [MATERIAL] }],
      grade: 5,
      mercCoin: '120',
    });

    const coinList = query(fixture, '.materials__list--coin');
    expect(textOf(coinList)).toContain('Merc Coins');
    expect(textOf(coinList)).toContain('120');
    // It has no material or credit equivalent, so it never joins the fold.
    expect(textOf(query(fixture, '.materials__part'))).not.toContain('Merc');
  });

  it('says a purchased article’s baked engineering was never crafted', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [],
      grade: null,
      fixedPurchase: true,
    });

    expect(textOf(element(fixture))).toContain('arrived already modified');
  });
});

describe('power controls', () => {
  const NAMES = { slotLabel: 'Core · Size 8', moduleLabel: 'Power Plant 8A' };

  it('names both the module and its mount, so forty rows stay distinguishable', () => {
    const fixture = renderComponent(PowerControls, { ...NAMES, enabled: true, priority: 2 });

    expect(accessibleName(query(fixture, '.power__toggle'))).toBe(
      'Power Plant 8A in Core · Size 8 is powered',
    );
    expect(accessibleName(query(fixture, '.power__priority'))).toBe(
      'Power priority for Power Plant 8A in Core · Size 8',
    );
  });

  it('presents the package’s zero-based group one-based, as the game does', () => {
    const fixture = renderComponent(PowerControls, { ...NAMES, priority: 0 });

    const options = queryAll(fixture, 'option');
    // Bare numbers, because the chip the canvas draws holds a number and no
    // word beside it. The control's name says what the number is.
    expect(options.map((option) => textOf(option))).toEqual(['1', '2', '3', '4', '5']);
    // The package's 0 is the Commander's 1.
    expect(options[0]?.getAttribute('value')).toBe('0');
  });

  it('emits the package’s own number, not the one on screen', () => {
    const fixture = renderComponent(PowerControls, { ...NAMES, priority: 0 });
    const emitted: unknown[] = [];
    fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));

    const select = query(fixture, '.power__priority') as HTMLSelectElement;
    select.value = '4';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([{ kind: 'setPriority', priority: 4 }]);
  });

  it('leaves an absent group absent rather than choosing one', () => {
    const fixture = renderComponent(PowerControls, { ...NAMES, priority: undefined });
    const emitted: unknown[] = [];
    fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));

    const select = query(fixture, '.power__priority') as HTMLSelectElement;
    // Not group 1. The package stated no group, so the control states none —
    // it says the value is unavailable, and that option cannot be chosen back
    // because there is no package operation that unsets a group (FR-014).
    expect(select.value).toBe('');
    expect(textOf(select.options[0]!)).toBe('Unavailable');
    expect(select.options[0]!.disabled).toBe(true);

    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual([]);
  });

  it('reads an absent power field as on, the way the package does', () => {
    const fixture = renderComponent(PowerControls, { ...NAMES, enabled: undefined });

    expect((query(fixture, '.power__toggle') as HTMLInputElement).checked).toBe(true);
  });

  it('draws only what the package permits on this mount', () => {
    const fixture = renderComponent(PowerControls, {
      ...NAMES,
      canSetEnabled: false,
      canSetPriority: true,
    });

    expect(element(fixture).querySelector('.power__toggle')).toBeNull();
    expect(element(fixture).querySelector('.power__priority')).not.toBeNull();
  });
});

describe('ingress refusal notice', () => {
  const FAILURE = {
    source: {
      slotKey: 'MainEngines',
      moduleSymbol: 'Int_Engine_Size7_Class5',
      blueprintFdname: 'Engine_Dirty',
      effectFdname: null,
      grade: 5,
      quality: 0.42,
    },
    reason: 'packageResult',
    code: 'unsupportedEngineering',
    params: null,
  };

  it('names every affected mount, module, roll and package reason', () => {
    const fixture = renderComponent(IngressRefusalNotice, {
      failures: [FAILURE],
      revision: 3,
      slotLabels: { MainEngines: 'Thrusters' },
    });

    const text = textOf(element(fixture));
    expect(text).toContain('Thrusters');
    expect(text).toContain('Int_Engine_Size7_Class5');
    expect(text).toContain('42%');
    expect(text).toContain('unsupportedEngineering');
    expect(text).toContain('Engine_Dirty');
  });

  it('says the build was never activated', () => {
    const fixture = renderComponent(IngressRefusalNotice, { failures: [FAILURE], revision: 3 });

    expect(textOf(element(fixture)).toLowerCase()).toContain('exactly as it was');
  });

  it('renders nothing when nothing was refused', () => {
    const fixture = renderComponent(IngressRefusalNotice, { failures: [], revision: 3 });

    expect(element(fixture).querySelector('.notice')).toBeNull();
  });
});

/** Every match, since the shared helpers only expose the first. */
function queryAll<T>(fixture: ComponentFixture<T>, selector: string): HTMLElement[] {
  return [...element(fixture).querySelectorAll<HTMLElement>(selector)];
}

describe('ship identity fields', () => {
  const NAMED = {
    name: 'Pacifier',
    fallbackName: 'Build',
    detail: 'Anaconda',
    ident: 'FD-11X',
    editing: null,
  };

  it('draws the name as the bar’s own title, with a pencil beside it', () => {
    const fixture = renderComponent(ShipIdentityFields, NAMED);

    expect(query(fixture, 'h1').textContent?.trim()).toBe('Pacifier');
    // The glyph is decoration; the control's whole name is words.
    expect(accessibleName(query(fixture, '.identity-fields__pencil'))).toBe('Rename the ship');
  });

  it('reads as the screen it is on when the build has no name', () => {
    const fixture = renderComponent(ShipIdentityFields, { ...NAMED, name: null });

    expect(query(fixture, 'h1').textContent?.trim()).toBe('Build');
  });

  it('names the ID plate control with the plate it is showing', () => {
    const fixture = renderComponent(ShipIdentityFields, NAMED);

    // The plate is visible text on the control, so it has to be in the name.
    expect(accessibleName(query(fixture, '.identity-fields__ident'))).toContain('FD-11X');
  });

  it('draws no plate where the package has none', () => {
    const fixture = renderComponent(ShipIdentityFields, { ...NAMED, ident: null });

    expect(element(fixture).querySelector('.identity-fields__plate')).toBeNull();
    expect(accessibleName(query(fixture, '.identity-fields__ident'))).toBe('Change the ship ID');
  });

  it('commits what was typed, once, on an explicit confirm', () => {
    const fixture = renderComponent(ShipIdentityFields, { ...NAMED, editing: 'name' });
    const committed: unknown[] = [];
    fixture.componentInstance.committed.subscribe((commit) => committed.push(commit));

    const field = query(fixture, '.identity-fields__input') as HTMLInputElement;
    field.value = '  Pacifier II  ';
    (query(fixture, '.identity-fields__confirm') as HTMLButtonElement).click();

    // Trimmed, because the surrounding spaces are not part of the name.
    expect(committed).toEqual([{ field: 'name', value: 'Pacifier II' }]);
  });

  it('clears to absence rather than to an empty string', () => {
    const fixture = renderComponent(ShipIdentityFields, { ...NAMED, editing: 'ident' });
    const committed: unknown[] = [];
    fixture.componentInstance.committed.subscribe((commit) => committed.push(commit));

    const field = query(fixture, '.identity-fields__input') as HTMLInputElement;
    field.value = '   ';
    (query(fixture, '.identity-fields__confirm') as HTMLButtonElement).click();
    (query(fixture, '.identity-fields__quiet') as HTMLButtonElement).click();

    // Whitespace alone is absence, and so is the clear action. A build with an
    // empty name and a build with none are different builds (constitution IV).
    expect(committed).toEqual([
      { field: 'ident', value: null },
      { field: 'ident', value: null },
    ]);
  });

  it('asks to be opened rather than opening itself', () => {
    const fixture = renderComponent(ShipIdentityFields, NAMED);
    const opened: unknown[] = [];
    fixture.componentInstance.opened.subscribe((field) => opened.push(field));

    (query(fixture, '.identity-fields__pencil') as HTMLButtonElement).click();
    (query(fixture, '.identity-fields__ident') as HTMLButtonElement).click();

    expect(opened).toEqual(['name', 'ident']);
  });
});
