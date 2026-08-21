import { FactList, type Fact } from './fact-list/fact-list';
import { HullArtwork } from './hull-artwork/hull-artwork';
import { SlotLayout, type SlotGroup } from './slot-layout/slot-layout';
import {
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from './ui-component.spec-helpers';

const facts: readonly Fact[] = [
  { id: 'maximum-speed', label: 'Speed', value: '183', unit: 'm/s', condition: 'at 4 ENG pips' },
  { id: 'hardness', label: 'Hull hardness', value: '65', unit: 'rating, no unit', condition: null },
  { id: 'base-shield', label: 'Base shield strength', value: null, unit: 'MJ', condition: null },
];

describe('FactList', () => {
  it('pairs each fact with its label as a definition list', () => {
    const fixture = renderComponent(FactList, { label: 'Hull specifications', facts });

    expect([...element(fixture).querySelectorAll('dt')].map(textOf)).toEqual([
      'Speed',
      'Hull hardness',
      'Base shield strength',
    ]);
  });

  it('relates a value to its unit and its viewing condition', () => {
    const fixture = renderComponent(FactList, { label: 'Hull specifications', facts });
    const values = [...element(fixture).querySelectorAll('dd')];

    const described = describedText(values[0]!.querySelector('[aria-describedby]') ?? values[0]!);
    expect(described).toContain('m/s');
    expect(described).toContain('at 4 ENG pips');
  });

  it('states an unavailable value in words rather than as a zero', () => {
    const fixture = renderComponent(FactList, { label: 'Hull specifications', facts });
    const text = textOf(element(fixture));

    expect(text).toContain('Unavailable');
    expect(text).not.toMatch(/\b0 MJ\b/);
  });

  it('marks a figure with no unit as a rating rather than inventing one', () => {
    const fixture = renderComponent(FactList, { label: 'Hull specifications', facts });

    expect(textOf(element(fixture))).toContain('rating, no unit');
  });

  it('says so when a group has no facts, rather than rendering an empty list', () => {
    const fixture = renderComponent(FactList, {
      label: 'Hull specifications',
      facts: [],
      emptyLabel: 'The Almanac supplies no figures for this hull.',
    });

    expect(textOf(element(fixture))).toContain('The Almanac supplies no figures');
  });
});

describe('HullArtwork', () => {
  const inputs = {
    source: 'assets/ships/Anaconda/illustration.svg',
    label: 'Illustration of the Anaconda',
  };

  it('gives the illustration a text equivalent naming the hull', () => {
    const fixture = renderComponent(HullArtwork, { ...inputs, state: 'available' });

    expect(query(fixture, 'img').getAttribute('alt')).toBe('Illustration of the Anaconda');
  });

  it('reserves its area before anything loads', () => {
    const fixture = renderComponent(HullArtwork, inputs);

    expect(query(fixture, '.artwork__frame')).not.toBeNull();
  });

  it('says the illustration is loading, in text', () => {
    const fixture = renderComponent(HullArtwork, { ...inputs, state: 'loading' });

    expect(textOf(element(fixture))).toContain('Loading the illustration');
  });

  it('explains a missing illustration as temporary and keeps the hull named', () => {
    const fixture = renderComponent(HullArtwork, {
      ...inputs,
      state: 'temporarily-unavailable',
    });
    const text = textOf(element(fixture));

    expect(text).toContain('not available right now');
    expect(text).toContain('Illustration of the Anaconda');
    expect(element(fixture).querySelector('img')).toBeNull();
  });

  it('offers a retry that does not reload the page', () => {
    const fixture = renderComponent(HullArtwork, {
      ...inputs,
      state: 'temporarily-unavailable',
    });
    let retries = 0;
    fixture.componentInstance.retryRequested.subscribe(() => (retries += 1));

    query(fixture, 'edsb-action-button button').click();

    expect(retries).toBe(1);
  });

  it('requests the plain asset first, so a cached copy is used', () => {
    const fixture = renderComponent(HullArtwork, { ...inputs, state: 'loading' });

    expect(query(fixture, 'img').getAttribute('src')).toBe(inputs.source);
  });

  it('asks again distinctly on a retry, so a cached failure is not reused', () => {
    const fixture = renderComponent(HullArtwork, { ...inputs, state: 'loading', attempt: 2 });

    expect(query(fixture, 'img').getAttribute('src')).toBe(`${inputs.source}?attempt=2`);
  });

  it('reports what the browser did with the request', () => {
    const fixture = renderComponent(HullArtwork, { ...inputs, state: 'loading' });
    const events: string[] = [];
    fixture.componentInstance.loaded.subscribe(() => events.push('loaded'));
    fixture.componentInstance.failed.subscribe(() => events.push('failed'));

    query(fixture, 'img').dispatchEvent(new Event('load'));
    query(fixture, 'img').dispatchEvent(new Event('error'));

    expect(events).toEqual(['loaded', 'failed']);
  });
});

describe('SlotLayout', () => {
  const groups: readonly SlotGroup[] = [
    {
      kind: 'core',
      label: 'Core internals',
      slots: [{ key: 'PowerPlant', size: 'Size 8', restriction: null }],
    },
    {
      kind: 'optional',
      label: 'Optional internals',
      slots: [
        { key: 'Slot14_Size1', size: 'Size 1', restriction: null },
        { key: 'Military01', size: 'Size 5', restriction: 'Takes reinforcement packages only' },
      ],
    },
  ];

  it('groups mounts by kind, each under its own heading', () => {
    const fixture = renderComponent(SlotLayout, { label: 'Slot layout', groups });

    expect([...element(fixture).querySelectorAll('h3')].map(textOf)).toEqual([
      'Core internals',
      'Optional internals',
    ]);
  });

  it('shows the game’s own slot key verbatim', () => {
    const fixture = renderComponent(SlotLayout, { label: 'Slot layout', groups });
    const keys = [...element(fixture).querySelectorAll('.slots__key')].map(textOf);

    expect(keys).toEqual(['PowerPlant', 'Slot14_Size1', 'Military01']);
  });

  it('isolates a slot key from the surrounding text direction', () => {
    const fixture = renderComponent(SlotLayout, { label: 'Slot layout', groups });

    expect(query(fixture, '.slots__key').getAttribute('dir')).toBe('ltr');
  });

  it('names a mount’s size and any restriction it carries', () => {
    const fixture = renderComponent(SlotLayout, { label: 'Slot layout', groups });
    const text = textOf(element(fixture));

    expect(text).toContain('Size 8');
    expect(text).toContain('Takes reinforcement packages only');
  });

  it('presents each group of mounts as a semantic list', () => {
    const fixture = renderComponent(SlotLayout, { label: 'Slot layout', groups });

    expect(element(fixture).querySelectorAll('ul')).toHaveLength(2);
    expect(element(fixture).querySelectorAll('li')).toHaveLength(3);
  });

  it('says so when the package supplies no layout at all', () => {
    const fixture = renderComponent(SlotLayout, {
      label: 'Slot layout',
      groups: [],
      emptyLabel: 'The Almanac supplies no slot layout for this hull.',
    });

    expect(textOf(element(fixture))).toContain('no slot layout');
  });
});
