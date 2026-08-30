import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';
import { GameText } from '../components/game-text/game-text';
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
 *
 * Two shapes, and the menu is the application's own rather than the platform's.
 * A native option holds one run of text, so a description could only be joined
 * onto the name, and the menu became thirteen sentences (Commander request
 * 2026-08-30). The menu draws the two lines the card list draws, at the same
 * two steps, and states its own roles: a button that names the chosen effect
 * and says whether its list is open, over a listbox whose options each say
 * whether they are the selected one.
 */
@Component({
  selector: 'edsb-experimental-effect-list',
  imports: [GameText],
  templateUrl: './experimental-effect-list.html',
  styleUrl: './experimental-effect-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // A press anywhere else shuts the menu. `pointerdown` rather than `click`,
    // so the press that lands on the trigger while the menu is open is seen
    // here first, found to be inside, and left for the trigger's own toggle —
    // which would otherwise re-open what this had just shut.
    '(document:pointerdown)': 'dismissOutside($event)',
  },
})
export class ExperimentalEffectList {
  readonly #messages = inject(MessageService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly effects = input.required<readonly ExperimentalEffectView[]>();

  /** True where the editor has room for canvas 1c's menu rather than cards. */
  readonly asDropdown = input(false);

  /** The selected effect `fdname`, or `null` for the explicit no-effect. */
  readonly selected = input<string | null>(null);

  /** Emits the chosen `fdname`, or `null` for no effect. */
  readonly chosen = output<string | null>();

  readonly noEffect = NO_EFFECT_CHOICE;

  readonly groupName = relationId('effect-choice');
  readonly labelId = relationId('effect-menu-label');
  readonly triggerId = relationId('effect-menu-trigger');
  readonly listId = relationId('effect-menu-list');

  /**
   * What names the trigger: the control's own label, then the effect on it.
   *
   * Both, because either alone is half the answer — the label says which choice
   * this is and the value says what it currently holds.
   */
  readonly triggerNameIds = `${this.labelId} ${this.triggerId}`;

  readonly legend = this.#messages.messageSignal('outfitting.engineering.effect.legend');
  readonly noneLabel = this.#messages.messageSignal('outfitting.engineering.effect.none');
  readonly appliedLabel = this.#messages.messageSignal('outfitting.engineering.applied');

  readonly #open = signal(false);

  /** Whether the menu's list is drawn. Only the menu shape has one. */
  readonly open = this.#open.asReadonly();

  /**
   * The chosen effect, for the trigger. `null` where nothing is chosen, which
   * the trigger reads as `None` — an application string rather than game text.
   *
   * The name is handed over as the package presented it, so the trigger draws
   * it through `edsb-game-text` exactly as the options below it do: an effect
   * the catalogue has no translation for is disclosed as untranslated and
   * carries the language it is actually in, rather than being presented as a
   * translation (constitution VI, FR-020). Printing `name.text` here would have
   * been the one place in this control where that disclosure was dropped.
   *
   * An effect that is not among the ones offered is `null` too. The draft only
   * ever selects from that list — a selection that has fallen off the package's
   * menu is no selection — so this is a floor rather than a case, and the floor
   * is `None` rather than the raw symbol, which is never a display name.
   */
  readonly triggerEffect = computed<ExperimentalEffectView | null>(() => {
    const selected = this.selected();
    if (selected === null) {
      return null;
    }
    return this.effects().find((candidate) => candidate.fdname === selected) ?? null;
  });

  constructor() {
    // The list is drawn in the menu shape alone, so a menu left open while the
    // editor changed shape would come back open when the shape came back. It
    // holds no selection of its own — choosing an option is the edit — so
    // shutting it is the whole reset.
    effect(() => {
      this.asDropdown();
      this.#open.set(false);
    });
  }

  toggle(): void {
    this.#open.update((open) => !open);
  }

  /** Choosing is the edit, exactly as it was in the native menu. */
  choose(fdname: string | null): void {
    this.#open.set(false);
    this.chosen.emit(fdname);
  }

  dismissOutside(event: Event): void {
    const target = event.target;
    if (!this.#open() || !(target instanceof Node)) {
      return;
    }
    if (!this.#host.nativeElement.contains(target)) {
      this.#open.set(false);
    }
  }

  readonly nameFor = (effect: ExperimentalEffectView): string =>
    this.#messages.message('outfitting.engineering.effect.choose', {
      effect: effect.name.text ?? effect.fdname,
    });
}
