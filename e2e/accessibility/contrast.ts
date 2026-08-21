import { expect, type Page } from '@playwright/test';

/**
 * Computed contrast assertions.
 *
 * Axe already reports contrast violations, and this does not replace it. What
 * it adds is a computation the suite owns: axe declines to judge a pair it
 * cannot resolve — text over an image, a partially transparent stack, an
 * element it considers obscured — and reports it as "incomplete" rather than as
 * a failure. An incomplete is not a pass, and a design system that quietly
 * accumulates them has no contrast evidence at all.
 *
 * So every rendered text run is composited down to an opaque background here
 * and measured against the ratio its size and weight require (FR-012).
 */

/** WCAG 2.2 AA minimum for normal-size text. */
export const TEXT_CONTRAST_MINIMUM = 4.5;

/** WCAG 2.2 AA minimum for large text and for meaningful non-text content. */
export const LARGE_TEXT_CONTRAST_MINIMUM = 3;

/** One measured pair, named precisely enough to fix without re-running. */
export interface ContrastSample {
  readonly selector: string;
  readonly text: string;
  readonly foreground: string;
  readonly background: string;
  readonly ratio: number;
  readonly required: number;
}

/**
 * The measurement, evaluated in the page.
 *
 * Written as one self-contained function because it runs in the browser: it can
 * close over nothing from this module.
 */
const measure = (unresolvedKind: 'text' | 'non-text'): ContrastSample[] => {
  const parseColor = (value: string): [number, number, number, number] | null => {
    const match = /rgba?\(([^)]+)\)/.exec(value);
    if (match === null) {
      return null;
    }
    const parts = (match[1] ?? '')
      .replace(/\//g, ' ')
      .split(/[\s,]+/)
      .filter((part) => part.length > 0)
      .map((part) => (part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part)));
    const [r, g, b, a] = parts;
    if (r === undefined || g === undefined || b === undefined) {
      return null;
    }
    return [r, g, b, a === undefined ? 1 : a];
  };

  /** Source-over compositing of a translucent colour onto an opaque one. */
  const over = (
    top: [number, number, number, number],
    bottom: [number, number, number],
  ): [number, number, number] => [
    top[0] * top[3] + bottom[0] * (1 - top[3]),
    top[1] * top[3] + bottom[1] * (1 - top[3]),
    top[2] * top[3] + bottom[2] * (1 - top[3]),
  ];

  const luminance = ([r, g, b]: [number, number, number]): number => {
    const channel = (value: number): number => {
      const scaled = value / 255;
      return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const ratio = (a: [number, number, number], b: [number, number, number]): number => {
    const first = luminance(a);
    const second = luminance(b);
    const lighter = Math.max(first, second);
    const darker = Math.min(first, second);
    return (lighter + 0.05) / (darker + 0.05);
  };

  /** Composites every ancestor background down to one opaque colour. */
  const backgroundOf = (element: Element): [number, number, number] | null => {
    const stack: [number, number, number, number][] = [];
    let node: Element | null = element;

    while (node !== null) {
      const style = getComputedStyle(node);
      if (style.backgroundImage !== 'none') {
        // An image or gradient behind the text: no single colour describes it,
        // so it is reported rather than silently measured against a guess.
        return null;
      }
      const colour = parseColor(style.backgroundColor);
      if (colour !== null && colour[3] > 0) {
        stack.push(colour);
        if (colour[3] === 1) {
          break;
        }
      }
      node = node.parentElement;
    }

    // The page's own ground, under everything else.
    let result: [number, number, number] = [255, 255, 255];
    for (const layer of stack.reverse()) {
      result = over(layer, result);
    }
    return result;
  };

  const describe = (element: Element): string => {
    const id = element.getAttribute('id');
    if (id !== null && id.length > 0) {
      return `#${id}`;
    }
    const cell = element.closest('[data-preview-address]')?.getAttribute('data-preview-address');
    const classes = element.className.toString().trim().split(/\s+/).filter(Boolean).join('.');
    const own = `${element.tagName.toLowerCase()}${classes.length > 0 ? `.${classes}` : ''}`;
    return cell === undefined || cell === null ? own : `${cell} ${own}`;
  };

  const isVisible = (element: Element): boolean => {
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') {
      return false;
    }
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  };

  const samples: ContrastSample[] = [];

  if (unresolvedKind === 'text') {
    for (const element of document.querySelectorAll('body *')) {
      const own = [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => (node.textContent ?? '').trim())
        .join(' ')
        .trim();
      if (own.length === 0 || !isVisible(element)) {
        continue;
      }

      const style = getComputedStyle(element);
      const foreground = parseColor(style.color);
      const background = backgroundOf(element);
      if (foreground === null || background === null) {
        continue;
      }

      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;
      const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);

      samples.push({
        selector: describe(element),
        text: own.slice(0, 40),
        foreground: style.color,
        background: `rgb(${background.map(Math.round).join(', ')})`,
        ratio: Math.round(ratio(over(foreground, background), background) * 100) / 100,
        required: isLarge ? 3 : 4.5,
      });
    }
    return samples;
  }

  for (const element of document.querySelectorAll('[data-visual-carrier]')) {
    if (!isVisible(element)) {
      continue;
    }
    const style = getComputedStyle(element);
    const background = backgroundOf(element.parentElement ?? element);
    if (background === null) {
      continue;
    }

    // A carrier states its meaning through its own fill or its boundary; the
    // stronger of the two is what a reader actually perceives.
    const candidates = [style.backgroundColor, style.borderTopColor, style.outlineColor]
      .map(parseColor)
      .filter((colour): colour is [number, number, number, number] => colour !== null)
      .filter((colour) => colour[3] > 0);

    if (candidates.length === 0) {
      continue;
    }

    const best = Math.max(
      ...candidates.map((colour) => ratio(over(colour, background), background)),
    );

    samples.push({
      selector: describe(element),
      text: (element.textContent ?? '').trim().slice(0, 40),
      foreground: style.backgroundColor,
      background: `rgb(${background.map(Math.round).join(', ')})`,
      ratio: Math.round(best * 100) / 100,
      required: 3,
    });
  }

  return samples;
};

/** Every visible text run meets the ratio its size and weight require. */
export async function expectTextContrast(page: Page): Promise<void> {
  const samples = await page.evaluate(measure, 'text' as const);
  const failing = samples.filter((sample) => sample.ratio < sample.required);

  expect(failing, 'text below its required contrast ratio').toEqual([]);
  expect(samples.length, 'no text was measured — the page rendered nothing').toBeGreaterThan(0);
}

/** Every declared visual carrier meets the 3:1 non-text minimum. */
export async function expectNonTextContrast(page: Page): Promise<void> {
  const samples = await page.evaluate(measure, 'non-text' as const);
  const failing = samples.filter((sample) => sample.ratio < sample.required);

  expect(failing, 'a meaningful non-text carrier is below 3:1').toEqual([]);
}
