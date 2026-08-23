import { TestBed } from '@angular/core/testing';
import type { BuildCandidate } from '../../../../application/active-build/active-build.models';
import { ActiveBuildStore } from '../../../../application/active-build/active-build.store';
import { AnatomyStore } from '../../../../application/anatomy/anatomy.store';
import { OutfittingStore } from '../../../../application/outfitting/outfitting.store';
import type {
  SchematicDocument,
  SchematicSide,
  SideAssetState,
} from '../../../../domain/anatomy/anatomy-model';
import { FIXTURE_SLOTS, defaultBuild } from '../../../../domain/outfitting/outfitting.fixtures';
import { provideLocalization } from '../../../../i18n/i18n.providers';
import { provideIsolatedLocaleEnvironment } from '../../../../i18n/testing/localization-harness';
import { AlmanacSchematicLoader } from '../../../../platform/assets/almanac-schematic-loader';
import { AnnouncementService } from '../../../../ui/announcements/announcement.service';
import { HullAnatomy } from './hull-anatomy';

/**
 * The panel, as the canvases draw it.
 *
 * The store already proves which mounts are admitted and when; what is left to
 * this component is what a reader actually meets — the three blocks the canvas
 * draws and nothing else, one plate per side always built so the layout can
 * choose, a mount that reaches feature 002's selection, and one announcement
 * for a side that stops working rather than one per mount on it.
 */

class FakeLoader {
  readonly #pending: { side: SchematicSide; settle: (state: SideAssetState) => void }[] = [];

