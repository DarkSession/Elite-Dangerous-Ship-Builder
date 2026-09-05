import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { ShareLinkPanel } from './share-link-panel/share-link-panel';
import { element, query, renderComponent, textOf } from './ui-component.spec-helpers';

const URL = 'https://ships.example/outfitting#b.abcdef';

describe('ShareLinkPanel', () => {
  it('shows the canonical address as selectable text', () => {
    const fixture = renderComponent(ShareLinkPanel, { state: 'published', url: URL });
    const value = query(fixture, '.share-link__value');

    expect(textOf(value)).toBe(URL);
    // Reachable without a pointer, and scrolling inside its own box rather than
    // taking the document sideways with it.
    expect(value.getAttribute('tabindex')).toBe('0');
    expect(value.getAttribute('aria-labelledby')).not.toBeNull();
  });

  it('keeps the link on screen and selectable after a copy fails', () => {
    const fixture = renderComponent(ShareLinkPanel, {
      state: 'published',
      url: URL,
      feedback: 'copy-failed',
    });
    const text = textOf(element(fixture));

    expect(textOf(query(fixture, '.share-link__value'))).toBe(URL);
    expect(text).toContain(BUNDLED_ENGLISH['link.copy-failed']);
  });

  it('answers a copy on the control that did it, and adds nothing beside it', () => {
    const idle = renderComponent(ShareLinkPanel, { state: 'published', url: URL });
    const copied = renderComponent(ShareLinkPanel, {
      state: 'published',
      url: URL,
      feedback: 'copied',
    });

    expect(textOf(element(idle))).toContain(BUNDLED_ENGLISH['link.copy']);
    expect(textOf(element(copied))).toContain(BUNDLED_ENGLISH['link.copied']);
    // The label swapped rather than a notice arriving under it, so the panel
    // does not grow a second place saying the same thing.
    expect(textOf(element(copied))).not.toContain(BUNDLED_ENGLISH['link.copy']);
    expect(query(copied, '.share-link__actions ednb-action-button')).not.toBeNull();
    expect(element(copied).querySelector('ednb-status-notice')).toBeNull();
  });

  it('says a share that did not start is not a lost link', () => {
    const fixture = renderComponent(ShareLinkPanel, {
      state: 'published',
      url: URL,
      feedback: 'share-failed',
    });

    expect(textOf(element(fixture))).toContain(BUNDLED_ENGLISH['link.share-failed']);
  });

  it('offers a share action only where the platform has one', () => {
    const withShare = renderComponent(ShareLinkPanel, {
      state: 'published',
      url: URL,
      shareAvailable: true,
    });
    const withoutShare = renderComponent(ShareLinkPanel, { state: 'published', url: URL });

    expect(textOf(element(withShare))).toContain(BUNDLED_ENGLISH['link.share']);
    expect(textOf(element(withoutShare))).not.toContain(BUNDLED_ENGLISH['link.share']);
  });

  it('names the pending and absent states in words', () => {
    expect(textOf(element(renderComponent(ShareLinkPanel, { state: 'encoding' })))).toContain(
      BUNDLED_ENGLISH['link.encoding'],
    );
    expect(textOf(element(renderComponent(ShareLinkPanel, { state: 'absent' })))).toContain(
      BUNDLED_ENGLISH['link.absent'],
    );
  });

  it('shows no stale link while a new one is being prepared', () => {
    const fixture = renderComponent(ShareLinkPanel, { state: 'encoding', url: null });

    expect(element(fixture).querySelector('.share-link__value')).toBeNull();
  });

  it('renders a refusal in the application’s words, with the mount named', () => {
    const fixture = renderComponent(ShareLinkPanel, {
      state: 'refused',
      refusal: {
        message: BUNDLED_ENGLISH['link.error.unknownIdentity'],
        detail: 'The mount involved is Slot03_Size6.',
      },
    });
    const text = textOf(element(fixture));

    expect(text).toContain(BUNDLED_ENGLISH['link.error.unknownIdentity']);
    expect(text).toContain('Slot03_Size6');
    expect(text).toContain(BUNDLED_ENGLISH['link.retry']);
  });

  it('says plainly that the file alternative is not in this version', () => {
    const fixture = renderComponent(ShareLinkPanel, {
      state: 'refused',
      refusal: { message: BUNDLED_ENGLISH['link.error.invalidPayload'], detail: null },
    });
    const text = textOf(element(fixture));

    expect(text).toContain(BUNDLED_ENGLISH['link.slef.unavailable']);
    expect(text).not.toContain(BUNDLED_ENGLISH['link.slef']);
  });

  it('offers the file export once feature 004 has landed', () => {
    const fixture = renderComponent(ShareLinkPanel, {
      state: 'refused',
      refusal: { message: BUNDLED_ENGLISH['link.error.invalidPayload'], detail: null },
      slefAvailable: true,
    });

    expect(textOf(element(fixture))).toContain(BUNDLED_ENGLISH['link.slef']);
  });

  it('emits intent rather than acting on it', () => {
    const fixture = renderComponent(ShareLinkPanel, {
      state: 'published',
      url: URL,
      shareAvailable: true,
    });
    const emitted: string[] = [];
    fixture.componentInstance.copyRequested.subscribe(() => emitted.push('copy'));
    fixture.componentInstance.shareRequested.subscribe(() => emitted.push('share'));

    const buttons = [...element(fixture).querySelectorAll('button')];
    buttons
      .filter((button) =>
        [BUNDLED_ENGLISH['link.copy'], BUNDLED_ENGLISH['link.share']].includes(
          button.textContent?.trim() ?? '',
        ),
      )
      .forEach((button) => button.click());

    expect(emitted).toEqual(['copy', 'share']);
  });
});
