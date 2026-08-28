import {
  HELP_TOPIC_IDS,
  assertCompleteHelpTopicCatalogue,
  type BrowserHelpTopic,
} from './help-topic';

const complete = (): BrowserHelpTopic[] =>
  HELP_TOPIC_IDS.map((id) => ({
    id,
    questionKey: `help.topic.${id}.question`,
    answerKey: `help.topic.${id}.answer`,
  }));

describe('the help topic catalogue', () => {
  it('is the exact two accepted identities', () => {
    expect(HELP_TOPIC_IDS).toEqual(['browserPersistence', 'completedEngineeringGrades']);
  });

  it('holds no withdrawn identity', () => {
    const withdrawn = [
      'buildLinkPrivacy',
      'accountsUploadsTelemetry',
      'offlineAssets',
      'hullFactsAndBuildResults',
      'almanacOwnership',
    ];
    expect(HELP_TOPIC_IDS.filter((id) => withdrawn.includes(id))).toEqual([]);
  });

  it('holds no duplicate identity', () => {
    expect(new Set(HELP_TOPIC_IDS).size).toBe(HELP_TOPIC_IDS.length);
  });

  it('accepts a complete ordered catalogue', () => {
    const topics = complete();
    expect(assertCompleteHelpTopicCatalogue(topics)).toBe(topics);
  });

  it('rejects a missing topic rather than publishing one', () => {
    expect(() => assertCompleteHelpTopicCatalogue(complete().slice(1))).toThrow(/exactly 2 topics/);
  });

  it('rejects a duplicated topic', () => {
    const topics = complete();
    topics[1] = topics[0]!;
    expect(() => assertCompleteHelpTopicCatalogue(topics)).toThrow(/out of order/);
  });

  it('rejects a reordered catalogue, because the reading order is the contract', () => {
    const topics = complete();
    [topics[0], topics[1]] = [topics[1]!, topics[0]!];
    expect(() => assertCompleteHelpTopicCatalogue(topics)).toThrow(/position 0/);
  });

  it('rejects a blank question or answer key', () => {
    const topics = complete();
    topics[1] = { ...topics[1]!, answerKey: '  ' };
    expect(() => assertCompleteHelpTopicCatalogue(topics)).toThrow(/blank question or answer key/);
  });
});
