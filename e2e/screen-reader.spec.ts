import { expect, test } from '@playwright/test';
import { previewUrl } from './servers';
import { openActionLayer } from './shell';

/**
 * What a screen reader is given (US1).
 *
 * A scan checks that markup is well formed. This checks what the accessibility
 * tree actually contains and in what order — the exact structure a reader walks
 * and speaks. It is what catches a page that passes every axe rule and still
 * presents as "button, button, button", and it pins the reading order so a
 * refactor cannot quietly reshuffle it.
 *
 * It is not speech. A reader's verbosity settings, its pronunciation and
 * whether the result is comprehensible are outside what any snapshot can say,
 * which is what `e2e/manual/screen-reader.protocol.md` is still for.
 */
test.describe('accessibility tree', () => {
  test('presents the shell as one named banner carrying the heading', async ({ page }) => {
    await page.goto('/');

    // Roles and nesting only. The names are catalogue text and are asserted
    // against what is visible elsewhere; pinning them here would make every
    // wording change a snapshot failure without checking anything new.
    //
    // The reference puts the screen's name in the command bar rather than in
    // the content, so the document's one `h1` is inside the banner
    // (canvas 1a/1b/1c, "Command bar").
    await expect(page.locator('body')).toMatchAriaSnapshot(`
      - banner:
        - heading [level=1]
      - main
      - alert
      - status
    `);
  });

  test('offers the screens it navigates to as one landmark, at either width', async ({ page }) => {
    await page.goto('/');

    // Canvas 1c draws them on the bar's trailing edge and canvas 1d puts them
    // in the `⋮` menu, so which composition is drawn depends on the width. The
    // landmark is in the banner either way; at compact it is inside the menu,
    // which is where the reference puts them.
    //
    // Found by what it holds rather than by its name. The banner carries a
    // second navigation landmark canvas 4c draws — the tool bar — and this file
    // deliberately pins no catalogue text, so the one being asked about here is
    // the one offering screens to open.
    const screens = page
      .getByRole('banner')
      .getByRole('navigation')
      .filter({ has: page.getByRole('link') });

    // Asked and answered as one unit. Which composition is drawn is settled by
    // the shell's own stylesheet, which Angular inserts as the component first
    // renders — so for a frame at a folded width the wide row is in the document
    // and the question answers itself wrongly. Retried, the reading that counts
    // is the one that is still true a moment later.
    await expect(async () => {
      if ((await screens.count()) === 0) {
        await openActionLayer(page);
      }
      await expect(screens).toHaveCount(1, { timeout: 2_000 });
      await expect(screens).toBeVisible({ timeout: 2_000 });
      await expect(screens).toHaveAccessibleName(/.+/, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
  });

  test('names the announcement outlets rather than leaving them anonymous', async ({ page }) => {
    await page.goto('/');

    // Two live regions with different urgency. A reader that meets an unnamed
    // one cannot tell the Commander where the speech came from.
    for (const role of ['alert', 'status'] as const) {
      const outlet = page.getByRole(role);
      await expect(outlet).toHaveCount(1);
      expect((await outlet.getAttribute('aria-label'))?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  test('presents a layer as a named dialog that owns its content', async ({ page }) => {
    await page.goto(previewUrl('layer--default'));

    await expect(page.getByRole('dialog')).toMatchAriaSnapshot(`
      - dialog:
        - heading
    `);
    await expect(page.getByRole('dialog')).toHaveAccessibleName(/.+/);
  });

  test('presents a choice group as one named group whose options carry state', async ({ page }) => {
    await page.goto(previewUrl('choice-group--default'));

    // A native fieldset and legend, so the group is named by the text a
    // Commander can see rather than by a duplicate label written for the
    // reader alone.
    const group = page.getByRole('group').first();
    await expect(group).toHaveAccessibleName(/.+/);

    const options = group.getByRole('radio');
    expect(await options.count()).toBeGreaterThan(0);
    // The chosen option is exposed as chosen, not merely styled as chosen.
    expect(await options.and(page.locator(':checked')).count()).toBeLessThanOrEqual(1);
  });

  test('exposes a field error on the field, not as loose text', async ({ page }) => {
    await page.goto(previewUrl('text-field--error'));

    const field = page.getByRole('textbox').first();
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await field.getAttribute('aria-describedby');
    expect(describedBy, 'the error is not associated with the field it describes').toBeTruthy();
    for (const id of (describedBy ?? '').split(/\s+/).filter(Boolean)) {
      await expect(page.locator(`[id="${id}"]`)).toHaveText(/.+/);
    }
  });
});
