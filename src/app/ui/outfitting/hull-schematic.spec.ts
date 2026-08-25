import type {
  MountOccurrence,
  SchematicDocument,
  SideAssetState,
} from '../../domain/anatomy/anatomy-model';
import {
  accessibleName,
  element,
  query,
  renderComponent,
  textOf,
} from '../components/ui-component.spec-helpers';
import { HullSchematic, type HullSchematicView } from './hull-schematic';

/**
 * What one plate promises a reader.
 *
 * The plate is the only place in the capability where a shape carries meaning,
 * so every assertion here is about the words beside the shape: that a mount
 * says which mount it is, which side it is on and what state it is in; that a
 * side which did not arrive says so in place of the drawing rather than leaving
 * an empty frame; and that the geometry it renders is the geometry it was
 * handed, unmoved and unmeasured.
 */

function document(): SchematicDocument {
  return {
    side: 'top',
    symbol: 'Anaconda',
    viewBox: '0 0 240 480',
    content: { x: 0, y: 0, width: 240, height: 480 },
    annotations: [],
  };
}

function occurrence(overrides: Partial<MountOccurrence['item']> = {}): MountOccurrence {
  return {
    item: {
      key: 'SmallHardpoint1',
      name: 'Small Hardpoint 1',
      kind: 'hardpoint',
      node: 1,
      fitted: true,
      engineered: false,
      sides: ['top'],
      ...overrides,
    },
    side: 'top',
    centre: { x: 60, y: 120 },
  };
}

function view(overrides: Partial<HullSchematicView> = {}): HullSchematicView {
  return {
    side: 'top',
    state: { kind: 'ready', document: document() } satisfies SideAssetState,
    occurrences: [occurrence()],
    selectedKey: null,
    hullName: 'Anaconda',
    ...overrides,
  };
}

