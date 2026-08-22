import {
  HISTORY_CAPACITY,
  emptyHistory,
  recordDecision,
  redo,
  redoSummary,
  undo,
  undoSummary,
  type SessionEditHistory,
} from './session-edit-history';

/**
 * The tape, as a value.
 *
 * Every test here uses a number for a checkpoint. That is deliberate: the tape
 * knows nothing about builds, and a test that reached for a real snapshot would
 * be proving the serializer again rather than the transitions (edit-history
 * contract, "Scope").
 */

const INTENT = { key: 'outfitting.history.fit', params: { slot: 'MediumHardpoint1' } } as const;

function intentAt(step: number) {
  return { key: 'outfitting.history.fit', params: { step } };
}

/** Applies `count` decisions, the checkpoint before each being its index. */
function tapeOf(count: number): SessionEditHistory<number> {
  let history = emptyHistory<number>();
  for (let step = 0; step < count; step += 1) {
    history = recordDecision(history, step, intentAt(step));
  }
  return history;
}

describe('the session edit tape', () => {
  describe('recording', () => {
    it('keeps one frame per decision, in the order they were made', () => {
      const history = tapeOf(3);

      expect(history.past.map((frame) => frame.checkpoint)).toEqual([0, 1, 2]);
      expect(history.future).toEqual([]);
    });

    it('discards the redo branch, because the build has left it', () => {
      const stepped = undo(tapeOf(2), 2)!;
      expect(stepped.next.future).toHaveLength(1);

      const recorded = recordDecision(stepped.next, 9, INTENT);

      // Redoing onto a state that no longer follows from this one would offer a
      // build nobody ever had.
      expect(recorded.future).toEqual([]);
    });
  });

  describe('capacity', () => {
    it('retains decisions 2–101 of 101 and can restore all hundred', () => {
      const history = tapeOf(HISTORY_CAPACITY + 1);

      expect(history.past).toHaveLength(HISTORY_CAPACITY);
      // The first decision's prior state — checkpoint 0 — is the one dropped.
      expect(history.past[0]?.checkpoint).toBe(1);
      expect(history.past.at(-1)?.checkpoint).toBe(HISTORY_CAPACITY);

      let restored: number[] = [];
      let tape = history;
      let current = HISTORY_CAPACITY + 1;
      for (let step = 0; step < HISTORY_CAPACITY; step += 1) {
        const stepped = undo(tape, current)!;
        restored = [...restored, stepped.restore];
        current = stepped.restore;
        tape = stepped.next;
      }

      expect(restored).toHaveLength(HISTORY_CAPACITY);
      expect(undo(tape, current)).toBeNull();
    });

    it('never grows the retained path past the capacity by moving frames', () => {
      let tape = tapeOf(HISTORY_CAPACITY);
      let current = HISTORY_CAPACITY;

      // Walk all the way back and all the way forward again.
      for (let step = 0; step < HISTORY_CAPACITY; step += 1) {
        const stepped = undo(tape, current)!;
        current = stepped.restore;
        tape = stepped.next;
      }
      for (let step = 0; step < HISTORY_CAPACITY; step += 1) {
        const stepped = redo(tape, current)!;
        current = stepped.restore;
        tape = stepped.next;
      }

      expect(tape.past).toHaveLength(HISTORY_CAPACITY);
      expect(tape.future).toEqual([]);
    });
  });

  describe('moving', () => {
    it('puts the state it left in the future, under the same summary', () => {
      const stepped = undo(tapeOf(1), 5)!;

      expect(stepped.restore).toBe(0);
      expect(stepped.next.past).toEqual([]);
      // One summary describes the decision between two states: the thing undo
      // undoes is the thing redo redoes.
      expect(stepped.next.future).toEqual([{ checkpoint: 5, intent: intentAt(0) }]);
    });

    it('returns exactly where it came from', () => {
      const back = undo(tapeOf(2), 7)!;
      const forward = redo(back.next, back.restore)!;

      expect(forward.restore).toBe(7);
      expect(forward.next.past.map((frame) => frame.checkpoint)).toEqual([0, 1]);
      expect(forward.next.future).toEqual([]);
    });

    it('is a no-op at either end rather than an error', () => {
      expect(undo(emptyHistory<number>(), 1)).toBeNull();
      expect(redo(emptyHistory<number>(), 1)).toBeNull();
      expect(redo(tapeOf(2), 2)).toBeNull();
    });

    it('leaves the caller’s tape untouched, so a failed restore consumes nothing', () => {
      const history = tapeOf(2);

      const stepped = undo(history, 2)!;

      // The transition is a proposal. A caller whose restore fails simply never
      // installs it, and the tape it still holds is the one it had.
      expect(stepped.next).not.toBe(history);
      expect(history.past.map((frame) => frame.checkpoint)).toEqual([0, 1]);
      expect(history.future).toEqual([]);
    });
  });

  describe('the summaries', () => {
    it('name the decision each direction would move through', () => {
      const history = tapeOf(2);

      expect(undoSummary(history)).toEqual(intentAt(1));
      expect(redoSummary(history)).toBeNull();

      const stepped = undo(history, 2)!;

      expect(undoSummary(stepped.next)).toEqual(intentAt(0));
      expect(redoSummary(stepped.next)).toEqual(intentAt(1));
    });

    it('carry scalars and a key, never a formatted sentence', () => {
      const summary = undoSummary(tapeOf(1))!;

      expect(summary.key).toBe('outfitting.history.fit');
      expect(Object.values(summary.params).every((value) => typeof value !== 'object')).toBe(true);
    });
  });
});
