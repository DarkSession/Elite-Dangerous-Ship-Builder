import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, describe, it } from 'node:test';
import {
  HELP_TOPIC_DEFINITIONS,
  HELP_TOPIC_IDS,
  topicMessageKeys,
} from './help-topic-definitions.mjs';
import {
  OUTPUT_PATH,
  SHIPPED_LOCALES,
  assertDeclaredSet,
  checkHelpTopics,
  interpolationVariables,
  renderTopicsModule,
  resolveReference,
} from './check-help-topics.mjs';

const temporaryRoots = [];

/** English text for every topic, good enough to pass and easy to break. */
function catalogue(overrides = {}) {
  const messages = {};
  for (const id of HELP_TOPIC_IDS) {
    const { questionKey, answerKey } = topicMessageKeys(id);
    messages[questionKey] = `Question about ${id}?`;
    messages[answerKey] = `Answer about ${id}.`;
  }
  return { ...messages, ...overrides };
}

/**
 * A throwaway repository carrying only what this check reads.
 *
 * Every governing reference the real definitions cite is declared here in the
 * form the resolver looks for, so a fixture proves the resolver rather than the
 * repository it happens to be running in.
 */
async function fixtureRepo({ locales = {}, principles, requirements } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'help-topics-'));
  temporaryRoots.push(root);

  const declaredPrinciples = principles ?? ['I', 'II', 'III', 'IV'];
  await mkdir(join(root, '.specify/memory'), { recursive: true });
  await writeFile(
    join(root, '.specify/memory/constitution.md'),
    [
      '# Constitution',
      '',
      ...declaredPrinciples.map((numeral) => `### ${numeral}. A principle`),
    ].join('\n'),
    'utf8',
  );

  const declaredRequirements = requirements ?? {
    '001-ship-selection-and-loading': ['FR-004', 'FR-006', 'FR-008', 'FR-013', 'FR-014', 'FR-015'],
    '002-module-outfitting': ['FR-013'],
    '003-ship-statistics': ['FR-002'],
    '005-power-and-heat': ['FR-003'],
  };
  for (const [feature, ids] of Object.entries(declaredRequirements)) {
    await mkdir(join(root, 'specs', feature), { recursive: true });
    await writeFile(
      join(root, 'specs', feature, 'spec.md'),
      ['## Requirements', '', ...ids.map((id) => `- **${id}**: Something accepted.`)].join('\n'),
      'utf8',
    );
  }

  await mkdir(join(root, 'src/app/i18n/locales'), { recursive: true });
  for (const locale of SHIPPED_LOCALES) {
    await writeFile(
      join(root, `src/app/i18n/locales/${locale}.json`),
      `${JSON.stringify(catalogue(locales[locale] ?? {}), null, 2)}\n`,
      'utf8',
    );
  }

  return root;
}

const run = (repoRoot, options = {}) => checkHelpTopics({ repoRoot, ...options });

/** Asserts a run fails by name and leaves nothing behind. */
async function refuses(repoRoot, pattern, options = {}) {
  await assert.rejects(run(repoRoot, options), pattern);
  assert.equal(
    existsSync(join(repoRoot, OUTPUT_PATH)),
    false,
    'a refused generation must emit nothing',
  );
}

after(async () => {
  for (const root of temporaryRoots) {
    await rm(root, { recursive: true, force: true });
  }
});

