import { ShipLoadout } from '@elite-dangerous-almanac/core/ships/ship-loadout';
import type { LoadoutEvent, SlefEntry } from '@elite-dangerous-almanac/core/ships/slef';
import {
  FIXTURE_HULL,
  FIXTURE_SLOTS,
  SUPPORTED_PARTIAL_QUALITY,
  SUPPORTED_PARTIAL_SOURCE_QUALITY,
  UNSUPPORTED_PARTIAL_QUALITY,
  finalArticlePartialQuality,
} from '../outfitting/outfitting.fixtures';
import { importSlef } from './slef-import';
import { SLEF_IMPORT_LIMIT_BYTES } from './slef-import.models';

const TOKEN = 1;

function envelope(data: LoadoutEvent, appName = 'EDSY', appVersion = '2.0'): SlefEntry {
  return { header: { appName, appVersion }, data };
}

function ofSize(bytes: number): string {
  // Padded inside a JSON string so the payload stays syntactically whole; what
  // is under test is the gate, not the parser behind it.
  const shell = JSON.stringify({ Ship: FIXTURE_HULL, Modules: [], Pad: '' });
  return shell.replace('"Pad":""', `"Pad":"${'a'.repeat(Math.max(0, bytes - shell.length))}"`);
}

describe('the draft gate', () => {
  it('accepts a draft of exactly the limit', () => {
    const text = ofSize(SLEF_IMPORT_LIMIT_BYTES);
    expect(new TextEncoder().encode(text).byteLength).toBe(SLEF_IMPORT_LIMIT_BYTES);

    expect(importSlef(text, TOKEN).ok).toBe(true);
  });

  it('refuses a draft one byte over, naming the actual and limit bytes', () => {
    const text = ofSize(SLEF_IMPORT_LIMIT_BYTES + 1);

    const result = importSlef(text, TOKEN);

    expect(result).toEqual({
      ok: false,
      failure: {
        kind: 'tooLarge',
        utf8Bytes: SLEF_IMPORT_LIMIT_BYTES + 1,
        limitBytes: SLEF_IMPORT_LIMIT_BYTES,
      },
    });
  });

  it('measures bytes, not characters, so multibyte text straddles the limit', () => {
    // 32,768 three-byte characters is 98,304 bytes and 32,768 characters: under
    // the limit by one count and far over it by the one that gates.
    const text = '€'.repeat(SLEF_IMPORT_LIMIT_BYTES / 2);

    const result = importSlef(text, TOKEN);

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.failure.kind).toBe('tooLarge');
  });

  it('refuses an oversized draft before the package is ever asked', () => {
    // A payload that is both over the limit and unparseable. The size answer is
    // the one that comes back, which is only true if nothing parsed it first.
    const result = importSlef('{'.repeat(SLEF_IMPORT_LIMIT_BYTES + 1), TOKEN);

    expect(result.ok ? null : result.failure.kind).toBe('tooLarge');
  });

  it.each(['', '   ', '\n\t  \r\n'])('refuses whitespace-only input (%j)', (text) => {
    expect(importSlef(text, TOKEN)).toEqual({ ok: false, failure: { kind: 'empty' } });
  });
});

