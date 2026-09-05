import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

function render(inputs: Readonly<Record<string, unknown>>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [Skeleton] });
  const fixture = TestBed.createComponent(Skeleton);
  for (const [name, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(name, value);
  }
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Skeleton', () => {
  it('says what is pending in words, as a status', () => {
    const host = render({ label: 'This screen is loading.' });

    const block = host.querySelector('[role="status"]');
    expect(block?.textContent).toContain('This screen is loading.');
  });

  it('carries no aria-busy, so nothing holds the sentence back', () => {
    // A live region carrying `aria-busy` is one an assistive technology holds
    // back until the flag drops. This region only exists while the wait is on,
    // so the flag would suppress any reading of it at all.
    const host = render({ label: 'This screen is loading.' });

    expect(host.querySelector('[role="status"]')?.hasAttribute('aria-busy')).toBe(false);
  });

  it('hides the bars from a reader, because the sentence already says it', () => {
    const host = render({ label: 'This screen is loading.' });

    expect(host.querySelector('.skeleton__bars')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('holds room for as many lines as it was asked for', () => {
    const host = render({ label: 'Loading', lines: 5 });

    expect(host.querySelectorAll('.skeleton__bar').length).toBe(5);
  });

  it('always holds room for at least one line', () => {
    // A skeleton that drew nothing would be a wait a Commander cannot see.
    const host = render({ label: 'Loading', lines: 0 });

    expect(host.querySelectorAll('.skeleton__bar').length).toBe(1);
  });

  it('draws a ragged run of widths, and the same one on every pass', () => {
    // The ragged cycle is what makes the block read as lines of content rather
    // than one solid slab, and it repeats from the start so a long block stays
    // the same shape as a short one. A run that is stable but flat would read
    // as a slab, so the values are asserted rather than only their stability.
    const first = [...render({ label: 'Loading', lines: 6 }).querySelectorAll('.skeleton__bar')];
    const second = [...render({ label: 'Loading', lines: 6 }).querySelectorAll('.skeleton__bar')];

    const widths = (bars: readonly Element[]) =>
      bars.map((bar) => (bar as HTMLElement).style.inlineSize);
    expect(widths(first)).toEqual(['100%', '94%', '72%', '86%', '100%', '94%']);
    expect(widths(second)).toEqual(widths(first));
  });
});
