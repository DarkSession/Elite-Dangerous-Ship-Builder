/**
 * Fixture tests for the interface-foundation policy checker.
 *
 * Every rule gets both directions: a negative fixture proving it catches the
 * violation it exists for, and a positive fixture proving it accepts the
 * legitimate construct it most easily mistakes for one. A checker with only
 * negative tests is how a rule quietly grows into a nuisance that authors work
 * around instead of a gate they trust.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rules, SCOPE, SEARCH_METADATA_FILES } from './check-interface-foundations.mjs';

const ruleIds = (found) => found.map((violation) => violation.rule);

describe('literal display text', () => {
  it('rejects a hard-coded label in a template', () => {
    const found = rules.templateViolations('t.html', '<button>Save build</button>');

    assert.deepEqual(ruleIds(found), ['literal-display-text']);
    assert.match(found[0].message, /Save build/);
  });

  it('rejects literal text inside a control-flow block', () => {
    const found = rules.templateViolations('t.html', '@if (ready()) { <p>Everything is fine</p> }');

    assert.deepEqual(ruleIds(found), ['literal-display-text']);
  });

  it('accepts text resolved through the message facade', () => {
    const found = rules.templateViolations('t.html', '<button>{{ label() }}</button>');

    assert.deepEqual(found, []);
  });

  it('accepts dynamic package text', () => {
    const found = rules.templateViolations('t.html', '<span>{{ moduleName() }}</span>');

    assert.deepEqual(found, []);
  });

  it('accepts structural punctuation and separators', () => {
    for (const template of [
      '<span>·</span>',
      '<span>(</span><span>)</span>',
      '<span>—</span>',
      '<span>{{ a() }} / {{ b() }}</span>',
      '<span>:</span>',
    ]) {
      assert.deepEqual(rules.templateViolations('t.html', template), [], template);
    }
  });

  it('accepts whitespace between elements', () => {
    const found = rules.templateViolations('t.html', '<div>\n  <span>{{ a() }}</span>\n</div>');

    assert.deepEqual(found, []);
  });
});

describe('literal display attributes', () => {
  it('rejects a literal aria-label', () => {
    const found = rules.templateViolations('t.html', '<button aria-label="Close"></button>');

    assert.deepEqual(ruleIds(found), ['literal-display-attribute']);
  });

  it.each = undefined;

  for (const attribute of ['title', 'placeholder', 'alt']) {
    it(`rejects a literal ${attribute}`, () => {
      const found = rules.templateViolations('t.html', `<img src="a.svg" ${attribute}="A ship" />`);

      assert.ok(ruleIds(found).includes('literal-display-attribute'), attribute);
    });
  }

  it('accepts a bound aria-label', () => {
    const found = rules.templateViolations(
      't.html',
      '<button [attr.aria-label]="closeLabel()"></button>',
    );

    assert.deepEqual(found, []);
  });

  it('accepts an empty alt marking a decorative image', () => {
    const found = rules.templateViolations('t.html', '<img src="a.svg" alt="" />');

    assert.deepEqual(found, []);
  });

  it('accepts structural attributes that are never read to anyone', () => {
    const found = rules.templateViolations(
      't.html',
      '<div class="panel" id="x" role="group" aria-labelledby="x-title" lang="en" dir="ltr"></div>',
    );

    assert.deepEqual(found, []);
  });
});

describe('inline styles', () => {
  it('rejects a style attribute the token policy cannot inspect', () => {
    const found = rules.templateViolations('t.html', '<div style="color: red"></div>');

    assert.ok(ruleIds(found).includes('inline-style'));
  });

  it('rejects inline component styles', () => {
    const found = rules.componentMetadataViolations(
      'c.ts',
      `@Component({ selector: 'a-b', template: '<p>{{ x() }}</p>', styles: ['p { color: red }'] })
       export class C {}`,
    );

    assert.deepEqual(ruleIds(found), ['inline-style']);
  });

  it('accepts a component using a stylesheet file', () => {
    const found = rules.componentMetadataViolations(
      'c.ts',
      `@Component({ selector: 'a-b', templateUrl: './c.html', styleUrl: './c.scss' })
       export class C {}`,
    );

    assert.deepEqual(found, []);
  });

  it('inspects an inline template for literal display text', () => {
    const found = rules.componentMetadataViolations(
      'c.ts',
      `@Component({ selector: 'a-b', template: '<p>Hello Commander</p>' })
       export class C {}`,
    );

    assert.deepEqual(ruleIds(found), ['literal-display-text']);
  });
});

describe('governed visual literals', () => {
  it('rejects a hex colour outside the token sources', () => {
    const found = rules.stylesheetViolations('c.scss', '.a { color: #ff8c1a; }');

    assert.deepEqual(ruleIds(found), ['visual-literal']);
    assert.match(found[0].message, /#ff8c1a/);
  });

  it('rejects a hand-picked size, spacing and radius', () => {
    for (const source of [
      '.a { font-size: 13px; }',
      '.a { padding: 12px; }',
      '.a { gap: 0.5rem; }',
      '.a { border-radius: 4px; }',
      '.a { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4); }',
      '.a { transition-duration: 200ms; }',
    ]) {
      assert.deepEqual(
        ruleIds(rules.stylesheetViolations('c.scss', source)),
        ['visual-literal'],
        source,
      );
    }
  });

  it('accepts a token reference', () => {
    const found = rules.stylesheetViolations('c.scss', '.a { color: var(--edsb-text-primary); }');

    assert.deepEqual(found, []);
  });

  it('accepts a token calculation', () => {
    for (const source of [
      '.a { padding: calc(var(--edsb-space-lg) * 2); }',
      '.a { gap: min(var(--edsb-space-lg), var(--edsb-space-xl)); }',
      '.a { padding-inline: var(--edsb-space-sm) var(--edsb-space-lg); }',
      '.a { border: var(--edsb-border-width-thin) solid var(--edsb-border-default); }',
    ]) {
      assert.deepEqual(rules.stylesheetViolations('c.scss', source), [], source);
    }
  });

  it('accepts layout syntax that is structure rather than a visual decision', () => {
    for (const source of [
      '.a { padding: 0; }',
      '.a { margin: auto; }',
      '.a { color: inherit; }',
      '.a { background: none; }',
      '.a { border: 0; }',
    ]) {
      assert.deepEqual(rules.stylesheetViolations('c.scss', source), [], source);
    }
  });

  it('ignores properties that carry no design decision', () => {
    const found = rules.stylesheetViolations(
      'c.scss',
      '.a { display: grid; grid-template-columns: 1fr 2fr; position: absolute; z-index: 3; }',
    );

    assert.deepEqual(found, []);
  });

  it('reads a stylesheet written in real SCSS rather than skipping it', () => {
    // Regression: the rule used to hand SCSS to the standard CSS parser, which
    // throws on the first `//` comment. The throw was swallowed, so every
    // stylesheet with a line comment — nearly all of them — was silently
    // exempt from the rule that exists to catch exactly this.
    const source = [
      "@use '../styles/responsive' as layout;",
      '',
      '// A line comment, which only the SCSS parser understands.',
      '.a {',
      '  @include layout.target-baseline;',
      '',
      '  color: #ff8c1a;',
      '}',
    ].join('\n');

    assert.deepEqual(ruleIds(rules.stylesheetViolations('c.scss', source)), ['visual-literal']);
  });

  it('reports a stylesheet it genuinely cannot parse instead of passing it', () => {
    const found = rules.stylesheetViolations('c.scss', '.a { color: var(--edsb-text-primary);');

    assert.deepEqual(ruleIds(found), ['unparseable-stylesheet']);
  });

  it('accepts a transition that names the property it animates', () => {
    const found = rules.stylesheetViolations(
      'c.scss',
      '.a { transition: background-color var(--edsb-motion-duration-state) var(--edsb-motion-easing); }',
    );

    assert.deepEqual(found, []);
  });

  it('still rejects a hand-picked duration inside a transition shorthand', () => {
    const found = rules.stylesheetViolations(
      'c.scss',
      '.a { transition: background-color 200ms var(--edsb-motion-easing); }',
    );

    assert.deepEqual(ruleIds(found), ['visual-literal']);
  });

  it('rejects a custom property declared outside the token sources', () => {
    const found = rules.stylesheetViolations('c.scss', '.a { --my-colour: #fff; }');

    assert.deepEqual(ruleIds(found), ['token-outside-source']);
  });
});

describe('preview coverage', () => {
  it('rejects an exported component with no declaration', () => {
    const found = rules.previewCoverageViolations(
      [{ name: 'ActionButton', file: 'src/app/ui/components/action/action-button.ts' }],
      'registerPreview({ componentId: "status", component: StatusNotice });',
    );

    assert.deepEqual(ruleIds(found), ['missing-preview']);
    assert.match(found[0].message, /ActionButton/);
  });

  it('accepts a component registered in the manifest', () => {
    const found = rules.previewCoverageViolations(
      [{ name: 'ActionButton', file: 'src/app/ui/components/action/action-button.ts' }],
      'registerPreview({ componentId: "action-button", component: ActionButton });',
    );

    assert.deepEqual(found, []);
  });

  it('does not accept a partial name match', () => {
    const found = rules.previewCoverageViolations(
      [{ name: 'Action', file: 'a.ts' }],
      'registerPreview({ component: ActionButton });',
    );

    assert.deepEqual(ruleIds(found), ['missing-preview']);
  });
});

describe('test discipline', () => {
  for (const [label, source] of [
    ['a focused test', 'it.only("x", () => {});'],
    ['a skipped test', 'it.skip("x", () => {});'],
    ['a focused suite', 'describe.only("x", () => {});'],
    ['a legacy focused test', 'fit("x", () => {});'],
    ['a legacy skipped test', 'xdescribe("x", () => {});'],
    ['a quarantined test', 'test.fixme("x", () => {});'],
  ]) {
    it(`rejects ${label}`, () => {
      assert.deepEqual(ruleIds(rules.testDisciplineViolations('a.spec.ts', source)), [
        'test-discipline',
      ]);
    });
  }

  it('accepts ordinary tests', () => {
    const found = rules.testDisciplineViolations(
      'a.spec.ts',
      'describe("x", () => { it("does the thing", () => {}); test("and this", () => {}); });',
    );

    assert.deepEqual(found, []);
  });

  it('reports the line the violation is on', () => {
    const found = rules.testDisciplineViolations('a.spec.ts', '\n\n\nit.only("x", () => {});');

    assert.equal(found[0].line, 4);
  });
});

describe('duplicated composition steps', () => {
  const PAIR = {
    scss: { file: 'src/styles/_responsive.scss', name: '$mode-wide-min' },
    ts: { file: 'src/app/ui/wide-composition.ts', name: 'WIDE_MODE_MIN_REM' },
  };

  it('accepts a step both sources state at the same width', () => {
    const found = rules.duplicatedStepViolations(
      PAIR,
      '$mode-wide-min: 64rem;',
      'const WIDE_MODE_MIN_REM = 64;',
    );

    assert.deepEqual(found, []);
  });

  it('rejects a restatement that has drifted from the declaration', () => {
    const found = rules.duplicatedStepViolations(
      PAIR,
      '$mode-wide-min: 64rem;',
      '\n\nconst WIDE_MODE_MIN_REM = 48;',
    );

    assert.deepEqual(ruleIds(found), ['composition-step']);
    assert.equal(found[0].file, 'src/app/ui/wide-composition.ts');
    assert.equal(found[0].line, 3);
    assert.match(found[0].message, /48rem where \$mode-wide-min is 64rem/);
  });

  it('rejects a stylesheet that states the step in anything but rem', () => {
    const found = rules.duplicatedStepViolations(
      PAIR,
      '$mode-wide-min: 1024px;',
      'const WIDE_MODE_MIN_REM = 64;',
    );

    assert.deepEqual(ruleIds(found), ['composition-step']);
    assert.equal(found[0].file, 'src/styles/_responsive.scss');
  });

  it('rejects a TypeScript source that no longer restates it', () => {
    const found = rules.duplicatedStepViolations(
      PAIR,
      '$mode-wide-min: 64rem;',
      'const SOMETHING_ELSE = 64;',
    );

    assert.deepEqual(ruleIds(found), ['composition-step']);
    assert.equal(found[0].file, 'src/app/ui/wide-composition.ts');
  });

  // A missing file is the failure this rule is most likely to be silenced by:
  // rename either side and there is nothing left to compare, which is the one
  // outcome that must not read as agreement.
  it('rejects a pair whose files are gone rather than passing on absence', () => {
    assert.deepEqual(ruleIds(rules.duplicatedStepViolations(PAIR, null, 'const X = 1;')), [
      'composition-step',
    ]);
    assert.deepEqual(
      ruleIds(rules.duplicatedStepViolations(PAIR, '$mode-wide-min: 64rem;', null)),
      ['composition-step'],
    );
    assert.deepEqual(ruleIds(rules.duplicatedStepViolations(PAIR, null, null)), [
      'composition-step',
      'composition-step',
    ]);
  });

  it('reconciles every pair the policy actually declares', () => {
    for (const pair of SCOPE.duplicatedSteps) {
      const found = rules.duplicatedStepViolations(
        pair,
        readFileSync(pair.scss.file, 'utf8'),
        readFileSync(pair.ts.file, 'utf8'),
      );

      assert.deepEqual(found, [], `${pair.scss.name} and ${pair.ts.name} disagree`);
    }
  });
});

describe('coverage ledger reconciliation', () => {
  const ledgerWith = (...ids) =>
    `export const COVERED_FEATURES = ['011-interface-foundations'];
     export const LEDGER = [{ requirements: [${ids.map((id) => `'${id}'`).join(', ')}] }];`;

  it('rejects a declared requirement that nothing verifies', () => {
    const found = rules.ledgerCoverageViolations(
      [
        { id: '011/FR-001', file: 'specs/011-interface-foundations/spec.md' },
        { id: '011/FR-002', file: 'specs/011-interface-foundations/spec.md' },
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
      [{ id: '011/FR-001', file: 'specs/011-interface-foundations/spec.md' }],
      ledgerWith('011/FR-001'),
      'e2e/coverage-ledger.ts',
    );

    assert.deepEqual(found, []);
  });

  it("does not let one feature satisfy another feature's requirement", () => {
    const found = rules.ledgerCoverageViolations(
      [{ id: '001/FR-006', file: 'specs/001-ship-selection-and-loading/spec.md' }],
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

  it('reads declared ids only where a specification defines them in bold', () => {
    const ids = rules.declaredRequirementIds(
      '011-interface-foundations',
      '- **FR-001**: A requirement.\nProse mentioning FR-999 in passing.\n- **SC-002**: A criterion.',
    );

    assert.deepEqual(ids, ['011/FR-001', '011/SC-002']);
  });

  it('reads the covered feature list from the ledger source', () => {
    const covered = rules.coveredFeatures(
      "export const COVERED_FEATURES = ['011-interface-foundations', '001-ship-selection-and-loading'];",
    );

    assert.deepEqual([...covered], ['011-interface-foundations', '001-ship-selection-and-loading']);
  });

  it('reads registered ids only from requirements arrays', () => {
    const registered = rules.registeredRequirementIds(
      "const a = { requirements: ['011/FR-001', '011/SC-002'] }; // and 011/FR-999",
    );

    assert.deepEqual([...registered].sort(), ['011/FR-001', '011/SC-002']);
  });
});

describe('value classification', () => {
  it('recognises tokenised values', () => {
    for (const value of [
      'var(--edsb-text-primary)',
      'calc(var(--edsb-space-lg) * 2)',
      '0',
      'none',
      'inherit',
      '$sass-variable',
    ]) {
      assert.equal(rules.isTokenisedValue(value), true, value);
    }
  });

  it('recognises hand-picked literals', () => {
    for (const value of ['#fff', '13px', 'rgba(0, 0, 0, 0.4)', '1.5rem', 'Arial, sans-serif']) {
      assert.equal(rules.isTokenisedValue(value), false, value);
    }
  });

  it('recognises text that is structure rather than language', () => {
    for (const value of ['  ', '·', '()', '—', '/', '123', ':']) {
      assert.equal(rules.isStructuralText(value), true, JSON.stringify(value));
    }
  });

  it('recognises text that is language', () => {
    for (const value of ['Save', 'Nicht verfügbar', 'a']) {
      assert.equal(rules.isStructuralText(value), false, value);
    }
  });
});

describe('shipped catalogue parity', () => {
  const english = {
    'app.name': 'Ship Builder',
    'app.document-title': '{{page}} · {{app}}',
    'status.info': 'Information',
  };
  const reviewed = { de: { 'status.info': 'The ordinary German word.' } };

  it('accepts a catalogue with the same keys, variables and reviewed wording', () => {
    const found = rules.catalogueViolations(
      {
        en: english,
        de: {
          'app.name': 'Schiffskonstrukteur',
          'app.document-title': '{{page}} · {{app}}',
          'status.info': 'Information',
        },
      },
      { de: { ...reviewed.de, 'app.document-title': 'A language-neutral pattern.' } },
    );

    assert.deepEqual(found, []);
  });

  it('rejects a key English has and the translation does not', () => {
    const found = rules.catalogueViolations(
      { en: english, de: { 'app.document-title': '{{page}} · {{app}}', 'status.info': 'Info' } },
      reviewed,
    );

    assert.ok(ruleIds(found).includes('catalogue-missing-key'));
  });

  it('rejects a key the translation invents', () => {
    const found = rules.catalogueViolations(
      {
        en: english,
        de: {
          'app.name': 'Schiffskonstrukteur',
          'app.document-title': '{{page}} · {{app}}',
          'status.info': 'Info',
          'app.erfunden': 'Etwas',
        },
      },
      reviewed,
    );

    assert.ok(ruleIds(found).includes('catalogue-unknown-key'));
  });

  it('rejects a blank translated value', () => {
    const found = rules.catalogueViolations(
      {
        en: english,
        de: {
          'app.name': '   ',
          'app.document-title': '{{page}} · {{app}}',
          'status.info': 'Info',
        },
      },
      reviewed,
    );

    assert.ok(ruleIds(found).includes('catalogue-blank'));
  });

  it('rejects a translation that changes the interpolation variables', () => {
    const found = rules.catalogueViolations(
      {
        en: english,
        de: {
          'app.name': 'Schiffskonstrukteur',
          'app.document-title': '{{seite}} · {{app}}',
          'status.info': 'Info',
        },
      },
      reviewed,
    );

    assert.ok(ruleIds(found).includes('catalogue-interpolation'));
  });

  it('rejects word-for-word English that nobody has reviewed', () => {
    const found = rules.catalogueViolations(
      {
        en: english,
        de: {
          'app.name': 'Ship Builder',
          'app.document-title': '{{page}} · {{app}}',
          'status.info': 'Information',
        },
      },
      { de: {} },
    );

    assert.ok(ruleIds(found).includes('catalogue-unreviewed-wording'));
  });

  it('rejects a review record for a message that no longer exists', () => {
    const found = rules.catalogueViolations(
      {
        en: { 'app.name': 'Ship Builder' },
        de: { 'app.name': 'Schiffskonstrukteur' },
      },
      { de: { 'app.removed': 'Reviewed long ago.' } },
    );

    assert.ok(ruleIds(found).includes('catalogue-stale-review'));
  });

  it('fails when the English schema itself is missing', () => {
    const found = rules.catalogueViolations(
      { de: { 'app.name': 'Schiffskonstrukteur' } },
      reviewed,
    );

    assert.deepEqual(ruleIds(found), ['catalogue-missing']);
  });
});

describe('service-worker ownership', () => {
  const config = {
    assetGroups: [
      { name: 'app-shell', resources: { files: ['/index.html'] } },
      { name: 'fonts-and-bundled-english', resources: { files: ['/fonts/**', '/i18n/en.json'] } },
      { name: 'translations', resources: { files: ['/i18n/*.json'] } },
    ],
  };

  it('accepts exactly one registration with the shell and English prefetched', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      { 'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})" },
      config,
    );

    assert.deepEqual(found, []);
  });

  it('lets a downstream feature extend the static asset groups', () => {
    const extended = {
      assetGroups: [
        ...config.assetGroups,
        { name: 'shipyard-assets', resources: { files: ['/shipyard/**'] } },
      ],
    };

    const found = rules.serviceWorkerOwnershipViolations(
      { 'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})" },
      extended,
    );

    assert.deepEqual(found, []);
  });

  it('rejects a second registration', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      {
        'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})",
        'src/app/shipyard/shipyard.config.ts': "provideServiceWorker('shipyard-worker.js', {})",
      },
      config,
    );

    assert.deepEqual(ruleIds(found), ['service-worker-ownership']);
  });

  it('rejects a feature registering a worker directly', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      {
        'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})",
        'src/app/shipyard/offline.ts': "navigator.serviceWorker.register('/mine.js');",
      },
      config,
    );

    assert.deepEqual(ruleIds(found), ['service-worker-ownership']);
  });

  it('rejects a feature owning its own cache', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      {
        'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})",
        'src/app/shipyard/cache.ts': "await caches.open('shipyard-v1');",
      },
      config,
    );

    assert.deepEqual(ruleIds(found), ['service-worker-ownership']);
  });

  it('rejects a feature spawning its own worker dependency', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      {
        'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})",
        'src/app/shipyard/compute.ts': "const worker = new Worker('./compute.worker.js');",
      },
      config,
    );

    assert.deepEqual(ruleIds(found), ['service-worker-ownership']);
  });

  it('rejects a build with no registration at all', () => {
    const found = rules.serviceWorkerOwnershipViolations({ 'src/app/app.config.ts': '' }, config);

    assert.deepEqual(ruleIds(found), ['service-worker-ownership']);
  });

  it('rejects a cross-origin asset and a response cache', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      { 'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})" },
      {
        assetGroups: [
          {
            name: 'app-shell',
            resources: { files: ['https://cdn.example/app.js', '/i18n/en.json'] },
          },
        ],
        dataGroups: [{ name: 'api', urls: ['/api/**'] }],
      },
    );

    assert.equal(found.length, 2);
    assert.deepEqual(new Set(ruleIds(found)), new Set(['service-worker-ownership']));
  });

  it('rejects two asset groups sharing a name', () => {
    const found = rules.serviceWorkerOwnershipViolations(
      { 'src/app/app.config.ts': "provideServiceWorker('ngsw-worker.js', {})" },
      {
        assetGroups: [
          { name: 'app-shell', resources: { files: ['/index.html', '/i18n/en.json'] } },
          { name: 'app-shell', resources: { files: ['/other.html'] } },
        ],
      },
    );

    assert.deepEqual(ruleIds(found), ['service-worker-ownership']);
  });
});

describe('conformance claims', () => {
  it('accepts a claim that names every excluded criterion', () => {
    const found = rules.conformanceClaimViolations({
      'README.md':
        'The target is WCAG 2.2 AA except success criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, ' +
        '2.4.3, 2.4.7 and 2.4.11.',
    });

    assert.deepEqual(found, []);
  });

  it('rejects an unqualified claim', () => {
    const found = rules.conformanceClaimViolations({ 'README.md': 'Accessible to WCAG 2.2 AA.' });

    assert.deepEqual(ruleIds(found), ['unqualified-conformance-claim']);
  });

  it('rejects a claim that names only some of the exclusions', () => {
    const found = rules.conformanceClaimViolations({
      'README.md': 'WCAG 2.2 AA except 2.1.1 and 2.1.2.',
    });

    assert.deepEqual(ruleIds(found), ['unqualified-conformance-claim']);
  });

  it('rejects a claim that names the seven keyboard criteria and not the eighth', () => {
    // The seven keyboard criteria without 2.2.1, which the update restart is
    // also excluded for. A claim that omits it is the stronger claim the
    // checker exists to refuse.
    const found = rules.conformanceClaimViolations({
      'README.md': 'WCAG 2.2 AA except 2.1.1, 2.1.2, 2.1.4, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.',
    });

    assert.deepEqual(ruleIds(found), ['unqualified-conformance-claim']);
  });

  it('does not accept exclusions stated in a different paragraph', () => {
    // A claim that can be quoted without its qualification is unqualified.
    const found = rules.conformanceClaimViolations({
      'README.md':
        'Accessible to WCAG 2.2 AA.\n\nExcluded: 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7, 2.4.11.',
    });

    assert.deepEqual(ruleIds(found), ['unqualified-conformance-claim']);
  });

  it('ignores text that makes no conformance claim', () => {
    assert.deepEqual(rules.conformanceClaimViolations({ 'README.md': 'A ship builder.' }), []);
  });
});

describe('ledger reconciliation', () => {
  const base = {
    routes: [],
    componentIds: ['action-button'],
    previewAddresses: ['action-button--default'],
    projectNames: ['chromium-desktop'],
    configuredProjectNames: ['chromium-desktop'],
    ledger: [{ surfaceId: 'preview/catalogue', journey: 'preview/sweep' }],
  };

  it('accepts a ledger that accounts for everything that exists', () => {
    assert.deepEqual(rules.ledgerReconciliationViolations(base), []);
  });

  it('rejects a route nothing covers', () => {
    const found = rules.ledgerReconciliationViolations({ ...base, routes: ['shipyard'] });

    assert.deepEqual(ruleIds(found), ['ledger-reconciliation']);
  });

  it('rejects an exported component with no preview state', () => {
    const found = rules.ledgerReconciliationViolations({
      ...base,
      componentIds: ['action-button', 'orphan'],
    });

    assert.deepEqual(ruleIds(found), ['ledger-reconciliation']);
  });

  it('rejects preview states no journey claims to sweep', () => {
    const found = rules.ledgerReconciliationViolations({
      ...base,
      ledger: [{ surfaceId: 'shell/controls', journey: 'product/semantics' }],
    });

    assert.deepEqual(ruleIds(found), ['ledger-reconciliation']);
  });

  it('rejects a project configured in Playwright but absent from the ledger', () => {
    const found = rules.ledgerReconciliationViolations({
      ...base,
      configuredProjectNames: ['chromium-desktop', 'firefox-desktop'],
    });

    assert.deepEqual(ruleIds(found), ['ledger-reconciliation']);
  });

  it('rejects a project the ledger claims and Playwright does not configure', () => {
    const found = rules.ledgerReconciliationViolations({
      ...base,
      projectNames: ['chromium-desktop', 'webkit-desktop'],
    });

    assert.deepEqual(ruleIds(found), ['ledger-reconciliation']);
  });
});

describe('production output', () => {
  it('accepts output with no preview and no foreign request', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/main.js': 'fetch("/i18n/de.json");',
      'dist/app/browser/index.html': '<link rel="stylesheet" href="/styles.css">',
    });

    assert.deepEqual(found, []);
  });

  it('fails when there is nothing to inspect', () => {
    assert.deepEqual(ruleIds(rules.productionOutputViolations({})), ['production-output']);
  });

  it('rejects a bundled preview chunk', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/ui-preview-ABC123.js': 'console.log(1);',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
  });

  it('rejects a reference format the application cannot actually produce', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/main.js': 'const label = "MARKDOWN TABLE";',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
  });

  it('rejects the repository manifest leaking into the bundle', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/main.js': 'const pkg = { "devDependencies": {} };',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
  });

  it('rejects preview markers that survived into the shipped bundle', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/main.js': 'el.setAttribute("data-preview-address", a);',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
  });

  it('rejects a runtime request to another origin', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/main.js': 'fetch("https://api.example.com/builds");',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
  });

  it('accepts a canonical link, which declares an address rather than fetching one', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/index.html': '<link rel="canonical" href="https://sb.edct.dev/ships">',
    });

    assert.deepEqual(found, []);
  });

  it('still rejects a stylesheet from another origin on the same document', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/index.html':
        '<link rel="canonical" href="https://sb.edct.dev/"><link rel="stylesheet" href="https://cdn.example.com/x.css">',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
    assert.match(found[0].message, /cdn\.example\.com/);
  });

  it('still rejects a preconnect, which opens the connection it names', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/index.html': '<link rel="preconnect" href="https://fonts.example.com">',
    });

    assert.deepEqual(ruleIds(found), ['production-output']);
  });

  it('rejects a request to a vocabulary the search-metadata rule names as a string', () => {
    // `schema.org` and `sitemaps.org` are exempt from the search-metadata rule,
    // where they appear as a `@context` and an `xmlns` and are never fetched.
    // Exempting them here as well would let the shipped bundle open a
    // connection nobody is told about, which is the whole of this rule.
    for (const contents of [
      'fetch("https://schema.org/WebApplication");',
      '<script src="https://www.sitemaps.org/x.js"></script>',
    ]) {
      assert.deepEqual(
        ruleIds(rules.productionOutputViolations({ 'dist/app/browser/x': contents })),
        ['production-output'],
        contents,
      );
    }
  });

  it('rejects a stylesheet, script or font loaded from another origin', () => {
    for (const contents of [
      '<script src="https://cdn.example/app.js"></script>',
      '<link rel="stylesheet" href="https://fonts.example/css">',
      '@import url(https://fonts.example/css);',
      '@font-face { src: url("https://fonts.example/a.woff2"); }',
    ]) {
      assert.deepEqual(
        ruleIds(rules.productionOutputViolations({ 'dist/app/browser/x': contents })),
        ['production-output'],
        contents,
      );
    }
  });

  it('does not mistake an XML namespace for a request', () => {
    const found = rules.productionOutputViolations({
      'dist/app/browser/main.js': 'const NS = "http://www.w3.org/2000/svg";',
    });

    assert.deepEqual(found, []);
  });
});

describe('extracted schematics', () => {
  const installed = {
    'Anaconda/schematic-top.svg': 'aaa',
    'Anaconda/schematic-bottom.svg': 'bbb',
  };

  it('accepts an extract made from the installed package', () => {
    const found = rules.copiedSchematicViolations({
      installed,
      extracted: { ...installed },
      tracked: ['src/assets/icons/logo.svg'],
    });

    assert.deepEqual(found, []);
  });

  it('fails when there is nothing to inspect', () => {
    assert.deepEqual(
      ruleIds(rules.copiedSchematicViolations({ installed: {}, extracted: {}, tracked: [] })),
      ['copied-schematics'],
    );
  });

  it('rejects a hull the package ships and nobody extracted', () => {
    const found = rules.copiedSchematicViolations({
      installed,
      extracted: { 'Anaconda/schematic-top.svg': 'aaa' },
      tracked: [],
    });

    assert.deepEqual(ruleIds(found), ['copied-schematics']);
  });

  it('rejects an extract left behind by a package upgrade', () => {
    const found = rules.copiedSchematicViolations({
      installed,
      extracted: { ...installed, 'Anaconda/schematic-top.svg': 'the previous release' },
      tracked: [],
    });

    assert.deepEqual(ruleIds(found), ['copied-schematics']);
  });

  it('rejects an unreadable extract the same way as a missing one', () => {
    const found = rules.copiedSchematicViolations({
      installed,
      extracted: { ...installed, 'Anaconda/schematic-top.svg': null },
      tracked: [],
    });

    assert.deepEqual(ruleIds(found), ['copied-schematics']);
  });

  it('rejects an extract for a hull the pinned package no longer ships', () => {
    // A rename or a withdrawal upstream leaves a file that is still served and
    // that no script can reproduce — the private geometry catalogue by another
    // route. Comparing only installed-to-extract never sees it.
    const found = rules.copiedSchematicViolations({
      installed,
      extracted: { ...installed },
      committed: [
        'Anaconda/schematic-top.json',
        'Anaconda/schematic-bottom.json',
        'Sidewinder/schematic-top.json',
      ],
      tracked: [],
    });

    assert.deepEqual(ruleIds(found), ['copied-schematics']);
  });

  it('rejects a package schematic kept in the repository', () => {
    const found = rules.copiedSchematicViolations({
      installed,
      extracted: { ...installed },
      tracked: ['public/assets/ships/Anaconda/schematic-top.svg'],
    });

    assert.deepEqual(ruleIds(found), ['copied-schematics']);
  });
});

describe('the placeholder grammar', () => {
  /**
   * The gate and the runtime must spell a placeholder the same way.
   *
   * This file is `.mjs` and cannot import TypeScript, so `interpolationVariablesOf`
   * above is a copy of `PLACEHOLDER` in `src/app/i18n/locale-registry.ts` kept by
   * hand. When the two drifted apart, a catalogue whose English carried `{{}}`
   * passed this gate and was then refused at runtime by `validateCatalogue` —
   * the build going green on a locale that cannot load. Nothing caught it, so:
   */
  // Whatever the two say, they must say the same thing. Asserting a fixed
  // literal here would make a *correct* change to the grammar fail with "the
  // gate drifted", which is the wrong diagnosis and a third copy to maintain.
  const spelling = (source) => source.match(/\/\\\{\\\{[^\n]*?\/g/)?.[0] ?? null;

  it('is spelled identically in the gate and in the application', () => {
    const gate = readFileSync(
      new URL('./check-interface-foundations.mjs', import.meta.url),
      'utf8',
    );
    const application = readFileSync(
      new URL('../src/app/i18n/locale-registry.ts', import.meta.url),
      'utf8',
    );

    const gateSpelling = spelling(gate);
    assert.ok(gateSpelling, 'the gate no longer declares a placeholder pattern');
    assert.equal(spelling(application), gateSpelling);
  });
});

