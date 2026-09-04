import { Injectable, inject } from '@angular/core';
import type { NavigationEntry, ToolEntry } from '../../ui/components/app-frame/app-frame';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';

/** The routes the shell offers from every screen. */
export const NAVIGATION_ROUTES = {
  catalogue: '/ships',
  build: '/build',
  equipment: '/equipment',
} as const;

/** One tool this application carries, as the shell reads it. */
interface ToolRecord {
  readonly id: string;
  /**
   * The name the bar draws in the tool's tab.
   *
   * The tool's full name, as canvas 4c draws it. A short form was tried, on the
   * reasoning that the deck below already names the screen; a tab that says
   * `Ship` where the product's tool is `Ship Builder` names a different thing
   * (Commander request 2026-09-02).
   */
  readonly labelKey: MessageKey;
  /** The address the tool opens at. */
  readonly href: string;
  /**
   * The route prefixes the tool owns.
   *
   * What decides which tool is current, rather than the address it opens at: a
   * Commander outfitting a hull at `/build` is still in the ship tool, and a
   * bar that stopped naming it there would state something untrue.
   */
  readonly routes: readonly string[];
  /**
   * The subjects the tool covers, as one already-joined string.
   *
   * `SHIPYARD · OUTFITTING · ANATOMY · POWER` on the canvas. A list would make
   * the separator this application's decision in every language, and a language
   * that punctuates a series differently would be handed a middle dot it does
   * not use. One string per locale lets the translator write the series their
   * language writes.
   */
  readonly subjectsKey: MessageKey;
  /** What the tool does, as the wide artboard states it. */
  readonly summaryKey: MessageKey;
  /** The same tool in the one line the compact artboard has room for. */
  readonly shortSummaryKey: MessageKey;
}

/**
 * One tool as the start page offers it: already localized, ready to render.
 *
 * Both descriptions travel together. Which one a Commander reads is a
 * composition question the stylesheet answers, so nothing here chooses — a
 * width read in TypeScript would make the answer depend on when the card
 * happened to render (`design/reference-review.md`).
 */
export interface ToolCard {
  readonly id: string;
  readonly name: string;
  readonly href: string;
  readonly subjects: string;
  readonly summary: string;
  readonly short: string;
}

/**
 * The tools this application carries.
 *
 * One array, read by everything that names a tool. The canvas draws its tabs
 * and its tool grid off a single registry, so a tool the application gains is a
 * tool every chrome that names one gains at the same time.
 *
 * It holds the tools the application *serves*, not the ones it plans to. The
 * canvas names eight and `docs/navbeacon-migration.md` names two; what answers
 * an address is the ship builder and the equipment builder, so that is what is
 * here. A tab that opens nothing is a control for a thing that does not exist
 * (011/FR-028).
 *
 * The saved-record library is the ship tool's, because that is where a
 * Commander reaches it from the shipyard. It holds both tools' records
 * (013/FR-016), and the row states which tool made it.
 */
const TOOLS: readonly ToolRecord[] = [
  {
    id: 'ship',
    labelKey: 'tools.ship',
    href: NAVIGATION_ROUTES.catalogue,
    routes: [NAVIGATION_ROUTES.catalogue, NAVIGATION_ROUTES.build],
    subjectsKey: 'tools.ship.subjects',
    summaryKey: 'tools.ship.summary',
    shortSummaryKey: 'tools.ship.short',
  },
  {
    id: 'equipment',
    labelKey: 'tools.equipment',
    href: NAVIGATION_ROUTES.equipment,
    routes: [NAVIGATION_ROUTES.equipment],
    subjectsKey: 'tools.equipment.subjects',
    summaryKey: 'tools.equipment.summary',
    shortSummaryKey: 'tools.equipment.short',
  },
];

/**
 * Where the shell can send a Commander, in one place.
 *
 * Two tools and the way home. There is no third list: the saved builds were the
 * one entry the primary navigation ever held, and they became a shell action
 * when they stopped being a place with an address (Commander request
 * 2026-09-04, `build-library/library-presence.ts`). The frame's navigation row
 * went with them — an empty row that every screen drew and nothing filled.
 *
 * The screen a Commander is already on is never offered: the reference's
 * command bar names it once, on the leading edge, and never repeats it as a
 * control (canvas 1a/1b/1c).
 *
 * The build screen is not listed either. The reference reaches it by committing
 * to a hull or by opening a saved build, and draws no chip for it on any
 * artboard.
 */
@Injectable({ providedIn: 'root' })
export class AppNavigation {
  readonly #messages = inject(MessageService);

  /**
   * The address alone, without what is written after it.
   *
   * Both readings below are asked about a route, and what they are handed is a
   * URL: `Router` reports `urlAfterRedirects`, which carries the query and the
   * fragment. Every shared build and every shared loadout arrives as one —
   * `/build#s.…` and `/equipment#e.…` are how a link is opened — so a bar that
   * matched the whole string named no tool at all on the one screen a Commander
   * most often lands on from outside (Commander request 2026-09-04).
   */
  #address(url: string): string {
    return url.split(/[?#]/)[0] ?? url;
  }

  /**
   * The way back to the shipyard, carried by the bar's own insignia.
   *
   * No canvas draws a `SHIPYARD` chip on the outfitting bar. What every
   * artboard draws on the leading edge is the mark, and the 2026-08-26 revision
   * put it exactly where the word used to be — so the mark is the control, and
   * the word is not drawn twice. It keeps its `href`, so it can be opened in a
   * new tab and its address copied like any other link, and it carries the
   * screen name it goes to as its accessible name.
   *
   * Absent on the shipyard itself: a link to the screen a Commander is already
   * reading is not a way anywhere.
   */
  home(currentPath: string): NavigationEntry | null {
    if (this.#address(currentPath).startsWith(NAVIGATION_ROUTES.catalogue)) {
      return null;
    }
    return {
      id: 'catalogue',
      label: this.#messages.message('navigation.catalogue'),
      href: NAVIGATION_ROUTES.catalogue,
      current: false,
    };
  }

  /**
   * The tools the application carries, with the open route's own marked.
   *
   * The current tool is named rather than offered: `current` is what the frame
   * draws as text instead of a link, for the reason `home` is `null` on the
   * shipyard and `entries` drops the open screen. A link to the screen a
   * Commander is reading is not a way anywhere, and here it would be the second
   * control in one chrome opening the same address (011/FR-028).
   */
  tools(currentPath: string): readonly ToolEntry[] {
    const address = this.#address(currentPath);
    return TOOLS.map((tool) => ({
      id: tool.id,
      label: this.#messages.message(tool.labelKey),
      href: tool.href,
      current: tool.routes.some((route) => address === route || address.startsWith(`${route}/`)),
    }));
  }

  /**
   * Every tool the application carries, with what it is for.
   *
   * A second reading rather than an argument to `tools`, because the two answer
   * different questions. `tools` reports which tool is current and is asked on
   * every navigation; this reports what the tools *are* and is asked by the one
   * screen that offers a choice between them. There is no current tool there —
   * a Commander at the entry point is in none of them — so nothing here carries
   * a way to say one is.
   *
   * Same array, so a tool the application gains is a tool the bar and the entry
   * point gain together.
   */
  catalogue(): readonly ToolCard[] {
    return TOOLS.map((tool) => ({
      id: tool.id,
      name: this.#messages.message(tool.labelKey),
      href: tool.href,
      subjects: this.#messages.message(tool.subjectsKey),
      summary: this.#messages.message(tool.summaryKey),
      short: this.#messages.message(tool.shortSummaryKey),
    }));
  }
}
