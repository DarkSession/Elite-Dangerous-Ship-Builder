import { inspectSlef } from '@elite-dangerous-almanac/core/ships/slef';
import { maxSlotBuild, maxSlotHullSymbol } from './max-slot-fixture';

describe('max-slot fixture', () => {
  it('discovers a hull and fits every slot the package offers', () => {
    const hull = maxSlotHullSymbol();
    const build = maxSlotBuild(hull);

    expect(hull.length).toBeGreaterThan(0);
    expect(build.slots().length).toBeGreaterThan(20);
    expect(build.fittedModules().length).toBe(build.slots().length);
    expect(build.shipName).toBe('Reference Fixture');
    expect(build.shipIdent).toBe('RF-01');
  });

  it('exports as one entry the package inspects back cleanly', () => {
    const payload = maxSlotBuild().toSlefString({
      header: { appName: 'Reference', appVersion: '1.0.0' },
      moduleOrder: 'fitted',
      explicitPower: false,
      indent: 2,
    });

    const inspected = inspectSlef(payload);
    expect(inspected.entries).toHaveLength(1);
    expect(inspected.diagnostics).toHaveLength(0);
  });
});
