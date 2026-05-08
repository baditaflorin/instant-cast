# API

OpenAPI contract: api/openapi.yaml

Local API base URL: http://localhost:8080

Production image: ghcr.io/baditaflorin/instant-cast:latest

## Health

```sh
curl http://localhost:8080/healthz
curl http://localhost:8080/readyz
```

## Upload

```sh
curl -X POST http://localhost:8080/api/uploads \
  -F 'metadata={"filename":"demo.webm","clearContentType":"video/webm","encryptedBytes":5,"clearBytes":4,"ttlSeconds":600}' \
  -F 'file=@demo.webm.age;type=application/octet-stream'
```

## Read Share Metadata

```sh
curl http://localhost:8080/api/shares/<token>
```

## Download Encrypted Blob

```sh
curl 'http://localhost:8080/api/blobs/<id>?token=<token>' -o demo.webm.age
```
