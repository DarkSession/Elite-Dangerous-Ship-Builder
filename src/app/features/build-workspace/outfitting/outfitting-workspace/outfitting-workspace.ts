import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { SlotKind } from '@elite-dangerous-almanac/core/ships/slots';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import type { SlotView } from '../../../../application/outfitting/slot-view';
import { slotCapabilities } from '../../../../application/outfitting/slot-capabilities';
import { NO_SLOT_CAPABILITIES } from '../../../../application/outfitting/outfitting-state';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { MessageService } from '../../../../i18n/message.service';
import { relationId } from '../../../../ui/a11y/text-equivalence';
import { observeComposition } from '../../../../ui/outfitting/composition';
import { EditRefusalNotice } from '../../../../ui/outfitting/edit-refusal-notice';
import { SlotCard, type SlotCardIntent } from '../../../../ui/outfitting/slot-card';
import { SlotGroup, type SlotGroupView } from '../../../../ui/outfitting/slot-group';
import { ModuleReplacement } from '../module-replacement/module-replacement';

/** The category controls the canvas draws above the ledger. */
type Category = 'all' | SlotKind;

/**
 * The outfitting region inside feature 001's `/build`.
 *
 * Canvas 1c composes three regions at wide width — the categories and the
 * ledger, the selected mount's bench, and the status rail — and canvas 1d
 * stacks the same content with the bench as a full-screen layer. Both are the
 * same DOM in the same order; which one appears is decided in CSS from the
 * space the region is actually given, so 400% zoom and a long translation
 * select the compact composition for the same reason a narrow phone does
 * (responsive composition, "Reference and selection rule").
 *
 * The categories change what is *visible* and nothing else. They spend no
 * revision, record no history and are not part of the build — which is why the
 * ledger they filter is still the complete package ledger underneath (FR-018).
 *
 * The no-build state promises nothing. Creating and opening a build belong to
 * feature 001 and importing belongs to feature 004; this region says why it is
 * empty and stops there rather than offering an action it does not own (FR-001).
 */
