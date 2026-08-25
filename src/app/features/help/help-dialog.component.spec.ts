import {
  accessibleName,
  element,
  query,
  renderComponent,
  textOf,
} from '../../ui/components/ui-component.spec-helpers';
import { HelpDialog } from './help-dialog.component';
import type { HelpDialogViewModel } from '../../application/help/help.presenter';
import { HELP_TOPIC_IDS } from '../../domain/help/help-topic';

/** Two lines with the punctuation a real notice carries. */
const EXCERPT = [
  'Elite Dangerous Ship Builder was created using assets and imagery from',
  'Elite Dangerous, with the permission of Frontier Developments plc.',
].join('\n');

const LICENCE = {
  index: [
    { id: 'application', text: 'App · MIT licence' },
    { id: 'gameData', text: 'Game data & imagery · Frontier Developments, media-usage rules' },
    { id: 'typefaces', text: 'Typefaces · Barlow & JetBrains Mono, SIL Open Font Licence' },
  ],
  excerpt: EXCERPT,
  excerptLanguage: 'en',
};

const ABOUT = {
  facts: [
    { id: 'application', term: 'App version', value: '0.1.0' },
    { id: 'almanac', term: 'Almanac version', value: '0.1.7' },
  ],
};

/** One question and answer per declared topic, in the declared order. */
const TOPICS = HELP_TOPIC_IDS.map((id, index) => ({
  id,
  question: `Question ${index + 1} about ${id}?`,
  answer: `Answer ${index + 1} about ${id}.`,
}));

const VIEW: HelpDialogViewModel = {
  title: 'Help · About',
  purpose: 'Ship Builder is an offline outfitting bench for Elite Dangerous.',
  sections: { about: 'About', faq: 'FAQ', licence: 'Licence' },
  about: ABOUT,
  topics: TOPICS,
  licence: LICENCE,
};

/**
 * `<dialog>` without the native modal methods, which jsdom does not implement.
 *
 * The shared layer calls them the moment it opens; what these tests are about
 * is the modal's content and reading order, not what a browser does with a
 * dialog element. The Playwright suite covers the real one.
 */
function stubNativeDialog(): void {
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  prototype['showModal'] = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype['close'] = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
  };
}

function render(open = true, view: HelpDialogViewModel = VIEW) {
  stubNativeDialog();
  return renderComponent(HelpDialog, { open, view, dismissLabel: 'Close' });
}

