import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { PartialEngineeringFailure } from '../build/build-ingress-result';
import type { NormalizationRefusal, SlefImportFailure } from './slef-import.models';

/**
 * Whether construction failed because the hull is one the package does not have.
 *
 * Asked of the package, not read out of its exception message. Extracting facts
 * from exception prose is exactly what the research rejected, and a release that
 * reworded the message would silently turn every unknown hull into a generic
 * failure. A hull the package cannot make a default build of is a hull it does
 * not carry, and that is a question with an answer.
 */
export function classifyConstructionFailure(sourceHull: string): SlefImportFailure {
  try {
    ShipLoadout.default(sourceHull);
  } catch {
    return { kind: 'unknownHull', sourceHull };
  }
  return { kind: 'construction' };
}

/**
 * Which of the two refusals the ingress gate reported.
 *
 * The gate distinguishes a package refusal — an engineering roll it declines to
 * complete — from an answer the released contract says it cannot give. They
 * read the same to a Commander only if the application flattens them, and the
 * second is a defect worth surfacing as a defect.
 *
 * There is deliberately no third kind for a partial whose module did not come
 * back. A module the package dropped or defaulted away is ordinary build state
 * (FR-010), so its roll has nothing left to complete and refusing the import
 * over it would refuse a build the constitution says is fine.
 *
 * Nothing is invented on the way through: the package's own code and params
 * travel verbatim, and a refusal the package gave no code for carries `null`
 * rather than a plausible-looking substitute (FR-011).
 */
export function classifyNormalizationFailure(
  failures: readonly PartialEngineeringFailure[],
): SlefImportFailure {
  const refusals = failures.map((failure): NormalizationRefusal => ({
    source: failure.source,
    code: failure.code,
    params: failure.params,
  }));

  if (failures.some((failure) => failure.reason === 'packageContract')) {
    return { kind: 'packageContractFailure', failures: refusals };
  }
  return { kind: 'normalizationUnsupported', failures: refusals };
}
