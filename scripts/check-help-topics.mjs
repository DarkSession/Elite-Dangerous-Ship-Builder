#!/usr/bin/env node
/**
 * Proves the seven Help topics before letting any of them reach a browser.
 *
 * A help answer is a claim this application makes about itself, and the only
 * thing separating a useful one from a confident invention is whether anything
 * accepted actually says it. So every topic names the requirements and
 * principles it answers from, this script resolves each of those against the
 * artifact that declares it, and a reference that no longer exists fails the
 * build rather than becoming a footnote nobody reads.
 *
 * It then emits a browser module carrying the ids and the two message keys, and
 * nothing else. The governing references stay here: they are review evidence,
 * and a specification index has no business inside a product download
 * (help-navigation contract, "Required help topics").
 *
 * Two modes:
 *
 *   (default)  validate everything, emit the module
 *   --check    validate everything, emit nothing, and fail if an existing
 *              module on disk is not what would be emitted now
 *
 * Every failure names the topic and the rule, exits non-zero and writes no
 * partial output. A partial catalogue is worse than none: a Commander reading a
 * FAQ with no answer about build links would reasonably conclude there was
 * nothing to say about build links.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELP_TOPIC_DEFINITIONS, HELP_TOPIC_IDS } from './help-topic-definitions.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Where the emitted module goes. */
export const OUTPUT_PATH = 'src/app/platform/build/help-topics.generated.ts';

/**
 * The locale catalogues a shipped build carries.
 *
 * Every one of them must answer every topic, and must carry the same
 * interpolation variables the English answer does. The prohibited-wording
 * patterns below run against English alone: they are English phrasings, and a
 * translation that reintroduced the claim would say it in words no English
 * regular expression can see. That is what the content review in
 * `design/help-topic-review.md` is for — check 4 is a reader confirming the
 * German answer preserves the reviewed meaning.
 */
export const SHIPPED_LOCALES = Object.freeze(['en', 'de']);

/** The constitution, which declares the numbered principles. */
const CONSTITUTION_PATH = '.specify/memory/constitution.md';

/** Wording the reference mock carries and this application must not. */
const PROHIBITED_WORDING = Object.freeze([
  {
    pattern: /retain(s|ed)?\s+(its|their|the)?\s*(original|real|partial)\s+roll/i,
    name: 'a retained partial engineering roll',
  },
  {
    pattern: /\bcoming soon\b|\bwill soon\b|\bin a future (release|version)\b/i,
    name: 'a promise about unbuilt behaviour',
  },
]);

/** A failure that names the topic and the rule it broke. */
export class HelpTopicError extends Error {
  constructor(subject, detail) {
    super(`${subject}: ${detail}`);
    this.name = 'HelpTopicError';
    this.subject = subject;
  }
}

/** The interpolation variables a message asks its caller for, in sorted order. */
export function interpolationVariables(message) {
  return [...message.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)].map((match) => match[1]).sort();
}

/**
 * Confirms the declared set is exactly the seven, once each, in order.
 *
 * Checked against `HELP_TOPIC_IDS` rather than against a count, so a definition
 * file that swapped two topics or renamed one fails here and names which.
 */
export function assertDeclaredSet(definitions) {
  const seen = new Set();
  for (const definition of definitions) {
    if (seen.has(definition.id)) {
      throw new HelpTopicError(definition.id, 'is declared more than once.');
    }
    seen.add(definition.id);
  }

  for (const required of HELP_TOPIC_IDS) {
    if (!seen.has(required)) {
      throw new HelpTopicError(required, 'is a required topic and is not declared.');
    }
  }
  for (const declared of seen) {
    if (!HELP_TOPIC_IDS.includes(declared)) {
      throw new HelpTopicError(declared, 'is not one of the required topics.');
    }
  }

  HELP_TOPIC_IDS.forEach((required, index) => {
    if (definitions[index]?.id !== required) {
      throw new HelpTopicError(
        required,
        `must be topic ${index + 1} in reading order; found "${definitions[index]?.id ?? 'nothing'}".`,
      );
    }
  });
}

