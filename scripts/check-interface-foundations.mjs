#!/usr/bin/env node
/**
 * Repository policy checks for the interface foundation.
 *
 * These are the rules that cannot be expressed as a type or a unit test,
 * because they are about what must *not* appear anywhere: a hard-coded English
 * label, a hex colour outside the token sources, a component nobody previews, a
 * requirement nobody verifies.
 *
 * The checks parse rather than grep. Angular's own template parser reads
 * templates, the TypeScript compiler reads component metadata, and the
 * `postcss-scss` parser reads stylesheets — so structural punctuation, token
 * calculations and dynamic bindings are understood as what they are, instead of
 * tripping a regular expression.
 *
 * Exit code 0 means every rule passed. Any violation prints its file, line and
 * the reason, and fails the build (FR-024).
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TmplAstText, TmplAstTextAttribute, parseTemplate } from '@angular/compiler';
import ts from 'typescript';
import scssSyntax from 'postcss-scss';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Source of truth for what the checker inspects. */
export const SCOPE = {
  /** Product source. Application-owned display text lives here and nowhere else. */
  product: 'src',
  /** The only files permitted to contain governed visual literals. */
  tokenSources: [
    'src/styles/tokens/_primitives.scss',
    'src/styles/tokens/_semantic.scss',
    'src/styles/_fonts.scss',
  ],
  ledger: 'e2e/coverage-ledger.ts',
  /** The application-owned message catalogues. English defines the schema. */
  catalogues: 'src/app/i18n/locales',
  /** The application's one service-worker configuration. */
  serviceWorkerConfig: 'ngsw-config.json',
  /** Files that may state the conformance target on the project's behalf. */
  conformanceDocuments: ['README.md', 'AGENTS.md'],
  /**
   * Feature documentation whose conformance statements are also qualified.
   *
   * A specification that claims the target for its own surfaces is a statement
   * about those surfaces, and an unqualified one there is as strong a claim as
   * an unqualified one in the README. The list is per feature rather than all
   * of `specs/` because four earlier features still carry unqualified
   * paragraphs; each joins as its documents are qualified.
   */
  conformanceSpecs: ['specs/004-slef'],
  /** The emitted production output, inspected as shipped. */
  productionOutput: 'dist/elite-dangerous-ship-builder/browser',
  /** Where the build is configured to place the copied hull schematics. */
  extractedSchematics: 'public/assets/ships',
  previewManifest: 'src/app/ui/previews/preview-manifest.ts',
  uiComponents: 'src/app/ui/components',
  specs: 'specs',
  /** Interface suites that may never be skipped, focused or quarantined. */
  testGlobs: ['e2e', 'src/app/ui', 'src/app/i18n', 'src/app/platform'],
};

/**
 * CSS properties whose values carry the design system's decisions.
 *
 * A literal in one of these is a visual decision made outside the token layer,
 * which is exactly what FR-002 prohibits.
 */
const GOVERNED_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'border',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-inline-color',
  'border-block-color',
  'border-width',
  'border-radius',
  'outline',
  'outline-color',
  'outline-width',
  'box-shadow',
  'text-shadow',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'padding',
  'padding-block',
  'padding-inline',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-block',
  'margin-inline',
  'gap',
  'row-gap',
  'column-gap',
  'transition',
  'transition-duration',
  'transition-timing-function',
  'animation',
  'animation-duration',
  'fill',
  'stroke',
]);

/**
 * Identifiers that name structure inside a `transition` or `animation`
 * shorthand: the property being animated, and the standard timing and fill
 * keywords. The duration and easing in the same declaration are still governed,
 * so a literal `200ms` or a hand-tuned cubic-bezier is still caught.
 */
const MOTION_KEYWORDS = new Set([
  'all',
  'opacity',
  'transform',
  'filter',
  'visibility',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'linear',
  'step-start',
  'step-end',
  'infinite',
  'alternate',
  'alternate-reverse',
  'forwards',
  'backwards',
  'both',
  'running',
  'paused',
  'reverse',
]);

/** Values that are structure or neutral, not a visual decision. */
const ALLOWED_LITERAL_VALUES = new Set([
  '0',
  'none',
  'auto',
  'inherit',
  'initial',
  'unset',
  'currentcolor',
  'transparent',
  'normal',
  '100%',
  '1fr',
  'solid',
  'dashed',
  'dotted',
  'hidden',
  'center',
  'baseline',
]);

/**
 * Template attributes whose literal value a Commander can read or hear.
 *
 * `alt` is included: an empty `alt=""` marks a decorative image and is allowed,
 * but any words in one are display text.
 */
const DISPLAY_ATTRIBUTES = new Set([
  'aria-label',
  'aria-placeholder',
  'aria-roledescription',
  'aria-valuetext',
  'title',
  'placeholder',
  'alt',
  'label',
]);

/** Attributes whose literal values are structural, never read to anyone. */
const STRUCTURAL_ATTRIBUTES = new Set([
  'class',
  'id',
  'type',
  'role',
  'for',
  'name',
  'href',
  'src',
  'target',
  'rel',
  'width',
  'height',
  'viewBox',
  'd',
  'fill',
  'stroke',
  'xmlns',
  'aria-labelledby',
  'aria-describedby',
  'aria-hidden',
  'aria-live',
  'aria-atomic',
  'aria-controls',
  'aria-owns',
  'aria-current',
  'aria-expanded',
  'aria-selected',
  'aria-checked',
  'aria-pressed',
  'aria-invalid',
  'aria-busy',
  'aria-disabled',
  'aria-modal',
  'aria-haspopup',
  'aria-level',
  'aria-orientation',
  'aria-required',
  'lang',
  'dir',
  'tabindex',
  'inert',
  'hidden',
  'disabled',
  'autocomplete',
  'inputmode',
  'enterkeyhint',
  'slot',
  'part',
  'scope',
  'colspan',
  'rowspan',
]);

/**
 * Text that is punctuation, symbol or structure rather than language.
 *
 * A separator, a unit bracket or an ellipsis is not a translatable sentence and
 * flagging it would push authors towards catalogue entries that carry no
 * meaning.
 */
function isStructuralText(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return true;
  }
  // No letter in any script: punctuation, digits, symbols, separators.
  return !/\p{L}/u.test(trimmed);
}

const violations = [];

function report(file, line, rule, message) {
  violations.push({ file: relative(ROOT, file), line, rule, message });
}

/** Every file under `dir` with one of the given extensions. */
async function walk(dir, extensions) {
  const absolute = resolve(ROOT, dir);
  if (!existsSync(absolute)) {
    return [];
  }
  const found = [];
  const entries = await readdir(absolute, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(absolute, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      found.push(...(await walk(path, extensions)));
    } else if (extensions.includes(extname(entry.name))) {
      found.push(path);
    }
  }
  return found;
}

