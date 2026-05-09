# Phase 3 Findings

## Top Usability Gaps

1. A returning user can import a state file only through a hidden file picker, not drag/drop or paste.
2. A user with an Instant Cast link cannot paste it into the studio and be routed to playback.
3. State export can be downloaded, but small state JSON cannot be copied for support/debug workflows.
4. Settings are real but visually mixed with sharing, making it hard to tell what persists.
5. The README does not state the real limits: hosted sharing needs a deployed backend, large recordings create large state files, and browser capture support varies.

## Half-Baked Features

1. Calibrate: finish as a real diagnostic, keep.
2. Import state: finish with drag/drop, paste, clipboard, multi-file.
3. Print/PDF: add minimal browser print output, keep.
4. API automation snippets: keep in docs only, do not add production UI.
5. Demo/sample: do not add; recording user data is the primary input.

## Codebase Pain Points

1. Import handling is too coupled to the file input.
2. Clipboard handling has no fallback wrapper.
3. Dead helper exports make audit results noisier.
4. README has no verified checklist tied to tests.
5. E2E tests cover shell loading but not user-owned data import/export.

## Fully Usable Means

- A stranger can record, stop, review, transcribe, download, and locally restore without backend setup.
- A stranger can bring back prior work by file, drag/drop, paste, or clipboard.
- A stranger can share only when a reachable backend exists, and failure leaves local output intact.
- Every visible control either completes its labeled action or explains why it cannot.
- README claims match tested app behavior.

## Success Metrics

- Input audit green or explicitly out-of-scope for 16/16 rows.
- Output audit green or explicitly out-of-scope for 12/12 rows.
- 0 dead exports from the Phase 3 audit remain.
- 0 TODO/FIXME/XXX/HACK and 0 TypeScript `any`/`@ts-ignore` in source.
- Playwright covers project links plus state import and settings controls.

## Out Of Scope

- New recording engines.
- New backend architecture.
- New visual polish, dark mode, animations, or landing pages.
- Account systems or cross-device sync.
- External URL scraping or CORS proxying.
