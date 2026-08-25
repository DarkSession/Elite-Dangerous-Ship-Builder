import { ActionButton } from './action-button';
import { ActionLink } from './action-link';
import {
  accessibleName,
  element,
  query,
  renderComponent,
  textOf,
} from '../ui-component.spec-helpers';

describe('ActionButton', () => {
  it('renders a real button element', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build' });

    expect(query(fixture, 'button').tagName).toBe('BUTTON');
    expect(query(fixture, 'button').getAttribute('type')).toBe('button');
  });

  it('makes the visible name and the accessible name the same', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build' });
    const button = query(fixture, 'button');

    expect(textOf(button)).toBe('Save build');
    expect(accessibleName(button)).toBe('Save build');
    expect(button.getAttribute('aria-label')).toBeNull();
  });

  it('exposes the busy state and keeps its label', () => {
    const fixture = renderComponent(ActionButton, {
      label: 'Save build',
      busy: true,
      busyLabel: 'Working',
    });
    const button = query(fixture, 'button');

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(textOf(button)).toContain('Save build');
    expect(accessibleName(button)).toContain('Save build');
    expect(accessibleName(button)).toContain('Working');
  });

  it('draws a supplied mark and still answers to its name', () => {
    const fixture = renderComponent(ActionButton, { label: 'Help', symbol: '?' });
    const button = query(fixture, 'button');

    // The mark is what is drawn; the name is what is announced. A reader meets
    // "Help", never "question mark", and never both.
    expect(textOf(button)).toContain('?');
    expect(accessibleName(button)).toBe('Help');
    expect(button.getAttribute('aria-label')).toBeNull();
    expect(query(fixture, '.action__symbol').getAttribute('aria-hidden')).toBe('true');
  });

  it('carries a target size of its own rather than inheriting one from words', () => {
    const marked = renderComponent(ActionButton, { label: 'Help', symbol: '?' });
    const worded = renderComponent(ActionButton, { label: 'Help' });

    // One glyph is narrower than any label, so the variant states the target
    // the words used to give it (constitution V).
    expect(query(marked, 'button').classList).toContain('action--symbol');
    expect(query(worded, 'button').classList).not.toContain('action--symbol');
  });

  it('draws its words when no mark is supplied', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build' });

    expect(query(fixture, 'button').querySelector('.action__symbol')).toBeNull();
    expect(query(fixture, '.action__label').textContent).toBe('Save build');
  });

  it('does not claim a toggle state when it is not a toggle', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build' });

    expect(query(fixture, 'button').getAttribute('aria-pressed')).toBeNull();
  });

  it('exposes the pressed state of a toggle', () => {
    const fixture = renderComponent(ActionButton, { label: 'Show details', pressed: true });

    expect(query(fixture, 'button').getAttribute('aria-pressed')).toBe('true');
  });

  it('exposes an unpressed toggle as false, not as absent', () => {
    const fixture = renderComponent(ActionButton, { label: 'Show details', pressed: false });

    expect(query(fixture, 'button').getAttribute('aria-pressed')).toBe('false');
  });

  it('exposes the disabled state natively', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build', disabled: true });

    expect((query(fixture, 'button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('emits intent when activated', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build' });
    let activations = 0;
    fixture.componentInstance.activated.subscribe(() => (activations += 1));

    query(fixture, 'button').click();

    expect(activations).toBe(1);
  });

  it('emits nothing while disabled', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build', disabled: true });
    let activations = 0;
    fixture.componentInstance.activated.subscribe(() => (activations += 1));

    fixture.componentInstance.activate();

    expect(activations).toBe(0);
  });

  it('emits nothing while busy, so one action cannot be started twice', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build', busy: true });
    let activations = 0;
    fixture.componentInstance.activated.subscribe(() => (activations += 1));

    fixture.componentInstance.activate();

    expect(activations).toBe(0);
  });

  it('never renders without a visible label', () => {
    const fixture = renderComponent(ActionButton, { label: 'Save build' });

    expect(textOf(query(fixture, '.action__label')).length).toBeGreaterThan(0);
  });
});

describe('ActionLink', () => {
  it('renders a real anchor with its destination', () => {
    const fixture = renderComponent(ActionLink, { label: 'Licences', href: '/licences' });
    const link = query(fixture, 'a');

    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/licences');
    expect(textOf(link)).toContain('Licences');
  });

  it('does not mark an internal link as external', () => {
    const fixture = renderComponent(ActionLink, { label: 'Licences', href: '/licences' });
    const link = query(fixture, 'a');

    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute('rel')).toBeNull();
  });

  it('names an external destination in visible text before a Commander leaves', () => {
    const fixture = renderComponent(ActionLink, {
      label: 'Almanac',
      href: 'https://example.invalid',
      external: true,
      externalLabel: 'Opens in a new tab',
    });
    const link = query(fixture, 'a');

    expect(textOf(link)).toContain('Opens in a new tab');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('exposes a disabled link as disabled', () => {
    const fixture = renderComponent(ActionLink, {
      label: 'Licences',
      href: '/licences',
      disabled: true,
    });

    expect(query(fixture, 'a').getAttribute('aria-disabled')).toBe('true');
  });

  it('resolves its own text from inputs rather than hard-coding any', () => {
    const fixture = renderComponent(ActionLink, { label: 'Lizenzen', href: '/licences' });

    expect(textOf(element(fixture))).toBe('Lizenzen');
  });
});