describe('HelpDialog', () => {
  it('is one dialog, named by its visible title', () => {
    const fixture = render();
    const dialogs = element(fixture).querySelectorAll<HTMLDialogElement>('dialog');

    expect(dialogs.length).toBe(1);
    expect(accessibleName(dialogs[0])).toBe('Help · About');
  });

  it('keeps the way out beside the title, outside the scrolling body', () => {
    const fixture = render();
    const header = query(fixture, '.layer__header');

    expect(textOf(header.querySelector('.layer__title'))).toBe('Help · About');
    expect(textOf(header.querySelector('.layer__dismiss'))).toBe('Close');
    expect(header.querySelector('.help-dialog')).toBeNull();
  });

  it('reads ABOUT, then FAQ, then LICENCE — the reference’s own order', () => {
    const fixture = render();
    const headings = [...element(fixture).querySelectorAll('.help-dialog__heading')];

    expect(headings.map((heading) => textOf(heading))).toEqual(['About', 'FAQ', 'Licence']);
  });

  it('names every section by its own heading', () => {
    const fixture = render();
    const sections = [...element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')];

    expect(sections.length).toBe(3);
    for (const section of sections) {
      expect(accessibleName(section)).not.toBe('');
    }
  });

  it('puts the purpose sentence in ABOUT, where the reference draws it', () => {
    const fixture = render();
    const about = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[0];

    expect(textOf(about.querySelector('.help-dialog__purpose'))).toBe(VIEW.purpose);
  });

  it('asks to be dismissed rather than dismissing itself', () => {
    const fixture = render();
    let dismissed = 0;
    fixture.componentInstance.dismissed.subscribe(() => {
      dismissed += 1;
    });

    query(fixture, '.layer__dismiss').click();

    expect(dismissed).toBe(1);
  });

  it('renders the same reading order whether or not it is open', () => {
    const closed = render(false);
    const headings = [...element(closed).querySelectorAll('.help-dialog__heading')];

    expect(headings.map((heading) => textOf(heading))).toEqual(['About', 'FAQ', 'Licence']);
  });

  describe('the identities it states', () => {
    /** Every term/value pair the ABOUT section publishes, in reading order. */
    function facts(fixture = render()) {
      return [...element(fixture).querySelectorAll('.version-facts__fact')].map((fact) => [
        textOf(fact.querySelector('dt')),
        textOf(fact.querySelector('dd')),
      ]);
    }

    it('states the application and the bundled Almanac as two labelled facts', () => {
      const rendered = facts();

      expect(rendered).toEqual([
        ['App version', '0.1.0'],
        ['Almanac version', '0.1.7'],
      ]);
      // Two facts, not one string: neither version can be read as the other.
      expect(rendered.filter(([, value]) => value === '0.1.0').length).toBe(1);
    });

    it('says nothing about release state, which the reference does not draw', () => {
      const text = textOf(query(render(), '.help-dialog'));

      expect(text).not.toMatch(/non-release|release/i);
    });

    it('draws the version facts where the reference draws its version line', () => {
      const fixture = render();
      const about = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[0];
      const order = [
        ...about.querySelectorAll<HTMLElement>(
          '.help-dialog__heading, .help-dialog__purpose, edsb-version-facts',
        ),
      ];

      expect(order.map((node) => node.tagName.toLowerCase())).toEqual([
        'h3',
        'p',
        'edsb-version-facts',
      ]);
    });

    it('states nothing anywhere about a live game or a live catalogue', () => {
      expect(textOf(query(render(), '.help-dialog'))).not.toMatch(
        /live game|live catalogue|up to date/i,
      );
    });
  });

  describe('the questions it answers', () => {
    it('draws all seven topics, once each, in the declared order', () => {
      const fixture = render();
      const topics = [...element(fixture).querySelectorAll('.help-dialog__topic')];

      expect(topics.length).toBe(HELP_TOPIC_IDS.length);
      expect(topics.map((topic) => textOf(topic.querySelector('.help-dialog__question')))).toEqual(
        TOPICS.map((topic) => topic.question),
      );
    });

    it('gives every question its own heading over its own answer', () => {
      const fixture = render();

      for (const [index, topic] of [
        ...element(fixture).querySelectorAll<HTMLElement>('.help-dialog__topic'),
      ].entries()) {
        const heading = topic.querySelector('.help-dialog__question');

        expect(heading?.tagName.toLowerCase()).toBe('h4');
        expect(textOf(topic.querySelector('.help-dialog__answer'))).toBe(TOPICS[index]?.answer);
      }
    });

    it('nests the questions under the FAQ heading rather than beside it', () => {
      const fixture = render();
      const faq = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[1];

      expect(faq.querySelector('.help-dialog__heading')?.tagName.toLowerCase()).toBe('h3');
      expect(faq.querySelectorAll('.help-dialog__topic').length).toBe(HELP_TOPIC_IDS.length);
    });

    it('draws no answer text outside a topic of its own', () => {
      const fixture = render();
      const faq = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[1];
      const loose = [...faq.querySelectorAll('p')].filter(
        (node) => node.closest('.help-dialog__topic') === null,
      );

      expect(loose).toEqual([]);
    });
  });

  describe('the one legal body it embeds', () => {
    it('opens the section with the reference’s three-line summary', () => {
      const fixture = render();
      const lines = [...element(fixture).querySelectorAll('.help-dialog__licence-line')];

      expect(lines.map((line) => textOf(line))).toEqual(LICENCE.index.map((entry) => entry.text));
    });

    it('embeds exactly one legal excerpt, and it is in the LICENCE section', () => {
      const fixture = render();
      const excerpts = element(fixture).querySelectorAll('edsb-legal-excerpt');
      const licence = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[2];

      expect(excerpts.length).toBe(1);
      expect(licence.querySelector('edsb-legal-excerpt')).not.toBeNull();
    });

    it('renders the excerpt as text in an English region, never as markup', () => {
      const fixture = render();
      const body = query(fixture, '.legal-excerpt__body');

      expect(body.textContent).toBe(EXCERPT);
      expect(body.getAttribute('lang')).toBe('en');
      expect(body.querySelectorAll('*').length).toBe(0);
    });

    it('embeds no other document: no MIT, Almanac or third-party body', () => {
      const text = textOf(query(render(), '.help-dialog'));

      expect(text).not.toContain('Permission is hereby granted');
      expect(text).not.toContain('THIRD_PARTY_NOTICES');
      expect(text).not.toContain('MIT License\n');
    });

    it('offers no way out of the application at all', () => {
      // The reference draws no link in the modal, and neither does this. The
      // remaining terms are in the repository `LICENSE`, which a Commander
      // reaches from the repository rather than from a control here.
      expect(element(render()).querySelectorAll('a').length).toBe(0);
    });

    it('summarises what covers what before it quotes what it cannot grant', () => {
      const fixture = render();
      const licence = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[2];
      const order = [
        ...licence.querySelectorAll<HTMLElement>(
          '.help-dialog__heading, .help-dialog__licence-index, edsb-legal-excerpt',
        ),
      ];

      expect(order.map((node) => node.tagName.toLowerCase())).toEqual([
        'h3',
        'ul',
        'edsb-legal-excerpt',
      ]);
    });
  });
});
