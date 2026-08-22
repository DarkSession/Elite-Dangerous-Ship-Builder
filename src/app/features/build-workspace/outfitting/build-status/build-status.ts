import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { LoadoutIssue } from '@elite-dangerous-almanac/core/ships/loadout-validation';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { GameTextPresenter, type GameTextPresentation } from '../../../../i18n/game-text.presenter';
import type { MessageKey } from '../../../../i18n/locale-registry';
import { MessageService } from '../../../../i18n/message.service';
import { GameText } from '../../../../ui/components/game-text/game-text';

/** One drawn issue: the package's sentence, and its severity in words that are not drawn. */
interface IssueView {
  /** Stable within one validation result, for tracking only. Never translated. */
  readonly id: string;
  readonly severity: LoadoutIssue['severity'];
  readonly severityLabel: string;
  readonly diagnostic: GameTextPresentation;
}

/**
 * The severity names, as message keys.
 *
 * Written out rather than composed from the severity value, because
 * `MessageKey` is the catalogue's own key union — a template-built key would
 * compile without ever proving the message exists.
 */
const SEVERITY_LABELS = {
  error: 'build-status.severity.error',
  incomplete: 'build-status.severity.incomplete',
} as const satisfies Record<LoadoutIssue['severity'], MessageKey>;

/**
 * What the Almanac says is wrong with the build, in the outfitting status rail.
 *
 * Canvas 1c draws one of these blocks under `BUILD STATUS` at the head of its
 * 306 px rail; canvas 1d draws three at the head of its Status mode. Same DOM at
 * both widths — which composition the region gets is decided in CSS from the
 * space it is given, the arrangement `edsb-cost-materials` already established
 * below it.
 *
 * Three collisions between the feature specification and these canvases were
 * surfaced and ruled on in wave 11, and the design won all three. So the issues
 * are drawn *here*, in the rail, rather than moved into a separate Status
 * capability; there is no wide Status tab to move them to; and the counts, the
 * structural-facts list, the qualification summary, the none-reported
 * statements, the count announcer and every slot action the specification asked
 * for are not built (`specs/003-ship-statistics/design/reference-review.md`,
 * rulings A–C).
 *
 * Two consequences of ruling A are deliberate and worth stating, because both
 * look like omissions:
 *
 *   * **A build the package reports nothing about draws nothing.** Not an
 *     all-clear line, not a zero count. Neither canvas draws such a state, and
 *     silence claims strictly less than an all-clear statement would — which is
 *     exactly what FR-015 asks for.
 *   * **Nothing here is interactive.** The canvas draws these as plain blocks,
 *     and at both widths the slot ledger a per-issue action would have reached
 *     is already on screen beside them.
 *
 * The sentence is the package's own, resolved through feature 011's presenter.
 * The application keeps no copy of a package diagnostic, parses none, and
 * composes none of its own from the issue parameters — the package has already
 * interpolated them. At the pinned version the package publishes diagnostics in
 * English only, so every other language reads the canonical sentence with the
 * shared untranslated disclosure beside it (FR-005, FR-007).
 */
@Component({
  selector: 'edsb-build-status',
  imports: [GameText],
  templateUrl: './build-status.html',
  styleUrl: './build-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildStatus {
  readonly #active = inject(ActiveBuildStore);
  readonly #messages = inject(MessageService);
  readonly #gameText = inject(GameTextPresenter);

  /**
   * The package's issues, in the package's order, one view each.
   *
   * `ActiveBuildStore.validation` already reads the revision before the loadout,
   * which is what makes an edit visible here: the store holds one mutable
   * package object, so an edit changes what it contains without changing the
   * reference.
   */
  readonly issues = computed<readonly IssueView[]>(() =>
    (this.#active.validation()?.issues ?? []).map((issue, position) => ({
      // Position first, so two issues with the same code and slot — which the
      // package may legitimately raise — stay distinct entries.
      id: `${position}:${issue.code}:${issue.slot ?? ''}`,
      severity: issue.severity,
      severityLabel: this.#messages.message(SEVERITY_LABELS[issue.severity]),
      // Through the presenter rather than through the package: package text has
      // one route into this application, and a component is not it.
      diagnostic: this.#gameText.loadoutIssueMessage(issue),
    })),
  );
}
