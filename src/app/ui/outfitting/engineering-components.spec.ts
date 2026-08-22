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
import { MaterialCostList, sortMaterialLines } from './material-cost-list';
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
    // The name and nothing else: neither canvas writes a line under it.
    expect(textOf(options[0]!)).toContain('None');
  });

  it('offers no separate clear control anywhere', () => {
    const fixture = renderComponent(BlueprintChoiceList, { choices: CHOICES });

    expect(queryAll(fixture, 'button')).toHaveLength(0);
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
  it('stripes the grades below the one a recipe starts at, and keeps them pressable', () => {
    // A bespoke Mercenary recipe starts at the grade the article was bought
    // at. The cells below it are still drawn — the article carries them — and
    // refused, so the bar never says the article is a grade short (wave 4).
    const fixture = renderComponent(GradeSelector, {
      grades: [1, 2, 3, 4, 5],
      lowest: 2,
      selected: 5,
    });

    const cells = queryAll(fixture, '.grade');
    expect(cells).toHaveLength(5);
    // Striped, not refused: an article bought at grade 2 can still be taken
    // back down to 1, so the cell has to be pressable (wave 5).
    expect(cells[0]!.getAttribute('data-unavailable')).toBe('true');
    expect((cells[0]!.querySelector('input') as HTMLInputElement).disabled).toBe(false);
    expect(cells[1]!.getAttribute('data-unavailable')).toBe('false');
  });

  it('names each cell, so a bare number is never the whole label', () => {
    const fixture = renderComponent(GradeSelector, { grades: [1, 2], selected: 1 });

    expect(accessibleName(query(fixture, '.grade__radio'))).toBe('Grade 1');
  });

  it('states the chosen grade beside the label, not by the fill alone', () => {
    const fixture = renderComponent(GradeSelector, { grades: [1, 2, 3], selected: 3 });

    // The number is beside the legend, not inside the cells: the canvas draws
    // the bar bare, and every cell still names its own grade to a reader.
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
    expect(textOf(options[0]!)).toContain('None');
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

  it('marks a direction the canvas’s way, and never by colour alone', () => {
    const fixture = renderComponent(AttributeComparison, {
      rows: [
        { ...ROWS[0]!, direction: 'better' },
        {
          key: 'thermalLoad',
          label: 'Thermal load',
          stock: '0.33',
          modified: '0.41',
          direction: 'worse',
        },
      ],
    });

    const cells = queryAll(fixture, '.comparison__value--modified');
    expect(cells[0]!.getAttribute('data-direction')).toBe('better');
    expect(textOf(cells[0]!)).toContain('▲');
    expect(textOf(cells[0]!)).toContain('Improved');
    expect(cells[1]!.getAttribute('data-direction')).toBe('worse');
    expect(textOf(cells[1]!)).toContain('▼');
    expect(textOf(cells[1]!)).toContain('Worsened');
  });

  it('marks nothing where either side is unpublished', () => {
    const fixture = renderComponent(AttributeComparison, { rows: ROWS });

    const text = textOf(element(fixture));
    expect(text).not.toContain('▲');
    expect(text).not.toContain('▼');
  });
});

/**
 * The one order both material lists are read in.
 *
 * The Engineer panel and the status rail draw the same materials for the same
 * build, so they share this comparator rather than each having one — ruling G,
 * `specs/009-cost-and-materials/design/reference-review.md`.
 */
describe('material line order', () => {
  const line = (symbol: string, grade: number | null, text: string | null = symbol) => ({
    symbol,
    name: { ...named(''), text } as GameTextPresentation,
    grade,
    count: '1',
  });
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const symbols = (lines: readonly { readonly symbol: string }[]) =>
    lines.map((entry) => entry.symbol);

  it('puts the commonest rarity first', () => {
    const sorted = sortMaterialLines(
      [line('Tungsten', 4), line('Iron', 1), line('Zinc', 2)],
      collator,
    );

    expect(symbols(sorted)).toEqual(['Iron', 'Zinc', 'Tungsten']);
  });

  it('sorts a material the package grades no rarity for last', () => {
    // An unknown rarity is not a common one. Sorting `null` as zero would head
    // the shopping list with the material a Commander knows least about.
    const sorted = sortMaterialLines(
      [line('Unknown', null), line('Tungsten', 4), line('Iron', 1)],
      collator,
    );

    expect(symbols(sorted)).toEqual(['Iron', 'Tungsten', 'Unknown']);
  });

  it('breaks a rarity tie with the collator it is given', () => {
    // Names that order one way under the application's collator and the other
    // way under a bare `localeCompare`. The collator is numeric-aware, so it
    // reads the digits as numbers; string comparison puts `10` before `2`.
    const sorted = sortMaterialLines([line('B', 2, 'Item 10'), line('A', 2, 'Item 2')], collator);

    // Proves the passed collator is the one doing the work. `localeCompare`
    // with no locale reads the *browser's* language, which is a different one
    // from the language on screen whenever a Commander has chosen one — the
    // drift this comparator was extracted to end.
    expect('Item 10'.localeCompare('Item 2')).toBeLessThan(0);
    expect(symbols(sorted)).toEqual(['A', 'B']);
  });

  it('falls back to the symbol for a material the package cannot name', () => {
    const sorted = sortMaterialLines([line('Zinc', 3, null), line('Iron', 3, null)], collator);

    // Two nameless rows would otherwise compare equal and order differently on
    // each render. The symbol is the row's own identity and the only other
    // stable thing about it.
    expect(symbols(sorted)).toEqual(['Iron', 'Zinc']);
  });

  it('leaves the caller’s list alone', () => {
    const given = [line('Tungsten', 4), line('Iron', 1)];

    sortMaterialLines(given, collator);

    expect(symbols(given)).toEqual(['Tungsten', 'Iron']);
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

  it('carries the design’s own rarity mark, served from this origin', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [MATERIAL] }],
      grade: 5,
    });

    // The design's own file for the package's own grade, and the grade said in
    // words beside it for anyone who cannot see the mark (wave 6).
    expect(query(fixture, '.material-grade').getAttribute('src')).toBe(
      'assets/icons/materials/grade-4.svg',
    );
    expect(textOf(query(fixture, '.material__grade'))).toContain('Grade 4');
    // Nothing here reaches another origin at runtime (constitution I).
    for (const image of element(fixture).querySelectorAll('img')) {
      expect(image.getAttribute('src')).toMatch(/^assets\//);
    }
  });

  it('reads an unpriced job as unpriced, not as a free one', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [] }],
      grade: 3,
    });

    // Engineering always costs materials. An empty list from the package is the
    // package failing to price a job, and the row says so rather than reading
    // as a free upgrade (wave 5).
    const text = textOf(element(fixture));
    expect(text).toContain('No materials are priced');
    expect(text).not.toContain('No material cost is published');
  });

  it('shows an unavailable cost as unavailable, never as a zero', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'unavailable', materials: [] }],
      grade: 3,
    });

    const text = textOf(element(fixture));
    expect(text).toContain('No material cost is published');
    expect(text).not.toContain('No materials are priced');
  });

  it('draws nothing for a part nothing is selected for', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'experimental', state: 'notSelected', materials: [] }],
      grade: null,
    });

    expect(textOf(element(fixture))).not.toContain('Experimental effect');
  });

  it('says nothing about Merc Coin at all', () => {
    const fixture = renderComponent(MaterialCostList, {
      parts: [{ part: 'blueprint', state: 'known', materials: [MATERIAL] }],
      grade: 5,
    });

    // A shopping list for a job, and nothing else. The article's shop price is
    // what it cost to buy rather than what this job costs, and standing at the
    // foot of this list it read as the price of the engineering above it
    // (wave 9).
    expect(textOf(element(fixture))).not.toContain('Merc');
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
    // A mark, not a word: the canvas draws one digit in this chip. The
    // absence is spelled out in the control's own name instead (wave 4).
    expect(textOf(select.options[0]!)).toBe('—');
    expect(accessibleName(select)).toContain('no group published');
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
    // The title is the control, as the canvas draws it. The glyph is
    // decoration; the control's whole name is words.
    // The name a Commander reads aloud is the title on it, and what the control
    // does comes after — an `aria-label` would replace the one with the other
    // (WCAG 2.5.3).
    const name = accessibleName(query(fixture, '.identity-fields__open--name'));
    expect(name).toContain('Pacifier');
    expect(name).toContain('Rename the ship');
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

  it('commits what was typed on leaving the field, with no control beside it', () => {
    const fixture = renderComponent(ShipIdentityFields, { ...NAMED, editing: 'name' });
    const committed: unknown[] = [];
    fixture.componentInstance.committed.subscribe((commit) => committed.push(commit));

    // The canvas draws no Save, Clear or Cancel anywhere near the title.
    expect(query(fixture, '.identity-fields__line').querySelectorAll('button')).toHaveLength(0);

    const field = query(fixture, '.identity-fields__input') as HTMLInputElement;
    field.value = '  Pacifier II  ';
    field.dispatchEvent(new Event('change'));

    // Trimmed, because the surrounding spaces are not part of the name.
    expect(committed).toEqual([{ field: 'name', value: 'Pacifier II' }]);
  });

  it('clears to absence rather than to an empty string', () => {
    const fixture = renderComponent(ShipIdentityFields, { ...NAMED, editing: 'ident' });
    const committed: unknown[] = [];
    fixture.componentInstance.committed.subscribe((commit) => committed.push(commit));

    const field = query(fixture, '.identity-fields__input') as HTMLInputElement;
    field.value = '   ';
    field.dispatchEvent(new Event('change'));

    // Whitespace alone is absence: emptying the field is how a plate is taken
    // off. A build with an empty name and a build with none are different
    // builds (constitution IV).
    expect(committed).toEqual([{ field: 'ident', value: null }]);
  });

  it('asks to be opened rather than opening itself', () => {
    const fixture = renderComponent(ShipIdentityFields, NAMED);
    const opened: unknown[] = [];
    fixture.componentInstance.opened.subscribe((field) => opened.push(field));

    (query(fixture, '.identity-fields__open--name') as HTMLButtonElement).click();
    (query(fixture, '.identity-fields__ident') as HTMLButtonElement).click();

    expect(opened).toEqual(['name', 'ident']);
  });
});
