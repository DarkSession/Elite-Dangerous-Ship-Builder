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
  it('is the exact seven accepted identities', () => {
    expect(HELP_TOPIC_IDS).toEqual([
      'buildLinkPrivacy',
      'accountsUploadsTelemetry',
      'browserPersistence',
      'offlineAssets',
      'completedEngineeringGrades',
      'hullFactsAndBuildResults',
      'almanacOwnership',
    ]);
  });

  it('holds no duplicate identity', () => {
    expect(new Set(HELP_TOPIC_IDS).size).toBe(HELP_TOPIC_IDS.length);
  });

  it('accepts a complete ordered catalogue', () => {
    const topics = complete();
    expect(assertCompleteHelpTopicCatalogue(topics)).toBe(topics);
  });

  it('rejects a missing topic rather than publishing six', () => {
    expect(() => assertCompleteHelpTopicCatalogue(complete().slice(1))).toThrow(/exactly 7 topics/);
  });

  it('rejects a duplicated topic', () => {
    const topics = complete();
    topics[3] = topics[2]!;
    expect(() => assertCompleteHelpTopicCatalogue(topics)).toThrow(/out of order/);
  });

  it('rejects a reordered catalogue, because the reading order is the contract', () => {
    const topics = complete();
    [topics[0], topics[1]] = [topics[1]!, topics[0]!];
    expect(() => assertCompleteHelpTopicCatalogue(topics)).toThrow(/position 0/);
  });

  it('rejects a blank question or answer key', () => {
    const topics = complete();
    topics[4] = { ...topics[4]!, answerKey: '  ' };
    expect(() => assertCompleteHelpTopicCatalogue(topics)).toThrow(/blank question or answer key/);
  });
});
