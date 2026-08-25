import { RecordManager, type ManageableRecord } from './record-manager/record-manager';
import { RecordNoteEditor } from './note-editor/record-note-editor';
import { ResponsiveRecordList, type RecordListGroup } from './record-list/responsive-record-list';
import { SavedBuildCard, type SavedBuild } from './saved-build-card/saved-build-card';
import { element, query, renderComponent, textOf } from './ui-component.spec-helpers';

const hull = {
  text: 'Anaconda',
  language: 'en',
  translationState: 'localized',
  disclosureKey: null,
} as const;

function build(overrides: Partial<SavedBuild> = {}): SavedBuild {
  return {
    id: 'r1',
    title: 'Anaconda explorer',
    named: true,
    hull,
    modified: '2 Jan 2026, 03:04',
    validation: { label: 'Valid', tone: 'success' },
    issues: null,
    remaining: null,
    current: false,
    currentLabel: 'Current build',
    chooseLabel: 'Choose Anaconda explorer',
    note: null,
    ...overrides,
  };
}

const COLUMNS = { build: 'Build', hull: 'Hull', modified: 'Edited' } as const;

describe('SavedBuildCard', () => {
  it('shows the title, hull, modified instant and recorded state', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build() });
    const text = textOf(element(fixture));

    expect(text).toContain('Anaconda explorer');
    expect(text).toContain('Anaconda');
    expect(text).toContain('2 Jan 2026, 03:04');
    expect(text).toContain('Valid');
  });

  it('sets a derived title apart from a name a Commander gave', () => {
    const named = renderComponent(SavedBuildCard, { build: build() });
    const derived = renderComponent(SavedBuildCard, {
      build: build({ title: 'Sidewinder', named: false }),
    });

    expect(query(named, '.record__title').classList.contains('record__title--derived')).toBe(false);
    expect(query(derived, '.record__title').classList.contains('record__title--derived')).toBe(
      true,
    );
  });

  it('carries the recorded state in words and not only in colour', () => {
    for (const [validation, expected] of [
      [{ label: 'Invalid', tone: 'error' as const }, 'Invalid'],
      [{ label: 'Incomplete', tone: 'warning' as const }, 'Incomplete'],
    ]) {
      const fixture = renderComponent(SavedBuildCard, {
        build: build({ validation: validation as SavedBuild['validation'] }),
      });

      expect(textOf(element(fixture))).toContain(expected as string);
    }
  });

  it('says the record is the current one in words as well as in the marker', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build({ current: true }) });
    const row = query(fixture, 'button');

    expect(row.getAttribute('aria-current')).toBe('true');
    expect(textOf(element(fixture))).toContain('Current build');
    // Named by its own words rather than by an aria-label over the top of them.
    expect(row.hasAttribute('aria-label')).toBe(false);
  });

  it('draws no marker on a record the workspace is not holding', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build() });

    expect(query(fixture, 'button').hasAttribute('aria-current')).toBe(false);
  });

  it('gives an issue count its own words rather than only a plate', () => {
    const fixture = renderComponent(SavedBuildCard, {
      build: build({ issues: { count: '2', label: '2 issues recorded' } }),
    });

    expect(textOf(query(fixture, '.record__issues'))).toBe('2');
    // The plate is decoration; the count's own words are in the row's text, so
    // a reader is told what a colour and a number alone would not say.
    expect(query(fixture, '.record__issues').getAttribute('aria-hidden')).toBe('true');
    expect(textOf(element(fixture))).toContain('2 issues recorded');
  });

  it('states remaining life where a record has a deadline', () => {
    const fixture = renderComponent(SavedBuildCard, {
      build: build({ remaining: 'Deleted in 6 days unless it is saved' }),
    });

    expect(textOf(element(fixture))).toContain('Deleted in 6 days');
  });

  it('shows a local note when there is one', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build({ note: 'Long-range fit.' }) });

    expect(textOf(element(fixture))).toContain('Long-range fit.');
  });

  it('emits the record it was chosen by, never the translated label', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build() });
    const chosen: string[] = [];
    fixture.componentInstance.chose.subscribe((id) => chosen.push(id));

    query(fixture, 'button').click();

    expect(chosen).toEqual(['r1']);
  });

  it('says whether it is the row the footer would act on', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build(), chosen: true });

    expect(query(fixture, 'button').getAttribute('aria-pressed')).toBe('true');
  });
});

