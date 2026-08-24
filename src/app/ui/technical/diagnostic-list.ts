import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MessageService } from '../../i18n/message.service';

/**
 * One package diagnostic, already resolved for display.
 *
 * Every field is text the caller obtained from the package: the entry index it
 * gave, the property path it wrote, its own stable code and constraint, and
 * whatever `getSlefDiagnosticMessage` returned. Nothing here is composed from a
 * message the application authored about a package fact (FR-011).
 */
export interface DiagnosticEntry {
  /** Stable identity for rendering. Not shown. */
  readonly id: string;
  /** The package's zero-based entry index, already formatted for the locale. */
  readonly index: string;
  readonly path: string;
  readonly code: string;
  readonly constraint: string;
  /** The package's reason, in whatever language the package had it. */
  readonly reason: string;
  /** The canonical-language disclosure, when the reason is not localized. */
  readonly disclosure: string | null;
  /** The language the reason is actually in, so `lang` can be accurate. */
  readonly reasonLanguage: string | null;
}

/**
 * Why the Almanac rejected what was pasted, in full.
 *
 * A list rather than a sentence, because a diagnostic is five separate facts —
 * which entry, which property, which category, which constraint, and the
 * package's own reason — and flattening them into prose loses exactly the part
 * a Commander needs to find the offending line in their payload.
 *
 * Every value is direction-isolated. A JSON path and a module symbol are
 * technical strings; a right-to-left interface must not reorder
 * `entries[1].Modules[0].Item` into something that points somewhere else.
 */
@Component({
  selector: 'edsb-diagnostic-list',
  templateUrl: './diagnostic-list.html',
  styleUrl: './diagnostic-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticList {
  readonly #messages = inject(MessageService);

  /** What the list is about. Becomes its accessible name. */
  readonly label = input.required<string>();
  readonly diagnostics = input.required<readonly DiagnosticEntry[]>();

  readonly entryLabel = computed(() => this.#messages.message('slef.diagnostic.entry'));
  readonly pathLabel = computed(() => this.#messages.message('slef.diagnostic.path'));
  readonly codeLabel = computed(() => this.#messages.message('slef.diagnostic.code'));
  readonly constraintLabel = computed(() => this.#messages.message('slef.diagnostic.constraint'));
  readonly reasonLabel = computed(() => this.#messages.message('slef.diagnostic.reason'));
}
