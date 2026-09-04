import { TestBed } from '@angular/core/testing';
import { WaitingMark } from './waiting-mark';

function render() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [WaitingMark] });
  const fixture = TestBed.createComponent(WaitingMark);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('WaitingMark', () => {
  it('is absent from the accessibility tree, because what is pending is said in words', () => {
    const mark = render().querySelector('img');

    expect(mark?.getAttribute('alt')).toBe('');
    expect(mark?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reaches its drawing by a relative path, so it resolves under any base', () => {
    const source = render().querySelector('img')?.getAttribute('src');

    expect(source).toBe('assets/loader.svg');
    expect(source?.startsWith('/')).toBe(false);
  });
});
