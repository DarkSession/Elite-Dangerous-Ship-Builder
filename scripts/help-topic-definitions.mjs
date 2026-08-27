/**
 * The two Help topics, and the accepted sources each of them answers from.
 *
 * Tooling only. Nothing in this file is imported by the application: the
 * governing references below are review evidence, and shipping them would put
 * a map of this repository's own requirements into a browser bundle for no
 * reader's benefit. `scripts/check-help-topics.mjs` resolves every reference
 * against the artifact it names and then emits a separate browser module
 * carrying each topic's id and its two message keys, and nothing else
 * (help-navigation contract, "Required help topics").
 *
 * The order is the order a Commander reads them in. It is declared here once
 * and asserted everywhere downstream, because a FAQ reordered by whoever edited
 * it last is a FAQ whose reading order means nothing.
 *
 * What is deliberately absent is as much the point as what is here. The
 * reference mock's FAQ answers a question about importing that this
 * application does not promise, and one about retained partial engineering
 * rolls that contradicts feature 002 — neither is a topic, and the check
 * script refuses a set that grows one. The five topics withdrawn on 2026-08-27
 * are absent for a different reason: each answered something the interface, the
 * licence summary or the `ABOUT` section already says.
 */

/** A numbered principle of the repository constitution. */
function principle(numeral) {
  return { kind: 'principle', numeral };
}

/** One accepted functional requirement of a shipped feature. */
function requirement(feature, id) {
  return { kind: 'requirement', feature, id };
}

/**
 * The topic ids, in reading order.
 *
 * Exported separately so a consumer can assert the set and the order without
 * depending on the shape of a definition.
 */
export const HELP_TOPIC_IDS = Object.freeze(['browserPersistence', 'completedEngineeringGrades']);

/** The message key namespace every topic's question and answer live under. */
export const HELP_TOPIC_MESSAGE_PREFIX = 'help.topic';

/** The two message keys one topic id resolves to. */
export function topicMessageKeys(id) {
  return {
    questionKey: `${HELP_TOPIC_MESSAGE_PREFIX}.${id}.question`,
    answerKey: `${HELP_TOPIC_MESSAGE_PREFIX}.${id}.answer`,
  };
}

/**
 * Exactly one definition per id, in reading order.
 *
 * Every `governedBy` set is non-empty by construction and by check: a topic
 * with nothing behind it is an answer this application made up, which is the
 * one kind of help text that is worse than none.
 */
export const HELP_TOPIC_DEFINITIONS = Object.freeze(
  [
    {
      id: 'browserPersistence',
      governedBy: [
        principle('I'),
        requirement('001-ship-selection-and-loading', 'FR-008'),
        requirement('001-ship-selection-and-loading', 'FR-013'),
        requirement('001-ship-selection-and-loading', 'FR-014'),
      ],
    },
    {
      id: 'completedEngineeringGrades',
      governedBy: [principle('IV'), requirement('002-module-outfitting', 'FR-013')],
    },
  ].map((definition) => Object.freeze({ ...definition, ...topicMessageKeys(definition.id) })),
);
