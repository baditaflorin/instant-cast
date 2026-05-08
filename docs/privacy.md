# Privacy

Instant Cast does not include client analytics in v1.

Recordings are captured in the browser. Transcription, FFmpeg export, MediaPipe calibration, and age encryption run locally.

When sharing is used, the browser uploads only encrypted `.age` bytes to the backend. The age passphrase is placed in the URL fragment and is not sent to the backend by browsers.

The backend stores:

- Encrypted blob bytes.
- Filename, clear content type, encrypted byte count, clear byte count, duration, transcript text if the user keeps it, and expiry timestamp.
- Structured request logs.
- Prometheus aggregate metrics.

Support link: https://www.paypal.com/paypalme/florinbadita

Repository: https://github.com/baditaflorin/instant-cast
