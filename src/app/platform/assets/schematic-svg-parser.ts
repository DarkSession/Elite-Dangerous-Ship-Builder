import type { SchematicExtent, SchematicSide } from '../../domain/ships/anatomy/anatomy-model';

/**
 * The two `data-feature` words that must name a slot. Everything else may not.
 *
 * Spelled here rather than imported from `MOUNT_FEATURE_OF`: this file is run
 * by `scripts/extract-schematic-mounts.mts` under Node's type stripping, where
 * a value import would need a module specifier Node can resolve and a type
 * import costs nothing. The two words are the package's, and the model's
 * mapping is checked against the same files by
 * `src/app/domain/ships/anatomy/almanac-anatomy-contract.spec.ts`.
 */
const MOUNT_FEATURES: ReadonlySet<string> = new Set(['hardpoint', 'utility_mount']);

/**
 * The paint a shape carries, as the package wrote it.
 *
 * Every field is a validated literal from the package file and none is ever
 * authored here. `stroke` has already had `currentColor` resolved against the
 * nearest enclosing `color`, because a flattened shape has no ancestor left to
 * inherit from.
 */
export interface SchematicPaint {
  readonly fill: string | null;
  readonly fillOpacity: string | null;
  readonly fillRule: string | null;
  readonly stroke: string | null;
  readonly strokeWidth: string | null;
  readonly strokeLinejoin: string | null;
  readonly strokeLinecap: string | null;
}

/** One drawn shape. The package draws with these two and no others. */
export type SchematicShape =
  | ({ readonly kind: 'path'; readonly d: string } & SchematicPaint)
  | ({
      readonly kind: 'circle';
      readonly cx: string;
      readonly cy: string;
      readonly r: string;
    } & SchematicPaint);

/** One annotated feature group in the source file, with everything it draws. */
export interface SchematicSourceAnnotation {
  readonly feature: string;
  readonly journalSlot: string;
  readonly shapes: readonly SchematicShape[];
  readonly centre: { readonly x: number; readonly y: number };
}

/** One package file, validated, flattened and measured. */
export interface SchematicSource {
  readonly side: SchematicSide;
  readonly symbol: string;
  readonly viewBox: string;
  readonly content: SchematicExtent;
  readonly artwork: readonly SchematicShape[];
  readonly annotations: readonly SchematicSourceAnnotation[];
}

/**
 * Turns one installed Almanac schematic into an inert typed document, or refuses it.
 *
 * **This runs at build time, not in the application.** Nothing a Commander's
 * browser fetches goes through it: `scripts/extract-schematic-mounts.mts` runs
 * it over the installed package and writes out the few hundred bytes of mount
 * geometry a plate actually needs, and the whole-catalogue audit in
 * `src/app/domain/ships/anatomy/almanac-anatomy-contract.spec.ts` runs it over every
 * hull the package ships. It stays here, beside the model it validates against,
 * because that audit is the reason it exists.
 *
 * The package documents these files as static drawing: `svg`, `g`, `path` and
 * `circle`, no script, no style, no external reference, no foreign element. This
 * is where that promise is checked rather than trusted. Everything the parser
 * emits is a record with a closed set of validated fields, so no markup this
 * application did not construct itself ever reaches a template — there is no
 * `innerHTML`, no `bypassSecurityTrustHtml` and no `<object>` anywhere in the
 * path from an HTTP response to the screen (contract, "Safe parsing").
 *
 * **It refuses; it does not sanitize.** A file carrying something outside the
 * contract is a package defect, and quietly dropping the offending element
 * would ship a drawing that is missing a piece nobody was told about. The side
 * is rejected whole and named as a defect instead (AGENTS.md, "Library defects
 * are fixed in the library").
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The only elements the package draws with. */
const ALLOWED_ELEMENTS = new Set(['svg', 'g', 'path', 'circle']);

/**
 * Attributes read into the typed document, per element.
 *
 * `color` is on the list because the package sets it on layer groups and paints
 * strokes with `currentColor`; dropping it would flatten every stroke to black.
 */
const KEPT: Readonly<Record<string, ReadonlySet<string>>> = {
  svg: new Set(['viewBox', 'color']),
  g: new Set(['color', 'data-feature', 'data-journal-slot']),
  path: new Set([
    'd',
    'fill',
    'fill-opacity',
    'fill-rule',
    'stroke',
    'stroke-width',
    'stroke-linejoin',
    'stroke-linecap',
  ]),
  circle: new Set([
    'cx',
    'cy',
    'r',
    'fill',
    'fill-opacity',
    'fill-rule',
    'stroke',
    'stroke-width',
    'stroke-linejoin',
    'stroke-linecap',
  ]),
};

/**
 * Attributes the package writes that nothing here needs.
 *
 * Named rather than ignored wholesale: an attribute that is neither kept nor
 * listed here is something the contract did not promise, and the file is
 * refused for it. That is what makes a future `onload` a rejection instead of a
 * silent pass.
 */
