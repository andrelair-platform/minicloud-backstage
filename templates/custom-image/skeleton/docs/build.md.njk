# Build Process

## Dockerfile

The `Dockerfile` in the repo root extends `${{ values.upstreamImage }}`:

1. Accepts `ARG CA_CERT` at build time
2. Writes the minicloud CA cert to `/usr/local/share/ca-certificates/minicloud-ca.crt`
3. Runs `update-ca-certificates`

The CA cert is **never** committed to the repo — it is injected by CI via `build-args: CA_CERT=${{ "{{" }} secrets.MINICLOUD_CA_CERT {{ "}}" }}`.

## CI pipeline

```
push to main
  → Tailscale OAuth → Trust CA → login Harbor + ghcr
  → Build (linux/amd64, CA cert injected via --build-arg)
  → Dual-push: Harbor (dev) + ghcr (prod), same digest
  → Trivy CRITICAL scan
  → Cosign sign (keyless) the ghcr image
  → syft SBOM → attach to the ghcr image
```

Deployment is a **separate** concern — run the `wrapper-service` template to open the
GAP wrapper-chart PR on `minicloud-gitops` (this repo builds the image, it does not bump
any deployment file).

## Local build

```bash
docker build \
  --build-arg CA_CERT="$(cat ~/minicloud-ca.crt)" \
  -t harbor.10.0.0.200.nip.io/library/${{ values.name }}:local \
  .
```