@Component({
  selector: 'edsb-outfitting-workspace',
  imports: [EditRefusalNotice, ModuleReplacement, SlotCard, SlotGroup],
  templateUrl: './outfitting-workspace.html',
  styleUrl: './outfitting-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutfittingWorkspace {
  readonly #messages = inject(MessageService);
  readonly store = inject(OutfittingStore);

  /** Which mounts are listed. Visibility only; never build or history state. */
  readonly category = signal<Category>('all');

  /**
   * Which composition this region has room for.
   *
   * Most of the arrangement is CSS. This exists for the one decision CSS
   * cannot make: whether the bench is an inline region beside the ledger or a
   * full-screen layer that makes the rest of the page inert.
   */
  readonly composition = observeComposition();

  /** True where the bench has to become a layer rather than sit inline. */
  readonly benchIsLayer = computed(() => this.composition() === 'compact');

  readonly regionHeadingId = relationId('outfitting-region');

  readonly regionLabel = this.#messages.messageSignal('outfitting.region.label');
  readonly ledgerLabel = this.#messages.messageSignal('outfitting.ledger.label');
  readonly categoryLegend = this.#messages.messageSignal('outfitting.category.legend');
  readonly noBuildTitle = this.#messages.messageSignal('outfitting.no-build.title');
  readonly noBuildDescription = this.#messages.messageSignal('outfitting.no-build.description');
  readonly replaceLabel = this.#messages.messageSignal('outfitting.capability.replace');
  readonly engineerLabel = this.#messages.messageSignal('outfitting.capability.engineer');
  readonly removeLabel = this.#messages.messageSignal('outfitting.capability.remove');
  readonly noSelectionLabel = this.#messages.messageSignal('outfitting.bench.no-selection');

  /** The category controls, in the order the canvas draws them. */
  readonly categories = computed(() =>
    (['all', 'hardpoint', 'core', 'optional', 'utility'] as const).map((value) => ({
      value,
      label: this.#messages.message(categoryKey(value)),
      count: this.#countFor(value),
    })),
  );

  /** The visible mounts, grouped by kind in the package's own order. */
  readonly groups = computed<readonly SlotGroupView[]>(() => {
    const category = this.category();
    const groups: SlotGroupView[] = [];

    for (const slot of this.store.slots()) {
      if (category !== 'all' && slot.kind !== category) {
        continue;
      }
      const last = groups.at(-1);
      if (last !== undefined && last.kind === slot.kind) {
        (last.slots as SlotView[]).push(slot);
      } else {
        groups.push({ kind: slot.kind, slots: [slot] });
      }
    }

    return groups;
  });

  readonly selectedSlot = this.store.selectedSlot;
  readonly failure = this.store.lastEditFailure;
  readonly revision = this.store.revision;

  /** The label the ledger draws for the selected mount, for the notices. */
  readonly selectedSlotLabel = computed(() => {
    const slot = this.selectedSlot();
    return slot === null ? null : (slot.displayName.text ?? slot.canonicalName);
  });

  /** The canvas's `FITTING . HARDPOINT 1`, in the Commander's language. */
  readonly benchTitle = computed(() => {
    const slot = this.selectedSlot();
    return slot === null
      ? ''
      : this.#messages.message('outfitting.bench.title', {
          slot: slot.displayName.text ?? slot.canonicalName,
        });
  });

  /**
   * The Almanac's reason the selected mount offers less than the others.
   *
   * Shown where an action is absent, because an action missing without a
   * reason reads as a defect rather than as a rule of the game (FR-009).
   */
  readonly benchReason = computed(() => {
    const slot = this.selectedSlot();
    if (slot === null || slot.immovableReason === null) {
      return null;
    }
    const key: MessageKey = (
      {
        cargoHatch: 'outfitting.immovable.cargoHatch',
        requiredSlot: 'outfitting.immovable.requiredSlot',
        moduleLimit: 'outfitting.immovable.moduleLimit',
      } as const
    )[slot.immovableReason];
    return this.#messages.message(key);
  });

  readonly replacementOpen = computed(
    () => this.store.surface() === 'replacement' && this.selectedSlot() !== null,
  );

  /** What the package permits on one mount, re-read at the current revision. */
  capabilitiesFor(slot: SlotView) {
    this.store.revision();
    const loadout = this.store.loadout();
    return loadout === null ? NO_SLOT_CAPABILITIES : slotCapabilities(loadout, slot);
  }

  handle(slot: SlotView, intent: SlotCardIntent): void {
    switch (intent.kind) {
      case 'select':
        // Selecting is not a toggle. Pressing the selected row again would
        // empty the bench a Commander is reading, which is a state nobody asked
        // for; moving to another mount is how selection changes.
        this.store.select(slot.key);
        return;
      case 'replace':
        this.store.select(slot.key);
        this.store.showSurface('replacement');
        return;
      case 'engineer':
        this.store.select(slot.key);
        this.store.showSurface('engineering');
        return;
      case 'remove':
        this.store.dispatch({ kind: 'remove', slotKey: slot.key });
        return;
    }
  }

  closeSurface(): void {
    this.store.showSurface('workspace');
  }

  #countFor(category: Category): number {
    const slots = this.store.slots();
    return category === 'all'
      ? slots.length
      : slots.filter((slot) => slot.kind === category).length;
  }
}

/** The label one category control carries. */
function categoryKey(category: Category): MessageKey {
  return (
    {
      all: 'outfitting.category.all',
      hardpoint: 'outfitting.category.hardpoint',
      core: 'outfitting.category.core',
      optional: 'outfitting.category.optional',
      utility: 'outfitting.category.utility',
      armour: 'outfitting.group.armour',
      cargoHatch: 'outfitting.group.cargoHatch',
    } as const
  )[category];
}
