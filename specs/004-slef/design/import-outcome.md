# Import Outcome

## Purpose and lifecycle

Keep the result of an accepted import understandable after the input layer closes. The outcome is
ordinary workspace content bound to the exact active revision, not a modal, build field or edit. It
appears only after feature 001 commits and disappears on dismissal or when a later active revision no
longer matches.

## Composition

- localized summary stating the build was imported and whether package validation is valid/complete;
- grouped identity-normalization notices naming the source slot/identity and package empty/default
  result without retaining that identity in the active build;
- grouped quality-completion notices with exact slot/module/blueprint/effect identities and source to
  completed quality;
- grouped fixed-mount notices distinguishing construction auto-restoration, explicit package repair
  and missing package default;
- retained incomplete/invalid package issue list for resolved state with package locale/canonical disclosure;
- Dismiss action that changes presentation only.

Successful source-empty fixed fills also exist in feature 001's local-record fixed-mount provenance metadata so a
restored record can disclose them until that mount is edited. Quality completion, the detailed issue
list and full validation presentation are transient. Feature 001 independently persists the accepted
revision's `valid`/`complete` booleans. None of the detailed outcome enters `BuildSnapshotV1`, link,
SLEF or edit history.

## States

| State                        | Presentation                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------- |
| No modeled normalization     | Concise import success/final validation; no empty groups                              |
| Unknown module normalized    | Exact transient source identity plus package empty/default action; never active state |
| Quality completed            | One row per source partial normalized by the package to quality 1                     |
| Fixed auto-restored/repaired | Exact source/result slot identities and kind; never invent a default                  |
| Default unavailable          | Text says the fixed mount remains incomplete; no replacement identity shown           |
| Retained incomplete/invalid  | Package issue detail and final validation remain visible, not converted to zero/valid |
| Combined                     | Groups remain separately headed so causes are not collapsed into one color/status     |
| Dismissed                    | Outcome removed; build/revision/dirty/history/persistence unchanged                   |
| Revision changed             | Stale outcome removed and never announced against the new build                       |

## Responsive, semantic and localization behavior

The notice reflows in the build workspace at every width; long identities/paths wrap or own internal
overflow without widening the page. It uses headings/list semantics and one concise polite summary;
details remain navigable rather than all announced. Every app label is localized, package names/
messages follow package locale rules, numbers use named formatters and technical identities are
direction-isolated. State has textual equivalents, shared contrast/target tokens and no motion
dependency.

Previews cover every state at desktop/tablet/mobile widths plus expanded, RTL and reduced-motion
variants. Requirements: FR-006, FR-010, FR-012 and FR-013.
