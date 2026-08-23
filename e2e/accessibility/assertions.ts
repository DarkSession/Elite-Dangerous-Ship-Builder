import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Named semantic assertions.
 *
 * These state expected meaning that an automated scan cannot: that a control's
 * accessible name is the text a Commander can actually see, that a value is
 * related to the unit it is measured in, that a status is readable without
 * seeing its colour. Axe checks whether markup is well-formed; these check
 * whether it says the right thing.
 */

/** The design target baseline, in CSS pixels. */
export const TARGET_BASELINE_PX = 44;

/** WCAG 2.2 SC 2.5.8 AA, in CSS pixels. The floor nothing may go under. */
export const TARGET_FLOOR_PX = 24;

/**
 * The controls the canvas itself draws dense, held to the floor not the baseline.
 *
 * The reference draws a ledger row's power chip at 20px and its grade bar at
 * 28px — forty rows of a 44px chip is a different interface from the one it
 * draws. These are held to WCAG 2.2 SC 2.5.8's 24-pixel AA minimum instead,
 * which is a floor and not a waiver: everything else on every surface stays at
 * the project's stricter 44 (design-canvas rule, wave 4).
 */
const DENSE_TARGETS = [
  '.power__switch',
  '.power__priority',
  '.grade',
  '.identity-fields__open',
  // The bar's identity block is 54px tall on the canvas, with two lines in it.
  // A 44px field cannot be one of two lines inside 54.
  '.identity-fields__input',
  // A segmented strip is drawn dense everywhere it appears: 23.5px beside
  // canvas 1c's `HULL ANATOMY` rule, 30px under canvas 1d's, 25px for 1d's side
  // selector and 38px for canvas 1a's catalogue filter. At 44 it stops being a
  // strip beside a heading and becomes a band across the region.
  '.tab',
];

/**
 * Controls that take SC 2.5.8's **Equivalent** exception rather than a size.
 *
 * One control does, and it is not a chip drawn small: a mount on a hull
 * schematic is the package's own geometry at the package's own spacing. The
 * Almanac puts real mounts nineteen units apart on a twelve-hundred-unit hull —
 * six CSS pixels on the plate a tablet has room for — so no band wide enough to
 * be a target leaves the neighbouring mount pressable, and widening the gap
 * would mean moving package geometry, which feature 010's FR-003 refuses.
 *
 * The exception is only available because the equivalent exists and is on the
 * same screen: feature 002's complete outfitting ledger carries every one of
 * these mounts at the full 44-pixel baseline, in package order, whether or not
 * the artwork arrived. `expectEquivalentControls` is what proves that, and this
 * list is inert without it.
 */
const EQUIVALENT_TARGETS = ['.schematic__mount'];

/**
 * Waits for every running transition to finish before a surface is measured.
 *
 * A control that has just been mounted can be mid-transition between the
 * user-agent's own default and the design system's tokens. That intermediate
 * frame is not a state anyone is expected to read, and measuring it reports the
 * browser's default button colour rather than the one that was designed — so
 * every colour and geometry measurement waits for the surface to settle first.
 *
 * A repeating animation is deliberately not waited for. A busy indicator runs
 * for as long as it is busy, which is forever in a preview: waiting for one to
 * finish would hang every measurement on the page it appears on rather than
 * stabilising it.
 */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(
    () =>
      document.getAnimations().every((animation) => {
        if (animation.playState !== 'running') {
          return true;
        }
        return animation.effect?.getComputedTiming().iterations === Infinity;
      }),
    undefined,
    { timeout: 2_000 },
  );
}

/** Normalises text the way an accessible-name computation does. */
function normalize(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

/** Exactly one banner, one main and at most one primary navigation. */
export async function expectLandmarks(page: Page): Promise<void> {
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);
  expect(await page.getByRole('navigation').count()).toBeLessThanOrEqual(1);
}

