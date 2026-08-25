import { Injectable, computed, inject } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import type { BuildIdentity } from '../../domain/distribution/help-manifest';
import { HELP_MANIFEST } from '../../platform/build/help-manifest.generated';
import type { VersionFact } from '../../ui/components/version-facts/version-facts';
import { HelpDialogStore } from './help-dialog.store';

/** The one navigation out of the modal, with everything it has to say first. */
export interface HelpExternalLinkView {
  readonly label: string;
  readonly href: string;
  readonly purpose: string;
  readonly leavingWarning: string;
  readonly networkWarning: string;
}

/**
 * The LICENCE section, as a reader meets it.
 *
 * `excerpt` is the manifest's `exactText`, passed through untouched: no trim,
 * no re-wrap, no interpolation and no translation. `excerptLanguage` travels
 * with it because the text is English whatever language the framing is in, and
 * a reader whose interface is German should not be read it in a German voice.
 */
export interface HelpLicenceView {
  readonly framing: string;
  readonly sourceNotice: string;
  readonly languageNotice: string;
  readonly excerpt: string;
  readonly excerptLanguage: string;
  readonly link: HelpExternalLinkView;
}

/**
 * The ABOUT section, as a reader meets it.
 *
 * `facts` is what the reference draws as `APP VERSION 4.2.1 · LIBRARY VERSION
 * 3.8.0.3`, except that every value is read off the build rather than typed
 * into a template — which is what that line in the reference is, and what it
 * would still say a year after it stopped being true.
 *
 * `provenance` is two sentences and stays two: what the bundled Almanac is
 * responsible for, and who owns the game data and imagery it describes. Both
 * are bounded on purpose. Neither says, or may be extended to say, that any of
 * it matches the live game or a live catalogue — this application ships a
 * package and knows only what that package was when it was bundled.
 */
export interface HelpAboutView {
  readonly facts: readonly VersionFact[];
  readonly provenance: HelpProvenanceView;
}

/** What the bundled package answers for, and who owns what it describes. */
export interface HelpProvenanceView {
  readonly almanacRole: string;
  readonly frontierOwnership: string;
}

/**
 * Which build this is, in words.
 *
 * A pure function of the identity and a message resolver, exported so both of
 * its branches can be exercised over a value. A test that can only reach the
 * one state this checkout happens to be in is a test that stops covering the
 * other one on the day it starts mattering — and the release wording is
 * precisely the branch nobody sees until a release is cut.
 *
 * A non-release build always carries its identifier, and the type is what
 * guarantees it: `buildId` exists on that variant of `BuildIdentity` and on no
 * other, so a non-release value without one does not compile rather than
 * reaching a reader as a bare word.
 */
export function describeBuild(
  build: BuildIdentity,
  message: (
    key: 'help.about.build.release' | 'help.about.build.nonRelease',
    params?: Record<string, string>,
  ) => string,
): string {
  return build.kind === 'release'
    ? message('help.about.build.release')
    : message('help.about.build.nonRelease', { buildId: build.buildId });
}

/** The three sections the reference draws, in the order it draws them. */
export interface HelpSectionHeadings {
  readonly about: string;
  readonly faq: string;
  readonly licence: string;
}

/**
 * Everything the modal draws, already in the Commander's language.
 *
 * It grows a section at a time — this is the shell the three stories fill in.
 * What it will never grow is a loading, empty, missing-artifact or legal-error
 * member: every fact in it comes from a module that was compiled into the
 * bundle, so there is no moment at which the modal has been opened and does
 * not yet know what to say.
 */
export interface HelpDialogViewModel {
  readonly title: string;
  readonly purpose: string;
  readonly sections: HelpSectionHeadings;
  readonly about: HelpAboutView;
  readonly licence: HelpLicenceView;
}

