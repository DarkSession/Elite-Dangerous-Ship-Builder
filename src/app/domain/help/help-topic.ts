/**
 * The two questions the modal answers, as identities rather than as text.
 *
 * The wording lives in the locale catalogues, because it is application-owned
 * text and every application-owned string in this repository is translatable
 * (constitution VI). What lives here is the set: which questions exist, in what
 * order, and the rule that says a catalogue missing one of them is not a
 * catalogue to publish.
 *
 * The set is the two a Commander cannot answer by reading the interface. Where
 * a build is stored and why an engineered figure differs from the game are both
 * facts about how this application behaves, and neither is written on any
 * screen. Nothing else qualifies: a question the interface, the licence summary
 * or the `ABOUT` section already answers makes a FAQ that repeats the screen
 * behind it, which is a FAQ a reader learns to skip
 * (`contracts/help-navigation.md`, "Required help topics").
 */

/** The exact two identities, in the order the modal reads them. */
export const HELP_TOPIC_IDS = ['browserPersistence', 'completedEngineeringGrades'] as const;

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
 * Checks that a catalogue is the complete set, once each, in order.
 *
 * "Or throws" rather than "or filters": a modal that quietly drops a topic it
 * could not resolve looks exactly like a modal for an application that does not
 * do that thing. A Commander reading a help section with no answer about where
 * their builds are kept would reasonably conclude there was nothing to say
 * about it.
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