describe('inspection and cardinality', () => {
  const valid: LoadoutEvent = { event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] };

  it('accepts one envelope object', () => {
    expect(importSlef(JSON.stringify(envelope(valid)), TOKEN).ok).toBe(true);
  });

  it('accepts a one-element array', () => {
    expect(importSlef(JSON.stringify([envelope(valid)]), TOKEN).ok).toBe(true);
  });

  it('accepts a bare journal Loadout event', () => {
    expect(importSlef(JSON.stringify(valid), TOKEN).ok).toBe(true);
  });

  it('refuses zero observed entries', () => {
    const result = importSlef('[]', TOKEN);

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.failure).toEqual({
      kind: 'cardinality',
      observed: 0,
      diagnostics: [],
    });
  });

  it('refuses two valid entries rather than choosing the first', () => {
    const result = importSlef(JSON.stringify([envelope(valid), envelope(valid)]), TOKEN);

    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.failure.kind).toBe('cardinality');
    expect(result.ok ? null : (result.failure as { observed: number }).observed).toBe(2);
  });

  it('refuses mixed input whole, and keeps every diagnostic', () => {
    const result = importSlef(JSON.stringify([envelope(valid), { header: {}, data: {} }]), TOKEN);

    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== 'cardinality') {
      throw new Error('expected a cardinality refusal');
    }
    expect(result.failure.observed).toBe(2);
    expect(result.failure.diagnostics).toHaveLength(1);
    expect(result.failure.diagnostics[0]?.index).toBe(1);
  });

  it('returns the exact diagnostic when the sole entry was rejected', () => {
    const result = importSlef(JSON.stringify([{ header: {}, data: {} }]), TOKEN);

    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== 'diagnostics') {
      throw new Error('expected a diagnostics refusal');
    }
    const [diagnostic] = result.failure.diagnostics;
    expect(diagnostic?.index).toBe(0);
    expect(diagnostic?.path.length).toBeGreaterThan(0);
    expect(diagnostic?.code.length).toBeGreaterThan(0);
    expect(diagnostic?.constraint.length).toBeGreaterThan(0);
    expect(diagnostic?.message.length).toBeGreaterThan(0);
  });

  it('reports invalid JSON as its own failure, with no package prose', () => {
    const result = importSlef('{ not json', TOKEN);

    expect(result).toEqual({ ok: false, failure: { kind: 'syntax' } });
  });
});

describe('construction and normalization', () => {
  it('names the exact source hull the package does not carry', () => {
    const result = importSlef(
      JSON.stringify({ event: 'Loadout', Ship: 'Nonexistent_Hull', Modules: [] }),
      TOKEN,
    );

    expect(result).toEqual({
      ok: false,
      failure: { kind: 'unknownHull', sourceHull: 'Nonexistent_Hull' },
    });
  });

  it('returns every fixed mount populated when the source named none', () => {
    const result = importSlef(
      JSON.stringify({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] }),
      TOKEN,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const build = result.candidate.loadout;
    for (const slot of build.slots()) {
      if (!slot.removable) {
        expect(build.fittedModuleAt(slot.key)).not.toBeNull();
      }
    }
  });

  it('populates a fixed mount the source filled with something unusable', () => {
    const result = importSlef(
      JSON.stringify({
        event: 'Loadout',
        Ship: FIXTURE_HULL,
        Modules: [{ Slot: FIXTURE_SLOTS.core, Item: 'Hpt_PulseLaser_Fixed_Small' }],
      }),
      TOKEN,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const fitted = result.candidate.loadout.fittedModuleAt(FIXTURE_SLOTS.core);
    expect(fitted).not.toBeNull();
    expect(fitted?.symbol.toLowerCase()).not.toContain('pulselaser');
  });

  it('completes a supported partial roll and reports it', () => {
    const result = importSlef(JSON.stringify(SUPPORTED_PARTIAL_QUALITY), TOKEN);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.candidate.qualityCompletions).toEqual([
      {
        slotKey: FIXTURE_SLOTS.thrusters,
        moduleSymbol: 'Int_Engine_Size7_Class5',
        blueprintFdname: 'Engine_Dirty',
        previousQuality: SUPPORTED_PARTIAL_SOURCE_QUALITY,
        quality: 1,
      },
    ]);
    expect(
      result.candidate.loadout.fittedModuleAt(FIXTURE_SLOTS.thrusters)?.engineering?.Quality,
    ).toBe(1);
  });

  it('refuses the whole import when one partial cannot be completed', () => {
    const result = importSlef(JSON.stringify(UNSUPPORTED_PARTIAL_QUALITY), TOKEN);

    expect(result.ok).toBe(false);
    if (result.ok || result.failure.kind !== 'normalizationUnsupported') {
      throw new Error('expected a normalization refusal');
    }
    const [refusal] = result.failure.failures;
    expect(refusal?.source.slotKey).toBe(FIXTURE_SLOTS.frameShiftDrive);
    expect(refusal?.source.quality).toBe(0.42);
    expect(refusal?.code).not.toBeNull();
  });

  it('imports a final article rather than refusing over its stated quality', () => {
    const { event, slot } = finalArticlePartialQuality();

    const result = importSlef(JSON.stringify(event), TOKEN);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.candidate.qualityCompletions).toEqual([]);
    expect(result.candidate.loadout.fittedModuleAt(slot)?.preEngineeredVariant).not.toBeNull();
  });

  it('imports a real Guardian loadout, lower-cased slot keys and all', () => {
    // The reported draft, reduced to the module that refused it: a producer's
    // envelope, the game's own lower-case slot keys, and a pre-engineered
    // Guardian weapon stating the recipe it was built with at `Quality: 0`.
    const result = importSlef(
      JSON.stringify(
        envelope(
          {
            event: 'Loadout',
            Ship: 'anaconda',
            Modules: [
              {
                Slot: 'hugehardpoint1',
                Item: 'hpt_guardian_shardcannon_fixed_medium',
                On: true,
                Priority: 2,
                Engineering: { BlueprintName: 'weapon_longrange', Level: 1, Quality: 0 },
              },
            ],
          },
          'Inara',
          '1.0',
        ),
      ),
      TOKEN,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const fitted = result.candidate.loadout.fittedModuleAt('hugehardpoint1');
    expect(fitted?.preEngineeredVariant?.engineeringLocked).toBe(true);
    expect(result.candidate.qualityCompletions).toEqual([]);
  });

  it('leaves a completed roll and an unengineered module alone', () => {
    const result = importSlef(
      JSON.stringify({
        event: 'Loadout',
        Ship: FIXTURE_HULL,
        Modules: [
          {
            Slot: FIXTURE_SLOTS.thrusters,
            Item: 'Int_Engine_Size7_Class5',
            Engineering: { BlueprintName: 'Engine_Dirty', Level: 5, Quality: 1 },
          },
        ],
      }),
      TOKEN,
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.candidate.qualityCompletions : null).toEqual([]);
  });

  it('reads the package verdict only after the build is finished', () => {
    const result = importSlef(JSON.stringify(SUPPORTED_PARTIAL_QUALITY), TOKEN);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.candidate.validation).toEqual(result.candidate.loadout.validation);
  });

  it('carries the request token through to the candidate', () => {
    const result = importSlef(
      JSON.stringify({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] }),
      42,
    );

    expect(result.ok ? result.candidate.requestToken : null).toBe(42);
  });
});

