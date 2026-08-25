import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, test, type Page } from '@playwright/test';
import applicationManifest from '../package.json';
import englishMessages from '../src/app/i18n/locales/en.json';
import { helpRouteCoverage, type HelpRouteRow } from './coverage-ledger';
import { openChooser, openEditor } from './outfitting-surfaces';
import { openActionLayer, reachShellAction, reachShellLink } from './shell';

/**
 * Help, reached from everywhere.
 *
 * FR-011's claim is exhaustive rather than representative: every capability,
 * package-backed surface and obscuring layer this application ships has a row
 * in `helpRouteCoverage`, and this suite opens the modal from every one of
 * them. A row that cannot be driven here is a row whose claim is untested,
 * which is the drift the ledger exists to prevent.
 *
 * The other half of FR-002 is checked at the same time and is the easier one
 * to forget: the row's own surface offers no help control and embeds no legal
 * body of its own. One shared destination only works if there is not quietly a
 * second one.
 */

const HULL = 'Anaconda';

/** The frame's Help action, in the language the suite reads. */
const HELP_ACTION = new RegExp(`^${englishMessages['help.action.label']}$`, 'i');

/** The modal's own accessible name. */
const HELP_TITLE = new RegExp(
  englishMessages['help.title'].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  'i',
);

/**
 * Every layer currently covering the frame.
 *
 * `dialog[open]` rather than the dialog role: the shell keeps its layers
 * mounted and closed, and a closed one is still a `dialog` element. Counting
 * those would make "one dialog is open" true of a page with none.
 */
function layers(page: Page) {
  return page.locator('dialog[open]');
}

function helpModal(page: Page) {
  return page.getByRole('dialog', { name: HELP_TITLE });
}

async function openHelp(page: Page): Promise<void> {
  await reachShellAction(page, HELP_ACTION);
  await expect(helpModal(page)).toBeVisible();
}

async function closeHelp(page: Page): Promise<void> {
  await helpModal(page)
    .getByRole('button', { name: new RegExp(`^${englishMessages['action.close']}$`, 'i') })
    .click();
  await expect(helpModal(page)).toHaveCount(0);
}

/**
 * Waits for the application to stop rewriting its own address.
 *
 * The workspace publishes its build into the fragment after the route has
 * landed, and the catalogue writes the selected hull into the path. Both are
 * ordinary behaviour and both are asynchronous, so a journey that reads the
 * address the instant a screen appears is reading a value that is still
 * moving. What FR-001 claims is that *opening help* changes nothing — which is
 * only checkable once the screen beneath has finished settling.
 */
async function settled(page: Page): Promise<string> {
  // Away from the manifest first. Resting on one of its rows opens that hull
  // in the inspector and rewrites the address — feature 001's own behaviour,
  // and nothing to do with help, but it would move the value under this
  // journey's feet.
  await page.mouse.move(0, 0);

  // A workspace publishes the open build into the fragment a moment after the
  // screen itself arrives, so an address read as soon as a build appears is one
  // that was always going to change for a reason unrelated to help. Waited for
  // by its shape rather than by a timeout, because under a loaded machine the
  // wait is however long it is.
  if ((await page.locator('[data-slot-key]').count()) > 0) {
    await expect(page).toHaveURL(/#b\./);
  }

  let previous = page.url();
  let stable = 0;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await page.waitForTimeout(100);
    const current = page.url();
    stable = current === previous ? stable + 1 : 0;
    if (stable >= 5) {
      return current;
    }
    previous = current;
  }
  return previous;
}

/** A stock build, open in the workspace. */
async function withStockBuild(page: Page, hull = HULL): Promise<void> {
  await page.goto(`/ships/${hull}`);
  await page.getByRole('button', { name: englishMessages['hullDetail.create'] }).click();
  await expect(page.locator('[data-slot-key]').first()).toBeVisible();
}

/** Presses one segment of the anatomy mode strip. */
async function openMode(page: Page, label: string): Promise<void> {
  await page.locator('edsb-hull-anatomy .anatomy__modes button').filter({ hasText: label }).click();
}

