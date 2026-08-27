/**
 * Declaring a measurement to a renderer that lays nothing out.
 *
 * jsdom gives every box a zero rect, so a spec about a width says what the
 * width is. Saying it on a prototype is the only way to reach an element a
 * component owns — and *which* prototype is the whole reason this is written
 * once rather than three times.
 *
 * `getBoundingClientRect` belongs to `Element`. A spec that patches
 * `HTMLElement.prototype` and then puts the original back by assignment leaves
 * an own property behind on `HTMLElement.prototype` holding the genuine method:
 * correct to call, and permanently shadowing `Element.prototype`. The next spec
 * to patch `Element.prototype` — the level the method actually lives at — then
 * patches something nothing reads, measures zero, and fails for a reason that
 * is not in its own file. Whether it fails at all depends on which specs shared
 * a worker, so it appears and disappears as the suite is re-sharded, which is
 * the worst way for a test to be wrong.
 *
 * So both halves are here: the patch goes on `HTMLElement.prototype`, which
 * nothing can shadow, and the undo puts the prototype back to owning nothing.
 */

type Measured = { getBoundingClientRect?: unknown };

/**
 * Reports one rect from every element, and gives back the undo.
 *
 * The parts named are merged onto the renderer's own rect, so a caller declares
 * the width it is about and inherits every other edge.
 */
export function declareMeasurement(rect: Partial<DOMRect>): () => void {
  const own = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'getBoundingClientRect');
  const measure = Element.prototype.getBoundingClientRect;

  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: function measured(this: Element): DOMRect {
      return Object.assign(measure.call(this), rect) as DOMRect;
    },
  });

  return () => {
    if (own === undefined) {
      delete (HTMLElement.prototype as Measured).getBoundingClientRect;
      return;
    }
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', own);
  };
}

/**
 * Installs a `ResizeObserver` that observes nothing, and gives back the undo.
 *
 * The renderer has none, and the reading these specs are about is the
 * synchronous one `observeComposition` takes before it observes anything — so
 * the stub exists to make that path be taken at all, not to simulate a resize.
 * Removed again afterwards, because a renderer that *has* no observer is what
 * every other spec is entitled to see.
 */
export function declareResizeObserver(): () => void {
  const own = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');

  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };

  return () => {
    if (own === undefined) {
      delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
      return;
    }
    Object.defineProperty(globalThis, 'ResizeObserver', own);
  };
}
