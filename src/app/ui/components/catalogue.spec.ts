import { CollectionToolbar } from './collection-toolbar/collection-toolbar';
import { ResponsiveCatalogueView } from './catalogue-view/responsive-catalogue-view';
import { HullSummaryCard, type HullSummary } from './hull-summary-card/hull-summary-card';
import { element, query, renderComponent, textOf } from './ui-component.spec-helpers';

const localized = (text: string) =>
  ({ text, language: 'en', translationState: 'localized', disclosureKey: null }) as const;

function hull(overrides: Partial<HullSummary> = {}): HullSummary {
  return {
    symbol: 'Anaconda',
    name: localized('Anaconda'),
    manufacturer: localized('Faulcon DeLacy'),
    size: 'Large',
    hardpoints: '1 huge, 4 large, 2 medium, 1 small',
    price: '146,969,450 CR',
    selected: false,
    ...overrides,
  };
}

const columns = [
  {
    field: 'name',
    label: 'Ship',
    sortActionLabel: 'Sort by Ship, descending',
    sorted: true,
    direction: 'ascending' as const,
  },
  {
    field: 'manufacturer',
    label: 'Manufacturer',
    sortActionLabel: 'Sort by Manufacturer, ascending',
    sorted: false,
    direction: 'ascending' as const,
  },
  {
    field: 'size',
    label: 'Size',
    sortActionLabel: 'Sort by Size, ascending',
    sorted: false,
    direction: 'ascending' as const,
  },
  {
    field: 'hardpoints',
    label: 'Hardpoints',
    sortActionLabel: 'Sort by Hardpoints, ascending',
    sorted: false,
    direction: 'ascending' as const,
  },
  {
    field: 'price',
    label: 'Retail price',
    sortActionLabel: 'Sort by Retail price, ascending',
    sorted: false,
    direction: 'ascending' as const,
    numeric: true,
  },
];

const viewInputs = {
  caption: 'Hulls in the Almanac',
  columns,
  hulls: [hull()],
  openLabel: (candidate: HullSummary) => `View ${candidate.name.text}`,
};

describe('HullSummaryCard', () => {
  it('pairs every fact with the label that names it', () => {
    const fixture = renderComponent(HullSummaryCard, { hull: hull(), openLabel: 'View Anaconda' });
    const terms = [...element(fixture).querySelectorAll('dt')].map(textOf);
    const values = [...element(fixture).querySelectorAll('dd')].map(textOf);

    expect(terms).toEqual(['Manufacturer', 'Size', 'Hardpoints', 'Retail price']);
    expect(values[1]).toBe('Large');
    expect(values[3]).toContain('146,969,450');
  });

  it('states an unavailable fact in words rather than as a zero', () => {
    const fixture = renderComponent(HullSummaryCard, {
      hull: hull({ price: null, size: null }),
      openLabel: 'View Anaconda',
    });
    const text = textOf(element(fixture));

    expect(text).toContain('Unavailable');
    expect(text).not.toContain('0 CR');
  });

  it('carries selection in text and programmatic state, not only in colour', () => {
    const plain = renderComponent(HullSummaryCard, { hull: hull(), openLabel: 'View' });
    const selected = renderComponent(HullSummaryCard, {
      hull: hull({ selected: true }),
      openLabel: 'View',
    });

    expect(query(plain, 'article').getAttribute('aria-current')).toBeNull();
    expect(query(selected, 'article').getAttribute('aria-current')).toBe('true');
    expect(textOf(element(selected))).toContain('Currently viewing');
  });

  it('names the hull it opens, so the action is not a bare “View”', () => {
    const fixture = renderComponent(HullSummaryCard, {
      hull: hull(),
      openLabel: 'View Anaconda',
    });
    let opened: string | null = null;
    fixture.componentInstance.opened.subscribe((symbol) => (opened = symbol));

    query(fixture, 'edsb-action-button button').click();

    expect(opened).toBe('Anaconda');
  });
});