/** Selects a mount, however this width offers it. */
async function selectSlot(page: Page, slotKey: string): Promise<void> {
  await page.locator(`[data-slot-key="${slotKey}"] button`).first().click();
}

/** Dismisses whatever layer is covering the frame, by its own visible control. */
const WAY_OUT = new RegExp(
  `^(${englishMessages['action.close']}|${englishMessages['action.cancel']}` +
    `|${englishMessages['workspace.replace.cancel']}` +
    `|${englishMessages['library.delete.cancel']})$`,
  'i',
);

/**
 * Dismisses every layer covering the frame, by each one's own visible control.
 *
 * A layer may cover a layer — feature 001's replacement question stands over
 * the import layer that provoked it — so this works down the stack until the
 * frame is back. It presses named controls only: falling back to whatever
 * button happens to be last would let a layer with no visible way out pass.
 */
async function dismissLayer(page: Page): Promise<void> {
  for (let depth = 0; depth < 4; depth += 1) {
    const covering = layers(page);
    const before = await covering.count();
    if (before === 0) {
      return;
    }
    await covering.last().getByRole('button', { name: WAY_OUT }).first().click();

    // The frame is given back on the next change detection rather than on the
    // click itself. Waiting for the stack to actually get shorter is what stops
    // the next turn of this loop from taking hold of a layer already on its way
    // out — a locator that resolves, then never becomes clickable.
    await expect(covering).toHaveCount(before - 1);
  }
  await expect(layers(page)).toHaveCount(0);
}

/**
 * Brings each transcribed row on screen.
 *
 * Keyed by the ledger's own row id, so a row added to the transcription with no
 * way to reach it fails this suite by name rather than being quietly skipped.
 */