/**
 * Resolves one governing reference against the artifact that declares it.
 *
 * A requirement is matched on its declaration form — `- **FR-015**:` — and not
 * merely on the string appearing somewhere. Feature 003's withdrawal table
 * names a dozen reassigned ids in prose; a check that accepted a mention would
 * happily resolve every one of them against the paragraph explaining that they
 * no longer exist.
 */
export async function resolveReference(reference, { repoRoot = ROOT } = {}) {
  if (reference.kind === 'principle') {
    const path = join(repoRoot, CONSTITUTION_PATH);
    if (!existsSync(path)) {
      throw new HelpTopicError(CONSTITUTION_PATH, 'is missing, so no principle can be resolved.');
    }
    const text = await readFile(path, 'utf8');
    const declared = new RegExp(`^### ${reference.numeral}\\.\\s`, 'm').test(text);
    if (!declared) {
      throw new HelpTopicError(
        `principle ${reference.numeral}`,
        `is not declared in ${CONSTITUTION_PATH}.`,
      );
    }
    return `${CONSTITUTION_PATH}#${reference.numeral}`;
  }

  if (reference.kind !== 'requirement') {
    throw new HelpTopicError(String(reference.kind), 'is not a kind of governing reference.');
  }

  const path = join(repoRoot, 'specs', reference.feature, 'spec.md');
  if (!existsSync(path)) {
    throw new HelpTopicError(
      `${reference.feature}/spec.md`,
      `is missing, so ${reference.id} cannot be resolved.`,
    );
  }
  const text = await readFile(path, 'utf8');
  // The declaration form, bold and at the head of its own list item. An
  // unbolded id in a withdrawal table is deliberately not a declaration.
  const declared = new RegExp(`^- \\*\\*${reference.id}\\*\\*:`, 'm').test(text);
  if (!declared) {
    throw new HelpTopicError(
      `${reference.feature} ${reference.id}`,
      'is not a declared requirement. A withdrawn or reassigned id cannot govern a help answer.',
    );
  }
  return `specs/${reference.feature}/spec.md#${reference.id}`;
}

/** Reads one shipped locale catalogue. */
async function readCatalogue(locale, repoRoot) {
  const path = join(repoRoot, 'src/app/i18n/locales', `${locale}.json`);
  if (!existsSync(path)) {
    throw new HelpTopicError(`${locale}.json`, 'is a shipped locale and is missing.');
  }
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new HelpTopicError(`${locale}.json`, `is not valid JSON: ${error.message}`);
  }
}

/**
 * Confirms every shipped locale answers every topic, and says the same thing.
 *
 * "The same thing" here is the interpolation contract, not the meaning —
 * meaning is what the content-review gate in the contract is for, and no script
 * can stand in for it. What a script can hold is that a translator did not drop
 * a variable the answer needs, or introduce one nothing supplies.
 */
export async function assertShippedMessages(definitions, { repoRoot = ROOT } = {}) {
  const catalogues = new Map();
  for (const locale of SHIPPED_LOCALES) {
    catalogues.set(locale, await readCatalogue(locale, repoRoot));
  }

  const english = catalogues.get(SHIPPED_LOCALES[0]);

  for (const definition of definitions) {
    for (const key of [definition.questionKey, definition.answerKey]) {
      const reference = english?.[key];
      if (typeof reference !== 'string' || reference.trim().length === 0) {
        throw new HelpTopicError(definition.id, `has no "${key}" in ${SHIPPED_LOCALES[0]}.json.`);
      }
      for (const { pattern, name } of PROHIBITED_WORDING) {
        if (pattern.test(reference)) {
          throw new HelpTopicError(definition.id, `states ${name} in "${key}".`);
        }
      }

      const expected = interpolationVariables(reference);
      for (const locale of SHIPPED_LOCALES.slice(1)) {
        const translated = catalogues.get(locale)?.[key];
        if (typeof translated !== 'string' || translated.trim().length === 0) {
          throw new HelpTopicError(definition.id, `has no "${key}" in ${locale}.json.`);
        }
        const actual = interpolationVariables(translated);
        if (actual.join('|') !== expected.join('|')) {
          throw new HelpTopicError(
            definition.id,
            `"${key}" asks for [${expected.join(', ')}] in ${SHIPPED_LOCALES[0]} but ` +
              `[${actual.join(', ')}] in ${locale}.`,
          );
        }
      }
    }
  }
}

