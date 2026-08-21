/**
 * The addresses the suite talks to.
 *
 * Three servers, because three different things are under test:
 *
 *   * the product application, which every product journey uses;
 *   * the tooling-only preview application, which the component sweep uses;
 *   * a production static server, which the offline journey needs because a
 *     service worker only exists in a production build.
 *
 * All three are same-origin static hosts. Nothing in the suite reaches another
 * origin, because nothing in the product may (constitution I).
 */

/** True when the run targets a production build rather than the dev server. */
export const IS_PRODUCTION_RUN = process.env['E2E_PRODUCTION'] === '1';

export const PRODUCT_DEV_PORT = 4200;
export const PREVIEW_PORT = 4300;
export const PRODUCTION_PORT = 4400;

export const PRODUCT_URL =
  process.env['E2E_BASE_URL'] ??
  `http://localhost:${IS_PRODUCTION_RUN ? PRODUCTION_PORT : PRODUCT_DEV_PORT}`;

export const PREVIEW_URL = process.env['E2E_PREVIEW_URL'] ?? `http://localhost:${PREVIEW_PORT}`;

/** The address of one component state in the preview catalogue. */
export function previewUrl(address?: string, variant?: string): string {
  const params = new URLSearchParams();
  if (address !== undefined) {
    params.set('address', address);
  }
  if (variant !== undefined) {
    params.set('variant', variant);
  }
  const query = params.toString();
  return query.length > 0 ? `${PREVIEW_URL}/?${query}` : `${PREVIEW_URL}/`;
}
