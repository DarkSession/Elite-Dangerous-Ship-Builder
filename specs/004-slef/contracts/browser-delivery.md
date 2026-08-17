# Browser Delivery Contract

All actions require one `SlefExportArtifact` and a deliberate Commander gesture. Browser APIs are
injected ports for deterministic tests.

## Copy

- Use async Clipboard API; never `document.execCommand()`.
- Return stable permission/unavailable/failure status, not raw exception UI.
- On failure retain and select/focus the labelled payload where supported; download stays available.
- Success/failure does not close or clear the panel.

## Download

- Blob bytes equal the payload with `application/json;charset=utf-8`.
- Use a fixed safe `.slef.json` filename with no user/untrusted text.
- Trigger/revoke object URL only for the explicit action.
- Failure leaves copy, share (if present) and payload available.

## Platform share

- Render only when `navigator.share` is callable.
- Share `File` when `navigator.canShare({files})` accepts it; otherwise share payload text.
- Treat user cancellation separately from failure.
- Never invoke automatically, select/retry a target or perform a network request.

Capability detection is advisory; later failure changes status only. Actions have matching accessible
names and at least 44 CSS px targets. A polite live region announces concise status, never full JSON.
Playwright mocks share and asserts exact bytes without sending real data.
