# minicloud-backstage

minicloud's internal developer portal built on Backstage. Provides software catalog, TechDocs, Software Templates (golden-path scaffolding), and integrations with the full minicloud platform.

## What's running

| Plugin | What it does |
|---|---|
| Software Catalog | Tracks all 19 components across the platform |
| Kubernetes | Live pod/deployment status per component |
| ArgoCD | GitOps sync state per application |
| TechDocs | This documentation system |
| Software Templates | Scaffold new Go services or custom images in one click |
| Plane Issues | Shows linked Plane CE issues per component |
| Tech Radar | Platform technology radar |
| Search | Full-text search across catalog + TechDocs |

## Architecture

The image is built from this repo and pushed to `harbor.10.0.0.200.nip.io/library/backstage`.
Production config lives entirely in `minicloud-gitops/helm-values/backstage-values.yaml` — the `app-config.yaml` in this repo is local dev only.

## Authentication

All access goes through Authentik OIDC (provider: `minicloud-backstage`). The `prompt: login` flag ensures users always re-authenticate rather than relying on a stale SSO session.

## Custom plugins

- `@internal/plugin-minicloud-plane` — Plane CE issues tab on the entity page
