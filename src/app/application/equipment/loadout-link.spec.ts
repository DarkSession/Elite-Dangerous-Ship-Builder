import { TestBed } from '@angular/core/testing';
import { BuildLinkCodecError } from '../../domain/build-link/build-link-codec-error';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';
import { provideLocalization } from '../../i18n/i18n.providers';
import { BUNDLED_ENGLISH } from '../../i18n/locale-registry';
import { HistoryLocationAdapter } from '../../platform/browser/history-location.adapter';
import { LinkErrorMapper } from '../build-link/link-error.mapper';
import {
  FIELDS_EXCLUDED_FROM_EQUIPMENT_LINKS,
  equipmentLinkPayloadSource,
} from '../build-link/link-payload.allowlist';
import { LoadoutLinkCoordinator } from './loadout-link.coordinator';
import { LoadoutSummary } from './loadout-summary';
import { LoadoutStore } from './loadout.store';

/** A location that remembers what was written to it, without a browser. */
class MemoryLocation {
  fragmentValue = '';

  fragment(): string {
    return this.fragmentValue;
  }

  currentDocument(): string {
    return '/equipment';
  }

  urlWithFragment(value: string): string {
    return `https://navbeacon.test/equipment#${value}`;
  }

  replaceFragment(value: string | null): void {
    this.fragmentValue = value ?? '';
  }
}

function setup() {
  const location = new MemoryLocation();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideLocalization(), { provide: HistoryLocationAdapter, useValue: location }],
  });
  return {
    location,
    store: TestBed.inject(LoadoutStore),
    links: TestBed.inject(LoadoutLinkCoordinator),
    errors: TestBed.inject(LinkErrorMapper),
    summary: TestBed.inject(LoadoutSummary),
  };
}

/** A loadout with held content: a sniper on a mount the Maverick does not offer. */
function heldLoadout(store: LoadoutStore): EquipmentLoadout {
  store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
  store.dispatch({
    kind: 'fitWeapon',
    mount: 'PrimaryWeapon2',
    symbol: 'wpn_m_sniper_plasma_charged',
  });
  store.dispatch({ kind: 'selectSuit', suitFamily: 'utilitysuit' });
  return store.loadout()!;
}

describe('LoadoutLinkCoordinator', () => {
  it('publishes the loadout on the bench, and takes the link down with the bench', () => {
    const { links, store, location } = setup();

    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    links.publish();

    expect(location.fragmentValue.startsWith('e.')).toBe(true);
    expect(links.link().kind).toBe('published');

    store.open(null);
    links.publish();

    expect(location.fragmentValue).toBe('');
    expect(links.link()).toEqual({ kind: 'absent' });
  });

  it('restores the loadout a link describes, held content and all (FR-018a)', () => {
    const first = setup();
    const held = heldLoadout(first.store);
    first.links.publish();
    const fragment = first.location.fragmentValue;

    // A second application, as a Commander opening the link would have.
    const second = setup();
    expect(second.links.ingest(fragment)).toEqual({ kind: 'opened' });
    expect(second.store.loadout()).toEqual(held);
    // A link is nobody's saved record, so the loadout it opens belongs to none.
    expect(second.store.source()).toBeNull();
  });

  it('leaves a fragment that belongs to something else alone', () => {
    const { links, store } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    const before = store.loadout();

    expect(links.ingest('b.something-elses')).toEqual({ kind: 'ignored' });
    expect(links.ingest('section-3')).toEqual({ kind: 'ignored' });
    expect(store.loadout()).toBe(before);
  });

  it('refuses an altered link without disturbing the loadout on the bench', () => {
    const { links, store } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    links.publish();
    const before = store.loadout();

    const result = links.ingest('e.notaloadoutatall');

    expect(result.kind).toBe('refused');
    expect(store.loadout()).toBe(before);
  });

  it('reads its own published link as nothing to do', () => {
    const { links, store, location } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    links.publish();

    expect(links.ingest(location.fragmentValue)).toEqual({ kind: 'unchanged' });
  });

  it('refuses a fragment longer than any it produces, without decoding it', () => {
    const { links } = setup();
    let decoded = false;
    links.decode = () => {
      decoded = true;
      throw new Error('should not be reached');
    };

    const result = links.ingest(`e.${'x'.repeat(600)}`);

    expect(result.kind === 'refused' && result.failure.code).toBe('tooLong');
    expect(decoded).toBe(false);
  });

  it('takes a stale fragment down when the loadout can no longer be encoded', () => {
    const { links, store, location } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    links.publish();

    links.encode = () => {
      throw new BuildLinkCodecError('unknownIdentity', 'internal detail', {
        slot: 'PrimaryWeapon1',
      });
    };
    links.publish();

    // The loadout is still on the bench; what is gone is a link describing an
    // earlier version of it.
    expect(store.hasLoadout()).toBe(true);
    expect(location.fragmentValue).toBe('');
    expect(links.link().kind).toBe('refused');
  });
});

