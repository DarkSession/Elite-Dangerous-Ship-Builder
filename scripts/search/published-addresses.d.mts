/**
 * The types the application's own tests read this module through.
 *
 * The module is `.mjs` because the sitemap generator, the deployment publisher
 * and the policy checker are all Node scripts and none of them can import
 * TypeScript. One spec in `src/` does import it — the one that holds its copy
 * of the title rule to the running application's — and this is what lets that
 * comparison be type-checked rather than cast.
 */

/** One hull, as much of the package's record as an address needs. */
export interface AddressedShip {
  readonly symbol: string;
  readonly name: string;
}

/** One address the deployment publishes a document for. */
export interface PublishedAddress {
  /** The path below the origin, e.g. `ships/Anaconda`. */
  readonly path: string;
  /** The route table's own path for it, e.g. `ships/:hull`. */
  readonly route: string;
  /** The absolute address, origin included. */
  readonly address: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  /** What the two patterns interpolate. Empty for an address with no subject. */
  readonly params: Readonly<Record<string, string>>;
  /** The card, as a path relative to the deployment base. */
  readonly image: string;
}

/** What one address's document says, resolved in a catalogue. */
export interface PublishedHead {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly image: string;
  readonly imageAlt: string;
}

export declare const HULL_PARENT: string;
export declare const HULL_ROUTE: string;
export declare const SITE_CARD: string;

export declare function hullAddressSegment(name: string): string;
export declare function hullCard(symbol: string): string;
export declare function interpolate(
  pattern: string,
  params: Readonly<Record<string, string | number>>,
): string;
export declare function documentTitle(
  catalogue: Readonly<Record<string, string>>,
  page: string | null,
): string;
export declare function publishedAddresses(input: {
  origin: string;
  ships?: readonly AddressedShip[];
}): readonly PublishedAddress[];
export declare function documentHead(
  entry: PublishedAddress,
  catalogue: Readonly<Record<string, string>>,
  origin: string,
): PublishedHead;
export declare function declaredOrigin(source: string): string;
