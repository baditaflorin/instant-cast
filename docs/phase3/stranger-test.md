# Phase 3 Stranger Test

## Setup

Private browser session, fresh local storage, Pages-style `/instant-cast/` route, and a hand-made exported state JSON containing a small recording blob and transcript.

## Findings

1. The file-only import path was too hidden for someone arriving with an exported state file.
2. A pasted Instant Cast share URL had no obvious destination from the studio.
3. Settings were real but buried inside sharing controls; frame rate was not visible after Phase 2.

## Fixes

1. Added drag/drop, multi-file, paste-box, and clipboard-read import paths.
2. Added share URL detection that routes to playback without requiring the user to know URL structure.
3. Added a visible `Settings & Share` panel with frame-rate, endpoint, expiry, and auto-transcribe controls.

## Residual Risk

This was a private-session substitute rather than a second human. The most valuable next test is watching a non-developer use the live Pages URL with their own recording.
