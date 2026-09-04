# Contract: The tool registry

**Feature**: [014-start-page](../spec.md) | **Owner**: `src/app/features/shared/app-navigation.ts`

The registry is the application's answer to "what tools does this carry?". It had one
consumer; this feature gives it a second. This contract is what both may rely on.

## The shape

```ts
interface ToolRecord {
  readonly id: string;
  readonly labelKey: MessageKey;
  readonly href: string;
  readonly routes: readonly string[];
  readonly summaryKey: MessageKey; // new
  readonly shortSummaryKey: MessageKey; // new
  readonly subjectsKey: MessageKey; // new
}
```

## Obligations

- **R1** — `TOOLS` is the only list of tools in the application. Any surface that names,
  offers or counts tools reads it. A second list is a defect, not an optimisation (FR-004).
- **R2** — `TOOLS` holds only tools that answer an address. A record whose `href` resolves
  to nothing is a control for a thing that does not exist (011/FR-028, FR-003).
- **R3** — every text field is a `MessageKey`, never a phrase. A tool added without copy
  fails the type check rather than reaching a Commander (constitution VI).
- **R4** — adding a record is the whole of adding a tool to both surfaces. Neither the bar
  nor the entry point may need a second edit to show it.

## Readings

### `tools(currentPath): readonly ToolEntry[]`

Unchanged by this feature. Returns every tool with `current` set from `routes`. The tool bar
draws it.

- **R5** — its shape and its behaviour are unchanged. A start page that needed this reading
  altered would be changing the bar, which this feature does not.

### `catalogue(): readonly ToolCard[]` — new

Returns every tool with all three new strings resolved in the committed locale.

- **R6** — returns every record in `TOOLS`, in the registry's own order, and never a subset.
  The entry point offers what the application carries (FR-003).
- **R7** — carries no notion of a current tool. The entry point marks none (FR-010).
- **R8** — carries both descriptions for every tool. Choosing between them is the
  stylesheet's, so no caller may be given only one (FR-017, research decision 3).
- **R9** — resolves through `MessageService`, so a locale commit changes what it returns.
  It is read where a locale change re-renders, not cached across one.

## Verification

| Obligation | How it is held                                                                                              |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| R1, R4     | A unit test adds a record to a copy of the registry and asserts both readings report it, with no other edit |
| R2         | A unit test asserts every `href` matches a path the route table declares                                    |
| R3         | The type check. `MessageKey` is a union, so an absent key does not compile                                  |
| R6         | A unit test asserts `catalogue().length === TOOLS.length` and that the ids match in order                   |
| R7         | The returned type has no such field, and a test asserts the entry point renders no current marker           |
| R8         | A unit test asserts every entry carries a non-empty `summary` and `short` that differ from each other       |
| R9         | A unit test commits a second locale and asserts the strings change                                          |
