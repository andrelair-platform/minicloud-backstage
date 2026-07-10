# minicloud-backstage

[![CI](https://github.com/andrelair-platform/minicloud-backstage/actions/workflows/ci.yml/badge.svg)](https://github.com/andrelair-platform/minicloud-backstage/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Backstage](https://img.shields.io/badge/Backstage-1.52.0-purple)](https://backstage.io)
[![Supply chain: cosign](https://img.shields.io/badge/supply%20chain-cosign%20signed-green)](https://github.com/sigstore/cosign)

> A production-hardened internal developer portal built on [Backstage](https://backstage.io), deployed on a self-hosted Kubernetes platform. Features a custom Tech Radar, Authentik OIDC SSO, Software Catalog with API Docs, and fully automated GitOps delivery via ArgoCD.

**Live demo:** [https://backstage.devandre.sbs](https://backstage.devandre.sbs)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Tech Radar](#tech-radar)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Software Catalog** — tracks all platform services, APIs, tools, and infrastructure components
- **API Docs** — inline Swagger/OpenAPI UI for every registered API entity
- **Kubernetes tab** — live pod status and cluster resource view per component
- **Tech Radar** — custom 4-quadrant radar (Platforms, AI/ML, Security, Languages) fetched live from [`minicloud-gitops`](https://github.com/andrelair-platform/minicloud-gitops/blob/main/tech-radar.json)
- **OIDC SSO** — single sign-on via Authentik; no separate Backstage user accounts
- **Fully GitOps** — ArgoCD reconciles on every push; no manual `kubectl` steps after bootstrap
- **Supply chain security** — every image is Trivy-scanned and Cosign-signed (keyless via GitHub OIDC → Sigstore Fulcio)

---

## Architecture

```
┌─────────────────────────────────────────────┐
│             GitHub Actions CI               │
│  yarn build → Docker push → cosign sign     │
│  → GPG-signed commit to minicloud-gitops    │
└────────────────────┬────────────────────────┘
                     │ webhook
┌────────────────────▼────────────────────────┐
│                  ArgoCD                     │
│   watches helm-values/backstage-values.yaml │
│   → Recreate rollout in backstage namespace │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│            Backstage Pod (k3s)              │
│  Node 24 · PostgreSQL · Authentik OIDC      │
│  Harbor registry · Longhorn PVC             │
└─────────────────────────────────────────────┘
```

| Component | Detail |
|---|---|
| Backstage | 1.52.0 — new frontend system (`createApp` from `@backstage/frontend-defaults`) |
| Runtime | `node:24-trixie-slim` |
| Registry | `harbor.10.0.0.200.nip.io/library/backstage` (internal, via Tailscale) |
| Auth | Authentik OIDC (`auth.devandre.sbs`) |
| Database | PostgreSQL — Bitnami subchart, Longhorn PVC |
| GitOps | ArgoCD — values in `minicloud-gitops/helm-values/backstage-values.yaml` |

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 22 | Required for `isolated-vm@6.x` — Node 20 will fail at build time |
| Yarn | v4 (Berry) | Version managed by `.yarnrc.yml` — do not use npm |
| Docker | any recent | Only needed if building the image locally |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/andrelair-platform/minicloud-backstage.git
cd minicloud-backstage
yarn install
```

### 2. Run locally

```bash
# Start the frontend dev server with hot reload
# Uses app-config.yaml — points to local/mock backends
yarn start
```

Open [http://localhost:3000](http://localhost:3000). The local app uses `app-config.yaml`; production config is injected via the Helm chart.

### 3. Build

```bash
# TypeScript type check
yarn tsc

# Compile backend bundle (required before Docker build)
yarn build:backend
```

### 4. Build the Docker image locally (optional)

```bash
yarn build:backend
docker build -f packages/backend/Dockerfile -t backstage:local .
```

> **Note:** The CI pipeline handles image builds automatically on push to `main`. Manual builds are only needed for local testing.

---

## Project Structure

```
minicloud-backstage/
├── packages/
│   ├── app/                          # React frontend
│   │   └── src/
│   │       ├── App.tsx               # createApp() — registers all FrontendFeature plugins
│   │       └── modules/
│   │           ├── auth.tsx          # SignInPageBlueprint (Authentik OIDC)
│   │           ├── nav/
│   │           │   ├── Sidebar.tsx   # NavContentBlueprint — layout + Tech Radar link
│   │           │   └── SidebarLogo.tsx
│   │           └── tech-radar/
│   │               ├── index.tsx     # createFrontendPlugin — registers /tech-radar route
│   │               └── TechRadarPage.tsx  # Fetches tech-radar.json, renders 4-quadrant grid
│   └── backend/
│       └── src/
│           ├── index.ts              # Backend entry point
│           └── plugins/              # Backend plugin wiring
├── app-config.yaml                   # Local development config
├── app-config.production.yaml        # Production overrides (injected via Helm)
├── catalog-info.yaml                 # Backstage self-registration entity
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Build → push → sign → gitops bump
│       └── release.yml               # Semver tagging workflow
└── playwright.config.ts              # E2E test config
```

---

## Configuration

### Environment variables (injected by Helm)

| Variable | Source | Purpose |
|---|---|---|
| `SESSION_SECRET` | `backstage-phase24-secret` | Express session signing key |
| `AUTH_OIDC_CLIENT_ID` | `backstage-phase24-secret` | Authentik OAuth2 client ID |
| `AUTH_OIDC_CLIENT_SECRET` | `backstage-phase24-secret` | Authentik OAuth2 client secret |
| `K8S_SA_TOKEN` | `backstage-phase24-secret` | ServiceAccount token for the Kubernetes plugin |
| `K8S_CA_DATA` | `backstage-phase24-secret` | Cluster CA certificate (base64) |
| `ARGOCD_USERNAME` | `backstage-phase24-secret` | ArgoCD read-only user |
| `ARGOCD_PASSWORD` | `backstage-phase24-secret` | ArgoCD read-only password |
| `NODE_EXTRA_CA_CERTS` | mounted ConfigMap `minicloud-ca` | Trusts the self-signed minicloud CA for in-cluster OIDC calls |

> All secrets are managed by [External Secrets Operator](https://external-secrets.io) pulling from HashiCorp Vault. Nothing is hardcoded.

### Key config paths in `backstage-values.yaml`

```yaml
auth:
  providers:
    oidc:
      production:
        metadataUrl: https://auth.devandre.sbs/application/o/backstage/.well-known/openid-configuration

backend:
  csp:
    connect-src: ["'self'", "https://raw.githubusercontent.com"]  # allows Tech Radar fetch
  reading:
    allow:
      - host: raw.githubusercontent.com   # allows Catalog to read GitHub-hosted entity files
```

---

## CI/CD Pipeline

Every push to `main` triggers `.github/workflows/ci.yml`:

```
push to main
    │
    ├─ 1. Connect to Tailscale tailnet (reach Harbor registry directly)
    ├─ 2. yarn install + yarn tsc + yarn build:backend  (Node 22)
    ├─ 3. docker build → push to harbor.10.0.0.200.nip.io/library/backstage:<sha>-amd64
    ├─ 4. Trivy scan — fails on unfixed CRITICAL CVEs
    ├─ 5. cosign sign (keyless — GitHub OIDC → Sigstore Fulcio)
    └─ 6. GPG-signed commit to minicloud-gitops bumping backstage-values.yaml
              └─ ArgoCD webhook → Recreate rollout in backstage namespace
```

### Required repository secrets

| Secret | Purpose |
|---|---|
| `TAILSCALE_AUTH_KEY` | Ephemeral auth key to join the Tailscale tailnet |
| `MINICLOUD_CA_CERT` | Self-signed CA PEM — lets Docker daemon and cosign trust Harbor TLS |
| `HARBOR_USER` | Harbor registry username |
| `HARBOR_PASSWORD` | Harbor registry password |
| `GITOPS_TOKEN` | GitHub PAT (`repo` scope) for committing to `minicloud-gitops` |
| `GPG_PRIVATE_KEY` | Armored GPG private key for signing gitops commits (key ID `FD6D39D681DEFA34`) |

---

## Tech Radar

The Tech Radar page (`/tech-radar`) is a custom module — it does **not** use `@backstage/plugin-tech-radar` because that package ships a conflicting nested version of `@backstage/frontend-plugin-api` that causes the plugin to be silently dropped at runtime.

The radar data is fetched live from:
```
https://raw.githubusercontent.com/andrelair-platform/minicloud-gitops/main/tech-radar.json
```

To update the radar content, edit [`tech-radar.json`](https://github.com/andrelair-platform/minicloud-gitops/blob/main/tech-radar.json) in `minicloud-gitops` — no image rebuild is needed.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Pod stuck at `0/1` after deploy | Started before PostgreSQL was ready — new backend does not retry | `kubectl delete pod -n backstage -l app.kubernetes.io/name=backstage --force --grace-period=0` |
| `NotImplementedError: apiRef{plugin.search.queryservice}` | A plugin that uses `SidebarSearchModal` is loaded but `@backstage/plugin-search/alpha` is not in `features` | Add `searchPlugin` to the `features` array in `App.tsx` |
| Build fails with `v8::SourceLocation` error | Node 20 — `isolated-vm@6.x` requires Node 22+ | Use Node 22 or later |
| Plugin silently missing at runtime | Nested `frontend-plugin-api` version conflict | Avoid installing `@backstage/plugin-tech-radar` — use the local `modules/tech-radar` instead |
| Harbor push fails in CI | BuildKit container does not inherit `/etc/docker/certs.d/` | The buildkitd config in `ci.yml` sets `insecure = true` for Harbor (traffic is over Tailscale) |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, commit style, and how to propose changes.

---

## License

[MIT](LICENSE) © andrelair-platform
