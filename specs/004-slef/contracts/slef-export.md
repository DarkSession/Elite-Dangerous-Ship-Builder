# SLEF Export Contract

Export requires the current active `ShipLoadout`. No build means no stale artifact. Invalid/incomplete
validation adds visible package warnings but never disables generation/delivery.

Generate only through:

```text
ShipLoadout.toSlefString({
  header: {
    appName: <stable application identifier>,
    appVersion: <root package.json version>,
    appURL: <published exact-revision canonical link, when available>
  },
  credits: 'source',
  moduleOrder: 'fitted',
  explicitPower: false,
  indent: 2
})
```

Omit pending/refused/stale/noncanonical `appURL`; export does not trigger link encoding.

## Payload boundary

Package output is exactly one SLEF entry containing supported hull, fitted/unresolved slots/modules,
ordinary and identified pre-engineering, completed quality/effect, enabled/priority and name/ident.
The package owns omissions/spelling. Capture-only instance/health/ammo/engineer fields, local record/
note/revision, validation/diagnostics/reports and substitute values are forbidden. Fixed fill exports
the resulting module only.

## Source purchase

`credits: 'source'` is mandatory. Untouched valid captured values round-trip; package-invalidated or
source-absent values remain absent; assembled builds emit no credit fields. Retail is never fallback.

## Artifact and round trip

One immutable artifact is keyed to active revision and consumed by all delivery actions. Failure does
not regenerate it; modelled edit/replacement invalidates it. Its labelled readonly field is selectable
and owns JSON overflow.

Round-trip tests inspect the generated string, require one entry/zero diagnostics, reconstruct with
`fromSlef`, export again and compare modelled fields under only the two constitutional normalizations.
Producer header, whitespace and package-normalized identity casing are not separate game state.
