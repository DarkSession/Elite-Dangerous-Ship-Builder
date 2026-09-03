import { Injectable, inject } from '@angular/core';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';
import { CATALOGUE_MOUNTS } from '../../domain/equipment/loadout/loadout-mounts';
import { GameTextPresenter } from '../../i18n/game-text.presenter';
import { MessageService } from '../../i18n/message.service';

/** How a modification line is set in from the item that holds it. */
const INDENT = '  ';

/**
 * The loadout in words, for a forum or a Discord post.
 *
 * Canvas 1a offers it as `PLAIN TEXT` beside the link and the payload, and says
 * what it is for: a readable summary. So it is the loadout a Commander can read
 * aloud — the suit and its grade, each mount and what is on it, and every
 * modification fitted — and nothing the package would have to be asked for.
 *
 * Every noun is the library's own, through feature 011's text presenter, and
 * every framing word is a message key the bench already uses. A summary is
 * user-facing text; inventing sentences for it here would be inventing them for
 * every locale (constitution VI).
 *
 * Held content is included. A weapon on a mount the worn suit does not offer is
 * still on the bench, and a summary that quietly dropped it would describe a
 * different loadout from the link beside it (FR-018a).
 */
@Injectable({ providedIn: 'root' })
export class LoadoutSummary {
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);

  write(loadout: EquipmentLoadout): string {
    const lines: string[] = [];

    lines.push(
      this.#graded(
        this.#gameText.suitName(loadout.suitFamily).text ?? loadout.suitFamily,
        loadout.suitGrade,
      ),
    );
    lines.push(...this.#modifications(loadout.suitModifications));

    for (const [position, mount] of CATALOGUE_MOUNTS.entries()) {
      const mountName = this.#gameText.personalMountName(mount).text ?? mount.key;
      const fitted = loadout.weapons[position] ?? null;

      if (fitted === null) {
        lines.push(
          this.#messages.message('equipment.mount.selected', {
            mount: mountName,
            item: this.#messages.message('equipment.mount.empty'),
          }),
        );
        continue;
      }

      lines.push(
        this.#messages.message('equipment.mount.selected', {
          mount: mountName,
          item: this.#graded(
            this.#gameText.personalWeaponName(fitted.symbol).text ?? fitted.symbol,
            fitted.grade,
          ),
        }),
      );
      lines.push(...this.#modifications(fitted.modifications));
    }

    return lines.join('\n');
  }

  /** An item and the grade it is set to, as every row of the bench states it. */
  #graded(name: string, grade: number): string {
    return `${name} · ${this.#messages.message('equipment.grade.short', { grade })}`;
  }

  /** One line per fitted recipe, set in under the item that holds it. */
  #modifications(slots: readonly (string | null)[]): readonly string[] {
    return slots
      .map((symbol, slot) =>
        symbol === null
          ? null
          : `${INDENT}${this.#messages.message('equipment.slot.number', { slot: slot + 1 })}: ${
              this.#gameText.personalModificationName(symbol).text ?? symbol
            }`,
      )
      .filter((line): line is string => line !== null);
  }
}
