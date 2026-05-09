# Phase 3 Output Pathway Audit

| Output pathway        | Before | Target                             | Decision                        |
| --------------------- | ------ | ---------------------------------- | ------------------------------- |
| Download recording    | Green  | `.webm` download                   | Keep and test                   |
| Copy transcript       | Green  | Clipboard copy                     | Keep and test                   |
| Encrypted share URL   | Green  | Copyable URL after backend upload  | Keep with preflight             |
| Copy share URL        | Green  | Clipboard copy                     | Keep and test                   |
| Export state file     | Green  | Versioned JSON round-trip          | Keep and add copy-state output  |
| Import exported state | Green  | Full local restore                 | Keep and test                   |
| Copy state JSON       | Red    | Clipboard copy for small drafts    | Implement                       |
| Print/PDF view        | Red    | Browser print of current work      | Implement minimal print action  |
| API/curl-ready output | Yellow | Backend contract documented        | Keep in docs, not production UI |
| Embed code            | N/A    | Not a recorder need                | Out of scope per ADR 0062       |
| Screenshot output     | N/A    | Recording already contains picture | Out of scope per ADR 0062       |
| Code export           | N/A    | Not applicable                     | Out of scope per ADR 0062       |

## Notes

State export is the canonical work artifact. Copying the state JSON matters for small recordings and debugging; very large states remain file-download first.

## After Implementation

Green or explicitly out of scope: 12/12.

- State JSON can be downloaded or copied.
- Transcript and share URL copy paths remain available.
- Browser print is exposed for the current restored/recorded work.
- API/curl examples stay in `docs/api.md`; embed/code/screenshot exports remain out of scope in ADR 0062.