const DISCARDED = new Set([
  'id',
  'version',
  'width',
  'height',
  'xmlns',
  'xmlns:inkscape',
  'inkscape:groupmode',
  'data-visible',
  'data-feature-color',
  'data-feature-category',
  'data-technical-layer',
  'data-technical-line',
  'data-path-assembly',
  'data-junction-repairs',
  'data-junction-gap',
  'data-endpoint-extension',
]);

/** `#rrggbb`, `none` or `currentColor`, and nothing that could name a resource. */
const PAINT = /^(#[0-9a-fA-F]{3,8}|none|currentColor)$/;
const NUMBER = /^-?\d+(\.\d+)?$/;
const VIEW_BOX = /^-?\d+(\.\d+)?( -?\d+(\.\d+)?){3}$/;
/**
 * Path data, restricted to the commands the package actually draws with.
 *
 * Absolute `M`, `L` and `Z` only — deliberately narrower than SVG. `extentOf`
 * below reads path data as consecutive absolute number *pairs*, which is true
 * of exactly these commands: `H` and `V` take one coordinate and `A` takes
 * seven parameters of which only the last two are a point, so either one would
 * shift the pairing for the rest of that path and put the hull's rectangle, and
 * every mark on it, somewhere the package never drew. The relative forms `m`
 * and `l` keep the pairing and break the other half of the assumption: every
 * number after the first is an offset from the previous point, so reading them
 * as points puts the rectangle somewhere else again. `z` is admitted because,
 * like `Z`, it takes no parameters at all.
 *
 * That failure would otherwise be silent. Nothing downstream could catch it —
 * the extract's digest still matches the file it was made from, and the
 * catalogue audit asserts slots and coverage, not the command vocabulary. So
 * the refusal is here, where a release that starts drawing curves fails the
 * extractor by hull and side instead of shipping a plate drawn wrong.
 */
const PATH_DATA = /^[MLZz\d\s.,+-]+$/;
const WORD = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

/** Per-attribute value contracts. An attribute with no entry must match `WORD`. */
const VALUE: Readonly<Record<string, RegExp>> = {
  viewBox: VIEW_BOX,
  color: PAINT,
  fill: PAINT,
  stroke: PAINT,
  'fill-opacity': NUMBER,
  'stroke-width': NUMBER,
  cx: NUMBER,
  cy: NUMBER,
  r: NUMBER,
  d: PATH_DATA,
};

/**
 * Parses one side's file.
 *
 * Returns `null` for anything that is not exactly what the package promises —
 * malformed XML, a doctype, a foreign root, an unexpected element, an
 * unexpected attribute or a value outside its contract. The caller turns that
 * into a named package defect for that side and does not ask again.
 */
export function parseSchematic(
  source: string,
  side: SchematicSide,
  symbol: string,
): SchematicSource | null {
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');

  // A doctype is the entity-expansion surface, and the package ships none.
  if (parsed.doctype !== null) {
    return null;
  }
  // `image/svg+xml` reports failure by *returning* a document whose content is
  // an error report, so the absence of a throw proves nothing.
  if (parsed.getElementsByTagName('parsererror').length > 0) {
    return null;
  }

  const root = parsed.documentElement;
  if (root === null || root.namespaceURI !== SVG_NS || root.localName !== 'svg') {
    return null;
  }

  const rootAttributes = attributesOf(root);
  if (rootAttributes === null) {
    return null;
  }
  const viewBox = rootAttributes.get('viewBox');
  if (viewBox === undefined) {
    return null;
  }

  const artwork: SchematicShape[] = [];
  const annotations: SchematicSourceAnnotation[] = [];

  const walk = (
    element: Element,
    colour: string | null,
    annotation: SchematicSourceAnnotation | null,
  ): boolean => {
    for (const child of Array.from(element.children)) {
      if (child.namespaceURI !== SVG_NS || !ALLOWED_ELEMENTS.has(child.localName)) {
        return false;
      }
      const attributes = attributesOf(child);
      if (attributes === null) {
        return false;
      }

      if (child.localName === 'g') {
        const feature = attributes.get('data-feature');
        const journalSlot = attributes.get('data-journal-slot');
        // A mount that names no slot is the one malformation this could not
        // detect downstream: it would be read as artwork, the extract would be
        // written without it, and a plate missing one mount looks exactly like a
        // hull that has none there. Refused here instead, by hull and side.
        if (feature !== undefined && journalSlot === undefined && MOUNT_FEATURES.has(feature)) {
          return false;
        }
        // A feature that names a slot opens an annotation; one that does not is
        // artwork whose children are artwork. Nesting an annotation inside an
        // annotation would make one shape belong to two mounts, which the
        // package does not do and this refuses to guess at.
        let next = annotation;
        if (feature !== undefined && journalSlot !== undefined) {
          if (annotation !== null) {
            return false;
          }
          next = { feature, journalSlot, shapes: [], centre: { x: 0, y: 0 } };
          annotations.push(next);
        }
        if (!walk(child, attributes.get('color') ?? colour, next)) {
          return false;
        }
        continue;
      }

      const shape = shapeOf(child.localName, attributes, colour);
      if (shape === null) {
        return false;
      }
      if (annotation === null) {
        artwork.push(shape);
      } else {
        (annotation.shapes as SchematicShape[]).push(shape);
      }
    }
    return true;
  };

  if (!walk(root, rootAttributes.get('color') ?? null, null)) {
    return null;
  }

  // An annotation that names a slot and draws nothing locates nothing. It is
  // not an error the Commander can act on, but it is not a mount either.
  if (annotations.some((annotation) => annotation.shapes.length === 0)) {
    return null;
  }

  const located = annotations.map((annotation) => {
    const extent = extentOf(annotation.shapes);
    return {
      ...annotation,
      centre: { x: extent.x + extent.width / 2, y: extent.y + extent.height / 2 },
    } satisfies SchematicSourceAnnotation;
  });

  return {
    side,
    symbol,
    viewBox,
    content: extentOf([...artwork, ...annotations.flatMap((one) => one.shapes)]),
    artwork,
    annotations: located,
  };
}

/**
 * The rectangle a set of shapes actually covers, in the drawing's own units.
 *
 * This is arithmetic on the numbers the package published, not a measurement of
 * anything rendered: the file is never laid out, and no DOM geometry call
 * appears here or anywhere downstream of it (FR-003).
 *
 * Path coordinates are read as plain number pairs, which is sound because
 * `PATH_DATA` admits `M`, `L` and `Z` and nothing else: every number in an
 * admitted path is half of a point on the outline. A file drawn with any other
 * command never reaches here — it is refused at the parse.
 *
 * The result is grown by half the widest stroke in the set, because a stroke
 * straddles its path and the outermost half of it lies outside these points.
 */
export function extentOf(shapes: readonly SchematicShape[]): SchematicExtent {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let widest = 0;

  const see = (x: number, y: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const shape of shapes) {
    widest = Math.max(widest, Number(shape.strokeWidth ?? 0) || 0);
    if (shape.kind === 'circle') {
      const cx = Number(shape.cx);
      const cy = Number(shape.cy);
      const r = Number(shape.r);
      see(cx - r, cy - r);
      see(cx + r, cy + r);
      continue;
    }
    // Leading-dot numbers included: `.5` is half, and a scanner that read it as
    // `5` would move the rectangle by the same silent amount a relative command
    // would, which is what the grammar above exists to prevent.
    const numbers = shape.d.match(/-?(?:\d+(?:\.\d+)?|\.\d+)/g) ?? [];
    for (let index = 0; index + 1 < numbers.length; index += 2) {
      see(Number(numbers[index]), Number(numbers[index + 1]));
    }
  }

  if (minX > maxX) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const pad = widest / 2;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + widest,
    height: maxY - minY + widest,
  };
}

