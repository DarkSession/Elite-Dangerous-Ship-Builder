/**
 * The modal `<dialog>` methods, for the test DOM that has none of them.
 *
 * Every layer calls `showModal()` the moment it opens and `close()` when it
 * goes, so every specification that renders one needs both. The stub is
 * faithful in the one respect behaviour depends on: `close()` queues the
 * `close` event rather than dispatching it inline, as the HTML specification
 * requires and as a browser does.
 *
 * The methods stay on the prototype for the rest of the run. There is nothing
 * to put back: the environment has no implementation of either, and putting
 * that absence back under a fixture that is still standing makes the fixture
 * throw as it is destroyed.
 */
export function stubNativeDialog(): void {
  const prototype = HTMLDialogElement.prototype as unknown as Record<string, unknown>;
  prototype['showModal'] = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype['close'] = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) {
      return;
    }
    this.removeAttribute('open');
    queueMicrotask(() => this.dispatchEvent(new Event('close')));
  };
}