/** Exactly one visible `h1`. */
export async function expectSingleVisibleH1(page: Page): Promise<void> {
  const headings = page.getByRole('heading', { level: 1 });
  await expect(headings).toHaveCount(1);
  await expect(headings.first()).toBeVisible();
}

/**
 * Heading levels descend without skipping.
 *
 * A jump from `h2` to `h4` leaves a screen-reader user unable to tell whether
 * they have moved into a subsection or out of one.
 */
export async function expectOrderedHeadings(page: Page): Promise<void> {
  const levels = await page
    .locator('h1, h2, h3, h4, h5, h6')
    .evaluateAll((nodes) =>
      nodes
        .filter((node) => (node as HTMLElement).offsetParent !== null || node.tagName === 'H1')
        .map((node) => Number(node.tagName.slice(1))),
    );

  for (let index = 1; index < levels.length; index += 1) {
    const previous = levels[index - 1] ?? 0;
    const current = levels[index] ?? 0;
    expect(
      current - previous,
      `heading level jumped from h${previous} to h${current}`,
    ).toBeLessThanOrEqual(1);
  }
}

/**
 * The accessible name contains the visible text.
 *
 * Containment rather than equality, because an accessible name may legitimately
 * add context a sighted reader gets from position — but it may never omit or
 * contradict the words on screen (FR-007).
 */
export async function expectNameMatchesVisibleText(control: Locator): Promise<void> {
  // Decoration marked `aria-hidden` is not part of the label: a direction caret
  // beside a sort field is drawn for the eye and stated by `aria-pressed` and
  // by the name itself, so requiring the name to repeat the arrow would be
  // asking for a name no reader benefits from.
  const visible = normalize(
    await control.evaluate((node) => {
      const clone = node.cloneNode(true) as HTMLElement;
      for (const hidden of clone.querySelectorAll('[aria-hidden="true"]')) {
        hidden.remove();
      }
      return clone.textContent;
    }),
  );
  if (visible.length === 0) {
    return;
  }
  const accessible = normalize(await control.evaluate((node) => node.getAttribute('aria-label')));
  const computed = accessible.length > 0 ? accessible : visible;

  expect(
    computed.toLowerCase(),
    `accessible name "${computed}" does not contain visible text "${visible}"`,
  ).toContain(visible.toLowerCase());
}

/** A control exposes the named state with the expected value. */
export async function expectState(
  control: Locator,
  state:
    'selected' | 'expanded' | 'pressed' | 'checked' | 'invalid' | 'busy' | 'disabled' | 'current',
  value: boolean,
): Promise<void> {
  const attribute = {
    selected: 'aria-selected',
    expanded: 'aria-expanded',
    pressed: 'aria-pressed',
    checked: 'aria-checked',
    invalid: 'aria-invalid',
    busy: 'aria-busy',
    disabled: 'aria-disabled',
    current: 'aria-current',
  }[state];

  const actual = await control.getAttribute(attribute);
  if (state === 'disabled' && actual === null) {
    // A native `disabled` attribute is the preferred expression of the state.
    expect(await control.isDisabled()).toBe(value);
    return;
  }
  if (state === 'checked' && actual === null) {
    expect(await control.isChecked()).toBe(value);
    return;
  }
  if (state === 'current') {
    expect(actual !== null && actual !== 'false').toBe(value);
    return;
  }

  expect(actual, `expected ${attribute}="${value}"`).toBe(String(value));
}

/** A value is programmatically related to the text that explains it. */
export async function expectRelationship(
  page: Page,
  subject: Locator,
  relation: 'label' | 'description' | 'error',
  expectedText: string,
): Promise<void> {
  const attribute = relation === 'label' ? 'aria-labelledby' : 'aria-describedby';
  const ids = (await subject.getAttribute(attribute))?.split(/\s+/).filter(Boolean) ?? [];

  expect(ids.length, `expected ${attribute} on the subject`).toBeGreaterThan(0);

  const texts = await Promise.all(
    ids.map(async (id) => normalize(await page.locator(`[id="${id}"]`).textContent())),
  );

  expect(texts.join(' ')).toContain(expectedText);
}

