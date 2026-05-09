# Phase 2 Substance Real-Data Audit

Instant Cast's real inputs are not files in a parser; they are messy browser capture and share situations. The audit below uses real user conditions a screen-recorder sees: device denial, external browser stop, huge recordings, noisy audio, stale share links, and default backend confusion.

| ID                           | Input                                                            | What v1 did                                                                | What it should have done                                           | Failure type               | Manual work pushed to user       |
| ---------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------- | -------------------------------- |
| rd-01-clean-demo             | Chrome desktop, 1080p tab, mic + webcam, 2 minute demo           | Records, transcribes, exports, encrypts and shares if backend is available | Keep this happy path intact                                        | Pass                       | None                             |
| rd-02-camera-denied          | User grants screen, denies webcam                                | `getUserMedia` failure aborts whole recording                              | Continue screen + mic, mark camera skipped                         | Visible failure            | Retry with camera off            |
| rd-03-mic-denied             | User grants screen/camera, denies microphone                     | Combined media request can abort camera and recording                      | Continue screen + webcam, mark mic skipped                         | Visible failure            | Toggle mic and retry             |
| rd-04-browser-stop           | User stops sharing from browser chrome                           | Recorder stops internally, UI can remain in recording state                | Auto-finalize the recording and restore idle controls              | Stuck state                | Guess whether recording survived |
| rd-05-public-pages-localhost | Public Pages user keeps `http://localhost:8080` and clicks Share | Encrypt work begins and upload later fails                                 | Preflight endpoint before encryption and explain backend setup     | Late, generic failure      | Learn what localhost means       |
| rd-06-large-4k               | 4K screen + webcam for 15 minutes                                | Whole blob operations with no granular progress or cancel                  | Warn about size, show steps, make long work cancellable            | Slow/stuck risk            | Wait or reload                   |
| rd-07-noisy-audio            | Background noise/accent/multiple speakers                        | Transcript appears as plain text or "No speech detected"                   | Surface confidence and warnings                                    | Wrong-but-confident risk   | Manually verify everything       |
| rd-08-refresh-after-record   | User refreshes after recording before sharing                    | Recording is saved but not restored into UI                                | Offer last draft restore automatically                             | Surprise data-loss feeling | Start over or inspect storage    |
| rd-09-upload-too-large       | Backend rejects body due to upload limit                         | Generic upload error                                                       | Explain size limit and suggest local download or shorter recording | Wrong why                  | Guess limit                      |
| rd-10-broken-share           | Missing key, expired token, mismatched key/ciphertext            | Missing key is clear; other errors are technical                           | Name expired/missing/wrong key in user terms                       | Partly handled             | Debug URL manually               |

## Top 5 Logic Gaps

1. Permission fallback is brittle: one denied optional device can kill a valid screen recording.
2. Recording lifecycle is incomplete: external stop, refresh restore, and cancellation are not first-class states.
3. Heavy operations are monolithic: transcription, export, encryption, upload, and decrypt have little progress and weak cancellation.
4. Sharing is under-inferred: the app does not detect default localhost or unreachable backend before doing expensive encryption.
5. Transcript output has no confidence or anomaly metadata, so uncertain text looks authoritative.

## Top 3 Intuition Failures

1. Denying camera feels like it should only remove camera; v1 can fail the whole recording.
2. Stopping share in the browser feels like stop; v1 can leave the app visually half-recording.
3. Refreshing after a saved recording feels recoverable; v1 starts empty.

## Top 3 "Feels Stupid" Moments

1. The user has to know that `localhost` on the public site cannot be the hosted backend.
2. The user has to manually decide camera/mic fallback instead of the app degrading.
3. The app says MediaPipe calibration succeeded but does not carry useful framing confidence into the recording flow.

## What Smart Means

- The app infers the best viable capture mode from available permissions and degrades optional devices.
- The app preflights sharing before expensive work and explains backend problems in recording/share language.
- The app restores the last local draft and makes local download/export the fallback when hosted sharing is unavailable.
- The app shows progress, cancellation, and confidence for long or uncertain operations.
- The app never treats a transcript or shared playback as confidently correct when evidence is weak.

## Phase 2 Substance Success Metrics

- At least 7 of 10 fixtures complete the primary flow without manual recovery.
- 100 percent of camera/mic denial fixtures still allow screen recording when screen capture is granted.
- External browser stop produces a finalized recording state in tests.
- Operations over 300 ms expose a named step; operations over 5 seconds expose cancellation.
- Share preflight catches localhost-on-Pages and unreachable backend before encryption.
- Transcript output always includes confidence and warnings.
- Every recoverable failure has what/why/now-what language.

## Out of Scope

No accounts, comments, team workspace, server-side transcription, new storage backend, new recorder modes, visual polish, dark mode, analytics, or architecture escalation. Mode C remains unchanged.