describe('ResponsiveRecordList', () => {
  const groups: readonly RecordListGroup[] = [
    {
      id: 'working',
      label: 'Unnamed builds',
      builds: [build({ id: 'w1', title: 'Sidewinder', named: false })],
      emptyLabel: 'Nothing here yet.',
    },
    {
      id: 'named',
      label: 'Named builds',
      builds: [build({ id: 'n1' })],
      emptyLabel: 'Nothing here yet.',
    },
  ];

  it('labels each group and keeps one reading order', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups,
    });

    expect([...element(fixture).querySelectorAll('h3')].map(textOf)).toEqual([
      'Unnamed builds',
      'Named builds',
    ]);
    expect(element(fixture).querySelectorAll('edsb-saved-build-card')).toHaveLength(2);
  });

  it('draws the column headers once, and not into every row', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups,
    });
    const headers = query(fixture, '.records__columns');

    expect([...headers.querySelectorAll('span')].map(textOf)).toEqual(['Build', 'Hull', 'Edited']);
    // Every row names its own parts, so the headers are not read again per row.
    expect(headers.getAttribute('aria-hidden')).toBe('true');
  });

  it('presents each group as a semantic list', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups,
    });

    expect(element(fixture).querySelectorAll('ul')).toHaveLength(2);
  });

  it('says an empty group is empty rather than showing nothing at all', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups: [{ ...groups[0]!, builds: [] }],
    });

    expect(textOf(element(fixture))).toContain('Nothing here yet.');
  });

  it('lists a record it cannot open, with what is known about it', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups,
      unavailableLabel: 'Unavailable build',
      unavailable: [
        {
          id: 'broken',
          explanation: 'This stored build could not be read.',
          detail: 'Anaconda',
        },
      ],
    });
    const text = textOf(element(fixture));

    expect(text).toContain('Unavailable build');
    expect(text).toContain('could not be read');
    expect(text).toContain('Anaconda');
  });

  it('passes a chosen record through by identity', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups,
    });
    const chosen: string[] = [];
    fixture.componentInstance.chose.subscribe((id) => chosen.push(id));

    query(fixture, '[data-record-id="n1"] button').click();

    expect(chosen).toEqual(['n1']);
  });

  it('marks only the chosen row as the one the footer would act on', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      columns: COLUMNS,
      groups,
      chosen: 'n1',
    });

    expect(query(fixture, '[data-record-id="n1"] button').getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(query(fixture, '[data-record-id="w1"] button').getAttribute('aria-pressed')).toBe(
      'false',
    );
  });
});

describe('RecordManager', () => {
  const records: readonly ManageableRecord[] = [
    { id: 'w1', label: 'Unnamed build', detail: 'Anaconda · 2 Jan 2026' },
    { id: 'w2', label: 'Unnamed build', detail: 'Sidewinder · 3 Jan 2026' },
  ];

  it('lists every record for individual selection, with nothing preselected', () => {
    const fixture = renderComponent(RecordManager, { records });
    const checkboxes = [...element(fixture).querySelectorAll('input[type="checkbox"]')];

    expect(checkboxes).toHaveLength(2);
    expect(checkboxes.every((box) => !(box as HTMLInputElement).checked)).toBe(true);
  });

  it('says why it is open, when there is a reason', () => {
    const fixture = renderComponent(RecordManager, {
      records,
      reason: 'This browser’s storage is full.',
    });

    expect(textOf(element(fixture))).toContain('storage is full');
  });

  it('refuses to discard until something is chosen', () => {
    const fixture = renderComponent(RecordManager, { records });
    const discard = [...element(fixture).querySelectorAll('button')].find((button) =>
      textOf(button).includes('Delete'),
    )!;

    expect(discard.hasAttribute('disabled')).toBe(true);
  });

  it('discards exactly what was selected', () => {
    const fixture = renderComponent(RecordManager, { records, selected: ['w2'] });
    const discarded: readonly string[][] = [];
    fixture.componentInstance.discardRequested.subscribe((ids) =>
      (discarded as string[][]).push([...ids]),
    );

    [...element(fixture).querySelectorAll('button')]
      .find((button) => textOf(button).includes('Delete'))!
      .click();

    expect(discarded).toEqual([['w2']]);
  });

  it('says so when there is nothing to manage', () => {
    const fixture = renderComponent(RecordManager, { records: [] });

    expect(textOf(element(fixture))).toContain('Nothing is stored yet');
  });
});

describe('RecordNoteEditor', () => {
  it('labels the note and says it stays on this device', () => {
    const fixture = renderComponent(RecordNoteEditor, { note: 'Long-range fit.' });
    const text = textOf(element(fixture));

    expect(text).toContain('Note');
    expect(text).toContain('Only you can see this');
  });

  it('emits the draft as it is typed, and again when it is saved', () => {
    const fixture = renderComponent(RecordNoteEditor, { note: '' });
    const changes: string[] = [];
    const saves: string[] = [];
    fixture.componentInstance.changed.subscribe((value) => changes.push(value));
    fixture.componentInstance.saveRequested.subscribe((value) => saves.push(value));

    const field = query(fixture, 'textarea') as HTMLTextAreaElement;
    field.value = 'A note';
    field.dispatchEvent(new Event('input'));
    [...element(fixture).querySelectorAll('button')]
      .find((button) => textOf(button) === 'Save note')!
      .click();

    expect(changes).toEqual(['A note']);
    expect(saves).toEqual(['A note']);
  });

  it('disables the editor without hiding the note', () => {
    const fixture = renderComponent(RecordNoteEditor, { note: 'Long-range fit.', disabled: true });

    expect((query(fixture, 'textarea') as HTMLTextAreaElement).disabled).toBe(true);
    expect(textOf(element(fixture))).toContain('Note');
  });
});
