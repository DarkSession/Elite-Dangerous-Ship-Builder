# Browser Delivery Contract

All actions consume one current `SlefExportArtifact` and require a deliberate Commander gesture.
Browser globals are hidden behind injected ports for deterministic tests. No port regenerates or
changes the artifact.

## Selectable payload

The labelled readonly payload is always available while the artifact is current. It supports native
selection/copy behavior and remains after every programmatic failure. Full JSON is never placed in a
live region.

## Copy

- Invoke async `navigator.clipboard.writeText(artifact.payload)` from the explicit action.
- Never use `document.execCommand()` and never fabricate success.
- Return `copied` only after promise resolution; unavailable/permission/failure maps to stable
  app-owned status without raw exception prose.
- On failure, keep the payload and Download/Share alternatives; select/focus the payload where the
  browser supports that presentation intent.

## Download

- Create exact payload bytes with `application/json;charset=utf-8` and a fixed safe `.slef.json`
  filename containing no hull, ship name/ident or other untrusted text.
- Create/trigger/revoke the object URL only from the explicit action; remove any temporary anchor.
- Report `dispatched` after setup/trigger or `setupFailed` before it. The app cannot observe or claim
  that a browser/user saved the file.
- Download remains present on every form factor, including when Web Share supports files.

## Platform share

- Render Share only when `navigator.share` is callable; do not infer capability from viewport/device.
- Build a `File` from the exact artifact. Use file share only when callable
  `navigator.canShare({ files: [file] })` returns true; otherwise share exact payload text.
- Invoke `navigator.share` directly within transient activation. Do not perform asynchronous
  preparation first that could consume/expire it.
- Treat `AbortError` as neutral `cancelled`; other rejection is `failed`; resolution is `shared`.
- Never invoke automatically, retry a target, select a target or send an application network request.

Capability detection is advisory: every operation may still fail. All actions have visible/matching
accessible names, text state and shared touch-target sizing. A concise polite announcement may name
the action/result; it never announces JSON, a filename derived from user data or raw DOM errors.

Playwright mocks every port, asserts identical UTF-8 bytes and forbids real Clipboard/share targets
and unexpected requests.
