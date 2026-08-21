import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';

/**
 * The tags scanned on every rendered state.
 *
 * WCAG A and AA through 2.2. Nothing is disabled and no tag or page region is
 * suppressed. If a rule ever needs excluding, the verification contract sets
 * the bar: a versioned rule-to-criterion record from the installed axe
 * metadata, an automated assertion that every mapped criterion is inside the
 * seven-item constitutional keyboard exclusion, retained semantic assertions,
 * and no in-scope criterion lost along the way.
 */
export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22a',
  'wcag22aa',
] as const;

/**
 * Scans the current page and fails on any in-scope violation.
 *
 * The complete result is attached to the failure, because "3 violations" is not
 * something anyone can act on — the selectors, the failure summaries and the
 * help URLs are.
 *
 * An automated scan is a floor, not a ceiling: it cannot judge whether a name
 * is meaningful or whether a reading order makes sense. Those live in the named
 * assertions and the manual screen-reader protocols.
 */
export async function expectNoAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
  options: { label?: string } = {},
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze();

  if (results.violations.length > 0) {
    await testInfo.attach(`axe-${options.label ?? 'scan'}.json`, {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
  }

  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(' ')),
  }));

  expect(summary, `axe violations${options.label ? ` in ${options.label}` : ''}`).toEqual([]);
}
