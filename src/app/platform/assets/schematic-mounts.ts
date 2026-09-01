import type {
  SchematicAnnotation,
  SchematicDocument,
  SchematicSide,
} from '../../domain/ships/anatomy/anatomy-model';

/**
 * Reads one hull's mount extract, or refuses it.
 *
 * This is the file a plate actually fetches: the few hundred bytes
 * `scripts/extract-schematic-mounts.mts` writes out of the installed package's
 * ninety-kilobyte SVG. The package contract — which elements, which attributes,
 * which values — is checked where that extract is made, so a library defect
 * fails a build rather than reaching a Commander.
 *
 * What is left to check here is that the file which arrived is this
 * application's own build output for the hull and side that were asked for. It
 * is checked rather than trusted, and refused rather than repaired: a
 * deployment serving a stale, truncated or foreign document is not something to
 * guess the missing half of, and a mount placed from a number nobody validated
 * would be pointing at the wrong part of the ship.
 */

/** Four numbers, the way the package writes a `viewBox`. */
const VIEW_BOX = /^-?\d+(\.\d+)?( -?\d+(\.\d+)?){3}$/;

/** The package's own vocabulary for a feature word and a journal slot key. */
const WORD = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A real, finite number. `NaN` and infinities place a mount nowhere. */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function extentOf(value: unknown): SchematicDocument['content'] | null {
  if (!isRecord(value)) {
    return null;
  }
  const { x, y, width, height } = value;
  if (!isNumber(x) || !isNumber(y) || !isNumber(width) || !isNumber(height)) {
    return null;
  }
  // A document that draws nothing, or draws it inside out, has no frame to lay
  // a hull into and no share of one to place a mark at.
  return width > 0 && height > 0 ? { x, y, width, height } : null;
}

function annotationOf(value: unknown): SchematicAnnotation | null {
  if (!isRecord(value)) {
    return null;
  }
  const { feature, slot, x, y } = value;
  if (typeof feature !== 'string' || !WORD.test(feature)) {
    return null;
  }
  if (typeof slot !== 'string' || !WORD.test(slot)) {
    return null;
  }
  return isNumber(x) && isNumber(y) ? { feature, journalSlot: slot, centre: { x, y } } : null;
}

/**
 * One side's extract, validated against what was asked for.
 *
 * Returns `null` for anything that is not this application's own output for
 * this exact hull and side — a wrong symbol, a wrong side, a missing field, a
 * value outside its shape. The caller turns that into a named defect for the
 * side and does not ask again.
 */
export function parseSchematicMounts(
  value: unknown,
  side: SchematicSide,
  symbol: string,
): SchematicDocument | null {
  if (!isRecord(value)) {
    return null;
  }
  // The file that arrived is the file that was asked for. A schematic served
  // from another hull's directory would otherwise draw this hull's mounts at
  // another hull's coordinates.
  if (value['symbol'] !== symbol || value['side'] !== side) {
    return null;
  }
  const viewBox = value['viewBox'];
  if (typeof viewBox !== 'string' || !VIEW_BOX.test(viewBox)) {
    return null;
  }
  const content = extentOf(value['content']);
  if (content === null) {
    return null;
  }
  const mounts = value['mounts'];
  if (!Array.isArray(mounts)) {
    return null;
  }

  const annotations: SchematicAnnotation[] = [];
  for (const mount of mounts) {
    const annotation = annotationOf(mount);
    if (annotation === null) {
      return null;
    }
    annotations.push(annotation);
  }

  return { side, symbol, viewBox, content, annotations };
}