function lineOf(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

// ---------------------------------------------------------------------------
// Rule: no application-owned literal display text in templates
// ---------------------------------------------------------------------------

/**
 * Walks a parsed Angular template, reporting literal text nodes and literal
 * values on attributes a Commander can read or hear.
 */
function templateViolations(file, template, offsetLine = 0) {
  const found = [];
  const add = (line, rule, message) =>
    found.push({ file: relative(ROOT, file), line, rule, message });
  let parsed;
  try {
    parsed = parseTemplate(template, file, { preserveWhitespaces: true });
  } catch {
    // A template the parser rejects is a compilation failure the build already
    // reports; there is nothing useful for this checker to add.
    return found;
  }
  if (parsed.errors && parsed.errors.length > 0) {
    return found;
  }

  const lineFor = (node) =>
    offsetLine + (node?.sourceSpan?.start?.line ?? node?.startSourceSpan?.start?.line ?? 0) + 1;

  /**
   * Walks every node the template can hold.
   *
   * Identity is established with `instanceof` against the compiler's own
   * exported classes rather than a constructor name, because the emitted class
   * names are not part of the package's contract and a minified build would
   * silently turn every rule into a no-op.
   */
  const visit = (nodes) => {
    for (const node of nodes ?? []) {
      if (node instanceof TmplAstText) {
        if (!isStructuralText(node.value)) {
          add(
            lineFor(node),
            'literal-display-text',
            `Literal display text "${node.value.trim().slice(0, 60)}" must resolve through the message facade.`,
          );
        }
        continue;
      }

      // Static attributes live beside the element, not among its children.
      for (const attribute of node?.attributes ?? []) {
        if (!(attribute instanceof TmplAstTextAttribute)) {
          continue;
        }
        const name = attribute.name;
        if (name === 'style') {
          add(
            lineFor(attribute),
            'inline-style',
            'An inline style attribute cannot be inspected by the token policy. Move it into the component stylesheet.',
          );
          continue;
        }
        if (
          DISPLAY_ATTRIBUTES.has(name) &&
          !STRUCTURAL_ATTRIBUTES.has(name) &&
          !isStructuralText(attribute.value ?? '')
        ) {
          add(
            lineFor(attribute),
            'literal-display-attribute',
            `Literal "${name}" value "${String(attribute.value).slice(0, 60)}" must resolve through the message facade.`,
          );
        }
      }

      visit(node?.children);
      visit(node?.cases?.flatMap((branch) => branch.children ?? []));
      visit(node?.branches?.flatMap((branch) => branch.children ?? []));
      if (node?.empty) visit(node.empty.children);
      if (node?.placeholder) visit(node.placeholder.children);
      if (node?.loading) visit(node.loading.children);
      if (node?.error) visit(node.error.children);
      visit(node?.templateAttrs);
    }
  };

  visit(parsed.nodes);
  return found;
}

/** IO wrapper: parses one template file and records what it finds. */
function checkTemplate(file, template, offsetLine = 0) {
  violations.push(...templateViolations(file, template, offsetLine));
}

// ---------------------------------------------------------------------------
// Rule: component metadata — inline templates, inline styles
// ---------------------------------------------------------------------------

/** Reads `@Component` metadata and inspects inline templates and styles. */
function componentMetadataViolations(file, source) {
  const found = [];
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);

  const visit = (node) => {
    if (ts.isDecorator(node) && ts.isCallExpression(node.expression)) {
      const callee = node.expression.expression;
      if (ts.isIdentifier(callee) && callee.text === 'Component') {
        const [argument] = node.expression.arguments;
        if (argument && ts.isObjectLiteralExpression(argument)) {
          for (const property of argument.properties) {
            if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
              continue;
            }
            const key = property.name.text;
            const line = sourceFile.getLineAndCharacterOfPosition(property.getStart()).line + 1;

            if (key === 'template' && ts.isStringLiteralLike(property.initializer)) {
              found.push(...templateViolations(file, property.initializer.text, line - 1));
            }
            if (key === 'styles') {
              found.push({
                file: relative(ROOT, file),
                line,
                rule: 'inline-style',
                message:
                  'Inline component styles cannot be inspected by the SCSS token policy. Use styleUrl.',
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

/** IO wrapper for component metadata. */
async function checkComponentMetadata(file) {
  violations.push(...componentMetadataViolations(file, await readFile(file, 'utf8')));
}

// ---------------------------------------------------------------------------
// Rule: governed visual literals only in token sources
// ---------------------------------------------------------------------------

/**
 * Units that are layout syntax rather than a design decision.
 *
 * Percentages, fractions and viewport units describe how a box relates to the
 * space it is in. The governed scales — type, spacing, radius, border, motion —
 * are absolute, and an absolute unit outside the token sources is someone
 * choosing a size by hand.
 */
const LAYOUT_UNITS = /^\d*\.?\d+(%|fr|vh|vw|vmin|vmax|dvh|dvw|svh|lvh)$/;

/** An absolute measurement: a governed decision when it appears outside a token. */
const GOVERNED_UNITS = /\d*\.?\d+(px|rem|em|ex|ch|pt|pc|cm|mm|in|q|s|ms|deg|turn|rad)\b/;

/** Colour syntax. None of it may appear outside the token sources. */
const COLOUR_FUNCTION = /\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\s*\(/;
const HEX_COLOUR = /#[0-9a-f]{3,8}\b/;
const NAMED_COLOURS = new Set([
  'red',
  'white',
  'black',
  'blue',
  'green',
  'grey',
  'gray',
  'yellow',
  'orange',
  'purple',
  'pink',
  'brown',
  'cyan',
  'magenta',
  'silver',
  'gold',
  'navy',
  'teal',
  'olive',
  'maroon',
  'lime',
  'aqua',
  'fuchsia',
  'beige',
  'ivory',
]);

/**
 * True when a value is made only of token references, keywords and structure.
 *
 * The distinction being drawn is between *layout syntax* — which describes how
 * a box relates to its container and is not a design decision — and a *visual
 * literal*, which is a decision that belongs in the token layer. `1fr`,
 * `100%`, `auto` and a calculation over tokens are the former; `#ff8c1a`,
 * `13px` and `rgba(0, 0, 0, 0.4)` are the latter.
 */
function isTokenisedValue(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0 || ALLOWED_LITERAL_VALUES.has(normalized)) {
    return true;
  }
  // Sass variables and interpolation resolve inside the token layer, which the
  // token sources themselves are responsible for keeping honest.
  if (normalized.startsWith('$') || normalized.includes('#{')) {
    return true;
  }

  // Colour syntax is never layout, so it is decided before anything is
  // stripped — a colour function's arguments must not look like arithmetic.
  if (COLOUR_FUNCTION.test(normalized) || HEX_COLOUR.test(normalized)) {
    return false;
  }
  // A quoted string in a governed property is a font name or a content string.
  if (/['"]/.test(normalized)) {
    return false;
  }

  // Collapse token references, including nested fallbacks, to a marker. A
  // fallback that contains a literal survives this and is caught below.
  let collapsed = normalized;
  for (let pass = 0; pass < 10; pass += 1) {
    const next = collapsed.replace(/var\(\s*--[a-z0-9-]+\s*\)/g, ' \u0000 ');
    if (next === collapsed) {
      break;
    }
    collapsed = next;
  }

  if (GOVERNED_UNITS.test(collapsed)) {
    return false;
  }

  const remainder = collapsed
    .replace(/var\(\s*--[a-z0-9-]+\s*,/g, ' ')
    .replace(/\b(calc|min|max|clamp|round|env|fit-content|minmax|repeat)\(/g, ' ')
    .replace(/[(),/]/g, ' ')
    .replace(/[+\-*]/g, ' ')
    .trim();

  if (remainder.length === 0) {
    return true;
  }

  return remainder.split(/\s+/).every((token) => {
    if (token.length === 0 || token === '\u0000') {
      return true;
    }
    if (NAMED_COLOURS.has(token)) {
      return false;
    }
    return (
      ALLOWED_LITERAL_VALUES.has(token) ||
      MOTION_KEYWORDS.has(token) ||
      GOVERNED_PROPERTIES.has(token) ||
      LAYOUT_UNITS.test(token) ||
      // A bare unitless number inside a calculation is arithmetic, not a size.
      /^\d+(\.\d+)?$/.test(token) ||
      token.startsWith('--')
    );
  });
}

function stylesheetViolations(file, source) {
  const found = [];
  let root;
  try {
    // The SCSS parser is called directly. `postcss.parse` *is* a parser and
    // ignores a `parser` or `syntax` option, so routing SCSS through it left
    // the standard CSS parser in place — which throws on any `//` comment and,
    // because the throw was caught below, silently exempted most of the
    // stylesheets this rule exists to check.
    root = scssSyntax.parse(source, { from: file });
  } catch (error) {
    // A stylesheet the SCSS parser itself cannot read is a syntax error the
    // build will report; it is not a licence to skip the rule.
    found.push({
      file: relative(ROOT, file),
      line: 0,
      rule: 'unparseable-stylesheet',
      message: `The stylesheet could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
    });
    return found;
  }

  root.walkDecls((declaration) => {
    const property = declaration.prop.toLowerCase();
    const line = declaration.source?.start?.line ?? 0;

    // Declaring a custom property outside the token sources is itself the
    // violation the property check would otherwise miss: it creates a second
    // place where a visual decision lives.
    if (property.startsWith('--')) {
      found.push({
        file: relative(ROOT, file),
        line,
        rule: 'token-outside-source',
        message: `Custom property "${declaration.prop}" is declared outside the token sources.`,
      });
      return;
    }
    if (!GOVERNED_PROPERTIES.has(property)) {
      return;
    }
    if (!isTokenisedValue(declaration.value)) {
      found.push({
        file: relative(ROOT, file),
        line,
        rule: 'visual-literal',
        message: `Governed property "${declaration.prop}" uses the literal "${declaration.value}" instead of a token.`,
      });
    }
  });

  return found;
}

/** IO wrapper. Token sources are the one place governed literals belong. */
async function checkStylesheet(file) {
  const relativePath = relative(ROOT, file).split('\\').join('/');
  if (SCOPE.tokenSources.includes(relativePath)) {
    return;
  }
  violations.push(...stylesheetViolations(file, await readFile(file, 'utf8')));
}

// ---------------------------------------------------------------------------
// Rule: every exported UI component has a preview declaration
// ---------------------------------------------------------------------------

/** Component class names exported from `src/app/ui/components`. */
async function exportedUiComponents() {
  const files = await walk(SCOPE.uiComponents, ['.ts']);
  const components = [];

  for (const file of files) {
    if (file.endsWith('.spec.ts') || file.endsWith('.spec-helpers.ts')) {
      continue;
    }
    const source = await readFile(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);

    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const isExported = node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        );
        const isComponent = ts
          .getDecorators?.(node)
          ?.some(
            (decorator) =>
              ts.isCallExpression(decorator.expression) &&
              ts.isIdentifier(decorator.expression.expression) &&
              decorator.expression.expression.text === 'Component',
          );
        if (isExported && isComponent) {
          components.push({ name: node.name.text, file });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  return components;
}

function previewCoverageViolations(components, manifestSource) {
  return (
    components
      // A declaration registers the production class itself, so the class name
      // appearing in the manifest is the reliable signal that it is previewed.
      .filter((component) => !new RegExp(`\\b${component.name}\\b`).test(manifestSource))
      .map((component) => ({
        file: component.file,
        line: 1,
        rule: 'missing-preview',
        message: `Exported UI component "${component.name}" has no preview declaration in ${SCOPE.previewManifest}.`,
      }))
  );
}

/** IO wrapper. */
async function checkPreviewCoverage() {
  const components = await exportedUiComponents();
  if (components.length === 0) {
    return;
  }
  const manifestPath = resolve(ROOT, SCOPE.previewManifest);
  const manifest = existsSync(manifestPath) ? await readFile(manifestPath, 'utf8') : '';
  violations.push(
    ...previewCoverageViolations(
      components.map((component) => ({ ...component, file: relative(ROOT, component.file) })),
      manifest,
    ),
  );
}

// ---------------------------------------------------------------------------
// Rule: no skipped, focused or quarantined interface tests
// ---------------------------------------------------------------------------

const FORBIDDEN_TEST_FORMS = [
  [/\b(?:describe|it|test)\.only\b/g, 'a focused test'],
  [/\b(?:describe|it|test)\.skip\b/g, 'a skipped test'],
  [/\b(?:fdescribe|fit|xdescribe|xit)\s*\(/g, 'a focused or skipped test'],
  [/\btest\.fixme\b/g, 'a quarantined test'],
];

function testDisciplineViolations(file, source) {
  const found = [];
  for (const [pattern, label] of FORBIDDEN_TEST_FORMS) {
    for (const match of source.matchAll(pattern)) {
      found.push({
        file,
        line: lineOf(source, match.index ?? 0),
        rule: 'test-discipline',
        message: `${label} ("${match[0]}") cannot reach a green build.`,
      });
    }
  }
  return found;
}

/** IO wrapper. */
async function checkTestDiscipline() {
  const files = [];
  for (const scope of SCOPE.testGlobs) {
    files.push(...(await walk(scope, ['.ts'])));
  }
  for (const file of files) {
    violations.push(
      ...testDisciplineViolations(relative(ROOT, file), await readFile(file, 'utf8')),
    );
  }
}

// ---------------------------------------------------------------------------
// Rule: every declared requirement is registered in the coverage ledger
// ---------------------------------------------------------------------------

/** The feature directories the ledger source declares it covers. */
function coveredFeatures(ledgerSource) {
  const match = ledgerSource.match(/COVERED_FEATURES[^=]*=\s*\[([^\]]*)\]/);
  return new Set([...(match?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

/** Requirement ids a specification *declares* — defined in bold, not merely mentioned. */
function declaredRequirementIds(featureDirectory, specSource) {
  const featureNumber = featureDirectory.split('-')[0];
  return [...specSource.matchAll(/\*\*((?:FR|SC)-\d{3})\*\*/g)].map(
    (match) => `${featureNumber}/${match[1]}`,
  );
}

/**
 * Ids the ledger registers.
 *
 * Only ids inside a `requirements` array count. Scanning the whole file would
 * let an id mentioned in a comment register itself, which is exactly the silent
 * coverage the ledger exists to prevent.
 */
function registeredRequirementIds(ledgerSource) {
  return new Set(
    [...ledgerSource.matchAll(/requirements\s*:\s*\[([^\]]*)\]/g)].flatMap((block) =>
      [...block[1].matchAll(/'(\d{3}\/(?:FR|SC)-\d{3})'/g)].map((match) => match[1]),
    ),
  );
}

/**
 * Compares declared ids against registered ones.
 *
 * `declared` is a list of `{ id, file }`. Ids are feature-qualified, so one
 * feature's coverage can never satisfy another's.
 */
function ledgerCoverageViolations(declared, ledgerSource, ledgerFile) {
  const registered = registeredRequirementIds(ledgerSource);
  const unregistered = [...new Map(declared.map((entry) => [entry.id, entry.file])).entries()]
    .filter(([id]) => !registered.has(id))
    .map(([id, file]) => `${id} (${file})`)
    .sort();

  if (unregistered.length === 0) {
    return [];
  }
  return [
    {
      file: ledgerFile,
      line: 1,
      rule: 'unregistered-requirement',
      message: `These declared ids are not registered in the coverage ledger: ${unregistered.join('; ')}.`,
    },
  ];
}

/** IO wrapper. */
async function checkLedgerCoverage() {
  const ledgerPath = resolve(ROOT, SCOPE.ledger);
  const ledgerFile = relative(ROOT, ledgerPath);
  const ledger = existsSync(ledgerPath) ? await readFile(ledgerPath, 'utf8') : '';

  const covered = coveredFeatures(ledger);
  if (covered.size === 0) {
    report(
      ledgerPath,
      1,
      'unregistered-requirement',
      'The coverage ledger declares no covered features, so no requirement can be verified as registered.',
    );
    return;
  }

  const specFiles = (await walk(SCOPE.specs, ['.md'])).filter((file) => file.endsWith('spec.md'));

  const declared = [];
  for (const file of specFiles) {
    const relativePath = relative(ROOT, file).split('\\').join('/');
    const feature = relativePath.split('/')[1];
    if (!covered.has(feature)) {
      continue;
    }
    const source = await readFile(file, 'utf8');
    for (const id of declaredRequirementIds(feature, source)) {
      declared.push({ id, file: relativePath });
    }
  }

  violations.push(...ledgerCoverageViolations(declared, ledger, ledgerFile));
}

// ---------------------------------------------------------------------------

/** Runs every rule and returns the violations found. */
export async function runChecks({ scope = SCOPE } = {}) {
  violations.length = 0;

  // Component templates only. `index.html` is the host document, not a
  // component template: it is served before Angular runs, its `<title>` is the
  // product name a browser tab shows during bootstrap, and the locale store
  // replaces that title on the first committed snapshot.
  const templates = (await walk(scope.product, ['.html'])).filter(
    (file) => !file.endsWith('index.html'),
  );
  for (const file of templates) {
    checkTemplate(file, await readFile(file, 'utf8'));
  }

  const sources = await walk(scope.product, ['.ts']);
  for (const file of sources) {
    if (file.endsWith('.spec.ts') || file.endsWith('.spec-helpers.ts')) {
      continue;
    }
    await checkComponentMetadata(file);
  }

  for (const file of await walk(scope.product, ['.scss'])) {
    await checkStylesheet(file);
  }

  await checkPreviewCoverage();
  await checkTestDiscipline();
  await checkLedgerCoverage();
  await checkCatalogues();
  await checkServiceWorkerOwnership(sources);
  await checkConformanceClaims(sources);
  await checkLedgerReconciliation();
  await checkProductionOutput();
  await checkCopiedSchematics();

  return [...violations];
}

/** IO wrapper: reads the emitted production output. */
async function checkProductionOutput() {
  const directory = resolve(ROOT, SCOPE.productionOutput);
  if (!existsSync(directory)) {
    violations.push(...productionOutputViolations({}));
    return;
  }

  const contents = {};
  for (const file of await walk(SCOPE.productionOutput, ['.js', '.css', '.html'])) {
    contents[relative(ROOT, file).split('\\').join('/')] = await readFile(file, 'utf8');
  }

  violations.push(...productionOutputViolations(contents));
}

/**
 * IO wrapper: audits the committed mount extracts against the installed package.
 *
 * Reads the installed package's schematics, hashes each one, reads the extract
 * committed beside the rasterised drawing, and walks the repository for a
 * tracked copy of a package SVG.
 *
 * The rendering itself carries no digest and is not compared. The two
 * reproduction scripts are run together after a pin move and read the same SVG,
 * so a stale extract and a stale rendering arrive together and the extract's
 * digest is the signal for both.
 */
async function checkCopiedSchematics() {
  const packageRoot = resolve(ROOT, SCHEMATIC_SOURCE);
  if (!existsSync(packageRoot)) {
    violations.push(...copiedSchematicViolations({ installed: {}, extracted: {}, tracked: [] }));
    return;
  }

  const installed = {};
  for (const file of await walk(SCHEMATIC_SOURCE, ['.svg'])) {
    const key = relative(packageRoot, file).split('\\').join('/');
    if (SCHEMATIC_FILE.test(key)) {
      installed[key] = createHash('sha256')
        .update(await readFile(file))
        .digest('hex');
    }
  }

  const extracted = {};
  for (const key of Object.keys(installed)) {
    const file = resolve(ROOT, SCOPE.extractedSchematics, key.replace(/\.svg$/, '.json'));
    if (!existsSync(file)) {
      continue;
    }
    try {
      extracted[key] = JSON.parse(await readFile(file, 'utf8')).source;
    } catch {
      extracted[key] = null;
    }
  }

  // Everything committed, so a hull the package has *dropped* is caught too.
  // Comparing only installed-to-extract leaves an orphan behind after a rename
  // or a withdrawal: a file still served that no script can reproduce from the
  // pinned package, which is the private geometry catalogue by another route.
  const committed = (await walk(SCOPE.extractedSchematics, ['.json']))
    .map((file) => relative(resolve(ROOT, SCOPE.extractedSchematics), file).split('\\').join('/'))
    .filter((key) => SCHEMATIC_FILE.test(key.replace(/\.json$/, '.svg')));

  // A private copy is a *tracked* package file: the extract and the rasterised
  // drawing are this repository's own output, reproducible from the package,
  // and the SVG itself is what may not be kept.
  const tracked = execFileSync('git', ['ls-files', '-z', '--', 'public', 'src'], {
    cwd: ROOT,
    encoding: 'utf8',
  })
    .split('\u0000')
    .filter((file) => file.endsWith('.svg'));

  violations.push(...copiedSchematicViolations({ installed, extracted, committed, tracked }));
}

/** IO wrapper: reconciles the ledger with the routes, components, previews and projects. */
async function checkLedgerReconciliation() {
  const routesPath = resolve(ROOT, 'src/app/app.routes.ts');
  const routesSource = existsSync(routesPath) ? await readFile(routesPath, 'utf8') : '';
  const routes = [...routesSource.matchAll(/path:\s*'([^']*)'/g)].map((match) => match[1]);

  const componentIds = [
    ...(await readFile(resolve(ROOT, SCOPE.previewManifest), 'utf8')).matchAll(
      /componentId:\s*'([^']+)'/g,
    ),
  ].map((match) => match[1]);

  const previewAddresses = [...new Set(componentIds)].flatMap((id) =>
    ['default', 'empty', 'loading', 'error', 'disabled'].map((state) => `${id}--${state}`),
  );

  const ledgerSource = await readFile(resolve(ROOT, SCOPE.ledger), 'utf8');
  const ledger = [
    ...ledgerSource.matchAll(/surfaceId:\s*'([^']+)',\s*[\s\S]*?journey:\s*'([^']+)'/g),
  ].map((match) => ({ surfaceId: match[1], journey: match[2] }));

  const configSource = await readFile(resolve(ROOT, 'playwright.config.ts'), 'utf8');
  const engines = [...configSource.matchAll(/browserName:\s*engine/g)].length > 0;
  const configured = engines
    ? ['chromium', 'firefox'].flatMap((engine) =>
        [
          'desktop',
          'tablet-portrait',
          'tablet-landscape',
          'mobile-portrait',
          'mobile-landscape',
        ].map((profile) => `${engine}-${profile}`),
      )
    : [];

  const declared =
    [...ledgerSource.matchAll(/`\$\{engine\}-\$\{profile\}`/g)].length > 0 ? configured : [];

  violations.push(
    ...ledgerReconciliationViolations({
      routes,
      componentIds: [...new Set(componentIds)],
      previewAddresses,
      projectNames: declared,
      configuredProjectNames: configured,
      ledger,
    }),
  );
}

/** IO wrapper: reads the product source and the documents that state the target. */
async function checkConformanceClaims(sources) {
  const contents = {};

  for (const file of sources) {
    contents[relative(ROOT, file).split('\\').join('/')] = await readFile(file, 'utf8');
  }
  for (const file of await walk(SCOPE.product, ['.html', '.json'])) {
    contents[relative(ROOT, file).split('\\').join('/')] = await readFile(file, 'utf8');
  }
  for (const document of SCOPE.conformanceDocuments) {
    const path = resolve(ROOT, document);
    if (existsSync(path)) {
      contents[document] = await readFile(path, 'utf8');
    }
  }
  for (const directory of SCOPE.conformanceSpecs) {
    const path = resolve(ROOT, directory);
    if (!existsSync(path)) {
      continue;
    }
    for (const file of await walk(path, ['.md'])) {
      contents[relative(ROOT, file).split('\\').join('/')] = await readFile(file, 'utf8');
    }
  }

  violations.push(...conformanceClaimViolations(contents));
}

/** IO wrapper: reads every shipped catalogue and compares it with English. */
async function checkCatalogues() {
  const directory = resolve(ROOT, SCOPE.catalogues);
  if (!existsSync(directory)) {
    return;
  }

  const catalogues = {};
  for (const entry of await readdir(directory)) {
    if (!entry.endsWith('.json')) {
      continue;
    }
    catalogues[entry.replace(/\.json$/, '')] = JSON.parse(
      await readFile(join(directory, entry), 'utf8'),
    );
  }

  violations.push(...catalogueViolations(catalogues));
}

/** IO wrapper: reads the product source and the worker configuration. */
async function checkServiceWorkerOwnership(sources) {
  const contents = {};
  for (const file of sources) {
    contents[relative(ROOT, file).split('\\').join('/')] = await readFile(file, 'utf8');
  }

  const configPath = resolve(ROOT, SCOPE.serviceWorkerConfig);
  const config = existsSync(configPath) ? JSON.parse(await readFile(configPath, 'utf8')) : null;

  violations.push(...serviceWorkerOwnershipViolations(contents, config));
}

// ---------------------------------------------------------------------------
// Rule: the production output ships no preview and reaches no other origin
// ---------------------------------------------------------------------------

/**
 * Marker strings that only exist because the preview application was bundled.
 *
 * String literals rather than identifiers, because identifiers are minified
 * and would stop matching the moment the build changed its mangling.
 */
const PREVIEW_MARKERS = ['data-preview-address', 'data-preview-isolated', 'data-preview-stage'];

/**
 * Strings that only exist in a shipped bundle by mistake.
 *
 * The first two are formats the canvas once listed in the export layer and this
 * application cannot produce: a bundle that carries their labels is a bundle
 * offering a Commander something that does not work. They are no longer drawn
 * either — feature 004 took them out of `.design` — so this is the guard that
 * keeps them from coming back rather than a fence around something still there.
 *
 * The last two are the repository's own manifest — the export metadata imports
 * two named values out of `package.json`, and a bundler that stopped
 * tree-shaking it would ship the dependency list, the scripts and whatever else
 * it holds (specs/004-slef tasks T089).
 */
const BUNDLE_REMNANTS = [
  'JOURNAL LOADOUT',
  'MARKDOWN TABLE',
  '"devDependencies"',
  'onlyBuiltDependencies',
];

/** Origins that appear as namespace or documentation strings, never as requests. */
const NON_REQUEST_ORIGINS = [/^https?:\/\/www\.w3\.org\//];

/** Ways a bundle can actually reach another origin. */
const CROSS_ORIGIN_REQUEST = [
  /\bfetch\s*\(\s*["'`](https?:\/\/[^"'`]+)/g,
  /\.open\s*\(\s*["'][A-Z]+["']\s*,\s*["'`](https?:\/\/[^"'`]+)/g,
  /<(?:script|link|img|iframe|source)\b[^>]*?\b(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)/gi,
  /@import\s+(?:url\()?["']?(https?:\/\/[^"')]+)/gi,
  /url\(\s*["']?(https?:\/\/[^"')]+)/gi,
];

// ---------------------------------------------------------------------------
// Rule: the hull schematics are extracted from the package, never kept
// ---------------------------------------------------------------------------

/** Where the installed Almanac package keeps its per-hull assets. */
export const SCHEMATIC_SOURCE = 'node_modules/@elite-dangerous-almanac/core/assets/ships';

/** The two files per hull the anatomy capability renders. */
export const SCHEMATIC_FILE = /^[^/]+\/schematic-(?:top|bottom)\.svg$/;

/**
 * Checks that every committed mount extract was made from the installed package.
 *
 * Feature 010's FR-009 says a hull's mounts come from the installed package and that no
 * private copy or geometry catalogue is maintained. The extract under
 * `public/assets/ships` is neither: it is written by
 * `scripts/extract-schematic-mounts.mts` from the installed SVG and carries that
 * file's digest, so "reproducible from the package" is a fact this rule can
 * check rather than a claim in a comment.
 *
 * Three ways it can go wrong, all of them silent without this: a package
 * upgrade that nobody re-extracted leaves every mount on the previous
 * release's coordinates; a hull added by the package has no extract at all and
 * draws no mounts; and a well-meant "fixed" SVG committed under `public/` is
 * exactly the private copy the requirement forbids — it would keep working, and
 * would stop tracking the package at the next release.
 *
 * `installed` is `{ [relative path]: sha256 }` of the package's own files,
 * `extracted` is `{ [the same path]: the digest the committed extract records }`
 * and `tracked` is every `.svg` git has under `public/` and `src/`. An empty
 * input is itself a violation: a rule that passes when there is nothing to
 * inspect is not a gate.
 */
export function copiedSchematicViolations({ installed, extracted, committed, tracked }) {
  const found = [];
  const file = SCOPE.extractedSchematics;
  const fail = (where, message) =>
    found.push({ file: where, line: 0, rule: 'copied-schematics', message });

  const names = Object.keys(installed ?? {});
  if (names.length === 0) {
    fail(
      SCHEMATIC_SOURCE,
      'No installed hull schematics were found to audit. Install dependencies before running this check.',
    );
    return found;
  }

  for (const name of names) {
    const recorded = (extracted ?? {})[name];
    const target = `${file}/${name.replace(/\.svg$/, '.json')}`;
    if (recorded === undefined) {
      fail(
        target,
        `No mount extract for "${name}". Run \`node scripts/extract-schematic-mounts.mts\`.`,
      );
    } else if (recorded !== installed[name]) {
      fail(
        target,
        'The mount extract was made from a different file than the installed package ships. Re-run `node scripts/extract-schematic-mounts.mts`.',
      );
    }
  }

  for (const key of committed ?? []) {
    if (installed[key.replace(/\.json$/, '.svg')] === undefined) {
      fail(
        `${file}/${key}`,
        'This extract is for a hull the pinned package does not ship. Nothing can reproduce it; delete it.',
      );
    }
  }

  for (const path of tracked ?? []) {
    if (SCHEMATIC_FILE.test(path.split('/').slice(-2).join('/'))) {
      fail(
        path,
        'A package hull schematic is tracked in the repository. Only the extract and the rendering are kept.',
      );
    }
  }

  return found;
}

/**
 * Checks the built output rather than the source.
 *
 * What matters is what ships. The preview catalogue is a tooling application
 * and must not be reachable in production — not as a route, not as a chunk, not
 * as dead code someone can still evaluate. And the bundle must reach no other
 * origin at runtime, because the application is client-side only and sends
 * nothing anywhere (constitution I).
 *
 * `contents` is `{ [emitted file]: text }`. An empty input is itself a
 * violation: a rule that silently passes when there is nothing to inspect is
 * not a gate.
 */
export function productionOutputViolations(contents) {
  const found = [];
  const files = Object.keys(contents);

  if (files.length === 0) {
    return [
      {
        file: SCOPE.productionOutput,
        line: 0,
        rule: 'production-output',
        message: 'No production output was found to inspect. Build before running this check.',
      },
    ];
  }

  for (const file of files) {
    if (file.includes('ui-preview')) {
      found.push({
        file,
        line: 0,
        rule: 'production-output',
        message: 'The preview application is emitted into the production output.',
      });
    }
  }

  for (const [file, text] of Object.entries(contents)) {
    for (const marker of PREVIEW_MARKERS) {
      if (text.includes(marker)) {
        found.push({
          file,
          line: 0,
          rule: 'production-output',
          message: `The preview catalogue is bundled: "${marker}" is present in the shipped output.`,
        });
        break;
      }
    }

    for (const marker of BUNDLE_REMNANTS) {
      if (text.includes(marker)) {
        found.push({
          file,
          line: 0,
          rule: 'production-output',
          message: `The shipped output carries "${marker}", which no delivered capability puts there.`,
        });
      }
    }

    // One URL, one violation: `@import url(...)` matches two of the patterns
    // above, and reporting the same address twice makes a short list look like
    // a long one.
    const reported = new Set();
    for (const pattern of CROSS_ORIGIN_REQUEST) {
      pattern.lastIndex = 0;
      let match = pattern.exec(text);
      while (match !== null) {
        const url = match[1];
        if (!NON_REQUEST_ORIGINS.some((allowed) => allowed.test(url)) && !reported.has(url)) {
          reported.add(url);
          found.push({
            file,
            line: 0,
            rule: 'production-output',
            message: `The production output requests another origin: ${url}`,
          });
        }
        match = pattern.exec(text);
      }
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Rule: the ledger reconciles with what actually exists
// ---------------------------------------------------------------------------

/**
 * Compares the coverage ledger with the four things it claims to cover.
 *
 * The ledger is a claim about completeness, and a claim nobody checks decays
 * the moment a capability lands. This is what makes "every" mean something: a
 * new route, a new component, a new preview state or a renamed Playwright
 * project has to appear here, or the build fails.
 *
 * `input` carries `routes`, `componentIds`, `previewAddresses`, `projectNames`,
 * `configuredProjectNames` and `ledger`.
 */
export function ledgerReconciliationViolations(input) {
  const found = [];
  const file = SCOPE.ledger;
  const ledger = input.ledger ?? [];
  const surfaces = ledger.map((entry) => entry.surfaceId);
  const journeys = new Set(ledger.map((entry) => entry.journey));

  const fail = (message) => found.push({ file, line: 0, rule: 'ledger-reconciliation', message });

  for (const route of input.routes ?? []) {
    const address = route === '' ? 'shell' : route;
    if (!surfaces.some((surface) => surface.includes(address))) {
      fail(`Route "${route}" has no coverage entry naming it.`);
    }
  }

  const addresses = input.previewAddresses ?? [];
  for (const componentId of input.componentIds ?? []) {
    if (!addresses.some((address) => address.startsWith(`${componentId}--`))) {
      fail(`Component "${componentId}" is exported but has no preview state to cover.`);
    }
  }

  if (addresses.length > 0 && !journeys.has('preview/sweep')) {
    fail('Preview states exist but no entry claims the preview sweep covers them.');
  }

  const configured = input.configuredProjectNames ?? [];
  const declared = input.projectNames ?? [];

  for (const name of declared) {
    if (!configured.includes(name)) {
      fail(`Project "${name}" is declared in the ledger but not configured in Playwright.`);
    }
  }
  for (const name of configured) {
    if (!declared.includes(name)) {
      fail(`Project "${name}" is configured in Playwright but not declared in the ledger.`);
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Rule: no unqualified WCAG 2.2 AA claim
// ---------------------------------------------------------------------------

/** The seven criteria the constitution excludes from the conformance target. */
export const EXCLUDED_CRITERIA = ['2.1.1', '2.1.2', '2.1.4', '2.4.1', '2.4.3', '2.4.7', '2.4.11'];

/** A claim of WCAG 2.2 AA conformance, however it is phrased. */
const CONFORMANCE_CLAIM = /WCAG\s*2\.2\s*(?:Level\s*)?AA/gi;

/**
 * Rejects a conformance claim that does not name its exclusions.
 *
 * The target is WCAG 2.2 AA *minus seven criteria*, and a claim that omits that
 * qualification is not a shorthand — it is a stronger claim than the project
 * can support, made to whoever reads it. Every statement therefore carries the
 * criteria it excludes, in the same sentence, so it cannot be quoted without
 * them (FR-015).
 *
 * `sources` is `{ [file]: contents }`. A claim qualifies when its own paragraph
 * names all seven criteria.
 */
export function conformanceClaimViolations(sources) {
  const found = [];

  for (const [file, contents] of Object.entries(sources)) {
    const paragraphs = contents.split(/\n\s*\n/);
    let offset = 0;

    for (const paragraph of paragraphs) {
      const line = contents.slice(0, offset).split('\n').length;
      offset += paragraph.length + 2;

      CONFORMANCE_CLAIM.lastIndex = 0;
      if (!CONFORMANCE_CLAIM.test(paragraph)) {
        continue;
      }

      const missing = EXCLUDED_CRITERIA.filter((criterion) => !paragraph.includes(criterion));
      if (missing.length > 0) {
        found.push({
          file,
          line,
          rule: 'unqualified-conformance-claim',
          message:
            'A WCAG 2.2 AA claim does not name the excluded criteria ' +
            `${missing.join(', ')}. State the target as AA except ${EXCLUDED_CRITERIA.join(', ')}.`,
        });
      }
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Rule: every shipped catalogue matches bundled English exactly
// ---------------------------------------------------------------------------

/**
 * Values a shipped locale is reviewed as sharing with English.
 *
 * A German value identical to the English one is usually an untranslated
 * string that slipped through, so identity is a failure by default. These are
 * the ones a reviewer has looked at and kept, each with the reason it is the
 * same word in both languages. Adding a message that happens to match English
 * fails the build until someone records why — which is the point: the gate is
 * about wording having been reviewed, not about strings differing.
 */
export const REVIEWED_IDENTICAL_VALUES = {
  de: {
    'app.name': 'A product name, not a phrase to translate.',
    'app.document-title':
      'A composition pattern; both variables and the separator are language-neutral.',
    'hullDetail.bar.detail':
      'A composition pattern; both variables and the separator are language-neutral.',
    'outfitting.engineering.layer-detail':
      'A composition pattern; both variables and the separator are language-neutral.',
    'drives.fsd.optimal-mass.detail':
      'A composition pattern; both variables and the separator are language-neutral.',
    'app.document-title.default': 'The product name again.',
    'shell.status.label': '"Status" is the ordinary German word.',
    'outfitting.status-rail.mode': '"Status" is the ordinary German word.',
    'status.info': '"Information" is the ordinary German word.',
    'field.optional': '"Optional" is the ordinary German word.',
    'format.credits': 'CR is the in-game abbreviation and is not translated.',
    'hullDetail.unit.speed': 'The SI symbol for metres per second, identical in German.',
    'hullDetail.unit.mass': 'The SI symbol for the tonne, identical in German.',
    'drives.rail.metres-per-second': 'The SI symbol for metres per second, identical in German.',
    'drives.thrusters.optimal-mass':
      'The canvas’s own one-word mark under the mass bar; German writes the same word.',
    'drives.thrusters.maximum-mass':
      'The canvas’s own abbreviation at the end of the mass bar; German abbreviates it the same way.',
    'drives.thrusters.fuel.tank':
      'The canvas’s own one-word qualifier beside the fuel segment; Tank is the ordinary German word.',
    'drives.rail.tonnes': 'The SI symbol for the tonne, identical in German.',
    'hullDetail.unit.shield': 'The SI symbol for the megajoule, identical in German.',
    'catalogue.hardpoint.code.medium':
      'The mount codes are single initials of the German class names; Mittel and medium share one.',
    'catalogue.price.unit':
      'Mcr is the in-game abbreviation for a million credits and is not translated.',
    'catalogue.sort.indicator.ascending': 'A geometric arrow, not language.',
    'catalogue.sort.indicator.descending': 'A geometric arrow, not language.',
    'hullDetail.fact.boost': 'The in-game term, used untranslated in the German community.',
    'hullDetail.slots.group.hardpoint':
      'The in-game term, used untranslated in the German community.',
    'anatomy.mount.name':
      'A composition pattern: every part is a variable, and the separator is language-neutral.',
    'shell.beta':
      'The release stage as a mark rather than a word: the canvas sets it in Latin capitals on every artboard, and it is read the same way in German. Translating it would rename the product on one of the two.',
    'power.heat.does-not-settle':
      'The mathematical symbol for infinity, which is not a word in either language. The reading it stands for is carried in words beside it, under its own key.',
    'offence.capacitor.endurance.sustained':
      'The mathematical symbol for infinity, which is not a word in either language. The reading it stands for is carried in words beside it, under its own key.',
    'outfitting.search.shortcut.apple':
      'The Apple command key and a letter; the glyph is the key itself, not a word.',
    'help.licence.index.application':
      'A composition pattern: the label is the product word “App”, which German uses too, and the rest is the link variable.',
    'help.action.symbol':
      'A question mark, drawn as the reference draws it. The glyph is the mark itself and not a word; the action’s translated name is what a reader is told.',
    'outfitting.acquisition.short.mercenary':
      'Merc-Coin is the in-game currency name and is not translated.',
    'slef.import.refusal.module':
      'A composition pattern: every part is a variable, and the separator is language-neutral.',
    'slef.announce.delivery':
      'A composition pattern: both parts are variables, and the colon is language-neutral.',
    'slef.diagnostic.code': '"Code" is the ordinary German word.',
    'slef.export.mode.label': '"Format" is the ordinary German word.',
    'slef.export.mode.slef': 'SLEF JSON is the interchange format\u2019s own name, not a phrase.',
    'outfitting.engineering.materials.merc-coin':
      'Merc Coins is the in-game currency name and is not translated.',
    'outfitting.slot.engineering':
      'A composition of a package-supplied recipe name and the grade; G is the in-game grade marker and is not a word.',
    'power.hardpoints.label': 'The in-game term, used untranslated in the German community.',
    'power.distributor.column.bank': '"Bank" is the ordinary German word.',
    'power.distributor.column.pips':
      'Pips is the in-game term for a capacitor allocation step and is not translated.',
    'power.modules.count':
      'A multiplication sign and a variable, counting the mounts one line stands for; not a word in either language.',
    'power.heat.sinks.breakdown':
      'Two variables and a multiplication sign; not a word in either language.',
    'power.distributor.bank.systems':
      'SYS is the in-game abbreviation on the pip display and is not translated.',
    'power.distributor.bank.engines':
      'ENG is the in-game abbreviation on the pip display and is not translated.',
    'power.distributor.bank.weapons':
      'WEP is the in-game abbreviation on the pip display and is not translated.',
    'power.unit.megawatts': 'The SI symbol for the megawatt, identical in German.',
    'power.format.megawatts': 'A value and the SI symbol for the megawatt, identical in German.',
    'power.format.megajoules-per-second':
      'A value and the SI symbol for megajoules per second, identical in German.',
    'format.seconds': 'A value and the SI symbol for the second, identical in German.',
    'format.minutes':
      'Two variables and a colon, which is how both languages write minutes and seconds.',
    'defence.damage.column.megajoules': 'The SI symbol for the megajoule, identical in German.',
    'defence.damage.column.hull-points':
      'HP is the in-game abbreviation for hull points and is used untranslated in the German community.',
    'defence.damage.unbounded':
      'The mathematical symbol for infinity; not a word in either language.',
    'defence.recovery.never':
      'The mathematical symbol for infinity; not a word in either language.',
    'defence.source.count':
      'A multiplication sign and a variable, counting the mounts one row stands for; not a word in either language.',
    'defence.source.added':
      'A plus sign and a variable, marking a figure that adds to the one above it; not a word in either language.',
    'defence.banks.detail':
      'A cell count, a multiplication sign and a reinforcement figure; all variables and a symbol, not a word in either language.',
    'defence.module.code':
      'A size and a grade letter, both of them variables; neither is a word in either language.',
    'defence.module.separator':
      'A middot between the parts of a module\u2019s name; not a word in either language.',
    'defence.format.megajoules':
      'A value and the SI symbol for the megajoule, identical in German.',
    'defence.format.megajoules-per-second':
      'A value and the SI symbol for megajoules per second, identical in German.',
    'defence.format.hull-points':
      'A value and the in-game abbreviation for hull points, used untranslated in the German community.',
    'defence.rail.megajoules': 'The SI symbol for the megajoule, identical in German.',
    'offence.format.seconds': 'A value and the SI symbol for the second, identical in German.',
    'offence.format.megawatts': 'A value and the SI symbol for the megawatt, identical in German.',
    'offence.format.megajoules-per-second':
      'A value and the SI symbol for megajoules per second, identical in German.',
    'offence.format.milliradians':
      'A value and the SI symbol for the milliradian, identical in German.',
    'offence.damage.legend':
      'A composition pattern: every part is a variable, and the separator is language-neutral.',
    'drives.format.tonnes': 'A value and the SI symbol for the tonne, identical in German.',
    'drives.format.metres-per-second':
      'A value and the SI symbol for metres per second, identical in German.',
    'drives.format.degrees-per-second':
      'A value and the SI symbol for degrees per second, identical in German.',
    'drives.source.engineered':
      'A composition of a package-supplied rating and recipe name and the grade; G is the in-game grade marker and is not a word.',
    'drives.thrusters.hull.detail':
      'Two package-supplied identities joined by a separator; the pattern holds no word in either language.',
    'drives.thrusters.boost':
      'The in-game term, used untranslated in the German community — the same decision already recorded for hullDetail.fact.boost, which names this very reading. "Schub" is thrust, and this figure is a speed.',
    'drives.fsd.sco':
      'The in-game abbreviation for Supercruise Overcharge, printed on the drive itself and not translated; the words behind it are carried under drives.fsd.sco.description.',
    'help.section.faq':
      'FAQ is the same borrowed abbreviation in German, and is what a German reader scans a help modal for.',
  },
};

/**
 * The interpolation variables a message pattern declares, sorted.
 *
 * A hand-kept copy of `PLACEHOLDER` in `src/app/i18n/locale-registry.ts`, which
 * this file cannot import because it is `.mjs` and that is TypeScript. The two
 * must be spelled the same: this gate decides whether a catalogue ships, and
 * the runtime decides what it renders, so a pattern one of them sees and the
 * other does not is a build that passes and a locale that then refuses to load.
 */
function interpolationVariablesOf(pattern) {
  const found = new Set();
  for (const match of pattern.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)) {
    found.add(match[1]);
  }
  return [...found].sort();
}

/**
 * Compares every shipped catalogue with bundled English.
 *
 * `catalogues` is `{ [locale]: parsed catalogue }` and must contain `en`. The
 * rule is deliberately symmetric and total: same keys, no blank values, same
 * interpolation variables, and reviewed wording. A capability that adds a
 * message to English and forgets German fails here, in the same change, rather
 * than shipping a half-translated interface (FR-019).
 */
export function catalogueViolations(catalogues, reviewed = REVIEWED_IDENTICAL_VALUES) {
  const found = [];
  const english = catalogues['en'];
  const file = 'src/app/i18n/locales/en.json';

  if (!english) {
    return [
      {
        file,
        line: 0,
        rule: 'catalogue-missing',
        message:
          'The bundled English catalogue is missing; it defines the schema for every locale.',
      },
    ];
  }

  for (const [key, value] of Object.entries(english)) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      found.push({
        file,
        line: 0,
        rule: 'catalogue-blank',
        message: `English message "${key}" is blank or is not a string.`,
      });
    }
  }

  for (const [locale, catalogue] of Object.entries(catalogues)) {
    if (locale === 'en') {
      continue;
    }
    const localeFile = `src/app/i18n/locales/${locale}.json`;
    const allowed = reviewed[locale] ?? {};

    for (const key of Object.keys(english)) {
      if (!(key in catalogue)) {
        found.push({
          file: localeFile,
          line: 0,
          rule: 'catalogue-missing-key',
          message: `"${key}" is in English but not in ${locale}.`,
        });
      }
    }

    for (const [key, value] of Object.entries(catalogue)) {
      if (!(key in english)) {
        found.push({
          file: localeFile,
          line: 0,
          rule: 'catalogue-unknown-key',
          message: `"${key}" is in ${locale} but not in English.`,
        });
        continue;
      }

      if (typeof value !== 'string' || value.trim().length === 0) {
        found.push({
          file: localeFile,
          line: 0,
          rule: 'catalogue-blank',
          message: `"${key}" is blank in ${locale}.`,
        });
        continue;
      }

      const expected = interpolationVariablesOf(english[key]).join(', ');
      const actual = interpolationVariablesOf(value).join(', ');
      if (expected !== actual) {
        found.push({
          file: localeFile,
          line: 0,
          rule: 'catalogue-interpolation',
          message: `"${key}" declares [${actual}] in ${locale} but [${expected}] in English.`,
        });
        continue;
      }

      if (value === english[key] && !(key in allowed)) {
        found.push({
          file: localeFile,
          line: 0,
          rule: 'catalogue-unreviewed-wording',
          message:
            `"${key}" is word-for-word English in ${locale}. If that is correct, record why in ` +
            'REVIEWED_IDENTICAL_VALUES; otherwise translate it.',
        });
      }
    }

    for (const key of Object.keys(allowed)) {
      if (!(key in english)) {
        found.push({
          file: 'scripts/check-interface-foundations.mjs',
          line: 0,
          rule: 'catalogue-stale-review',
          message: `"${key}" is recorded as reviewed for ${locale} but no longer exists.`,
        });
      }
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Rule: one service worker, one cache owner
// ---------------------------------------------------------------------------

/** Any second way of registering a worker or owning a cache. */
const FOREIGN_WORKER = [
  {
    pattern: /navigator\s*\.\s*serviceWorker\s*\.\s*register\s*\(/,
    what: 'a direct service-worker registration',
  },
  { pattern: /new\s+(?:Shared)?Worker\s*\(/, what: 'a worker of its own' },
  { pattern: /\bcaches\s*\.\s*open\s*\(/, what: 'a cache of its own' },
];

/**
 * Checks that the application has exactly one service worker and one owner.
 *
 * `sources` is `{ [file]: contents }` over the product source. A downstream
 * capability may extend the static asset groups in `ngsw-config.json` — that is
 * how a feature ships its own assets offline — but it may not register a second
 * worker, add a second worker dependency, or open its own cache. Two owners of
 * the same origin's cache is how a build ends up serving one feature's assets
 * from another feature's version.
 */
export function serviceWorkerOwnershipViolations(sources, config = null) {
  const found = [];
  const registrations = [];

  for (const [file, contents] of Object.entries(sources)) {
    if (contents.includes('provideServiceWorker(')) {
      registrations.push(file);
    }
    for (const { pattern, what } of FOREIGN_WORKER) {
      if (pattern.test(contents)) {
        found.push({
          file,
          line: 0,
          rule: 'service-worker-ownership',
          message: `${file} declares ${what}. The application has exactly one service worker, registered in src/app/app.config.ts.`,
        });
      }
    }
  }

  if (registrations.length === 0) {
    found.push({
      file: 'src/app/app.config.ts',
      line: 0,
      rule: 'service-worker-ownership',
      message: 'No service worker is registered, so complete English is not readable offline.',
    });
  } else if (registrations.length > 1) {
    found.push({
      file: registrations[1],
      line: 0,
      rule: 'service-worker-ownership',
      message: `More than one service-worker registration exists: ${registrations.join(', ')}.`,
    });
  }

  if (config !== null) {
    const groups = Array.isArray(config.assetGroups) ? config.assetGroups : [];
    const names = groups.map((group) => group.name);

    if (new Set(names).size !== names.length) {
      found.push({
        file: 'ngsw-config.json',
        line: 0,
        rule: 'service-worker-ownership',
        message: 'Two asset groups share a name, so one silently replaces the other.',
      });
    }

    const files = groups.flatMap((group) => group.resources?.files ?? []);
    for (const resource of files) {
      if (!resource.startsWith('/')) {
        found.push({
          file: 'ngsw-config.json',
          line: 0,
          rule: 'service-worker-ownership',
          message: `Asset "${resource}" is not a same-origin absolute path.`,
        });
      }
    }

    if (!files.some((resource) => resource === '/i18n/en.json')) {
      found.push({
        file: 'ngsw-config.json',
        line: 0,
        rule: 'service-worker-ownership',
        message:
          'Bundled English is not prefetched, so the fallback language is not available offline.',
      });
    }

    if (Array.isArray(config.dataGroups) && config.dataGroups.length > 0) {
      found.push({
        file: 'ngsw-config.json',
        line: 0,
        rule: 'service-worker-ownership',
        message:
          'A data group caches responses rather than static assets; this application caches neither builds nor Commander data.',
      });
    }
  }

  return found;
}

/**
 * The rules as pure functions, so every one of them can be driven by positive
 * and negative fixtures without touching the repository (T029).
 */
export const rules = {
  templateViolations,
  catalogueViolations,
  serviceWorkerOwnershipViolations,
  conformanceClaimViolations,
  ledgerReconciliationViolations,
  productionOutputViolations,
  copiedSchematicViolations,
  componentMetadataViolations,
  stylesheetViolations,
  previewCoverageViolations,
  testDisciplineViolations,
  ledgerCoverageViolations,
  declaredRequirementIds,
  registeredRequirementIds,
  coveredFeatures,
  isTokenisedValue,
  isStructuralText,
};

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const found = await runChecks();
  if (found.length === 0) {
    process.stdout.write('interface foundations policy: no violations\n');
    process.exit(0);
  }

  process.stderr.write(`interface foundations policy: ${found.length} violation(s)\n\n`);
  for (const violation of found) {
    process.stderr.write(
      `  ${violation.file}:${violation.line}  [${violation.rule}]\n    ${violation.message}\n`,
    );
  }
  process.stderr.write('\n');
  process.exit(1);
}
