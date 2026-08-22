import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { GameText } from '../components/game-text/game-text';
import { SelectField, type SelectOption } from '../components/select-field/select-field';
import { relationId } from '../a11y/text-equivalence';

/** The value the explicit no-effect option carries. */
export const NO_EFFECT_CHOICE = '';

/** One experimental effect the package offers this mount. */
export interface ExperimentalEffectView {
  readonly fdname: string;
  readonly name: GameTextPresentation;
  /** The package's own description of what it does. May be unavailable. */
  readonly description: GameTextPresentation;
  readonly applied: boolean;
}

/**
 * Which experimental effect to apply — including none.
 *
 * Both canvases open the list with `None — remove effect`, and that option is
 * the whole route to removing one. Choosing it and applying preserves the
 * blueprint and grade underneath, because it dispatches the package's
 * effect-only operation rather than re-applying the recipe (FR-012).
 *
 * Unlike the blueprint list, each option here *does* carry a description: the
 * Almanac publishes one per effect, so the canvas's `−3% ENEMY HULL RESIST ·
 * −20% AMMO` line is package text rather than a claim of ours. Where the
 * package has none, the row says so instead of going quiet.
 */
@Component({
  selector: 'edsb-experimental-effect-list',
  imports: [GameText, SelectField],
  templateUrl: './experimental-effect-list.html',
  styleUrl: './experimental-effect-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperimentalEffectList {
  readonly #messages = inject(MessageService);

  readonly effects = input.required<readonly ExperimentalEffectView[]>();

  /** True where the editor has room for canvas 1c's dropdown rather than cards. */
  readonly asDropdown = input(false);

  /** The selected effect `fdname`, or `null` for the explicit no-effect. */
  readonly selected = input<string | null>(null);

  /** Emits the chosen `fdname`, or `null` for no effect. */
  readonly chosen = output<string | null>();

  readonly noEffect = NO_EFFECT_CHOICE;

  readonly groupName = relationId('effect-choice');

  readonly legend = this.#messages.messageSignal('outfitting.engineering.effect.legend');
  readonly noneLabel = this.#messages.messageSignal('outfitting.engineering.effect.none');
  readonly appliedLabel = this.#messages.messageSignal('outfitting.engineering.applied');

  /** The dropdown's options, each carrying the package's own description. */
  readonly options = computed<readonly SelectOption[]>(() => [
    { value: NO_EFFECT_CHOICE, label: this.noneLabel() },
    ...this.effects().map((effect) => {
      const name = effect.name.text ?? effect.fdname;
      const description = effect.description.text;
      return {
        value: effect.fdname,
        label: description === null ? name : `${name} · ${description}`,
      };
    }),
  ]);

  readonly nameFor = (effect: ExperimentalEffectView): string =>
    this.#messages.message('outfitting.engineering.effect.choose', {
      effect: effect.name.text ?? effect.fdname,
    });
}
