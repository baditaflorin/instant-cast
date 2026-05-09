# Phase 3 Feature Claims Audit

| Claim source | Claim                                                     | Status before | Action                                     |
| ------------ | --------------------------------------------------------- | ------------- | ------------------------------------------ |
| README       | Screen recording with webcam overlay                      | Shipped       | Keep and test                              |
| README       | Local transcript generation                               | Shipped       | Keep and test confidence metadata          |
| README       | Client-side age encryption                                | Shipped       | Keep                                       |
| README       | Signed anonymous upload/download API                      | Shipped       | Keep                                       |
| README       | Version and commit visible in UI                          | Shipped       | Keep and test                              |
| ADRs         | Local-only recording/export works without backend         | Shipped       | Keep                                       |
| ADRs         | State import/export is deterministic enough to round-trip | Shipped       | Add input pathway coverage                 |
| ADRs         | Debug surface exists at `?debug=1`                        | Shipped       | Keep; document                             |
| In-app UI    | Calibrate implies real camera work                        | Partial       | Keep as diagnostic with explicit result    |
| In-app UI    | Import state implies user can bring prior work back       | Partial       | Extend to drag/drop, paste, and multi-file |

README claims are mostly true after Phase 2. The biggest mismatch is not false advertising; it is that several real-user entry points are hidden behind one small file button.