const REACH: Record<string, (page: Page) => Promise<void>> = {
  'hull-catalogue': async (page) => {
    await page.goto('/ships');
    await expect(page.locator('edsb-ship-catalogue-page')).toBeVisible();
  },
  'hull-detail': async (page) => {
    await page.goto(`/ships/${HULL}`);
    await expect(
      page.getByRole('button', { name: englishMessages['hullDetail.create'] }),
    ).toBeVisible();
  },
  'build-workspace': async (page) => {
    await page.goto('/build');
    await expect(page.locator('edsb-build-workspace-page')).toBeVisible();
  },
  'build-library': async (page) => {
    await page.goto('/builds');
    await expect(page.locator('edsb-build-library-page')).toBeVisible();
  },
  'save-build-layer': async (page) => {
    await withStockBuild(page);
    await openSaveLayer(page);
  },
  'library-delete-confirmation': async (page) => {
    await withStockBuild(page);
    await openSaveLayer(page);
    await saveAs(page, 'Ledger build');
    await page.getByRole('button', { name: /^delete ledger build$/i }).click();
    await expect(layers(page)).toHaveCount(1);
  },
  'replacement-confirmation': async (page) => {
    // Feature 001 asks before an incoming build replaces unsaved work, which
    // is what makes an ordinary import the way to reach the question.
    await withStockBuild(page);
    await pasteImport(page, JOURNAL_EVENT);
    await expect(page.getByRole('dialog', { name: /replace the build/i })).toBeVisible();
  },
  'outfitting-ledger': async (page) => {
    await withStockBuild(page);
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
  },
  'module-replacement-layer': async (page) => {
    await withStockBuild(page);
    await selectSlot(page, 'FrameShiftDrive');
    await openChooser(page);
  },
  'engineering-editor-layer': async (page) => {
    await withStockBuild(page);
    await selectSlot(page, 'FrameShiftDrive');
    await openEditor(page);
  },
  'normalisation-refusal': async (page) => {
    await page.goto('/build');
    await pasteImport(page, JSON.stringify(UNSUPPORTED_PARTIAL_QUALITY));
    await expect(page.getByRole('dialog', { name: /import build/i })).toContainText(
      englishMessages['slef.import.failure.normalizationUnsupported']
        .replace('{{count}}', '1')
        .trim(),
    );
  },
  'quality-completion-notice': async (page) => {
    await importPayload(page, JSON.stringify(SUPPORTED_PARTIAL_QUALITY));
    await expect(page.locator('edsb-quality-completion-notice')).toContainText(
      englishMessages['outfitting.notice.import.title'],
    );
  },
  'status-rail': async (page) => {
    await withStockBuild(page);
    await expect(page.locator('.outfitting__status-rail')).toBeVisible();
  },
  'import-layer': async (page) => {
    await page.goto('/build');
    await reachShellAction(page, /^import build$/i);
    await expect(page.getByRole('dialog', { name: /import build/i })).toBeVisible();
  },
  'export-layer': async (page) => {
    await withStockBuild(page);
    await reachShellAction(page, /^export$/i);
    await expect(page.getByRole('dialog', { name: /export build/i })).toBeVisible();
  },
  'import-outcome': async (page) => {
    await importPayload(page, JSON.stringify(SUPPORTED_PARTIAL_QUALITY));
    await expect(page.locator('edsb-quality-completion-notice')).toBeVisible();
    await expect(page.locator('[data-slot-key]').first()).toBeVisible();
  },
  'power-and-thermals': async (page) => {
    await withStockBuild(page);
    await openMode(page, englishMessages['anatomy.mode.power']);
    await expect(page.locator('edsb-power-thermals')).toBeVisible();
  },
  'defence-analysis': async (page) => {
    await withStockBuild(page);
    await openMode(page, englishMessages['anatomy.mode.defence']);
    await expect(page.locator('edsb-defence-analysis')).toBeVisible();
  },
  'offence-analysis': async (page) => {
    await withStockBuild(page);
    await openMode(page, englishMessages['anatomy.mode.offence']);
    await expect(page.locator('edsb-offence-analysis')).toBeVisible();
  },
  'drives-and-mass': async (page) => {
    await withStockBuild(page);
    await openMode(page, englishMessages['anatomy.mode.drives']);
    await expect(page.locator('edsb-drives-mass')).toBeVisible();
  },
  'cost-and-materials': async (page) => {
    await withStockBuild(page);
    await expect(page.locator('edsb-cost-materials .cost__row').first()).toBeVisible();
  },
  'hull-anatomy': async (page) => {
    await withStockBuild(page);
    await openMode(page, englishMessages['anatomy.mode.mounts']);
    await expect(page.locator('edsb-hull-anatomy')).toBeVisible();
  },
  'hull-anatomy-side-state': async (page) => {
    await withStockBuild(page);
    await openMode(page, englishMessages['anatomy.mode.mounts']);
    await expect(
      page.locator('edsb-hull-anatomy .anatomy__sides, edsb-hull-anatomy'),
    ).not.toHaveCount(0);
  },
  'application-frame': async (page) => {
    await page.goto('/');
    await expect(page.getByRole('banner')).toBeVisible();
  },
  'feedback-host': async (page) => {
    await page.goto('/build');
    await expect(page.locator('edsb-announcement-outlet').first()).toBeAttached();
  },
};

/** One valid journal Loadout event for a stock hull, as another tool exports it. */
const JOURNAL_EVENT = JSON.stringify({ event: 'Loadout', Ship: HULL.toLowerCase(), Modules: [] });

/**
 * The two partial-roll payloads feature 002 already tests the package against.
 *
 * Transcribed from `src/app/domain/outfitting/outfitting.fixtures.ts`, where
 * both are documented with the package behaviour they provoke: a dirty drive
 * at grade 5 is a recipe the package identifies, so its partial roll is
 * completed and reported; a grade-5 `FSD_LongRange` is a pre-engineered reward,
 * so a partial roll of it is a state the package declines to identify and the
 * whole candidate is refused. They are duplicated here rather than imported
 * because that module reaches into the Almanac, which this suite's transpiler
 * does not resolve — and made up here by nobody, because a payload this suite
 * invented would be it guessing at what the package does.
 */
const SUPPORTED_PARTIAL_QUALITY = {
  event: 'Loadout',
  Ship: HULL,
  Modules: [
    {
      Slot: 'MainEngines',
      Item: 'Int_Engine_Size7_Class5',
      Engineering: { BlueprintName: 'Engine_Dirty', Level: 5, Quality: 0.37 },
    },
  ],
};

