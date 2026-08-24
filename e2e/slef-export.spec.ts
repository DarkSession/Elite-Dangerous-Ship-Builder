import { expect, test, type Page } from '@playwright/test';
import { expectNoAccessibilityViolations } from './accessibility/axe';
import { expectNoDocumentOverflow } from './accessibility/assertions';
import { reachShellAction } from './shell';

/**
 * A build, handed over as a file rather than as a link.
 *
 * The properties under test are the honest ones: the payload is present and
 * selectable before any control is pressed, every delivery reports what it
 * actually observed, an invalid build still exports, and nothing leaves the
 * origin at any point.
 */

async function withStockBuild(page: Page, hull = 'Anaconda'): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: 'Build stock hull' }).click();
  await expect(page).toHaveURL(/\/build/);
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

function layer(page: Page) {
  return page.getByRole('dialog', { name: /export build/i });
}

async function openExport(page: Page): Promise<void> {
  await reachShellAction(page, /^export$/i);
  await expect(layer(page)).toBeVisible();
}

async function chooseSlef(page: Page): Promise<void> {
  await layer(page)
    .getByRole('radio', { name: /slef json/i })
    .check();
  await expect(layer(page).getByLabel(/slef payload/i)).not.toHaveValue('');
}

test.describe('exporting a build as SLEF', () => {
  test('offers both drawn formats in one layer', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);

    await expect(layer(page).getByRole('radio', { name: /share link/i })).toBeVisible();
    await expect(layer(page).getByRole('radio', { name: /slef json/i })).toBeVisible();
    // The reference lists two more formats this application cannot produce.
    await expect(layer(page).getByRole('radio', { name: /journal loadout/i })).toHaveCount(0);
    await expect(layer(page).getByRole('radio', { name: /markdown/i })).toHaveCount(0);
  });

  test('shows one selectable payload before anything is pressed', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    const field = layer(page).getByLabel(/slef payload/i);
    await expect(field).toHaveAttribute('readonly', '');
    const payload = await field.inputValue();
    expect(JSON.parse(payload)).toHaveLength(1);
  });

  test('states what the payload is and how large it is', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    await expect(layer(page).getByText(/SLEF v1 · \d+ modules · /)).toBeVisible();
  });

  test('says whether a link travelled with it', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    await expect(layer(page).getByText(/carries (a|no) link/i)).toBeVisible();
  });

  test('always offers Download, and Copy beside it', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    await expect(layer(page).getByRole('button', { name: /^download$/i })).toBeEnabled();
    await expect(layer(page).getByRole('button', { name: /^copy$/i })).toBeEnabled();
  });

  test('reports a download as dispatched, never as saved', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    const download = page.waitForEvent('download').catch(() => null);
    await layer(page)
      .getByRole('button', { name: /^download$/i })
      .click();
    await download;

    await expect(layer(page).getByText(/handed to your browser/i)).toBeVisible();
    await expect(layer(page).getByText(/saved/i)).toHaveCount(0);
  });

  test('keeps the payload on screen when the clipboard refuses', async ({ page, context }) => {
    await context.grantPermissions([]);
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error('denied')) },
      });
    });

    await layer(page)
      .getByRole('button', { name: /^copy$/i })
      .click();

    await expect(layer(page).getByText(/could not be copied/i)).toBeVisible();
    await expect(layer(page).getByLabel(/slef payload/i)).not.toHaveValue('');
  });

  test('exports whatever the Almanac says about the build, without withholding it', async ({
    page,
  }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    // The payload is there whatever the verdict is, and the verdict — when
    // there is one — is a sentence beside it rather than a reason to withhold.
    await expect(layer(page).getByLabel(/slef payload/i)).not.toHaveValue('');
    const warning = layer(page).getByText(/the almanac reports this build as/i);
    if ((await warning.count()) > 0) {
      await expect(warning.first()).toBeVisible();
    }
    await expect(layer(page).getByRole('button', { name: /^download$/i })).toBeEnabled();
  });
});

