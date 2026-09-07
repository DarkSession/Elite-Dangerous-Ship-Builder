import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import {
  clippedText,
  expectNoDocumentOverflow,
  expectOrderedHeadings,
} from './accessibility/assertions';
import { previewUrl } from './servers';

/**
 * Text expansion and right-to-left rendering (US2).
 *
 * English is one of the shortest ways to say most things, so a layout tuned to
 * it is a layout that has not been tested. The expanded-copy provider renders
 * every application message at roughly twice its English length, and the
 * right-to-left provider mirrors direction, so the two conditions FR-014 names
 * are exercised against the real component library rather than argued about.
 *
 * Neither provider is a shipped locale: they cannot be selected, cannot be
 * persisted and are absent from the production registry. They are applied only
 * by the tooling-only preview application, through its `variant` address.
 *
 * What is asserted is not that the layout looks the same — it will not — but
 * that nothing was lost: the same states in the same reading order, no meaning
 * cut off, and no page-level horizontal scrolling. Each of those is a pass over
 * one rendered catalogue, so the catalogue is rendered once per condition and
 * every pass runs over it.
 */

/** The reading order of the catalogue, as the accessibility tree sees it. */
async function semanticOrder(page: Page): Promise<string[]> {
  return page
    .locator('[data-preview-address]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-preview-address') ?? ''));
}

/** Total length of the text the rendered components themselves display. */
async function renderedTextLength(page: Page): Promise<number> {
  const texts = await page
    .locator('[data-preview-stage]')
    .evaluateAll((nodes) => nodes.map((node) => (node.textContent ?? '').trim()));

  return texts.join('').length;
}

test.describe('text expansion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(previewUrl(undefined, 'expanded-copy'));
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('actually expands the copy rather than claiming to', async ({ page }) => {
    // A pseudo-locale that silently fell back to English would make every other
    // assertion in this file vacuous, so the expansion itself is measured.
    //
    // Measured over the rendered component stages only. The catalogue's own
    // chrome — component ids, state names, expectation lists — is tooling text
    // that is deliberately not localized, and including it would dilute the
    // ratio until the check stopped meaning anything.
    const expanded = await renderedTextLength(page);

    await page.goto(previewUrl());
    const english = await renderedTextLength(page);

    expect(english, 'the catalogue rendered no component text to compare').toBeGreaterThan(0);
    expect(expanded / english, 'copy did not expand').toBeGreaterThan(1.4);
  });

  test('keeps every state in the same reading order', async ({ page }) => {
    const expanded = await semanticOrder(page);

    await page.goto(previewUrl());
    expect(expanded).toEqual(await semanticOrder(page));
  });

  test('loses no structure, no label and no meaning to the longer copy', async ({ page }) => {
    await expectOrderedHeadings(page);
    expect(await clippedText(page), 'expanded copy is truncated with no way to read it').toEqual(
      [],
    );
    await expectNoDocumentOverflow(page);

    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      await expect(control).toBeVisible();
      expect((await control.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  test('passes an accessibility scan with expanded copy', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'expanded-copy' });
  });
});

test.describe('right-to-left', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(previewUrl(undefined, 'rtl'));
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('mirrors the page without losing a reading', async ({ page }) => {
    // Direction is a document-level property: setting it on a container alone
    // leaves the page scrollbar, the caret and the ancestor boxes reading the
    // other way. The content region carries it too, because that is the box the
    // components are laid out in.
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('main')).toHaveAttribute('dir', 'rtl');

    // Physical `left`/`right` styling survives a direction flip unchanged,
    // which is exactly the defect logical properties exist to prevent. If the
    // heading still starts at the same inline edge, the styles are physical.
    const box = await page.getByRole('heading', { level: 1 }).boundingBox();
    const viewport = page.viewportSize();

    expect(box, 'the catalogue heading did not render').not.toBeNull();
    expect(viewport, 'the project declares no viewport').not.toBeNull();

    expect(
      (box?.x ?? 0) + (box?.width ?? 0),
      'content did not move to the inline-end edge',
    ).toBeGreaterThan((viewport?.width ?? 0) / 2);

    // A technical identifier is not a sentence: direction may move the box it
    // sits in, never the order of what is inside it.
    const unisolated = await page
      .locator('[data-bidi-isolate]')
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => getComputedStyle(node as HTMLElement).unicodeBidi !== 'isolate')
          .map((node) => (node.textContent ?? '').trim().slice(0, 40)),
      );

    expect(unisolated, 'a technical identifier can be reordered by direction').toEqual([]);

    expect(await clippedText(page), 'right-to-left rendering truncates content').toEqual([]);
    await expectNoDocumentOverflow(page);
  });

  test('mirrors the layout without reordering the content', async ({ page }) => {
    const rtl = await semanticOrder(page);

    await page.goto(previewUrl());
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    expect(rtl, 'reading order changed with direction').toEqual(await semanticOrder(page));
  });

  test('passes an accessibility scan right-to-left', async ({ page }, testInfo) => {
    await expectNoAccessibilityViolations(page, testInfo, { label: 'rtl' });
  });
});
