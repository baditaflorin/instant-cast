# Phase 3 Input Pathway Audit

| Input pathway              | Before | Target                         | Decision                                         |
| -------------------------- | ------ | ------------------------------ | ------------------------------------------------ |
| Screen capture             | Green  | Record current tab/window      | Keep and regression-test                         |
| Webcam capture             | Green  | Optional overlay               | Keep optional, never block screen recording      |
| Microphone capture         | Green  | Optional audio                 | Keep optional, warn on denial                    |
| Camera calibration         | Yellow | Real handler or remove         | Finish as confidence-only diagnostic             |
| State file upload          | Green  | Import exported state          | Keep and extend to multi-file                    |
| Drag/drop state import     | Red    | Drop exported state JSON       | Implement                                        |
| Paste state JSON           | Red    | Paste exported state JSON      | Implement                                        |
| Paste share URL            | Red    | Open valid Instant Cast link   | Implement                                        |
| Clipboard read             | Red    | Read text with permission path | Implement with paste-box fallback                |
| Multi-file state import    | Yellow | Batch state imports            | Implement partial success reporting              |
| Mobile file picker         | Yellow | Works through file input       | Keep normal file input; document device limits   |
| URL input for hosted pages | Yellow | Accept Instant Cast share URL  | Implement URL parser; external URLs out of scope |
| Restored autosave          | Green  | Restore last draft             | Keep and test                                    |
| Sample/demo input          | N/A    | Not needed                     | Out of scope; app records user data directly     |
| Folder import              | N/A    | Not useful for this product    | Out of scope per ADR 0061                        |
| Image paste                | N/A    | Not useful for state/recording | Out of scope per ADR 0061                        |

## Notes

The red rows block a stranger who already has a state file or share link and expects the app to accept it without hunting for the exact button.

## After Implementation

Green or explicitly out of scope: 16/16.

- Drag/drop imports state files and text share URLs.
- Paste-box and clipboard-read paths route state JSON or Instant Cast share URLs.
- Multi-file state import saves every valid state and reports partial failures.
- Folder import, arbitrary external URL import, image paste, and sample/demo catalogs remain explicitly out of scope in ADR 0061.