/**
 * A visual carrier also carries its meaning in text.
 *
 * Given the element that shows the meaning visually — a colour swatch, a bar, a
 * shape — the text equivalent must be present and non-empty, either as visible
 * text or as an associated accessible name.
 */
export async function expectTextEquivalent(carrier: Locator): Promise<void> {
  const visible = normalize(await carrier.textContent());
  const label = normalize(await carrier.getAttribute('aria-label'));
  const describedBy = await carrier.getAttribute('aria-describedby');

  expect(
    visible.length > 0 || label.length > 0 || (describedBy ?? '').length > 0,
    'a visual information carrier has no text equivalent',
  ).toBe(true);
}

/**
 * Every interactive target meets the design baseline.
 *
 * The measured region is the **effective target**, not the control's own box. A
 * 16-pixel checkbox with a label beside it is not a 16-pixel target: clicking
 * the label activates the control, so the target is the union of the two. This
 * is what a pointer can actually hit, and measuring anything narrower would
 * report failures that are not real — and push the design towards oversized
 * glyphs to satisfy a bad measurement.
 *
 * The baseline applied is the project's 44 CSS-pixel design baseline, which is
 * deliberately stricter than WCAG 2.2 SC 2.5.8's 24-pixel AA minimum. The dense
 * chips the canvas draws small — `DENSE_TARGETS` — are held to that AA minimum
 * instead, and to nothing looser.
 *
 * Reports every offender rather than the first, because a layout regression
 * usually produces a family of them.
 */
export async function expectTargetSizes(
  page: Page,
  selector = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="switch"], [role="checkbox"], [role="radio"]',
): Promise<void> {
  const undersized = await page.locator(selector).evaluateAll(
    (nodes, { baseline, floor, dense, equivalent }) => {
      /** The union of a control's box and the box of any label that activates it. */
      const effectiveBox = (element: HTMLElement): DOMRect => {
        const boxes = [element.getBoundingClientRect()];

        const id = element.getAttribute('id');
        if (id !== null) {
          for (const label of document.querySelectorAll(`label[for="${id}"]`)) {
            boxes.push(label.getBoundingClientRect());
          }
        }
        const wrapping = element.closest('label');
        if (wrapping !== null) {
          boxes.push(wrapping.getBoundingClientRect());
        }

        const left = Math.min(...boxes.map((box) => box.left));
        const top = Math.min(...boxes.map((box) => box.top));
        const right = Math.max(...boxes.map((box) => box.right));
        const bottom = Math.max(...boxes.map((box) => box.bottom));

        return new DOMRect(left, top, right - left, bottom - top);
      };

      return nodes
        .filter((node) => {
          const style = getComputedStyle(node as HTMLElement);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map((node) => {
          const element = node as HTMLElement;
          const box = effectiveBox(element);
          const isDense = dense.some(
            (pattern) => element.matches(pattern) || element.closest(pattern) !== null,
          );
          const isEquivalent = equivalent.some(
            (pattern) => element.matches(pattern) || element.closest(pattern) !== null,
          );
          return {
            tag: node.tagName.toLowerCase(),
            text: (node.textContent ?? '').trim().slice(0, 40),
            id: node.getAttribute('id') ?? '',
            width: Math.round(box.width),
            height: Math.round(box.height),
            baseline: isDense ? floor : baseline,
            exempt: isEquivalent,
          };
        })
        .filter((box) => !box.exempt)
        .filter((box) => box.width > 0 && box.height > 0)
        .filter((box) => box.width < box.baseline || box.height < box.baseline);
    },
    {
      baseline: TARGET_BASELINE_PX,
      floor: TARGET_FLOOR_PX,
      dense: DENSE_TARGETS,
      equivalent: EQUIVALENT_TARGETS,
    },
  );

  expect(undersized, `targets below the ${TARGET_BASELINE_PX} CSS-pixel baseline`).toEqual([]);
}

/**
 * Every exempt control has the equivalent that exempts it.
 *
 * SC 2.5.8's Equivalent exception is not a waiver — it is a claim that the same
 * function is reachable through another control on the same page that does meet
 * the criterion. This checks the claim: every mount drawn on a schematic has a
 * ledger row for the same slot, and that row is at least the baseline.
 */
export async function expectEquivalentControls(page: Page): Promise<void> {
  const missing = await page.evaluate((baseline) => {
    const drawn = [...document.querySelectorAll('.schematic__mount')].map(
      (node) => node.getAttribute('data-slot') ?? '',
    );

    return [...new Set(drawn)].filter((key) => {
      const row = document.querySelector(`[data-slot-key="${key}"] button`);
      if (row === null) {
        return true;
      }
      const box = row.getBoundingClientRect();
      return box.width < baseline || box.height < baseline;
    });
  }, TARGET_BASELINE_PX);

  expect(missing, 'a drawn mount has no full-size equivalent in the ledger').toEqual([]);
}

/**
 * The document does not scroll horizontally.
 *
 * A component may own a labelled, bounded scroller; the page may not (FR-011).
 * A one-pixel tolerance absorbs sub-pixel rounding in layout, not a real
 * overflow.
 */
export async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(
    overflow.scrollWidth,
    `document overflows by ${overflow.scrollWidth - overflow.clientWidth} px`,
  ).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

/** Root language and direction are present and agree with the active locale. */
export async function expectRootLanguage(
  page: Page,
  expected: { lang: string; dir: 'ltr' | 'rtl' },
): Promise<void> {
  // Polled rather than sampled once. A non-English catalogue is fetched, and
  // the application deliberately renders complete English until it arrives
  // rather than a half-translated screen under a German root `lang`. So the
  // first paint of a route can legitimately precede the language it will settle
  // on, and a single read races that load.
  await expect
    .poll(
      async () =>
        await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
        })),
      { message: 'the root language and direction never settled on the expected pair' },
    )
    .toEqual(expected);
}