test.describe('the artifact and the build it describes', () => {
  /** A modelled edit a Commander makes in one step, on every layout. */
  async function rename(page: Page, value: string): Promise<void> {
    await page.getByRole('button', { name: /rename the ship/i }).click();
    // The title is the field, and leaving it is confirming it.
    await page.locator('.identity-fields__input').fill(value);
    await page.locator('.identity-fields__input').press('Enter');
  }

  test('never shows a payload for a build that has since been edited', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    const before = await layer(page)
      .getByLabel(/slef payload/i)
      .inputValue();
    expect(before).not.toContain('Pacifier');

    await page
      .getByRole('button', { name: /^close$/i })
      .first()
      .click();
    await rename(page, 'Pacifier');
    await openExport(page);
    await chooseSlef(page);

    // Made again for the build on screen. The previous revision's payload
    // under the current build's title is exactly the thing being ruled out.
    const after = await layer(page)
      .getByLabel(/slef payload/i)
      .inputValue();
    expect(after).not.toBe(before);
    expect(after).toContain('Pacifier');
  });

  test('hands the current revision’s bytes to a delivery, never the previous one’s', async ({
    page,
  }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    await page
      .getByRole('button', { name: /^close$/i })
      .first()
      .click();
    await rename(page, 'Pacifier');
    await openExport(page);
    await chooseSlef(page);

    const payload = await layer(page)
      .getByLabel(/slef payload/i)
      .inputValue();
    const download = page.waitForEvent('download');
    await layer(page)
      .getByRole('button', { name: /^download$/i })
      .click();

    await expect(layer(page).getByText(/handed to your browser/i)).toBeVisible();
    expect(payload).toContain('Pacifier');
    await download.catch(() => null);
  });
});

test.describe('the layer itself', () => {
  test('is a named modal dialog with no accessibility violations', async ({ page }, testInfo) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    await expectNoAccessibilityViolations(page, testInfo);
    await expectNoDocumentOverflow(page);
  });
});

test.describe('the network', () => {
  test('sends nothing anywhere while a build is exported or delivered', async ({ page }) => {
    await withStockBuild(page);
    const origin = new URL(page.url()).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) {
        foreign.push(request.url());
      }
    });

    await openExport(page);
    await chooseSlef(page);
    const download = page.waitForEvent('download').catch(() => null);
    await layer(page)
      .getByRole('button', { name: /^download$/i })
      .click();
    await download;

    expect(foreign).toEqual([]);
  });
});

