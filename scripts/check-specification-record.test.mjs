/**
 * Fixture tests for the specification-record policy checker.
 *
 * Every rule gets both directions: a negative fixture proving it catches the
 * drift it exists for, and a positive fixture proving it accepts the legitimate
 * construct it most easily mistakes for one. A checker with only negative tests
 * is how a rule quietly grows into a nuisance that authors work around instead
 * of a gate they trust.
 *
 * The rules are pure functions over text, so every fixture here is a string.
 * The one thing that reads the repository is the last block, which runs the
 * whole checker against this repository and expects nothing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recordDocuments, rules, runChecks, SCOPE } from './check-specification-record.mjs';

const ruleIds = (found) => found.map((violation) => violation.rule);

/** A constitution declaring the given principles and nothing else. */
const constitutionWith = (...numerals) =>
  ['# Constitution', '', ...numerals.map((numeral) => `### ${numeral}. A principle`)].join('\n');

/** A capability specification declaring the given traces. */
const specWith = (...traces) =>
  [
    '## Purpose',
    '',
    'A fixture capability.',
    '',
    '## Requirements',
    '',
    ...traces.flatMap((trace) => [
      `### Requirement: Something accepted (${trace})`,
      '',
      'The application MUST do something accepted.',
      '',
      `Source: ${trace}.`,
      '',
    ]),
  ].join('\n');

describe('coverage ledger reconciliation', () => {
  const ledgerWith = (...ids) =>
    `export const COVERED_FEATURES = ['011-interface-foundations'];
     export const LEDGER = [{ requirements: [${ids.map((id) => `'${id}'`).join(', ')}] }];`;

  it('rejects a declared requirement that nothing verifies', () => {
    const found = rules.ledgerCoverageViolations(
      [
        { id: '011/FR-001', file: 'openspec/specs/platform/design-system/spec.md' },
        { id: '011/FR-002', file: 'openspec/specs/platform/design-system/spec.md' },
      ],
      ledgerWith('011/FR-001'),
      'e2e/coverage-ledger.ts',
    );

    assert.deepEqual(ruleIds(found), ['unregistered-requirement']);
    assert.match(found[0].message, /011\/FR-002/);
    assert.doesNotMatch(found[0].message, /011\/FR-001/);
  });

  it('accepts a ledger that registers every declared id', () => {
    const found = rules.ledgerCoverageViolations(
      [{ id: '011/FR-001', file: 'openspec/specs/platform/design-system/spec.md' }],
      ledgerWith('011/FR-001'),
      'e2e/coverage-ledger.ts',
    );

    assert.deepEqual(found, []);
  });

  it("does not let one feature satisfy another feature's requirement", () => {
    const found = rules.ledgerCoverageViolations(
      [{ id: '001/FR-006', file: 'openspec/specs/ship-builder/hull-catalogue/spec.md' }],
      ledgerWith('011/FR-006'),
      'e2e/coverage-ledger.ts',
    );

    assert.deepEqual(ruleIds(found), ['unregistered-requirement']);
    assert.match(found[0].message, /001\/FR-006/);
  });

  it('does not count an id mentioned only in a comment', () => {
    const found = rules.ledgerCoverageViolations(
      [{ id: '011/FR-001', file: 'spec.md' }],
      `// see 011/FR-001 for context
       export const LEDGER = [{ requirements: [] }];`,
      'e2e/coverage-ledger.ts',
    );

    assert.deepEqual(ruleIds(found), ['unregistered-requirement']);
  });

  it('reads declared ids only from a requirement’s trace line', () => {
    const ids = rules.declaredRequirementIds(
      [
        '### Requirement: A requirement',
        'The application MUST do a thing.',
        'Source: 011/FR-001, 011/SC-002.',
        'Prose mentioning 011/FR-999 in passing.',
      ].join('\n'),
    );

    assert.deepEqual(ids, ['011/FR-001', '011/SC-002']);
  });

  it('reads the covered feature list from the ledger source', () => {
    const covered = rules.coveredFeatures(
      "export const COVERED_FEATURES = ['011-interface-foundations', '001-ship-selection-and-loading'];",
    );

    assert.deepEqual([...covered], ['011-interface-foundations', '001-ship-selection-and-loading']);
  });

  it('refuses a ledger that covers nothing', () => {
    const found = rules.ledgerCoverageInputViolations('export const LEDGER = [];', 4);

    assert.deepEqual(ruleIds(found), ['unregistered-requirement']);
    assert.match(found[0].message, /declares no covered features/);
  });

  it('refuses an empty specification tree rather than passing over it', () => {
    // The rule would otherwise find nothing to declare, report nothing, and look
    // exactly like a rule that passed.
    const found = rules.ledgerCoverageInputViolations(ledgerWith('011/FR-001'), 0);

    assert.deepEqual(ruleIds(found), ['unregistered-requirement']);
    assert.equal(found[0].file, SCOPE.specs);
  });

  it('accepts both inputs when each carries something', () => {
    assert.deepEqual(rules.ledgerCoverageInputViolations(ledgerWith('011/FR-001'), 4), []);
  });

  it('reads registered ids only from requirements arrays', () => {
    const registered = rules.registeredRequirementIds(
      "const a = { requirements: ['011/FR-001', '011/SC-002'] }; // and 011/FR-999",
    );

    assert.deepEqual([...registered].sort(), ['011/FR-001', '011/SC-002']);
  });
});

