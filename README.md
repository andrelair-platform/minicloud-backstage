# minicloud-backstage

Custom [Backstage](https://backstage.io) image for the **andrelair-platform** minicloud Kubernetes platform. Built and deployed via GitHub Actions — no manual steps required after a push to `main`.

## Stack

| Component | Detail |
|---|---|
| Backstage | 1.52.0 (new frontend system) |
| Runtime | Node 24 (`node:24-trixie-slim`) |
| Registry | `harbor.10.0.0.200.nip.io/library/backstage` |
| Auth | Authentik OIDC (`auth.10.0.0.200.nip.io`) |
| Database | PostgreSQL (Bitnami subchart, Longhorn PVC) |
| Deployment | ArgoCD via `minicloud-gitops/helm-values/backstage-values.yaml` |

## CI / CD

Push to `main` → GHA workflow (`.github/workflows/ci.yml`):

1. Joins the minicloud Tailscale tailnet (reaches `harbor.10.0.0.200.nip.io` directly — bypasses Cloudflare 100 MB limit)
2. `yarn install --immutable` + `yarn tsc` + `yarn build:backend` (Node 22 runner — required for `isolated-vm@6.x`)
3. Docker build → push to Harbor as `library/backstage:<sha>-amd64`
4. Trivy CRITICAL CVE scan
5. Cosign keyless sign (GitHub OIDC → Sigstore Fulcio)
6. GPG-signed commit to `minicloud-gitops` bumping `helm-values/backstage-values.yaml`
7. ArgoCD auto-syncs → new pod rolls out

**Required GHA secrets:**

| Secret | Purpose |
|---|---|
| `TAILSCALE_AUTH_KEY` | Ephemeral Tailscale auth key for runner |
| `MINICLOUD_CA_CERT` | minicloud self-signed CA (PEM) for Docker to trust Harbor TLS |
| `HARBOR_PASSWORD` | Harbor admin password |
| `GITOPS_TOKEN` | PAT with `repo` scope on `minicloud-gitops` |
| `GPG_PRIVATE_KEY` | Armored GPG private key (`FD6D39D681DEFA34`) for signed gitops commits |

## Local development

```bash
# Install deps (requires Node 22+)
yarn install

# Start frontend dev server (hot reload)
yarn start

# TypeScript check
yarn tsc

# Build backend bundle (creates packages/backend/dist/)
yarn build:backend
```

> The local dev server uses `app-config.yaml`. Production config is injected via the Helm chart's `appConfig` values and the `backstage-session-config` ConfigMap.

## Key configuration

**Session secret** — injected via `extraAppConfig` pointing to ConfigMap `backstage-session-config` in the `backstage` namespace. The config path is `auth.session.secret` (NOT `backend.session.secret`). The Helm chart's `toPrettyJson|fromJson|toYaml` pipeline drops unknown keys, so `extraAppConfig` is required.

**minicloud CA trust** — `NODE_EXTRA_CA_CERTS=/ca/ca.crt` env var; the CA cert is mounted from ConfigMap `minicloud-ca` in the `backstage` namespace. Required for the backend to verify Authentik's TLS certificate.

**OIDC provider** — configured under `auth.providers.oidc.production` in `backstage-values.yaml`. Uses `environment: production`. The sign-in page is registered via `SignInPageBlueprint.make` in `packages/app/src/modules/auth.tsx`.

## Known gotchas

- `isolated-vm@6.x` requires Node 22+ — uses `v8::SourceLocation` not available in Node 20.
- The Dockerfile base is `node:24-trixie-slim`; CI runs on Node 22 (compatible and close enough).
- BuildKit (`docker buildx`) runs in a container and does not inherit `/etc/docker/certs.d/` — buildkitd config sets `insecure = true` for the Harbor registry (safe: traffic goes over Tailscale VPN).
- Backstage new backend does not retry DB connections after startup failure. If the pod starts before PostgreSQL is ready, force-delete it: `kubectl delete pod -n backstage -l app.kubernetes.io/name=backstage --force --grace-period=0`.
- The PostgreSQL subchart uses `docker.io/bitnamilegacy/postgresql` (Bitnami chart #35164 image migration).
