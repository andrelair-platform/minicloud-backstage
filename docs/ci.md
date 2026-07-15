# CI/CD Pipeline

The pipeline follows the canonical minicloud golden path.

## Triggers

| Branch | What happens |
|---|---|
| `dev` | Build + push `dev-<sha>-amd64` to Harbor, no sign |
| `staging` | Build + push + Cosign sign |
| `main` | Build + push + Cosign sign + syft SBOM + bump gitops tag |

## Steps

1. **Tailscale OAuth** — establishes connectivity to Harbor at `10.0.0.200`
2. **Trust CA** — injects minicloud CA cert so Docker/Harbor TLS works
3. **Build & push** — `linux/amd64` via BuildKit
4. **Trivy** — scan for CRITICAL CVEs; exit-code 1 = block merge
5. **Cosign** — sign image in Harbor registry (staging + main)
6. **syft SBOM** — generate and attach SBOM to the image (main only)
7. **bump-gitops** — update `backstage-values.yaml` image tag, GPG-signed commit

## Secrets required

All 7 standard CI secrets are set at org level (`andrelair-platform`):
`TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `MINICLOUD_CA_CERT`, `HARBOR_USER`, `HARBOR_PASSWORD`, `GITOPS_TOKEN`, `GPG_PRIVATE_KEY`
