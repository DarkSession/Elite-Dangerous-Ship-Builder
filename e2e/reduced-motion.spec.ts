import { expect, test } from '@playwright/test';
import { expectLandmarks, expectNoDocumentOverflow } from './accessibility/assertions';

/**
 * Reduced-motion equivalence (US2).
 *
 * The requirement is not "less animation" — it is that nothing was ever carried
 * by the animation in the first place. With motion removed, every state and
 * every piece of feedback must still be present, still readable and still
 * exposed programmatically (FR-013).
 *
 * Two passes over one page: what the preference removed, and what it left.
 */
test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    // Emulated per page rather than declared per project: reduced motion is a
    // variant of the ten layout projects, not two more of them.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('reports the preference and removes the motion it asks about', async ({ page }) => {
    const reduced = await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    expect(reduced).toBe(true);

    const moving = await page.locator('body *').evaluateAll((nodes) =>
      nodes
        .filter((node) => {
          const style = getComputedStyle(node as HTMLElement);
          const duration = (value: string): number =>
            Math.max(
              ...value
                .split(',')
                .map((part) => parseFloat(part) * (part.includes('ms') ? 1 : 1000)),
              0,
            );
          return duration(style.transitionDuration) > 1 || duration(style.animationDuration) > 1;
        })
        .map((node) => node.tagName.toLowerCase()),
    );

    expect(moving, 'nonessential motion survives the reduced-motion preference').toEqual([]);
  });

  test('keeps every landmark, action and reading without motion', async ({ page }) => {
    await expectLandmarks(page);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const controls = page.getByRole('button');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      await expect(control).toBeVisible();
      expect((await control.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
    }

    // The status region is ordinary content, so removing transitions cannot
    // remove it — it was never revealed by an animation.
    await expect(page.getByRole('status')).toHaveCount(1);
    await expectNoDocumentOverflow(page);
  });
});
