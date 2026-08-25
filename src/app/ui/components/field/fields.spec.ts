import { ChoiceGroup } from '../choice-group/choice-group';
import { RangeField } from '../range-field/range-field';
import { SelectField } from '../select-field/select-field';
import { TextField } from '../text-field/text-field';
import { TextareaField } from '../textarea-field/textarea-field';
import {
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from '../ui-component.spec-helpers';

describe('TextField', () => {
  it('associates the visible label with the control', () => {
    const fixture = renderComponent(TextField, { label: 'Build name' });
    const label = query(fixture, 'label');
    const input = query(fixture, 'input');

    expect(textOf(label)).toBe('Build name');
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
  });

  it('associates a description with the control', () => {
    const fixture = renderComponent(TextField, {
      label: 'Build name',
      description: 'Shown in saved builds.',
    });

    expect(describedText(query(fixture, 'input'))).toContain('Shown in saved builds.');
  });

  it('associates an error with the control and exposes the invalid state', () => {
    const fixture = renderComponent(TextField, {
      label: 'Build name',
      error: 'Enter a name for this build.',
    });
    const input = query(fixture, 'input');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(input)).toContain('Enter a name for this build.');
  });

  it('is not invalid when there is no error', () => {
    const fixture = renderComponent(TextField, { label: 'Build name' });

    expect(query(fixture, 'input').getAttribute('aria-invalid')).toBeNull();
  });

  it('puts the error after the description, so it is heard last', () => {
    const fixture = renderComponent(TextField, {
      label: 'Build name',
      description: 'A description.',
      error: 'An error.',
    });
    const described = describedText(query(fixture, 'input'));

    expect(described.indexOf('A description.')).toBeLessThan(described.indexOf('An error.'));
  });

  it('never uses a placeholder as the label', () => {
    const fixture = renderComponent(TextField, {
      label: 'Build name',
      placeholder: 'e.g. Anaconda explorer',
    });
    const input = query(fixture, 'input');

    expect(input.getAttribute('placeholder')).toBe('e.g. Anaconda explorer');
    expect(query(fixture, 'label')).toBeTruthy();
    expect(input.getAttribute('aria-label')).toBeNull();
  });

  it('exposes the required and busy states', () => {
    const fixture = renderComponent(TextField, { label: 'Build name', required: true, busy: true });
    const input = query(fixture, 'input');

    expect(input.getAttribute('aria-required')).toBe('true');
    expect(input.getAttribute('aria-busy')).toBe('true');
  });

  it('emits the new value on input', () => {
    const fixture = renderComponent(TextField, { label: 'Build name' });
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push(value));

    const input = query(fixture, 'input') as HTMLInputElement;
    input.value = 'Krait';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['Krait']);
  });

  it('renders a search field when asked', () => {
    const fixture = renderComponent(TextField, { label: 'Search', kind: 'search' });

    expect(query(fixture, 'input').getAttribute('type')).toBe('search');
  });

  it('gives each instance its own relationship ids', () => {
    const first = renderComponent(TextField, { label: 'A' });
    const second = renderComponent(TextField, { label: 'B' });

    expect(query(first, 'input').getAttribute('id')).not.toBe(
      query(second, 'input').getAttribute('id'),
    );
  });
});

describe('SelectField', () => {
  const options = [
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
  ];

  it('associates the label with the control and renders every option', () => {
    const fixture = renderComponent(SelectField, { label: 'Language', options });

    expect(query(fixture, 'label').getAttribute('for')).toBe(
      query(fixture, 'select').getAttribute('id'),
    );
    expect(element(fixture).querySelectorAll('option').length).toBe(2);
  });

  it('marks the selected option', () => {
    const fixture = renderComponent(SelectField, { label: 'Language', options, value: 'de' });
    const selected = element(fixture).querySelector<HTMLOptionElement>('option[value="de"]');

    expect(selected?.selected).toBe(true);
  });

  it('renders with no options without losing its label', () => {
    const fixture = renderComponent(SelectField, { label: 'Language', options: [] });

    expect(textOf(query(fixture, 'label'))).toBe('Language');
    expect(element(fixture).querySelectorAll('option').length).toBe(0);
  });

  it('associates an error and exposes the invalid state', () => {
    const fixture = renderComponent(SelectField, {
      label: 'Language',
      options,
      error: 'Choose a language.',
    });
    const select = query(fixture, 'select');

    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(select)).toContain('Choose a language.');
  });

  it('emits the chosen value', () => {
    const fixture = renderComponent(SelectField, { label: 'Language', options });
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push(value));

    const select = query(fixture, 'select') as HTMLSelectElement;
    select.value = 'de';
    select.dispatchEvent(new Event('change'));

    expect(emitted).toEqual(['de']);
  });

  it('disables an individual option without disabling the control', () => {
    const fixture = renderComponent(SelectField, {
      label: 'Language',
      options: [{ value: 'fr', label: 'Français', disabled: true }],
    });

    expect(element(fixture).querySelector<HTMLOptionElement>('option')?.disabled).toBe(true);
    expect((query(fixture, 'select') as HTMLSelectElement).disabled).toBe(false);
  });
});