describe('the excluded-criteria enumeration', () => {
  it('rejects a claim that omits 2.4.1, which hides inside 2.4.11', () => {
    const found = rules.conformanceClaimViolations({
      'X.md': 'WCAG 2.2 AA except 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.3, 2.4.7 and 2.4.11.',
    });

    assert.deepEqual(ruleIds(found), ['unqualified-conformance-claim']);
    assert.match(found[0].message, /2\.4\.1(?!\d)/);
  });

  it('accepts the complete enumeration', () => {
    const found = rules.conformanceClaimViolations({
      'Y.md':
        'WCAG 2.2 AA except criteria 2.1.1, 2.1.2, 2.1.4, 2.2.1, 2.4.1, 2.4.3, 2.4.7 and 2.4.11.',
    });

    assert.deepEqual(found, []);
  });
});

describe('search metadata', () => {
  const ORIGIN = "export const SITE_ORIGIN = 'https://sb.edct.dev';";

  // Held apart so the "no JSON-LD" case can be built by leaving the block out
  // rather than by cutting it back out of a finished document. A regexp that
  // strips a `<script>` element is a filter, and a filter is judged as one: it
  // would have to survive `<SCRIPT>` and a second element to be worth trusting,
  // and none of that has anything to do with what this fixture is for.
  const INDEX_WITHOUT_JSON_LD = [
    '<meta name="description" content="What this is." />',
    '<meta name="theme-color" content="#0b0b0c" />',
    '<meta name="robots" content="index,follow,max-image-preview:large" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    '<meta name="twitter:title" content="Ship Builder" />',
    '<meta name="twitter:description" content="What this is." />',
    '<meta name="twitter:image" content="https://sb.edct.dev/assets/link-card.png" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Ship Builder" />',
    '<meta property="og:title" content="Ship Builder" />',
    '<meta property="og:description" content="What this is." />',
    '<meta property="og:url" content="https://sb.edct.dev/" />',
    '<meta property="og:locale" content="en" />',
    '<meta property="og:image" content="https://sb.edct.dev/assets/link-card.png" />',
    '<meta property="og:image:alt" content="Ship Builder" />',
    '<link rel="canonical" href="https://sb.edct.dev/" />',
    '<link rel="manifest" href="manifest.webmanifest" />',
  ].join('\n');

  const JSON_LD =
    '<script type="application/ld+json">{"@context":"https://schema.org","url":"https://sb.edct.dev/","inLanguage":["en","de"]}</script>';

  const INDEX = `${INDEX_WITHOUT_JSON_LD}\n${JSON_LD}`;

  const ROBOTS = 'User-agent: *\nAllow: /\n\nSitemap: https://sb.edct.dev/sitemap.xml\n';

  const SITEMAP = `<urlset>
    <url><loc>https://sb.edct.dev/ships</loc></url>
    <url><loc>https://sb.edct.dev/build</loc></url>
  </urlset>`;

  const TOKENS = '  --edsb-palette-bg: #0b0b0c;\n';

  const MANIFEST = JSON.stringify({
    name: 'Elite Dangerous Ship Builder',
    short_name: 'Elite Dangerous Ship Builder',
    description: 'What this is.',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    icons: [
      { src: 'favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { src: 'assets/icons/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'assets/icons/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: 'assets/icons/app-icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  });

  // What `scripts/search/published-addresses.mjs` hands the rule: the addresses
  // the deployment writes documents for, each with the keys that name it.
  const PUBLISHED = [
    {
      path: 'ships',
      route: 'ships',
      address: 'https://sb.edct.dev/ships',
      titleKey: 'catalogue.title',
      descriptionKey: 'catalogue.description',
      image: 'assets/link-card.png',
    },
    {
      path: 'build',
      route: 'build',
      address: 'https://sb.edct.dev/build',
      titleKey: 'workspace.title',
      descriptionKey: 'workspace.description',
      image: 'assets/link-card.png',
    },
  ];

  // What the rule finds under `public/`. Everything the manifest, the index and
  // the published addresses name has to be here, or the rule fails by name.
  const ASSETS = [
    'favicon.ico',
    'assets/icons/app-icon-192.png',
    'assets/icons/app-icon-512.png',
    'assets/icons/app-icon-maskable-512.png',
    'assets/icons/apple-touch-icon.png',
    'assets/link-card.png',
  ];

  // The one line of the workflow this rule reads: the expression that turns a
  // preview deployment's robots tag into `noindex`.
  const PREVIEW = `      - name: Ask search engines to leave the preview alone
        run: |
          sed -E -i 's|<meta name="robots" content="[^"]*"|<meta name="robots" content="noindex"|' index.html
`;

  // The route table as the rule pairs it: one triple per addressable route.
  const ROUTE_TABLE = [
    { path: '' },
    { path: 'ships', titleKey: 'catalogue.title', descriptionKey: 'catalogue.description' },
    { path: ':hull', titleKey: 'hullDetail.title', descriptionKey: 'hullDetail.description' },
    { path: 'build', titleKey: 'workspace.title', descriptionKey: 'workspace.description' },
    { path: 'builds', titleKey: 'library.title', descriptionKey: 'library.description' },
    { path: '**' },
  ];

  const MESSAGE_KEYS = [
    'catalogue.title',
    'catalogue.description',
    'workspace.title',
    'workspace.description',
    'hullDetail.title',
    'hullDetail.description',
  ];

  const complete = (overrides = {}) => ({
    origin: ORIGIN,
    published: PUBLISHED,
    messages: MESSAGE_KEYS,
    routeTable: ROUTE_TABLE,
    index: INDEX,
    robots: ROBOTS,
    sitemap: SITEMAP,
    manifest: MANIFEST,
    domain: 'sb.edct.dev\n',
    tokens: TOKENS,
    assets: ASSETS,
    preview: PREVIEW,
    locales: ['en', 'de'],
    routes: ['', 'ships', ':hull', 'build', '**'],
    ...overrides,
  });

  it('accepts a set of files that agree with each other and with the routes', () => {
    assert.deepEqual(rules.searchMetadataViolations(complete()), []);
  });

  it('reads no route out of an XML comment, in either of its shapes', () => {
    // The deployment publishes one file per `<loc>` and cuts comments before it
    // reads them. A `<loc>` this rule counted and the deploy skipped would be a
    // route that passes the gate and never gets a file.
    for (const commented of [
      `<urlset>
        <!-- <loc>https://sb.edct.dev/ghost</loc> -->
        <url><loc>https://sb.edct.dev/ships</loc></url>
        <url><loc>https://sb.edct.dev/build</loc></url>
      </urlset>`,
      `<urlset>
        <!--
          <loc>https://sb.edct.dev/ghost</loc>
        -->
        <url><loc>https://sb.edct.dev/ships</loc></url>
        <url><loc>https://sb.edct.dev/build</loc></url>
      </urlset>`,
    ]) {
      assert.deepEqual(rules.searchMetadataViolations(complete({ sitemap: commented })), []);
    }
  });

  it('refuses a malformed comment rather than reading past it the deploy cannot', () => {
    // `--` is illegal inside an XML comment and nothing here validates the
    // file, so a lazy strip would cut this one and the deployment's `sed`,
    // which cannot express one, would not — and would publish `/ghost` with a
    // canonical of its own. Neither reader strips it, so a delimiter survives
    // the cut and the file is refused for what is actually wrong with it.
    const malformed = `<urlset>
      <!-- old -- gone <loc>https://sb.edct.dev/ghost</loc> -->
      <url><loc>https://sb.edct.dev/ships</loc></url>
      <url><loc>https://sb.edct.dev/build</loc></url>
    </urlset>`;

    const found = rules.searchMetadataViolations(complete({ sitemap: malformed }));

    assert.match(found[0].message, /nested or contains/);
  });

  it('refuses the HTML comment terminator, which closes nothing in XML', () => {
    // `--!>` ends a comment in HTML and ends nothing here, so a file holding
    // one means something different to whoever reads it next. Both readers
    // refuse it rather than guess which of the two the author meant.
    const html = `<urlset>
      <!-- gone <loc>https://sb.edct.dev/ghost</loc> --!>
      <url><loc>https://sb.edct.dev/ships</loc></url>
      <url><loc>https://sb.edct.dev/build</loc></url>
    </urlset>`;

    const found = rules.searchMetadataViolations(complete({ sitemap: html }));

    assert.match(found[0].message, /nested or contains/);
  });

  it('refuses a comment that one pass reassembles into another', () => {
    // What a single strip cannot do, and why the leftovers are checked rather
    // than cut again: removing the inner `<!-- -->` here joins `<!` to `--`
    // and leaves a comment wrapping `/ghost`. A second pass would then read
    // the file as listing nothing, while the deployment's `sed` — also one
    // pass — would publish `/ghost`. The two must agree, so both refuse it.
    const nested = `<urlset>
      <!<!-- -->-- <loc>https://sb.edct.dev/ghost</loc> -->
      <url><loc>https://sb.edct.dev/ships</loc></url>
      <url><loc>https://sb.edct.dev/build</loc></url>
    </urlset>`;

    const found = rules.searchMetadataViolations(complete({ sitemap: nested }));

    assert.match(found[0].message, /nested or contains/);
  });

  it('still misses a route that a comment is the only thing listing it', () => {
    // The other direction of the same rule: commenting a route out is removing
    // it, and an addressable route that nothing lists is the drift this exists
    // to catch.
    const commented = `<urlset>
      <url><loc>https://sb.edct.dev/ships</loc></url>
      <!-- <url><loc>https://sb.edct.dev/build</loc></url> -->
    </urlset>`;

    const found = rules.searchMetadataViolations(complete({ sitemap: commented }));

    assert.deepEqual(ruleIds(found), ['search-metadata']);
    assert.match(found[0].message, /\/build/);
  });

  it('fails when nothing states where the application is published', () => {
    const found = rules.searchMetadataViolations({});

    assert.deepEqual(ruleIds(found), ['search-metadata']);
    assert.match(found[0].message, /SITE_ORIGIN/);
  });

  it('rejects a head with no description for a crawler that runs no script', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace(/<meta name="description"[^>]*>/, '') }),
    );

    assert.deepEqual(ruleIds(found), ['search-metadata']);
    assert.match(found[0].message, /description/);
  });

  it('rejects a head with no canonical link', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace(/<link rel="canonical"[^>]*>/, '') }),
    );

    assert.match(found[0].message, /canonical/);
  });

  it('rejects a head with no JSON-LD', () => {
    const found = rules.searchMetadataViolations(complete({ index: INDEX_WITHOUT_JSON_LD }));

    assert.match(found[0].message, /JSON-LD/);
  });

  it('rejects a domain moved in one file and not the others', () => {
    const found = rules.searchMetadataViolations(
      complete({ robots: ROBOTS.replace('sb.edct.dev', 'shipbuilder.example') }),
    );

    assert.ok(found.length > 0);
    assert.match(found[0].message, /shipbuilder\.example/);
  });

  it('accepts the vocabularies a document declares itself against', () => {
    const found = rules.searchMetadataViolations(
      complete({
        sitemap: SITEMAP.replace(
          '<urlset>',
          '<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">',
        ),
      }),
    );

    assert.deepEqual(found, []);
  });

  it('rejects a robots file that disallows the whole site', () => {
    const found = rules.searchMetadataViolations(
      complete({
        robots: `User-agent: *\nDisallow: /\n\nSitemap: https://sb.edct.dev/sitemap.xml\n`,
      }),
    );

    assert.match(found[0].message, /disallowed/);
  });

  it('rejects a robots file that names no sitemap', () => {
    const found = rules.searchMetadataViolations(complete({ robots: 'User-agent: *\nAllow: /\n' }));

    assert.match(found[0].message, /Sitemap/);
  });

  it('rejects an addressable route no published address names', () => {
    const found = rules.searchMetadataViolations(
      complete({ routes: ['', 'ships', ':hull', 'build', 'builds', '**'] }),
    );

    assert.deepEqual(ruleIds(found), ['search-metadata']);
    assert.match(found[0].message, /\/builds/);
  });

  it('rejects a listed address that is not a route the application serves', () => {
    const found = rules.searchMetadataViolations(
      complete({ sitemap: `${SITEMAP}<url><loc>https://sb.edct.dev/gone</loc></url>` }),
    );

    assert.match(found[0].message, /\/gone/);
  });

  it('does not ask a redirect or a wildcard to be listed', () => {
    assert.deepEqual(
      rules.searchMetadataViolations(complete({ routes: ['', 'ships', 'build', '**'] })),
      [],
    );
  });

  it('rejects a manifest that is not valid JSON', () => {
    const found = rules.searchMetadataViolations(complete({ manifest: '{ not json' }));

    assert.match(found[0].message, /valid JSON/);
  });

  it('rejects a manifest missing a member a browser needs', () => {
    const incomplete = JSON.parse(MANIFEST);
    delete incomplete.icons;
    const found = rules.searchMetadataViolations(
      complete({ manifest: JSON.stringify(incomplete) }),
    );

    assert.match(found[0].message, /icons/);
  });

  it('rejects a root-absolute path, which breaks every preview deployment', () => {
    const rooted = { ...JSON.parse(MANIFEST), start_url: '/' };
    const found = rules.searchMetadataViolations(complete({ manifest: JSON.stringify(rooted) }));

    assert.match(found[0].message, /start_url/);
  });

  it('rejects a root-absolute icon path for the same reason', () => {
    const rooted = { ...JSON.parse(MANIFEST), icons: [{ src: '/favicon.ico' }] };
    const found = rules.searchMetadataViolations(complete({ manifest: JSON.stringify(rooted) }));

    assert.ok(found.some((violation) => /icons\[0\]\.src/.test(violation.message)));
  });
  it('rejects an absolute path even when it names the declared origin', () => {
    // The one that slips past everything else: `https://sb.edct.dev/` is the
    // declared origin, so the foreign-address sweep is content with it and the
    // root-absolute rule never sees a leading slash. It still pins a preview's
    // installed application to production, which is the whole reason these
    // three members are relative.
    for (const member of ['start_url', 'scope']) {
      const pinned = { ...JSON.parse(MANIFEST), [member]: 'https://sb.edct.dev/' };
      const found = rules.searchMetadataViolations(complete({ manifest: JSON.stringify(pinned) }));

      assert.deepEqual(ruleIds(found), ['search-metadata'], member);
      assert.match(found[0].message, /absolute address installs a preview/);
    }

    const pinnedIcon = {
      ...JSON.parse(MANIFEST),
      icons: [{ src: 'https://sb.edct.dev/favicon.ico', sizes: '48x48', type: 'image/x-icon' }],
    };
    const found = rules.searchMetadataViolations(
      complete({ manifest: JSON.stringify(pinnedIcon) }),
    );

    assert.ok(found.some((violation) => /icons\[0\]\.src/.test(violation.message)));
  });

  it('accepts a protocol-relative path nowhere either', () => {
    const pinned = { ...JSON.parse(MANIFEST), start_url: '//sb.edct.dev/' };
    const found = rules.searchMetadataViolations(complete({ manifest: JSON.stringify(pinned) }));

    assert.match(found[0].message, /absolute address installs a preview/);
  });

  it('still accepts the relative forms a manifest is supposed to carry', () => {
    for (const value of ['./', '.', 'index.html', './icons/a.png']) {
      const relative = { ...JSON.parse(MANIFEST), start_url: value };

      assert.deepEqual(
        rules.searchMetadataViolations(complete({ manifest: JSON.stringify(relative) })),
        [],
        value,
      );
    }
  });

  it('rejects a site served from a domain SITE_ORIGIN does not name', () => {
    const found = rules.searchMetadataViolations(complete({ domain: 'shipbuilder.example\n' }));

    assert.deepEqual(ruleIds(found), ['search-metadata']);
    assert.match(found[0].message, /shipbuilder\.example/);
  });

  it('rejects a deployment that declares no domain at all', () => {
    const found = rules.searchMetadataViolations(complete({ domain: '' }));

    assert.match(found[0].message, /production domain/);
  });

  it('rejects a relative canonical, which canonicalises a preview to itself', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace('href="https://sb.edct.dev/"', 'href="/"') }),
    );

    assert.deepEqual(ruleIds(found), ['search-metadata']);
    assert.match(found[0].message, /absolute/);
  });

  it('rejects the three description tags drifting apart', () => {
    const found = rules.searchMetadataViolations(
      complete({
        index: INDEX.replace(
          '<meta name="twitter:description" content="What this is." />',
          '<meta name="twitter:description" content="Something else." />',
        ),
      }),
    );

    assert.match(found[0].message, /do not say the same thing/);
  });

  it('sees a plain-text address as well as a secure one', () => {
    const found = rules.searchMetadataViolations(
      complete({ robots: `${ROBOTS}Host: http://shipbuilder.example\n` }),
    );

    assert.match(found[0].message, /shipbuilder\.example/);
  });

  it('rejects a foreign origin in the manifest', () => {
    const foreign = { ...JSON.parse(MANIFEST), icons: [{ src: 'https://cdn.example/icon.png' }] };
    const found = rules.searchMetadataViolations(complete({ manifest: JSON.stringify(foreign) }));

    assert.match(found[0].message, /cdn\.example/);
  });

  it('rejects a root-absolute manifest link, for the reason its own paths are relative', () => {
    const found = rules.searchMetadataViolations(
      complete({
        index: INDEX.replace('href="manifest.webmanifest"', 'href="/manifest.webmanifest"'),
      }),
    );

    assert.match(found[0].message, /root-absolute/);
  });

  it('rejects structured data that does not parse, which states as much as none', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace('"@context"', 'nope') }),
    );

    assert.match(found[0].message, /does not parse/);
  });

  it('rejects structured data naming an address that is not the site root', () => {
    const found = rules.searchMetadataViolations(
      complete({
        index: INDEX.replace('"url":"https://sb.edct.dev/"', '"url":"https://sb.edct.dev/ships"'),
      }),
    );

    assert.match(found[0].message, /JSON-LD names/);
  });

  it('rejects structured data that has not kept up with a shipped language', () => {
    const found = rules.searchMetadataViolations(complete({ locales: ['en', 'de', 'fr'] }));

    assert.match(found[0].message, /declares languages/);
  });

  it('rejects an og:url that is not the canonical it restates', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace('content="https://sb.edct.dev/" />', 'content="/" />') }),
    );

    assert.match(found[0].message, /og:url/);
  });

  it('sees description drift that begins after an apostrophe', () => {
    const found = rules.searchMetadataViolations(
      complete({
        index: INDEX.replace(
          '<meta name="description" content="What this is." />',
          `<meta name="description" content="A page's one." />`,
        )
          .replace(
            '<meta property="og:description" content="What this is." />',
            `<meta property="og:description" content="A page's two." />`,
          )
          .replace(
            '<meta name="twitter:description" content="What this is." />',
            `<meta name="twitter:description" content="A page's three." />`,
          ),
      }),
    );

    assert.match(found[0].message, /do not say the same thing/);
  });

  it('rejects a theme colour the token layer does not draw', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace('content="#0b0b0c"', 'content="#101010"') }),
    );

    assert.match(found[0].message, /theme-color/);
  });

  it('rejects a manifest colour the token layer does not draw', () => {
    const found = rules.searchMetadataViolations(
      complete({
        manifest: MANIFEST.replace('"theme_color":"#0b0b0c"', '"theme_color":"#101010"'),
      }),
    );

    assert.match(found[0].message, /theme_color/);
  });

  it('rejects a manifest id, which resolves against the origin and cannot be per-deployment', () => {
    const found = rules.searchMetadataViolations(
      complete({ manifest: JSON.stringify({ ...JSON.parse(MANIFEST), id: './' }) }),
    );

    assert.match(found[0].message, /"id"/);
  });

  // A published hull address, with the sitemap entry that goes with it.
  const HULL = {
    path: 'ships/Anaconda',
    route: 'ships/:hull',
    address: 'https://sb.edct.dev/ships/Anaconda',
    titleKey: 'hullDetail.title',
    descriptionKey: 'hullDetail.description',
    image: 'assets/ships/Anaconda/illustration.png',
  };
  const withHull = (overrides = {}) =>
    complete({
      published: [...PUBLISHED, HULL],
      sitemap: SITEMAP.replace('</urlset>', `<url><loc>${HULL.address}</loc></url></urlset>`),
      assets: [...ASSETS, HULL.image],
      ...overrides,
    });

  /**
   * The rules that make a link, an install prompt or a preview deployment work.
   *
   * Each one is checked by making it fail, because a rule that has only ever
   * been run against a passing fixture is a rule nobody has seen work.
   */
  const withIcons = (icons) =>
    JSON.stringify({ ...JSON.parse(MANIFEST), icons: [...JSON.parse(MANIFEST).icons, ...icons] });
  const withoutIcon = (matches) =>
    JSON.stringify({
      ...JSON.parse(MANIFEST),
      icons: JSON.parse(MANIFEST).icons.filter((icon) => !matches(icon)),
    });

  for (const size of ['192x192', '512x512']) {
    it(`rejects a manifest with no icon at ${size}, which offers no installation`, () => {
      const found = rules.searchMetadataViolations(
        complete({ manifest: withoutIcon((icon) => icon.sizes === size) }),
      );

      assert.ok(found.some((violation) => violation.message.includes(size)));
    });
  }

  it('rejects a manifest with no maskable icon, so a round platform crops the mark', () => {
    const found = rules.searchMetadataViolations(
      complete({ manifest: withoutIcon((icon) => icon.purpose === 'maskable') }),
    );

    assert.ok(found.some((violation) => /maskable/.test(violation.message)));
  });

  it('rejects an icon no file answers, which installs without one', () => {
    const found = rules.searchMetadataViolations(
      complete({
        manifest: withIcons([{ src: 'assets/icons/never-rendered.png', sizes: '96x96' }]),
      }),
    );

    assert.ok(found.some((violation) => /never-rendered\.png/.test(violation.message)));
  });

  it('rejects a card no file answers, which unfurls as a broken image', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace('link-card.png', 'no-such-card.png') }),
    );

    assert.ok(found.some((violation) => /no-such-card\.png/.test(violation.message)));
  });

  it('rejects a hull whose illustration nobody rendered', () => {
    // The card of a published address, which no file in the repository names:
    // a package pin move that adds a hull adds one of these and nothing else
    // would notice.
    const found = rules.searchMetadataViolations(withHull({ assets: ASSETS }));

    assert.ok(found.some((violation) => /Anaconda\/illustration\.png/.test(violation.message)));
  });

  it('rejects a relative card, which a chat client fetches from its own machine', () => {
    const found = rules.searchMetadataViolations(
      complete({
        index: INDEX.replace(
          'content="https://sb.edct.dev/assets/link-card.png" />\n<meta property="og:image:alt"',
          'content="assets/link-card.png" />\n<meta property="og:image:alt"',
        ),
      }),
    );

    assert.ok(found.some((violation) => /must be absolute/.test(violation.message)));
  });

  it('rejects a document that asks not to be indexed, which belongs to a preview', () => {
    const found = rules.searchMetadataViolations(
      complete({ index: INDEX.replace('index,follow,max-image-preview:large', 'noindex') }),
    );

    assert.ok(found.some((violation) => /not to be indexed/.test(violation.message)));
  });

  it('rejects a robots tag the preview step cannot rewrite', () => {
    // Reformatting the tag satisfies every other rule here and silently turns
    // the preview's rewrite into a no-op.
    const found = rules.searchMetadataViolations(
      complete({
        index: INDEX.replace(
          '<meta name="robots" content="index,follow,max-image-preview:large" />',
          "<meta\n  name='robots'\n  content='index,follow,max-image-preview:large'\n/>",
        ),
      }),
    );

    assert.ok(found.some((violation) => /is not one line of/.test(violation.message)));
  });

  it('rejects a preview step whose expression is not the one this tag needs', () => {
    // The same no-op from the other side: the tag is fine and the workflow
    // matches something else.
    const found = rules.searchMetadataViolations(
      complete({ preview: PREVIEW.replace('content="[^"]*"', 'content="[^\']*"') }),
    );

    assert.ok(found.some((violation) => /No step rewrites the robots tag/.test(violation.message)));
  });

  it('rejects a preview step that rewrites the tag to something other than noindex', () => {
    const found = rules.searchMetadataViolations(
      complete({ preview: PREVIEW.replace('content="noindex"', 'content="index"') }),
    );

    assert.ok(found.some((violation) => /does not say noindex/.test(violation.message)));
  });

  it('rejects a published address the route table declares no route for', () => {
    const found = rules.searchMetadataViolations(
      withHull({ routes: ['', 'ships', 'build', '**'] }),
    );

    assert.ok(found.some((violation) => /:hull/.test(violation.message)));
  });

  it('rejects a published address naming a message this build does not carry', () => {
    const found = rules.searchMetadataViolations(
      complete({ messages: MESSAGE_KEYS.filter((key) => key !== 'catalogue.description') }),
    );

    assert.ok(found.some((violation) => /catalogue\.description/.test(violation.message)));
  });

  it('rejects an address whose keys are not the ones its own route declares', () => {
    // Two routes with their keys exchanged declare every key somewhere, so a
    // rule comparing the two key *sets* passes while the published document
    // names one screen and the application names another a moment later.
    const swapped = ROUTE_TABLE.map((route) =>
      route.path === 'build'
        ? { ...route, titleKey: 'library.title', descriptionKey: 'library.description' }
        : route,
    );
    const found = rules.searchMetadataViolations(complete({ routeTable: swapped }));

    assert.ok(
      found.some((violation) => /"\/build" publishes "workspace\.title"/.test(violation.message)),
    );
    assert.ok(
      found.some((violation) =>
        /"\/build" publishes "workspace\.description"/.test(violation.message),
      ),
    );
  });

  it('rejects a route that declares no description for an address that publishes one', () => {
    const found = rules.searchMetadataViolations(
      complete({
        routeTable: ROUTE_TABLE.map((route) =>
          route.path === 'ships' ? { path: 'ships', titleKey: 'catalogue.title' } : route,
        ),
      }),
    );

    assert.ok(found.some((violation) => /declares "none"/.test(violation.message)));
  });

  it('skips the message-key rules when the catalogue could not be read', () => {
    // The guard the fixtures need. That a real failure to read it is reported
    // rather than passed through this guard is `searchMetadataSources`' job,
    // and is asserted below.
    const found = rules.searchMetadataViolations(complete({ messages: undefined }));

    assert.deepEqual(found, []);
  });

  it('rejects a workflow with no step to leave a preview out of an index', () => {
    const found = rules.searchMetadataViolations(complete({ preview: 'jobs:\n  build:\n' }));

    assert.ok(found.some((violation) => /No step rewrites the robots tag/.test(violation.message)));
  });

  /**
   * What the rule is handed, rather than what it does with it.
   *
   * Five rules above are guarded by "if this input arrived", which the fixtures
   * need. What must not happen is a real failure arriving as the same absence:
   * five gates would retire at once and say nothing.
   */
  const ORIGIN_SOURCE = "export const SITE_ORIGIN = 'https://sb.edct.dev';";

  it('hands over the addresses and the keys when both can be read', () => {
    const sources = rules.searchMetadataSources(ORIGIN_SOURCE, '{ "app.name": "Ship Builder" }');

    assert.deepEqual(sources.violations, []);
    assert.ok(sources.published.length > 40);
    assert.deepEqual(sources.messages, ['app.name']);
  });

  it('reports an origin it cannot read against the file that declares it', () => {
    const sources = rules.searchMetadataSources('export const NOTHING = 1;', '{}');

    assert.equal(sources.published, undefined);
    assert.equal(sources.violations[0].file, SEARCH_METADATA_FILES.origin);
    assert.match(sources.violations[0].message, /could not be read/);
  });

  it('reports a catalogue that does not parse rather than checking no key at all', () => {
    const sources = rules.searchMetadataSources(ORIGIN_SOURCE, '{ not json');

    assert.equal(sources.messages, undefined);
    assert.ok(
      sources.violations.some((violation) =>
        /Bundled English does not parse/.test(violation.message),
      ),
    );
  });

  /** The route table, read as the pairs the rule compares rather than as keys. */
  it('reads a route’s title and description as that route’s, not as the table’s', () => {
    const source = `
      { path: '', redirectTo: 'ships' },
      {
        path: 'ships',
        title: 'catalogue.title',
        data: { description: 'catalogue.description' },
        children: [
          { path: ':hull', title: 'hullDetail.title', data: { description: 'hullDetail.description' } },
        ],
      },
      { path: '**', redirectTo: 'ships' },
    `;

    assert.deepEqual(rules.routeTableTriples(source), [
      { path: '', titleKey: undefined, descriptionKey: undefined },
      { path: 'ships', titleKey: 'catalogue.title', descriptionKey: 'catalogue.description' },
      { path: ':hull', titleKey: 'hullDetail.title', descriptionKey: 'hullDetail.description' },
      { path: '**', titleKey: undefined, descriptionKey: undefined },
    ]);
  });
});
