/**
 * The seven questions the modal answers, as identities rather than as text.
 *
 * The wording lives in the locale catalogues, because it is application-owned
 * text and every application-owned string in this repository is translatable
 * (constitution VI). What lives here is the set: which questions exist, in what
 * order, and the rule that says a catalogue missing one of them is not a
 * catalogue to publish.
 *
 * The reference canvas asks four questions, two of which this application
 * cannot answer honestly — it promises an import behaviour feature 004 owns,
 * and it says imported modules keep their real roll, which contradicts
 * constitution IV and feature 002. The accepted set replaces them
 * (`contracts/help-navigation.md`, "Required help topics").
 */

/** The exact seven identities, in the order the modal reads them. */
export const HELP_TOPIC_IDS = [
  'buildLinkPrivacy',
  'accountsUploadsTelemetry',
  'browserPersistence',
  'offlineAssets',
  'completedEngineeringGrades',
  'hullFactsAndBuildResults',
  'almanacOwnership',
] as const;

export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];

/**
 * One topic as the browser receives it.
 *
 * Message keys, never resolved text: the generated catalogue is built once and
 * read in whatever language the Commander is using. Note what is absent — the
 * governing requirement and principle references that justify each answer stay
 * in `scripts/help-topic-definitions.mjs` and never reach the bundle. They are
 * review evidence, and shipping them would put a specification index in a
 * product download for no reader's benefit.
 */
export interface BrowserHelpTopic {
  readonly id: HelpTopicId;
  readonly questionKey: string;
  readonly answerKey: string;
}

/**
 * Checks that a catalogue is the complete seven, once each, in order.
 *
 * "Or throws" rather than "or filters": a modal that quietly drops a topic it
 * could not resolve looks exactly like a modal for an application that does not
 * do that thing. A Commander reading a help section with no answer about build
 * links would reasonably conclude there was nothing to say about build links.
 */
export function assertCompleteHelpTopicCatalogue(
  topics: readonly BrowserHelpTopic[],
): readonly BrowserHelpTopic[] {
  if (topics.length !== HELP_TOPIC_IDS.length) {
    throw new Error(
      `The help topic catalogue must hold exactly ${HELP_TOPIC_IDS.length} topics; found ${topics.length}.`,
    );
  }

  HELP_TOPIC_IDS.forEach((expected, index) => {
    const topic = topics[index];
    if (topic?.id !== expected) {
      throw new Error(
        `The help topic catalogue is out of order: position ${index} must be "${expected}", found "${
          topic?.id ?? 'nothing'
        }".`,
      );
    }
    if (topic.questionKey.trim().length === 0 || topic.answerKey.trim().length === 0) {
      throw new Error(`Help topic "${expected}" has a blank question or answer key.`);
    }
  });

  return topics;
}