describe('RangeField', () => {
  const slider = { label: 'Range', min: 100, max: 2000, step: 25, value: 600, valueText: '600 m' };

  it('associates the visible label with the control', () => {
    const fixture = renderComponent(RangeField, slider);
    const label = query(fixture, 'label');
    const input = query(fixture, 'input');

    expect(textOf(label)).toBe('Range');
    expect(label.getAttribute('for')).toBe(input.getAttribute('id'));
    expect(input.getAttribute('type')).toBe('range');
  });

  it('announces the value as it is written, not as a bare number', () => {
    const fixture = renderComponent(RangeField, slider);
    const input = query(fixture, 'input') as HTMLInputElement;

    // The slider reports `600`; a Commander reads `600 m`. Both have to say
    // the same thing, so the formatted string is what is announced.
    expect(input.value).toBe('600');
    expect(input.getAttribute('aria-valuetext')).toBe('600 m');
    expect(textOf(query(fixture, 'output'))).toBe('600 m');
  });

  it('associates a description with the control', () => {
    const fixture = renderComponent(RangeField, {
      ...slider,
      description: 'The range the gunsight is drawn at.',
    });

    expect(describedText(query(fixture, 'input'))).toContain('The range the gunsight is drawn at.');
  });

  it('emits the number the Commander moved it to', () => {
    const moved: number[] = [];
    const fixture = renderComponent(RangeField, slider);
    fixture.componentInstance.changed.subscribe((value: number) => moved.push(value));

    const input = query(fixture, 'input') as HTMLInputElement;
    input.value = '1200';
    input.dispatchEvent(new Event('input'));

    expect(moved).toEqual([1200]);
  });

  it('draws the fill from where the value sits on its own scale', () => {
    const fixture = renderComponent(RangeField, { ...slider, value: 1050 });

    // Halfway between 100 and 2000.
    expect(fixture.componentInstance.fraction()).toBeCloseTo(0.5, 9);
  });

  it('keeps the ends of the scale out of the announcement, because the slider states them', () => {
    const fixture = renderComponent(RangeField, {
      ...slider,
      minText: '100 m',
      maxText: '2,000 m',
    });
    const scale = query(fixture, '.range__scale');

    expect(scale.getAttribute('aria-hidden')).toBe('true');
    expect(describedText(query(fixture, 'input'))).not.toContain('2,000 m');
  });

  it('exposes the disabled state natively', () => {
    const fixture = renderComponent(RangeField, { ...slider, disabled: true });

    expect((query(fixture, 'input') as HTMLInputElement).disabled).toBe(true);
  });
});

describe('TextareaField', () => {
  it('associates the label, description and error', () => {
    const fixture = renderComponent(TextareaField, {
      label: 'SLEF payload',
      description: 'Paste the payload here.',
      error: 'This is not valid SLEF.',
    });
    const control = query(fixture, 'textarea');

    expect(query(fixture, 'label').getAttribute('for')).toBe(control.getAttribute('id'));
    expect(describedText(control)).toContain('Paste the payload here.');
    expect(describedText(control)).toContain('This is not valid SLEF.');
    expect(control.getAttribute('aria-invalid')).toBe('true');
  });

  it('emits the new value on input', () => {
    const fixture = renderComponent(TextareaField, { label: 'SLEF payload' });
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push(value));

    const control = query(fixture, 'textarea') as HTMLTextAreaElement;
    control.value = '{}';
    control.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['{}']);
  });

  it('honours the requested row count', () => {
    const fixture = renderComponent(TextareaField, { label: 'SLEF payload', rows: 8 });

    expect(query(fixture, 'textarea').getAttribute('rows')).toBe('8');
  });

  it('marks a technical payload monospaced and direction-isolated', () => {
    const fixture = renderComponent(TextareaField, { label: 'SLEF payload', technical: true });
    const control = query(fixture, 'textarea');

    expect(control.classList.contains('field__control--technical')).toBe(true);
    expect(control.hasAttribute('data-bidi-isolate')).toBe(true);
  });

  it('keeps a readonly payload selectable rather than disabling it', () => {
    const fixture = renderComponent(TextareaField, {
      label: 'SLEF payload',
      value: '[]',
      readonly: true,
    });
    const control = query(fixture, 'textarea') as HTMLTextAreaElement;

    expect(control.readOnly).toBe(true);
    expect(control.disabled).toBe(false);
  });
});

