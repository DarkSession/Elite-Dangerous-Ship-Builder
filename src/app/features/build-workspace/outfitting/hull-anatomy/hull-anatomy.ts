import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { AnatomyStore } from '../../../../application/anatomy/anatomy.store';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import {
  SCHEMATIC_SIDES,
  type SchematicSide,
  type SideAssetState,
} from '../../../../domain/anatomy/anatomy-model';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { MessageService } from '../../../../i18n/message.service';
import { relationId } from '../../../../ui/a11y/text-equivalence';
import { AnnouncementService } from '../../../../ui/announcements/announcement.service';
import { TabGroup } from '../../../../ui/components/tab-group/tab-group';
import { HullSchematic, type HullSchematicView } from '../../../../ui/outfitting/hull-schematic';
import { DefenceAnalysis } from '../defence-analysis/defence-analysis';
import { DrivesMass } from '../drives-mass/drives-mass';
import { OffenceAnalysis } from '../offence-analysis/offence-analysis';
import { PowerThermals } from '../power-thermals/power-thermals';

/** The modes of the strip that open something. `DRIVES` is still disabled. */
const ANATOMY_MODES = ['mounts', 'power', 'drives', 'defence', 'offence'] as const;

type AnatomyMode = (typeof ANATOMY_MODES)[number];

/**
 * The region's rule per mode, from canvas 1c's own switching script:
 * `HULL ANATOMY`, `POWER & THERMALS`, `DEFENCE ANALYSIS`, `OFFENCE ANALYSIS`.
 */
const MODE_HEADINGS = {
  mounts: 'anatomy.heading',
  power: 'power.heading',
  drives: 'drives.heading',
  defence: 'defence.heading',
  offence: 'offence.heading',
} as const satisfies Record<AnatomyMode, MessageKey>;

function isAnatomyMode(value: string): value is AnatomyMode {
  return (ANATOMY_MODES as readonly string[]).includes(value);
}

/**
 * A mode the strip offers on someone else's behalf.
 *
 * Canvas 1d's strip has a sixth segment, `STATUS`, and what it opens is the
 * status rail — which is not this region's and is not drawn inside it. So the
 * strip carries the segment, says which one is open, and draws nothing for it;
 * the workspace that owns the rail reads the answer and puts the rail where the
 * panel would have been (010 hull-anatomy design, "The mode strip").
 */
export interface AnatomyGuestMode {
  readonly id: string;
  /** The segment's own word. */
  readonly label: string;
  /** The rule above the strip while this segment is open. */
  readonly heading: string;
}

/**
 * The hull anatomy panel inside feature 001's `/build`.
 *
 * Canvases 1c and 1d draw it as four things in one order: the `HULL ANATOMY`
 * rule with the mode strip beside it, the labelled plates, and the legend. Wide
 * shows both plates side by side; constrained shows one and a `TOP`/`BOTTOM`
 * selector over it. That is the whole capability — the selected mount's facts
 * are the ledger row and the bench, six centimetres away, and repeating them
 * here would be a second detail surface for one selection
 * (design/hull-anatomy.md, "Divergence from FR-008").
 *
 * The strip is drawn whole, with the five modes the canvas names and in its
 * order. `MOUNTS` is this capability's own; `POWER` is feature 005's, `DRIVES`
 * feature 008's, `DEFENCE` feature 006's and `OFFENCE` feature 007's, each of
 * which retitles the region — `POWER & THERMALS`, `DRIVES & MASS`, `DEFENCE
 * ANALYSIS`, `OFFENCE ANALYSIS` — and replaces the plates entirely, because the
 * canvas's switching script hides the plate container outside `mounts` and the
 * side selector and the legend go with them. All five have landed, so none is
 * disabled; the rule that held the unbuilt ones back stands for whatever the
 * strip gains next — a segment that opened an empty panel would be this
 * capability claiming a reading of the hull that nothing has made
 * (design/hull-anatomy.md, "The mode strip";
 * specs/005-power-and-heat/design/canvas-contract.md, "Where the capability
 * lives").
 */
@Component({
  selector: 'edsb-hull-anatomy',
  imports: [DefenceAnalysis, DrivesMass, HullSchematic, OffenceAnalysis, PowerThermals, TabGroup],
  templateUrl: './hull-anatomy.html',
  styleUrl: './hull-anatomy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Which kind of content the region is showing, for the workspace column
  // outside it. The plates ask for the height their hulls need and fit the
  // column that bounds them; a dashboard says whatever the build has to say and
  // does not, so the column releases and the page carries it. The column cannot
  // tell these apart from the outside, and the difference decides whether it
  // stays bounded.
  host: { '[class.anatomy--dashboard]': 'isDashboard()' },
})
export class HullAnatomy {
  readonly #store = inject(AnatomyStore);
  readonly #outfitting = inject(OutfittingStore);
  readonly #active = inject(ActiveBuildStore);
  readonly #messages = inject(MessageService);
  readonly #announcements = inject(AnnouncementService);