/**
 * The payload whose partial engineering the package cannot complete.
 *
 * Transcribed with its sibling above from `outfitting.fixtures.ts`: at full
 * grade this drive is a pre-engineered reward, so a partial roll of it is a
 * state the package declines to identify and the whole candidate is refused
 * before anything is activated. A refusal has no half-outcome and therefore no
 * workspace state of its own — it is reported where the payload arrived.
 */
const UNSUPPORTED_PARTIAL_QUALITY = {
  event: 'Loadout',
  Ship: HULL,
  Modules: [
    {
      Slot: 'FrameShiftDrive',
      Item: 'Int_Hyperdrive_Size6_Class5',
      Engineering: { BlueprintName: 'FSD_LongRange', Level: 5, Quality: 0.42 },
    },
  ],
};

/** Opens the layer that saves the working build under a name. */
async function openSaveLayer(page: Page): Promise<void> {
  // The layer belongs to the library screen, which is where feature 001 draws
  // the control that names a working build. Reached by the shell's own link
  // rather than by loading the address: a fresh document has no open build, and
  // the save the library offers is of the build the Commander has in hand.
  await reachShellLink(page, /^open saved build$/i);
  await page.getByRole('button', { name: /^Save Working build under a name$/i }).click();
  await expect(layers(page)).toHaveCount(1);
}

/** Saves the open build under a name, from the layer that is already open. */
async function saveAs(page: Page, name: string): Promise<void> {
  const layer = layers(page);
  await layer.getByRole('textbox', { name: /^name$/i }).fill(name);
  await layer.getByRole('button', { name: /^save as a new build$/i }).click();
  await expect(layers(page)).toHaveCount(0);
}

/** Pastes a payload into the import layer and submits it. */
async function pasteImport(page: Page, payload: string): Promise<void> {
  await reachShellAction(page, /^import build$/i);
  const layer = page.getByRole('dialog', { name: /import build/i });
  await layer.getByLabel(/slef payload/i).fill(payload);
  await layer.getByRole('button', { name: /^load build$/i }).click();
}

/**
 * Imports a payload into an empty workspace.
 *
 * The payloads are the reviewed package fixtures the outfitting feature
 * already tests against, not values invented here: a build this suite made up
 * would be this suite asserting against its own guess at what the Almanac does.
 */
async function importPayload(page: Page, payload: string): Promise<void> {
  await page.goto('/build');
  await pasteImport(page, payload);

  // An empty workspace has nothing to lose, so feature 001 asks nothing. A
  // workspace that does is answered here rather than left holding the question.
  const question = page.getByRole('dialog', { name: /replace the build/i });
  if ((await question.count()) > 0) {
    await question.getByRole('button', { name: /discard and open/i }).click();
  }

  // What this journey wants is the surface beneath, so it waits for the frame
  // to be uncovered and dismisses nothing. Feature 004 closes its own layer
  // once the workspace behind it has been rebuilt, and that is not instant:
  // asked whether it is still open while it is closing, the layer says yes,
  // and the control that answer reaches for stops being clickable before the
  // press lands — which is a wait for a button that will never be pressable
  // again rather than a dismissal.
  //
  // A refusal would leave the layer open and fail here instead. That is the
  // honest outcome: these payloads are the reviewed package fixtures, and one
  // of them being refused is the fixture having changed, not something for
  // this helper to cancel away and then assert against a workspace that never
  // received the build.
  await expect(layers(page)).toHaveCount(0);
}

/** Every row the ledger transcribes, with the recipe that brings it on screen. */
const ROWS: readonly HelpRouteRow[] = helpRouteCoverage;

