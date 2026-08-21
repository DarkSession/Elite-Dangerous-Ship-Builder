import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { SlotCapabilities } from '../../application/outfitting/outfitting-state';
import type { SlotView } from '../../application/outfitting/slot-view';
import type { MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';
import { ModuleIdentityBadge } from './module-identity-badge';
import { PowerControls, type PowerIntent } from './power-controls';

/** What a card asks the workspace to do. Deciding whether it happens is not its job. */
export type SlotCardIntent =
  | { readonly kind: 'select' }
  | { readonly kind: 'replace' }
  | { readonly kind: 'engineer' }
  | { readonly kind: 'remove' }
  | PowerIntent;

/**
 * One mount in the ledger.
 *
 * The canvas draws a row: a size number, a node badge for hardpoints, the
 * module's name over its code line, an engineered marker, and a power-priority
 * control. This renders exactly that, with three changes the reference cannot
 * make for itself.
 *
 * **The row is not a control.** The canvas's row is a clickable `div` wrapped
 * around a clickable priority `div`, which is a control inside a control — a
 * reader cannot tell which one they are on and a pointer cannot reliably hit
 * the inner one. Selection, replacement and power are separate named controls
 * instead (reference review, "Interaction and semantics").
 *
 * **The slot key is not visible text.** Neither canvas draws one; they draw
 * `SIZE · NODE NO.`. The exact key is the identity everything else uses, so it
 * is carried as `visually-hidden` text and as a `data-slot-key` attribute the
 * anatomy exchanges — the invisible accessibility floor, not an addition to the
 * design (reference review, "Visible slot key").
 *
 * **The engineered marker is not an icon alone.** The canvas uses a small
 * glyph; a glyph is not readable and disappears in forced colours, so the
 * engineering is also stated in the code line where the canvas already writes
 * `OVERCHARGED G5` (FR-010 of feature 011).
 */
@Component({
  selector: 'edsb-slot-card',
  imports: [ModuleIdentityBadge, PowerControls],
  templateUrl: './slot-card.html',
  styleUrl: './slot-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotCard {
  readonly #messages = inject(MessageService);

  readonly slot = input.required<SlotView>();
  readonly capabilities = input.required<SlotCapabilities>();
  readonly selected = input(false);

  /** The engineering summary the code line carries, already localized. */
  readonly engineeringSummary = input<string | null>(null);

  /** Acquisition and entitlement labels, already localized. */
  readonly labels = input<readonly string[]>([]);

  readonly intent = output<SlotCardIntent>();

  readonly identityId = relationId('slot-identity');

  /** The drawn label: kind, size and, for a hardpoint, the node number. */
  readonly drawnLabel = computed(() => {
    const slot = this.slot();
    const kind = this.#messages.message(kindKey(slot.kind));
    const size =
      slot.size === null
        ? null
        : this.#messages.message('outfitting.slot.size', {
            size: slot.size,
          });
    const node =
      slot.kind === 'hardpoint'
        ? this.#messages.message('outfitting.slot.node', { node: slot.node })
        : null;
    return [kind, size, node].filter((part): part is string => part !== null).join(' · ');
  });

  /** The exact game slot key, for assistive technology only. */
  readonly identityText = computed(() =>
    this.#messages.message('outfitting.slot.identity', { slot: this.slot().key }),
  );

  readonly emptyLabel = this.#messages.messageSignal('outfitting.slot.empty');
  readonly selectedLabel = this.#messages.messageSignal('outfitting.slot.selected');
  readonly replaceLabel = this.#messages.messageSignal('outfitting.capability.replace');
  readonly engineerLabel = this.#messages.messageSignal('outfitting.capability.engineer');
  readonly removeLabel = this.#messages.messageSignal('outfitting.capability.remove');

  readonly selectLabel = computed(() =>
    this.#messages.message('outfitting.slot.select', { slot: this.drawnLabel() }),
  );

  /**
   * The short marker the ledger carries for a mount that cannot be emptied.
   *
   * Canvas 1d writes `FIXED` beside the cargo hatch and nothing longer: the
   * ledger is a ledger, and a full sentence repeated down every core row is
   * noise a Commander scrolls past rather than reads. The Almanac's whole
   * reason is published on the selected mount's bench, where it answers the
   * question a Commander is actually asking (FR-009).
   */
  readonly immovableMarker = computed(() => {
    const reason = this.slot().immovableReason;
    if (reason === null) {
      return null;
    }
    const key: MessageKey = (
      {
        cargoHatch: 'outfitting.immovable.short.cargoHatch',
        requiredSlot: 'outfitting.immovable.short.requiredSlot',
        moduleLimit: 'outfitting.immovable.short.moduleLimit',
      } as const
    )[reason];
    return this.#messages.message(key);
  });

  readonly restrictionText = computed(() => {
    const restriction = this.slot().restrictionText;
    return restriction === null || restriction.text === null
      ? null
      : this.#messages.message('outfitting.slot.restriction', { restriction: restriction.text });
  });

  /**
   * The module's name, for the power controls to name what they act on.
   *
   * A ledger is forty rows of the same two controls, so "powered" on its own
   * says nothing about which module. Falls back to the mount's own label where
   * the package resolves no name, rather than to a bare symbol.
   */
  readonly moduleLabel = computed(() => this.slot().module?.displayName.text ?? this.drawnLabel());

  /** True where the package offers power on this mount at all. */
  readonly showsPower = computed(
    () =>
      this.slot().module !== null &&
      (this.capabilities().canSetEnabled || this.capabilities().canSetPriority),
  );

  emit(intent: SlotCardIntent): void {
    this.intent.emit(intent);
  }
}

/** The heading a mount kind sits under. */
function kindKey(kind: SlotView['kind']): MessageKey {
  return (
    {
      hardpoint: 'outfitting.group.hardpoint',
      utility: 'outfitting.group.utility',
      armour: 'outfitting.group.armour',
      core: 'outfitting.group.core',
      optional: 'outfitting.group.optional',
      cargoHatch: 'outfitting.group.cargoHatch',
    } as const
  )[kind];
}