/**
 * One element's attributes, validated, or `null` if any of them is not promised.
 *
 * Namespaced attributes are matched on the name the file writes, because
 * `inkscape:groupmode` is exactly the kind of editor leftover the contract
 * tolerates and nothing here reads.
 */
function attributesOf(element: Element): Map<string, string> | null {
  const kept = KEPT[element.localName];
  if (kept === undefined) {
    return null;
  }
  const values = new Map<string, string>();

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name;
    if (kept.has(name)) {
      const contract = VALUE[name] ?? WORD;
      if (!contract.test(attribute.value)) {
        return null;
      }
      values.set(name, attribute.value);
      continue;
    }
    if (!DISCARDED.has(name)) {
      return null;
    }
  }

  return values;
}

/** One validated shape, with `currentColor` resolved out of it. */
function shapeOf(
  localName: string,
  attributes: Map<string, string>,
  colour: string | null,
): SchematicShape | null {
  const paint: SchematicPaint = {
    fill: attributes.get('fill') ?? null,
    fillOpacity: attributes.get('fill-opacity') ?? null,
    fillRule: attributes.get('fill-rule') ?? null,
    stroke: resolve(attributes.get('stroke') ?? null, colour),
    strokeWidth: attributes.get('stroke-width') ?? null,
    strokeLinejoin: attributes.get('stroke-linejoin') ?? null,
    strokeLinecap: attributes.get('stroke-linecap') ?? null,
  };

  if (localName === 'path') {
    const d = attributes.get('d');
    return d === undefined ? null : { kind: 'path', d, ...paint };
  }

  const cx = attributes.get('cx');
  const cy = attributes.get('cy');
  const r = attributes.get('r');
  return cx === undefined || cy === undefined || r === undefined
    ? null
    : { kind: 'circle', cx, cy, r, ...paint };
}

/**
 * `currentColor` against the nearest enclosing `color`.
 *
 * Flattening the tree removes the ancestor the keyword would have inherited
 * from, so it is substituted here instead. A file that paints with
 * `currentColor` under no `color` at all keeps the keyword and inherits from
 * the plate, which is the same answer the browser would have given.
 */
function resolve(value: string | null, colour: string | null): string | null {
  return value === 'currentColor' && colour !== null ? colour : value;
}
