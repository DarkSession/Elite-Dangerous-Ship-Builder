import { TestBed } from '@angular/core/testing';
import { DocumentAdapter } from '../../platform/browser/document.adapter';
import { provideLocalization } from '../../i18n/i18n.providers';
import englishMessages from '../../i18n/locales/en.json';
import { HELP_MANIFEST } from '../../platform/build/help-manifest.generated';
import { HelpDialogStore } from './help-dialog.store';
import { HelpPresenter, describeBuild } from './help.presenter';

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
      view.licence.framing,
      view.licence.sourceNotice,
      view.licence.languageNotice,
      view.licence.link.label,
      view.licence.link.purpose,
      view.licence.link.leavingWarning,
      view.licence.link.networkWarning,
      view.about.provenance.almanacRole,
      view.about.provenance.frontierOwnership,
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

    expect(Object.keys(view).sort()).toEqual(['about', 'licence', 'purpose', 'sections', 'title']);
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
    /** The one fact whose value is a state rather than a version. */
    function buildFact(view = presenter().view()) {
      const fact = view.about.facts.find((candidate) => candidate.id === 'build');
      if (fact === undefined) {
        throw new Error('The ABOUT section published no build fact.');
      }
      return fact;
    }

    it('reads the two versions off the manifest, as two separate facts', () => {
      const facts = presenter().view().about.facts;
      const byId = new Map(facts.map((fact) => [fact.id, fact]));

      expect(byId.get('application')?.value).toBe(HELP_MANIFEST.build.applicationVersion);
      expect(byId.get('almanac')?.value).toBe(HELP_MANIFEST.almanac.version);
      // Separate facts, not one line: each carries its own term, and the two
      // terms differ. A reader meeting one of these values has been told which
      // of the two it is.
      expect(byId.get('application')?.term).not.toBe(byId.get('almanac')?.term);
      expect(new Set(facts.map((fact) => fact.term)).size).toBe(facts.length);
    });

    it('states the build as a fact of its own, in words', () => {
      const fact = buildFact();

      expect(fact.term.trim()).not.toBe('');
      expect(fact.value.trim()).not.toBe('');
    });

    it('always carries the build identifier when nobody released this build', () => {
      const build = HELP_MANIFEST.build;
      if (build.kind !== 'nonRelease') {
        throw new Error(
          'This repository produces non-release builds; a release manifest here means the ' +
            'classification changed and this expectation needs revisiting.',
        );
      }

      expect(buildFact().value).toContain(build.buildId);
      expect(buildFact().value).toContain(
        englishMessages['help.about.build.nonRelease'].slice(0, 11),
      );
    });

    it('says Release for a build the generator classified as one, and only then', () => {
      // Both branches, over values rather than over the one manifest this
      // checkout produces. The release wording is the branch nobody sees until
      // a release is cut, which is exactly why it is asserted here rather than
      // left to the state the repository happens to be in.
      const message = (key: string, params?: Record<string, string>) =>
        Object.entries(params ?? {}).reduce(
          (text, [name, value]) => text.replaceAll(`{{${name}}}`, value),
          englishMessages[key as keyof typeof englishMessages],
        );

      const released = describeBuild({ kind: 'release', applicationVersion: '1.4.0' }, message);
      const unreleased = describeBuild(
        { kind: 'nonRelease', applicationVersion: '1.4.0', buildId: 'abc1234' },
        message,
      );

      expect(released).toBe(englishMessages['help.about.build.release']);
      expect(unreleased).not.toBe(released);
      expect(unreleased).toContain('abc1234');
      // The identifier is substituted, not left as the placeholder it came in
      // as: a reader seeing `{{buildId}}` has been told nothing.
      expect(unreleased).not.toContain('{{');
      // And the released wording carries no identifier at all — there is
      // nothing to disambiguate about a build anybody can go and get.
      expect(released).not.toContain('abc1234');
    });

    it('bounds provenance to what the package does and who owns what it describes', () => {
      const provenance = presenter().view().about.provenance;

      expect(provenance.almanacRole).toBe(englishMessages['help.about.provenance.almanac']);
      expect(provenance.frontierOwnership).toBe(englishMessages['help.about.provenance.frontier']);
      // No currency claim, in either sentence: this application ships a package
      // and knows only what that package was when it was bundled.
      for (const sentence of [provenance.almanacRole, provenance.frontierOwnership]) {
        expect(sentence).not.toMatch(/live|current|up to date|latest|as of/i);
      }
    });
  });

  describe('the licence projection', () => {
    it('passes the disclaimer through exactly as the manifest carries it', () => {
      const licence = presenter().view().licence;

      expect(licence.excerpt).toBe(HELP_MANIFEST.disclaimer.exactText);
      expect(licence.excerptLanguage).toBe(HELP_MANIFEST.disclaimer.language);
    });

    it('takes the destination from the manifest rather than assembling one', () => {
      const licence = presenter().view().licence;

      expect(licence.link.href).toBe(HELP_MANIFEST.destinations.repositoryLicense.url);
      expect(new URL(licence.link.href).search).toBe('');
      expect(new URL(licence.link.href).hash).toBe('');
    });

    it('keeps the excerpt out of the catalogue that would translate it', () => {
      const licence = presenter().view().licence;

      // The framing is application-owned text and is resolved; the excerpt is
      // Frontier's wording and is carried. A catalogue entry holding it would
      // be a translated legal notice waiting to happen.
      expect(licence.framing).not.toMatch(/^help\./);
      expect(Object.values(englishMessages)).not.toContain(licence.excerpt);
    });
  });
});
