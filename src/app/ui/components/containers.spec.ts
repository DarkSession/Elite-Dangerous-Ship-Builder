import { Collection } from './collection/collection';
import { Disclosure } from './disclosure/disclosure';
import { Layer } from './layer/layer';
import { MetricGroup } from './metric-group/metric-group';
import { Panel } from './panel/panel';
import { DataTable } from './table/data-table';
import { TabGroup } from './tab-group/tab-group';
import {
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from './ui-component.spec-helpers';

describe('Panel', () => {
  it('names the region by its visible heading', () => {
    const fixture = renderComponent(Panel, { heading: 'Power and heat' });
    const region = query(fixture, 'section');
    const heading = query(fixture, '[role="heading"]');

    expect(region.getAttribute('aria-labelledby')).toBe(heading.getAttribute('id'));
    expect(textOf(heading)).toBe('Power and heat');
  });

  it('nests at the heading level it is given rather than imposing one', () => {
    const fixture = renderComponent(Panel, { heading: 'Power', headingLevel: 3 });

    expect(query(fixture, '[role="heading"]').getAttribute('aria-level')).toBe('3');
  });

  it('associates a description with the region', () => {
    const fixture = renderComponent(Panel, {
      heading: 'Power',
      description: 'Draw against output.',
    });

    expect(describedText(query(fixture, 'section'))).toContain('Draw against output.');
  });

  it('does not claim a description it does not have', () => {
    const fixture = renderComponent(Panel, { heading: 'Power' });

    expect(query(fixture, 'section').getAttribute('aria-describedby')).toBeNull();
  });
});

describe('TabGroup', () => {
  const tabs = [
    { id: 'power', label: 'Power' },
    { id: 'defence', label: 'Defence' },
  ];

  it('exposes a named tablist with the selected tab', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Build sections',
      tabs,
      selectedId: 'power',
    });
    const list = query(fixture, '[role="tablist"]');

    expect(list.getAttribute('aria-label')).toBe('Build sections');
    expect(element(fixture).querySelector('[role="tab"]')?.getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('never points aria-controls at a panel it does not own', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Build sections',
      tabs,
      selectedId: 'power',
    });

    for (const tab of element(fixture).querySelectorAll('[role="tab"]')) {
      expect(tab.getAttribute('aria-controls')).toBeNull();
    }
  });

  it('relates a tab to a panel the consumer does own', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Build sections',
      tabs: [{ id: 'power', label: 'Power', panelId: 'power-region' }],
      selectedId: 'power',
    });

    expect(query(fixture, '[role="tab"]').getAttribute('aria-controls')).toBe('power-region');
  });

  it('carries the selected state in text, not only in colour', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Build sections',
      tabs,
      selectedId: 'power',
      selectedLabel: 'Selected',
    });

    expect(textOf(query(fixture, '.tab__state'))).toBe('Selected');
  });

  it('uses pressed rather than selected for a segmented control', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Sort by',
      tabs,
      selectedId: 'power',
      presentation: 'segmented',
    });
    const first = element(fixture).querySelector('button');

    expect(element(fixture).querySelector('[role="tablist"]')).toBeNull();
    expect(first?.getAttribute('aria-pressed')).toBe('true');
    expect(first?.getAttribute('aria-selected')).toBeNull();
  });

  it('emits the chosen tab', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Build sections',
      tabs,
      selectedId: 'power',
    });
    const emitted: string[] = [];
    fixture.componentInstance.selected.subscribe((id) => emitted.push(id));

    fixture.componentInstance.select(tabs[1] as { id: string; label: string });

    expect(emitted).toEqual(['defence']);
  });

  it('emits nothing for a disabled tab', () => {
    const fixture = renderComponent(TabGroup, {
      label: 'Build sections',
      tabs,
      selectedId: 'power',
    });
    let emissions = 0;
    fixture.componentInstance.selected.subscribe(() => (emissions += 1));

    fixture.componentInstance.select({ id: 'defence', label: 'Defence', disabled: true });

    expect(emissions).toBe(0);
  });
});

