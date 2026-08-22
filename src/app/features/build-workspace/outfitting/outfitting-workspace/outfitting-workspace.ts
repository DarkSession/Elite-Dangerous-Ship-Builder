import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import type { SlotKind } from '@elite-dangerous-almanac/core/ships/slots';
import { engineeringView } from '../../../../application/outfitting/engineering-view';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import type { SlotView } from '../../../../application/outfitting/slot-view';
import { slotCapabilities } from '../../../../application/outfitting/slot-capabilities';
import { NO_SLOT_CAPABILITIES } from '../../../../application/outfitting/outfitting-state';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { GameTextPresenter } from '../../../../i18n/game-text.presenter';
import { MessageService } from '../../../../i18n/message.service';
import { ScreenChrome } from '../../../shared/screen-chrome';
import type { IdentityCommit, IdentityField } from '../../../../ui/outfitting/ship-identity-fields';
import { relationId } from '../../../../ui/a11y/text-equivalence';
import { observeComposition } from '../../../../ui/outfitting/composition';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { EditRefusalNotice } from '../../../../ui/outfitting/edit-refusal-notice';
import { IngressRefusalNotice } from '../../../../ui/outfitting/ingress-refusal-notice';
import { QualityCompletionNotice } from '../../../../ui/outfitting/quality-completion-notice';
import { SlotCard, type SlotCardIntent } from '../../../../ui/outfitting/slot-card';
import { SlotGroup, type SlotGroupView } from '../../../../ui/outfitting/slot-group';
import { EngineeringEditor } from '../engineering-editor/engineering-editor';
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
  imports: [
    EditRefusalNotice,
    EngineeringEditor,
    IngressRefusalNotice,
    ModuleReplacement,
    QualityCompletionNotice,
    SlotCard,
    SlotGroup,
  ],
  templateUrl: './outfitting-workspace.html',
  styleUrl: './outfitting-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutfittingWorkspace {
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);
  readonly store = inject(OutfittingStore);
  readonly active = inject(ActiveBuildStore);
  readonly #chrome = inject(ScreenChrome);

  /** Which mounts are listed. Visibility only; never build or history state. */
  readonly category = signal<Category>('all');

  /**
   * Which identity field the command bar has open, if either.
   *
   * View state and nothing else: opening the field, typing in it and closing it
   * again spend no revision and record no decision. Only confirming does
   * (FR-018).
   */
  readonly editingIdentity = signal<IdentityField | null>(null);

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
  readonly undoLabel = this.#messages.messageSignal('outfitting.history.undo');
  readonly redoLabel = this.#messages.messageSignal('outfitting.history.redo');

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

  /** What the Almanac completed while the build on screen was being read in. */
  readonly qualityNotices = this.active.qualityCompletionNotices;

  /** Why a build the Commander tried to open never became this one. */
  readonly ingressFailures = this.active.ingressFailures;

  /**
   * The ledger's own labels, keyed by exact slot key.
   *
   * Both ingress surfaces name mounts, and they name them the way the ledger
   * does rather than by the game's slot key — which is the identity everything
   * uses and not something a Commander reads.
   */
  readonly slotLabels = computed<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(
      this.store.slots().map((slot) => [slot.key, slot.displayName.text ?? slot.canonicalName]),
    ),
  );

  /** The label the ledger draws for the selected mount, for the notices. */
  readonly selectedSlotLabel = computed(() => {
    const slot = this.selectedSlot();
    return slot === null ? null : (slot.displayName.text ?? slot.canonicalName);
  });

  /**
   * The canvas's `FITTING . HARDPOINT 1`, in the Commander's language.
   *
   * A hardpoint is named by the number the ledger draws beside it and the class
   * it takes — `Fitting · Hardpoint 1 · Huge`. The package's own slot name is
   * `Huge Hardpoint 1`, where the 1 counts huge hardpoints rather than
   * hardpoints, so on a hull with two large mounts it names a different mount
   * from the one the ledger marked (wave 6). Every other kind keeps the
   * package's name, which is the name the game uses for it.
   */
  readonly benchTitle = computed(() => {
    const slot = this.selectedSlot();
    if (slot === null) {
      return '';
    }
    const mountClass = slot.kind === 'hardpoint' ? hardpointClassKey(slot.size) : null;
    return mountClass === null
      ? this.#messages.message('outfitting.bench.title', {
          slot: slot.displayName.text ?? slot.canonicalName,
        })
      : this.#messages.message('outfitting.bench.title.hardpoint', {
          node: slot.node,
          class: this.#messages.message(mountClass),
        });
  });

  /**
   * The Almanac's reason the selected mount offers less than the others.
   *
   * Shown where an action is absent, because an action missing without a
   * reason reads as a defect rather than as a rule of the game (FR-009).
   */
  /**
   * The canvas's own mark for a mount that takes no other module.
   *
   * Canvas 1d writes `FIXED` in a hairline chip beside the cargo hatch rather
   * than a sentence about it, and the bench is where a Commander is looking
   * when they wonder why nothing opened. The Almanac's full reason stays beside
   * it for a reader (FR-009); this is what is drawn.
   */
  readonly benchMark = computed(() =>
    this.selectedSlot()?.immovableReason === 'cargoHatch'
      ? this.#messages.message('outfitting.immovable.short.cargoHatch')
      : null,
  );

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

  /**
   * What the Almanac says this mount will take, where it restricts what fits.
   *
   * On the bench and not in the ledger, for the same reason the immovable
   * reason is: the canvas's ledger row is a size, a module and a power chip,
   * and a package sentence repeated down every restricted row is noise a
   * Commander scrolls past. Here it answers the question the panel below it is
   * asking (reference review, "Per-row change/engineer/remove actions").
   */
  readonly benchRestriction = computed(() => {
    const restriction = this.selectedSlot()?.restrictionText ?? null;
    return restriction === null || restriction.text === null
      ? null
      : this.#messages.message('outfitting.slot.restriction', { restriction: restriction.text });
  });

  /**
   * Whether the fitting panel is on screen, which is two different questions.
   *
   * Inline it is not a surface that opens at all: canvas 1c draws the panel
   * under the anatomy for whichever row is marked, with no control that reveals
   * it. As a layer it is one of canvas 1d's two full-screen views, and it is on
   * screen only while a Commander has it open.
   */
  readonly replacementShown = computed(() => {
    const slot = this.selectedSlot();
    if (slot === null) {
      return false;
    }
    return this.benchIsLayer()
      ? this.store.surface() === 'replacement'
      : this.capabilitiesFor(slot).canOpenReplacement;
  });

  /** The same question for the engineering panel, answered the same way. */
  readonly engineeringShown = computed(() => {
    const slot = this.selectedSlot();
    if (slot === null) {
      return false;
    }
    return this.benchIsLayer()
      ? this.store.surface() === 'engineering'
      : this.capabilitiesFor(slot).canOpenEngineering;
  });

  constructor() {
    // Canvas 1c draws `↶ UNDO` and `REDO ↷` in the command bar's action row;
    // canvas 1d puts the same two in the `⋮` menu. The shell already renders
    // one list in both placements, so they are published rather than drawn
    // again here — a second pair inside the region would be the same actions
    // twice, in a place neither canvas puts them (FR-016).
    // Canvas 1c and 1d both put the build's name where every other screen's
    // name goes, with the hull and the ID plate under it. The workspace owns
    // the values and what confirming one means; the shell places the block.
    effect((onCleanup) => {
      this.#chrome.setIdentity(
        this.store.hasBuild()
          ? {
              identity: {
                name: this.shipName(),
                detail: this.hullName(),
                ident: this.shipIdent(),
                editing: this.editingIdentity(),
              },
              open: (field) => this.editingIdentity.set(field),
              close: () => this.editingIdentity.set(null),
              commit: (commit) => this.#commitIdentity(commit),
            }
          : null,
      );
      onCleanup(() => this.#chrome.setIdentity(null));
    });

    effect((onCleanup) => {
      this.#chrome.setRegionActions(
        this.store.hasBuild()
          ? [
              {
                action: {
                  id: 'outfitting.undo',
                  label: this.undoLabel(),
                  disabled: !this.store.canUndo(),
                  description: this.#named(
                    'outfitting.history.undo.named',
                    this.store.undoSummary(),
                  ),
                },
                perform: () => void this.store.undo(),
              },
              {
                action: {
                  id: 'outfitting.redo',
                  label: this.redoLabel(),
                  disabled: !this.store.canRedo(),
                  description: this.#named(
                    'outfitting.history.redo.named',
                    this.store.redoSummary(),
                  ),
                },
                perform: () => void this.store.redo(),
              },
            ]
          : [],
      );
      onCleanup(() => this.#chrome.setRegionActions([]));
    });
  }

  /** The ship's name and ID plate, re-read from the package at each revision. */
  readonly shipName = computed(() => {
    this.store.revision();
    return this.store.loadout()?.shipName ?? null;
  });

  readonly shipIdent = computed(() => {
    this.store.revision();
    return this.store.loadout()?.shipIdent ?? null;
  });

  /** The hull the canvas draws under the name, in the Commander's language. */
  readonly hullName = computed(() => {
    const symbol = this.store.loadout()?.shipSymbol ?? null;
    return symbol === null ? null : (this.#gameText.shipName(symbol).text ?? symbol);
  });

  /** One confirmed identity field, as one Commander decision (FR-019). */
  #commitIdentity(commit: IdentityCommit): void {
    this.editingIdentity.set(null);
    this.store.dispatch(
      commit.field === 'name'
        ? { kind: 'setShipName', value: commit.value }
        : { kind: 'setShipIdent', value: commit.value },
    );
  }

  /** The drawn label plus what it would step through, for a reader only. */
  #named(key: MessageKey, summary: string | null): string | undefined {
    return summary === null ? undefined : this.#messages.message(key, { summary });
  }

  /** What the package permits on one mount, re-read at the current revision. */
  capabilitiesFor(slot: SlotView) {
    this.store.revision();
    const loadout = this.store.loadout();
    return loadout === null ? NO_SLOT_CAPABILITIES : slotCapabilities(loadout, slot);
  }

  /**
   * The engineering the ledger's code line carries, as canvas 1c draws it.
   *
   * `OVERCHARGED G5` — the recipe's name in the Commander's language and the
   * grade currently applied. It is beside the engineered marker rather than
   * instead of it, because a glyph is not readable and disappears in forced
   * colours (feature 011, FR-010).
   */
  engineeringSummaryFor(slot: SlotView): string | null {
    const module = slot.module;
    if (module === null) {
      return null;
    }
    const engineering = engineeringView(module);
    if (engineering.blueprintFdname === null || engineering.currentGrade === null) {
      return null;
    }
    return this.#messages.message('outfitting.slot.engineering', {
      blueprint:
        this.#gameText.blueprintName(engineering.blueprintFdname).text ??
        engineering.blueprintFdname,
      grade: engineering.currentGrade,
    });
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
      case 'setEnabled':
        this.store.dispatch({ kind: 'setEnabled', slotKey: slot.key, enabled: intent.enabled });
        return;
      case 'setPriority':
        // Power belongs to the mount it was pressed on, not to whichever one
        // happens to be selected. Nothing here selects it first: switching a
        // heat sink off is not a reason to empty the bench a Commander is
        // reading.
        this.store.dispatch({ kind: 'setPriority', slotKey: slot.key, priority: intent.priority });
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

/**
 * The class word for a hardpoint's published size, or nothing.
 *
 * The game's four hardpoint classes are its own vocabulary for the sizes the
 * package publishes as 1 to 4. A size outside that range is a number nobody
 * has a word for, so the mount keeps the package's own name instead of being
 * given one (constitution IV).
 */
function hardpointClassKey(size: number | null): MessageKey | null {
  return (
    (
      {
        1: 'outfitting.slot.class.1',
        2: 'outfitting.slot.class.2',
        3: 'outfitting.slot.class.3',
        4: 'outfitting.slot.class.4',
      } as const
    )[size ?? 0] ?? null
  );
}
