import type { GameTextPresenter } from '../../i18n/game-text.presenter';
import type { MessageService } from '../../i18n/message.service';
import type { FittedModuleView } from './fitted-module-view';
import { engineeringView } from './engineering-view';

/**
 * The engineering line canvas 1c draws under a module's name.
 *
 * `OVERCHARGED G5` — the recipe's name in the Commander's language and the
 * grade currently applied. `null` when the package published no recipe or no
 * grade, which is not the same as "stock": a screen that filled that gap in
 * would be describing a module nobody engineered.
 *
 * It lives here rather than on the ledger because canvas 1c draws the same line
 * twice — under a ledger row and under a weapon row in `OFFENCE ANALYSIS` — and
 * two implementations of one line are two lines that can disagree.
 */
export function engineeringSummary(
  module: FittedModuleView,
  gameText: GameTextPresenter,
  messages: MessageService,
): string | null {
  const engineering = engineeringView(module);
  if (engineering.blueprintFdname === null || engineering.currentGrade === null) {
    return null;
  }

  return messages.message('outfitting.slot.engineering', {
    blueprint:
      gameText.blueprintName(engineering.blueprintFdname).text ?? engineering.blueprintFdname,
    grade: engineering.currentGrade,
  });
}