describe('Collection', () => {
  const items = [
    {
      id: 'a',
      label: 'Anaconda explorer',
      detail: 'Exploration',
      activatable: true,
      selected: true,
    },
    { id: 'b', label: 'Krait combat', activatable: true },
  ];

  it('renders a semantic list so a reader is told the set size', () => {
    const fixture = renderComponent(Collection, { label: 'Saved builds', items });

    expect(query(fixture, 'ul').getAttribute('aria-label')).toBe('Saved builds');
    expect(element(fixture).querySelectorAll('li').length).toBe(2);
  });

  it('exposes the selected item and names the state in text', () => {
    const fixture = renderComponent(Collection, {
      label: 'Saved builds',
      items,
      selectedLabel: 'Selected',
    });
    const first = element(fixture).querySelector('li');

    expect(first?.getAttribute('aria-current')).toBe('true');
    expect(textOf(first)).toContain('Selected');
  });

  it('associates an item detail with its activation target', () => {
    const fixture = renderComponent(Collection, { label: 'Saved builds', items });

    expect(describedText(query(fixture, 'button'))).toContain('Exploration');
  });

  it('states an empty collection in text rather than rendering nothing', () => {
    const fixture = renderComponent(Collection, {
      label: 'Saved builds',
      items: [],
      emptyLabel: 'No saved builds yet.',
    });

    expect(element(fixture).querySelector('ul')).toBeNull();
    expect(textOf(query(fixture, '.collection__empty'))).toBe('No saved builds yet.');
  });

  it('emits the activated item', () => {
    const fixture = renderComponent(Collection, { label: 'Saved builds', items });
    const emitted: string[] = [];
    fixture.componentInstance.activated.subscribe((id) => emitted.push(id));

    query(fixture, 'button').click();

    expect(emitted).toEqual(['a']);
  });

  it('emits nothing for a disabled item', () => {
    const fixture = renderComponent(Collection, {
      label: 'Saved builds',
      items: [{ id: 'a', label: 'A', activatable: true, disabled: true }],
    });
    let emissions = 0;
    fixture.componentInstance.activated.subscribe(() => (emissions += 1));

    fixture.componentInstance.activate({ id: 'a', label: 'A', disabled: true });

    expect(emissions).toBe(0);
  });

  it('renders a non-activatable item as text rather than a control', () => {
    const fixture = renderComponent(Collection, {
      label: 'Saved builds',
      items: [{ id: 'a', label: 'A' }],
    });

    expect(element(fixture).querySelector('button')).toBeNull();
    expect(textOf(query(fixture, '.collection__label'))).toBe('A');
  });
});

describe('DataTable', () => {
  const columns = [
    { key: 'module', label: 'Module', rowHeader: true },
    { key: 'draw', label: 'Draw', unit: 'MW', numeric: true },
  ];
  const rows = [{ id: '1', cells: { module: 'Power Plant', draw: '12.4' } }];

  it('names the table with a visible caption', () => {
    const fixture = renderComponent(DataTable, { caption: 'Power draw', columns, rows });

    expect(textOf(query(fixture, 'caption'))).toBe('Power draw');
  });

  it('scopes header cells to their column and row', () => {
    const fixture = renderComponent(DataTable, { caption: 'Power draw', columns, rows });
    const columnHeaders = element(fixture).querySelectorAll('thead th');
    const rowHeader = query(fixture, 'tbody th');

    for (const header of columnHeaders) {
      expect(header.getAttribute('scope')).toBe('col');
    }
    expect(rowHeader.getAttribute('scope')).toBe('row');
    expect(textOf(rowHeader)).toContain('Power Plant');
  });

  it('relates every value cell to its column header', () => {
    const fixture = renderComponent(DataTable, { caption: 'Power draw', columns, rows });
    const cell = query(fixture, 'tbody td');
    const header = element(fixture).querySelectorAll('thead th')[1];

    expect(cell.getAttribute('headers')).toBe(header?.getAttribute('id'));
  });

  it('renders the unit with its column so a value is never a bare number', () => {
    const fixture = renderComponent(DataTable, { caption: 'Power draw', columns, rows });

    expect(textOf(query(fixture, '.table__column-unit'))).toBe('MW');
  });

  it('owns its overflow in a labelled region rather than pushing the page sideways', () => {
    const fixture = renderComponent(DataTable, { caption: 'Power draw', columns, rows });
    const scroller = query(fixture, '.table-scroller');

    expect(scroller.getAttribute('role')).toBe('group');
    expect(scroller.getAttribute('aria-labelledby')).toBe(
      query(fixture, 'caption').getAttribute('id'),
    );
  });

  it('states an empty table in text', () => {
    const fixture = renderComponent(DataTable, {
      caption: 'Power draw',
      columns,
      rows: [],
      emptyLabel: 'No modules are fitted.',
    });

    expect(textOf(query(fixture, '.table__empty'))).toBe('No modules are fitted.');
  });
});