/**
 * The modal's one source of display text.
 *
 * It joins two things that are each already settled: the generated manifest,
 * which is build evidence and cannot change while the application is running,
 * and the active catalogue, which changes only when a Commander's locale is
 * committed. Both are read as signals, so switching language re-reads the
 * whole view rather than leaving a half-translated modal on screen.
 *
 * The manifest is imported eagerly and by value. Help has to open with no
 * network — on the first offline visit after one completed load — and a lazy
 * chunk is a request waiting to fail (FR-001).
 */
@Injectable({ providedIn: 'root' })
export class HelpPresenter {
  readonly #messages = inject(MessageService);
  readonly #dialog = inject(HelpDialogStore);

  /** The build evidence this view is a reading of. Never mutated. */
  readonly manifest = HELP_MANIFEST;

  readonly open = this.#dialog.open;

  readonly view = computed<HelpDialogViewModel>(() => ({
    title: this.#messages.message('help.title'),
    purpose: this.#messages.message('help.purpose'),
    sections: {
      about: this.#messages.message('help.section.about'),
      faq: this.#messages.message('help.section.faq'),
      licence: this.#messages.message('help.section.licence'),
    },
    about: this.#about(),
    licence: this.#licence(),
  }));

  /**
   * The identity facts, and the two sentences that bound them.
   *
   * Three facts rather than two: which application, which build of it, and
   * which catalogue it was bundled with. The build is its own fact because a
   * version alone does not say whether anyone released it — a Commander reading
   * `0.1.0` off a branch build and a Commander reading it off a published one
   * are looking at different software, and only one of those is a version
   * anybody can go and get.
   *
   * The build id is joined to its state in one value rather than given a fact
   * of its own. It is not a separate thing to know — it is which non-release
   * build this is — and a term for it would be a label a reader has to hold
   * against the state above it.
   */
  readonly #about = computed<HelpAboutView>(() => {
    const build = this.manifest.build;

    return {
      facts: [
        {
          id: 'application',
          term: this.#messages.message('help.about.version.application'),
          value: build.applicationVersion,
        },
        {
          id: 'build',
          term: this.#messages.message('help.about.build'),
          value: describeBuild(build, (key, params) => this.#messages.message(key, params)),
        },
        {
          id: 'almanac',
          term: this.#messages.message('help.about.version.almanac'),
          value: this.manifest.almanac.version,
        },
      ],
      provenance: {
        almanacRole: this.#messages.message('help.about.provenance.almanac'),
        frontierOwnership: this.#messages.message('help.about.provenance.frontier'),
      },
    };
  });

  /**
   * The licence block: framing this application wrote, around text it did not.
   *
   * Everything the reader is told about the excerpt is translated; the excerpt
   * itself is the manifest's own string, and the destination is the manifest's
   * own URL. Neither is assembled here — a URL built from parts is a URL that
   * can be built wrongly, and this one is audited at build time.
   */
  readonly #licence = computed<HelpLicenceView>(() => {
    const disclaimer = this.manifest.disclaimer;
    const destination = this.manifest.destinations.repositoryLicense;

    return {
      framing: this.#messages.message('help.licence.framing'),
      sourceNotice: this.#messages.message('help.licence.source'),
      languageNotice: this.#messages.message('help.licence.language'),
      excerpt: disclaimer.exactText,
      excerptLanguage: disclaimer.language,
      link: {
        label: this.#messages.message('help.licence.link.label'),
        href: destination.url,
        purpose: this.#messages.message('help.licence.link.purpose'),
        leavingWarning: this.#messages.message('help.external.leaving'),
        networkWarning: this.#messages.message('help.external.network'),
      },
    };
  });

  /** The frame action's visible label and its description for a reader. */
  readonly actionLabel = this.#messages.messageSignal('help.action.label');
  readonly actionDescription = this.#messages.messageSignal('help.action.description');
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  openDialog(): void {
    this.#dialog.openDialog({ kind: 'global' });
  }

  closeDialog(): void {
    this.#dialog.closeDialog();
  }
}
