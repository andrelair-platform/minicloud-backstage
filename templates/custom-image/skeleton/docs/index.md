# ${{ values.name }}

${{ values.description }}

## What this image does

This is a custom image that extends `${{ values.upstreamImage }}` with minicloud-specific additions:

- minicloud CA certificate baked in (so internal HTTPS works)
- Any other platform-specific customisations

## Deployment

This repo produces the **image only**. Deploy it with the **wrapper-service** golden-path
template (`imageRepo = ${{ values.name }}`), which opens a conformant GAP wrapper-chart PR on
`minicloud-gitops` (`services/${{ values.name }}/helm` + dev/prod ArgoCD apps). Deployment config
never lives in this code repo (conventions.md: code repo ≠ deployment repo).

## Image registries

- **dev** — `harbor.10.0.0.200.nip.io/library/${{ values.name }}`
- **prod** — `ghcr.io/andrelair-platform/${{ values.name }}` (keyless Cosign-signed, SBOM attached)

Built, scanned, signed and dual-pushed automatically by the CI pipeline on every push to `main`.
