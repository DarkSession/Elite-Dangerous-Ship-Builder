import { parseSchematic } from './schematic-svg-parser';

/**
 * What the parser refuses, and what it keeps.
 *
 * The acceptance half — that every file the package actually ships parses — is
 * asserted over the whole installed catalogue in
 * `src/app/domain/anatomy/almanac-anatomy-contract.spec.ts`. This file is the
 * other half: the things a compromised or simply wrong file could contain, each
 * of which has to end the parse rather than be quietly dropped.
 */

const OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">';

function svg(body: string): string {
  return `${OPEN}${body}</svg>`;
}

function parse(source: string) {
  return parseSchematic(source, 'top', 'Anaconda');
}

describe('schematic SVG parser', () => {
  describe('refusals', () => {
    it('refuses malformed XML', () => {
      expect(parse('<svg><g></svg>')).toBeNull();
    });

    it('refuses a doctype', () => {
      expect(
        parse(`<!DOCTYPE svg><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>`),
      ).toBeNull();
    });

    it('refuses a non-SVG root', () => {
      expect(parse('<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>')).toBeNull();
    });

    it('refuses an SVG root in the wrong namespace', () => {
      expect(parse('<svg xmlns="http://example.invalid/svg" viewBox="0 0 1 1"/>')).toBeNull();
    });

    it('refuses a root with no viewBox, because nothing may compute one', () => {
      expect(parse('<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>')).toBeNull();
    });

    it.each([
      ['script', '<script>alert(1)</script>'],
      ['style', '<style>*{fill:red}</style>'],
      ['image', '<image href="x.png"/>'],
      ['use', '<use href="#a"/>'],
      ['foreignObject', '<foreignObject><b/></foreignObject>'],
      ['a', '<a href="https://example.invalid"><path d="M0 0"/></a>'],
      ['text', '<text>7</text>'],
      ['defs', '<defs><pattern id="p"/></defs>'],
    ])('refuses a %s element', (_name, markup) => {
      expect(parse(svg(`<g>${markup}</g>`))).toBeNull();
    });

    it.each([
      ['an event handler', '<path d="M0 0" onload="alert(1)"/>'],
      ['a style attribute', '<path d="M0 0" style="fill:red"/>'],
      ['a clip-path reference', '<path d="M0 0" clip-path="url(#c)"/>'],
      ['a filter reference', '<g filter="url(#f)"><path d="M0 0"/></g>'],
      ['a transform', '<g transform="translate(5 5)"><path d="M0 0"/></g>'],
      ['an unexpected href', '<path d="M0 0" href="x"/>'],
    ])('refuses %s', (_name, markup) => {
      expect(parse(svg(markup))).toBeNull();
    });

    it.each([
      ['a fill naming a resource', '<path d="M0 0" fill="url(#g)"/>'],
      ['a stroke naming a resource', '<path d="M0 0" stroke="url(#g)"/>'],
      ['a colour that is not a hex, none or currentColor', '<path d="M0 0" fill="red"/>'],
      ['path data carrying letters outside the command set', '<path d="M0 0 Zx"/>'],
      // `extentOf` reads path data as consecutive number *pairs*, which only
      // `M`, `L` and `Z` make true. A curve's control points would pair
      // correctly by luck; `H`, `V` and `A` would not, and would shift every
      // number after them. Refused as a family rather than case by case,
      // because the failure downstream is silent: the extract's digest still
      // matches the file it was made from.
      ['path data drawn with a curve', '<path d="M0 0 C1 1 2 2 3 3"/>'],
      ['path data drawn with a relative move', '<path d="m0 0 L8 8 Z"/>'],
      ['path data drawn with a relative line', '<path d="M0 0 l8 8 Z"/>'],
      ['path data drawn with a horizontal line', '<path d="M0 0 H8 Z"/>'],
      ['path data drawn with an arc', '<path d="M0 0 A1 1 0 0 1 8 8"/>'],
      ['a non-numeric radius', '<circle cx="1" cy="1" r="1e5"/>'],
    ])('refuses %s', (_name, markup) => {
      expect(parse(svg(markup))).toBeNull();
    });

    // A mount that names no slot would otherwise be read as artwork and left
    // out of the extract, and a plate missing one mount looks exactly like a
    // hull that has none there.
    it.each([
      ['hardpoint', '<g data-feature="hardpoint"><path d="M0 0 L8 8 Z"/></g>'],
      ['utility_mount', '<g data-feature="utility_mount"><path d="M0 0 L8 8 Z"/></g>'],
    ])('refuses a %s annotation that names no slot', (_name, markup) => {
      expect(parse(svg(markup))).toBeNull();
    });

    it('refuses a feature annotation nested inside another', () => {
      const nested =
        '<g data-feature="hardpoint" data-journal-slot="A">' +
        '<g data-feature="hardpoint" data-journal-slot="B"><path d="M0 0"/></g>' +
        '<path d="M1 1"/></g>';
      expect(parse(svg(nested))).toBeNull();
    });

    it('refuses an annotation that draws nothing', () => {
      expect(parse(svg('<g data-feature="hardpoint" data-journal-slot="A"><g/></g>'))).toBeNull();
    });
  });

  describe('what it keeps', () => {
    // Verbatim from the installed `Anaconda/schematic-top.svg`, including the
    // editor metadata the contract tolerates and this discards.
    const real =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 1200 800" width="1200" height="800" color="#17242d">' +
      '<g id="layer-hardpoint" inkscape:groupmode="layer" data-feature-category="hardpoint" data-feature-color="#e63946">' +
      '<g id="layer-hardpoint-03" inkscape:groupmode="layer" data-feature="hardpoint" data-journal-slot="LargeHardpoint2" data-visible="true">' +
      '<path d="M 560.7365 262.1368 L 579.5625 262.1379 Z" fill="#e63946" fill-opacity="0.72" fill-rule="evenodd" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' +
      '</g></g>' +
      '<g id="layer-canopy" data-feature-color="#00a6c8" color="#00a6c8">' +
      '<g id="layer-canopy-01" data-feature="canopy" data-visible="true">' +
      '<circle cx="600" cy="120" r="4" fill="none" stroke="currentColor" stroke-width="0.7"/>' +
      '</g></g></svg>';

    it('reads the package viewBox and nothing else about size', () => {
      expect(parse(real)?.viewBox).toBe('0 0 1200 800');
    });

    it('keeps an annotated feature with its exact package words', () => {
      const annotations = (parse(real)?.annotations ?? []).map(({ centre, ...rest }) => {
        expect(centre).toBeDefined();
        return rest;
      });
      expect(annotations).toEqual([
        {
          feature: 'hardpoint',
          journalSlot: 'LargeHardpoint2',
          shapes: [
            {
              kind: 'path',
              d: 'M 560.7365 262.1368 L 579.5625 262.1379 Z',
              fill: '#e63946',
              fillOpacity: '0.72',
              fillRule: 'evenodd',
              stroke: '#17242d',
              strokeWidth: '1.2',
              strokeLinejoin: 'round',
              strokeLinecap: null,
            },
          ],
        },
      ]);
    });

    it('locates each annotation at the middle of what it draws', () => {
      // Arithmetic on the package's own numbers, grown by half the stroke that
      // straddles them. Nothing is laid out and nothing is measured (FR-003).
      const centre = parse(real)?.annotations[0].centre;
      expect(centre?.x).toBeCloseTo(570.1495, 4);
      expect(centre?.y).toBeCloseTo(262.13735, 5);
    });

    it('reports the rectangle the file actually draws inside its viewBox', () => {
      // Every hull is drawn nose-up and centred in a mostly empty 1200x800 box.
      // The plate frames what is drawn, not what the file declares.
      const content = parse(real)?.content;
      expect(content?.x).toBeCloseTo(560.1365, 4);
      expect(content?.y).toBeCloseTo(115.4, 4);
      expect(content?.width).toBeCloseTo(44.4635, 4);
      expect(content?.height).toBeCloseTo(147.3379, 4);
    });

    it('leaves an unannotated feature as inert artwork', () => {
      const document = parse(real);
      expect(document?.artwork).toHaveLength(1);
      expect(document?.artwork[0].kind).toBe('circle');
    });

    it('resolves currentColor against the nearest enclosing colour', () => {
      // The canopy layer sets its own; the hardpoint layer does not and takes
      // the root's. Flattening removes the ancestor, so the value is substituted.
      expect(parse(real)?.artwork[0].stroke).toBe('#00a6c8');
      expect(parse(real)?.annotations[0].shapes[0].stroke).toBe('#17242d');
    });

    it('produces no markup for a raw or trusted sink', () => {
      const document = parse(real);
      expect(JSON.stringify(document)).not.toContain('<');
    });
  });
});