/** The browser module: ids and keys, in reading order, and nothing else. */
export function renderTopicsModule(definitions) {
  const literal = (value) => JSON.stringify(value);
  const topics = definitions
    .map(
      (definition) =>
        `  {\n    id: ${literal(definition.id)},\n    questionKey: ${literal(
          definition.questionKey,
        )},\n    answerKey: ${literal(definition.answerKey)},\n  },`,
    )
    .join('\n');

  return `// Generated by scripts/check-help-topics.mjs. Do not edit.
//
// Rebuilt ahead of every Angular, Playwright and typecheck command, and ignored
// by git: the repository tracks the definitions it is made from, not the
// artifact. The governing references behind each topic are review evidence and
// deliberately absent here.
import {
  assertCompleteHelpTopicCatalogue,
  type BrowserHelpTopic,
} from '../../domain/help/help-topic';

export const HELP_TOPICS: readonly BrowserHelpTopic[] = assertCompleteHelpTopicCatalogue([
${topics}
]);
`;
}

/** Runs the whole thing. Validation completes before anything is written. */
export async function checkHelpTopics({
  repoRoot = ROOT,
  definitions = HELP_TOPIC_DEFINITIONS,
  mode = 'emit',
} = {}) {
  assertDeclaredSet(definitions);

  const resolved = [];
  for (const definition of definitions) {
    if (!Array.isArray(definition.governedBy) || definition.governedBy.length === 0) {
      throw new HelpTopicError(definition.id, 'cites no governing source.');
    }
    for (const reference of definition.governedBy) {
      resolved.push(await resolveReference(reference, { repoRoot }));
    }
  }

  await assertShippedMessages(definitions, { repoRoot });

  const module = renderTopicsModule(definitions);
  const outputPath = join(repoRoot, OUTPUT_PATH);

  // This one does compare against the artifact on disk, where the manifest
  // generator deliberately does not. The difference is what the two modules
  // carry: a topics module is a pure function of the committed definitions
  // alone — the catalogues are validated here, never rendered — so a render
  // that differs from the file means the definitions changed without the file
  // being rebuilt. The manifest carries `buildId` —
  // the abbreviated commit and whether the tree is dirty — which differs after
  // any commit, for no change at all.
  if (mode === 'check') {
    if (existsSync(outputPath)) {
      const existing = await readFile(outputPath, 'utf8');
      if (existing !== module) {
        throw new HelpTopicError(
          OUTPUT_PATH,
          'is stale or has been edited by hand. Run `pnpm run help:topics`.',
        );
      }
    }
    return { module, resolved, written: false };
  }

  await mkdir(join(repoRoot, 'src/app/platform/build'), { recursive: true });
  await writeFile(outputPath, module, 'utf8');
  return { module, resolved, written: true };
}

const invokedDirectly =
  process.argv[1] !== undefined && relative(fileURLToPath(import.meta.url), process.argv[1]) === '';

if (invokedDirectly) {
  const mode = process.argv.includes('--check') ? 'check' : 'emit';
  try {
    const { resolved, written } = await checkHelpTopics({ mode });
    if (written) {
      process.stdout.write(
        `help topics: ${HELP_TOPIC_IDS.length} topics, ${resolved.length} governing references resolved\n`,
      );
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