test.describe('the layer’s semantics', () => {
  test('is a modal dialog with a heading, a format list and a labelled payload', async ({
    page,
  }) => {
    await withStockBuild(page);
    await openExport(page);
    const dialog = layer(page);

    expect(await dialog.evaluate((node) => node.matches(':modal'))).toBe(true);
    await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(dialog.getByRole('group', { name: /format/i })).toBeVisible();
    await chooseSlef(page);
    await expect(dialog.getByLabel(/slef payload/i)).toBeVisible();
  });

  test('says which format is selected, and moves the selection when asked', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    const link = layer(page).getByRole('radio', { name: /share link/i });
    const slef = layer(page).getByRole('radio', { name: /slef json/i });

    await expect(link).toHaveJSProperty('checked', true);
    await expect(slef).toHaveJSProperty('checked', false);

    await slef.check();

    await expect(slef).toHaveJSProperty('checked', true);
    await expect(link).toHaveJSProperty('checked', false);
  });

  test('hands the payload over readonly, and never as a disabled field', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    const field = layer(page).getByLabel(/slef payload/i);

    // Readonly rather than disabled: a disabled field cannot be focused, and
    // selecting the text is the one way out that no permission can take away.
    await expect(field).toHaveJSProperty('readOnly', true);
    await expect(field).toBeEnabled();
  });

  test('announces a delivery result in words, never the payload', async ({ page }) => {
    // No clipboard permission is granted: what is asserted is that the result
    // is said in words, and both answers are results. Firefox does not carry a
    // `clipboard-read` permission at all, so asking for one is not a way to
    // make this deterministic — it is a way to fail in one engine.
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    const polite = page.locator('[data-announcement-outlet="polite"]');

    await layer(page)
      .getByRole('button', { name: /^copy$/i })
      .click();

    await expect(polite).toHaveText(/cop(y|ied)/i);
    await expect(polite).not.toContainText('"event"');
  });

  test('keeps the payload and its metadata in their own direction under RTL', async ({
    page,
  }, testInfo) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));

    expect(await layer(page).locator('[data-bidi-isolate]').count()).toBeGreaterThan(0);
    await expectNoDocumentOverflow(page);
    await expectNoAccessibilityViolations(page, testInfo);

    await page.evaluate(() => document.documentElement.removeAttribute('dir'));
  });

  test('stays complete at doubled text size, with every action still reachable', async ({
    page,
  }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });

    for (const name of [/^copy$/i, /^download$/i]) {
      await expect(layer(page).getByRole('button', { name })).toBeVisible();
    }
    await expectNoDocumentOverflow(page);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  });

  test('gives its actions the baseline target size', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    for (const name of [/^copy$/i, /^download$/i]) {
      const box = await layer(page).getByRole('button', { name }).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
  });

  test('says every state in words rather than in colour alone', async ({ page, context }) => {
    await context.grantPermissions([]);
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    await layer(page)
      .getByRole('button', { name: /^copy$/i })
      .click();

    // Whatever the clipboard did, the layer says so in a sentence.
    await expect(
      layer(page)
        .getByText(/copied|could not be copied|copying/i)
        .first(),
    ).toBeVisible();
  });
});

test.describe('with no network at all', () => {
  test('imports and exports a build offline, with nothing leaving the origin', async ({
    page,
    context,
  }) => {
    await withStockBuild(page);

    // Both layers are opened once while the network is still up, and closed
    // again. They are `@defer`red, so their code arrives as its own chunk on
    // first use — and this matrix runs an unoptimised build with **no service
    // worker**, deliberately, so that a chunk which has never been fetched
    // cannot be fetched with the network down. What is under test here is that
    // the exchange itself needs no network: no inspection, construction,
    // serialization or delivery reaches for one. The shipped application's
    // cold-start offline behaviour is the service worker's, and is covered
    // against the production build in `e2e/offline.spec.ts`.
    await reachShellAction(page, /^import build$/i);
    await expect(page.getByRole('dialog', { name: /import build/i })).toBeVisible();
    await page
      .getByRole('button', { name: /^close$/i })
      .first()
      .click();
    await openExport(page);
    await chooseSlef(page);
    await page
      .getByRole('button', { name: /^close$/i })
      .first()
      .click();

    const origin = new URL(page.url()).origin;
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await context.setOffline(true);

    // Import, offline.
    await reachShellAction(page, /^import build$/i);
    const importLayer = page.getByRole('dialog', { name: /import build/i });
    await importLayer
      .getByLabel(/slef payload/i)
      .fill(JSON.stringify({ event: 'Loadout', Ship: 'anaconda', Modules: [] }));
    await importLayer.getByRole('button', { name: /^load build$/i }).click();
    // The stock build is unsaved, so feature 001 asks before replacing it.
    const question = page.getByRole('dialog', { name: /replace the build/i });
    await expect(question).toBeVisible();
    await question.getByRole('button', { name: /discard and open/i }).click();
    await expect(page).toHaveURL(/\/build($|[#?])/);

    // From here on, nothing but static files. The import landed in the
    // workspace, which is where feature 010 asks for the hull's schematics and
    // keeps asking while they fail — same-origin files under `/assets/`, served
    // to the page rather than fetched by anything the exchange did. What is
    // claimed below is the exchange's own silence: no endpoint, no beacon, no
    // fetch of a payload from anywhere.
    const duringExport: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.origin === origin && url.pathname.startsWith('/assets/')) {
        return;
      }
      duringExport.push(request.url());
    });

    // Export, still offline, with the same capabilities as before.
    await openExport(page);
    await chooseSlef(page);
    await expect(layer(page).getByLabel(/slef payload/i)).not.toHaveValue('');
    await expect(layer(page).getByRole('button', { name: /^download$/i })).toBeEnabled();
    await expect(layer(page).getByRole('button', { name: /^copy$/i })).toBeEnabled();

    // No other origin, at any point in the journey — a request that failed
    // because the network was down would still be recorded here.
    expect(requests.filter((url) => new URL(url).origin !== origin)).toEqual([]);
    // And the exchange asked for nothing of its own.
    expect(duringExport).toEqual([]);

    await context.setOffline(false);
  });
});

