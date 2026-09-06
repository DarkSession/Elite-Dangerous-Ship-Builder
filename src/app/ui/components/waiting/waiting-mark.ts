import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The mark a screen draws while it waits, and nothing else.
 *
 * Decoration: it is hidden from a reader, and the screen that draws it says in
 * words what is on its way. One component so that the file, its size and how it
 * behaves for a Commander who asked for less motion are decided once
 * (011/FR-029).
 *
 * The file is a copy of EDAssets' `EDLoader1.svg`, not a link to it — nothing
 * this application draws is fetched from another host at runtime. It carries
 * its own reduced-motion rule, because an SVG loaded through `img` is a
 * separate document that this application's stylesheet does not reach.
 */
@Component({
  selector: 'ednb-waiting-mark',
  templateUrl: './waiting-mark.html',
  styleUrl: './waiting-mark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitingMark {
  /** The mark, served from this origin like every other asset. */
  readonly source = 'assets/loader.svg';
}
