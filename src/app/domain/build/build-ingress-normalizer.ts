import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { LoadoutEvent } from '@elite-dangerous-almanac/core/ships/slef';
import type {
  IngressNotice,
  IngressResult,
  PartialEngineeringFailure,
  SourcePartialEngineering,
} from './build-ingress-result';

/**
 * The one gate every incoming build passes through.
 *
 * Creating a stock build, opening a record, loading a link, importing SLEF and
 * restoring on reload all arrive here, and all of them get the same six steps
 * in the same order. Having one pipeline rather than five is the reason no
 * ingress path can activate a build that skipped a check, and the reason a
 * refusal costs the Commander nothing: everything happens on a candidate the
 * application is not looking at yet.
 *
 * The order matters and is not incidental:
 *
 * 1. record what the source said about partial rolls, while it is still
 *    readable;
 * 2. construct through the package, which refuses an unknown hull and returns
 *    every fixed mount already populated with the hull default;
 * 3. correlate the recorded partials with what actually came back, by exact
 *    slot and symbol, and set aside the modules the package locked as final
 *    articles — their engineering is the article, not a roll;
 * 4. complete each remaining one through the package, accepting only
 *    `normalized`;
 * 5. return the whole candidate, or refuse the whole candidate.
 *
 * There is no repair pass at step 2 and no fixed-mount branch anywhere. The
 * package's answer *is* the build, and a defaulted mount is ordinary build
 * state from the moment it arrives (FR-010, constitution II). There is likewise
 * no "fix just the quality" branch at step 4: a partial the package declines to
 * identify refuses the candidate rather than being written down at a value
 * nobody computed (FR-013).
 */
export function normalizeIncomingBuild(event: LoadoutEvent): IngressResult {
  // Step 1. Read the source's partial rolls before construction consumes them.
  const partials = sourcePartials(event);

  // Step 2. Construct. The package owns the hull check and the fixed defaults.
  let candidate: ShipLoadout;
  try {
    candidate = ShipLoadout.fromLoadout(event);
  } catch (error) {
    return { kind: 'unusable', reason: error instanceof Error ? error.message : String(error) };
  }

  return completePartials(candidate, partials);
}

/**
 * The same gate, for a candidate the package has already built.
 *
 * Opening a stored record and loading a build link both reconstruct through the
 * package from a modelled snapshot rather than from a journal event, so there
 * is no source event left to read step 1 off. The partials are read from the
 * built candidate instead — which is the same evidence, one step later — and
 * steps 3 to 5 are the identical code below. Two entry points, one pipeline: a
 * second implementation is exactly how one ingress path ends up skipping a
 * check the others make (contract, "Mandatory ingress normalization").
 */
export function normalizeReconstructedBuild(candidate: ShipLoadout): IngressResult {
  return completePartials(candidate, builtPartials(candidate));
}

/** Steps 3 to 5, shared by both entry points. */
function completePartials(
  candidate: ShipLoadout,
  partials: readonly SourcePartialEngineering[],
): IngressResult {
  // Correlate, then complete. Every failure is collected rather than thrown on
  // the first one, so a refusal can name every affected slot at once.
  const notices: IngressNotice[] = [];
  const failures: PartialEngineeringFailure[] = [];

  for (const source of partials) {
    const fitted = candidate.fittedModuleAt(source.slotKey);

    // The module the source described is not the module that came back — it was
    // emptied as unresolvable, or defaulted away by a fixed mount. Its partial
    // roll went with it, so there is nothing left to complete.
    if (fitted === null || !sameIdentity(fitted.symbol, source.moduleSymbol)) {
      continue;
    }

    // A final article is not a roll. The package identifies the article the
    // module was acquired as, bakes its fixed modifiers in during construction
    // and locks it against further engineering, so the `Quality` the source
    // stated is a figure the game writes for a finished module rather than a
    // grade waiting to be completed. Asking the package to complete it answers
    // `finalArticle` — a correct refusal of a question that should not have
    // been asked — and treating that as a normalization failure would refuse
    // every build carrying a pre-engineered Guardian weapon or a fixed
    // Enzyme/AX reward. Whether an article is final is the package's own
    // `engineeringLocked`, read from what it fitted; nothing here recognises a
    // symbol or a blueprint (constitution II, FR-013).
    if (fitted.preEngineeredVariant?.engineeringLocked === true) {
      continue;
    }

    // Only a roll that survived construction still needs completing. The
    // package may already have resolved it, in which case asking again would
    // get `unchanged` and be read as a contract failure.
    const currentQuality = fitted.engineering?.Quality;
    if (currentQuality === undefined || !isPartialQuality(currentQuality)) {
      continue;
    }

    const result = candidate.completeEngineeringGrade(source.slotKey);
    switch (result.kind) {
      case 'normalized':
        notices.push({
          kind: 'qualityCompleted',
          slotKey: source.slotKey,
          moduleSymbol: source.moduleSymbol,
          blueprintFdname: source.blueprintFdname,
          previousQuality: result.previousQuality,
          quality: 1,
        });
        break;
      case 'unsupported':
        failures.push({
          source,
          reason: 'packageResult',
          code: result.code,
          params: result.params,
        });
        break;
      default:
        // `unchanged` here would mean the package saw nothing to complete on a
        // module we had just read a partial quality from. That is the two halves
        // of the released contract disagreeing, not a Commander's problem.
        failures.push({ source, reason: 'packageContract', code: null, params: null });
        break;
    }
  }

  if (failures.length > 0) {
    return { kind: 'refused', failures };
  }

  return { kind: 'accepted', candidate, notices };
}

/**
 * Every partial roll a built candidate is carrying, in the build's own order.
 *
 * The equivalent of `sourcePartials` for a candidate that arrived as a modelled
 * snapshot. What it reads is the package's own fitted modules, so a roll that
 * did not survive construction is simply not here — which is the correlation
 * step already done rather than skipped.
 */
function builtPartials(candidate: ShipLoadout): readonly SourcePartialEngineering[] {
  const partials: SourcePartialEngineering[] = [];

  for (const module of candidate.fittedModules()) {
    const engineering = module.engineering;
    if (engineering === undefined || !isPartialQuality(engineering.Quality)) {
      continue;
    }
    partials.push({
      slotKey: module.slot,
      moduleSymbol: module.symbol,
      blueprintFdname: engineering.BlueprintName ?? null,
      effectFdname: engineering.ExperimentalEffect ?? null,
      grade: engineering.Level,
      quality: engineering.Quality,
    });
  }

  return partials;
}

/** Every partial roll the source stated, in source order. */
function sourcePartials(event: LoadoutEvent): readonly SourcePartialEngineering[] {
  const partials: SourcePartialEngineering[] = [];

  for (const module of event.Modules ?? []) {
    const engineering = module.Engineering;
    if (engineering === undefined) {
      continue;
    }
    // `Quality` is typed as required and is not: SLEF producers omit it, and a
    // journal capture can carry anything. The guard is on the value.
    const quality: unknown = engineering.Quality;
    if (typeof quality !== 'number' || !isPartialQuality(quality)) {
      continue;
    }

    partials.push({
      slotKey: module.Slot,
      moduleSymbol: module.Item,
      blueprintFdname: engineering.BlueprintName ?? null,
      effectFdname: engineering.ExperimentalEffect ?? null,
      grade: typeof engineering.Level === 'number' ? engineering.Level : null,
      quality,
    });
  }

  return partials;
}

/** Finite, at least 0, and strictly below 1. Nothing else is a partial roll. */
function isPartialQuality(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value < 1;
}

/** Package identities compare case-insensitively, the way the package matches them. */
function sameIdentity(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}
