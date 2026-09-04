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

  it('marks the status as no longer busy, so the sentence is announced', () => {
    // A live region carrying `aria-busy` is one an assistive technology holds
    // back until the flag drops. This region only exists while the wait is on,
    // so the flag would suppress the single announcement it exists to make.
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

  it('draws the same widths on every pass', () => {
    const first = [...render({ label: 'Loading', lines: 6 }).querySelectorAll('.skeleton__bar')];
    const second = [...render({ label: 'Loading', lines: 6 }).querySelectorAll('.skeleton__bar')];

    const widths = (bars: readonly Element[]) =>
      bars.map((bar) => (bar as HTMLElement).style.inlineSize);
    expect(widths(second)).toEqual(widths(first));
  });
});
