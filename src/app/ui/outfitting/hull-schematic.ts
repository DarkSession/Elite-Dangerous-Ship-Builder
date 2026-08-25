import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type {
  MountOccurrence,
  SchematicSide,
  SideAssetState,
} from '../../domain/anatomy/anatomy-model';
import { placeMarks, type PlatePoint } from '../../domain/anatomy/mount-declutter';
import { hullSchematicImagePath } from '../../platform/assets/hull-artwork-path';
import { ConnectivityAdapter } from '../../platform/browser/connectivity.adapter';
import { MessageService } from '../../i18n/message.service';
import { relationId } from '../a11y/text-equivalence';
import { ActionButton } from '../components/action/action-button';

/** One side of the hull, and everything needed to draw it. */
export interface HullSchematicView {
  readonly side: SchematicSide;
  readonly state: SideAssetState;
  readonly occurrences: readonly MountOccurrence[];
  /** The one selected slot key, from feature 002. */
  readonly selectedKey: string | null;
  /** The hull's name in the Commander's language, for the plate's description. */
  readonly hullName: string;
}

/**
 * Canvas 1c's plate proportions, `aspect-ratio: 720/292`.
 *
 * One ratio for every hull and every state, which is the point: the plate
 * reserves its box before anything is fetched, so a schematic arriving late
 * does not resize the region and shove the fitting bench down the page. A hull
 * narrower or wider than this sits centred in it, exactly as the canvas's own
 * `background-size: contain` puts it there.
 */
const PLATE_RATIO = 720 / 292;

/** One mount, and where its numbered square is drawn on the plate. */
export interface PlateMark {
  readonly occurrence: MountOccurrence;
  /** The mark's position, as a share of the frame's inline size. */
  readonly left: number;
  /** The mark's position, as a share of the frame's block size. */
  readonly top: number;
  /** True when the mark stepped aside, which is when a leader is drawn to it. */
  readonly displaced: boolean;
}

/**
 * A hairline from a mount to the mark that stepped away from it.
 *
 * Drawn in the plate's own frame units, in the same coordinate space as the
 * turned hull, so the end of the line lands on the package's own annotation
 * rather than near it.
 */
export interface PlateLeader {
  readonly key: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** Where the hull's own rectangle sits inside the plate's, in drawing units. */
interface SchematicPlacement {
  readonly frameWidth: number;
  readonly frameHeight: number;
  /** The margin that centres the hull in the frame, on each axis. */
  readonly offsetX: number;
  readonly offsetY: number;
  readonly content: { x: number; y: number; width: number; height: number };
}

/**
 * One hull schematic, drawn from the package's own geometry.
 *
 * Canvas 1c's plate is a hull lying on its side with small numbered boxes set
 * on its mounts, and this is that plate assembled out of package data:
 *
 *   * **the drawing is the package's, laid the canvas's way.** Every hull in
 *     the package is drawn nose-up and centred in a 1200x800 box, so rendered
 *     as shipped it stands on end and wastes most of its frame. The whole
 *     document is turned a quarter turn and cropped to the rectangle it
 *     actually covers — one `transform` and one `viewBox`, both computed from
 *     the coordinates the package published. Nothing is measured off the
 *     rendered document: there is no `getBBox` and no `getScreenCTM` here
 *     (FR-003).
 *   * **a mount is a numbered box, and the box is the control.** The canvas
 *     does not tint the hull's own artwork — it sets a small square carrying
 *     the mount's node number over the hull at that mount's position. So the
 *     package's shapes stay inert in the artwork, and each occurrence becomes a
 *     named button positioned from the annotation's own centre, in the same
 *     four treatments the canvas draws and the legend explains.
 *
 * The whole document is always in view: the frame takes the hull's proportions
 * and the drawing fits itself into it, so nothing pans, zooms or scrolls.
 */
@Component({
  selector: 'edsb-hull-schematic',
  imports: [ActionButton],
  templateUrl: './hull-schematic.html',
  styleUrl: './hull-schematic.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HullSchematic {
  readonly #messages = inject(MessageService);

  readonly view = input.required<HullSchematicView>();

  /** The exact package slot key of the mount that was activated. */
  readonly slotActivated = output<string>();

  /** A Commander asking for this side again after it did not arrive. */
  readonly retryRequested = output<void>();

  readonly headingId = relationId('schematic-side');

  readonly sideLabel = computed(() =>
    this.#messages.message(this.view().side === 'top' ? 'anatomy.side.top' : 'anatomy.side.bottom'),
  );

  /**
   * What the plate shows, in words.
   *
   * The drawing carries no fact that is not also stated: every mount on it is a
   * named control, and the ledger beside it lists them all. So its description
   * names the hull and which way up it is, and stops there.
   */
  readonly description = computed(() =>
    this.#messages.message('anatomy.side.description', {
      hull: this.view().hullName,
      side: this.sideLabel(),
    }),
  );

  readonly document = computed(() => {
    const state = this.view().state;
    return state.kind === 'ready' ? state.document : null;
  });

