# Build-Link Contract

## Canonical form

```text
<same-origin base>/build#b.<versioned-payload>
```

- Path and query contain no build data.
- The value after `#` starts `b.` and is at most 500 characters including that prefix.
- Origin, deployment base path and `#` are outside the codec limit.
- Generated links use the existing on-demand codec loader and current immutable table. Every published table decoder remains selectable by payload version.

## Payload boundary

The codec allowlist is package-resolved hull/module identities, game slot keys, package-identified
pre-engineered variant, later ordinary blueprint/effect identity and grade, module enabled state and
priority, and nullable ship name/ident. Unknown identities are never encoded.

The payload forbids catalogue facts, calculations, prices, purchase provenance, validation snapshots, notes, record/tab IDs, timestamps, save name, revision and browsing state. A build that cannot cross this allowlist losslessly is refused rather than simplified.

## Ingress pipeline

Initial app start, address-bar paste, browser navigation and in-app fragment navigation all invoke the same operation:

1. Recognize a `b.` value; unrelated fragments are not interpreted as builds.
2. Reject a value longer than 500 characters before decoding.
3. Verify envelope, encoding, CRC and supported table version.
4. Decode/reconstruct a candidate `ShipLoadout` without touching active state.
5. Refuse an unknown hull or any identity the selected codec table cannot represent. Reconstruct the
   candidate through the released package boundary, which returns every fixed mount populated with
   its hull default.
6. If current work is unsaved, request replacement confirmation.
7. On acceptance, commit the candidate as link/working provenance and autosave it only to this tab's working record.

Any parse, integrity, version, identity or reconstruction error, or cancellation, leaves the active and named state unchanged. An async request token ensures a late decode cannot replace a newer navigation.

## Active-edit synchronization

- After a successful modelled edit, encode the latest active build.
- Replace only the fragment using `history.replaceState`; preserve origin, base path and query and do not add a history entry per edit.
- If encoding is refused, remove a stale `b.` fragment with `replaceState`, retain the active build and expose a localized refusal with structured code, affected slot/reason where available, and feature 004's SLEF action.
- Copy/share uses the currently published canonical URL. Clipboard/platform-share failure leaves selectable link text available.
- Notes and other local metadata edits do not trigger codec changes.

## Error presentation

Map stable `BuildLinkCodecError.code` and structured parameters to application localization keys. Do not render internal English exception messages. Required categories include invalid/truncated encoding, failed integrity, unsupported envelope/table version, invalid payload, unknown/unrepresentable identity and reconstruction failure.

A newer version is never guessed. A missing compact identity in a current payload is refused; a
supported older payload reaches the same package-owned fixed-default construction as every other
ingress path and is never repaired from a display index.

## Network and history assertions

- Browsers do not transmit fragments in HTTP requests; automated tests additionally reject any request URL containing `b.` build data and any automatic cross-origin request.
- Creating/editing a build does not grow history for each fragment revision.
- Back/forward/pasted fragments exercise the same candidate-first confirmation behavior.
