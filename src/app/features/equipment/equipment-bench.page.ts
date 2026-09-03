import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import type { PersonalMountKey } from '@elite-dangerous-almanac/core/equipment/suits';
import { LoadoutPresenter } from '../../application/equipment/loadout.presenter';
import { LoadoutStore } from '../../application/equipment/loadout.store';
import type { EditTarget } from '../../domain/equipment/loadout/loadout-edit';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../../ui/a11y/text-equivalence';
import { TabGroup, type TabItem } from '../../ui/components/tab-group/tab-group';
import { observeBenchComposition } from '../../ui/equipment/bench-composition';
import { HISTORY_REDO_MARK, HISTORY_UNDO_MARK, ScreenChrome } from '../shared/screen-chrome';
import { CommanderStats } from './commander-stats/commander-stats';
import { ItemView } from './item-view/item-view';
import { LoadoutLedger } from './loadout-ledger/loadout-ledger';
import { WeaponChooser } from './item-view/weapon-chooser';

/** Which region the compact composition is showing. */
type BenchTab = 'loadout' | 'stats' | 'materials';

/**
 * The on-foot outfitting bench.
 *
 * The second tool the shell carries. Wide, it is artboard `1a`: the loadout
 * ledger, the item view and the commander column side by side, with the
 * choosers opening over the item view. Compact, it is artboard `1b`: a tab per
 * region — `LOADOUT` and `STATS` here, with `MATERIALS` joining them in US2 —
 * with the item view as a drill-in from a ledger row and the choosers as sheets
 * over it.
 *
 * Undo and redo are published into the shell's own bar, where the canvas draws
 * them and where the ship tool already puts the same pair (FR-022).
 *
 * Nothing here reaches `@elite-dangerous-almanac/core`. The bench asks the
 * presenter, the presenter asks `domain/equipment/readings`, and those ask the
 * package (constitution II and III).
 */
@Component({
  selector: 'edsb-equipment-bench-page',
  imports: [CommanderStats, ItemView, LoadoutLedger, TabGroup, WeaponChooser],
  templateUrl: './equipment-bench.page.html',
  styleUrl: './equipment-bench.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentBenchPage {
  readonly #messages = inject(MessageService);
  readonly #chrome = inject(ScreenChrome);

  readonly store = inject(LoadoutStore);
  readonly presenter = inject(LoadoutPresenter);

  /** Which artboard the bench has room for, measured on its own box. */
  readonly composition = observeBenchComposition();

  readonly ledgerLabel = this.#messages.messageSignal('equipment.region.loadout');
  readonly itemLabel = this.#messages.messageSignal('equipment.region.item');
  readonly statsLabel = this.#messages.messageSignal('equipment.region.stats');
  readonly tabsLabel = this.#messages.messageSignal('equipment.tab.group');
  readonly emptyTitle = this.#messages.messageSignal('equipment.no-loadout.title');
  readonly emptyDescription = this.#messages.messageSignal('equipment.no-loadout.description');
  readonly emptyAction = this.#messages.messageSignal('equipment.no-loadout.action');
  readonly suitChooserTitle = this.#messages.messageSignal('equipment.chooser.suit');

  readonly loadoutPanelId = relationId('bench-loadout');
  readonly statsPanelId = relationId('bench-stats');

  readonly tab = signal<BenchTab>('loadout');

  /** Whether the compact drill-in is showing the item view instead of the ledger. */
  readonly drilledIn = signal(false);

  /** Whether the chooser for the selected item is open. */
  readonly chooserOpen = signal(false);

  /**
   * Canvas 1b's tab strip.
   *
   * `LOADOUT` and `STATS` while US1 is what ships: a tab names a panel it can
   * point at, and `MATERIALS` joins the strip together with the region it
   * controls (US2) rather than standing here first as a tab pointing at
   * nothing.
   */
  readonly tabs = computed<readonly TabItem[]>(() => [
    {
      id: 'loadout',
      label: this.#messages.message('equipment.tab.loadout'),
      panelId: this.loadoutPanelId,
    },
    {
      id: 'stats',
      label: this.#messages.message('equipment.tab.stats'),
      panelId: this.statsPanelId,
    },
  ]);

  /** Wide draws every region at once; compact draws the tab that is chosen. */
  shows(tab: BenchTab): boolean {
    return this.composition() === 'wide' || this.tab() === tab;
  }

  /** Compact replaces the ledger with the item view; wide draws both. */
  readonly ledgerShown = computed(
    () => this.shows('loadout') && (this.composition() === 'wide' || !this.drilledIn()),
  );

  readonly itemShown = computed(
    () => this.composition() === 'wide' || (this.tab() === 'loadout' && this.drilledIn()),
  );

  constructor() {
    effect((onCleanup) => {
      this.#chrome.setActions(
        this.store.hasLoadout()
          ? [
              {
                action: {
                  id: 'equipment.undo',
                  label: this.#messages.message('equipment.action.undo'),
                  mark: HISTORY_UNDO_MARK,
                  disabled: !this.store.canUndo(),
                },
                perform: () => void this.store.undo(),
              },
              {
                action: {
                  id: 'equipment.redo',
                  label: this.#messages.message('equipment.action.redo'),
                  mark: HISTORY_REDO_MARK,
                  // `REDO ↷`, not `↷ REDO`: each arrow points the way its
                  // action travels, as the canvas draws them.
                  markPosition: 'trailing' as const,
                  disabled: !this.store.canRedo(),
                },
                perform: () => void this.store.redo(),
              },
            ]
          : [],
      );
      onCleanup(() => this.#chrome.setActions([]));
    });
  }

  showTab(tab: string): void {
    this.tab.set(tab as BenchTab);
  }

  /** What the open chooser is called: the item's own title, or the suit chooser. */
  readonly chooserTitle = computed(
    () => this.presenter.item()?.chooserTitle ?? this.suitChooserTitle(),
  );

  /**
   * Starts a loadout from an empty bench.
   *
   * The bench opens with nothing on it, and weapons, grades and modifications
   * all belong to a suit — so the one thing an empty bench offers is choosing
   * one, through the same chooser `SWAP SUIT` opens.
   */
  chooseFirstSuit(): void {
    this.store.select('suit');
    this.chooserOpen.set(true);
  }

  /** Opens a ledger row in the item view, drilling in where there is no room. */
  open(target: EditTarget): void {
    this.store.select(target);
    this.chooserOpen.set(false);
    this.drilledIn.set(true);
  }

  /** Leaves the compact drill-in, back to the ledger it was opened from. */
  closeItem(): void {
    this.drilledIn.set(false);
  }

  setGrade(grade: number): void {
    const target = this.store.selected();
    if (target === null) return;
    this.store.dispatch(
      target === 'suit'
        ? { kind: 'setSuitGrade', grade }
        : { kind: 'setWeaponGrade', mount: target, grade },
    );
  }

  /** Fits what the chooser answered: a suit on the bench, or a weapon on a mount. */
  fit(identity: string): void {
    const target = this.store.selected();
    if (target === null) return;
    this.store.dispatch(
      target === 'suit'
        ? { kind: 'selectSuit', suitFamily: identity }
        : { kind: 'fitWeapon', mount: target as PersonalMountKey, symbol: identity },
    );
    this.chooserOpen.set(false);
  }
}