  /**
   * The hull's own rectangle, turned a quarter turn and centred in the plate.
   *
   * The package draws every hull nose-up in a mostly empty 1200x800 box, so the
   * turn is what puts the nose at the left; the centring is what fits a hull of
   * any proportion into the one plate shape the canvas draws.
   */
  readonly #placement = computed<SchematicPlacement | null>(() => {
    const content = this.document()?.content;
    if (content === undefined || content.width === 0 || content.height === 0) {
      return null;
    }
    // Turned, so the hull's height runs across the plate and its width up it.
    const width = content.height;
    const height = content.width;
    const frameWidth = Math.max(width, height * PLATE_RATIO);
    const frameHeight = Math.max(height, width / PLATE_RATIO);
    return {
      frameWidth,
      frameHeight,
      offsetX: (frameWidth - width) / 2,
      offsetY: (frameHeight - height) / 2,
      content,
    };
  });

  /**
   * The plate's own box, and the one transform that lays the document into it.
   *
   * `translate(…) rotate(-90)` reads right to left: turn the drawing
   * anticlockwise, then bring the hull's rectangle to where the frame wants it.
   * Everything drawn inside the group — the picture and, before it existed, the
   * package's own paths — lands in the same place, which is why the marks over
   * the hull cannot drift from it.
   */
  readonly frame = computed(() => {
    const laid = this.#placement();
    if (laid === null) {
      return { viewBox: '0 0 1 1', transform: '' };
    }
    // Rounded to the thousandth. The package's own coordinates carry four
    // decimals, and dividing by two leaves a tail of binary noise that would
    // otherwise be written into the document as a twenty-digit `viewBox`.
    const round = (value: number): number => Math.round(value * 1000) / 1000;
    const x = laid.offsetX - laid.content.y;
    const y = laid.offsetY + laid.content.x + laid.content.width;
    return {
      viewBox: `0 0 ${round(laid.frameWidth)} ${round(laid.frameHeight)}`,
      transform: `translate(${round(x)} ${round(y)}) rotate(-90)`,
    };
  });

  /**
   * The document's own box, which is where the picture goes.
   *
   * The rasterised PNG is the whole file at the whole `viewBox`, so it is drawn
   * at those coordinates inside the same turned group. Nothing about the
   * picture is positioned by hand.
   */
  readonly artworkBox = computed(() => {
    const parts = (this.document()?.viewBox ?? '0 0 0 0').split(' ').map(Number);
    return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
  });

  readonly artworkSource = computed(() => {
    const drawing = this.document();
    return drawing === null ? null : hullSchematicImagePath(drawing.symbol, drawing.side);
  });

  /**
   * The picture that did not arrive, if one did not.
   *
   * A side is two files — the mount extract and the rendering — and only the
   * first decides the state above. Without this a plate whose picture 404s
   * would keep reporting `ready` and draw its numbered marks over an empty
   * frame for ever, which is the one thing FR-010 says a plate may not do: an
   * absent schematic has to be identified as such. It happens for real when a
   * package pin moves and only one of the two reproduction scripts is re-run.
   *
   * Recorded as *which* file failed rather than as a flag, so it clears itself
   * when the hull or the side changes: a different picture has not failed until
   * it says so.
   */
  readonly #failedSource = signal<string | null>(null);

  readonly pictureFailed = computed(() => {
    const source = this.artworkSource();
    return source !== null && this.#failedSource() === source;
  });

  /** The drawing is shown when there is one and its picture has not failed. */
  readonly showsDrawing = computed(() => this.document() !== null && !this.pictureFailed());

  /**
   * What the plate reports it is, which is not always what the fetch reported.
   *
   * A ready extract whose picture failed is not a ready plate.
   */
  readonly plateState = computed(() =>
    this.pictureFailed() ? 'temporarilyUnavailable' : this.view().state.kind,
  );

  pictureUnavailable(): void {
    this.#failedSource.set(this.artworkSource());
  }

  constructor() {
    // The other half of the store's own `online` rule, for the half of a side
    // the store cannot see. A picture that 404'd while offline is the uncached
    // side's case exactly, and it says the same words — so it has to come back
    // the same way, by itself, rather than waiting for a press the wording
    // never asks for.
    const stop = inject(ConnectivityAdapter).onOnline(() => this.#failedSource.set(null));
    inject(DestroyRef).onDestroy(stop);
  }

  /**
   * Ask for the side again.
   *
   * Clearing the failed picture is what makes the retry mean anything when it
   * was the picture that failed: the store's own state is already `ready`, so
   * nothing it does would re-request the file. Dropping the record re-creates
   * the `image` and the browser asks again.
   */
  retry(): void {
    this.#failedSource.set(null);
    this.retryRequested.emit();
  }

  readonly statusText = computed(() => {
    if (this.pictureFailed()) {
      return this.#messages.message('anatomy.side.unavailable');
    }
    switch (this.view().state.kind) {
      case 'loading':
        return this.#messages.message('anatomy.side.loading');
      case 'temporarilyUnavailable':
        return this.#messages.message('anatomy.side.unavailable');
      case 'contractDefect':
        return this.#messages.message('anatomy.side.defect');
      default:
        return null;
    }
  });

  readonly retryLabel = this.#messages.messageSignal('anatomy.side.retry');

  readonly canRetry = computed(
    () => this.pictureFailed() || this.view().state.kind === 'temporarilyUnavailable',
  );

  readonly isLoading = computed(() => this.view().state.kind === 'loading');

  /**
   * The loading mark, which is the one the hull illustration uses.
   *
   * A plate that is still fetching says so the same way the inspector's
   * illustration says it: the mark sits where the drawing will be, and the
   * words are spoken rather than drawn, so nothing on the page moves when the
   * drawing arrives.
   */
  readonly loaderSource = 'assets/loader.svg';

  /**
   * A mount's own point on the turned plate, in the frame's own units.
   *
   * The same quarter turn the drawing gets: the hull's `y` runs across the
   * frame and its `x` up it. Arithmetic over the coordinates the package
   * published, and the only place a mount's position is worked out (FR-003).
   */
  #anchorOf(laid: SchematicPlacement, centre: PlatePoint): PlatePoint {
    return {
      x: laid.offsetX + centre.y - laid.content.y,
      y: laid.offsetY + laid.content.x + laid.content.width - centre.x,
    };
  }

  /**
   * Every mark's drawn position, and the leaders back to the mounts that moved.
   *
   * The Almanac draws real mounts closer together than a mark is wide, so a
   * mark that would touch one already placed steps aside and a hairline ties it
   * back to the point the package published. The mount itself is not moved —
   * the line's far end is its own annotation's centre — which is what keeps
   * FR-003's geometry and FR-012's "at the position the package published"
   * true of the plate while the number on the mark stays readable
   * (design/hull-anatomy.md, "Marks that would touch").
   *
   * One pass for both, because the leaders are the placements that moved: two
   * computeds over the same run would be the same arithmetic done twice and a
   * chance for the line and the square to disagree.
   */
  readonly #placed = computed<{ marks: readonly PlateMark[]; leaders: readonly PlateLeader[] }>(
    () => {
      const laid = this.#placement();
      const occurrences = this.view().occurrences;
      if (laid === null) {
        return {
          marks: occurrences.map((occurrence) => ({
            occurrence,
            left: 0,
            top: 0,
            displaced: false,
          })),
          leaders: [],
        };
      }

      const placements = placeMarks(
        occurrences.map((occurrence) => this.#anchorOf(laid, occurrence.centre)),
        { width: laid.frameWidth, height: laid.frameHeight },
      );

      const marks = occurrences.map((occurrence, index) => ({
        occurrence,
        left: (placements[index].mark.x / laid.frameWidth) * 100,
        top: (placements[index].mark.y / laid.frameHeight) * 100,
        displaced: placements[index].displaced,
      }));

      const leaders = placements.flatMap((placement, index) =>
        placement.displaced
          ? [
              {
                key: occurrences[index].item.key,
                x1: placement.anchor.x,
                y1: placement.anchor.y,
                x2: placement.mark.x,
                y2: placement.mark.y,
              },
            ]
          : [],
      );

      return { marks, leaders };
    },
  );

  /**
   * The marks, in package drawing order.
   *
   * Physical `left` and `top` rather than logical properties: a hull is not
   * mirrored by a right-to-left interface, and a mount that swapped sides with
   * the writing direction would be pointing at the wrong part of the ship
   * (feature 011, FR-014).
   */
  readonly marks = computed(() => this.#placed().marks);

  /** The hairlines, one per mark that stepped aside. Decoration, and empty most hulls. */
  readonly leaders = computed(() => this.#placed().leaders);

  /**
   * One mount's name, as it is heard.
   *
   * Everything the treatment shows is in here as a word: which mount, whether
   * it is a hardpoint or a utility, which side of the hull it is on and whether
   * it carries an engineered module. Nothing about the state is left to the
   * colour, the dash or the fill (FR-005).
   *
   * It opens with the node number, because that is the one thing the mark
   * *draws*: a control whose visible text is `3` and whose name begins
   * `Large Hardpoint 2` is a name that does not contain its own label
   * (WCAG 2.2 SC 2.5.3). The ledger row says it the same way, through the same
   * message.
   */
  nameOf(occurrence: MountOccurrence): string {
    const item = occurrence.item;
    const parameters = {
      node: item.node,
      slot: item.name,
      kind: this.#messages.message(
        item.kind === 'hardpoint' ? 'anatomy.kind.hardpoint' : 'anatomy.kind.utility',
      ),
      side: this.sideLabel(),
      fitted: this.#messages.message(item.fitted ? 'anatomy.state.fitted' : 'anatomy.state.empty'),
      engineering: this.#messages.message(
        item.engineered ? 'anatomy.state.engineered' : 'anatomy.state.stock',
      ),
    };

    return this.#messages.message('anatomy.mount.name', parameters);
  }

  isSelected(occurrence: MountOccurrence): boolean {
    return occurrence.item.key === this.view().selectedKey;
  }
}
