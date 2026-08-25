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
    name: 'Anaconda explorer',
    hull,
    modified: '2 Jan 2026, 03:04',
    validation: { label: 'Valid', tone: 'success' },
    note: null,
    actions: [
      { id: 'open', label: 'Open Anaconda explorer', emphasis: 'secondary' },
      { id: 'delete', label: 'Delete Anaconda explorer', emphasis: 'danger' },
    ],
    ...overrides,
  };
}

describe('SavedBuildCard', () => {
  it('shows the local name, hull, modified instant and recorded state', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build() });
    const text = textOf(element(fixture));

    expect(text).toContain('Anaconda explorer');
    expect(text).toContain('Anaconda');
    expect(text).toContain('2 Jan 2026, 03:04');
    expect(text).toContain('Valid');
  });

  it('says an unnamed build is an unnamed build, rather than inventing a name', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build({ name: null }) });

    expect(textOf(query(fixture, 'h3'))).toBe('Unnamed build');
    expect(textOf(element(fixture))).not.toContain('Untitled');
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

  it('shows a local note when there is one', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build({ note: 'Long-range fit.' }) });

    expect(textOf(element(fixture))).toContain('Long-range fit.');
  });

  it('names the record in every action, so none of them is a bare verb', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build() });

    for (const button of element(fixture).querySelectorAll('button')) {
      expect(textOf(button)).toContain('Anaconda explorer');
    }
  });

  it('emits the record and the action, never the translated label', () => {
    const fixture = renderComponent(SavedBuildCard, { build: build() });
    const events: unknown[] = [];
    fixture.componentInstance.actionSelected.subscribe((event) => events.push(event));

    for (const button of element(fixture).querySelectorAll('button')) {
      (button as HTMLButtonElement).click();
    }

    expect(events).toEqual([
      { recordId: 'r1', actionId: 'open' },
      { recordId: 'r1', actionId: 'delete' },
    ]);
  });
});

describe('ResponsiveRecordList', () => {
  const groups: readonly RecordListGroup[] = [
    {
      id: 'working',
      label: 'Unnamed builds',
      builds: [build({ id: 'w1', name: null })],
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
    const fixture = renderComponent(ResponsiveRecordList, { label: 'Saved builds', groups });

    expect([...element(fixture).querySelectorAll('h2')].map(textOf)).toEqual([
      'Unnamed builds',
      'Named builds',
    ]);
    expect(element(fixture).querySelectorAll('edsb-saved-build-card')).toHaveLength(2);
  });

  it('presents each group as a semantic list', () => {
    const fixture = renderComponent(ResponsiveRecordList, { label: 'Saved builds', groups });

    expect(element(fixture).querySelectorAll('ul')).toHaveLength(2);
  });

  it('says an empty group is empty rather than showing nothing at all', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
      groups: [{ ...groups[0]!, builds: [] }],
    });

    expect(textOf(element(fixture))).toContain('Nothing here yet.');
  });

  it('lists a record it cannot open, with what is known about it', () => {
    const fixture = renderComponent(ResponsiveRecordList, {
      label: 'Saved builds',
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

  it('passes an action through with the record it belongs to', () => {
    const fixture = renderComponent(ResponsiveRecordList, { label: 'Saved builds', groups });
    const events: unknown[] = [];
    fixture.componentInstance.actionSelected.subscribe((event) => events.push(event));

    query(fixture, '[data-record-id="n1"] button').click();

    expect(events).toEqual([{ recordId: 'n1', actionId: 'open' }]);
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
