import { TestBed } from '@angular/core/testing';
import { Layer } from './layer';
import { stubNativeDialog } from './layer.spec-helpers';

function render() {
  stubNativeDialog();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Layer] });
  const fixture = TestBed.createComponent(Layer);
  fixture.componentRef.setInput('title', 'A layer');
  fixture.componentRef.setInput('dismissLabel', 'Close');
  fixture.componentRef.setInput('open', true);

  const dismissals: number[] = [];
  fixture.componentRef.instance.dismissed.subscribe(() => dismissals.push(1));
  fixture.detectChanges();

  return { fixture, dismissals };
}

const dialogOf = (fixture: ReturnType<typeof render>['fixture']) =>
  (fixture.nativeElement as HTMLElement).querySelector('dialog')!;

/** Lets the queued `close` event run, as a browser's task queue would. */
const settle = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

describe('Layer', () => {
  it('hands focus back when the layer is taken away rather than closed', async () => {
    // A deferred block stands a layer on the screen while its chunk is on the
    // wire, and the chunk landing takes that layer away without its `open`
    // input ever falling. A layer that hands focus back only on that input
    // leaves the reader at the top of the document, and the layer arriving
    // records the document body as the control that opened it.
    const invoker = document.createElement('button');
    document.body.append(invoker);
    invoker.focus();

    stubNativeDialog();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Layer] });
    const fixture = TestBed.createComponent(Layer);
    fixture.componentRef.setInput('title', 'A layer');
    fixture.componentRef.setInput('dismissLabel', 'Close');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    // What `showModal` does in a browser and jsdom does not: the layer takes
    // the focus off the control that opened it.
    dialogOf(fixture).querySelector('button')!.focus();
    expect(document.activeElement).not.toBe(invoker);

    fixture.destroy();
    await settle();

    expect(document.activeElement).toBe(invoker);
    invoker.remove();
  });

  it('does not report a close its own owner asked for as a dismissal', async () => {
    const { fixture, dismissals } = render();
    expect(dialogOf(fixture).hasAttribute('open')).toBe(true);

    // The owner lowers `open` itself — the save layer stepping aside to ask a
    // conflict question is this case. Nothing was dismissed; the owner already
    // knows, because it is the one that closed the layer.
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    await settle();

    expect(dialogOf(fixture).hasAttribute('open')).toBe(false);
    expect(dismissals).toEqual([]);
  });

  it('reports a close the element honoured itself, which is what Escape is', async () => {
    const { fixture, dismissals } = render();

    // Escape reaches the element rather than this component, so the event is
    // the only sign it happened. `open` is still true: the owner has not been
    // told yet, and telling it is the point.
    dialogOf(fixture).dispatchEvent(new Event('close'));
    await settle();

    expect(dismissals).toEqual([1]);
  });

  it('reports the dismiss control once, not twice as it closes behind it', async () => {
    const { fixture, dismissals } = render();

    const dismiss = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.layer__dismiss',
    )!;
    dismiss.click();
    // The owner answers a dismissal by lowering `open`, which closes the
    // dialog, which queues a second `close`. One gesture is one dismissal.
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    await settle();

    expect(dismissals).toEqual([1]);
  });

  it('reports the next genuine dismissal after an owner-driven close', async () => {
    const { fixture, dismissals } = render();

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    await settle();
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    // The flag the owner-driven close set is consumed by the event it queued,
    // never left standing to swallow the dismissal after it.
    dialogOf(fixture).dispatchEvent(new Event('close'));
    await settle();

    expect(dismissals).toEqual([1]);
  });
});