describe('HullSchematic', () => {
  it('lays the hull on its side and centres it in the plate’s own frame', () => {
    const fixture = renderComponent(HullSchematic, { view: view() });

    const drawing = query(fixture, '.schematic__drawing');
    // The package draws every hull nose-up. Turned a quarter turn, a 240x480
    // hull is 480 across and 240 up. The plate is 720/292 whatever the hull is,
    // and this one is stubbier than that, so the frame widens to
    // 240 x 720/292 = 591.781 and the hull sits centred in it — which is what
    // lets one reserved box hold every hull in the game.
    expect(drawing.getAttribute('viewBox')).toBe('0 0 591.781 240');
    expect(drawing.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    // A picture with a text equivalent: the mounts are buttons outside it, so
    // the drawing itself holds no control.
    expect(drawing.getAttribute('role')).toBe('img');
    expect(query(fixture, '.schematic__artwork').getAttribute('transform')).toBe(
      'translate(55.89 240) rotate(-90)',
    );
  });

  it('draws the whole document as one picture at the package’s own viewBox', () => {
    const fixture = renderComponent(HullSchematic, { view: view() });

    // Ninety kilobytes of sub-pixel path data that a fixed-ratio plate would
    // re-rasterise on every resize, so the package SVG is never fetched: the
    // picture and the marks are both made from it at build time, and the
    // picture is drawn inside the same turned group the marks are placed from,
    // so the two cannot drift apart.
    const image = query(fixture, '.schematic__artwork image');
    expect(image.getAttribute('href')).toBe('assets/ships/Anaconda/schematic-top.png');
    expect(image.getAttribute('width')).toBe('240');
    expect(image.getAttribute('height')).toBe('480');
    expect(fixture.nativeElement.querySelectorAll('.schematic__artwork path').length).toBe(0);
  });

  it('sets each mount’s box where the package drew it, turned with the hull', () => {
    const fixture = renderComponent(HullSchematic, { view: view() });

    // Centre (60, 120) in a 240x480 hull at the origin. Turned anticlockwise
    // the hull's own y runs across the frame and its x runs up it, so the mark
    // lands a quarter along the hull and three quarters down it — then shifted
    // by the margin that centres this stubby hull in the plate's wider frame.
    const mount = query(fixture, '.schematic__mount');
    expect(Number.parseFloat(mount.style.left)).toBeCloseTo(29.722, 3);
    expect(mount.style.top).toBe('75%');
  });

  it('steps a mark aside from one it would touch, and ties it back to its mount', () => {
    // Four drawing units apart on a hull 480 across: the Almanac's own case,
    // where two real mounts are closer together than a mark is wide. The second
    // mark moves; the mount it belongs to does not, and the hairline between
    // them is what keeps the mount's real position on the plate
    // (design/hull-anatomy.md, "Marks that would touch").
    const fixture = renderComponent(HullSchematic, {
      view: view({
        occurrences: [
          occurrence(),
          { ...occurrence({ key: 'SmallHardpoint2', node: 2 }), centre: { x: 60, y: 124 } },
        ],
      }),
    });

    const marks = element(fixture).querySelectorAll<HTMLElement>('.schematic__mount');
    expect(marks[0].getAttribute('data-displaced')).toBe('false');
    expect(marks[1].getAttribute('data-displaced')).toBe('true');
    expect(marks[1].style.left).not.toBe(marks[0].style.left);

    const leaders = element(fixture).querySelectorAll('.schematic__leader');
    expect(leaders.length).toBe(1);
    // The far end is the middle of the package's own annotation, turned with
    // the hull — the position the unmoved mark would have had.
    expect(Number(leaders[0].getAttribute('x1'))).toBeCloseTo(179.89, 2);
    expect(Number(leaders[0].getAttribute('y1'))).toBeCloseTo(180, 2);
    expect(Number(leaders[0].getAttribute('x2'))).not.toBeCloseTo(179.89, 2);
    // Decoration: the mount is a named button and the line says nothing a
    // reader has to hear.
    expect(query(fixture, '.schematic__leaders').getAttribute('aria-hidden')).toBe('true');
  });

  it('draws no leader when every mount has room for its own mark', () => {
    const fixture = renderComponent(HullSchematic, {
      view: view({
        occurrences: [
          occurrence(),
          { ...occurrence({ key: 'HugeHardpoint1', node: 2 }), centre: { x: 200, y: 400 } },
        ],
      }),
    });

    expect(element(fixture).querySelector('.schematic__leaders')).toBeNull();
    for (const mark of element(fixture).querySelectorAll('.schematic__mount')) {
      expect(mark.getAttribute('data-displaced')).toBe('false');
    }
  });

  it('filters the drawing on an ordinary box rather than on a group inside it', () => {
    // A CSS filter function on an SVG container element is not applied by every
    // engine — WebKit on iPadOS leaves it off and the plate then shows the
    // package's own near-black navy. The marks and leaders stay outside the
    // filtered box, so they keep the interface's own colours.
    const fixture = renderComponent(HullSchematic, { view: view() });

    const picture = query(fixture, '.schematic__picture');
    expect(picture.querySelector('.schematic__drawing')).not.toBeNull();
    expect(picture.querySelector('.schematic__mount')).toBeNull();
  });

  it('names the plate by its side and describes it by hull and orientation', () => {
    const fixture = renderComponent(HullSchematic, { view: view({ side: 'bottom' }) });

    expect(textOf(query(fixture, '.schematic__side'))).toMatch(/bottom/i);
    expect(accessibleName(query(fixture, '.schematic'))).toMatch(/bottom/i);
    const description = query(fixture, '.schematic__drawing').getAttribute('aria-label') ?? '';
    expect(description).toContain('Anaconda');
    expect(description).toMatch(/bottom/i);
  });

  it('states every mount fact in words, not in the treatment', () => {
    const fixture = renderComponent(HullSchematic, {
      view: view({ occurrences: [occurrence({ engineered: true })] }),
    });

    const name = accessibleName(query(fixture, '.schematic__mount'));
    expect(name).toContain('Small Hardpoint 1');
    expect(name).toMatch(/hardpoint/i);
    expect(name).toMatch(/top/i);
    expect(name).toMatch(/fitted/i);
    expect(name).toMatch(/engineered/i);
  });

  it('says utility and empty and stock when that is what the mount is', () => {
    const fixture = renderComponent(HullSchematic, {
      view: view({
        occurrences: [occurrence({ kind: 'utility', fitted: false, engineered: false })],
      }),
    });

    const name = accessibleName(query(fixture, '.schematic__mount'));
    expect(name).toMatch(/utility/i);
    expect(name).toMatch(/empty/i);
    expect(name).toMatch(/stock/i);
  });

  it('exposes selection as pressed state as well as a fill', () => {
    const fixture = renderComponent(HullSchematic, {
      view: view({ selectedKey: 'SmallHardpoint1' }),
    });

    expect(query(fixture, '.schematic__mount').getAttribute('aria-pressed')).toBe('true');

    const other = renderComponent(HullSchematic, { view: view({ selectedKey: 'HugeHardpoint1' }) });
    expect(query(other, '.schematic__mount').getAttribute('aria-pressed')).toBe('false');
  });

  it('draws the canvas’s numbered box, and its engineering mark when there is one', () => {
    const fixture = renderComponent(HullSchematic, { view: view() });
    expect(textOf(query(fixture, '.schematic__mount'))).toBe('1');
    expect(fixture.nativeElement.querySelector('.schematic__engineered')).toBeNull();

    const marked = renderComponent(HullSchematic, {
      view: view({ occurrences: [occurrence({ node: 4, engineered: true })] }),
    });
    expect(textOf(query(marked, '.schematic__mount'))).toBe('4');
    // Decoration: the button's own name already says the module is engineered.
    const mark = query(marked, '.schematic__engineered');
    expect(mark.getAttribute('alt')).toBe('');
  });

  it('emits the exact package slot key, from a real button', () => {
    const fixture = renderComponent(HullSchematic, { view: view() });
    const emitted: string[] = [];
    fixture.componentInstance.slotActivated.subscribe((key) => emitted.push(key));

    const mount = query(fixture, '.schematic__mount');
    // A `button`, so Enter and Space are the platform's job rather than three
    // handlers of this component's own (FR-012).
    expect(mount.tagName.toLowerCase()).toBe('button');
    expect(mount.getAttribute('type')).toBe('button');
    mount.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(emitted).toEqual(['SmallHardpoint1']);
  });

  it('carries the illustration’s own loading mark while a side is on its way', () => {
    const fixture = renderComponent(HullSchematic, {
      view: view({ state: { kind: 'loading' }, occurrences: [] }),
    });

    expect(element(fixture).querySelector('.schematic__drawing')).toBeNull();
    // The same mark the hull illustration carries, in the place the drawing
    // will be, with the words spoken rather than drawn.
    expect(query(fixture, '.schematic__loader').getAttribute('src')).toBe('assets/loader.svg');
    expect(textOf(query(fixture, '.schematic__spoken')).length).toBeGreaterThan(0);
    expect(query(fixture, '.schematic').getAttribute('data-state')).toBe('loading');
    expect(element(fixture).querySelector('edsb-action-button')).toBeNull();
  });

  it('reserves the plate’s box in every state, so a late drawing moves nothing', () => {
    // Canvas 1c's frame is one shape for every hull and every state. It is what
    // the region's height is reserved from, so the fitting bench below does not
    // move when a schematic lands.
    for (const state of [
      { kind: 'loading' } as const,
      { kind: 'temporarilyUnavailable' } as const,
      { kind: 'contractDefect' } as const,
    ]) {
      const fixture = renderComponent(HullSchematic, { view: view({ state, occurrences: [] }) });
      expect(query(fixture, '.schematic__frame')).not.toBeNull();
    }
  });

  it('states a picture that did not arrive, rather than marking an empty frame', () => {
    // A side is two files: the mount extract decides the state, the rendering
    // is fetched by the drawing itself. Without this the plate would keep
    // reporting `ready` and draw its numbered marks over nothing (FR-010) —
    // which is what happens for real when a package pin moves and only one of
    // the two reproduction scripts is re-run.
    const fixture = renderComponent(HullSchematic, { view: view({}) });
    expect(element(fixture).querySelectorAll('.schematic__mount').length).toBeGreaterThan(0);

    query(fixture, '.schematic__artwork image').dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(element(fixture).querySelector('.schematic__drawing')).toBeNull();
    expect(element(fixture).querySelector('.schematic__mount')).toBeNull();
    expect(query(fixture, '.schematic').getAttribute('data-state')).toBe('temporarilyUnavailable');
    expect(textOf(query(fixture, '.schematic__status-text')).length).toBeGreaterThan(0);

    // And asking again re-creates the image, because the store's own state is
    // already `ready` and nothing it does would re-request the file.
    query(fixture, 'edsb-action-button button').click();
    fixture.detectChanges();
    expect(query(fixture, '.schematic__artwork image')).not.toBeNull();
  });

  it('offers a retry for a side that did not arrive, and none for a defective one', () => {
    const unavailable = renderComponent(HullSchematic, {
      view: view({ state: { kind: 'temporarilyUnavailable' }, occurrences: [] }),
    });
    const retried: number[] = [];
    unavailable.componentInstance.retryRequested.subscribe(() => retried.push(1));

    query(unavailable, 'edsb-action-button button').click();
    expect(retried.length).toBe(1);

    // A package defect is not a network hiccup: asking again returns the same
    // broken document, so the plate states it and offers nothing.
    const defect = renderComponent(HullSchematic, {
      view: view({ state: { kind: 'contractDefect' }, occurrences: [] }),
    });
    expect(query(defect, '.schematic').getAttribute('data-state')).toBe('contractDefect');
    expect(element(defect).querySelector('edsb-action-button')).toBeNull();
    expect(textOf(query(defect, '.schematic__status-text')).length).toBeGreaterThan(0);
  });
});
