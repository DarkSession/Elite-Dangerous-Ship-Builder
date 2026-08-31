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
    size: 'LRG',
    sizeText: 'Large',
    hardpoints: '1H 4L 2M 1S',
    hardpointsText: '1 huge, 4 large, 2 medium, 1 small',
    price: '146.97',
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
    label: 'Price Mcr',
    sortActionLabel: 'Sort by Price Mcr, ascending',
    sorted: false,
    direction: 'ascending' as const,
    numeric: true,
  },
];

const viewInputs = {
  caption: 'Hulls in the Almanac',
  columns,
  hulls: [hull()],
  // The manifest is told whether a rest reads a hull; it does not ask. The
  // default is the answer every device gets below the rail's own width and
  // every touch screen gets at it, so a press opens the hull — which is what
  // the tests about the row itself are pressing for (`ship-catalogue.page.ts`).
  restsToRead: false,
};

describe('HullSummaryCard', () => {
  // The reference compresses the labels away and shortens the codes; both the
  // labels and the spelled-out values stay in the record for a reader.
  it('pairs every fact with the label that names it', () => {
    const fixture = renderComponent(HullSummaryCard, { hull: hull() });
    const terms = [...element(fixture).querySelectorAll('dt')].map(textOf);
    const text = textOf(element(fixture));

    expect(terms).toEqual(['Size', 'Ship', 'Price Mcr']);
    expect(text).toContain('LRG');
    expect(text).toContain('Large');
    expect(text).toContain('1H 4L 2M 1S');
    expect(text).toContain('1 huge, 4 large, 2 medium, 1 small');
    expect(text).toContain('146.97');
  });

  it('states an unavailable fact in words rather than as a zero', () => {
    const fixture = renderComponent(HullSummaryCard, {
      hull: hull({ price: null, size: null, sizeText: null }),
    });
    const text = textOf(element(fixture));

    expect(text).toContain('Unavailable');
    expect(text).not.toContain('0 CR');
  });

  it('carries selection in programmatic state, not only in colour', () => {
    const plain = renderComponent(HullSummaryCard, { hull: hull() });
    const selected = renderComponent(HullSummaryCard, { hull: hull({ selected: true }) });

    expect(query(plain, 'article').getAttribute('aria-current')).toBeNull();
    expect(query(selected, 'article').getAttribute('aria-current')).toBe('true');
    expect(textOf(element(selected))).toContain('Selected');
  });

  it('names the hull it opens, so the action is not a bare hull name', () => {
    const fixture = renderComponent(HullSummaryCard, { hull: hull() });
    let opened: string | null = null;
    fixture.componentInstance.opened.subscribe((symbol) => (opened = symbol));

    const open = query(fixture, '.hull-card__open');
    expect(open.getAttribute('aria-label')).toBe('View Anaconda');
    (open as HTMLButtonElement).click();

    expect(opened).toBe('Anaconda');
  });

  it('takes the press anywhere on the record, not only on the name', () => {
    // A compact row reads as one target for the same reason a manifest row
    // does: the price belongs to the same hull as the name.
    const fixture = renderComponent(HullSummaryCard, { hull: hull() });
    const opened: string[] = [];
    fixture.componentInstance.opened.subscribe((symbol) => opened.push(symbol));

    query(fixture, '.hull-card__price').click();
    expect(opened).toEqual(['Anaconda']);

    // And the name's own press is answered once, not once here and once on the
    // record it bubbles to.
    (query(fixture, '.hull-card__open') as HTMLButtonElement).click();
    expect(opened).toHaveLength(2);
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
    // The reference opens each row with a marker column of its own.
    expect(element(fixture).querySelectorAll('thead th')).toHaveLength(columns.length + 1);
    expect(query(fixture, 'tbody th').getAttribute('scope')).toBe('row');
  });

  it('makes every column header a named bidirectional sort action', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const buttons = [...element(fixture).querySelectorAll('thead button')];

    expect(buttons).toHaveLength(columns.length);
    for (const [index, button] of buttons.entries()) {
      // The visible word is the column; the accessible name adds the action
      // and the direction without replacing it. The sorted column also wears
      // the reference's caret, which is decoration and is hidden.
      expect(textOf(button)).toContain(columns[index]!.label);
      expect(button.getAttribute('aria-label')).toBe(columns[index]!.sortActionLabel);
      expect(button.getAttribute('aria-label')?.toLowerCase()).toContain(
        columns[index]!.label.toLowerCase(),
      );
    }
  });

  it('exposes which column the list is ordered by, and which way', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const headers = [...element(fixture).querySelectorAll('thead th')];

    expect(headers[1]?.getAttribute('aria-sort')).toBe('ascending');
    expect(headers[2]?.getAttribute('aria-sort')).toBeNull();
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

  it('takes the press anywhere on the row, not only on the name', () => {
    // A manifest row reads as one target: the price cell belongs to the same
    // hull as the name, and pressing it did nothing at all.
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const opened: string[] = [];
    fixture.componentInstance.hullOpened.subscribe((symbol) => opened.push(symbol));

    query(fixture, 'tbody td.catalogue__numeric').click();

    expect(opened).toEqual(['Anaconda']);
  });

  it('answers a press on the name once, not once for the name and once for the row', () => {
    // The name's own press bubbles to the row that holds it, so the row is the
    // only handler and a press is one action however it arrived.
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const opened: string[] = [];
    fixture.componentInstance.hullOpened.subscribe((symbol) => opened.push(symbol));

    query(fixture, 'tbody th button').click();

    expect(opened).toHaveLength(1);
  });

  it('builds the hull a second press lands on where a rest reads nothing', () => {
    // A touch screen has no resting state, so the first press opens the hull
    // beside the manifest and the row it opened is marked. Pressing that row
    // again is the decision to fly it — the same second step a pointer makes by
    // resting and then pressing.
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      hulls: [hull({ selected: true })],
    });
    const built: string[] = [];
    const opened: string[] = [];
    fixture.componentInstance.hullBuilt.subscribe((symbol) => built.push(symbol));
    fixture.componentInstance.hullOpened.subscribe((symbol) => opened.push(symbol));

    query(fixture, 'tbody tr').click();

    expect(built).toEqual(['Anaconda']);
    expect(opened).toEqual([]);
    // And the control says which of the two the press will do.
    expect(query(fixture, 'tbody th button').getAttribute('aria-label')).toContain('Build');
  });

  it('opens rather than reads where a rest reads nothing', () => {
    // Told that a rest reads nothing — a touch screen, or any width below the
    // rail's, where there is no rail for the reading to appear in. Resting there
    // opened canvas 1b's sheet over the manifest it was being read from, one
    // hull after another, with no press behind any of it (Commander request
    // 2026-08-31).
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const previewed: string[] = [];
    const opened: string[] = [];
    const built: string[] = [];
    fixture.componentInstance.hullPreviewed.subscribe((symbol) => previewed.push(symbol));
    fixture.componentInstance.hullOpened.subscribe((symbol) => opened.push(symbol));
    fixture.componentInstance.hullBuilt.subscribe((symbol) => built.push(symbol));

    // The move first, so nothing is refused for being a pointer that never
    // moved — the other reason a rest is ignored, and not the one under test.
    window.dispatchEvent(new Event('pointermove'));
    query(fixture, 'tbody tr').dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    expect(previewed).toEqual([]);

    // And the press takes the path a touch screen takes, at this device too.
    query(fixture, 'tbody tr').dispatchEvent(
      new PointerEvent('click', { pointerType: 'mouse', bubbles: true }),
    );
    expect(opened).toEqual(['Anaconda']);
    expect(built).toEqual([]);
    expect(query(fixture, 'tbody th button').getAttribute('aria-label')).toContain('View');
  });

  it('drops a rest it stashed when the answer changes before the move releases it', () => {
    // The row entered before the first `pointermove` is held rather than
    // answered, and the hold outlives the moment it was made in: a window zoomed
    // or dragged below the rail's own width in between would read a hull into a
    // rail that is no longer drawn. The answer is therefore asked again when the
    // stash is released, not carried over from when it was made.
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      restsToRead: true,
    });
    const previewed: string[] = [];
    fixture.componentInstance.hullPreviewed.subscribe((symbol) => previewed.push(symbol));

    // Entered while the rail is drawn, and before any move: stashed, not read.
    query(fixture, 'tbody tr').dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    expect(previewed).toEqual([]);

    // The rail goes, and only then does the move arrive.
    fixture.componentRef.setInput('restsToRead', false);
    fixture.detectChanges();
    window.dispatchEvent(new Event('pointermove'));

    expect(previewed).toEqual([]);
  });

  it('reads a hull on a rest where it is told the rail is drawn', () => {
    // The other side of the same answer, so the row is not simply inert.
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      restsToRead: true,
    });
    const previewed: string[] = [];
    fixture.componentInstance.hullPreviewed.subscribe((symbol) => previewed.push(symbol));

    window.dispatchEvent(new Event('pointermove'));
    query(fixture, 'tbody tr').dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));

    expect(previewed).toEqual(['Anaconda']);
    expect(query(fixture, 'tbody th button').getAttribute('aria-label')).toContain('Build');
  });

  it('opens rather than builds when a finger presses where a rest would read', () => {
    // A laptop with a touch screen at the rail's width is told a rest reads, and
    // a finger on it has still never rested anywhere. Left to that answer alone
    // a tap built a hull the Commander had not read — from anywhere on the row,
    // since the whole row presses. The press says how it was made, and that
    // overrules the screen.
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      restsToRead: true,
    });
    const built: string[] = [];
    const opened: string[] = [];
    fixture.componentInstance.hullBuilt.subscribe((symbol) => built.push(symbol));
    fixture.componentInstance.hullOpened.subscribe((symbol) => opened.push(symbol));

    query(fixture, 'tbody tr').dispatchEvent(
      new PointerEvent('click', { pointerType: 'touch', bubbles: true }),
    );
    expect(opened).toEqual(['Anaconda']);
    expect(built).toEqual([]);

    // The same row under the pointer the screen was answering about: resting has
    // already read the hull, so the press is the decision to fly it.
    query(fixture, 'tbody tr').dispatchEvent(
      new PointerEvent('click', { pointerType: 'mouse', bubbles: true }),
    );
    expect(built).toEqual(['Anaconda']);
  });

  it('keeps the sort caret’s place on every header, drawn on the sorted one', () => {
    // A caret that appeared only once a column was pressed pulled the two
    // right-ranged headings a caret's width along the first time they were used.
    const fixture = renderComponent(ResponsiveCatalogueView, viewInputs);
    const carets = [...element(fixture).querySelectorAll('.catalogue__caret')];

    expect(carets).toHaveLength(columns.length);
    for (const caret of carets) {
      expect(caret.textContent?.trim()).not.toBe('');
    }
    expect(carets[0]?.classList.contains('catalogue__caret--reserved')).toBe(false);
    expect(carets[1]?.classList.contains('catalogue__caret--reserved')).toBe(true);
  });

  it('marks the hull currently being viewed in both compositions', () => {
    const fixture = renderComponent(ResponsiveCatalogueView, {
      ...viewInputs,
      hulls: [hull({ selected: true })],
    });

    expect(query(fixture, 'tbody tr').getAttribute('aria-current')).toBe('true');
    expect(textOf(query(fixture, '.catalogue__mark'))).toBe('◆');
    // The reference marks the row; the word is there but never drawn.
    expect(textOf(element(fixture))).toContain('Selected');
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
    sortOptions: [
      { value: 'name', label: 'Ship', actionLabel: 'Sort by Ship, ascending' },
      { value: 'price', label: 'Price Mcr', actionLabel: 'Sort by Price Mcr, ascending' },
    ],
    sort: {
      field: 'price',
      direction: 'descending' as const,
      text: 'Sorted by Price Mcr, descending',
      toggleLabel: 'Sort by Price Mcr, ascending',
    },
  };

  it('gives search the most prominent position and a real label', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const search = query(fixture, 'input[type="search"]') as HTMLInputElement;

    expect(search.value).toBe('cutter');
    expect(textOf(element(fixture).querySelector('label'))).toBe('Search ships or manufacturers');
  });

  // The reference toolbar is a search field, a size strip and — compact only —
  // a row of sort chips. Nothing else is drawn, so nothing else is rendered.
  it('draws only the controls the reference draws', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const text = textOf(element(fixture));

    expect(text).toContain('Search ships or manufacturers');
    expect(text).toContain('Size');
    expect(element(fixture).querySelectorAll('select')).toHaveLength(0);
    expect(text).not.toContain('Manufacturer');
    expect(text).not.toContain('Lowest retail price');
    expect(text).not.toContain('Active filters');
  });

  it('marks the order in force and says what re-choosing it would do', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const chips = [...element(fixture).querySelectorAll('.toolbar__sort-chip')];

    expect(chips.map((chip) => chip.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    // Every chip says what activating it would do, not just which field it is.
    expect(chips[1]!.getAttribute('aria-label')).toBe('Sort by Price Mcr, ascending');
    expect(chips[0]!.getAttribute('aria-label')).toBe('Sort by Ship, ascending');
  });

  it('emits each change as intent rather than acting on it', () => {
    const fixture = renderComponent(CollectionToolbar, toolbarInputs);
    const events: string[] = [];
    fixture.componentInstance.searchChanged.subscribe((value) => events.push(`search:${value}`));
    fixture.componentInstance.sortFieldChanged.subscribe((field) => events.push(`sort:${field}`));

    const search = query(fixture, 'input[type="search"]') as HTMLInputElement;
    search.value = 'adder';
    search.dispatchEvent(new Event('input'));

    (query(fixture, '.toolbar__sort-chip') as HTMLButtonElement).click();

    expect(events).toEqual(['search:adder', 'sort:name']);
  });
});
