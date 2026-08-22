import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { PowerPriority } from '../../application/outfitting/build-edit-intent';
import { Formatters } from '../../i18n/formatters/formatters';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';

/** What the controls ask the workspace to do. */
export type PowerIntent =
  | { readonly kind: 'setEnabled'; readonly enabled: boolean }
  | { readonly kind: 'setPriority'; readonly priority: PowerPriority };

/** The five groups the outfitting panel numbers 1–5. */
const GROUPS: readonly PowerPriority[] = [0, 1, 2, 3, 4];

/**
 * Whether a module is powered, and which group it drops in.
 *
 * This is the chip both canvases draw at the end of every ledger row and
 * nowhere else: a hairline box holding a coloured dot and a bare number, with
 * the whole of its wording in the reference's own tooltip — `Power priority 3`,
 * and on the wide canvas `Power priority — click the dot to unpower this
 * module`. The dot is the switch and the number is the group. There is no word
 * `group` on either canvas and none is written here; the number is the label,
 * exactly as the game's own outfitting panel shows it.
 *
 * A tooltip on a `div` is the whole accessible name in the reference, on a row
 * that is itself clickable. Here the dot is a named checkbox and the number a
 * named `select`, each naming the module *and* its mount, so a reader moving
 * down forty rows of a ledger knows which one they are on. Those names are
 * invisible and cost the design nothing (design-canvas rule).
 *
 * The numbers shown are 1 to 5. The package counts the same five groups from
 * zero, and the translation happens exactly here — once, at the control — so
 * nothing downstream has to remember which convention it is holding (contract,
 * "Operations").
 *
 * An absent group is left absent. The package reports `undefined` for a module
 * whose source never stated one, and selecting a group on the Commander's
 * behalf so the control has something to show would be a decision nobody made
 * (FR-014, data model "FittedModuleView").
 */
@Component({
  selector: 'edsb-power-controls',
  templateUrl: './power-controls.html',
  styleUrl: './power-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerControls {
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  /** The mount's drawn label, for the control names. */
  readonly slotLabel = input.required<string>();

  /** The fitted module's name, for the control names. */
  readonly moduleLabel = input.required<string>();

  /** `undefined` means the source never said. The package treats it as on. */
  readonly enabled = input<boolean | undefined>(undefined);

  /** The package's zero-based group, or `undefined` when absent. */
  readonly priority = input<PowerPriority | undefined>(undefined);

  readonly canSetEnabled = input(true);
  readonly canSetPriority = input(true);

  readonly intent = output<PowerIntent>();

  readonly groups = GROUPS;
  readonly priorityId = relationId('power-priority');

  /** What the switch shows. Absent reads as on, which is what the package does. */
  readonly isOn = computed(() => this.enabled() ?? true);

  /** What the control shows when the package states no group at all. */
  readonly absentLabel = this.#messages.messageSignal('unavailable.value');

  readonly enabledLabel = computed(() =>
    this.#messages.message('outfitting.power.enabled', {
      module: this.moduleLabel(),
      slot: this.slotLabel(),
    }),
  );

  readonly priorityLabel = computed(() =>
    this.#messages.message('outfitting.power.priority', {
      module: this.moduleLabel(),
      slot: this.slotLabel(),
    }),
  );

  /** The group as a Commander reads it: one-based, exactly as the game shows. */
  groupLabel(group: PowerPriority): string {
    return this.#formatters.integer(group + 1);
  }

  toggle(event: Event): void {
    this.intent.emit({ kind: 'setEnabled', enabled: (event.target as HTMLInputElement).checked });
  }

  choose(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    // The empty option, tested as the empty string rather than through a number.
    // `Number('')` is `0`, which is a real group — so converting first would
    // turn "no group has been chosen" into "put it in group 1" (FR-014).
    if (raw === '') {
      return;
    }
    const value = Number(raw);
    if (!GROUPS.includes(value as PowerPriority)) {
      return;
    }
    this.intent.emit({ kind: 'setPriority', priority: value as PowerPriority });
  }
}