/** No raw message key or unresolved placeholder is visible anywhere on the page. */
export async function expectNoRawMessages(page: Page): Promise<void> {
  const text = normalize(await page.locator('body').textContent());

  expect(text, 'an unresolved interpolation placeholder is visible').not.toMatch(
    /\{\{\s*\w+\s*\}\}/,
  );
  // Message keys are dotted lower-case identifiers; any visible run of them is
  // a resolution failure that escaped the facade.
  expect(text, 'a raw message key is visible').not.toMatch(
    /\b(?:app|shell|action|status|error|field|unavailable|incomplete|game-text|locale|message|format)\.[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+\b/,
  );
}

/** One element whose content does not fit the box it is drawn in. */
export interface ClippedElement {
  readonly selector: string;
  readonly text: string;
  readonly overflowInline: number;
  readonly overflowBlock: number;
}

/**
 * Text that is cut off with no scroller to reach the rest of it.
 *
 * Shared rather than owned by one spec: truncation is the same failure whether
 * it is caused by expanded copy, a mirrored direction or a viewport the size of
 * a 400%-zoomed window, and all three need the same measurement.
 */
export async function clippedText(page: Page): Promise<ClippedElement[]> {
  return page.locator('main *').evaluateAll((nodes) =>
    nodes
      .filter((node) => {
        const element = node as HTMLElement;
        if (element.children.length > 0) {
          return false;
        }
        const style = getComputedStyle(element);
        // A non-replaced inline box has no client rectangle: `clientHeight` is
        // defined as zero while `scrollHeight` reports the line box, so the
        // difference is the line height rather than an overflow. Firefox and
        // Chromium disagree on what they report there, and neither number means
        // the text was cut off.
        if (style.display === 'inline') {
          return false;
        }
        // A box one pixel on a side is content hidden from the eye on purpose:
        // it is there for assistive technology, and nothing about it is drawn,
        // so "cut off" is not a thing that can happen to it.
        if (element.clientWidth <= 1 && element.clientHeight <= 1) {
          return false;
        }
        // Only a box that actually clips can cut text off. Content that
        // overflows a visible box is still painted and still readable — a
        // diacritic rising past its line box is the common case, and reporting
        // it as truncation would say a legible heading is unreadable.
        const clips = (value: string) => value === 'hidden' || value === 'clip';
        return clips(style.overflowX) || clips(style.overflowY);
      })
      .map((node) => {
        const element = node as HTMLElement;
        const classes = element.className.toString().trim().split(/\s+/).filter(Boolean).join('.');
        return {
          selector: `${element.tagName.toLowerCase()}${classes.length > 0 ? `.${classes}` : ''}`,
          text: (element.textContent ?? '').trim().slice(0, 40),
          overflowInline: element.scrollWidth - element.clientWidth,
          overflowBlock: element.scrollHeight - element.clientHeight,
        };
      })
      // A one-pixel difference is sub-pixel layout rounding, which the engines
      // do differently; two is a box that genuinely cannot hold its content.
      .filter((entry) => entry.overflowInline > 1 || entry.overflowBlock > 1),
  );
}

/**
 * The banner gets out of the way in a short viewport.
 *
 * At the 400%-zoom equivalent the viewport is 256 CSS pixels tall, and the
 * shell's banner is a sizeable share of that. That is only tolerable because
 * the banner releases its sticky position there and travels with the page.
 *
 * What is asserted is that travel: the banner moves by exactly the distance
 * scrolled, which is the definition of being in normal flow and is what makes
 * the whole viewport reachable once there is content to scroll. It is asserted
 * this way rather than as "the banner has left the screen", because that only
 * holds once a page is taller than the viewport, and rather than as a height
 * budget, which no criterion states and which would be a number invented here.
 */
export async function expectBannerReleasesShortViewport(page: Page): Promise<void> {
  const banner = page.getByRole('banner');

  const position = await banner.evaluate((node) => getComputedStyle(node as HTMLElement).position);
  expect(position, 'the banner stays stuck to a short viewport').not.toBe('sticky');
  expect(position, 'the banner is pinned over a short viewport').not.toBe('fixed');

  // The route renders lazily, and `main` exists before its content does. A page
  // with nothing to scroll cannot show whether the banner scrolls with it, so
  // the assertion waits for one that can rather than measuring an empty screen.
  await expect
    .poll(
      async () =>
        await page.evaluate(
          () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
        ),
      { message: 'the page never grew tall enough to scroll' },
    )
    .toBeGreaterThan(0);

  const before = await banner.evaluate((node) => (node as HTMLElement).getBoundingClientRect().top);

  // The banner's travel and the page's scroll are read in one evaluation.
  // Reading them separately compares two different moments, and a page whose
  // height is still settling — a font swapping in, an illustration arriving —
  // has its scroll position clamped between them, which looks exactly like a
  // banner that refused to move.
  const { scrolled, after } = await page.evaluate(() => {
    // Enough to prove the behaviour on a page of any length; the assertion is
    // on how far the banner travelled, not on where it ended up.
    window.scrollTo(0, document.documentElement.scrollHeight);
    const element = document.querySelector('header, [role="banner"]') as HTMLElement;
    return { scrolled: window.scrollY, after: element.getBoundingClientRect().top };
  });
  await page.evaluate(() => window.scrollTo(0, 0));

  expect(scrolled, 'the page is too short to prove anything about the banner').toBeGreaterThan(0);
  expect(
    Math.abs(before - after - scrolled),
    `the banner held its place while the page scrolled ${Math.round(scrolled)} px`,
  ).toBeLessThanOrEqual(1);
}
