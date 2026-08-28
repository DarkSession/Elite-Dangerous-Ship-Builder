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
 * The marker a sentence's link is cut out at.
 *
 * A control character rather than a word: it has to be something no catalogue,
 * in any language, could contain by accident, and it never reaches the DOM
 * because every line is split on it before it is rendered.
 */
const LINK_MARKER = '\u0000link\u0000';

/**
 * The LICENCE section, as a reader meets it.
 *
 * `index` is the licence summary: what this project's code is under, what the
 * bundled library is under, what the game data and imagery are under, and what
 * the typefaces are under. It is a summary and says so by being one — two of
 * its lines link to the complete document they summarise, and the one body
 * embedded here is the notice below it.
 *
 * `excerpt` is the manifest's `exactText`, passed through untouched: no trim,
 * no re-wrap, no interpolation and no translation. `excerptLanguage` travels
 * with it because the text is English whatever language the index is in, and a
 * reader whose interface is German should not be read it in a German voice.
 */
export interface HelpLicenceView {
  readonly index: readonly LinkedSentence[];
  readonly excerpt: string;
  readonly excerptLanguage: string;
}

/**
 * One sentence with at most one link inside it, and an identity to track it by.
 *
 * It arrives already cut into the three pieces a template needs: the words
 * before the link, the link itself, and the words after. The cut is made here
 * rather than in the template because it is a property of the translated
 * sentence — where the link sits in a German line is the translator's decision,
 * not the layout's, and a template that hard-coded "text, then link" would
 * silently move it.
 *
 * `link` is `null` for a line that names terms this repository cannot point at:
 * Frontier's media-usage rules are not a document with an address here, and
 * inventing one would be exactly the unevidenced claim FR-003 refuses.
 */
export interface LinkedSentence {
  readonly id: string;
  readonly before: string;
  readonly link: HelpLink | null;
  readonly after: string;
}

/** The linked words inside one sentence, and where they go. */
export interface HelpLink {
  /** The visible words. They name the destination, because it leaves the app. */
  readonly label: string;
  readonly href: string;
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
  /**
   * Who builds this, under the sentence saying what it is.
   *
   * The reference draws no such line. It is here at the owner's request of
   * 2026-08-27: a bench a Commander found through a shared link has nobody's
   * name on it anywhere else, and an application with no author reads as one
   * nobody stands behind.
   */
  readonly maintainer: string;
  /**
   * Where the source is, in one sentence with the destination inside it.
   *
   * Cut into three pieces the same way a licence line is, and for the same
   * reason: where the link sits in a German sentence is the translator's
   * decision rather than the layout's (FR-008).
   */
  readonly source: LinkedSentence;
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
   * What `ABOUT` says beside the two identity facts the reference draws.
   *
   * Which application, and which catalogue it was bundled with. Both are terms
   * with values rather than one run-together line, because each value means
   * nothing without the label beside it: a reader who meets `0.1.8` alone has
   * been told a number, not a version.
   */
  readonly #about = computed<HelpAboutView>(() => ({
    maintainer: this.#messages.message('help.maintainer'),
    source: this.#linkedSentence('source', 'help.source', 'source', {
      label: this.#messages.message('help.source.link'),
      href: this.manifest.destinations.repositorySource.url,
    }),
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
   * The topics, resolved once and in the order they are read.
   *
   * The catalogue is re-asserted here rather than trusted. It is generated, and
   * generated correctly, but the assertion costs nothing and the failure it
   * prevents is the one that matters: a modal that quietly dropped a topic it
   * could not resolve looks exactly like a modal for an application that does
   * not do that thing. A Commander reading a FAQ with no answer about where
   * their builds are kept would reasonably conclude there was nothing to say
   * about it.
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
   * The licence block: a four-line summary, then the notice itself.
   *
   * The summary is translated, because it is this application's own writing
   * about what covers what. The notice is not: it is Frontier's wording,
   * carried rather than granted, and the manifest's own string is what reaches
   * the reader byte for byte.
   *
   * Two of the four lines carry a link to the complete document they are
   * summarising — this repository's `LICENSE` and the bundled library's — from
   * the audited destinations in the manifest, never from a string typed here.
   * The other two do not, because there is no address this repository can
   * evidence for them.
   */
  readonly #licence = computed<HelpLicenceView>(() => {
    const disclaimer = this.manifest.disclaimer;
    const destinations = this.manifest.destinations;

    return {
      index: [
        this.#linkedSentence('application', 'help.licence.index.application', 'licence', {
          label: this.#messages.message('help.licence.link.application'),
          href: destinations.repositoryLicense.url,
        }),
        this.#linkedSentence('library', 'help.licence.index.library', 'licence', {
          label: this.#messages.message('help.licence.link.library'),
          href: destinations.almanacLicense.url,
        }),
        this.#linkedSentence('gameData', 'help.licence.index.gameData', 'licence', null),
        this.#linkedSentence('typefaces', 'help.licence.index.typefaces', 'licence', null),
      ],
      excerpt: disclaimer.exactText,
      excerptLanguage: disclaimer.language,
    };
  });

  /**
   * One sentence, cut around the link its own translation placed.
   *
   * The sentence is resolved with the marker above standing in for the link, so
   * the split happens on a character sequence no catalogue contains rather than
   * on the link's own words — which a translator may legitimately repeat
   * elsewhere in the same line.
   *
   * A line whose translation dropped the placeholder cannot be cut, and the
   * link would vanish silently. It does not go silently: the whole sentence is
   * kept and the link is published after it, so the destination is still
   * reachable while the wording is wrong. The wording itself is a build-time
   * gate — `catalogueViolations` fails any locale whose interpolation variables
   * disagree with English — so this is the belt to that braces.
   *
   * `variable` is the placeholder the sentence writes the link as, because the
   * two sentences that carry one name it for what it is: a licence line's
   * `{{licence}}`, and the source line's `{{source}}`.
   */
  #linkedSentence(
    id: string,
    key:
      | 'help.source'
      | 'help.licence.index.application'
      | 'help.licence.index.library'
      | 'help.licence.index.gameData'
      | 'help.licence.index.typefaces',
    variable: 'licence' | 'source',
    link: HelpLink | null,
  ): LinkedSentence {
    if (link === null) {
      return { id, before: this.#messages.message(key), link: null, after: '' };
    }

    const resolved = this.#messages.message(key, { [variable]: LINK_MARKER });
    const marker = resolved.indexOf(LINK_MARKER);
    if (marker === -1) {
      return { id, before: `${resolved} `, link, after: '' };
    }

    return {
      id,
      before: resolved.slice(0, marker),
      link,
      after: resolved.slice(marker + LINK_MARKER.length),
    };
  }

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
