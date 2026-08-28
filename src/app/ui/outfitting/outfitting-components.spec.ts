import type { GameTextPresentation } from '../../i18n/game-text.presenter';
import {
  accessibleName,
  describedText,
  element,
  query,
  renderComponent,
  textOf,
} from '../components/ui-component.spec-helpers';
import { EditRefusalNotice } from './edit-refusal-notice';
import { ModuleIdentityBadge } from './module-identity-badge';
import { OutfittingNotice } from './outfitting-notice';
import { SlotCard } from './slot-card';
import { SlotGroup } from './slot-group';
import { UnavailableFact } from './unavailable-fact';

/**
 * What the outfitting primitives promise a reader.
 *
 * Every assertion here is about meaning rather than markup: that an absence is
 * a word and not a zero, that selection is stated and not merely coloured, that
 * a slot key reaches assistive technology without reaching the screen, and that
 * the application's framing and the Almanac's reason stay two separate voices.
 */

const LOCALIZED: GameTextPresentation = {
  text: 'Multi-Cannon',
  language: 'en',
  translationState: 'localized',
  disclosureKey: null,
};

const CANONICAL: GameTextPresentation = {
  text: 'Corrosion Resistant Cargo Rack',
  language: 'en',
  translationState: 'canonical',
  disclosureKey: 'game-text.untranslated.description',
};

/** A slot view shaped like the package's, with the parts a test varies. */
function slotView(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    key: 'HugeHardpoint1',
    canonicalName: 'Huge Hardpoint 1',
    displayName: { ...LOCALIZED, text: 'Huge Hardpoint 1' },
    kind: 'hardpoint',
    size: 4,
    restriction: null,
    restrictionText: null,
    removable: true,
    immovableReason: null,
    node: 1,
    module: {
      slotKey: 'HugeHardpoint1',
      symbol: 'Hpt_MultiCannon_Gimbal_Huge',
      displayName: LOCALIZED,
      enabled: undefined,
      priority: 0,
      article: { class: 4, rating: 'A', mount: 'Gimballed', powerDraw: 0.61 },
      effectiveArticle: null,
      engineering: null,
      variant: null,
      entitlement: null,
      labels: [],
    },
    ...overrides,
  };
}

const EVERY_CAPABILITY = {
  canOpenReplacement: true,
  canFitSelection: true,
  canRemove: true,
  canOpenEngineering: true,
  canSetEnabled: true,
  canSetPriority: true,
  packageEmpty: false,
};

describe('unavailable fact', () => {
  it('renders a package value with its unit', () => {
    const fixture = renderComponent(UnavailableFact, {
      label: 'Power draw',
      value: '0.88',
      unit: 'MW',
    });

    expect(textOf(query(fixture, '.fact__value'))).toBe('0.88');
    expect(textOf(query(fixture, '.fact__unit'))).toBe('MW');
  });

  it('states an absence in words rather than as a zero', () => {
    const fixture = renderComponent(UnavailableFact, { label: 'Weapon draw', value: null });

    const text = textOf(element(fixture));
    expect(text).toContain('Weapon draw');
    expect(text.toLowerCase()).toContain('unavailable');
    expect(text).not.toContain('0');
  });

  it('associates the reason with the absence', () => {
    const fixture = renderComponent(UnavailableFact, {
      label: 'Weapon draw',
      value: null,
      reason: 'No value is reported.',
    });

    const absence = query(fixture, '.unavailable');
    expect(describedText(absence)).toContain('No value is reported.');
  });
});

