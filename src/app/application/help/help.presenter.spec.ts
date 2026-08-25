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
      ...view.licence.index.map((entry) => entry.text),
      ...view.topics.flatMap((topic) => [topic.question, topic.answer]),
      ...view.about.facts.flatMap((fact) => [fact.term, fact.value]),
    ];

    for (const text of resolved) {
      expect(text.trim()).not.toBe('');
      expect(text).not.toMatch(/^help\./);
      expect(text).not.toContain('{{');
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
        ...view.about.facts.flatMap((fact) => [fact.term, fact.value]),
      ].join(' ');

      expect(view.about.facts.some((fact) => fact.id === 'build')).toBe(false);
      expect(everything).not.toMatch(/non-release|release/i);
    });

    it('states nothing about a live game or a live catalogue', () => {
      const view = presenter().view();
      const everything = [
        view.purpose,
        ...view.about.facts.flatMap((fact) => [fact.term, fact.value]),
        ...view.topics.flatMap((topic) => [topic.question, topic.answer]),
      ].join(' ');

      expect(everything).not.toMatch(/live game|live catalogue|up to date|latest version/i);
    });
  });

  describe('the topic projection', () => {
    it('publishes all seven topics, once each, in the declared order', () => {
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
      // feature 004 owns and is simply not one of the seven.
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

    it('summarises what covers what in the reference’s three lines', () => {
      const index = presenter().view().licence.index;

      expect(index.map((entry) => entry.id)).toEqual(['application', 'gameData', 'typefaces']);
      expect(index.map((entry) => entry.text)).toEqual([
        englishMessages['help.licence.index.application'],
        englishMessages['help.licence.index.gameData'],
        englishMessages['help.licence.index.typefaces'],
      ]);
    });

    it('offers no destination out of the application', () => {
      // The reference draws no link in the modal. FR-003's GitHub action is
      // withdrawn with the rest of the framing this feature had added around
      // the reference's own licence block.
      const licence = presenter().view().licence;

      expect(Object.keys(licence).sort()).toEqual(['excerpt', 'excerptLanguage', 'index']);
      expect(JSON.stringify(licence.index)).not.toMatch(/https?:/);
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
