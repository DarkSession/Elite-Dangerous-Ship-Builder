/**
 * The shape of the one artifact the Help · About modal reads.
 *
 * Everything here is produced at build time by `scripts/generate-help-manifest.mjs`
 * from files that already exist in the repository or in the installed package —
 * the root `package.json`, the root `LICENSE`, the Almanac's own manifest — and
 * nothing here is typed by hand. That is the whole point of the type: a version
 * a person wrote into a template is a claim about the build, and the reference
 * canvas's `APP VERSION 4.2.1 · LIBRARY VERSION 3.8.0.3` is what a claim like
 * that turns into once it is a year old.
 *
 * The manifest is deliberately small. It carries identities, one legal excerpt
 * and three destinations; it does not carry help topics (those live in their
 * own generated module, keyed by message id so they can be translated), and it
 * does not carry any document body beyond the single excerpt FR-003 permits.
 */

/** Which application artifact is being looked at. */
export type BuildIdentity =
  | { readonly kind: 'release'; readonly applicationVersion: string }
  | {
      readonly kind: 'nonRelease';
      readonly applicationVersion: string;
      /**
       * A bounded, non-personal marker for a build nobody released.
       *
       * A CI run number or an abbreviated commit, never a branch, a machine, a
       * person or a timestamp. It exists so a Commander reporting something odd
       * can say which build they were looking at, and for no other reason.
       */
      readonly buildId: string;
    };

/** Identity of the installed game-data package. */
export interface AlmanacIdentity {
  readonly packageName: string;
  readonly version: string;
}

/**
 * The one legal body the modal is allowed to embed.
 *
 * `exactText` is the project's own Frontier media-usage disclaimer, lifted out
 * of the root `LICENSE` rather than retyped beside it. `byteLength` and
 * `sha256` are carried so a test can prove the text that reached the browser is
 * the text that was in the file, without the test needing its own copy to
 * compare against — which would be a second copy, and a second copy is the
 * thing that eventually disagrees.
 */
export interface FrontierDisclaimer {
  readonly documentId: 'frontierDisclaimer';
  readonly source: 'LICENSE';
  readonly language: 'en';
  readonly exactText: string;
  readonly byteLength: number;
  readonly sha256: string;
}

/**
 * A deliberate navigation out of the application.
 *
 * There are exactly three. Two are complete licence documents — this
 * repository's own `LICENSE` and the bundled library's — and one is this
 * application's own source. `id` and `purpose` are both closed sets, so a
 * fourth destination, or a page published as terms it is not, is a type error
 * rather than a review note. FR-009's package-defect action was withdrawn on
 * 2026-08-25 and does not come back with these.
 */
export interface ExternalDestination {
  readonly id: 'repositoryLicense' | 'almanacLicense' | 'repositorySource';
  readonly url: string;
  readonly purpose: 'completeLegalTerms' | 'sourceCode';
  readonly leavesApplication: true;
  readonly mayRequireNetwork: true;
}

/**
 * Evidence that a source distribution still carries the package's own terms.
 *
 * Build evidence only. The bodies of these documents never enter the browser
 * bundle and are never rendered — mirroring them is a redistribution
 * obligation, not a thing to show a Commander (FR-004).
 */
export interface SourceDistributionArtifact {
  readonly id: 'almanacLicense' | 'almanacNotices';
  readonly mirrorPath: string;
  readonly byteLength: number;
  readonly sha256: string;
}

/** The complete generated artifact, imported eagerly by the application. */
export interface HelpManifestV1 {
  readonly schemaVersion: 1;
  readonly build: BuildIdentity;
  readonly almanac: AlmanacIdentity;
  readonly disclaimer: FrontierDisclaimer;
  readonly destinations: {
    readonly repositoryLicense: ExternalDestination;
    readonly almanacLicense: ExternalDestination;
    readonly repositorySource: ExternalDestination;
  };
  readonly sourceDistribution: readonly SourceDistributionArtifact[];
}

