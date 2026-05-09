# Phase 3 Controls Audit

| Control         | Before | Expected behavior on real data                 | Decision  |
| --------------- | ------ | ---------------------------------------------- | --------- |
| Record          | Green  | Starts screen capture                          | Keep      |
| Stop            | Green  | Finalizes recording exactly once               | Keep      |
| Camera on/off   | Green  | Toggles optional webcam request                | Keep      |
| Mic on/off      | Green  | Toggles optional microphone request            | Keep      |
| Calibrate       | Yellow | Runs real camera diagnostic or explains denial | Keep      |
| Webcam corner   | Green  | Moves overlay                                  | Keep      |
| Transcribe      | Green  | Runs Whisper with progress                     | Keep      |
| Optimize        | Green  | Runs FFmpeg remux with local recording intact  | Keep      |
| Download        | Green  | Downloads current recording                    | Keep      |
| Transcript Copy | Green  | Copies transcript                              | Keep      |
| API endpoint    | Green  | Persists and preflights before upload          | Keep      |
| Expiry          | Green  | Persists TTL metadata                          | Keep      |
| Auto-transcribe | Green  | Controls post-record transcript run            | Keep      |
| Share           | Green  | Encrypts, uploads, copies URL                  | Keep      |
| Export state    | Green  | Downloads canonical state JSON                 | Keep      |
| Import state    | Yellow | Imports one file only                          | Extend    |
| Restore         | Green  | Loads latest IndexedDB draft                   | Keep      |
| Clear           | Green  | Removes local drafts                           | Keep      |
| Drag/drop       | Red    | No production handler                          | Implement |
| Paste/clipboard | Red    | No production handler                          | Implement |
| Print           | Red    | No production handler                          | Implement |

No production controls are pure stubs after Phase 2, but import/output coverage is not yet complete enough for a stranger.
