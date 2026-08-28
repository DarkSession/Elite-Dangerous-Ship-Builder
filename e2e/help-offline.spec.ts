import { expect, test, type Page } from '@playwright/test';
import applicationManifest from '../package.json';
import englishMessages from '../src/app/i18n/locales/en.json';
import { HELP_TOPIC_IDS } from '../src/app/domain/help/help-topic';
import { reachShellAction } from './shell';

/**
 * Help with no network at all (FR-001, SC-005).
 *
 * Runs only against a production build, because the thing under test is the
 * *generated* service worker. Whether the modal's facts and its legal excerpt
 * survive a reload with the network gone is a question about what was cached,
 * and a development server answers it by serving everything from memory — which
 * would pass here and prove nothing.
 *
 * The promise is narrow and worth stating exactly: after one completed online
 * load, a Commander who is offline can open help, read all of it — the identity
 * facts SC-004 asks for as well as the legal body SC-005 does — and close it
 * again, and nothing about that was fetched. It is the strongest form of the
 * privacy claim the modal itself makes.
 *
 * It lives beside the other offline journeys rather than inside
 * `help-and-licences.spec.ts` for the same reason they do: that suite runs in
 * every development project, where there is no worker to test.
 */

const HELP_ACTION = new RegExp(`^${englishMessages['help.action.label']}$`, 'i');

const HELP_TITLE = new RegExp(
  englishMessages['help.title'].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  'i',
);

function helpModal(page: Page) {
  return page.getByRole('dialog', { name: HELP_TITLE });
}

async function waitForController(page: Page): Promise<void> {
  await page.waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
    timeout: 30_000,
  });
}

