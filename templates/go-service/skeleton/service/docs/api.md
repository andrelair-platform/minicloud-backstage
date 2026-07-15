# API Reference

## GET /healthz

Liveness probe. Returns `200 OK` when the process is running.

```
GET /healthz HTTP/1.1
Host: ${{ values.name }}.example

200 OK
```

## GET /readyz

Readiness probe. Returns `200 OK` when the service is ready to accept traffic.

```
GET /readyz HTTP/1.1
Host: ${{ values.name }}.example

200 OK
```
