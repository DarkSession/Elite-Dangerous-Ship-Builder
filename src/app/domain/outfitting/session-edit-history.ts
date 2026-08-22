/**
 * What one decision was, in a form that can be re-read in another language.
 *
 * A key and scalar parameters, never a formatted sentence and never game text.
 * A tape that stored "Fitted Huge Multi-Cannon" would be storing one reading of
 * one moment: switch language and every summary in it is still in the language
 * it was recorded in, and the package's own name for the module may not even be
 * the one it publishes now (edit-history contract, "Included decisions").
 */
export interface HistoryIntentSummary {
  /** An application message key. Resolved when it is read, not when recorded. */
  readonly key: string;
  /** Scalar interpolation values only — no objects, no package records. */
  readonly params: Readonly<Record<string, string | number>>;
}

/** One retained decision: the state before it, and what it was. */
export interface HistoryFrame<TCheckpoint> {
  /** The modelled state as it was *before* this decision was applied. */
  readonly checkpoint: TCheckpoint;
  /** The decision that moved the build past that state. */
  readonly intent: HistoryIntentSummary;
}

/**
 * The in-memory tape of a session's decisions.
 *
 * Framework-agnostic on purpose: no signals, no injector, no clock. It is a
 * value, and every transition below returns a new one, so a caller that cannot
 * complete a restore simply never installs the result — which is exactly the
 * contract's "consume neither frame" rule, obtained by construction rather than
 * by remembering to roll back (edit-history contract, "Restoration").
 */
export interface SessionEditHistory<TCheckpoint> {
  /** Oldest first. The newest is the one undo returns to. */
  readonly past: readonly HistoryFrame<TCheckpoint>[];
  /** Newest first. The first is the one redo goes forward to. */
  readonly future: readonly HistoryFrame<TCheckpoint>[];
}

/**
 * Exactly one hundred retained decisions.
 *
 * Not a tuning knob. The specification fixes the number, and the tape is held
 * in memory for one session, so the bound is what keeps a long session's
 * hundredth-from-last build from being retained forever (FR-016).
 */
export const HISTORY_CAPACITY = 100;

/** What a transition produced: where to restore to, and the tape that follows. */
export interface HistoryTransition<TCheckpoint> {
  readonly restore: TCheckpoint;
  readonly next: SessionEditHistory<TCheckpoint>;
}

export function emptyHistory<TCheckpoint>(): SessionEditHistory<TCheckpoint> {
  return { past: [], future: [] };
}

/**
 * Records one successful, changed Commander decision.
 *
 * The future is discarded rather than kept: the build has left the branch those
 * frames described, and offering to redo onto a state that no longer follows
 * from this one would be offering a build nobody ever had.
 */
export function recordDecision<TCheckpoint>(
  history: SessionEditHistory<TCheckpoint>,
  previous: TCheckpoint,
  intent: HistoryIntentSummary,
): SessionEditHistory<TCheckpoint> {
  return {
    past: capped([...history.past, { checkpoint: previous, intent }]),
    future: [],
  };
}

/**
 * Steps back one decision, or reports that there is none.
 *
 * The frame moved to the future carries the same summary, because a summary
 * describes the decision *between* two states rather than either of them: the
 * thing undo undoes is the thing redo redoes.
 */
export function undo<TCheckpoint>(
  history: SessionEditHistory<TCheckpoint>,
  current: TCheckpoint,
): HistoryTransition<TCheckpoint> | null {
  const frame = history.past.at(-1);
  if (frame === undefined) {
    return null;
  }

  return {
    restore: frame.checkpoint,
    next: {
      past: history.past.slice(0, -1),
      future: [{ checkpoint: current, intent: frame.intent }, ...history.future],
    },
  };
}

/** Steps forward one decision, or reports that there is none. */
export function redo<TCheckpoint>(
  history: SessionEditHistory<TCheckpoint>,
  current: TCheckpoint,
): HistoryTransition<TCheckpoint> | null {
  const frame = history.future[0];
  if (frame === undefined) {
    return null;
  }

  return {
    restore: frame.checkpoint,
    next: {
      // Capped here too: moving a frame back and forth must not grow the
      // retained path past the capacity (edit-history contract, "Capacity").
      past: capped([...history.past, { checkpoint: current, intent: frame.intent }]),
      future: history.future.slice(1),
    },
  };
}

/** What undo would step back to, for the control that offers it. */
export function undoSummary<TCheckpoint>(
  history: SessionEditHistory<TCheckpoint>,
): HistoryIntentSummary | null {
  return history.past.at(-1)?.intent ?? null;
}

/** What redo would step forward to, for the control that offers it. */
export function redoSummary<TCheckpoint>(
  history: SessionEditHistory<TCheckpoint>,
): HistoryIntentSummary | null {
  return history.future[0]?.intent ?? null;
}

/** Keeps the newest `HISTORY_CAPACITY` frames, dropping the oldest first. */
function capped<TCheckpoint>(
  frames: readonly HistoryFrame<TCheckpoint>[],
): readonly HistoryFrame<TCheckpoint>[] {
  return frames.length <= HISTORY_CAPACITY
    ? frames
    : frames.slice(frames.length - HISTORY_CAPACITY);
}
