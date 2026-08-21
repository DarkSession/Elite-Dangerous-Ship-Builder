import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { relationId } from '../../a11y/text-equivalence';

/** One mount, with the game's own key. */
export interface SlotEntry {
  /** The journal slot key, exactly as the game spells it. */
  readonly key: string;
  /** The size class in words, or the explicit "no size class" marker. */
  readonly size: string;
  /** What the mount is restricted to, when it is restricted. */
  readonly restriction: string | null;
}

/** One kind of mount, and every slot of that kind. */
export interface SlotGroup {
  readonly kind: string;
  readonly label: string;
  readonly slots: readonly SlotEntry[];
}

/**
 * A hull's mounts, grouped the way an outfitting panel groups them.
 *
 * The keys are the game's own and are shown verbatim, because they are what a
 * SLEF export, a journal entry and this application all use to name the same
 * mount — and because several hulls number their slots irregularly, so a
 * prettier derived label would be a different, wrong identity.
 *
 * A key is a technical identifier, so it is isolated from the surrounding text
 * direction: in a right-to-left context the bidirectional algorithm would
 * otherwise reorder `Slot14_Size1` into something that reads as another mount.
 */
@Component({
  selector: 'edsb-slot-layout',
  templateUrl: './slot-layout.html',
  styleUrl: './slot-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotLayout {
  /** What the layout describes. Becomes the list's accessible name. */
  readonly label = input.required<string>();
  readonly groups = input.required<readonly SlotGroup[]>();
  readonly emptyLabel = input<string | null>(null);

  readonly layoutId = relationId('slot-layout');

  groupId(kind: string): string {
    return `${this.layoutId}-${kind}`;
  }
}
