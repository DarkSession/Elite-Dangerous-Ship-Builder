import { Injectable, computed, inject } from '@angular/core';
import { MessageService } from '../../i18n/message.service';
import type { MessageKey } from '../../i18n/locale-registry';
import {
  HELP_TOPIC_IDS,
  assertCompleteHelpTopicCatalogue,
  type HelpTopicId,
} from '../../domain/help/help-topic';
import { HELP_MANIFEST } from '../../platform/build/help-manifest.generated';
import { HELP_TOPICS } from '../../platform/build/help-topics.generated';
import type { VersionFact } from '../../ui/components/version-facts/version-facts';
import { HelpDialogStore } from './help-dialog.store';

/**
 * The LICENCE section, as a reader meets it.
 *
 * `index` is the reference's own three-line licence summary: what this
 * project's code is under, what the game data and imagery are under, and what
 * the typefaces are under. It is a summary and says so by being one — the
 * terms themselves are in the repository `LICENSE`, and the one body embedded
 * here is the notice below it.
 *
 * `excerpt` is the manifest's `exactText`, passed through untouched: no trim,
 * no re-wrap, no interpolation and no translation. `excerptLanguage` travels
 * with it because the text is English whatever language the index is in, and a
 * reader whose interface is German should not be read it in a German voice.
 */
export interface HelpLicenceView {
  readonly index: readonly HelpLicenceIndexEntry[];
  readonly excerpt: string;
  readonly excerptLanguage: string;
}

/** One line of the licence summary, and a stable identity to track it by. */
export interface HelpLicenceIndexEntry {
  readonly id: string;
  readonly text: string;
}

/**
 * The ABOUT section, as a reader meets it.
 *
 * `facts` is what the reference draws as `APP VERSION 4.2.1 · LIBRARY VERSION
 * 3.8.0.3`, except that both values are read off the build rather than typed
 * into a template — which is what that line in the reference is, and what it
 * would still say a year after it stopped being true.
 *
 * Two facts, because the reference draws two. An earlier revision added a
 * third for release state and the build id; it is withdrawn, and FR-007 is
 * amended to match the reference rather than the other way round. The
 * generator still classifies the build — that classification is release
 * evidence and a gate on `SHIP_BUILDER_RELEASE_TAG` — it is simply not a thing
 * the modal says.
 */
export interface HelpAboutView {
  readonly facts: readonly VersionFact[];
}

/** One question and its answer, already in the Commander's language. */
export interface LocalisedHelpTopic {
  readonly id: HelpTopicId;
  readonly question: string;
  readonly answer: string;
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
 * What it does not have is a loading, empty, missing-artifact or legal-error
 * member: every fact in it comes from a module that was compiled into the
 * bundle, so there is no moment at which the modal has been opened and does
 * not yet know what to say.
 */
export interface HelpDialogViewModel {
  readonly title: string;
  readonly purpose: string;
  readonly sections: HelpSectionHeadings;
  readonly about: HelpAboutView;
  readonly topics: readonly LocalisedHelpTopic[];
  readonly licence: HelpLicenceView;
}

/**
 * The modal's one source of display text.
 *
 * It joins three things that are each already settled: the generated manifest
 * and the generated topic catalogue, which are build evidence and cannot change
 * while the application is running, and the active message catalogue, which
 * changes only when a Commander's locale is committed. All are read as signals,
 * so switching language re-reads the whole view rather than leaving a
 * half-translated modal on screen.
 *
 * Both generated modules are imported eagerly and by value. Help has to open
 * with no network — on the first offline visit after one completed load — and a
 * lazy chunk is a request waiting to fail (FR-001).
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
    topics: this.topics(),
    licence: this.#licence(),
  }));

  /**
   * The two identity facts the reference draws.
   *
   * Which application, and which catalogue it was bundled with. Both are terms
   * with values rather than one run-together line, because each value means
   * nothing without the label beside it: a reader who meets `0.1.8` alone has
   * been told a number, not a version.
   */
  readonly #about = computed<HelpAboutView>(() => ({
    facts: [
      {
        id: 'application',
        term: this.#messages.message('help.about.version.application'),
        value: this.manifest.build.applicationVersion,
      },
      {
        id: 'almanac',
        term: this.#messages.message('help.about.version.almanac'),
        value: this.manifest.almanac.version,
      },
    ],
  }));

  /**
   * The seven topics, resolved once and in the order they are read.
   *
   * The catalogue is re-asserted here rather than trusted. It is generated, and
   * generated correctly, but the assertion costs nothing and the failure it
   * prevents is the one that matters: a modal that quietly dropped a topic it
   * could not resolve looks exactly like a modal for an application that does
   * not do that thing. A Commander reading a FAQ with no answer about build
   * links would reasonably conclude there was nothing to say about build links.
   *
   * A blank or unresolved message is the same failure wearing different
   * clothes, so it throws here too. `MessageService` never echoes a key — an
   * unknown one resolves to the catalogue's unavailable message — which is
   * exactly why a question that came back as that message must not be drawn as
   * though it were a question.
   */
  readonly topics = computed<readonly LocalisedHelpTopic[]>(() => {
    const catalogue = assertCompleteHelpTopicCatalogue(HELP_TOPICS);
    const unavailable = this.#messages.message('message.unavailable');

    return catalogue.map((topic) => {
      const question = this.#messages.message(topic.questionKey as MessageKey);
      const answer = this.#messages.message(topic.answerKey as MessageKey);

      for (const [what, resolved] of [
        ['question', question],
        ['answer', answer],
      ] as const) {
        if (resolved.trim().length === 0 || resolved === unavailable) {
          throw new Error(
            `Help topic "${topic.id}" has no ${what} in the active catalogue. ` +
              'The modal does not publish a partial topic set.',
          );
        }
      }

      return { id: topic.id, question, answer };
    });
  });

  /**
   * The licence block: a three-line summary, then the notice itself.
   *
   * The summary is translated, because it is this application's own writing
   * about what covers what. The notice is not: it is Frontier's wording,
   * carried rather than granted, and the manifest's own string is what reaches
   * the reader byte for byte.
   */
  readonly #licence = computed<HelpLicenceView>(() => {
    const disclaimer = this.manifest.disclaimer;

    return {
      index: [
        { id: 'application', text: this.#messages.message('help.licence.index.application') },
        { id: 'gameData', text: this.#messages.message('help.licence.index.gameData') },
        { id: 'typefaces', text: this.#messages.message('help.licence.index.typefaces') },
      ],
      excerpt: disclaimer.exactText,
      excerptLanguage: disclaimer.language,
    };
  });

  /**
   * The frame action's name, the mark the wide bar draws it as, and what it
   * would do for a reader who cannot see what it sits beside.
   *
   * The name is the accessible name at both widths and the visible words in the
   * compact action layer; the mark is the reference's own `?`, drawn on the
   * wide bar in place of the words and hidden from a reader, who is told the
   * name instead.
   */
  readonly actionLabel = this.#messages.messageSignal('help.action.label');
  readonly actionSymbol = this.#messages.messageSignal('help.action.symbol');
  readonly actionDescription = this.#messages.messageSignal('help.action.description');
  readonly dismissLabel = this.#messages.messageSignal('action.close');

  /** The identities the view is expected to carry, for tests and callers. */
  readonly topicIds = HELP_TOPIC_IDS;

  openDialog(): void {
    this.#dialog.openDialog({ kind: 'global' });
  }

  closeDialog(): void {
    this.#dialog.closeDialog();
  }
}
