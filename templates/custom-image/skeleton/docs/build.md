# Build Process

## Containerfile

The `Containerfile` in the repo root extends `${{ values.upstreamImage }}`:

1. Accepts `ARG CA_CERT` at build time
2. Writes the minicloud CA cert to `/usr/local/share/ca-certificates/minicloud-ca.crt`
3. Runs `update-ca-certificates`

The CA cert is **never** committed to the repo — it is injected by CI via `build-args: CA_CERT=${{ "{{" }} secrets.MINICLOUD_CA_CERT {{ "}}" }}`.

## CI pipeline

```
push to main
  → Tailscale OAuth → Trust CA
  → Build (linux/amd64, CA cert injected via --build-arg)
  → Trivy CRITICAL scan
  → Cosign sign
  → syft SBOM
  → bump ${{ values.gitopsFile }} image tag (GPG-signed commit)
```

## Local build

```bash
docker build \
  --build-arg CA_CERT="$(cat ~/minicloud-ca.crt)" \
  -t harbor.10.0.0.200.nip.io/library/${{ values.name }}:local \
  .
```
