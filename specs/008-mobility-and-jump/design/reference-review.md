# Drives & Mass Reference Review

## Reference scope

Reviewed `.design/Ship Builder.dc.html`:

- the wide `data-anat-detail="mass"` Drives & Mass region; and
- the narrow `data-m-mode="mass"` region.

The reference is a hierarchy/composition input only. Package contracts, the accepted specification,
constitution and repository design system override every sample value and inline style.

## Adopted direction

- Keep thruster/mobility and FSD/jump facts in adjacent logical regions on wide layouts.
- Keep the source module identity beside the results it qualifies.
- Make selected load context prominent before performance figures.
- Use a wide-to-stacked responsive direction with stable semantic order.
- Keep numeric values compact while retaining explicit labels and units.

## Required departures

| Reference element                                       | Decision                  | Reason                                                                                                                 |
| ------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Hull/modules/fuel mass bar                              | Reject                    | The package supplies no feature-008 decomposition result or percentage widths; local composition/re-sum is prohibited. |
| “91% of optimal mass” and headroom                      | Reject                    | Both are derived comparisons absent from required package results.                                                     |
| Speed, rotation and jump bars                           | Reject                    | Arbitrary scales and widths are not package output and colour/length cannot carry meaning.                             |
| Saved-build deltas/arrows                               | Reject                    | Comparison is outside feature scope and the reference values are authored.                                             |
| “Fuelled/current/full cargo” labels                     | Replace                   | Use exact maximum/unladen/laden identities and feature 003 selected-load wording.                                      |
| Mass lock                                               | Omit                      | Outside the accepted feature scope.                                                                                    |
| SCO badge                                               | Conditional only          | It may appear only if a relevant package record returns the capability; never infer from name/symbol.                  |
| Optimal mass/max fuel                                   | Conditional only          | Show exact returned FSD facts with no headroom/fuel calculation.                                                       |
| “Fuel per jump”                                         | Omit                      | Not required by the summary contract; do not add a separate calculation.                                               |
| Narrow omission of roll/multipliers/totals/counts       | Reject                    | Mobile must retain every required field.                                                                               |
| Narrow omission of capacities/diagnostics/module masses | Reject                    | All form factors have full information parity.                                                                         |
| Hover titles                                            | Reject as sole disclosure | Essential meaning must be visible/programmatic and work by touch.                                                      |
| Inline colours/sizes/breakpoints/English                | Reject                    | Feature 011 tokens, components and localization are the only sources.                                                  |

## Resulting composition

The implemented surface preserves the reference's paired information architecture without its
invented values or visual scales. Jump becomes a complete three-load definition group; mobility
becomes all seven exact fields; source facts remain sparse; mass/capacity preserve structured issues;
and module mass is a complete exact-slot collection. Narrow/zoomed layouts stack the same content
rather than presenting an abbreviated card.

No reference artwork or external asset is required for this capability.
