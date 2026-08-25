import {
  accessibleName,
  element,
  query,
  renderComponent,
  textOf,
} from '../ui-component.spec-helpers';
import { WarnedExternalLink } from './warned-external-link';

const INPUTS = {
  label: 'Read the full licence on GitHub',
  href: 'https://github.com/DarkSession/Elite-Dangerous-Ship-Builder/blob/main/LICENSE',
  purpose: 'It carries the remaining licence and third-party terms.',
  leavingWarning: 'It leaves Ship Builder.',
  networkWarning: 'It may need a network connection.',
};

describe('WarnedExternalLink', () => {
  it('is a real link to the destination it names', () => {
    const fixture = renderComponent(WarnedExternalLink, INPUTS);
    const link = query(fixture, 'a');

    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe(INPUTS.href);
  });

  it('carries rel="noreferrer noopener" so the destination learns nothing', () => {
    const fixture = renderComponent(WarnedExternalLink, INPUTS);

    expect(query(fixture, 'a').getAttribute('rel')).toBe('noreferrer noopener');
  });

  it('makes the visible name the accessible name', () => {
    const fixture = renderComponent(WarnedExternalLink, INPUTS);
    const link = query(fixture, 'a');

    expect(textOf(link)).toBe(INPUTS.label);
    expect(accessibleName(link)).toContain(INPUTS.label);
    expect(link.getAttribute('aria-label')).toBeNull();
  });

  it('states purpose, leaving and network in visible text and associates all three', () => {
    const fixture = renderComponent(WarnedExternalLink, INPUTS);
    const link = query(fixture, 'a');
    const describedBy = link.getAttribute('aria-describedby');
    const description = element(fixture).querySelector(`#${describedBy}`);

    expect(describedBy).not.toBeNull();
    expect(textOf(description)).toContain(INPUTS.purpose);
    expect(textOf(description)).toContain(INPUTS.leavingWarning);
    expect(textOf(description)).toContain(INPUTS.networkWarning);
  });

  it('reads the three warnings in a fixed order', () => {
    const fixture = renderComponent(WarnedExternalLink, INPUTS);
    const warnings = [...element(fixture).querySelectorAll('.warned-external__warning')];

    expect(warnings.map((warning) => textOf(warning))).toEqual([
      INPUTS.purpose,
      INPUTS.leavingWarning,
      INPUTS.networkWarning,
    ]);
  });

  it('is inert until it is activated: nothing prefetches or preconnects', () => {
    const fixture = renderComponent(WarnedExternalLink, INPUTS);
    const root = element(fixture);

    expect(root.querySelectorAll('link, img, iframe, script').length).toBe(0);
    expect(query(fixture, 'a').getAttribute('ping')).toBeNull();
  });
});
