import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { GameText } from '../components/game-text/game-text';
import { relationId } from '../a11y/text-equivalence';

/** The value the explicit no-blueprint option carries. */
export const NO_BLUEPRINT_CHOICE = 'none';

/** One recipe the package offers this mount, ready to draw. */
export interface BlueprintChoiceView {
  /** The package's own `fdname`. The only identity anything is chosen by. */
  readonly fdname: string;
  readonly name: GameTextPresentation;
  /** The package's route. `'mercenary'` means it needs that purchase. */
  readonly route: 'ordinary' | 'mercenary';
  /** True when this is the recipe the module already carries. */
  readonly applied: boolean;
}

/**
 * Which recipe to engineer with — including not to.
 *
 * Both canvases draw the same list and both open it with `None — stock module ·
 * REMOVES ENGINEERING`. That first option is not decoration: it is the only
 * route to clearing ordinary engineering at either width, which is why the
 * canvas's wide-only `CLEAR ✕` header control was withdrawn rather than
 * mirrored (engineering editor design, "Clearing engineering").
 *
 * The canvas draws the wide composition as a dropdown and the compact one as a
 * list of cards. Both are this: native radios in a named group. A dropdown that
 * has to show a description under each option is a listbox reimplemented in
 * `div`s, and the two compositions would then differ in what they offer —
 * which is exactly the asymmetry constitution V forbids.
 *
 * No option carries a `DAMAGE ▲ · THERMAL LOAD ▲` line. The Almanac publishes
 * no description for a blueprint and no direction for what it moves, so the
 * canvas's summary would have to be written here — a private claim about game
 * mechanics, which FR-007 forbids. What each recipe does is shown instead in
 * the comparison the draft actually computes.
 */
@Component({
  selector: 'edsb-blueprint-choice-list',
  imports: [GameText],
  templateUrl: './blueprint-choice-list.html',
  styleUrl: './blueprint-choice-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlueprintChoiceList {
  readonly #messages = inject(MessageService);

  readonly choices = input.required<readonly BlueprintChoiceView[]>();

  /** The selected `fdname`, `'none'`, or `null` for nothing chosen yet. */
  readonly selected = input<string | null>(null);

  /**
   * What clearing would also cost, when the package would lose something by it.
   *
   * Shown on the no-blueprint option itself rather than behind a confirmation,
   * because it is a fact about that option and a Commander reading the list is
   * exactly who needs it (FR-012).
   */
  readonly clearConsequence = input<string | null>(null);

  /** Emits the chosen `fdname`, or `'none'`. */
  readonly chosen = output<string>();

  readonly noBlueprint = NO_BLUEPRINT_CHOICE;

  readonly groupName = relationId('blueprint-choice');

  readonly legend = this.#messages.messageSignal('outfitting.engineering.blueprint.legend');
  readonly noneLabel = this.#messages.messageSignal('outfitting.engineering.blueprint.none');
  readonly noneDescription = this.#messages.messageSignal(
    'outfitting.engineering.blueprint.none-description',
  );
  readonly appliedLabel = this.#messages.messageSignal('outfitting.engineering.applied');
  readonly mercenaryLabel = this.#messages.messageSignal(
    'outfitting.engineering.blueprint.route.mercenary',
  );

  /** True when the Commander has asked to remove the engineering. */
  readonly clearing = computed(() => this.selected() === NO_BLUEPRINT_CHOICE);

  /** The accessible name of one option: the recipe, and what it is here. */
  readonly nameFor = (choice: BlueprintChoiceView): string =>
    this.#messages.message('outfitting.engineering.blueprint.choose', {
      blueprint: choice.name.text ?? choice.fdname,
    });
}