describe('ResponsiveCatalogueView', () => {
  it('renders the wide manifest as a real table with scoped headers', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);

    expect(query(fixture, 'table')).not.toBeNull();
    expect(textOf(query(fixture, 'caption'))).toBe('Hulls in the Almanac');
    expect(
      [...element(fixture).querySelectorAll('thead th')].every(
        (header) => header.getAttribute('scope') === 'col',
      ),
    ).toBe(true);
    expect(query(fixture, 'tbody th').getAttribute('scope')).toBe('row');
  });

  it('makes every column header a named bidirectional sort action', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const buttons = [...element(fixture).querySelectorAll('thead button')];

    expect(buttons).toHaveLength(columns.length);
    for (const [index, button] of buttons.entries()) {
      // The visible word is the column; the accessible name adds the action
      // and the direction without replacing it.
      expect(textOf(button)).toBe(columns[index]!.label);
      expect(button.getAttribute('aria-label')).toBe(columns[index]!.sortActionLabel);
      expect(button.getAttribute('aria-label')?.toLowerCase()).toContain(
        columns[index]!.label.toLowerCase(),
      );
    }
  });

  it('exposes which column the list is ordered by, and which way', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const headers = [...element(fixture).querySelectorAll('thead th')];

    expect(headers[0]?.getAttribute('aria-sort')).toBe('ascending');
    expect(headers[1]?.getAttribute('aria-sort')).toBeNull();
  });

  it('emits the field a header asks to sort by', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const requested: string[] = [];
    fixture.componentInstance.sortRequested.subscribe((field) => requested.push(field));

    for (const button of element(fixture).querySelectorAll('thead button')) {
      (button as HTMLButtonElement).click();
    }

    expect(requested).toEqual(['name', 'manufacturer', 'size', 'hardpoints', 'price']);
  });

  it('renders the same hulls as stacked records for narrow widths', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      hulls: [hull(), hull({ symbol: 'Adder', name: localized('Adder') })],
    });

    expect(element(fixture).querySelectorAll('edsb-hull-summary-card')).toHaveLength(2);
    expect(element(fixture).querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('offers a named target for opening a hull, not only a clickable row', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const opened: string[] = [];
    fixture.componentInstance.hullOpened.subscribe((symbol) => opened.push(symbol));

    query(fixture, 'tbody th button').click();

    expect(opened).toEqual(['Anaconda']);
  });

  it('marks the hull currently being viewed in both compositions', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      hulls: [hull({ selected: true })],
    });

    expect(query(fixture, 'tbody tr').getAttribute('aria-current')).toBe('true');
    expect(textOf(element(fixture))).toContain('Currently viewing');
  });

  it('says so when there is nothing to show, rather than showing an empty frame', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      hulls: [],
      emptyLabel: 'No hull matches these filters',
    });

    expect(textOf(element(fixture))).toContain('No hull matches these filters');
    expect(element(fixture).querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('finds each hull again by the identity the anchor uses', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);

    expect(
      element(fixture).querySelectorAll('[data-hull-symbol="Anaconda"]').length,
    ).toBeGreaterThan(0);
  });
});

describe('CollectionToolbar', () => {
  const toolbarInputs = {
    search: 'cutter',
    sizeChoices: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
    selectedSizes: ['large'],
    manufacturerOptions: [
      { value: '', label: 'Any' },
      { value: 'Gutamaya', label: 'Gutamaya' },
    ],
    selectedManufacturer: 'Gutamaya',
    hardpointOptions: [
      { value: '', label: 'Any' },
      { value: '4', label: 'Class 4' },
    ],
    selectedHardpointClass: '4',
    priceMin: '1000',
    priceMax: '',
    sortOptions: [
      { value: 'name', label: 'Ship' },
      { value: 'price', label: 'Retail price' },
    ],
    sort: {
      field: 'price',
      direction: 'descending' as const,
      text: 'Sorted by Retail price, descending',
      toggleLabel: 'Sort by Retail price, ascending',
    },
    constraints: [
      { id: 'query', label: 'Search: cutter', removeLabel: 'Remove filter: Search: cutter' },
      { id: 'size:large', label: 'Size: Large', removeLabel: 'Remove filter: Size: Large' },
    ],
    countText: '2 of 48 hulls shown',
  };

  it('gives search the most prominent position and a real label', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const search = query(fixture, 'input[type="search"]') as HTMLInputElement;

    expect(search.value).toBe('cutter');
    expect(textOf(element(fixture).querySelector('label'))).toBe('Search hulls');
  });

  it('offers every facet as a labelled control', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const text = textOf(element(fixture));

    expect(text).toContain('Landing pad size');
    expect(text).toContain('Manufacturer');
    expect(text).toContain('Hardpoint class');
    expect(text).toContain('Lowest retail price');
    expect(text).toContain('Highest retail price');
  });

  it('states the current order and what the toggle would do', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const text = textOf(element(fixture));

    expect(text).toContain('Sorted by Retail price, descending');
    expect(text).toContain('Sort by Retail price, ascending');
  });

  it('lists every active constraint with its own removing action', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const removed: string[] = [];
    fixture.componentInstance.constraintRemoved.subscribe((id) => removed.push(id));

    const buttons = [...element(fixture).querySelectorAll('.toolbar__constraint-list button')];
    expect(buttons.map(textOf)).toEqual([
      'Remove filter: Search: cutter',
      'Remove filter: Size: Large',
    ]);

    buttons[1]!.dispatchEvent(new MouseEvent('click'));
    expect(removed).toEqual(['size:large']);
  });

  it('says so when nothing is narrowing the collection', () => {
    const fixture = renderComponent(CollectionToolbar, { ...toolbarInputs, constraints: [] });

    expect(textOf(element(fixture))).toContain('No filters are active.');
  });

  it('states the match count as text', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);

    expect(textOf(query(fixture, '.toolbar__count'))).toBe('2 of 48 hulls shown');
  });

  it('emits each change as intent rather than acting on it', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const events: string[] = [];
    fixture.componentInstance.searchChanged.subscribe((value) => events.push(`search:${value}`));
    fixture.componentInstance.sortDirectionToggled.subscribe(() => events.push('direction'));
    fixture.componentInstance.cleared.subscribe(() => events.push('cleared'));

    const search = query(fixture, 'input[type="search"]') as HTMLInputElement;
    search.value = 'adder';
    search.dispatchEvent(new Event('input'));

    const buttons = [...element(fixture).querySelectorAll('button')];
    buttons.find((button) => textOf(button) === 'Sort by Retail price, ascending')!.click();
    buttons.find((button) => textOf(button) === 'Clear all filters')!.click();

    expect(events).toEqual(['search:adder', 'direction', 'cleared']);
  });
});