describe('MetricGroup', () => {
  const metrics = [
    {
      id: 'range',
      label: 'Jump range',
      value: '20.45',
      unit: 'ly',
      condition: 'Laden',
      description: 'Maximum single jump.',
    },
    { id: 'total', label: 'Total range', value: null, unavailableLabel: 'Unavailable' },
  ];

  it('renders a description list, pairing each term with its value', () => {
    const fixture = renderComponent(MetricGroup, { label: 'Jump summary', metrics });

    expect(query(fixture, 'dl').getAttribute('aria-label')).toBe('Jump summary');
    expect(element(fixture).querySelectorAll('dt').length).toBe(2);
  });

  it('relates a value to its unit, condition and description', () => {
    const fixture = renderComponent(MetricGroup, { label: 'Jump summary', metrics });
    const value = query(fixture, '.metric__value');
    const described = describedText(value);

    expect(described).toContain('ly');
    expect(described).toContain('Laden');
    expect(described).toContain('Maximum single jump.');
  });

  it('states an unavailable value instead of substituting a zero', () => {
    const fixture = renderComponent(MetricGroup, { label: 'Jump summary', metrics });
    const values = element(fixture).querySelectorAll('.metric__value');

    expect(textOf(values[1] ?? null)).toContain('Unavailable');
    expect(textOf(values[1] ?? null)).not.toContain('0');
  });

  it('states an empty group in text', () => {
    const fixture = renderComponent(MetricGroup, {
      label: 'Jump summary',
      metrics: [],
      emptyLabel: 'Nothing to show.',
    });

    expect(textOf(query(fixture, '.metric-group__empty'))).toBe('Nothing to show.');
  });

  it('describes a value by nothing when it has no unit, condition or description', () => {
    const fixture = renderComponent(MetricGroup, {
      label: 'Counts',
      metrics: [{ id: 'a', label: 'Hardpoints', value: '4' }],
    });

    expect(query(fixture, '.metric__value').getAttribute('aria-describedby')).toBeNull();
  });
});

describe('Disclosure', () => {
  it('exposes the expanded state and controls its content', () => {
    const fixture = renderComponent(Disclosure, { label: 'Why?', expanded: true });
    const trigger = query(fixture, 'button');
    const content = query(fixture, '.disclosure__content');

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(content.getAttribute('id'));
  });

  it('hides collapsed content from the accessibility tree, not just from view', () => {
    const fixture = renderComponent(Disclosure, { label: 'Why?', expanded: false });

    expect(query(fixture, 'button').getAttribute('aria-expanded')).toBe('false');
    expect(query(fixture, '.disclosure__content').hasAttribute('hidden')).toBe(true);
  });

  it('emits the state it is asking to move to', () => {
    const fixture = renderComponent(Disclosure, { label: 'Why?', expanded: false });
    const emitted: boolean[] = [];
    fixture.componentInstance.toggled.subscribe((value) => emitted.push(value));

    query(fixture, 'button').click();

    expect(emitted).toEqual([true]);
  });

  it('emits nothing while disabled', () => {
    const fixture = renderComponent(Disclosure, { label: 'Why?', disabled: true });
    let emissions = 0;
    fixture.componentInstance.toggled.subscribe(() => (emissions += 1));

    fixture.componentInstance.toggle();

    expect(emissions).toBe(0);
  });
});

