# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Recordings can be large and should not be forced through localStorage. Users need local drafts, transcript state, and recovery across refreshes.

## Decision

Use IndexedDB through Dexie for recording metadata, transcript text, share metadata, and blob references. Use OPFS where available for large local media drafts, with IndexedDB blob fallback.

Use localStorage only for small UI preferences.

## Consequences

- Large recordings avoid quota-hostile localStorage.
- Local-only workflows work offline.
- Browser storage limits still apply and are surfaced to the user.

## Alternatives Considered

- localStorage: rejected because it is too small and synchronous.
- Server persistence for drafts: rejected because v1 avoids accounts and plaintext server state.
