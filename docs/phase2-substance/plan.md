# Phase 2 Substance Plan

Ranked by real-user impact on the audit fixtures.

| Rank | Catalog item | Implementation target                                      | Fixture impact      |
| ---- | ------------ | ---------------------------------------------------------- | ------------------- |
| 1    | 6, 8         | Capture viability planner with fallback guesses            | rd-02, rd-03        |
| 2    | 24, 25       | Explicit recorder/share state taxonomy                     | rd-04, rd-08        |
| 3    | 26, 27       | External stop and double-click/concurrency handling        | rd-04               |
| 4    | 32, 34       | Actionable error taxonomy                                  | rd-05, rd-09, rd-10 |
| 5    | 16, 18       | Transcript confidence and warnings                         | rd-07               |
| 6    | 28, 29       | Operation progress model for heavy work                    | rd-06               |
| 7    | 26           | Cancellable transcription/share/decrypt flows              | rd-06               |
| 8    | 33, 36       | Boundary schemas for settings and state import             | rd-08               |
| 9    | 35, 38       | Deterministic state export/import provenance               | rd-08               |
| 10   | 9, 14        | Metadata-rich export/share payload                         | rd-01, rd-07        |
| 11   | 3, 4         | Partial inputs and missing key/share handling              | rd-10               |
| 12   | 31           | Cache local draft restore path                             | rd-08               |
| 13   | 2, 5         | Normalize backend URL and content metadata                 | rd-05, rd-09        |
| 14   | 17           | Suggested fixes for oversized/unreachable backend          | rd-05, rd-09        |
| 15   | 19, 37       | Explain capture/share decisions in debug mode              | all                 |
| 16   | 22           | Stable draft IDs and canonical state IDs                   | rd-08               |
| 17   | 40           | Remember API/TTL/capture choices in session/local settings | rd-01               |
| 18   | 1            | Fixture-driven logic fuzz tests                            | all                 |
| 19   | 15           | Domain vocabulary in statuses/errors                       | all                 |
| 20   | 30           | Avoid blocking UI during state import/export and restore   | rd-06, rd-08        |

Pass-rate target: improve from 3/10 to at least 8/10.