describe('what a help answer is allowed to be based on', () => {
  const sources = {
    constitution: constitutionWith('I', 'II', 'III', 'IV'),
    specs: {
      'openspec/specs/ship-builder/hull-catalogue/spec.md': specWith('001/FR-008'),
      'openspec/specs/ship-builder/module-outfitting/spec.md': specWith('002/FR-013'),
    },
  };

  it('resolves a principle the constitution declares', () => {
    const { resolved, reason } = rules.resolveGoverningReference(
      { kind: 'principle', numeral: 'IV' },
      sources,
    );

    assert.equal(reason, null);
    assert.equal(resolved, 'CONSTITUTION.md#IV');
  });

  it('resolves a requirement to the specification that declares it', () => {
    const { resolved, reason } = rules.resolveGoverningReference(
      { kind: 'requirement', feature: '001-ship-selection-and-loading', id: 'FR-008' },
      sources,
    );

    assert.equal(reason, null);
    assert.equal(resolved, 'openspec/specs/ship-builder/hull-catalogue/spec.md#001/FR-008');
  });

  it('refuses a principle the constitution does not declare', () => {
    const found = rules.governingReferenceViolations(
      [{ id: 'aTopic', governedBy: [{ kind: 'principle', numeral: 'IX' }] }],
      sources,
    );

    assert.deepEqual(ruleIds(found), ['unresolved-governing-reference']);
    assert.match(found[0].message, /principle IX is not declared/);
  });

  it('refuses a requirement the specification does not declare', () => {
    const found = rules.governingReferenceViolations(
      [
        {
          id: 'aTopic',
          governedBy: [
            { kind: 'requirement', feature: '001-ship-selection-and-loading', id: 'FR-900' },
          ],
        },
      ],
      sources,
    );

    assert.deepEqual(ruleIds(found), ['unresolved-governing-reference']);
    assert.match(found[0].message, /001\/FR-900 is not a declared requirement/);
  });

  it('refuses a repository with no capability specification at all', () => {
    const found = rules.governingReferenceViolations(
      [
        {
          id: 'aTopic',
          governedBy: [
            { kind: 'requirement', feature: '001-ship-selection-and-loading', id: 'FR-008' },
          ],
        },
      ],
      { constitution: sources.constitution, specs: {} },
    );

    assert.deepEqual(ruleIds(found), ['unresolved-governing-reference']);
    assert.match(found[0].message, /declares no capability specification/);
  });

  // A withdrawal table names a dozen reassigned ids in prose. Resolving one of
  // those would let a help answer cite the paragraph that says it is no longer
  // true.
  it('refuses an id that appears only in a withdrawal table', () => {
    const found = rules.governingReferenceViolations(
      [
        {
          id: 'aTopic',
          governedBy: [
            { kind: 'requirement', feature: '001-ship-selection-and-loading', id: 'FR-008' },
          ],
        },
      ],
      {
        constitution: sources.constitution,
        specs: {
          'openspec/specs/ship-builder/hull-catalogue/spec.md':
            '| `001/FR-008` | Was a thing | **Reassigned** |\n',
        },
      },
    );

    assert.deepEqual(ruleIds(found), ['unresolved-governing-reference']);
  });

  // `002/FR-002` must not resolve against a trace carrying only `002/FR-002a`.
  it('does not let a longer id satisfy a shorter one', () => {
    const found = rules.governingReferenceViolations(
      [
        {
          id: 'aTopic',
          governedBy: [{ kind: 'requirement', feature: '002-module-outfitting', id: 'FR-013' }],
        },
      ],
      {
        constitution: sources.constitution,
        specs: { 'spec.md': 'Source: 002/FR-013a.\n' },
      },
    );

    assert.deepEqual(ruleIds(found), ['unresolved-governing-reference']);
  });

  it('accepts a topic whose every reference resolves', () => {
    const found = rules.governingReferenceViolations(
      [
        {
          id: 'aTopic',
          governedBy: [
            { kind: 'principle', numeral: 'I' },
            { kind: 'requirement', feature: '002-module-outfitting', id: 'FR-013' },
          ],
        },
      ],
      sources,
    );

    assert.deepEqual(found, []);
  });
});

