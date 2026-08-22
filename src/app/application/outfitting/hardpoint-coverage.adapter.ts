import type { HardpointCoverage } from '../../domain/outfitting/hardpoint-coverage';
import type { SlotView } from './slot-view';

/**
 * What this build's hardpoints actually are, for feature 007.
 *
 * Derived from the same package-resolved slot views the ledger renders, at the
 * same build revision, so the offence profile and the ledger cannot disagree
 * about what is fitted.
 *
 * The one thing this must never do is infer emptiness from a weapon count.
 * `weaponMetrics().weapons` lists the weapons the package could *measure*,
 * which is not the set of hardpoint mounts that carry a module — an unpowered
 * or unmeasurable weapon occupies a mount without appearing there. Reporting
 * "no weapons fitted" from an empty metrics list would state something about
 * the build that nobody checked (hardpoint-coverage contract).
 *
 * `views` being empty is `unavailable`, not `confirmedEmpty`: a hull with no
 * hardpoints and a slot query that failed produce the same empty array here,
 * and only one of them is an answer.
 */
export function hardpointCoverage(views: readonly SlotView[]): HardpointCoverage {
  if (views.length === 0) {
    return { kind: 'unavailable' };
  }

  const hardpoints = views.filter((view) => view.kind === 'hardpoint');
  if (hardpoints.length === 0) {
    return { kind: 'unavailable' };
  }

  const occupiedSlots = hardpoints.filter((view) => view.module !== null).map((view) => view.key);

  return occupiedSlots.length === 0
    ? { kind: 'confirmedEmpty' }
    : { kind: 'complete', occupiedSlots };
}