describe('module identity badge', () => {
  it('renders class, rating and mount as separate package values', () => {
    const fixture = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      moduleClass: 4,
      rating: 'A',
      mount: 'Gimballed',
    });

    // A space, not a dot: the canvas writes `4A GIMBALLED` and takes the dot
    // only for what follows the mount (`3E FIXED · STOCK`).
    expect(textOf(query(fixture, '.identity__code-line'))).toBe('4A Gimballed');
  });

  it('draws the name at the ledger’s scale, and at the smaller one when asked', () => {
    const ledger = renderComponent(ModuleIdentityBadge, { name: LOCALIZED });
    const compact = renderComponent(ModuleIdentityBadge, { name: LOCALIZED, compact: true });

    // Canvas 1c sets a ledger row's module name `500 13px` and the offence
    // panel's weapon name `400 10.5px`, the name there being one of four columns
    // rather than the row's subject. Two scales, both the drawing's.
    expect(query(ledger, '.identity__name')?.classList).not.toContain('identity__name--compact');
    expect(query(compact, '.identity__name')?.classList).toContain('identity__name--compact');
  });

  it('spells the code out for anyone reading it aloud', () => {
    const fixture = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      moduleClass: 4,
      rating: 'A',
    });

    expect(textOf(query(fixture, '.visually-hidden'))).toContain('Class 4');
  });

  it('leaves the code out rather than inventing one', () => {
    const fixture = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      moduleClass: null,
      rating: null,
    });

    expect(element(fixture).querySelector('.identity__code-line')).toBeNull();
  });

  it('discloses canonical package text as untranslated', () => {
    const fixture = renderComponent(ModuleIdentityBadge, { name: CANONICAL });

    expect(textOf(element(fixture))).toContain('Corrosion Resistant Cargo Rack');
    expect(textOf(element(fixture)).toLowerCase()).toContain('untranslated');
  });

  it('shows the package symbol only where a caller asks for it', () => {
    const hidden = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      symbol: 'Hpt_MultiCannon_Gimbal_Huge',
    });
    expect(textOf(element(hidden))).not.toContain('Hpt_MultiCannon_Gimbal_Huge');

    const shown = renderComponent(ModuleIdentityBadge, {
      name: LOCALIZED,
      symbol: 'Hpt_MultiCannon_Gimbal_Huge',
      showSymbol: true,
    });
    expect(textOf(query(shown, '.identity__code-line'))).toBe('Hpt_MultiCannon_Gimbal_Huge');
  });

  /**
   * The badge cannot see a width, so the width is declared to it.
   *
   * jsdom lays nothing out and has no `ResizeObserver`, and the badge asks for
   * both through the platform's own size adapter — so what a spec supplies is
   * an observer that delivers when it says so, over an element whose overflow
   * it has stated. That is the seam the adapter exists for; nothing here mocks
   * the component's own module.
   */
  function declareDelivery(): { deliver: () => void; undo: () => void } {
    const own = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
    const callbacks: ResizeObserverCallback[] = [];

    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback);
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };

    return {
      deliver: () => {
        for (const callback of callbacks) {
          callback(
            [{ contentRect: { width: 100, height: 20 } }] as unknown as ResizeObserverEntry[],
            {} as ResizeObserver,
          );
        }
      },
      undo: () => {
        if (own === undefined) {
          delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
          return;
        }
        Object.defineProperty(globalThis, 'ResizeObserver', own);
      },
    };
  }

  /** States what the renderer will not: how much of the name is drawn. */
  function declareOverflow(value: HTMLElement, drawn: number, whole: number): void {
    Object.defineProperty(value, 'clientWidth', { configurable: true, value: drawn });
    Object.defineProperty(value, 'scrollWidth', { configurable: true, value: whole });
  }

  it('hands back the whole name where the caller\u2019s rule cuts it short', () => {
    const delivery = declareDelivery();
    try {
      const fixture = renderComponent(ModuleIdentityBadge, {
        name: LOCALIZED,
        nameTip: 'Multi-Cannon',
      });
      declareOverflow(query(fixture, '.game-text__value'), 100, 300);
      delivery.deliver();
      fixture.detectChanges();

      // The ellipsis is the control, and the control carries the whole name —
      // so what the row cut is asked for by a thumb rather than lost (SC 1.4.4).
      expect(textOf(query(fixture, '.identity__more'))).toContain('Multi-Cannon');
      expect(element(fixture).querySelector('[data-text-reachable]')).not.toBeNull();
    } finally {
      delivery.undo();
    }
  });

  it('draws no mark where the whole name is drawn', () => {
    const delivery = declareDelivery();
    try {
      const fixture = renderComponent(ModuleIdentityBadge, {
        name: LOCALIZED,
        nameTip: 'Multi-Cannon',
      });
      declareOverflow(query(fixture, '.game-text__value'), 300, 300);
      delivery.deliver();
      fixture.detectChanges();

      expect(element(fixture).querySelector('.identity__more')).toBeNull();
      expect(element(fixture).querySelector('[data-text-reachable]')).toBeNull();
    } finally {
      delivery.undo();
    }
  });
});