describe('the screen inventory reconciliation', () => {
  const LEDGER = `
    export const helpRouteCoverage: readonly HelpRouteRow[] = [
      {
        id: 'hull-catalogue',
        surface: 'Hull catalogue /ships',
        owner: '001',
        frameEntry: 'visible',
        requirements: ['012/FR-001', '012/FR-002'],
      },
      {
        // A layer covers the frame, and is dismissible.
        id: 'build-library',
        surface: 'Build library layer',
        owner: '001',
        frameEntry: 'obscured',
        requirements: ['012/FR-011'],
      },
    ];
  `;

  const DOCUMENT = [
    '## Release coverage ledger',
    '',
    '| Capability / surface | Owner | Frame entry | Applies |',
    '| --- | --- | --- | --- |',
    '| `Hull catalogue /ships` | 001 | visible | FR-001, FR-002 |',
    '| Build library layer | 001 | obscured, dismissible | FR-011 |',
  ].join('\n');

  const where = { file: 'e2e/coverage-ledger.ts', document: 'screen-inventory.md' };

  it('reads a row through the comments between its properties', () => {
    const rows = rules.transcribedHelpRoutes(LEDGER);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[1], {
      id: 'build-library',
      surface: 'Build library layer',
      owner: '001',
      frameEntry: 'obscured',
      requirements: ['012/FR-011'],
    });
  });

  it('reads the table out of the document, without its header rule', () => {
    const rows = rules.documentedHelpRoutes(DOCUMENT);

    assert.deepEqual(rows, [
      {
        surface: 'Hull catalogue /ships',
        owner: '001',
        frameEntry: 'visible',
        applies: ['FR-001', 'FR-002'],
      },
      {
        surface: 'Build library layer',
        owner: '001',
        frameEntry: 'obscured, dismissible',
        applies: ['FR-011'],
      },
    ]);
  });

  it('accepts a transcription that matches the document', () => {
    const found = rules.screenInventoryViolations(
      rules.transcribedHelpRoutes(LEDGER),
      rules.documentedHelpRoutes(DOCUMENT),
      where,
    );

    assert.deepEqual(found, []);
  });

  it('rejects a row the document has and the code does not', () => {
    const found = rules.screenInventoryViolations(
      rules.transcribedHelpRoutes(LEDGER).slice(0, 1),
      rules.documentedHelpRoutes(DOCUMENT),
      where,
    );

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
    assert.match(found[0].message, /only in screen-inventory\.md: Build library layer/);
  });

  it('rejects a row the code has and the document does not', () => {
    const found = rules.screenInventoryViolations(
      rules.transcribedHelpRoutes(LEDGER),
      rules.documentedHelpRoutes(DOCUMENT).slice(0, 1),
      where,
    );

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
    assert.match(found[0].message, /only in helpRouteCoverage: Build library layer/);
  });

  it('rejects a requirement set that differs on one id', () => {
    const found = rules.screenInventoryViolations(
      rules.transcribedHelpRoutes(LEDGER.replace("'012/FR-002'", "'012/FR-003'")),
      rules.documentedHelpRoutes(DOCUMENT),
      where,
    );

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
  });

  it('reports a document whose ledger table is missing rather than passing', () => {
    const found = rules.screenInventoryViolations(rules.transcribedHelpRoutes(LEDGER), [], where);

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
    assert.match(found[0].message, /was not found/);
  });

  it('finds nothing to read in a document with no ledger heading', () => {
    assert.deepEqual(rules.documentedHelpRoutes('# A document\n\nNo ledger here.\n'), []);
  });

  // Containment cannot see this: every row on each side appears on the other,
  // and only the count differs.
  it('rejects a row the document carries twice and the code carries once', () => {
    const found = rules.screenInventoryViolations(
      rules.transcribedHelpRoutes(LEDGER),
      [...rules.documentedHelpRoutes(DOCUMENT), rules.documentedHelpRoutes(DOCUMENT)[1]],
      where,
    );

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
    assert.match(found[0].message, /only in screen-inventory\.md: Build library layer/);
  });

  it('rejects a row the code carries twice and the document carries once', () => {
    const rows = rules.transcribedHelpRoutes(LEDGER);
    const found = rules.screenInventoryViolations(
      [...rows, rows[1]],
      rules.documentedHelpRoutes(DOCUMENT),
      where,
    );

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
    assert.match(found[0].message, /only in helpRouteCoverage: Build library layer/);
  });

  it('blames the ledger, not the document, when the declaration is not found', () => {
    assert.equal(rules.transcribedHelpRoutes('export const somethingElse = [];'), null);

    const found = rules.screenInventoryViolations(
      null,
      rules.documentedHelpRoutes(DOCUMENT),
      where,
    );

    assert.deepEqual(ruleIds(found), ['screen-inventory']);
    assert.match(
      found[0].message,
      /helpRouteCoverage` declaration was not found in e2e\/coverage-ledger\.ts/,
    );
  });

  it('reads only the ledger table, not a four-column table in a later section', () => {
    const withLater = [
      DOCUMENT,
      '',
      '## Verification inventory',
      '',
      '| Surface | Owner | Entry | Applies |',
      '| --- | --- | --- | --- |',
      '| Something else | 099 | visible | FR-999 |',
    ].join('\n');

    assert.deepEqual(rules.documentedHelpRoutes(withLater), rules.documentedHelpRoutes(DOCUMENT));
  });

  it('drops the header by what it says, not by where it sits', () => {
    // A header row the four-column filter rejects. Dropping the first surviving
    // row by position would take a data row with it.
    const widened = DOCUMENT.replace(
      '| Capability / surface | Owner | Frame entry | Applies |',
      '| Capability / surface | Owner | Frame entry | Applies | Note |',
    );

    assert.deepEqual(rules.documentedHelpRoutes(widened), rules.documentedHelpRoutes(DOCUMENT));
  });
});

describe('the conformance sweep over the record', () => {
  it('reads both roots of the record, and only Markdown', async () => {
    const documents = Object.keys(await recordDocuments());

    assert.ok(documents.length > 0, 'the record sweep found no document');
    assert.ok(
      documents.every((file) => file.endsWith('.md')),
      'the sweep read something that is not Markdown',
    );
    for (const root of SCOPE.record) {
      assert.ok(
        documents.some((file) => file.startsWith(`${root}/`)),
        `the sweep reached no document under ${root}`,
      );
    }
  });

  it('applies the shared rule to what the sweep returns', () => {
    const found = rules.conformanceClaimViolations({
      'openspec/specs/platform/design-system/spec.md': 'The surface is accessible to WCAG 2.2 AA.',
    });

    assert.deepEqual(ruleIds(found), ['unqualified-conformance-claim']);
  });

  it('accepts a claim in the record that names every excluded criterion', () => {
    const found = rules.conformanceClaimViolations({
      'openspec/specs/platform/design-system/spec.md':
        'WCAG 2.2 AA except success criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.',
    });

    assert.deepEqual(found, []);
  });
});

describe('this repository', () => {
  it('passes every rule', async () => {
    assert.deepEqual(await runChecks(), []);
  });

  it('names a specification record that exists', () => {
    for (const path of [SCOPE.constitution, SCOPE.ledger, SCOPE.screenInventory]) {
      assert.ok(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8').length > 0, path);
    }
  });
});
