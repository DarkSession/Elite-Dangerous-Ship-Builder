import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../../i18n/game-text.presenter';
import { GameText } from '../game-text/game-text';

/** One stored build, as the library's list draws it. */
export interface SavedBuild {
  readonly id: string;
  /**
   * What the row is titled.
   *
   * A Commander's own name where they gave one. Where they did not, whoever
   * builds this says what the build calls itself instead — never an invented
   * name, and never written onto the record (FR-010).
   */
  readonly title: string;
  /** Whether that title is a name a Commander gave, rather than one derived. */
  readonly named: boolean;
  /** The one line beneath the title: a note, or which save these edits are of. */
  readonly note: string | null;
  readonly hull: GameTextPresentation;
  /**
   * How long ago the build was last edited, in the active locale's own words.
   *
   * The column is read to tell the recent build from the old one, and a column
   * of absolute instants makes a reader do that arithmetic on every row — which
   * is why the canvas draws `2 d ago` there and why this row does now
   * (FR-010, clarification 2026-08-27).
   */
  readonly modified: string;

  /**
   * The instant itself, as a sentence naming what it is.
   *
   * Read rather than drawn, with the row's other read-not-drawn facts: "3 weeks
   * ago" answers which of these is the recent one and not when exactly, and the
   * exact answer is not something to lose to a shorter column. A sentence
   * rather than a bare date, because the column header that would name it is
   * `aria-hidden` and every other fact in that span says what it is.
   */
  readonly modifiedExact: string;
  /** The package's verdict when the build was saved, in words. */
  readonly validation: { readonly label: string; readonly tone: 'success' | 'warning' | 'error' };
  /** How many issues that verdict counted, or `null` where it counted none. */
  readonly issues: { readonly count: string; readonly label: string } | null;
  /** How long an unnamed record has left, in words. `null` for a named one. */
  readonly remaining: string | null;
  /** True for the record the workspace is holding right now. */
  readonly current: boolean;
  /** "Current build" — the marker's meaning, in words rather than in amber. */
  readonly currentLabel: string;
  /** The whole action of choosing this row, in words. */
  readonly chooseLabel: string;
}

/**
 * One row of the library.
 *
 * **Rebuilt to the canvas 2026-08-25.** This was a card in a grid, carrying its
 * own field labels and its own row of buttons. The reference draws a dense row
 * under shared column headers, with the actions committed from a footer that
 * acts on the chosen row — which is what makes a library of a week's building
 * readable rather than a wall of panels (build-library design, "The library is
 * not built to the canvas").
 *
 * Two states are carried here and neither is carried by colour alone. The
 * record the workspace holds is `aria-current` and says so in words; the
 * recorded validation is a count on a warm plate with its own words beside it
 * (FR-010).
 */
@Component({
  selector: 'edsb-saved-build-card',
  imports: [GameText],
  templateUrl: './saved-build-card.html',
  styleUrl: './saved-build-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedBuildCard {
  readonly build = input.required<SavedBuild>();

  /** True while this is the row the footer's actions would act on. */
  readonly chosen = input(false);

  readonly chose = output<string>();

  choose(): void {
    this.chose.emit(this.build().id);
  }
}