/** A 64-character lowercase hex digest, and nothing that merely looks like one. */
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const assertNonEmpty = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Help manifest ${field} must be a non-empty string.`);
  }
  return value;
};

const assertDigest = (value: unknown, field: string): void => {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new Error(`Help manifest ${field} must be 64 lowercase hexadecimal characters.`);
  }
};

const assertPositiveInteger = (value: unknown, field: string): void => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Help manifest ${field} must be a positive integer.`);
  }
};

/**
 * Checks a manifest against its own invariants, and throws naming the first one
 * that fails.
 *
 * The generator already refuses to emit a manifest that breaks any of these, so
 * in a correct build this never fires. It exists because the generated module
 * is the one input to this feature that is not written by hand and not reviewed
 * in a diff: if it is ever wrong, the failure should be a named error at the
 * point of import rather than a blank region in a legal notice.
 */
export function assertHelpManifest(manifest: HelpManifestV1): HelpManifestV1 {
  if (manifest.schemaVersion !== 1) {
    throw new Error('Help manifest schemaVersion must be 1.');
  }

  assertNonEmpty(manifest.build.applicationVersion, 'build.applicationVersion');
  if (manifest.build.kind === 'nonRelease') {
    assertNonEmpty(manifest.build.buildId, 'build.buildId');
  }

  assertNonEmpty(manifest.almanac.packageName, 'almanac.packageName');
  assertNonEmpty(manifest.almanac.version, 'almanac.version');

  const disclaimer = manifest.disclaimer;
  if (disclaimer.documentId !== 'frontierDisclaimer') {
    throw new Error('Help manifest carries a legal body other than the Frontier disclaimer.');
  }
  if (disclaimer.source !== 'LICENSE' || disclaimer.language !== 'en') {
    throw new Error('The Frontier disclaimer must come from root LICENSE and stay in English.');
  }
  assertNonEmpty(disclaimer.exactText, 'disclaimer.exactText');
  assertPositiveInteger(disclaimer.byteLength, 'disclaimer.byteLength');
  assertDigest(disclaimer.sha256, 'disclaimer.sha256');

  // Exactly three, named, each for the one thing it is offered as. A key
  // nobody expects here is a navigation nobody reviewed, and a page carrying
  // the wrong purpose is one offered as something it is not (FR-003, FR-008).
  const expectedDestinations = {
    repositoryLicense: 'completeLegalTerms',
    almanacLicense: 'completeLegalTerms',
    repositorySource: 'sourceCode',
  } as const;
  const expectedIds = Object.keys(expectedDestinations);
  const destinationIds = Object.keys(manifest.destinations).sort();
  if (destinationIds.join(',') !== [...expectedIds].sort().join(',')) {
    throw new Error(
      `Help manifest must carry exactly the destinations ${expectedIds.join(', ')}; found ${
        destinationIds.join(', ') || 'none'
      }.`,
    );
  }

  for (const [id, purpose] of Object.entries(expectedDestinations)) {
    const destination = manifest.destinations[id as keyof typeof expectedDestinations];
    if (destination.id !== id || destination.purpose !== purpose) {
      throw new Error(`${id} must be a ${purpose} destination carrying its own id.`);
    }
    if (!destination.leavesApplication || !destination.mayRequireNetwork) {
      throw new Error(
        `The ${id} destination must state that it leaves the app and needs a network.`,
      );
    }
    assertNonEmpty(destination.url, `destinations.${id}.url`);
  }

  for (const artifact of manifest.sourceDistribution) {
    assertNonEmpty(artifact.mirrorPath, `sourceDistribution.${artifact.id}.mirrorPath`);
    assertPositiveInteger(artifact.byteLength, `sourceDistribution.${artifact.id}.byteLength`);
    assertDigest(artifact.sha256, `sourceDistribution.${artifact.id}.sha256`);
  }

  return manifest;
}
