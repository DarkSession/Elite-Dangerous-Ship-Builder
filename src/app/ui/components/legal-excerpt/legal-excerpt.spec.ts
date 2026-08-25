import { element, query, renderComponent } from '../ui-component.spec-helpers';
import { LegalExcerpt } from './legal-excerpt';

/** A two-line excerpt with the punctuation a real notice carries. */
const TEXT = [
  'Elite Dangerous Ship Builder was created using assets and imagery from',
  'Elite Dangerous, with the permission of Frontier Developments plc.',
].join('\n');

const INPUTS = { text: TEXT, language: 'en' };

describe('LegalExcerpt', () => {
  it('renders the text it was given, exactly', () => {
    const fixture = renderComponent(LegalExcerpt, INPUTS);

    expect(query(fixture, '.legal-excerpt__body').textContent).toBe(TEXT);
  });

  it('marks the excerpt in the language it was written in', () => {
    const fixture = renderComponent(LegalExcerpt, { ...INPUTS, language: 'en' });

    expect(query(fixture, '.legal-excerpt__body').getAttribute('lang')).toBe('en');
  });

  it('carries the quotation and nothing else', () => {
    // The source and language sentences an earlier revision drew above the
    // quotation are withdrawn: the design reference draws neither, and the
    // language is still declared where it is a fact about the text rather than
    // a sentence about it.
    const root = element(renderComponent(LegalExcerpt, INPUTS));

    expect(root.querySelectorAll('.legal-excerpt__notice').length).toBe(0);
    expect(root.querySelectorAll('p').length).toBe(0);
    expect(
      query(renderComponent(LegalExcerpt, INPUTS), '.legal-excerpt__body').getAttribute(
        'aria-describedby',
      ),
    ).toBeNull();
  });

  it('renders markup in the source as text, never as markup', () => {
    const injected = 'See <a href="https://example.test">the terms</a> & the rest.';
    const fixture = renderComponent(LegalExcerpt, { ...INPUTS, text: injected });
    const body = query(fixture, '.legal-excerpt__body');

    expect(body.textContent).toBe(injected);
    expect(body.querySelectorAll('a, iframe, script').length).toBe(0);
  });

  it('embeds no frame, no link and nothing that fetches', () => {
    const root = element(renderComponent(LegalExcerpt, INPUTS));

    expect(root.querySelectorAll('a, iframe, script, img, link').length).toBe(0);
  });
});
