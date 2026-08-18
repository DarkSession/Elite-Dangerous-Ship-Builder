# Screen Inventory: Help, Licences and Provenance

Feature 012 adds one top-level route and extends shared entry surfaces. It never requires an active
build. The inventory distinguishes a routed screen from reusable shell/context affordances so every
requirement has an owner without duplicating legal content.

| Screen/surface                       | Wide desktop                                                                      | Tablet                                   | Mobile/400% zoom                                    | Requirements           |
| ------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- | ---------------------- |
| Shared shell help entry              | Named action in persistent shell navigation                                       | Same action remains visible/reachable    | Same named touch action in compact shell/navigation | FR-001, FR-011         |
| Standard layer help entry            | Layer-header action when modal/full-screen content obscures shell                 | Same header contract                     | Same full-screen header contract                    | FR-001, FR-011         |
| Contextual provenance entry          | Shared link beside package-backed artwork/value region                            | Wraps with region heading/content        | Full-width named action; never icon-only            | FR-002, FR-011         |
| Help and licences overview (`/help`) | Bounded readable document; section navigation beside/above content                | Fluid document; section navigation wraps | One semantic stack with full labels                 | FR-001–FR-011          |
| Help topics                          | Topic groups may form fluid columns without changing DOM order                    | At most two columns where labels fit     | Single complete sequence                            | FR-010                 |
| Versions/about                       | Application, bundled Almanac and build kind as separate facts                     | Fact list wraps                          | Stacked labels/values; non-release text retained    | FR-007, FR-008         |
| Provenance/reporting                 | Ownership facts with local legal targets; external package-defect action separate | Same order, wrapping descriptions        | Stacked facts/action with leaving-app text          | FR-002, FR-008, FR-009 |
| Legal coverage index                 | App, Almanac, Frontier and third-party scope mapped to complete documents         | Same semantic associations               | One item per coverage/document target               | FR-003, FR-004, FR-006 |
| Application licence                  | Native disclosure containing exact wrapped English text                           | Same                                     | Same; no document overflow                          | FR-003, FR-004, FR-006 |
| Almanac licence                      | Native disclosure containing exact wrapped English text                           | Same                                     | Same; no document overflow                          | FR-003, FR-005, FR-006 |
| Almanac third-party notices          | Native disclosure containing full exact long-form English text                    | Same                                     | Same; long URLs/tokens break safely                 | FR-003–FR-006          |
| Alternate app locale                 | Localised/RTL framing around unchanged `lang=en` legal text                       | Same                                     | Same complete content and disclosure                | FR-006                 |
| Artifact failure                     | No screen: generator/build fails with a named diagnostic                          | N/A                                      | N/A                                                 | FR-005                 |

## Requirement traceability

| Requirement | Planned behavior                                                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | Eager `/help` screen and manifest are in the initial bundle; shell/layer entries work without build/network; production app shell caches them. |
| FR-002      | Every package artwork/value family composes the shared contextual provenance route; no feature keeps private legal copy.                       |
| FR-003      | Coverage index and three complete exact documents distinguish application, Almanac, third-party and embedded Frontier terms.                   |
| FR-004      | Root `LICENSE` scopes app MIT/non-relicensing; tracked byte-equal package mirrors travel in `legal/almanac/` and static output.                |
| FR-005      | Build pipeline resolves installed artifacts, rejects missing/empty/invalid/drift and verifies generated/static hashes; #307 gates release.     |
| FR-006      | Legal text is raw English text with `lang=en`; only owner/scope/language/disclosure labels use localisation.                                   |
| FR-007      | Generated manifest reads both shipped package versions; non-release builds visibly show a validated build ID.                                  |
| FR-008      | Distinct labels say “Bundled Almanac”; provenance states supplier only and never claims live-game/catalogue currency.                          |
| FR-009      | Manifest-sourced exact issue URL is an identified native external action with no query, fragment or build data.                                |
| FR-010      | Seven localised help topics cover only the accepted privacy, persistence, offline, engineering, hull/build and Almanac behavior.               |
| FR-011      | Shared shell and standard layer headers always route to help; capability contexts use the same route/contract.                                 |

## Cross-feature ownership

- Feature 001 supplies the shell, active-build preservation, canonical fragment behavior and
  production service-worker app shell.
- Features 001–010 compose the contextual provenance action wherever package artwork or values are
  presented.
- Feature 011 supplies navigation/document/disclosure/external-link primitives, tokens, locale and
  the full browser/accessibility test harness.
- Feature 012 owns the `/help` route, generated distribution manifest, legal artifact verification,
  help copy, provenance framing and package-defect destination.

Every supported presentation state receives design-system previews at desktop, tablet and mobile
widths. Missing legal data is deliberately absent from the runtime inventory because it is a release
failure.
