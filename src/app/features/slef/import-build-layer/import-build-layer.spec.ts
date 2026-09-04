import {
  element,
  query,
  renderComponent,
  textOf,
} from '../../../ui/components/ui-component.spec-helpers';
import type { SlefImportView } from '../../../application/slef/slef.presenter';
import { ImportBuildLayer } from './import-build-layer';

const BASE: SlefImportView = {
  title: 'Import build',
  description: 'Paste a SLEF export or a journal Loadout event.',
  accepted: 'SLEF v1 · Journal Loadout event',
  fieldLabel: 'SLEF payload',
  draft: '',
  status: 'Awaiting input',
  busy: false,
  failure: null,
  submitLabel: 'Load build',
  cancelLabel: 'Cancel',
  canSubmit: false,
};

function view(overrides: Partial<SlefImportView> = {}): SlefImportView {
  return { ...BASE, ...overrides };
}

function render(overrides: Partial<SlefImportView> = {}) {
  return renderComponent(ImportBuildLayer, { view: view(overrides) });
}

describe('the import layer', () => {
  it('draws the description, the field and the one status line', () => {
    const fixture = render();

    expect(textOf(query(fixture, '.slef-import__description'))).toBe(BASE.description);
    expect(textOf(query(fixture, '.slef-import__status'))).toBe('Awaiting input');
    expect(query(fixture, 'textarea')).toBeDefined();
  });

  it('gives the payload field a visible label and a monospaced technical mode', () => {
    const fixture = render();
    const field = query(fixture, 'textarea');

    expect(field.getAttribute('readonly')).toBeNull();
    expect(field.className).toContain('technical');
    expect(textOf(element(fixture).querySelector('label'))).toContain('SLEF payload');
  });

  it('refuses to submit an empty draft, and offers to submit a filled one', () => {
    expect(query(render(), 'button.action--primary').hasAttribute('disabled')).toBe(true);
    expect(
      query(render({ draft: '{}', canSubmit: true }), 'button.action--primary').hasAttribute(
        'disabled',
      ),
    ).toBe(false);
  });

  it('says a refusal in words, beside the field it is about', () => {
    const fixture = render({
      draft: '{',
      failure: {
        message: 'This is not valid JSON, so the Almanac could not read it.',
        diagnostics: [],
        advancedLabel: 'Show advanced',
        diagnosticsLabel: 'What the Almanac rejected',
        refusals: [],
      },
    });

    expect(textOf(element(fixture))).toContain('not valid JSON');
    // The field carries the error too, so a reader on the control hears it.
    expect(query(fixture, 'textarea').getAttribute('aria-invalid')).toBe('true');
  });

  it('lists the Almanac’s own diagnostics rather than summarising them', () => {
    const fixture = render({
      failure: {
        message: 'The Almanac rejected this entry.',
        advancedLabel: 'Show advanced',
        diagnosticsLabel: 'What the Almanac rejected',
        refusals: [],
        diagnostics: [
          {
            id: '0:entries[0].Ship:0',
            index: '0',
            path: 'entries[0].Ship',
            code: 'invalidLoadout',
            constraint: 'stringRequired',
            reason: 'Ship must be a string.',
            disclosure: null,
            reasonLanguage: 'en',
          },
        ],
      },
    });

    const list = query(fixture, 'ednb-diagnostic-list');
    expect(textOf(list)).toContain('entries[0].Ship');
    expect(textOf(list)).toContain('invalidLoadout');
  });

  it('names each refused roll, one line each', () => {
    const fixture = render({
      failure: {
        message: 'The Almanac cannot complete the engineering on 2 of these modules.',
        diagnostics: [],
        advancedLabel: 'Show advanced',
        diagnosticsLabel: 'What the Almanac rejected',
        refusals: ['MainEngines · Thrusters · 42% · unsupportedEngineering', 'FrameShiftDrive · …'],
      },
    });

    expect(element(fixture).querySelectorAll('.slef-import__refusals li')).toHaveLength(2);
  });

  it('keeps a refusal’s detail behind one control, closed until it is asked for', () => {
    const fixture = render({
      failure: {
        message: 'This entry was refused.',
        advancedLabel: 'Show advanced',
        diagnosticsLabel: 'What was refused',
        refusals: ['MainEngines · Thrusters · 42% · unsupportedEngineering'],
        diagnostics: [],
      },
    });
    const trigger = query(fixture, '.disclosure__trigger');
    const content = query(fixture, '.disclosure__content');

    expect(textOf(trigger)).toBe('Show advanced');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(content.hasAttribute('hidden')).toBe(true);
    // The sentence itself is not behind it: a refusal is answered before a
    // Commander presses anything.
    expect(textOf(element(fixture))).toContain('This entry was refused.');

    trigger.click();
    fixture.detectChanges();

    expect(query(fixture, '.disclosure__trigger').getAttribute('aria-expanded')).toBe('true');
    expect(query(fixture, '.disclosure__content').hasAttribute('hidden')).toBe(false);
  });

  it('draws no control for a refusal that has no detail to open', () => {
    const fixture = render({
      failure: {
        message: 'There is nothing here to import yet.',
        advancedLabel: 'Show advanced',
        diagnosticsLabel: 'What was refused',
        refusals: [],
        diagnostics: [],
      },
    });

    expect(element(fixture).querySelector('ednb-disclosure')).toBeNull();
  });

  it('reads the payload field’s name without drawing it', () => {
    const fixture = render();
    const label = query(fixture, 'label.field__label');

    // Still the control's accessible name, and still out of the way: neither
    // exchange canvas draws a label over the payload.
    expect(textOf(label)).toBe('SLEF payload');
    expect(label.getAttribute('for')).toBe(query(fixture, 'textarea').getAttribute('id'));
    expect(label.className).toContain('field__label--hidden');
  });

  it('draws no Clear control and no candidate panel, because the canvas draws neither', () => {
    const fixture = render({ draft: '{}', canSubmit: true });
    const labels = [...element(fixture).querySelectorAll('button')].map((button) =>
      textOf(button).toLowerCase(),
    );

    expect(labels).toEqual(['cancel', 'load build']);
  });

  it('emits intents and decides nothing', () => {
    const fixture = render({ draft: '{}', canSubmit: true });
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((text) => emitted.push(`changed:${text}`));
    fixture.componentInstance.submitted.subscribe(() => emitted.push('submitted'));
    fixture.componentInstance.cancelled.subscribe(() => emitted.push('cancelled'));

    const field = query(fixture, 'textarea') as HTMLTextAreaElement;
    field.value = '[]';
    field.dispatchEvent(new Event('input'));
    query(fixture, 'button.action--primary').click();
    query(fixture, 'button.action--secondary').click();

    expect(emitted).toEqual(['changed:[]', 'submitted', 'cancelled']);
  });
});
