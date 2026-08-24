import { DiagnosticList, type DiagnosticEntry } from './diagnostic-list';
import { element, query, renderComponent, textOf } from '../components/ui-component.spec-helpers';

const DIAGNOSTIC: DiagnosticEntry = {
  id: '1',
  index: '1',
  path: 'entries[1].header.appName',
  code: 'invalidHeader',
  constraint: 'stringRequired',
  reason: 'entries[1].header.appName must be a string',
  disclosure: null,
  reasonLanguage: 'en',
};

describe('DiagnosticList', () => {
  it('renders one list item per diagnostic, under a name', () => {
    const fixture = renderComponent(DiagnosticList, {
      label: 'What the Almanac rejected',
      diagnostics: [DIAGNOSTIC, { ...DIAGNOSTIC, id: '2', index: '2' }],
    });

    const list = query(fixture, 'ul');
    expect(list.getAttribute('aria-label')).toBe('What the Almanac rejected');
    expect(element(fixture).querySelectorAll('li')).toHaveLength(2);
  });

  it('keeps every package field, unrenumbered and unparaphrased', () => {
    const fixture = renderComponent(DiagnosticList, {
      label: 'What the Almanac rejected',
      diagnostics: [DIAGNOSTIC],
    });

    const values = [...element(fixture).querySelectorAll('dd')].map((node) =>
      textOf(node as HTMLElement),
    );

    expect(values).toEqual([
      '1',
      'entries[1].header.appName',
      'invalidHeader',
      'stringRequired',
      'entries[1].header.appName must be a string',
    ]);
  });

  it('isolates every technical value so direction cannot reorder it', () => {
    const fixture = renderComponent(DiagnosticList, {
      label: 'What the Almanac rejected',
      diagnostics: [DIAGNOSTIC],
    });

    expect(element(fixture).querySelectorAll('[data-bidi-isolate]')).toHaveLength(4);
  });

  it('discloses the canonical language when the package had no translation', () => {
    const fixture = renderComponent(DiagnosticList, {
      label: 'What the Almanac rejected',
      diagnostics: [{ ...DIAGNOSTIC, disclosure: 'Shown in English.' }],
    });

    expect(textOf(query(fixture, '.diagnostics__disclosure'))).toBe('Shown in English.');
    expect(query(fixture, '.diagnostics__reason').getAttribute('lang')).toBe('en');
  });

  it('renders nothing but an empty list when there are no diagnostics', () => {
    const fixture = renderComponent(DiagnosticList, {
      label: 'What the Almanac rejected',
      diagnostics: [],
    });

    expect(element(fixture).querySelectorAll('li')).toHaveLength(0);
  });
});
