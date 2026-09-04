# Data Model: Start Page

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

The entry point holds no state. Nothing here is persisted, nothing is read from
`localStorage`, nothing comes from `@elite-dangerous-almanac/core`, and no shape below
outlives a navigation. What follows is the shape of what one screen is handed.

## Tool

One of the things NavBeacon carries. Extends `ToolRecord`, which already exists in
`src/app/features/shared/app-navigation.ts` and today holds the first four fields.

| Field             | Type                | Existing | Meaning                                                                      |
| ----------------- | ------------------- | -------- | ---------------------------------------------------------------------------- |
| `id`              | `string`            | yes      | Stable identity. `'ship'`, `'equipment'`                                     |
| `labelKey`        | `MessageKey`        | yes      | The tool's full name, as the tab and the card both draw it                   |
| `href`            | `string`            | yes      | The address the tool opens at                                                |
| `routes`          | `readonly string[]` | yes      | The route prefixes the tool owns, which decide which tool is current         |
| `summaryKey`      | `MessageKey`        | **new**  | The fuller description, drawn where the entry point has more than one column |
| `shortSummaryKey` | `MessageKey`        | **new**  | The shorter description, drawn where it is a single flow                     |
| `subjectsKey`     | `MessageKey`        | **new**  | The subjects the tool covers, as one already-joined string                   |

**Why `subjectsKey` is one string and not a list.** The canvas draws
`SHIPYARD · OUTFITTING · ANATOMY · POWER` — four words joined by a separator. A list would
make the separator this application's decision in every language, and a language that
punctuates a series differently would be handed a middle dot it does not use. One string per
locale lets the translator write the series their language writes.

**Validation.** Every key is a `MessageKey`, so a tool added without copy fails to compile
rather than reaching a Commander as a missing key. There is no runtime validation because
there is no runtime input: the registry is a literal in the source.

## ToolEntry (unchanged)

What `AppNavigation.tools(currentPath)` returns and the tool bar draws. Untouched by this
feature and listed here so the two readings are visibly different shapes:
`{ id, label, href, current }`.

## ToolCard

What `AppNavigation.catalogue()` returns, one per tool, and what `edsb-tool-card` is handed.
All text is already resolved in the committed locale.

| Field      | Type     | Meaning                                                            |
| ---------- | -------- | ------------------------------------------------------------------ |
| `id`       | `string` | The tool's identity, for tracking the list and for test addressing |
| `name`     | `string` | The tool's name                                                    |
| `href`     | `string` | Where activating the card goes                                     |
| `summary`  | `string` | The fuller description                                             |
| `short`    | `string` | The shorter description                                            |
| `subjects` | `string` | The subjects the tool covers                                       |

No `current` field. FR-010 says no tool is current at the entry point, so the shape carries
no way to say one is.

Both descriptions are present in every `ToolCard`. Which one a Commander reads is the
stylesheet's answer, not this shape's (research decision 3), so the component receives both
and the page never chooses.

## Relationships

```text
TOOLS (literal, app-navigation.ts)
  │
  ├── tools(currentPath) ──→ ToolEntry[]  ──→ edsb-app-frame       (unchanged)
  └── catalogue()        ──→ ToolCard[]   ──→ edsb-tool-card × n   (new)
```

One source, two readings, no third list. A tool added to `TOOLS` appears in the bar and at
the entry point together, which is FR-004.

## Message keys

New keys in `src/app/i18n/locales/en.json` and `de.json`, and in the `MessageKey` union.

| Key                        | What it says                                                    |
| -------------------------- | --------------------------------------------------------------- |
| `home.title`               | The document title for the root address                         |
| `home.description`         | The sentence a search result quotes for the root address        |
| `home.heading`             | The screen's own heading — `TOOLS FOR COMMANDERS` on the canvas |
| `home.tagline`             | The line beneath it — `A growing set of tools for the galaxy.`  |
| `home.tools.label`         | The accessible name of the region holding the tool entries      |
| `tools.ship.summary`       | Ship Builder, fuller                                            |
| `tools.ship.short`         | Ship Builder, shorter                                           |
| `tools.ship.subjects`      | `Shipyard · Outfitting · Anatomy · Power`                       |
| `tools.equipment.summary`  | Equipment Builder, fuller                                       |
| `tools.equipment.short`    | Equipment Builder, shorter                                      |
| `tools.equipment.subjects` | `Suits · Weapons · Grades · Mods`                               |

`tools.ship` and `tools.equipment` already exist and are reused as the names.

The canvas sets the subject strip and the tool names in uppercase. That is the type ramp's
`text-transform`, as everywhere else in this application, not the catalogue's spelling — a
locale whose script has no case would otherwise be handed shouted English, and a German
noun would lose its capital on the way back down.

## What has no model

- **The attribution.** It is `helpManifest.disclaimer.exactText`, a constant compiled into
  the bundle beside its own `sha256`. The screen reads it; nothing shapes it.
- **The current tool.** There is not one (FR-010).
- **The shell actions.** Opening a saved record, importing and help are assembled in
  `src/app/app.ts` for every screen and are unchanged (FR-011).
