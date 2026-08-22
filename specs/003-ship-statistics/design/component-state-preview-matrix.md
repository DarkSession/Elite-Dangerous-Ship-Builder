# Component State Preview Matrix: Ship Statistics and Status

The wave 11 rulings left feature 003 with one component, and it is a feature component rather than a
shared `src/app/ui/components` primitive — so, like feature 009's `edsb-cost-materials`, it is covered
by its unit suite and the product end-to-end suite rather than by a preview declaration. The preview
manifest covers the design system's shared primitives; a feature block that composes them is not one.

The primitives this feature composes are already previewed by feature 011: `edsb-game-text` carries
the localized, canonical and unavailable states, and the tokens carry the severity treatments.

| Component     | Default/populated                 | Empty                    | Loading | Error | Disabled | Required variants                          |
| ------------- | --------------------------------- | ------------------------ | ------- | ----- | -------- | ------------------------------------------ |
| `BuildStatus` | both severities, in package order | no issues: nothing drawn | N/A     | N/A   | N/A      | canonical fallback, long params, RTL, wrap |

`N/A` means the component cannot semantically own that state. There is no loading state because
`ShipLoadout.validation` is a field on a build already in memory, and no error state because reading
it cannot fail; the no-build case belongs to the workspace.

Assertions carried by the unit and product suites: no visual literal outside tokens, no hard-coded
owned text, accessible name and role, no clipping or overflow, and no information conveyed by colour
alone.