test.describe('reaching help from every shipped surface', () => {
  test('the transcription and this suite name the same rows', () => {
    const transcribed = ROWS.map((row) => row.id).sort();
    const driven = Object.keys(REACH).sort();

    expect(driven).toEqual(transcribed);
  });

  for (const row of ROWS) {
    test(`opens help from ${row.surface}`, async ({ page }) => {
      await REACH[row.id](page);

      const covering = await layers(page).count();
      if (row.frameEntry === 'obscured' && covering > 0) {
        // What FR-011 requires of a layer that covers the frame: it is
        // dismissible, and help is reached from the capability beneath — not
        // from a second route inside the layer. Two of these rows are layers
        // only where the space is narrow; where this width draws them inline
        // the frame was never covered and there is nothing to dismiss.
        await expect(layers(page).getByRole('button', { name: HELP_ACTION })).toHaveCount(0);
        await dismissLayer(page);
      }

      const before = await settled(page);
      await openHelp(page);

      // One dialog, and it is this one.
      await expect(layers(page)).toHaveCount(1);
      expect(page.url()).toBe(before);

      await closeHelp(page);

      // The address after closing is not compared here. Feature 001's manifest
      // opens the hull the pointer comes to rest on, so on the shipyard the
      // control that closes a centred modal is standing over a row, and what
      // moves the address is that row rather than anything help did. The
      // complete round trip is asserted on the workspace below, where no
      // surface navigates on hover.
      await expect(helpModal(page)).toHaveCount(0);
    });
  }
});

test.describe('the one destination FR-002 requires', () => {
  test('no capability offers a help control or legal body of its own', async ({ page }) => {
    await withStockBuild(page);

    // Nothing but the frame claiming to be a way to the legal body. Scoped to
    // the frame, which is everything a Commander is looking at: the modal is
    // mounted beside it and closed, and counting its contents here would be
    // counting the one destination FR-002 asks for as a violation of it.
    const capability = page.locator('edsb-app-frame');
    await expect(capability.getByRole('link', { name: /licen[cs]e/i })).toHaveCount(0);
    await expect(capability.getByText(/Frontier Developments plc/i)).toHaveCount(0);

    // The frame's action, and exactly one of it — reached the way a Commander
    // reaches it, because the entry is on the bar where there is room and
    // behind the action layer where there is not. Counting only what the bar
    // happens to draw is how "no more than one" passes on a frame that offers
    // no help at all, which is the opposite of what FR-002 asks for.
    const entries = page.getByRole('button', { name: HELP_ACTION });
    if ((await entries.count()) === 0) {
      await openActionLayer(page);
    }
    await expect(entries).toHaveCount(1);
  });

  test('help opens over the capability and gives it back unchanged', async ({ page }) => {
    await withStockBuild(page);
    const fragment = new URL(await settled(page)).hash;
    const ledger = await page.locator('[data-slot-key]').count();

    await openHelp(page);
    await closeHelp(page);

    expect(new URL(page.url()).hash).toBe(fragment);
    expect(await page.locator('[data-slot-key]').count()).toBe(ledger);
  });

  test('opening help makes no request of any kind', async ({ page }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');
    await settled(page);

    // Recorded only once the capability beneath has finished loading, so what
    // is measured is what opening help costs — not what the screen it opened
    // over was still fetching.
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await openHelp(page);
    await closeHelp(page);

    const origin = new URL(page.url()).origin;
    // Nothing is fetched to open help: no route chunk, no document, nothing
    // off this origin. The one thing a first open can still pull is a font
    // face the design system already declares, on a capability that had not
    // yet drawn a monospace glyph — the shell's own loading, arriving late,
    // and the same on any layer. SC-005 measures that case in full in the
    // production offline journey, where the app shell is already cached.
    const unexpected = requests.filter((url) => !/\.woff2?(\?|$)/.test(url));
    expect(unexpected).toEqual([]);
    expect(requests.filter((url) => !url.startsWith(origin))).toEqual([]);
  });
});

test.describe('the compact route the reference draws', () => {
  test('the action layer carries the same entry as the wide row', async ({ page }) => {
    await withStockBuild(page);

    const inline = page.getByRole('button', { name: HELP_ACTION });
    if ((await inline.count()) === 0) {
      await openActionLayer(page);
    }

    await expect(page.getByRole('button', { name: HELP_ACTION }).first()).toBeVisible();
  });
});

