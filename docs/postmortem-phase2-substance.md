# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 3/10 fixtures were acceptable without manual recovery.

After: 9/10 fixtures have deterministic logic support and a user-actionable path. The remaining gap is real browser/mobile capture QA that cannot be fully automated from the fixture set.

| Fixture                      | Before          | After | Evidence                                          |
| ---------------------------- | --------------- | ----- | ------------------------------------------------- |
| rd-01-clean-demo             | Pass            | Pass  | Happy path preserved                              |
| rd-02-camera-denied          | Fail            | Pass  | Camera is optional; screen + mic continues        |
| rd-03-mic-denied             | Fail            | Pass  | Mic is optional; screen + camera continues        |
| rd-04-browser-stop           | Fail            | Pass  | External stop auto-finalizes                      |
| rd-05-public-pages-localhost | Fail            | Pass  | Share preflight blocks localhost on public Pages  |
| rd-06-large-4k               | Risk            | Pass  | Size risk and cancellable operations are surfaced |
| rd-07-noisy-audio            | Wrong-confident | Pass  | Transcript confidence and warnings added          |
| rd-08-refresh-after-record   | Fail            | Pass  | Latest local draft restores                       |
| rd-09-upload-too-large       | Fail            | Pass  | Upload-limit guidance and local fallback          |
| rd-10-broken-share           | Partial         | Pass  | Missing/wrong key errors are domain-language      |

## Top 5 Logic Gaps Closed

1. Optional permissions now degrade instead of aborting screen recording.
2. Recording lifecycle handles browser external stop and local draft restore.
3. Long work has named operation state, progress where known, and cancellation guards.
4. Share flow preflights backend reachability before encryption/upload.
5. Transcript and share metadata carry confidence, warnings, app version, schema version, and capture mode.

## Smart Behaviors That Now Work

- The app picks the best available capture mode when camera or mic is unavailable.
- The app refuses to do expensive share work when the configured endpoint cannot work.
- The app restores local work after refresh and exports/imports complete local state.
- The app labels uncertain transcripts instead of pretending they are authoritative.

## Determinism

All 10 real-data fixture plans are deterministic. State export/import round-trip is deterministic except for intentional `exportedAt` provenance.

## Performance

Long-running media operations still depend on browser/WASM performance, but the UI now reports named steps and cancellation. The app estimates large-recording risk before upload.

## Surprises

- The largest perceived intelligence improvement came from permission fallback and backend preflight, not new media features.
- The old IndexedDB save path existed but needed UI restore to matter.

## Still Open

1. Real device QA on iOS Safari and Android Chrome.
2. True streaming encryption/upload for very large recordings.
3. Richer transcript confidence from model timestamps or segment-level scores.
4. Object-storage backend for production retention.
5. Automated browser permission e2e coverage.

## Honest Take

The app no longer feels like a pure happy-path toy. It still needs real-device media QA and production backend deployment to feel fully dependable, but the core logic now handles the common ways real recordings go sideways.
