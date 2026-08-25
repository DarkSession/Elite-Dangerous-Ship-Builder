import { element, query, renderComponent, textOf } from '../ui-component.spec-helpers';
import { LegalExcerpt } from './legal-excerpt';

/** A two-line excerpt with the punctuation a real notice carries. */
const TEXT = [
  'Elite Dangerous Ship Builder was created using assets and imagery from',
  'Elite Dangerous, with the permission of Frontier Developments plc.',
].join('\n');

const INPUTS = {
  sourceNotice: 'The notice below is reproduced from the repository LICENSE.',
  languageNotice: 'It stays in its original English and is not translated.',
  text: TEXT,
  language: 'en',
};

describe('LegalExcerpt', () => {
  it('renders the text it was given, exactly', () => {
    const fixture = renderComponent(LegalExcerpt, INPUTS);

    expect(query(fixture, '.legal-excerpt__body').textContent).toBe(TEXT);
  });

  it('marks the excerpt in the language it was written in', () => {
    const fixture = renderComponent(LegalExcerpt, { ...INPUTS, language: 'en' });

    expect(query(fixture, '.legal-excerpt__body').getAttribute('lang')).toBe('en');
  });

  it('associates the source and the language notice with the region', () => {
    const fixture = renderComponent(LegalExcerpt, INPUTS);
    const body = query(fixture, '.legal-excerpt__body');
    const ids = (body.getAttribute('aria-describedby') ?? '').split(' ');

    expect(ids.length).toBe(2);
    const described = ids.map((id) => textOf(element(fixture).querySelector(`#${id}`)));
    expect(described).toEqual([INPUTS.sourceNotice, INPUTS.languageNotice]);
  });

  it('keeps both notices visible, not only announced', () => {
    const fixture = renderComponent(LegalExcerpt, INPUTS);
    const notices = [...element(fixture).querySelectorAll('.legal-excerpt__notice')];

    expect(notices.map((notice) => textOf(notice))).toEqual([
      INPUTS.sourceNotice,
      INPUTS.languageNotice,
    ]);
    expect(notices.every((notice) => notice.getAttribute('aria-hidden') === null)).toBe(true);
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
