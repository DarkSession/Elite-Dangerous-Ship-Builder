import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * One tool, offered as a destination.
 *
 * The whole card is the link, as the canvas draws it (`.design/Home.dc.html`,
 * artboards `1a` and `1b`): a `.hm-tool` anchor carrying the tool's name, the
 * subjects it covers and what it does. Its accessible name is the tool's name
 * alone — the subjects and the description are inside it and are read after it,
 * so a reader moving through a link list hears two tool names rather than two
 * paragraphs.
 *
 * **Both descriptions are in the document at every width, and the stylesheet
 * shows one.** The canvas states the tool one way at 1440px and a shorter way
 * at 390px, and this renders both because choosing between them from a measured
 * width would make what the card says depend on when it rendered. The hidden
 * one is `display: none` rather than visually hidden: a reader that met both
 * would hear every tool described twice, which is worse than either alone.
 *
 * A real `href` with an intent beside it, as the shell's own tool tabs are
 * (`app-frame.html`). The address is on the element, so a middle-click, a
 * modifier-click and a copied link behave; the screen that owns the card
 * decides whether an ordinary click becomes a router navigation. This component
 * navigates nothing itself (constitution III).
 */
@Component({
  selector: 'edsb-tool-card',
  templateUrl: './tool-card.html',
  styleUrl: './tool-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolCard {
  /** The tool's name, and the link's accessible name. */
  readonly name = input.required<string>();

  /** Where activating the card goes. */
  readonly href = input.required<string>();

  /** The subjects the tool covers, already joined in the active locale. */
  readonly subjects = input.required<string>();

  /** What the tool does, as the wide artboard states it. */
  readonly summary = input.required<string>();

  /** The same tool in the one line the compact artboard has room for. */
  readonly short = input.required<string>();

  /** The card was activated. The screen decides what that means. */
  readonly opened = output<MouseEvent>();
}
