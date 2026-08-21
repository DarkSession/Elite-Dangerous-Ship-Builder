import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { PowerPriority } from '../../application/outfitting/build-edit-intent';
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
 * Every ledger row on both canvases carries a priority control, and canvas 1c
 * titles it `Power priority 3`. That title is the whole accessible name there —
 * a tooltip on a `div`, on a row that is itself clickable. Here it is a named
 * `select` and a named checkbox, each naming the module *and* its mount, so a
 * reader moving down forty rows of a ledger knows which one they are on.
 *
 * The numbers are the ones the game's own outfitting panel shows: 1 to 5. The
 * package counts the same five groups from zero, and the translation happens
 * exactly here — once, at the control — so nothing downstream has to remember
 * which convention it is holding (contract, "Operations").
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

  /** Empty until a group is chosen, so absence is never drawn as group 1. */
  readonly selectedValue = computed(() => {
    const priority = this.priority();
    return priority === undefined ? '' : String(priority);
  });

  readonly absentLabel = this.#messages.messageSignal('outfitting.power.priority.absent');

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
    return this.#messages.message('outfitting.power.priority.option', { group: group + 1 });
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
