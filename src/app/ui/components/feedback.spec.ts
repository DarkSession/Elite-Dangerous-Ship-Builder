import { AppFrame } from './app-frame/app-frame';
import { StatusNotice } from './status/status-notice';
import { UnavailableValue } from './unavailable-value/unavailable-value';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import {
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from './ui-component.spec-helpers';

describe('StatusNotice', () => {
  it('names the tone in text, so colour is never the only signal', () => {
    const fixture = renderComponent(StatusNotice, {
      tone: 'error',
      message: 'Draw exceeds output.',
    });

    expect(textOf(query(fixture, '.status__tone'))).toBe(BUNDLED_ENGLISH['status.error']);
  });

  it('names every tone it supports', () => {
    const expected = {
      info: BUNDLED_ENGLISH['status.info'],
      success: BUNDLED_ENGLISH['status.success'],
      warning: BUNDLED_ENGLISH['status.warning'],
      error: BUNDLED_ENGLISH['status.error'],
      loading: BUNDLED_ENGLISH['status.loading'],
    } as const;

    for (const [tone, label] of Object.entries(expected)) {
      const fixture = renderComponent(StatusNotice, { tone, message: 'A message.' });

      expect(textOf(query(fixture, '.status__tone')), tone).toBe(label);
    }
  });

  it('lets a capability supply a better name for the state', () => {
    const fixture = renderComponent(StatusNotice, {
      tone: 'warning',
      message: 'Draw is close to the limit.',
      toneLabel: 'Near limit',
    });

    expect(textOf(query(fixture, '.status__tone'))).toBe('Near limit');
  });

  it('exposes an error as an alert and everything else as a status', () => {
    expect(
      query(renderComponent(StatusNotice, { tone: 'error', message: 'x' }), '.status').getAttribute(
        'role',
      ),
    ).toBe('alert');
    expect(
      query(renderComponent(StatusNotice, { tone: 'info', message: 'x' }), '.status').getAttribute(
        'role',
      ),
    ).toBe('status');
  });

  it('is ordinary content rather than a live region', () => {
    const fixture = renderComponent(StatusNotice, { tone: 'info', message: 'x' });

    expect(query(fixture, '.status').getAttribute('aria-live')).toBeNull();
  });

  it('associates a detail with the notice', () => {
    const fixture = renderComponent(StatusNotice, {
      tone: 'error',
      message: 'Draw exceeds output.',
      detail: 'Fit a larger plant.',
    });

    expect(describedText(query(fixture, '.status'))).toContain('Fit a larger plant.');
  });

  it('marks itself as a visual carrier so the sweep checks its text equivalent', () => {
    const fixture = renderComponent(StatusNotice, { tone: 'info', message: 'x' });

    expect(query(fixture, '.status').getAttribute('data-visual-carrier')).toBe('status-tone');
  });
});

describe('UnavailableValue', () => {
  it('states the absence in words rather than as a zero or a dash', () => {
    const fixture = renderComponent(UnavailableValue, {});
    const text = textOf(element(fixture));

    expect(text).toBe(BUNDLED_ENGLISH['unavailable.value']);
    expect(text).not.toContain('0');
    expect(text).not.toContain('—');
  });

  it('includes a known reason in the stated value', () => {
    const fixture = renderComponent(UnavailableValue, {
      reason: 'The Almanac supplies no value for this.',
    });

    expect(textOf(query(fixture, '.unavailable__text'))).toContain(
      'The Almanac supplies no value for this.',
    );
  });

  it('associates the reason with the value', () => {
    const fixture = renderComponent(UnavailableValue, { reason: 'No canonical text exists.' });

    expect(describedText(query(fixture, '.unavailable'))).toContain('No canonical text exists.');
  });

  it('keeps incomplete distinct from unavailable', () => {
    const incomplete = renderComponent(UnavailableValue, { kind: 'incomplete' });
    const unavailable = renderComponent(UnavailableValue, { kind: 'unavailable' });

    expect(textOf(element(incomplete))).toBe(BUNDLED_ENGLISH['incomplete.value']);
    expect(textOf(element(incomplete))).not.toBe(textOf(element(unavailable)));
  });

  it('gives the absence context when a label is supplied', () => {
    const fixture = renderComponent(UnavailableValue, { label: 'Total range' });

    expect(textOf(query(fixture, '.unavailable__label'))).toBe('Total range');
  });
});

describe('AppFrame', () => {
  it('exposes the banner and main landmarks', () => {
    const fixture = renderComponent(AppFrame, {});

    expect(query(fixture, 'header').getAttribute('aria-label')).toBe(
      BUNDLED_ENGLISH['shell.banner.label'],
    );
    expect(element(fixture).querySelectorAll('main').length).toBe(1);
  });

  it('renders the product identity from the catalogue', () => {
    const fixture = renderComponent(AppFrame, {});

    expect(textOf(query(fixture, '.frame__product'))).toBe(BUNDLED_ENGLISH['app.name']);
  });

  it('never synthesizes a route heading', () => {
    const fixture = renderComponent(AppFrame, { routeContext: 'Anaconda explorer' });

    expect(element(fixture).querySelector('h1')).toBeNull();
  });

  it('shows the route context supplied to it', () => {
    const fixture = renderComponent(AppFrame, { routeContext: 'Anaconda explorer' });

    expect(textOf(query(fixture, '.frame__context'))).toBe('Anaconda explorer');
  });

  it('omits navigation entirely when the route set provides none', () => {
    const fixture = renderComponent(AppFrame, {});

    expect(element(fixture).querySelector('nav')).toBeNull();
  });

  it('names the navigation and marks the current entry', () => {
    const fixture = renderComponent(AppFrame, {
      navigation: [
        { id: 'ships', label: 'Shipyard', href: '/ships', current: true },
        { id: 'builds', label: 'Saved builds', href: '/builds' },
      ],
    });
    const nav = query(fixture, 'nav');
    const links = element(fixture).querySelectorAll('.frame__navigation-link');

    expect(nav.getAttribute('aria-label')).toBe(BUNDLED_ENGLISH['shell.navigation.label']);
    expect(links[0]?.getAttribute('aria-current')).toBe('page');
    expect(links[1]?.getAttribute('aria-current')).toBeNull();
  });

  it('gives every action visible text in both compositions', () => {
    // The frame renders the wide row and the compact layer together and lets a
    // media query present one of them, so neither composition needs a viewport
    // measurement taken in TypeScript. A unit test has no stylesheet, so both
    // are in the DOM here — which is exactly what makes this the right place to
    // check that the two carry the same actions and the same words.
    const fixture = renderComponent(AppFrame, {
      actions: [
        { id: 'save', label: 'Save', emphasis: 'primary' },
        { id: 'language', label: 'Language' },
      ],
    });
    const labelsIn = (selector: string): string[] =>
      [...element(fixture).querySelectorAll(`${selector} .action__label`)].map((node) =>
        textOf(node),
      );

    expect(labelsIn('.frame__actions')).toEqual(['Save', 'Language']);
    expect(labelsIn('edsb-action-layer')).toEqual(['Save', 'Language']);
    expect(textOf(query(fixture, '.action-layer__trigger-label'))).toBe(
      BUNDLED_ENGLISH['shell.actions.open'],
    );
  });

  it('closes the compact action layer when one of its actions is taken', () => {
    const fixture = renderComponent(AppFrame, { actions: [{ id: 'save', label: 'Save' }] });
    const emitted: string[] = [];
    fixture.componentInstance.actionSelected.subscribe((id) => emitted.push(id));

    query(fixture, '.action-layer__trigger').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.actionsOpen()).toBe(true);

    query(fixture, 'edsb-action-layer .action').click();
    fixture.detectChanges();

    expect(emitted).toEqual(['save']);
    expect(fixture.componentInstance.actionsOpen()).toBe(false);
  });

  it('emits action intent rather than acting', () => {
    const fixture = renderComponent(AppFrame, { actions: [{ id: 'save', label: 'Save' }] });
    const emitted: string[] = [];
    fixture.componentInstance.actionSelected.subscribe((id) => emitted.push(id));

    query(fixture, '.frame__actions button').click();

    expect(emitted).toEqual(['save']);
  });

  it('emits nothing for a disabled action', () => {
    const fixture = renderComponent(AppFrame, {
      actions: [{ id: 'save', label: 'Save', disabled: true }],
    });
    let emissions = 0;
    fixture.componentInstance.actionSelected.subscribe(() => (emissions += 1));

    fixture.componentInstance.selectAction({ id: 'save', label: 'Save', disabled: true });

    expect(emissions).toBe(0);
  });

  it('renders visible feedback in ordinary reading order, before main', () => {
    const fixture = renderComponent(AppFrame, {
      status: { tone: 'error', message: 'This build could not be saved.' },
    });
    const status = query(fixture, '.frame__status');
    const main = query(fixture, 'main');

    expect(textOf(status)).toContain('This build could not be saved.');
    expect(status.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('mounts exactly two live regions and no more', () => {
    const fixture = renderComponent(AppFrame, {
      status: { tone: 'info', message: 'A message.' },
    });

    expect(element(fixture).querySelectorAll('[aria-live]').length).toBe(2);
  });

  it('keeps the outlets silent until something is announced', () => {
    const fixture = renderComponent(AppFrame, {});
    const assertive = query(fixture, '[data-announcement-outlet="assertive"]');
    const polite = query(fixture, '[data-announcement-outlet="polite"]');

    expect(textOf(assertive)).toBe('');
    expect(textOf(polite)).toBe('');
  });
});
