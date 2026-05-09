# Phase 3 Plan

Ranked by real-user impact.

| Rank | Catalog items | Work item                                           | Evidence                   |
| ---- | ------------- | --------------------------------------------------- | -------------------------- |
| 1    | 1, 6, 7       | Route file, drag/drop, paste, and clipboard imports | input audit red rows       |
| 2    | 2, 36, 37     | Sniff state JSON vs share URL vs unsupported text   | input audit URL/paste rows |
| 3    | 4             | Multi-file state import with partial success        | input audit multi-file row |
| 4    | 8, 38, 40     | Restore/start-fresh remains explicit and tested     | persisted work path        |
| 5    | 9, 11, 41     | State export/import round-trip keeps full metadata  | output audit               |
| 6    | 10            | Copy state JSON and copied confirmations            | output audit red row       |
| 7    | 13            | Browser print output for current work               | output audit red row       |
| 8    | 15, 16        | Finish calibration/import half-baked controls       | controls audit             |
| 9    | 18            | Make settings a complete visible panel              | findings                   |
| 10   | 19, 42, 45    | README verified checklist and limitations           | feature-claims audit       |
| 11   | 28, 29        | Remove dead exports and keep zero TODO debt         | codebase audit             |
| 12   | 31, 33        | Keep one error and naming convention                | codebase audit             |
| 13   | 35, 36        | Keep external text/file boundaries schema-validated | codebase audit             |
| 14   | 38, 39        | Persist settings/state with versioned schemas       | codebase audit             |
| 15   | 43            | Verify quickstart commands still run                | README                     |
| 16   | 44            | Minimal inline help through domain-specific labels  | controls audit             |
| 17   | 46, 47        | Stranger test and top-3 fixes                       | mandatory                  |
| 18   | 20, 23        | Reuse state schema across import/export tests       | codebase audit             |
| 19   | 21, 22        | Keep one canonical recording state shape            | codebase audit             |
| 20   | 31, 32        | Apply one operation-state pattern for long work     | Phase 2 floor              |

## Gate

No Phase 2 real-data fixture may regress. Every implementation commit that changes user-data behavior must run unit tests; final push runs lint, test, build, and smoke.
