# Screen Inventory and Requirement Mapping

Feature 011 adds no Commander content route. It supplies the frame and components every product route
uses. The language chooser is embedded in the frame. The component preview catalogue is a separate
development/test target and never appears in the production router or bundle.

## Logical surfaces

| Surface                                    | Wide presentation                                                                                     | Narrow/zoomed presentation                                                                                      | Primary states                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Shared application frame                   | Header/brand, primary navigation, visible language control, route main/h1 and global feedback outlets | Header and navigation reflow; all named actions and language control remain available without document overflow | route loading/ready/empty/blocking error; normal/expanded/RTL/reduced motion                      |
| Embedded language chooser                  | Labeled native select in the frame                                                                    | Same labeled control in compact flow; never hidden in hover/overflow-only UI                                    | browser match, English default, saved choice, explicit change, load fallback, persistence failure |
| Product capability content                 | Shared headings, controls, panels, collections, notices, dialogs and responsive patterns              | Same complete capability in stable reading order; internal overflow only where labelled                         | populated, empty, loading, error, disabled and capability-specific unavailable/incomplete states  |
| Component preview catalogue (tooling only) | Component/state manifest with desktop/tablet fixtures                                                 | Mobile fixture viewport, not a reduced component                                                                | every declared state/profile plus expanded, RTL, reduced motion and canonical game text           |

## Requirement coverage

| Requirement | Surface/contract coverage                                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| FR-001      | All product surfaces compose `src/app/ui/`; preview manifest and static check reject unregistered shared components.               |
| FR-002      | Token layers exclusively own color/type/spacing/radius/elevation/border/motion literals.                                           |
| FR-003      | One dark semantic token set; no frame control, media preference or stored theme.                                                   |
| FR-004      | Preview catalogue accounts for every component's populated/empty/loading/error/disabled states at all three width classes.         |
| FR-005      | Design-system contract requires a shared extension before capability use.                                                          |
| FR-006      | Native/shared controls work by pointer and single touch; no essential hover/multipointer interaction.                              |
| FR-007      | Component semantic contracts own visible/matching names, roles, states, labels and errors.                                         |
| FR-008      | Frame owns banner/navigation/main boundaries; route content owns one visible h1 and ordered headings.                              |
| FR-009      | Frame announcement outlets and feedback contract separate assertive blocking errors from coalesced polite changes.                 |
| FR-010      | Shared text-equivalence/game-text patterns accompany every color/shape/position/motion carrier.                                    |
| FR-011      | Shared responsive patterns and ten-project matrix preserve complete capability content without document overflow.                  |
| FR-012      | Token contrast/target records and automated/manual verification gate shared components and screens.                                |
| FR-013      | Reduced-motion fixtures remove nonessential motion without removing state.                                                         |
| FR-014      | Logical CSS, doubled-copy and RTL fixtures cover expansion and bidi content.                                                       |
| FR-015      | Shared conformance copy/policy includes all seven excluded criteria and rejects an unqualified claim.                              |
| FR-016      | Localization/static policy covers every frame, component, template, formatter and document title string.                           |
| FR-017      | Embedded chooser and locale store implement browser/default/saved/explicit precedence and persistence.                             |
| FR-018      | Named formatter registry serves every product value.                                                                               |
| FR-019      | Canonical catalogues, bundled English and build/runtime fallback prevent keys/blanks/placeholders.                                 |
| FR-020      | Shared game-text presenter uses released Almanac leaf results; explicit null discloses available canonical text or is unavailable. |
| FR-021      | Every journey runs in the ten Chromium/Firefox size-orientation projects.                                                          |
| FR-022      | Shared axe helper scans every product and preview state and fails the build.                                                       |
| FR-023      | Versioned desktop/mobile/tablet-as-needed screen-reader scripts supplement automation.                                             |
| FR-024      | Parser-backed policy checks display strings, token values and preview completeness.                                                |

## Cross-feature ownership

- Feature 011 owns frame semantics, locale state/formatters, game-text disclosure, global
  announcements, base tokens/components, preview infrastructure and the browser/accessibility gate.
- Each capability owns its route content, presentation projection, state fixtures and component
  extensions, but registers them through feature 011 contracts.
- Feature 001 extends the base service-worker/static-asset setup for hull artwork and owns product
  routes/build persistence; it does not own locale preference semantics.
- Feature 012 owns help/licence content and conformance disclosures, composed through these shared
  primitives.

Every future screen inventory must map its requirements to shared components and add relevant states
to the common dual-engine/axe matrix.