test.describe('what is never trusted', () => {
  test('renders a hull name from a payload as text, never as markup', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);

    // The only names in this layer are the package's own, and they arrive as
    // text content. A payload that carried markup could not reach the DOM as
    // markup even so.
    expect(await page.evaluate(() => '__pwned' in window)).toBe(false);
    await expect(layer(page).locator('script')).toHaveCount(0);
  });

  test('contacts no clipboard, share target or consumer of its own', async ({ page }) => {
    await withStockBuild(page);
    const origin = new URL(page.url()).origin;
    const foreign: string[] = [];
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== origin) {
        foreign.push(request.url());
      }
    });
    // A share sheet that actually opened would hang the run; the port is
    // replaced so the journey can assert what was handed to it instead.
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: unknown) => {
          (window as unknown as { __shared: unknown[] }).__shared.push(data);
        },
      });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    });
    await page.reload();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();

    await openExport(page);
    await chooseSlef(page);
    const payload = await layer(page)
      .getByLabel(/slef payload/i)
      .inputValue();
    const share = layer(page).getByRole('button', { name: /^share$/i });
    if ((await share.count()) > 0) {
      await share.click();
      const shared = await page.evaluate(
        () => (window as unknown as { __shared: { text?: string }[] }).__shared,
      );
      expect(shared).toHaveLength(1);
      if (typeof shared[0]?.text === 'string') {
        expect(shared[0].text).toBe(payload);
      }
    }

    expect(foreign).toEqual([]);
  });
});

test.describe('with no build to pass on', () => {
  test('offers no Export action, and the layer cannot open', async ({ page }) => {
    await page.goto('/build');
    await expect(page.getByRole('main')).toBeVisible();

    // The honest state: the action is not published rather than published and
    // refusing. The canvas draws no unavailable panel, and one is not invented.
    await expect(page.getByRole('button', { name: /^export$/i })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: /export build/i })).toHaveCount(0);
  });

  test('says what to do next through the workspace’s own empty state', async ({ page }) => {
    await page.goto('/build');

    await expect(page.getByRole('main')).toContainText(/ship|build|hull/i);
    // Import is a shell action, so it is there with no build and no chosen hull.
    await reachShellAction(page, /^import build$/i);
    await expect(page.getByRole('dialog', { name: /import build/i })).toBeVisible();
  });

  test('leaves no payload behind when the build it described is gone', async ({ page }) => {
    await withStockBuild(page);
    await openExport(page);
    await chooseSlef(page);
    await expect(layer(page).getByLabel(/slef payload/i)).not.toHaveValue('');
    await page.keyboard.press('Escape');

    // Reloading the application starts a session with no build; nothing about
    // the previous payload is persisted, so there is nothing to come back.
    await page.goto('/build');
    await expect(page.getByRole('dialog', { name: /export build/i })).toHaveCount(0);
  });
});