  readonly headingId = relationId('anatomy');

  /** Monotonic across every side transition this session announces. */
  #transition = 0;

  /**
   * Segments the strip offers for a region that is not this one.
   *
   * Empty at every width but the compact one, where canvas 1d adds `STATUS`.
   * The strip draws the segment and reports it; what opens is the caller's.
   */
  readonly guestModes = input<readonly AnatomyGuestMode[]>([]);

  /** Which segment is open, for a caller drawing a guest mode's panel. */
  readonly modeChanged = output<string>();

  /** The mode last asked for. Nothing about it is persisted or routed. */
  readonly #requested = signal<string>('mounts');

  /**
   * The mode the strip actually has open.
   *
   * A guest segment belongs to the caller and can be withdrawn — the compact
   * arrangement offers `STATUS` and the roomy one does not — so a strip left
   * standing on a segment nobody offers any more falls back to its own first
   * one. Read straight off what was asked for instead, rotating a phone to
   * landscape with `STATUS` open drew the region's rule and its strip and
   * nothing under them, with no segment marked as the open one (reported
   * 2026-08-26).
   */
  readonly #mode = computed(() => {
    const requested = this.#requested();
    if (isAnatomyMode(requested)) {
      return requested;
    }
    return this.guestModes().some((mode) => mode.id === requested) ? requested : 'mounts';
  });

  readonly activeMode = this.#mode;

  /** The guest segment currently open, or none — this region's own is. */
  readonly guestMode = computed(
    () => this.guestModes().find((mode) => mode.id === this.#mode()) ?? null,
  );

  readonly isPower = computed(() => this.#mode() === 'power');
  readonly isDrives = computed(() => this.#mode() === 'drives');
  readonly isDefence = computed(() => this.#mode() === 'defence');
  readonly isOffence = computed(() => this.#mode() === 'offence');

  /**
   * Whether the mode the strip has open replaces the plates with a capability
   * of its own rather than layering on them.
   *
   * Read off `mounts` rather than by listing the dashboards, so a mode that
   * lands next cannot be added to the strip and left out of this by omission.
   */
  readonly isDashboard = computed(() => this.#mode() !== 'mounts');

  /**
   * The region's own rule, which the mode renames.
   *
   * Canvas 1c's switching script carries a title per mode, and it carries only
   * a title: a region whose plates changed what they mean while the rule above
   * them still said `HULL ANATOMY` would be the one place a reader could not
   * tell which layer they were looking at, and a line under it explaining the
   * panel is not something the artboard draws.
   */
  readonly heading = computed(() => {
    const guest = this.guestMode();
    if (guest !== null) {
      return guest.heading;
    }
    const mode = this.#mode();
    return this.#messages.message(MODE_HEADINGS[isAnatomyMode(mode) ? mode : 'mounts']);
  });
  readonly modeLabel = this.#messages.messageSignal('anatomy.mode.label');
  readonly sideLabel = this.#messages.messageSignal('anatomy.side.label');
  readonly legendLabel = this.#messages.messageSignal('anatomy.legend.label');

  readonly sideChoices = computed(() =>
    SCHEMATIC_SIDES.map((side) => ({
      id: side,
      label: this.#messages.message(side === 'top' ? 'anatomy.side.top' : 'anatomy.side.bottom'),
    })),
  );

  readonly visibleSide = this.#store.visibleSide;

  /**
   * Canvas 1c's five modes, in its order.
   *
   * `mounts` is this feature's; the other four are the same region read by
   * features 005 to 008, and every one of them has shipped, so none is
   * disabled. The one that is open is exposed as pressed state and named in
   * words as well, so the canvas's amber ground is never the only thing that
   * says so.
   */
  readonly modes = computed(() =>
    (
      [
        { id: 'mounts', key: 'anatomy.mode.mounts', enabled: true },
        { id: 'power', key: 'anatomy.mode.power', enabled: true },
        { id: 'drives', key: 'anatomy.mode.drives', enabled: true },
        { id: 'defence', key: 'anatomy.mode.defence', enabled: true },
        { id: 'offence', key: 'anatomy.mode.offence', enabled: true },
      ] as const
    )
      .map((mode) => ({
        id: mode.id as string,
        label: this.#messages.message(mode.key),
        disabled: !mode.enabled,
      }))
      // The guest segments follow this region's own, which is where canvas 1d
      // draws `STATUS`: last.
      .concat(
        this.guestModes().map((mode) => ({ id: mode.id, label: mode.label, disabled: false })),
      ),
  );

  /** The five entries canvas 1c draws, in the order it draws them. */
  readonly legend = computed(() => [
    { id: 'selected', label: this.#messages.message('anatomy.legend.selected') },
    { id: 'fitted', label: this.#messages.message('anatomy.legend.fitted') },
    { id: 'empty', label: this.#messages.message('anatomy.legend.empty') },
    { id: 'utility', label: this.#messages.message('anatomy.legend.utility') },
    { id: 'engineered', label: this.#messages.message('anatomy.legend.engineered') },
  ]);

  /** One view per side, both always built: the layout decides which are drawn. */
  readonly plates = computed<readonly HullSchematicView[]>(() => {
    const projection = this.#store.projection();
    const sides = this.#store.sides();
    const hullName = this.#active.hullName() ?? '';
    const selectedKey = this.#store.selectedKey();

    return SCHEMATIC_SIDES.map((side) => ({
      side,
      state: sides[side],
      occurrences: projection.occurrences[side],
      selectedKey,
      hullName,
    }));
  });

  /** Which sides have announced a failure nobody has been told is over. */
  readonly #failed: Record<SchematicSide, boolean> = { top: false, bottom: false };

  constructor() {
    // One announcement when a side stops working and one when it starts again,
    // and none for the first answer: a plate that has always been loading has
    // not changed, and a reader arriving at the region reads its state in place
    // (feedback contract).
    //
    // Recovery is measured against the last thing announced, not against the
    // kind immediately before: a retry publishes `loading` on its way back, so
    // a side compared only with its predecessor would recover silently.
    //
    // All of it is per hull, because the hull can change without this component
    // being destroyed — a build link opens a different ship into the same
    // workspace. Carried across, a hull whose bottom failed would have the next
    // hull's perfectly good bottom announced as "showing again", and a second
    // failure in a row would be announced not at all.
    let seen: string | null = null;
    effect(() => {
      const symbol = this.#store.symbol();
      const sides = this.#store.sides();
      const current = { top: sides.top.kind, bottom: sides.bottom.kind };

      untracked(() => {
        const first = seen !== symbol;
        if (first) {
          this.#failed.top = false;
          this.#failed.bottom = false;
        }
        seen = symbol;
        for (const side of SCHEMATIC_SIDES) {
          this.#announceSide(side, current[side], first);
        }
      });
    });
  }

  /**
   * Opens one mode of the strip.
   *
   * Nothing about it touches the route, the fragment, history, storage or the
   * active build: it is which layer of the same two plates is being read.
   */
  showMode(mode: string): void {
    if (!isAnatomyMode(mode) && !this.guestModes().some((guest) => guest.id === mode)) {
      return;
    }
    this.#requested.set(mode);
    this.modeChanged.emit(mode);
  }

  /** Selects the mount's exact package slot key. Feature 002 owns what happens next. */
  openSlot(slotKey: string): void {
    this.#outfitting.select(slotKey);
  }

  showSide(side: string): void {
    this.#store.showSide(side as SchematicSide);
  }

  retry(side: SchematicSide): void {
    this.#store.retry(side);
  }

  #announceSide(side: SchematicSide, kind: SideAssetState['kind'], first: boolean): void {
    const failing = kind === 'temporarilyUnavailable' || kind === 'contractDefect';

    // In transit. A retry passes through `loading` on its way back, and a side
    // that has not answered yet has not changed anything a reader was told.
    if (!failing && kind !== 'ready') {
      return;
    }
    if (failing === this.#failed[side]) {
      return;
    }
    this.#failed[side] = failing;

    // The state a region already has when it is first read is not news: a side
    // that arrives broken is read in place. It is still recorded, so the moment
    // it starts working is a change from what the reader last saw.
    if (first) {
      return;
    }

    const key = failing
      ? kind === 'contractDefect'
        ? 'anatomy.announce.defect'
        : 'anatomy.announce.unavailable'
      : 'anatomy.announce.recovered';

    this.#announcements.announce({
      kind: `anatomy.side.${side}`,
      // The transition's own number, not the build's. A side that fails,
      // recovers and fails again does so at one build revision, and the
      // service drops anything not ahead of what it last announced.
      revision: (this.#transition += 1),
      urgency: 'polite',
      messageKey: key,
      params: {
        side: this.#messages.message(side === 'top' ? 'anatomy.side.top' : 'anatomy.side.bottom'),
      },
    });
  }
}