describe('the help topic catalogue', () => {
  describe('the set the modal publishes', () => {
    it('declares exactly the seven required topics, in reading order', () => {
      assert.deepEqual(
        HELP_TOPIC_DEFINITIONS.map((definition) => definition.id),
        [...HELP_TOPIC_IDS],
      );
      assertDeclaredSet(HELP_TOPIC_DEFINITIONS);
    });

    it('refuses a topic declared twice', () => {
      assert.throws(
        () => assertDeclaredSet([...HELP_TOPIC_DEFINITIONS, HELP_TOPIC_DEFINITIONS[0]]),
        /buildLinkPrivacy: is declared more than once/,
      );
    });

    it('refuses a required topic that has gone missing', () => {
      assert.throws(
        () => assertDeclaredSet(HELP_TOPIC_DEFINITIONS.slice(1)),
        /buildLinkPrivacy: is a required topic and is not declared/,
      );
    });

    it('refuses a topic nobody accepted', () => {
      assert.throws(
        () =>
          assertDeclaredSet([
            ...HELP_TOPIC_DEFINITIONS,
            { id: 'howToWinAtCombat', governedBy: [] },
          ]),
        /howToWinAtCombat: is not one of the required topics/,
      );
    });

    it('refuses the same seven in a different order', () => {
      const swapped = [...HELP_TOPIC_DEFINITIONS];
      [swapped[0], swapped[1]] = [swapped[1], swapped[0]];

      assert.throws(() => assertDeclaredSet(swapped), /must be topic 1 in reading order/);
    });
  });

  describe('what an answer is allowed to be based on', () => {
    it('resolves every reference the shipped definitions cite', async () => {
      const { resolved } = await run(await fixtureRepo());
      const cited = HELP_TOPIC_DEFINITIONS.reduce(
        (total, definition) => total + definition.governedBy.length,
        0,
      );

      assert.equal(resolved.length, cited);
    });

    it('refuses a topic that cites nothing at all', async () => {
      const root = await fixtureRepo();
      await refuses(root, /almanacOwnership: cites no governing source/, {
        definitions: HELP_TOPIC_DEFINITIONS.map((definition) =>
          definition.id === 'almanacOwnership' ? { ...definition, governedBy: [] } : definition,
        ),
      });
    });

    it('refuses a principle the constitution does not declare', async () => {
      const root = await fixtureRepo({ principles: ['I', 'II', 'III'] });

      await refuses(root, /principle IV: is not declared/);
    });

    it('refuses a requirement the feature does not declare', async () => {
      const root = await fixtureRepo({
        requirements: {
          '001-ship-selection-and-loading': ['FR-015'],
          '002-module-outfitting': ['FR-013'],
          '003-ship-statistics': ['FR-002'],
          '005-power-and-heat': ['FR-003'],
        },
      });

      await refuses(root, /001-ship-selection-and-loading FR-008: is not a declared requirement/);
    });

    it('refuses a feature that has no specification at all', async () => {
      const root = await fixtureRepo({
        requirements: {
          '002-module-outfitting': ['FR-013'],
          '003-ship-statistics': ['FR-002'],
          '005-power-and-heat': ['FR-003'],
        },
      });

      await refuses(root, /001-ship-selection-and-loading\/spec\.md: is missing/);
    });

    // A withdrawal table names a dozen reassigned ids in prose. Resolving one
    // of those would let a help answer cite the paragraph that says it is no
    // longer true.
    it('refuses an id that appears only in a withdrawal table', async () => {
      const root = await fixtureRepo();
      const path = join(root, 'specs/001-ship-selection-and-loading/spec.md');
      const text = await readFile(path, 'utf8');
      await writeFile(
        path,
        `${text.replace('- **FR-015**: Something accepted.', '')}\n\n| \`FR-015\` | Was a thing | **Reassigned** |\n`,
        'utf8',
      );

      await refuses(root, /001-ship-selection-and-loading FR-015: is not a declared requirement/);
    });
  });

  describe('what every shipped locale has to say', () => {
    it('refuses a topic with no English question', async () => {
      const keys = topicMessageKeys('offlineAssets');
      const root = await fixtureRepo({ locales: { en: { [keys.questionKey]: '' } } });

      await refuses(root, /offlineAssets: has no "help\.topic\.offlineAssets\.question" in en/);
    });

    it('refuses a topic with no answer in a shipped translation', async () => {
      const keys = topicMessageKeys('browserPersistence');
      const root = await fixtureRepo({ locales: { de: { [keys.answerKey]: '   ' } } });

      await refuses(
        root,
        /browserPersistence: has no "help\.topic\.browserPersistence\.answer" in de/,
      );
    });

    it('refuses a translation that drops a variable the answer needs', async () => {
      const keys = topicMessageKeys('buildLinkPrivacy');
      const root = await fixtureRepo({
        locales: {
          en: { [keys.answerKey]: 'It carries {{count}} things.' },
          de: { [keys.answerKey]: 'Es enthält einige Dinge.' },
        },
      });

      await refuses(
        root,
        /buildLinkPrivacy: "help\.topic\.buildLinkPrivacy\.answer" asks for \[count\]/,
      );
    });

    it('refuses a translation that invents a variable nothing supplies', async () => {
      const keys = topicMessageKeys('buildLinkPrivacy');
      const root = await fixtureRepo({
        locales: { de: { [keys.answerKey]: 'Es enthält {{hull}}.' } },
      });

      await refuses(root, /asks for \[\] in en but \[hull\] in de/);
    });

    it('refuses the reference mock’s retained partial roll', async () => {
      const keys = topicMessageKeys('completedEngineeringGrades');
      const root = await fixtureRepo({
        locales: {
          en: { [keys.answerKey]: 'An imported module retains its original roll.' },
        },
      });

      await refuses(root, /completedEngineeringGrades: states a retained partial engineering roll/);
    });

    it('refuses a promise about behaviour nobody built', async () => {
      const keys = topicMessageKeys('offlineAssets');
      const root = await fixtureRepo({
        locales: { en: { [keys.answerKey]: 'Full offline artwork is coming soon.' } },
      });

      await refuses(root, /offlineAssets: states a promise about unbuilt behaviour/);
    });

    it('reads the variables a message asks for, and only those', () => {
      assert.deepEqual(interpolationVariables('{{ b }} and {{a}} and none'), ['a', 'b']);
      assert.deepEqual(interpolationVariables('nothing here'), []);
    });
  });

  describe('what reaches the browser', () => {
    it('emits the ids and the two keys, in reading order', async () => {
      const root = await fixtureRepo();
      const { module, written } = await run(root);

      assert.equal(written, true);
      assert.equal(await readFile(join(root, OUTPUT_PATH), 'utf8'), module);
      const emittedOrder = [...module.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);
      assert.deepEqual(emittedOrder, [...HELP_TOPIC_IDS]);
    });

    it('carries no governing reference into the bundle', async () => {
      const { module } = await run(await fixtureRepo());

      assert.equal(/governedBy|principle|constitution|FR-\d/i.test(module), false);
      for (const definition of HELP_TOPIC_DEFINITIONS) {
        for (const reference of definition.governedBy) {
          const marker = reference.kind === 'principle' ? reference.numeral : reference.id;
          assert.equal(module.includes(`"${marker}"`), false);
        }
      }
    });

    it('emits byte-identical output on a second run', async () => {
      const root = await fixtureRepo();
      const first = await run(root);
      const second = await run(root);

      assert.equal(first.module, second.module);
    });

    it('emits nothing in check mode, and passes over its own output', async () => {
      const root = await fixtureRepo();
      await run(root);
      const emitted = await readFile(join(root, OUTPUT_PATH), 'utf8');

      const { written } = await run(root, { mode: 'check' });

      assert.equal(written, false);
      assert.equal(await readFile(join(root, OUTPUT_PATH), 'utf8'), emitted);
    });

    it('fails check mode against a module somebody edited by hand', async () => {
      const root = await fixtureRepo();
      await run(root);
      await writeFile(
        join(root, OUTPUT_PATH),
        `${await readFile(join(root, OUTPUT_PATH), 'utf8')}// edited\n`,
        'utf8',
      );

      await assert.rejects(run(root, { mode: 'check' }), /is stale or has been edited by hand/);
    });

    it('renders a module that imports the invariant it is checked by', () => {
      const module = renderTopicsModule(HELP_TOPIC_DEFINITIONS);

      assert.match(module, /assertCompleteHelpTopicCatalogue/);
      assert.match(module, /Do not edit/);
    });
  });

  describe('the references the shipped definitions actually cite', () => {
    it('resolves every one of them against this repository', async () => {
      for (const definition of HELP_TOPIC_DEFINITIONS) {
        for (const reference of definition.governedBy) {
          await resolveReference(reference);
        }
      }
    });
  });
});
