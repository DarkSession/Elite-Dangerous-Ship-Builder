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
 *    slot and symbol;
 * 4. complete each one through the package, accepting only `normalized`;
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

  // Steps 3–4. Correlate, then complete. Every failure is collected rather than
  // thrown on the first one, so a refusal can name every affected slot at once.
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
