import { Injectable } from '@angular/core';
import type { SchematicSide, SideAssetState } from '../../domain/anatomy/anatomy-model';
import { hullSchematicPath } from './hull-artwork-path';
import { parseSchematicMounts } from './schematic-mounts';

/**
 * Fetches one hull's mount extract from this origin and validates it.
 *
 * What is fetched is a few hundred bytes of JSON, not the package's
 * ninety-kilobyte SVG: the drawing is served as a PNG and the mounts as their
 * own extract, both produced from the installed package at build time. Reading
 * sixteen coordinates out of ninety kilobytes in a Commander's browser was
 * ninety kilobytes spent on nothing.
 *
 * One side at a time and one request each, so the two sides of a hull arrive
 * independently: a bottom schematic that 404s never delays a top one that is
 * already cached, and neither can fail the other (contract, "Independent
 * recovery").
 *
 * The URL is relative, so it resolves against the document's own base and can
 * only ever be same-origin — there is no host, no scheme and no user string
 * anywhere in it (constitution I). Caching is not this class's business: the
 * one versioned Angular service worker feature 011 registers already covers
 * `/assets/ships/**`, and a second cache here would be a second answer to the
 * same question.
 */
@Injectable({ providedIn: 'root' })
export class AlmanacSchematicLoader {
  /**
   * Loads one side, or says why it is not there.
   *
   * Never rejects and never throws: every outcome is one of the states the
   * plate can draw. The distinction it exists to make is between a fetch that
   * did not arrive — retryable, and stated as temporary — and a file that
   * arrived and was not what the package promises, which retrying cannot fix.
   */
  async load(symbol: string, side: SchematicSide, signal?: AbortSignal): Promise<SideAssetState> {
    let response: Response;
    try {
      response = await fetch(hullSchematicPath(symbol, side), {
        signal,
        credentials: 'same-origin',
        referrerPolicy: 'same-origin',
      });
    } catch {
      // Offline, aborted or a dropped connection. The store discards the result
      // of an aborted request before it is ever published, so this classifies
      // only the failures a Commander can act on.
      return { kind: 'temporarilyUnavailable' };
    }

    if (!response.ok) {
      return { kind: 'temporarilyUnavailable' };
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      // A body that is not JSON at all is a deployment serving something else —
      // an index page for a missing file, most often. Retrying can fix that,
      // and a Commander is told it might.
      return { kind: 'temporarilyUnavailable' };
    }

    const document = parseSchematicMounts(payload, side, symbol);
    return document === null ? { kind: 'contractDefect' } : { kind: 'ready', document };
  }
}