describe('slot card', () => {
  it('carries the exact game slot key for assistive technology, never as visible text', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });

    const row = query(fixture, '.slot');
    expect(row.getAttribute('data-slot-key')).toBe('HugeHardpoint1');
    expect(describedText(query(fixture, '.slot__select'))).toContain('HugeHardpoint1');

    // A fitted row is the canvas's two lines — the module's name over its code
    // line — so the mount's own kind, size and node are spoken, not drawn a
    // third time beside the badges that already carry them.
    expect(query(fixture, '.slot').querySelector('.slot__drawn-label')).toBeNull();
    expect(textOf(element(fixture))).toContain('Hardpoints · Size 4 · Node 1');
  });

  it('says only Empty on an empty row, and names the mount to a reader', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView({ module: null }),
      capabilities: EVERY_CAPABILITY,
    });

    // The size box and the node badge beside it already carry the size and the
    // node, and the group rule above them carries the kind. Writing all three
    // again in words under an `Empty` was a line the canvas does not draw
    // (wave 5).
    expect(element(fixture).querySelector('.slot__drawn-label')).toBeNull();
    expect(textOf(query(fixture, '.slot__empty'))).toBe('Empty');
    expect(textOf(element(fixture))).toContain('Hardpoints · Size 4 · Node 1');
  });

  it('states selection in words and in programmatic state, not by the marker alone', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
      selected: true,
    });

    expect(query(fixture, '.slot__select').getAttribute('aria-pressed')).toBe('true');
    expect(query(fixture, '.slot').getAttribute('data-selected')).toBe('true');
    expect(textOf(element(fixture)).toLowerCase()).toContain('selected mount');
  });

  it('names an empty mount rather than leaving it blank', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView({ module: null }),
      capabilities: EVERY_CAPABILITY,
    });

    expect(textOf(query(fixture, '.slot__empty')).toLowerCase()).toBe('empty');
  });

  it('numbers a utility mount as well as a hardpoint, in the anatomy\u2019s own ink', () => {
    // The badge is a pointer at the hull anatomy, and that drawing marks both
    // kinds — hardpoints in the amber, utility mounts in the cool. A number
    // drawn on one and withheld from the other read as though only hardpoints
    // were somewhere on the hull.
    const hardpoint = renderComponent(SlotCard, {
      slot: slotView({ kind: 'hardpoint', node: 3 }),
      capabilities: EVERY_CAPABILITY,
    });
    const utility = renderComponent(SlotCard, {
      slot: slotView({ kind: 'utility', node: 2, module: null }),
      capabilities: EVERY_CAPABILITY,
    });
    const core = renderComponent(SlotCard, {
      slot: slotView({ kind: 'core', node: 1, module: null }),
      capabilities: EVERY_CAPABILITY,
    });

    expect(query(hardpoint, '.slot__node').getAttribute('data-kind')).toBe('hardpoint');
    expect(query(utility, '.slot__node').getAttribute('data-kind')).toBe('utility');
    expect(textOf(query(utility, '.slot__node'))).toBe('2');
    expect(element(core).querySelector('.slot__node')).toBeNull();

    // And spoken wherever it is drawn, never carried by the ink alone.
    expect(textOf(element(utility))).toContain('2');
  });

  it('marks no row as immovable, whatever the reason', () => {
    // The resynced canvas draws the cargo hatch as an ordinary ledger row with
    // an ordinary power control, and writes nothing beside it. Immovability is
    // the Almanac's fact and it is published on the selected mount's bench, in
    // the Almanac's own full sentence, rather than as a chip down seven rows.
    for (const immovableReason of ['cargoHatch', 'requiredSlot'] as const) {
      const card = renderComponent(SlotCard, {
        slot: slotView({ removable: false, immovableReason }),
        capabilities: { ...EVERY_CAPABILITY, canRemove: false },
      });
      expect(element(card).querySelector('.slot__marker')).toBeNull();
      expect(textOf(element(card)).toLowerCase()).not.toContain('fixed');
    }
  });

  it('emits a selection intent rather than acting on one', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });

    const emitted: unknown[] = [];
    fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));
    query(fixture, '.slot__select').click();

    expect(emitted).toEqual([{ kind: 'select' }]);
  });

  it('empties the mount on the secondary button, and on nothing else', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });

    const emitted: unknown[] = [];
    fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));

    // A long press reports button 0, so touch keeps the platform's own menu and
    // no mount is emptied by a press that was meant to select it.
    const primary = new MouseEvent('contextmenu', { button: 0, bubbles: true, cancelable: true });
    query(fixture, '.slot__select').dispatchEvent(primary);
    expect(emitted).toEqual([]);
    expect(primary.defaultPrevented).toBe(false);

    const secondary = new MouseEvent('contextmenu', { button: 2, bubbles: true, cancelable: true });
    query(fixture, '.slot__select').dispatchEvent(secondary);
    expect(emitted).toEqual([{ kind: 'remove' }]);
    expect(secondary.defaultPrevented).toBe(true);
  });

  it('leaves the power chip its own platform menu', () => {
    const fixture = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });

    const emitted: unknown[] = [];
    fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));

    // The shortcut is bound to the row's selection control, not to the row. A
    // secondary press on the switch or the priority group is a press on those
    // controls, and emptying the mount from one is not what it was aimed at.
    const event = new MouseEvent('contextmenu', { button: 2, bubbles: true, cancelable: true });
    query(fixture, '.slot__power').dispatchEvent(event);

    expect(emitted).toEqual([]);
    expect(event.defaultPrevented).toBe(false);
  });

  it('keeps the platform menu where the package refuses the removal', () => {
    for (const slot of [
      { slot: slotView({ module: null }), capabilities: EVERY_CAPABILITY },
      { slot: slotView(), capabilities: { ...EVERY_CAPABILITY, canRemove: false } },
    ]) {
      const fixture = renderComponent(SlotCard, slot);
      const emitted: unknown[] = [];
      fixture.componentInstance.intent.subscribe((intent) => emitted.push(intent));

      const event = new MouseEvent('contextmenu', { button: 2, bubbles: true, cancelable: true });
      query(fixture, '.slot__select').dispatchEvent(event);

      expect(emitted).toEqual([]);
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('draws no power chip on a module the Almanac prices at no power', () => {
    // Armour, a fuel tank: nothing to power, so nothing to group, and the
    // canvas draws no chip on one (wave 4).
    const armour = renderComponent(SlotCard, {
      slot: slotView({
        module: {
          ...(slotView()['module'] as Record<string, unknown>),
          article: { class: 1, rating: 'I', mount: null },
        },
      }),
      capabilities: EVERY_CAPABILITY,
    });
    expect(element(armour).querySelector('edsb-power-controls')).toBeNull();

    const drawing = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });
    expect(drawing.nativeElement.querySelector('edsb-power-controls')).not.toBeNull();
  });

  it('keeps the engineered mark’s place on a row that carries none', () => {
    // Without it the rows above and below an engineered module sit a marker's
    // width further along than it does (canvas 1c).
    const plain = renderComponent(SlotCard, {
      slot: slotView(),
      capabilities: EVERY_CAPABILITY,
    });
    expect(element(plain).querySelector('.slot__engineered')).not.toBeNull();
    expect(element(plain).querySelector('img.slot__engineered')).toBeNull();
  });

  it('keeps the row a row: no package sentence under it', () => {
    // The canvas's ledger row is a size, a module and a power chip. What the
    // mount will take is published on the bench, where it answers the question
    // the fitting panel is asking.
    const fixture = renderComponent(SlotCard, {
      slot: slotView({
        kind: 'optional',
        restriction: 'military',
        restrictionText: { ...LOCALIZED, text: 'reinforcement packages and shield cell banks' },
      }),
      capabilities: EVERY_CAPABILITY,
    });

    expect(textOf(element(fixture))).not.toContain('reinforcement packages');
  });
});

