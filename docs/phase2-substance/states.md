# Phase 2 State Taxonomy

## Recorder States

- `idle-empty`: no active stream and no draft loaded.
- `idle-draft`: no active stream and a local draft is loaded.
- `requesting-screen`: waiting for browser screen permission.
- `requesting-devices`: screen granted, optional camera/mic being requested.
- `recording`: media recorder is actively collecting chunks.
- `finalizing`: recorder stopped, blob being assembled.
- `recoverable-error`: user work is intact and an action can continue.
- `fatal-error`: browser support or storage failure prevents the current flow.

Every state has an exit: start, stop, cancel, restore, download, clear, retry, or start fresh.

## Operation States

- `idle`
- `running`
- `cancelled`
- `failed`
- `succeeded`

Long operations carry a label, progress fraction when known, cancellability, and a user-facing next step.

## Share States

- `not-ready`: no recording.
- `preflight`: validating backend before encryption.
- `encrypting`
- `uploading`
- `shared`
- `share-recoverable-error`: local recording remains available.

Hosted share failure never destroys the local recording.
