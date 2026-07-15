# Architecture

## Image build

```
main branch push
  → yarn build:backend
  → Docker multi-stage build (node:24-trixie-slim)
  → Trivy CRITICAL scan
  → Cosign sign
  → syft SBOM
  → bump backstage-values.yaml tag
  → ArgoCD auto-sync → pod restart
```

## Configuration

Production config is a single `app-config.yaml` ConfigMap rendered from:

```
minicloud-gitops/helm-values/backstage-values.yaml → backstage.appConfig section
```

Secrets are injected as environment variables from:
- `backstage-phase24-secret` — OIDC, K8s SA token, ArgoCD creds
- `backstage-github-secret` — GitHub token for scaffolder
- `backstage-vault-secret` — Vault token for vault:policy:create scaffolder action
- `backstage-session-config` — session secret

## Backend plugins

| Plugin | Purpose |
|---|---|
| `plugin-app-backend` | Serves the compiled frontend |
| `plugin-catalog-backend` | Manages the software catalog |
| `plugin-scaffolder-backend` | Runs Software Template steps |
| `plugin-techdocs-backend` | Builds and serves TechDocs |
| `plugin-kubernetes-backend` | Fetches pod/deploy status |
| `plugin-auth-backend` | Handles OIDC session |
| `plugin-search-backend` | Full-text search |
| `backstage-plugin-argo-cd-backend` | ArgoCD sync status |
| `plugin-notifications-backend` | In-platform notifications |
| Custom `vault-actions` module | `vault:policy:create` scaffolder action |