describe('slot group', () => {
  it('names the mount kind as a heading and lists its mounts', () => {
    const fixture = renderComponent(SlotGroup, {
      group: { kind: 'hardpoint', slots: [slotView(), slotView({ key: 'LargeHardpoint1' })] },
    });

    expect(textOf(query(fixture, '.group__heading'))).toBe('Hardpoints');
    expect(accessibleName(query(fixture, '.group'))).toBe('Hardpoints');
    // The canvas writes a bare number at the rule's trailing edge, and names
    // the two badges a hardpoint row leads with beside the heading.
    expect(textOf(query(fixture, '.group__columns'))).toBe('Size · node no.');
    expect(textOf(query(fixture, '.group__count'))).toBe('2');
    expect(textOf(element(fixture))).toContain('2 mounts');
    expect(element(fixture).querySelector('ul')).not.toBeNull();
  });
});

describe('outfitting notice', () => {
  it('renders each line and names its tone in words', () => {
    const fixture = renderComponent(OutfittingNotice, {
      title: 'Imported build',
      revision: 1,
      lines: [
        { id: 'a', messageKey: 'outfitting.refusal.staleDraft' },
        { id: 'b', messageKey: 'outfitting.refusal.blocked' },
      ],
    });

    expect(element(fixture).querySelectorAll('.notice__line')).toHaveLength(2);
    // The tone is a word beside the colour, never the colour alone.
    expect(textOf(query(fixture, '.status__tone')).length).toBeGreaterThan(0);
  });

  it('renders nothing when there is nothing to say', () => {
    const fixture = renderComponent(OutfittingNotice, {
      title: 'Imported build',
      revision: 1,
      lines: [],
    });

    expect(element(fixture).querySelector('.notice')).toBeNull();
  });

  it('treats a refusal as an alert and a report as a status', () => {
    const status = renderComponent(OutfittingNotice, {
      title: 'Imported build',
      revision: 1,
      mode: 'status',
      lines: [{ id: 'a', messageKey: 'outfitting.refusal.blocked' }],
    });
    expect(query(status, '.status').getAttribute('role')).toBe('status');

    const alert = renderComponent(OutfittingNotice, {
      title: 'That change was not made',
      revision: 2,
      mode: 'alert',
      lines: [{ id: 'a', messageKey: 'outfitting.refusal.packageEdit' }],
    });
    expect(query(alert, '.status').getAttribute('role')).toBe('alert');
  });
});

describe('edit refusal notice', () => {
  it('renders nothing while no edit has been refused', () => {
    const fixture = renderComponent(EditRefusalNotice, { failure: null, revision: 1 });

    expect(element(fixture).querySelector('.notice')).toBeNull();
  });

  it('frames the outcome and names the mount, leaving the reason to the Almanac', () => {
    const fixture = renderComponent(EditRefusalNotice, {
      revision: 2,
      slotLabel: 'Huge Hardpoint 1',
      failure: {
        category: 'packageEdit',
        slotKey: 'HugeHardpoint1',
        code: 'incompatibleModule',
        constraint: 'oversized',
        params: {},
        diagnostic: null,
        framingKey: 'outfitting.refusal.packageEdit',
      },
    });

    const text = textOf(element(fixture));
    expect(text).toContain('your build is exactly as it was');
    // The mount is named the way the ledger names it, not by its raw key.
    expect(text).toContain('Huge Hardpoint 1');
    expect(text).not.toContain('HugeHardpoint1');
  });
});
