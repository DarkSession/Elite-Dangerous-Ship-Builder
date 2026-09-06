import type { DiagnosticEntry } from '../../ui/technical/diagnostic-list';

/**
 * What an import panel draws, already localized.
 *
 * One shape for both tools. The two canvases draw one panel — a description, a
 * drop plate, the list of what a scan found, a paste box under a rule, a status
 * line and a footer — and what differs between a ship build and a suit loadout
 * is the words in it, which are resolved before they get here.
 */
export interface JournalImportView {
  readonly title: string;
  readonly description: string;
  readonly accepted: string;
  readonly fieldLabel: string;
  readonly draft: string;
  /** The one status line the canvas draws, whatever it currently says. */
  readonly status: string;
  readonly busy: boolean;
  readonly failure: JournalFailureView | null;
  readonly submitLabel: string;
  /** The canvas draws Cancel, not Clear: closing is what it does. */
  readonly cancelLabel: string;
  readonly canSubmit: boolean;

  /** The drop target's own label. */
  readonly dropLabel: string;
  /** What the last scan read, or `null` before one. */
  readonly scanned: string | null;
  /** True while files are being read. */
  readonly scanning: boolean;
  /** The rule between the drop target and the paste box. */
  readonly dividerLabel: string;
  /**
   * What a scan found, or empty where there is nothing to choose between.
   *
   * A scan that found one thing lists nothing: the row would be a choice with
   * one option in it (016/FR-005).
   */
  readonly picks: readonly JournalPickView[];
  /** How many were found and how many are chosen. `null` with no list. */
  readonly picksLabel: string | null;
}

/** One thing a scan found, as the list draws it. */
export interface JournalPickView {
  readonly key: string;
  /** What it is called: a ship's name and ident, or a loadout's name. */
  readonly title: string;
  /** What it holds, in one line. */
  readonly detail: string;
  /** When the game wrote the line, in the active locale. */
  readonly meta: string;
  readonly selected: boolean;
}

/** A refusal, in the same three parts every refusal has. */
export interface JournalFailureView {
  /** The application's framing of what happened. Never a package sentence. */
  readonly message: string;
  /** The package's own diagnostics, unaltered. Empty when it raised none. */
  readonly diagnostics: readonly DiagnosticEntry[];
  readonly diagnosticsLabel: string;
  /** One line per refused entry, in exact source identities. */
  readonly refusals: readonly string[];
  /**
   * The control that opens the two lists above.
   *
   * A refusal is answered by one sentence; the identities and the five-field
   * diagnostics behind it are for a Commander who wants to know which entry the
   * library would not take, and they are not what most refusals need said
   * (Commander request 2026-08-26). Nothing is withheld — the control is beside
   * the sentence, and it names itself.
   */
  readonly advancedLabel: string;
}
