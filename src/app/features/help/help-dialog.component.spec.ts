import {
  accessibleName,
  element,
  query,
  renderComponent,
  textOf,
} from '../../ui/components/ui-component.spec-helpers';
import { HelpDialog } from './help-dialog.component';
import type { HelpDialogViewModel } from '../../application/help/help.presenter';

/** Two lines with the punctuation a real notice carries. */
const EXCERPT = [
  'Elite Dangerous Ship Builder was created using assets and imagery from',
  'Elite Dangerous, with the permission of Frontier Developments plc.',
].join('\n');

const LICENCE = {
  framing: "Ship Builder's own code is under the MIT licence.",
  sourceNotice: 'The notice below is reproduced from the repository LICENSE.',
  languageNotice: 'It stays in its original English and is not translated.',
  excerpt: EXCERPT,
  excerptLanguage: 'en',
  link: {
    label: 'Read LICENSE on GitHub',
    href: 'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
    purpose: 'Every remaining licence and third-party term is in the repository LICENSE.',
    leavingWarning: 'Opening it leaves Ship Builder.',
    networkWarning: 'It may need a network connection.',
  },
};

const ABOUT = {
  facts: [
    { id: 'application', term: 'App version', value: '0.1.0' },
    { id: 'build', term: 'Build', value: 'Non-release · 1284' },
    { id: 'almanac', term: 'Almanac version', value: '0.1.7' },
  ],
  provenance: {
    almanacRole:
      'The bundled Almanac supplies the catalogue data, the validation and the calculations shown here.',
    frontierOwnership:
      'Frontier Developments plc owns the Elite Dangerous game data and imagery it describes.',
  },
};

/** The same ABOUT block for a build somebody released. */
const RELEASED_ABOUT = {
  ...ABOUT,
  facts: ABOUT.facts.map((fact) => (fact.id === 'build' ? { ...fact, value: 'Release' } : fact)),
};

const VIEW: HelpDialogViewModel = {
  title: 'Help · About',
  purpose:
    'Ship Builder is a private outfitting bench for Elite Dangerous that works offline, entirely in this browser.',
  sections: { about: 'About', faq: 'FAQ', licence: 'Licence' },
  about: ABOUT,
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

      expect(rendered).toContainEqual(['App version', '0.1.0']);
      expect(rendered).toContainEqual(['Almanac version', '0.1.7']);
      // Two facts, not one string: neither version can be read as the other.
      expect(rendered.filter(([, value]) => value === '0.1.0').length).toBe(1);
    });

    it('shows a non-release build as such, with its identifier', () => {
      expect(facts()).toContainEqual(['Build', 'Non-release · 1284']);
    });

    it('shows a released build without inventing an identifier for it', () => {
      const rendered = facts(render(true, { ...VIEW, about: RELEASED_ABOUT }));

      expect(rendered).toContainEqual(['Build', 'Release']);
      expect(rendered.length).toBe(3);
    });

    it('draws the version facts where the reference draws its version line', () => {
      const fixture = render();
      const about = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[0];
      const order = [
        ...about.querySelectorAll<HTMLElement>(
          '.help-dialog__heading, .help-dialog__purpose, edsb-version-facts, .help-dialog__prose',
        ),
      ];

      expect(order.map((node) => node.tagName.toLowerCase())).toEqual([
        'h3',
        'p',
        'edsb-version-facts',
        'p',
        'p',
      ]);
    });

    it('keeps provenance to the two sentences it was given', () => {
      const fixture = render();
      const about = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[0];
      const prose = [...about.querySelectorAll('.help-dialog__prose')].map((node) => textOf(node));

      expect(prose).toEqual([ABOUT.provenance.almanacRole, ABOUT.provenance.frontierOwnership]);
    });

    it('states nothing anywhere about a live game or a live catalogue', () => {
      expect(textOf(query(render(), '.help-dialog'))).not.toMatch(
        /live game|live catalogue|up to date/i,
      );
    });
  });

  describe('the one legal body it embeds', () => {
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

    it('offers exactly one external action in the whole modal', () => {
      // FR-009's package-defect action was withdrawn with the design review, so
      // one is the count for the modal and not only for this section.
      expect(element(render()).querySelectorAll('edsb-warned-external-link').length).toBe(1);
    });

    it('offers exactly one remaining-terms destination, and no other link', () => {
      const fixture = render();
      const links = [...element(fixture).querySelectorAll('a')];

      expect(links.length).toBe(1);
      expect(links[0]?.getAttribute('href')).toBe(LICENCE.link.href);
      expect(textOf(links[0])).toBe(LICENCE.link.label);
      expect(textOf(query(fixture, '.warned-external__warnings'))).toContain(LICENCE.link.purpose);
    });

    it('says what this project grants before it quotes what it cannot', () => {
      const fixture = render();
      const licence = element(fixture).querySelectorAll<HTMLElement>('.help-dialog__section')[2];
      const order = [
        ...licence.querySelectorAll<HTMLElement>(
          '.help-dialog__heading, .help-dialog__prose, edsb-legal-excerpt, edsb-warned-external-link',
        ),
      ];

      expect(order.map((node) => node.tagName.toLowerCase())).toEqual([
        'h3',
        'p',
        'edsb-legal-excerpt',
        'edsb-warned-external-link',
      ]);
    });
  });
});