describe('the loadout link payload allowlist', () => {
  it('names every bench field a link must never carry', () => {
    expect([...FIELDS_EXCLUDED_FROM_EQUIPMENT_LINKS]).toEqual([
      'selected',
      'source',
      'revision',
      'canUndo',
      'canRedo',
    ]);
  });

  it('leaves the published link unchanged when only the selection moves', () => {
    const { links, store, location } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    links.publish();
    const published = location.fragmentValue;

    store.select('PrimaryWeapon1');
    store.named({ recordId: 'record-42', baseRevisionId: 'revision-7' });
    links.publish();

    expect(location.fragmentValue).toBe(published);
    expect(equipmentLinkPayloadSource(store.loadout())).toBe(store.loadout());
  });
});

describe('a loadout link refusal', () => {
  it('says what a loadout link failed at, not what a build link would have', () => {
    const { errors } = setup();

    for (const code of ['unknownIdentity', 'invalidPayload'] as const) {
      const ship = errors.describe({ code, slot: null }).message;
      const loadout = errors.describe({ code, slot: null }, 'equipment').message;

      expect(loadout).toBe(BUNDLED_ENGLISH[`link.error.equipment.${code}`]);
      expect(loadout).not.toBe(ship);
    }
  });

  it('names the mount in the library’s words, never by its journal key (FR-021)', () => {
    const { errors } = setup();

    const detail =
      errors.describe({ code: 'invalidPayload', slot: 'PrimaryWeapon1' }, 'equipment').detail ?? '';

    expect(detail).not.toContain('PrimaryWeapon1');
    expect(detail.length).toBeGreaterThan(0);
  });

  it('says the suit is what failed where the codec named the suit', () => {
    const { errors } = setup();

    expect(errors.describe({ code: 'invalidPayload', slot: 'suit' }, 'equipment').detail).toBe(
      BUNDLED_ENGLISH['link.refused.suit'],
    );
  });
});

describe('LoadoutSummary', () => {
  it('names the suit, every mount and every fitted modification, in the library’s words', () => {
    const { store, summary } = setup();
    store.dispatch({ kind: 'selectSuit', suitFamily: 'tacticalsuit' });
    store.dispatch({ kind: 'setSuitGrade', grade: 5 });
    store.dispatch({
      kind: 'fitWeapon',
      mount: 'PrimaryWeapon1',
      symbol: 'wpn_m_assaultrifle_plasma_fauto',
    });
    store.dispatch({
      kind: 'fitModification',
      target: 'suit',
      slot: 0,
      symbol: 'suit_increasedshieldregen',
    });

    const written = summary.write(store.loadout()!);
    const lines = written.split('\n');

    expect(lines[0]).toContain('Dominator Suit');
    expect(lines[0]).toContain('G5');
    // A fitted recipe is set in under the item that holds it.
    expect(lines[1]?.startsWith('  ')).toBe(true);
    expect(written).toContain('Manticore Oppressor');
    // Every mount the catalogue offers is accounted for, empty ones included.
    expect(written).toContain(BUNDLED_ENGLISH['equipment.mount.empty']);
    // No symbol ever reaches the summary: it is read by people (constitution VI).
    expect(written).not.toContain('wpn_m_');
    expect(written).not.toContain('suit_');
  });
});
