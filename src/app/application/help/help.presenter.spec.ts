import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';
import englishMessages from '../../i18n/locales/en.json';
import { HELP_TOPIC_IDS } from '../../domain/help/help-topic';
import { HELP_MANIFEST } from '../../platform/build/help-manifest.generated';
import { HELP_TOPICS } from '../../platform/build/help-topics.generated';
import { HelpDialogStore } from './help-dialog.store';
import { HelpPresenter } from './help.presenter';

class SilentDocumentAdapter {
  commitRootState(): void {}
}

describe('HelpPresenter', () => {
  function presenter(): HelpPresenter {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideLocalization(),
        { provide: DocumentAdapter, useValue: new SilentDocumentAdapter() },
      ],
    });
    return TestBed.inject(HelpPresenter);
  }

  it('reads the generated manifest that was compiled into the bundle', () => {
    expect(presenter().manifest).toBe(HELP_MANIFEST);
  });

  it('resolves the title, purpose and the reference’s three section headings', () => {
    const view = presenter().view();

    expect(view.title.length).toBeGreaterThan(0);
    expect(view.purpose.length).toBeGreaterThan(0);
    expect(view.sections.about.length).toBeGreaterThan(0);
    expect(view.sections.faq.length).toBeGreaterThan(0);
    expect(view.sections.licence.length).toBeGreaterThan(0);
  });

  it('never resolves a message to its own key or to a blank string', () => {
    const view = presenter().view();
    const resolved = [
      view.title,
      view.purpose,
      view.sections.about,
      view.sections.faq,
      view.sections.licence,
      ...view.licence.index.flatMap((entry) => [
        entry.before,
        entry.after,
        ...(entry.link === null ? [] : [entry.link.label]),
      ]),
      ...view.topics.flatMap((topic) => [topic.question, topic.answer]),
      view.about.maintainer,
      view.about.source.before,
      view.about.source.after,
      ...(view.about.source.link === null ? [] : [view.about.source.link.label]),
      ...view.about.facts.flatMap((fact) => [fact.term, fact.value]),
    ];

    for (const text of resolved) {
      expect(text).not.toMatch(/^help\./);
      expect(text).not.toContain('{{');
      // The marker the licence lines are cut at never survives into a view: it
      // is split out before the pieces are published, and one reaching a
      // template would be drawn as a control character.
      expect(text).not.toContain('\u0000');
    }

    // Nothing resolved is blank, except the tail of a line whose link sits at
    // its end — which is most of them, and is a cut rather than a message.
    for (const text of resolved.filter((_, index) => index < 5)) {
      expect(text.trim()).not.toBe('');
    }
  });

  it('has no loading, empty or legal-error state to be in', () => {
    // Every fact comes from a module the bundle already holds, so the view
    // model has no member that could describe not knowing one yet.
    const view = presenter().view();

    expect(Object.keys(view).sort()).toEqual([
      'about',
      'licence',
      'purpose',
      'sections',
      'title',
      'topics',
    ]);
  });

  it('opens and closes through the store it shares with the frame', () => {
    const help = presenter();
    const store = TestBed.inject(HelpDialogStore);

    expect(help.open()).toBe(false);
    help.openDialog();
    expect(help.open()).toBe(true);
    expect(store.invocation()).toEqual({ kind: 'global' });

    help.closeDialog();
    expect(help.open()).toBe(false);
  });

  describe('the identity projection', () => {
    it('reads the two versions off the manifest, as two separate facts', () => {
      const facts = presenter().view().about.facts;
      const byId = new Map(facts.map((fact) => [fact.id, fact]));

      expect(facts.length).toBe(2);
      expect(byId.get('application')?.value).toBe(HELP_MANIFEST.build.applicationVersion);
      expect(byId.get('almanac')?.value).toBe(HELP_MANIFEST.almanac.version);
      // Separate facts, not one line: each carries its own term, and the two
      // terms differ. A reader meeting one of these values has been told which
      // of the two it is.
      expect(byId.get('application')?.term).not.toBe(byId.get('almanac')?.term);
      expect(new Set(facts.map((fact) => fact.term)).size).toBe(facts.length);
    });

    it('publishes no release state, which the reference draws nowhere', () => {
      // The generator still classifies the build — that classification gates
      // `SHIP_BUILDER_RELEASE_TAG` and fails a mismatched one — but FR-007's
      // display half is withdrawn, so nothing in the view says which it is.
      const view = presenter().view();
      const everything = [
        view.purpose,
        view.about.maintainer,
        view.about.source.before,
        view.about.source.after,
        ...view.about.facts.flatMap((fact) => [fact.term, fact.value]),
      ].join(' ');

      expect(view.about.facts.some((fact) => fact.id === 'build')).toBe(false);
      expect(everything).not.toMatch(/non-release|release/i);
    });

    it('states nothing about a live game or a live catalogue', () => {
      const view = presenter().view();
      const everything = [
        view.purpose,
        view.about.maintainer,
        view.about.source.before,
        view.about.source.after,
        ...view.about.facts.flatMap((fact) => [fact.term, fact.value]),
        ...view.topics.flatMap((topic) => [topic.question, topic.answer]),
      ].join(' ');

      expect(everything).not.toMatch(/live game|live catalogue|up to date|latest version/i);
    });

    // The once-per-application Almanac credit feature 002's voice ruling put in
    // this feature. It is the licence summary's library line: the line names
    // the bundled library and links its terms, and around thirty strings
    // elsewhere say nothing about the package because this one does
    // (FR-003, FR-008).
    it('credits the bundled library by name in the line that gives its terms', () => {
      const library = presenter()
        .view()
        .licence.index.find((entry) => entry.id === 'library');

      expect(`${library?.before}${library?.after}`).toMatch(/almanac/i);
      expect(library?.link?.href).toBe(HELP_MANIFEST.destinations.almanacLicense.url);
    });

    // Where the source is, as one sentence with the destination inside it. The
    // link comes from the audited manifest rather than from a string typed
    // here, and the sentence is cut at the place its own translation put the
    // link (FR-003, FR-008).
    it('offers this application’s own source, from the audited destination', () => {
      const source = presenter().view().about.source;

      expect(source.link?.href).toBe(HELP_MANIFEST.destinations.repositorySource.url);
      expect(source.link?.label).toBe(englishMessages['help.source.link']);
      expect(`${source.before}${source.link?.label ?? ''}${source.after}`).toBe(
        englishMessages['help.source'].replace('{{source}}', englishMessages['help.source.link']),
      );
    });

    it('names who maintains the application, in its own sentence', () => {
      // Two sentences from two keys, and the presenter's whole job here is
      // putting each in its own field. Asserting the resolved key rather than a
      // length, because a length check would pass with both fields wired to the
      // same message.
      const view = presenter().view();

      expect(view.about.maintainer).toBe(englishMessages['help.maintainer']);
      expect(view.about.source.before).toBe(
        englishMessages['help.source'].slice(0, englishMessages['help.source'].indexOf('{{')),
      );
      expect(view.about.maintainer).not.toBe(view.purpose);
    });
  });

  describe('the topic projection', () => {
    it('publishes every topic, once each, in the declared order', () => {
      const topics = presenter().view().topics;

      expect(topics.map((topic) => topic.id)).toEqual([...HELP_TOPIC_IDS]);
      expect(new Set(topics.map((topic) => topic.id)).size).toBe(HELP_TOPIC_IDS.length);
    });

    it('resolves every question and answer out of the active catalogue', () => {
      const topics = presenter().view().topics;

      for (const [index, topic] of topics.entries()) {
        const generated = HELP_TOPICS[index];

        expect(topic.question).toBe(
          englishMessages[generated?.questionKey as keyof typeof englishMessages],
        );
        expect(topic.answer).toBe(
          englishMessages[generated?.answerKey as keyof typeof englishMessages],
        );
      }
    });

    it('draws no raw key, blank value, unresolved variable or markup', () => {
      for (const topic of presenter().view().topics) {
        for (const text of [topic.question, topic.answer]) {
          expect(text.trim()).not.toBe('');
          expect(text).not.toMatch(/^help\./);
          expect(text).not.toContain('{{');
          expect(text).not.toMatch(/<[a-z/]/i);
        }
      }
    });

    it('carries neither the import promise nor the retained-partial-roll claim', () => {
      // The two reference answers this application cannot make. The generator
      // refuses a catalogue that reintroduces the second; the first is a topic
      // feature 004 owns and is not one of the two here.
      const answers = presenter()
        .view()
        .topics.map((topic) => topic.answer)
        .join(' ');

      expect(answers).not.toMatch(
        /retain(s|ed)?\s+(its|their|the)?\s*(original|real|partial)\s+roll/i,
      );
      expect(answers).not.toMatch(/coming soon|will soon|in a future (release|version)/i);
    });

    it('publishes no governing reference to the browser', () => {
      // The requirement and principle ids each answer is justified by are
      // review evidence. A specification index has no business in a product
      // download, and the generated module is where that is enforced.
      const topics = presenter().view().topics;

      for (const topic of topics) {
        expect(Object.keys(topic).sort()).toEqual(['answer', 'id', 'question']);
      }
      for (const generated of HELP_TOPICS) {
        expect(Object.keys(generated).sort()).toEqual(['answerKey', 'id', 'questionKey']);
      }
    });
  });

  describe('the licence projection', () => {
    it('passes the disclaimer through exactly as the manifest carries it', () => {
      const licence = presenter().view().licence;

      expect(licence.excerpt).toBe(HELP_MANIFEST.disclaimer.exactText);
      expect(licence.excerptLanguage).toBe(HELP_MANIFEST.disclaimer.language);
    });

    it('summarises what covers what, one claim to a line', () => {
      const index = presenter().view().licence.index;

      expect(index.map((entry) => entry.id)).toEqual([
        'application',
        'library',
        'icons',
        'gameData',
        'typefaces',
      ]);

      // A line with no link is the whole sentence and nothing after it.
      for (const id of ['icons', 'gameData'] as const) {
        const entry = index.find((line) => line.id === id);
        expect(entry?.before).toBe(englishMessages[`help.licence.index.${id}`]);
        expect(entry?.link).toBeNull();
        expect(entry?.after).toBe('');
      }
    });

    it('cuts a linked line at the place its own translation put the link', () => {
      const index = presenter().view().licence.index;

      for (const id of ['application', 'library'] as const) {
        const entry = index.find((line) => line.id === id);
        const key = `help.licence.index.${id}` as const;

        // Rejoining the pieces with the link's own words gives the sentence
        // back, with the placeholder filled rather than dropped: the cut moves
        // with the translation instead of assuming the link comes last.
        expect(`${entry?.before}${entry?.link?.label}${entry?.after}`).toBe(
          englishMessages[key].replace('{{licence}}', entry?.link?.label ?? ''),
        );
        expect(entry?.link?.label.trim()).not.toBe('');
      }
    });

    it('takes both destinations from the audited manifest, never from a string', () => {
      const index = presenter().view().licence.index;
      const hrefs = new Map(
        index.filter((entry) => entry.link !== null).map((entry) => [entry.id, entry.link?.href]),
      );

      // The two complete-licence documents this repository can evidence: its
      // own terms, and the bundled library's. Both come off the generated
      // manifest, which is where they were audited (FR-003, FR-005).
      expect(hrefs.get('application')).toBe(HELP_MANIFEST.destinations.repositoryLicense.url);
      expect(hrefs.get('library')).toBe(HELP_MANIFEST.destinations.almanacLicense.url);
      expect([...hrefs.keys()].sort()).toEqual(['application', 'library']);
    });

    it('links two of the summary lines and no more, and draws no URL as text', () => {
      const view = presenter().view();
      const index = view.licence.index;

      // Two links in the summary, both complete legal terms. An issue tracker
      // or a docs site reaching this list would be a navigation nobody
      // accepted; the source is `ABOUT`'s sentence and is not in this list.
      const links = index.filter((entry) => entry.link !== null);
      expect(links).toHaveLength(2);

      // And no URL is drawn as words, in any sentence that carries a link. A
      // Commander reads what the destination is, not where it is: an address in
      // the visible text is a thing to mistype, and it would wrap the line
      // sideways at 200% text.
      for (const entry of [...index, view.about.source]) {
        expect(entry.before).not.toMatch(/https?:/);
        expect(entry.after).not.toMatch(/https?:/);
        expect(entry.link?.label ?? '').not.toMatch(/https?:/);
      }
    });

    it('names each destination in the words it draws, and adds nothing to them', () => {
      const index = presenter().view().licence.index;
      const links = index.flatMap((entry) => (entry.link === null ? [] : [entry.link]));

      // Both links read alike, which is right: both are an MIT licence on
      // GitHub. Which document each covers is the line's own leading label —
      // `App ·` against `Library ·` — so the link does not repeat it, and a
      // reader is not read a second sentence they cannot see.
      expect(Object.keys(links[0]).sort()).toEqual(['href', 'label']);
      for (const link of links) {
        expect(link.label).toContain('GitHub');
      }
      expect(index[0].before.trim()).not.toBe(index[1].before.trim());
    });

    it('keeps the excerpt out of the catalogue that would translate it', () => {
      const licence = presenter().view().licence;

      // The summary is application-owned text and is resolved; the excerpt is
      // Frontier's wording and is carried. A catalogue entry holding it would
      // be a translated legal notice waiting to happen.
      expect(Object.values(englishMessages)).not.toContain(licence.excerpt);
    });
  });
});
