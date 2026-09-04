import { describe, expect, it } from 'vitest';
import { PERSONAL_TOOLS } from '@elite-dangerous-almanac/core/equipment/tools';
import { SUITS } from '@elite-dangerous-almanac/core/equipment/suits';
import { toolReadings } from './tool-readings';

describe('suit tools', () => {
  it('states the tools whose families include the worn suit’s', () => {
    for (const suit of SUITS) {
      expect(toolReadings(suit.family).map((tool) => tool.id)).toEqual(
        PERSONAL_TOOLS.filter((tool) => tool.suitFamilies.includes(suit.family)).map(
          (tool) => tool.id,
        ),
      );
    }
  });

  it('gives the Maverick and the Artemis different tools', () => {
    // Which rows a suit gets follows its `suitFamilies` membership rather than a
    // fixed three: the Maverick carries the Arc Cutter and the Artemis the
    // Genetic Sampler, and both carry the Energylink and Profile Analyser.
    const maverick = toolReadings('utilitysuit').map((tool) => tool.name);
    const artemis = toolReadings('explorationsuit').map((tool) => tool.name);

    expect(maverick).toContain('Arc Cutter');
    expect(artemis).toContain('Genetic Sampler');
    expect(maverick).not.toContain('Genetic Sampler');
    for (const shared of ['Energylink', 'Profile Analyser']) {
      expect(maverick).toContain(shared);
      expect(artemis).toContain(shared);
    }
  });

  it('states no tool stat', () => {
    // The library publishes battery and timing figures for every tool and
    // neither artboard draws one, so a row is a badge, a name and nothing else.
    for (const reading of toolReadings('utilitysuit')) {
      expect(Object.keys(reading).sort()).toEqual(['id', 'name']);
    }
  });

  it('states nothing for a suit family this release does not publish', () => {
    expect(toolReadings('stealthsuit')).toEqual([]);
  });
});
