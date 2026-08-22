import { LoadoutEditError } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { captureCheckpoint } from '../build/modeled-build-checkpoint';
import { runEditTransaction } from './build-edit-transaction';
import { FIXTURE_SLOTS, defaultBuild } from './outfitting.fixtures';

/**
 * The transaction's whole job is that a failed edit is indistinguishable from
 * no edit at all. These tests check that from the outside: after a refusal, the
 * build a Commander is looking at has to be byte-for-byte the build they were
 * looking at before.
 */

describe('build edit transaction', () => {
  it('produces one changed candidate and leaves the current build alone', () => {
    const current = defaultBuild();
    const before = captureCheckpoint(current);

    const outcome = runEditTransaction(
      current,
      (candidate) => candidate.setModulePriority(FIXTURE_SLOTS.core, 3),
      FIXTURE_SLOTS.core,
    );

    expect(outcome.kind).toBe('changed');
    if (outcome.kind !== 'changed') {
      return;
    }
    expect(outcome.candidate.fittedModuleAt(FIXTURE_SLOTS.core)?.priority).toBe(3);
    expect(outcome.previous).toEqual(before);
    // The edit happened somewhere else entirely.
    expect(captureCheckpoint(current)).toEqual(before);
  });

  it('reports a command that changes nothing as unchanged', () => {
    const current = defaultBuild();
    current.setModulePriority(FIXTURE_SLOTS.core, 2);

    const outcome = runEditTransaction(current, (candidate) =>
      candidate.setModulePriority(FIXTURE_SLOTS.core, 2),
    );

    // A successful package call that changed nothing is still nothing. It gets
    // no revision and no history frame, so undo never becomes a no-op.
    expect(outcome.kind).toBe('unchanged');
  });

  it('keeps the package refusal whole, with its code, constraint, params and slot', () => {
    const current = defaultBuild();
    const plant = current.modulesForSlot(FIXTURE_SLOTS.core)[0]!;
    const before = captureCheckpoint(current);

    const outcome = runEditTransaction(
      current,
      (candidate) => candidate.setModule(FIXTURE_SLOTS.hardpoint, plant),
      FIXTURE_SLOTS.hardpoint,
    );

    expect(outcome.kind).toBe('refused');
    if (outcome.kind !== 'refused') {
      return;
    }
    expect(outcome.error).toBeInstanceOf(LoadoutEditError);
    expect(outcome.error.code).toBe('incompatibleModule');
    expect(outcome.error.params).toBeDefined();
    expect(outcome.slotKey).toBe(FIXTURE_SLOTS.hardpoint);
    expect(captureCheckpoint(current)).toEqual(before);
  });

  it('does not partially commit when the operation throws part-way through', () => {
    const current = defaultBuild();
    const before = captureCheckpoint(current);
    const plant = current.modulesForSlot(FIXTURE_SLOTS.core)[0]!;

    const outcome = runEditTransaction(current, (candidate) => {
      // First edit succeeds, second is refused. Neither may survive.
      candidate.setModulePriority(FIXTURE_SLOTS.core, 4);
      candidate.setModule(FIXTURE_SLOTS.hardpoint, plant);
    });

    expect(outcome.kind).toBe('refused');
    expect(captureCheckpoint(current)).toEqual(before);
  });

  it('separates an unexpected throw from a structured refusal', () => {
    const current = defaultBuild();

    const outcome = runEditTransaction(
      current,
      () => {
        throw new RangeError('the package changed its mind');
      },
      FIXTURE_SLOTS.core,
    );

    expect(outcome.kind).toBe('unexpected');
    if (outcome.kind !== 'unexpected') {
      return;
    }
    expect(outcome.error).toBeInstanceOf(RangeError);
    expect(outcome.slotKey).toBe(FIXTURE_SLOTS.core);
  });

  it('blocks rather than editing a build the package can no longer rebuild', () => {
    const current = defaultBuild();
    // A hull the package does not carry cannot be reconstructed, so there is no
    // candidate to edit. Editing the live build instead is exactly what this
    // design refuses to do.
    Object.defineProperty(current, 'shipSymbol', { get: () => 'Nonexistent_Hull' });

    const outcome = runEditTransaction(current, (candidate) =>
      candidate.setModulePriority(FIXTURE_SLOTS.core, 1),
    );

    expect(outcome.kind).toBe('blocked');
  });
});