test.describe('help offline', () => {
  test('opens complete after one online load, with the network gone', async ({ page, context }) => {
    // One completed load, then a second so the worker serves rather than
    // merely installs: in Chromium it does not control the page it installed on.
    await page.goto('/builds');
    await expect(page.getByRole('main')).toBeVisible();
    await waitForController(page);

    // The library is a layer over the frame now, and a layer makes the frame
    // beneath it inert — help included. That is what a modal is for, so the way
    // to help from here is the layer's own way out, which FR-011 requires it to
    // have. Dismissed while the network is still there, so the screen it gives
    // back is cached like any other completed load rather than half-drawn from
    // a worker that never saw it.
    await page
      .getByRole('dialog')
      .getByRole('button', {
        name: new RegExp(`^${englishMessages['library.close']}$`, 'i'),
      })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('main')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('main')).toBeVisible();

    // The frame is visible before the screen behind it has finished: the
    // catalogue's own chunk and its illustrations are still arriving, from the
    // worker's cache rather than the network, and they would be recorded below
    // as though help had asked for them. The screen has to be *done*, not
    // merely drawn, for the measurement underneath to mean anything.
    await page.waitForLoadState('networkidle');

    // Recorded from here: what opening help costs on a screen that has finished
    // loading, offline. Everything it draws was asked for on the online loads
    // above, and nothing on it is deferred, so a request inside this window is
    // help's own.
    const requests: { url: string; type: string }[] = [];
    const failures: string[] = [];
    page.on('request', (request) =>
      requests.push({ url: request.url(), type: request.resourceType() }),
    );
    page.on('requestfailed', (request) => failures.push(request.url()));

    await reachShellAction(page, HELP_ACTION);
    const modal = helpModal(page);
    await expect(modal).toBeVisible();

    // Every part of it, not merely the shell: the sections, all three ABOUT
    // sentences, every question with its answer, and the whole licence summary.
    await expect(modal).toContainText(englishMessages['help.section.about']);
    await expect(modal).toContainText(englishMessages['help.section.faq']);
    await expect(modal).toContainText(englishMessages['help.section.licence']);
    await expect(modal).toContainText(englishMessages['help.purpose']);
    await expect(modal).toContainText(englishMessages['help.maintainer']);
    await expect(modal).toContainText(englishMessages['help.provenance']);
    await expect(modal).toContainText(englishMessages['help.licence.link.application']);
    await expect(modal).toContainText(englishMessages['help.licence.link.library']);
    await expect(modal).toContainText(englishMessages['help.licence.index.gameData']);
    await expect(modal).toContainText(englishMessages['help.licence.index.typefaces']);

    // And both licence links are drawn, with their addresses, on a visit that
    // has no network at all. A link is an address rather than a request: what
    // needs a connection is following one, and nothing about drawing it waits,
    // fetches or degrades. Which is the whole distinction FR-001 turns on —
    // the modal is complete offline, and one of the things it is complete
    // about is where the terms it summarises can be read.
    const links = modal.getByRole('link');
    await expect(links).toHaveCount(2);
    for (const link of await links.all()) {
      expect(await link.getAttribute('href')).toMatch(/^https:\/\/github\.com\//);
    }

    // SC-004's help part: the same set, in order, with complete text and
    // nothing waiting on anything.
    const topics = (await modal
      .locator('.help-dialog__topic')
      .evaluateAll((nodes) =>
        nodes.map((topic) => [
          (topic.querySelector('.help-dialog__question')?.textContent ?? '').trim(),
          (topic.querySelector('.help-dialog__answer')?.textContent ?? '').trim(),
        ]),
      )) as [string, string][];

    expect(topics).toEqual(
      HELP_TOPIC_IDS.map((id) => [
        englishMessages[`help.topic.${id}.question` as keyof typeof englishMessages],
        englishMessages[`help.topic.${id}.answer` as keyof typeof englishMessages],
      ]),
    );

    // The identity facts, completing SC-004: which application and which
    // catalogue, both present and neither waiting on anything. Compared against
    // the same online journey's source of truth — the shipped root manifest —
    // rather than against whatever is on screen.
    const facts = new Map(
      (await modal
        .locator('.version-facts__fact')
        .evaluateAll((nodes) =>
          nodes.map((fact) => [
            (fact.querySelector('dt')?.textContent ?? '').trim(),
            (fact.querySelector('dd')?.textContent ?? '').trim(),
          ]),
        )) as [string, string][],
    );

    expect(facts.get(englishMessages['help.about.version.application'])).toBe(
      applicationManifest.version,
    );
    expect((facts.get(englishMessages['help.about.version.almanac']) ?? '').length).toBeGreaterThan(
      0,
    );

    // Two facts, and no release state: the reference draws neither a third
    // fact nor a word about whether anybody released this build.
    expect(facts.size).toBe(2);
    await expect(modal.getByText(/non-release|release/i)).toHaveCount(0);

    const excerpt = modal.locator('.legal-excerpt__body');
    await expect(excerpt).toHaveAttribute('lang', 'en');
    expect((await excerpt.evaluate((node) => node.textContent ?? '')).length).toBeGreaterThan(0);

    // Nothing missing anywhere in it. The modal resolves every string it draws
    // from the catalogue and every fact from the eagerly imported manifest, so
    // the way a failure would surface here is the placeholder one of those
    // lookups falls back to — not a loading state, which help has none of.
    await expect(modal).not.toContainText(englishMessages['unavailable.value']);
    await expect(modal).not.toContainText(englishMessages['message.unavailable']);

    // And nothing was fetched to open it. The one thing a first open can still
    // ask for is a font face the design system already declares, on a screen
    // that had not yet drawn a monospace glyph — asked of the worker's own
    // cache, which is why it is answered at all with the network gone. No
    // document, no chunk, no data and nothing off this origin (SC-005).
    const origin = new URL(page.url()).origin;
    expect(requests.filter(({ type }) => type !== 'font')).toEqual([]);
    expect(requests.filter(({ url }) => !url.startsWith(origin))).toEqual([]);
    expect(failures, 'something opening help needed the network').toEqual([]);

    await modal
      .getByRole('button', { name: new RegExp(`^${englishMessages['action.close']}$`, 'i') })
      .click();
    await expect(helpModal(page)).toHaveCount(0);

    await context.setOffline(false);
  });
});