test.describe('the one legal body the modal embeds', () => {
  /**
   * A fresh extraction from the file itself, by the generator's own rules.
   *
   * Not a copy of the notice typed into this spec: a second copy is the thing
   * that eventually disagrees, and a journey asserting against its own copy
   * proves only that two files this project wrote still match. What is under
   * test is that the text a browser rendered is the text root `LICENSE` holds.
   *
   * Run in its own Node process rather than imported: this suite is transpiled
   * to CommonJS, and the generator is a real ES module. The subprocess is also
   * the more honest evidence — nothing this test's own module graph has already
   * loaded can be what answers.
   */
  async function freshDisclaimer(): Promise<string> {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import { readFileSync } from 'node:fs';" +
          "const { extractFrontierDisclaimer } = await import('./scripts/generate-help-manifest.mjs');" +
          "process.stdout.write(extractFrontierDisclaimer(readFileSync('LICENSE', 'utf8')).exactText);",
      ],
      { cwd: process.cwd() },
    );
    return stdout;
  }

  test('renders the disclaimer exactly as root LICENSE holds it', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);

    const excerpt = helpModal(page).locator('.legal-excerpt__body');
    const rendered = await excerpt.evaluate((node) => node.textContent ?? '');
    const expected = await freshDisclaimer();

    expect(expected.length).toBeGreaterThan(0);
    expect(rendered).toBe(expected);
    await expect(excerpt).toHaveAttribute('lang', 'en');
  });

  test('frames the excerpt in the reader’s language and says it is not translated', async ({
    page,
  }) => {
    await withStockBuild(page);
    await openHelp(page);
    const modal = helpModal(page);

    await expect(modal).toContainText(englishMessages['help.licence.framing']);
    await expect(modal).toContainText(englishMessages['help.licence.source']);
    await expect(modal).toContainText(englishMessages['help.licence.language']);
  });

  test('embeds one legal body and no other document', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);
    const modal = helpModal(page);

    await expect(modal.locator('.legal-excerpt__body')).toHaveCount(1);
    // The MIT grant, the Almanac licence and the package's third-party notices
    // are named and pointed at, never reproduced (FR-004).
    await expect(modal).not.toContainText('Permission is hereby granted');
    await expect(modal).not.toContainText('THIRD_PARTY_NOTICES');
  });

  test('wraps the excerpt within the measure rather than sideways', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);

    const overflow = await helpModal(page)
      .locator('.legal-excerpt__body')
      .evaluate((node) => ({
        clipped: node.scrollWidth > node.clientWidth + 1,
        hidden: node.scrollHeight > node.clientHeight + 1,
      }));

    expect(overflow.clipped, 'the excerpt needs a sideways drag to be read').toBe(false);
    expect(overflow.hidden, 'part of the excerpt is cut off').toBe(false);

    // And the document itself has not been pushed sideways by it.
    const document = await page.evaluate(() => ({
      scroll: window.document.documentElement.scrollWidth,
      client: window.document.documentElement.clientWidth,
    }));
    expect(document.scroll).toBeLessThanOrEqual(document.client + 1);
  });
});

test.describe('the modal’s one way out of the application', () => {
  /** The exact destination the generated manifest carries. */
  const LICENCE_URL =
    'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE';

  test('asks for nothing and opens nothing until it is activated', async ({ page, context }) => {
    await page.goto('/build');
    await page.waitForLoadState('networkidle');
    await settled(page);

    const outbound: string[] = [];
    page.on('request', (request) => outbound.push(request.url()));
    const popups: unknown[] = [];
    context.on('page', (opened) => popups.push(opened));

    await openHelp(page);
    const link = helpModal(page).getByRole('link');
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();

    expect(outbound.filter((url) => url.includes('github'))).toEqual([]);
    expect(popups).toEqual([]);
    // Nothing measures or warms the destination either: no preconnect, no
    // prefetch, no ping.
    expect(await page.locator('link[rel="preconnect"], link[rel="prefetch"]').count()).toBe(0);
    expect(await link.getAttribute('ping')).toBeNull();
  });

  test('carries the audited destination, and nothing about this session', async ({ page }) => {
    await withStockBuild(page);
    const fragment = new URL(await settled(page)).hash;
    expect(fragment.length).toBeGreaterThan(0);

    await openHelp(page);
    const link = helpModal(page).getByRole('link');
    const href = (await link.getAttribute('href')) ?? '';

    expect(href).toBe(LICENCE_URL);
    expect(await link.getAttribute('rel')).toBe('noreferrer noopener');

    const destination = new URL(href);
    expect(destination.search).toBe('');
    expect(destination.hash).toBe('');
    // Nothing about the open build, the route, the language or this browser's
    // stored records rides out on it.
    expect(href).not.toContain(fragment.slice(1));
    expect(href).not.toContain('Anaconda');
    expect(href).not.toContain('edsb:');
    expect(href.toLowerCase()).not.toContain('locale');
  });

  test('says where it goes, that it leaves, and that it may need a network', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);
    const link = helpModal(page).getByRole('link');

    const describedBy = await link.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    const description = helpModal(page).locator(`#${describedBy}`);

    await expect(description).toBeVisible();
    await expect(description).toContainText(englishMessages['help.licence.link.purpose']);
    await expect(description).toContainText(englishMessages['help.external.leaving']);
    await expect(description).toContainText(englishMessages['help.external.network']);
  });
});

