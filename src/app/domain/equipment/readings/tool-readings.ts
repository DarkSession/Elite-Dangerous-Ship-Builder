import { PERSONAL_TOOLS } from '@elite-dangerous-almanac/core/equipment/tools';
import { getSuitByFamily } from '@elite-dangerous-almanac/core/equipment/suits';

/** One tool the worn suit carries: an identity and a name, and no stat. */
export interface ToolReading {
  /** The library's own id, which is what `getPersonalToolName` takes. */
  readonly id: string;
  /** The canonical English name the catalogue carries. */
  readonly name: string;
}

/**
 * The tools the worn suit carries.
 *
 * Carriage is a property of the suit: tools are fitted to every suit and cannot
 * be swapped, so this is stated and never chosen (FR-005a). A tool is never a
 * mount, never takes a grade, never takes a modification slot, and appears in
 * neither the link nor the stored record.
 *
 * **No tool stat is read.** The library publishes battery and timing figures for
 * every tool and neither artboard draws one, so the region states a badge, a
 * name and a count and nothing else. Drawing the stats is a change to the canvas
 * first (013 design/reference-review.md).
 */
export function toolReadings(suitFamily: string): readonly ToolReading[] {
  const suit = getSuitByFamily(suitFamily);
  if (suit === null) return [];
  return PERSONAL_TOOLS.filter((tool) => tool.suitFamilies.includes(suit.family)).map((tool) => ({
    id: tool.id,
    name: tool.name,
  }));
}
