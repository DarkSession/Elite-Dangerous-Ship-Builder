import type { OutfittingModule } from '@elite-dangerous-almanac/core/ships/modules';
import type { PreEngineeredVariant } from '@elite-dangerous-almanac/core/ships/pre-engineered';
import type { MessageKey } from '../../i18n/locale-registry';

/**
 * Whether a choice is a one-off reward or an ordinary article.
 *
 * It was once a level of the chooser's tree, and is not any more: neither
 * redrawn canvas has a section heading, and both mark a reward on its own row
 * inside the family of the module it is built on. What survives is exactly the
 * input the `uniqueReward` label is projected from — no ordering key, no
 * heading and no place in the view (FR-024, decision 14).
 */
export type CandidateSection = 'standard' | 'uniqueReward';

/** What one label is about. Each is a direct projection of a package value. */
export type AcquisitionLabelKind =
  | 'entitlement'
  | 'powerplay'
  | 'mercenary'
  | 'techBroker'
  | 'communityGoal'
  | 'eventReward'
  | 'uniqueReward'
  | 'notOrdinarilyAvailable';

/**
 * One restriction on a choice, explained in the application's own words.
 *
 * `packageValue` is the exact token or enum the label was projected from and is
 * what tests and the interface assert on; the prose is ours. The split matters:
 * the Almanac names Frontier's entitlements and acquisition routes, and this
 * application must never keep a second table of what those names mean — a
 * private copy goes stale the moment Frontier renames one, and it would be
 * game data owned outside the package (FR-007, localization contract).
 */
export interface AcquisitionLabel {
  readonly kind: AcquisitionLabelKind;
  readonly packageValue: string;
  readonly messageKey: MessageKey;
  readonly params: Readonly<Record<string, string | number>> | null;
}

/**
 * What the labels are read from, whichever side of a fit we are on.
 *
 * Before a fit the entitlement is the catalogue record's and the variant is the
 * chooser row's; after a fit both come off the `FittedModule` — its
 * `stats?.entitlement` and its `preEngineeredVariant`, which is the only thing
 * that identifies a fitted article as a reward. Same pair, two sources, one
 * projection, so the labels a Commander read in the chooser are the labels they
 * keep afterwards (module-catalogue contract, "Acquisition and entitlement
 * labels").
 */
export interface AcquisitionSource {
  readonly entitlement: string | null;
  readonly variant: PreEngineeredVariant | null;
}

/**
 * The route label for each acquisition the package publishes.
 *
 * A `Record` over the package's own union, so a release that adds a route stops
 * this file compiling rather than shipping a choice with no explanation of how
 * it is obtained.
 */
const ROUTE: Record<PreEngineeredVariant['acquisition'], MessageKey> = {
  mercenary: 'outfitting.acquisition.mercenary',
  communityGoal: 'outfitting.acquisition.communityGoal',
  techBroker: 'outfitting.acquisition.techBroker',
  eventReward: 'outfitting.acquisition.eventReward',
};

/**
 * Which routes are rewards rather than purchases.
 *
 * The same `Record` shape for the same reason. A reward is awarded once and
 * cannot be gone and bought, which is a different fact from "not sold at an
 * ordinary outfitting service" — so the two get different second labels and a
 * new route has to be placed deliberately.
 */
const REWARD: Record<PreEngineeredVariant['acquisition'], boolean> = {
  mercenary: false,
  communityGoal: true,
  techBroker: false,
  eventReward: true,
};

/** Whether a choice is a one-off reward. Only reward routes are. */
export function acquisitionSection(variant: PreEngineeredVariant | null): CandidateSection {
  return variant !== null && REWARD[variant.acquisition] ? 'uniqueReward' : 'standard';
}

/**
 * Every restriction on one choice, in a stable order.
 *
 * Labels stack rather than replace. A community-goal variant of a module that
 * also carries a Horizons entitlement is restricted twice over, and a Commander
 * who is told only one of the two will find out about the other at the
 * outfitting service. Route first, then what the route implies, then the
 * entitlement, which is independent of both.
 */
export function acquisitionLabels(source: AcquisitionSource): readonly AcquisitionLabel[] {
  const labels: AcquisitionLabel[] = [];
  const variant = source.variant;

  if (variant !== null) {
    labels.push({
      kind: variant.acquisition,
      packageValue: variant.acquisition,
      messageKey: ROUTE[variant.acquisition],
      params: null,
    });
    labels.push(
      REWARD[variant.acquisition]
        ? {
            kind: 'uniqueReward',
            packageValue: variant.acquisition,
            messageKey: 'outfitting.acquisition.uniqueReward',
            params: null,
          }
        : {
            kind: 'notOrdinarilyAvailable',
            packageValue: variant.acquisition,
            messageKey: 'outfitting.acquisition.notOrdinarilyAvailable',
            params: null,
          },
    );
  }

  if (source.entitlement !== null) {
    labels.push(
      isPowerplayEntitlement(source.entitlement)
        ? {
            kind: 'powerplay',
            packageValue: source.entitlement,
            messageKey: 'outfitting.acquisition.powerplay',
            params: null,
          }
        : {
            kind: 'entitlement',
            packageValue: source.entitlement,
            messageKey: 'outfitting.acquisition.entitlement',
            // The raw token is disclosed rather than translated. It is
            // Frontier's name for the purchase, and the honest thing to show is
            // the name the Almanac gave, not a guess at what it is called in a
            // store.
            params: { token: source.entitlement },
          },
    );
  }

  return labels;
}

/**
 * The prefix the Almanac writes on an entitlement that is a Powerplay module.
 *
 * `Hpt_PlasmaAccelerator_Fixed_Large_Advanced` carries
 * `ELITE_SPECIFIC_V_POWER_200050`, and the twelve tokens under this prefix are
 * the twelve powers' modules. Canvas 1c draws that row with the Powerplay icon
 * rather than the generic entitlement sentence, and this is what the icon keys
 * on.
 *
 * It is the one place this application reads meaning out of a package token,
 * and it is deliberately the smallest reading available: one prefix, no table
 * of what the twelve mean and no name invented for any of them — the power's
 * own id stays unread, because naming the power would be exactly the local
 * catalogue FR-007 forbids. The durable fix is the Almanac publishing the kind
 * of an entitlement beside its token, at which point this constant goes and the
 * projection reads the field (module-replacement design, "Acquisition icons").
 */
const POWERPLAY_ENTITLEMENT = 'ELITE_SPECIFIC_V_POWER_';

function isPowerplayEntitlement(token: string): boolean {
  return token.startsWith(POWERPLAY_ENTITLEMENT);
}

/** The pre-fit source: the catalogue record's entitlement and the row's variant. */
export function catalogueSource(
  module: OutfittingModule,
  variant: PreEngineeredVariant | null,
): AcquisitionSource {
  return { entitlement: module.entitlement ?? null, variant };
}

/**
 * The post-fit source: the same pair, off the module now in the mount.
 *
 * The other half of the pair this file's `AcquisitionSource` was written for.
 * A Commander who read `Powerplay` on a row in the chooser and fitted it must
 * still read it on the ledger afterwards — the restriction did not stop being
 * true when the module moved.
 */
export function fittedSource(fitted: {
  readonly entitlement: string | null;
  readonly variant: PreEngineeredVariant | null;
}): AcquisitionSource {
  return { entitlement: fitted.entitlement, variant: fitted.variant };
}