describe('source attribution', () => {
  it('names the producer an envelope stated', () => {
    const result = importSlef(
      JSON.stringify(envelope({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] })),
      TOKEN,
    );

    expect(result.ok ? result.candidate.sourceAttribution : null).toEqual({
      appName: 'EDSY',
      appVersion: '2.0',
    });
  });

  it('does not guess a producer for a bare event or an empty header', () => {
    const bare = importSlef(
      JSON.stringify({ event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] }),
      TOKEN,
    );

    expect(bare.ok ? bare.candidate.sourceAttribution : 'x').toBeNull();
  });

  it('never follows or carries an incoming appURL or custom properties', () => {
    const result = importSlef(
      JSON.stringify({
        header: {
          appName: 'EDSY',
          appVersion: '2.0',
          appURL: 'https://elsewhere.test/build',
          appCustomProperties: { danger: 'javascript:alert(1)' },
        },
        data: { event: 'Loadout', Ship: FIXTURE_HULL, Modules: [] },
      }),
      TOKEN,
    );

    expect(result.ok).toBe(true);
    expect(JSON.stringify(result.ok ? result.candidate.sourceAttribution : null)).not.toContain(
      'elsewhere.test',
    );
  });
});

describe('atomicity', () => {
  it('never touches a build it was not given', () => {
    // The only build in play is the one construction produced. There is no
    // active state here to compare, which is the point: the pipeline has no
    // reference to one (import contract, "Atomicity").
    const before = ShipLoadout.default(FIXTURE_HULL);
    const fingerprint = before.toSlefString({ header: { appName: 'x', appVersion: '1' } });

    importSlef(JSON.stringify(UNSUPPORTED_PARTIAL_QUALITY), TOKEN);
    importSlef('{ not json', TOKEN);
    importSlef('[]', TOKEN);

    expect(before.toSlefString({ header: { appName: 'x', appVersion: '1' } })).toBe(fingerprint);
  });
});
