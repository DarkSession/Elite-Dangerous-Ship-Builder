import { TestBed } from '@angular/core/testing';
import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import { ActiveBuildStore } from '../active-build/active-build.store';
import { provideLocalization } from '../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../i18n/testing/localization-harness';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { NavigatorAdapter } from '../../platform/browser/navigator.adapter';
import { FragmentPublisher } from './fragment-publisher';
import { LinkSharePresenter } from './link-share.presenter';

/**
 * Passing a build on as a link, and every way that can fail.
 *
 * The presenter owns the intents; the panel that draws them owns none. What
 * matters here is that a refused clipboard and an absent share sheet are each
 * an ordinary outcome that leaves the link on screen and selectable.
 */

class StubNavigator {
  copied: string | null = null;
  shared: unknown = null;
  copyResult = true;
  shareResult = true;
  hasShare = true;

  languages(): readonly string[] {
    return ['en'];
  }

  async copyText(text: string): Promise<boolean> {
    this.copied = text;
    return this.copyResult;
  }

  canShare(): boolean {
    return this.hasShare;
  }

  async share(payload: unknown): Promise<boolean> {
    this.shared = payload;
    return this.shareResult;
  }
}

function setup(configure: (navigator: StubNavigator) => void = () => {}) {
  const navigator = new StubNavigator();
  configure(navigator);

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalization(),
      ...provideIsolatedLocaleEnvironment(),
      { provide: NavigatorAdapter, useValue: navigator },
    ],
  });

  const active = TestBed.inject(ActiveBuildStore);
  const publisher = TestBed.inject(FragmentPublisher);
  return { navigator, active, publisher, dialog: TestBed.inject(LinkSharePresenter) };
}

function commitAnaconda(active: ActiveBuildStore): void {
  active.commit({
    loadout: ShipLoadout.default('Anaconda'),
    hullName: 'Anaconda',
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    autosaveRecordId: null,
    baseline: null,
  });
}

describe('the share link, and every way passing it on can fail', () => {
  it('follows the store through every publication state', () => {
    const { dialog, active } = setup();

    expect(dialog.state()).toBe('absent');
    expect(dialog.url()).toBeNull();

    active.setLink({ kind: 'encoding' });
    expect(dialog.state()).toBe('encoding');
    // Nothing stale is offered while a new value is being prepared.
    expect(dialog.url()).toBeNull();

    active.setLink({ kind: 'published', fragment: 'b.abc', revision: 1 });
    expect(dialog.state()).toBe('published');
    expect(dialog.url()).toContain('#b.abc');
  });

  it('says why a link was refused, in the application’s own words', () => {
    const { dialog, active } = setup();

    active.setLink({ kind: 'refused', code: 'unknownIdentity', slot: 'Slot03_Size6' });

    expect(dialog.refusal()?.message).toBe(BUNDLED_ENGLISH['link.error.unknownIdentity']);
    expect(dialog.refusal()?.detail).toContain('Slot03_Size6');
  });

  it('copies the published address and says it happened', async () => {
    const { dialog, active, navigator } = setup();
    active.setLink({ kind: 'published', fragment: 'b.abc', revision: 1 });

    await dialog.copy();

    expect(navigator.copied).toContain('#b.abc');
    expect(dialog.feedback()).toBe('copied');
  });

  it('keeps the link on screen when the clipboard refuses', async () => {
    const { dialog, active } = setup((navigator) => {
      navigator.copyResult = false;
    });
    active.setLink({ kind: 'published', fragment: 'b.abc', revision: 1 });

    await dialog.copy();

    expect(dialog.feedback()).toBe('copy-failed');
    // The one way out that no permission can take away is still there.
    expect(dialog.url()).toContain('#b.abc');
  });

  it('copies nothing when there is nothing published', async () => {
    const { dialog, navigator } = setup();

    await dialog.copy();
    await dialog.share();

    expect(navigator.copied).toBeNull();
    expect(navigator.shared).toBeNull();
    expect(dialog.feedback()).toBe('idle');
  });

  it('offers sharing only where the platform has it', () => {
    expect(setup().dialog.shareAvailable).toBe(true);
    expect(
      setup((navigator) => {
        navigator.hasShare = false;
      }).dialog.shareAvailable,
    ).toBe(false);
  });

  it('treats a dismissed share sheet as a share that did not happen', async () => {
    const { dialog, active } = setup((navigator) => {
      navigator.shareResult = false;
    });
    active.setLink({ kind: 'published', fragment: 'b.abc', revision: 1 });

    await dialog.share();

    expect(dialog.feedback()).toBe('share-failed');
  });

  it('shares the address and stays quiet when it worked', async () => {
    const { dialog, active, navigator } = setup();
    active.setLink({ kind: 'published', fragment: 'b.abc', revision: 1 });

    await dialog.share();

    expect(navigator.shared).toEqual({ title: BUNDLED_ENGLISH['link.title'], url: dialog.url() });
    expect(dialog.feedback()).toBe('idle');
  });

  it('encodes again on retry, clearing the previous outcome', async () => {
    const { dialog, active, publisher } = setup((navigator) => {
      navigator.copyResult = false;
    });
    commitAnaconda(active);
    active.setLink({ kind: 'published', fragment: 'b.abc', revision: active.revision() });
    await dialog.copy();
    expect(dialog.feedback()).toBe('copy-failed');

    active.setLink({ kind: 'refused', code: 'invalidPayload', slot: null });
    dialog.retry();
    await Promise.resolve();

    expect(dialog.feedback()).toBe('idle');
    expect(publisher.publishedUrl.bind(publisher)).not.toThrow();
  });
});
