# Workspace Integration Contract

## Shared target union

```ts
type WorkspaceTarget =
  | { kind: 'slot'; slotKey: string }
  | {
      kind: 'detail';
      capability:
        | 'powerAndHeat'
        | 'defenceProfile'
        | 'offenceProfile'
        | 'mobilityAndJump'
        | 'costAndMaterials';
    };
```

- Validation issues receive a slot target only from their exact package `issue.slot`.
- Headline/assembly providers always return the matching detail target.
- Slot symbols, diagnostic prose/params, array positions and visual groups never infer a target.
- Feature 009's `materialTrace` is a local disclosure inside `costAndMaterials`, not workspace
  navigation and not part of this union.

One activation selects the named capability in memory. A slot target reveals/selects the exact slot
in the wide ledger or opens the existing exact-slot narrow surface. It never modifies the build
fragment, whose payload remains reserved for `b.…`.

## Rail and complete capability

Both surfaces read one `StatusProjection` revision:

- the wide rail shows independent structural facts, issue/qualification counts, power, compact
  headline/assembly summaries and one visible action to the complete Status capability;
- the complete capability is the sole location for validation issue records, full cross-provider
  qualifications and the complete set of detail/slot actions;
- feature 003 owns one viewing-condition store and one shared control component. Status composes the
  complete condition control, and an owning detail capability may compose the same control for the
  conditions it uses; every instance reads and commits the same draft/Apply/Reset state rather than
  creating another owner;
- the rail never displays a “first issue” preview, preventing duplicate issue presentation;
- a ready rail cannot coexist with a pending/failure capability for a different revision.

Desktop adds Status as a peer central workspace capability because canvas 1c lacks one. Tablet,
mobile and 400% zoom use that complete capability as the primary content. On narrow layouts, active
Status suppresses the duplicate mock summary dock and slot ledger; a slot action switches to the slot
surface and preserves one-interaction targeting.

## Contract-first delivery

1. Feature 003 publishes `ViewingConditions`, the generic revision/provider envelope, fixed summary
   identities, `WorkspaceTarget` and the accepted generic `AssemblyRequirementsPort`.
2. Features 005–009 update their owning contracts to export exact status projection types and
   adapters over that envelope; 009 retains the `AssemblyRequirementsPort` name.
3. Feature 003 defines the concrete provider bundle from those exported types and composes the
   workspace surfaces.

No area provider may import a feature 003 component or store. Feature 003 may import only their
contract/projection leaf, never their internal calculator or component.

## Navigation state

Selected capability, rail disclosure and return intent are memory-only presentation state. They do
not enter build state, persistence, preferences, history, links or SLEF. Active build replacement
returns the workspace to its default capability and resets viewing conditions.

## Verification

Contract/E2E tests cover every detail target, targeted and untargeted issues, wide inline and narrow
exact-slot behavior, rail-to-capability action, return behavior and fragment stability. Duplicate
symbols in different slots never target one another.
