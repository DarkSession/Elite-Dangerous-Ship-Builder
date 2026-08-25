import { element, renderComponent, textOf } from '../ui-component.spec-helpers';
import { VersionFacts, type VersionFact } from './version-facts';

const FACTS: readonly VersionFact[] = [
  { id: 'application', term: 'App version', value: '0.0.0' },
  { id: 'build', term: 'Build', value: 'Non-release · 1284' },
  { id: 'almanac', term: 'Almanac version', value: '0.1.7' },
];

describe('VersionFacts', () => {
  it('pairs every value with the term that says what it is', () => {
    const fixture = renderComponent(VersionFacts, { facts: FACTS });
    const pairs = [...element(fixture).querySelectorAll('.version-facts__fact')].map((fact) => [
      textOf(fact.querySelector('dt')),
      textOf(fact.querySelector('dd')),
    ]);

    expect(pairs).toEqual([
      ['App version', '0.0.0'],
      ['Build', 'Non-release · 1284'],
      ['Almanac version', '0.1.7'],
    ]);
  });

  it('keeps the application and the bundled Almanac as separate facts', () => {
    const fixture = renderComponent(VersionFacts, { facts: FACTS });
    const terms = [...element(fixture).querySelectorAll('dt')].map((term) => textOf(term));

    expect(new Set(terms).size).toBe(terms.length);
    expect(terms).toContain('App version');
    expect(terms).toContain('Almanac version');
  });

  it('reads as a description list, so a term is announced with its value', () => {
    const fixture = renderComponent(VersionFacts, { facts: FACTS });
    const root = element(fixture);

    expect(root.querySelectorAll('dl').length).toBe(1);
    expect(root.querySelectorAll('dt').length).toBe(FACTS.length);
    expect(root.querySelectorAll('dd').length).toBe(FACTS.length);
  });

  // Release state is a word in a definition, not a colour, a position or a
  // weight. Nothing here is conveyed by presentation alone.
  it('states release status as text a reader can read', () => {
    const release = renderComponent(VersionFacts, {
      facts: [{ id: 'build', term: 'Build', value: 'Release' }],
    });

    expect(textOf(element(release).querySelector('dd'))).toBe('Release');
  });

  // The reference parts its facts with an interpunct. That is spacing here:
  // a separator in the flow is a character a screen reader announces between
  // every pair of them.
  it('adds no separator character between facts', () => {
    const fixture = renderComponent(VersionFacts, {
      facts: [
        { id: 'application', term: 'App version', value: '0.0.0' },
        { id: 'almanac', term: 'Almanac version', value: '0.1.7' },
      ],
    });

    expect(textOf(element(fixture).querySelector('.version-facts'))).toBe(
      'App version0.0.0Almanac version0.1.7',
    );
  });

  it('renders nothing at all when it is given nothing', () => {
    const fixture = renderComponent(VersionFacts, { facts: [] });

    expect(element(fixture).querySelectorAll('.version-facts__fact').length).toBe(0);
  });
});
