/**
 * The application's lossless representation of a build's modelled state.
 *
 * This is what local persistence stores. It is deliberately **not** SLEF and not
 * the compact link body: SLEF is a capture format that mixes modelled state with
 * derived figures and the instant it was taken, and the link body is a compact
 * encoding tied to a generated identity table. This is the durable middle — the
 * fields a Commander actually chose, in the package's own spelling.
 *
 * What is absent is as deliberate as what is present. There are no calculated
 * values, no catalogue facts, no prices, no purchase provenance, no validation
 * snapshot, no name, note, record id or timestamp (persistence contract,
 * "Boundary exclusions"). Every one of those is either derived by the package
 * from what is here, or belongs to the record envelope around it.
 *
 * Engineering modifiers are absent for the same reason: they are the package's
 * own derivation from a blueprint identity and grade, or from a pre-engineered
 * variant, and storing a copy would fork a game calculation into browser bytes
 * (constitution II).
 */

/** The discriminator every snapshot carries. */
export const BUILD_SNAPSHOT_FORMAT = 'edsb.build';

/** The only published snapshot version. */
export const BUILD_SNAPSHOT_VERSION = 1;

/** A build's modelled state, as stored. */
export interface BuildSnapshotV1 {
  readonly format: typeof BUILD_SNAPSHOT_FORMAT;
  readonly version: typeof BUILD_SNAPSHOT_VERSION;
  /** The package-resolved hull identity, in the spelling the package returned. */
  readonly shipSymbol: string;
  /** `null` is an absent name. An empty string, if one was accepted, stays distinct. */
  readonly shipName: string | null;
  readonly shipIdent: string | null;
  /** One entry per fitted module, in the package's own slot order. */
  readonly modules: readonly SnapshotModuleV1[];
}

/** One fitted module's modelled state. */
export interface SnapshotModuleV1 {
  /** The game's own slot key, in its original spelling. Unique case-insensitively. */
  readonly slot: string;
  /** The package-resolved module identity, in the spelling the package returned. */
  readonly symbol: string;
  /**
   * Whether the module is powered on.
   *
   * `null` means the field was absent, which the package treats as on. `false`
   * is a Commander's decision and is never collapsed into the absent case — a
   * deliberately unpowered module coming back powered is a changed build.
   */
  readonly enabled: boolean | null;
  /** The zero-based power-priority group, 0–4. `null` means absent. */
  readonly priority: number | null;
  /** The package-identified pre-engineered variant, independent of later engineering. */
  readonly preEngineered: PreEngineeredIdentityV1 | null;
  /** Ordinary engineering, when the module carries engineering the variant does not explain. */
  readonly engineering: EngineeringSnapshotV1 | null;
}

/**
 * The tuple that identifies one pre-engineered article in the package catalogue.
 *
 * Identity, not state: the package republishes the article's own grade and
 * modifier block from these four fields, so the stored form cannot drift away
 * from what the installed package says the article is.
 */
export interface PreEngineeredIdentityV1 {
  readonly symbol: string;
  readonly blueprint: string;
  readonly grade: number;
  readonly acquisition: string;
  /** The variant's experimental effect `fdname`, or `null` when it carries none. */
  readonly experimental: string | null;
}

/** Ordinary, craftable engineering applied to a module. */
export interface EngineeringSnapshotV1 {
  /** The blueprint's `fdname`. `null` where engineering carries no blueprint identity. */
  readonly blueprint: string | null;
  /** The blueprint grade, 1–5. */
  readonly grade: number;
  /** The completed roll quality, 0–1. */
  readonly quality: number;
  /** The experimental effect's `fdname`, or `null`. */
  readonly experimental: string | null;
}