  load(_symbol: string, side: SchematicSide): Promise<SideAssetState> {
    return new Promise((resolve) => this.#pending.push({ side, settle: resolve }));
  }

  async settle(side: SchematicSide, state: SideAssetState): Promise<void> {
    const index = this.#pending.findIndex((request) => request.side === side);
    const [request] = this.#pending.splice(index, 1);
    request.settle(state);
    await Promise.resolve();
    await Promise.resolve();
  }
}

function documentFor(side: SchematicSide, journalSlot: string): SchematicDocument {
  return {
    side,
    symbol: 'Anaconda',
    viewBox: '0 0 100 200',
    content: { x: 0, y: 0, width: 100, height: 200 },
    annotations: [
      {
        feature: journalSlot.startsWith('Tiny') ? 'utility_mount' : 'hardpoint',
        journalSlot,
        centre: { x: 2, y: 2 },
      },
    ],
  };
}

function candidate(symbol = 'Anaconda'): BuildCandidate {
  return {
    loadout: defaultBuild(symbol),
    hullName: symbol,
    provenance: 'stock',
    qualityNotices: [],
    sourceNamed: null,
    baseline: null,
  };
}

describe('HullAnatomy', () => {
  let loader: FakeLoader;
  let announced: { messageKey: string; kind: string }[];

  function render(): { element: HTMLElement; detect: () => void } {
    const fixture = TestBed.createComponent(HullAnatomy);
    fixture.detectChanges();
    return {
      element: fixture.nativeElement as HTMLElement,
      detect: () => fixture.detectChanges(),
    };
  }

  beforeEach(() => {
    loader = new FakeLoader();
    announced = [];
    TestBed.configureTestingModule({
      providers: [
        provideLocalization(),
        ...provideIsolatedLocaleEnvironment(),
        { provide: AlmanacSchematicLoader, useValue: loader },
        {
          provide: AnnouncementService,
          useValue: {
            announce: (event: { messageKey: string; kind: string }) => announced.push(event),
          },
        },
      ],
    });
  });

  it('draws the three blocks the canvas draws, in that order', () => {
    const { element } = render();

    const blocks = [...element.querySelectorAll('.anatomy > *')].map((node) => node.className);
    expect(blocks).toEqual(['anatomy__header', 'anatomy__plates', 'anatomy__legend']);
    expect(element.querySelector('.anatomy__heading')).not.toBeNull();
    expect(element.querySelector('.anatomy__sides')).not.toBeNull();
  });

  it('draws the canvas’s five modes, with only the one that exists operable', () => {
    const { element } = render();

    const strip = element.querySelector('.anatomy__modes');
    const tabs = [...(strip?.querySelectorAll('button') ?? [])];
    expect(tabs.map((tab) => (tab.textContent ?? '').trim())).toEqual([
      'Mounts',
      'Power',
      'Drives',
      'Defence',
      'Offence',
    ]);
    // `POWER`, `DRIVES`, `DEFENCE` and `OFFENCE` are the same plates read by
    // features 005 to 008. Until one of them ships, its segment is disabled
    // rather than opening a panel with nothing in it.
    expect(tabs[0].getAttribute('aria-pressed')).toBe('true');
    expect(tabs.filter((tab) => tab.hasAttribute('disabled')).length).toBe(4);
  });

  it('lists the reference legend, entry for entry', () => {
    const { element } = render();

    const entries = [...element.querySelectorAll('.anatomy__legend-entry')].map((node) =>
      (node.textContent ?? '').trim(),
    );
    expect(entries.length).toBe(5);
    expect(entries[0]).toMatch(/selected/i);
    expect(entries[4]).toMatch(/engineered/i);
    // The mark is decoration; the word beside it is what is read.
    expect(element.querySelector('.anatomy__legend-mark')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('builds one plate per side, whichever side is shown', () => {
    TestBed.inject(ActiveBuildStore).commit(candidate());
    TestBed.tick();
    const { element } = render();

    const plates = element.querySelectorAll('edsb-hull-schematic');
    expect(plates.length).toBe(2);
    // The layout decides which is seen; both exist so a container query is the
    // only thing that has to change between the wide and compact arrangements.
    expect(element.querySelectorAll('.anatomy__plate--hidden').length).toBe(1);
  });

  it('shows the side a Commander asks for', () => {
    const anatomy = TestBed.inject(AnatomyStore);
    const { element, detect } = render();

    expect(anatomy.visibleSide()).toBe('top');
    element
      .querySelectorAll<HTMLElement>('.anatomy__sides button')[1]
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(anatomy.visibleSide()).toBe('bottom');
    expect(element.querySelector('.anatomy__plate:not(.anatomy__plate--hidden)')).not.toBeNull();
  });

  it('reaches feature 002 selection when a mount is activated', async () => {
    TestBed.inject(AnatomyStore);
    TestBed.inject(ActiveBuildStore).commit(candidate());
    TestBed.tick();
    await loader.settle('top', {
      kind: 'ready',
      document: documentFor('top', FIXTURE_SLOTS.hardpoint),
    });
    const { element, detect } = render();
    detect();

    const mount = element.querySelector<HTMLElement>('.schematic__mount');
    expect(mount?.getAttribute('data-slot')).toBe(FIXTURE_SLOTS.hardpoint);

    mount?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detect();

    expect(TestBed.inject(OutfittingStore).selectedSlotKey()).toBe(FIXTURE_SLOTS.hardpoint);
  });

  it('announces a side that stops working once, and its recovery once', async () => {
    TestBed.inject(ActiveBuildStore).commit(candidate());
    TestBed.tick();
    render();

    // The first answer is not a change: a reader arriving at the region reads
    // its state in place rather than being told the state it already sees.
    expect(announced).toEqual([]);

    await loader.settle('top', { kind: 'temporarilyUnavailable' });
    TestBed.tick();
    expect(announced.map((event) => event.messageKey)).toEqual(['anatomy.announce.unavailable']);

    TestBed.inject(AnatomyStore).retry('top');
    TestBed.tick();
    await loader.settle('top', {
      kind: 'ready',
      document: documentFor('top', FIXTURE_SLOTS.hardpoint),
    });
    TestBed.tick();

    expect(announced.map((event) => event.messageKey)).toEqual([
      'anatomy.announce.unavailable',
      'anatomy.announce.recovered',
    ]);
    expect(announced.every((event) => event.kind === 'anatomy.side.top')).toBe(true);
  });

  it('asks a plate for its side again when a Commander presses retry', async () => {
    TestBed.inject(AnatomyStore);
    TestBed.inject(ActiveBuildStore).commit(candidate());
    TestBed.tick();
    await loader.settle('top', { kind: 'temporarilyUnavailable' });
    const { element, detect } = render();
    detect();

    const plate = element.querySelector('.schematic[data-side="top"]');
    expect(plate?.getAttribute('data-state')).toBe('temporarilyUnavailable');

    plate?.querySelector<HTMLElement>('edsb-action-button button')?.click();
    TestBed.tick();
    detect();

    // Back to pending, and the peer is untouched by either the failure or the
    // retry: the two sides have independent lifecycles (FR-010).
    expect(plate?.getAttribute('data-state')).toBe('loading');
    expect(
      element.querySelector('.schematic[data-side="bottom"]')?.getAttribute('data-state'),
    ).toBe('loading');
  });

  it('says nothing about the previous hull\u2019s failure when a different hull opens', async () => {
    TestBed.inject(ActiveBuildStore).commit(candidate());
    TestBed.tick();
    render();

    await loader.settle('bottom', { kind: 'temporarilyUnavailable' });
    TestBed.tick();
    expect(announced.map((event) => event.messageKey)).toEqual(['anatomy.announce.unavailable']);

    // A build link opens a different ship into the same workspace, so this
    // component is not destroyed between them. The next hull\u2019s bottom is a
    // side nobody was told about, and a perfectly good one arriving must not be
    // announced as a recovery from a failure that was another ship\u2019s.
    TestBed.inject(ActiveBuildStore).commit(candidate('Adder'));
    TestBed.tick();
    await loader.settle('bottom', {
      kind: 'ready',
      document: documentFor('bottom', FIXTURE_SLOTS.hardpoint),
    });
    TestBed.tick();

    expect(announced.map((event) => event.messageKey)).toEqual(['anatomy.announce.unavailable']);
  });

  it('says a defective document is a defect, not a hiccup', async () => {
    TestBed.inject(ActiveBuildStore).commit(candidate());
    TestBed.tick();
    render();

    await loader.settle('bottom', { kind: 'contractDefect' });
    TestBed.tick();

    expect(announced.map((event) => event.messageKey)).toEqual(['anatomy.announce.defect']);
  });
});