describe('Layer', () => {
  it('associates its visible title with the dialog', () => {
    const fixture = renderComponent(Layer, {
      title: 'Import a build',
      dismissLabel: 'Close',
      open: false,
    });
    const dialog = query(fixture, 'dialog');

    expect(dialog.getAttribute('aria-labelledby')).toBe(query(fixture, 'h2').getAttribute('id'));
    expect(textOf(query(fixture, 'h2'))).toBe('Import a build');
  });

  it('associates a description when it has one', () => {
    const fixture = renderComponent(Layer, {
      title: 'Import a build',
      description: 'Paste a SLEF payload.',
      dismissLabel: 'Close',
      open: false,
    });

    expect(describedText(query(fixture, 'dialog'))).toContain('Paste a SLEF payload.');
  });

  it('uses a native dialog, so background content is genuinely inert', () => {
    const fixture = renderComponent(Layer, {
      title: 'Import a build',
      dismissLabel: 'Close',
      open: false,
    });

    expect(query(fixture, 'dialog').tagName).toBe('DIALOG');
  });

  it('keeps one state and intent contract across every presentation', () => {
    for (const presentation of ['dialog', 'sheet', 'full-height'] as const) {
      const fixture = renderComponent(Layer, {
        title: 'Import a build',
        dismissLabel: 'Close',
        open: false,
        presentation,
      });

      expect(query(fixture, 'dialog').className).toContain(`layer--${presentation}`);
      expect(query(fixture, 'dialog').getAttribute('aria-labelledby')).not.toBeNull();
    }
  });

  it('emits dismissal intent rather than closing itself', () => {
    const fixture = renderComponent(Layer, {
      title: 'Import a build',
      dismissLabel: 'Close',
      open: false,
    });
    let dismissals = 0;
    fixture.componentInstance.dismissed.subscribe(() => (dismissals += 1));

    query(fixture, '.layer__dismiss').click();

    expect(dismissals).toBe(1);
  });

  it('gives the dismiss control a visible label', () => {
    const fixture = renderComponent(Layer, {
      title: 'Import a build',
      dismissLabel: 'Schließen',
      open: false,
    });

    expect(textOf(query(fixture, '.layer__dismiss'))).toBe('Schließen');
  });

  it('bounds a centred layer by the width step it is given', () => {
    for (const presentation of ['dialog', 'adaptive'] as const) {
      const fixture = renderComponent(Layer, {
        title: 'Export build',
        dismissLabel: 'Close',
        open: false,
        presentation,
        width: 'wide',
      });

      expect(query(fixture, 'dialog').className).toContain('layer--wide');
    }
  });

  it('leaves a sheet unbounded, because it fills the width it rises into', () => {
    const fixture = renderComponent(Layer, {
      title: 'Export build',
      dismissLabel: 'Close',
      open: false,
      presentation: 'sheet',
      width: 'wide',
    });

    expect(query(fixture, 'dialog').className).not.toContain('layer--wide');
  });

  it("hands the body's padding to its content when it is flush", () => {
    const padded = renderComponent(Layer, {
      title: 'Export build',
      dismissLabel: 'Close',
      open: false,
    });
    const flush = renderComponent(Layer, {
      title: 'Export build',
      dismissLabel: 'Close',
      open: false,
      flush: true,
    });

    expect(query(padded, '.layer__body').className).not.toContain('layer__body--flush');
    expect(query(flush, '.layer__body').className).toContain('layer__body--flush');
  });
});