test.describe('which artifact a Commander is looking at', () => {
  /**
   * The installed Almanac's own version, resolved the way the generator
   * resolves it.
   *
   * Through the package's export map in a real Node process rather than by
   * walking `node_modules` — under pnpm that is a symlinked store path, and a
   * journey that reads a version off a guessed directory is asserting against
   * whatever it happened to find.
   */
  async function installedAlmanacVersion(): Promise<string> {
    const { stdout } = await promisify(execFile)(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import { readFileSync } from 'node:fs';" +
          "import { fileURLToPath } from 'node:url';" +
          "const root = new URL('../../', import.meta.resolve('@elite-dangerous-almanac/core/ships/ships'));" +
          "const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));" +
          'process.stdout.write(manifest.version);',
      ],
      { cwd: process.cwd() },
    );
    return stdout;
  }

  /** Every term/value pair the ABOUT section publishes, in reading order. */
  async function identityFacts(page: Page): Promise<[string, string][]> {
    return helpModal(page)
      .locator('.version-facts__fact')
      .evaluateAll((facts) =>
        facts.map((fact) => [
          (fact.querySelector('dt')?.textContent ?? '').trim(),
          (fact.querySelector('dd')?.textContent ?? '').trim(),
        ]),
      ) as Promise<[string, string][]>;
  }

  test('names the versions the shipped root and installed manifests carry', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);
    const facts = new Map(await identityFacts(page));

    expect(facts.get(englishMessages['help.about.version.application'])).toBe(
      applicationManifest.version,
    );
    expect(facts.get(englishMessages['help.about.version.almanac'])).toBe(
      await installedAlmanacVersion(),
    );
  });

  test('says this build is not a release, and which build it is', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);
    const facts = new Map(await identityFacts(page));
    const build = facts.get(englishMessages['help.about.build']) ?? '';

    // No workflow declares a release, so every build this repository produces
    // is a non-release carrying its own identifier. The wording is the
    // catalogue's, minus the identifier it interpolates.
    const [state] = englishMessages['help.about.build.nonRelease'].split('{{');
    expect(build).toContain(state.trim());
    expect(build.replace(state, '').trim().length).toBeGreaterThan(0);
    expect(build).not.toBe(englishMessages['help.about.build.release']);
  });

  test('reads each identity as a term with its own value', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);
    const facts = await identityFacts(page);
    const terms = facts.map(([term]) => term);

    expect(facts.length).toBe(3);
    expect(new Set(terms).size).toBe(3);
    for (const [term, value] of facts) {
      expect(term.length).toBeGreaterThan(0);
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('claims nothing about a live game or a live catalogue', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);
    const modal = helpModal(page);

    await expect(modal).toContainText(englishMessages['help.about.provenance.almanac']);
    await expect(modal).toContainText(englishMessages['help.about.provenance.frontier']);
    await expect(
      modal.getByText(/live game|live catalogue|up to date|latest version/i),
    ).toHaveCount(0);
  });

  test('wraps long identities within the measure rather than sideways', async ({ page }) => {
    await withStockBuild(page);
    await openHelp(page);

    const overflow = await helpModal(page)
      .locator('.version-facts')
      .evaluate((node) => node.scrollWidth - node.clientWidth);

    expect(overflow).toBeLessThanOrEqual(1);
  });
});