describe('ChoiceGroup', () => {
  const choices = [
    { value: 'laden', label: 'Laden' },
    { value: 'unladen', label: 'Unladen', description: 'No cargo and no fuel.' },
  ];

  it('groups the choices under a legend that names the question', () => {
    const fixture = renderComponent(ChoiceGroup, { legend: 'Measured under', choices });

    expect(query(fixture, 'fieldset')).toBeTruthy();
    expect(textOf(query(fixture, 'legend'))).toBe('Measured under');
  });

  it('associates each label with its own control', () => {
    const fixture = renderComponent(ChoiceGroup, { legend: 'Measured under', choices });
    const labels = element(fixture).querySelectorAll('label');
    const inputs = element(fixture).querySelectorAll('input');

    expect(labels.length).toBe(2);
    labels.forEach((label, index) => {
      expect(label.getAttribute('for')).toBe(inputs[index]?.getAttribute('id'));
    });
  });

  it('associates a choice description with that choice', () => {
    const fixture = renderComponent(ChoiceGroup, { legend: 'Measured under', choices });
    const inputs = element(fixture).querySelectorAll<HTMLElement>('input');

    expect(describedText(inputs[1] as HTMLElement)).toContain('No cargo and no fuel.');
    expect(inputs[0]?.getAttribute('aria-describedby')).toBeNull();
  });

  it('binds a radio group together by name so only one can be chosen', () => {
    const fixture = renderComponent(ChoiceGroup, { legend: 'Measured under', choices });
    const names = [...element(fixture).querySelectorAll('input')].map((input) =>
      input.getAttribute('name'),
    );

    expect(new Set(names).size).toBe(1);
    expect(names[0]).not.toBeNull();
  });

  it('does not bind checkboxes by name, because they are independent', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Filters',
      kind: 'checkbox',
      choices,
    });

    expect(element(fixture).querySelector('input')?.getAttribute('name')).toBeNull();
  });

  it('exposes a switch with its role and checked state', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Show empty slots',
      kind: 'switch',
      choices: [{ value: 'on', label: 'Show empty slots' }],
      selected: ['on'],
    });
    const input = query(fixture, 'input');

    expect(input.getAttribute('role')).toBe('switch');
    expect(input.getAttribute('aria-checked')).toBe('true');
  });

  it('replaces the selection for a single-choice group', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Measured under',
      choices,
      selected: ['laden'],
    });
    const emitted: string[][] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push([...value]));

    fixture.componentInstance.toggle('unladen');

    expect(emitted).toEqual([['unladen']]);
  });

  it('adds to the selection for a multiple-choice group', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Filters',
      kind: 'checkbox',
      choices,
      selected: ['laden'],
    });
    const emitted: string[][] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push([...value]));

    fixture.componentInstance.toggle('unladen');

    expect(emitted).toEqual([['laden', 'unladen']]);
  });

  it('removes from the selection when a chosen checkbox is toggled off', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Filters',
      kind: 'checkbox',
      choices,
      selected: ['laden', 'unladen'],
    });
    const emitted: string[][] = [];
    fixture.componentInstance.changed.subscribe((value) => emitted.push([...value]));

    fixture.componentInstance.toggle('laden');

    expect(emitted).toEqual([['unladen']]);
  });

  it('emits nothing while the group is disabled', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Measured under',
      choices,
      disabled: true,
    });
    let emissions = 0;
    fixture.componentInstance.changed.subscribe(() => (emissions += 1));

    fixture.componentInstance.toggle('laden');

    expect(emissions).toBe(0);
  });

  it('associates a group-level error and exposes the invalid state', () => {
    const fixture = renderComponent(ChoiceGroup, {
      legend: 'Measured under',
      choices,
      error: 'Choose a measurement condition.',
    });
    const group = query(fixture, 'fieldset');

    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(describedText(group)).toContain('Choose a measurement condition.');
  });
});
