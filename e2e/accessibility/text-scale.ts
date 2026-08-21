import type { Page } from '@playwright/test';

/**
 * Applies a root text scale before the application renders.
 *
 * WCAG 2.2 SC 1.4.4 is about the *user's* text size setting, not about zoom.
 * Emulating it by scaling the root font size is what exercises the `rem`-based
 * type scale the way a Commander who has set larger text would experience it —
 * and it catches the fixed-pixel dimension that only breaks at that size.
 *
 * Applied through an init script so it is in place for the very first frame: a
 * scale applied afterwards measures a relayout, not a render.
 */
export async function withRootTextScale(page: Page, percent: number): Promise<void> {
  await page.addInitScript((scale: number) => {
    const apply = (): void => {
      document.documentElement.style.fontSize = `${scale}%`;
    };
    if (document.documentElement) {
      apply();
    }
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  }, percent);
}

/** The 200% text scale the reflow requirement names. */
export const DOUBLED_TEXT = 200;
