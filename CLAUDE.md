# minicloud-backstage — Claude Code Context

## Critical: Where the production config actually lives

**`app-config.yaml` in this repo is LOCAL DEV ONLY. It is never loaded in production.**

The Helm chart (from `minicloud-gitops`) overrides the Dockerfile CMD, stripping the
`--config app-config.yaml --config app-config.production.yaml` flags. Instead it passes
the ConfigMap it builds from `backstage-values.yaml`. `app-config.yaml` is copied into
the image but never read at runtime.

**Production config (the only file that matters in prod):**
```
minicloud-gitops/helm-values/backstage-values.yaml  →  appConfig section
```

This file is rendered into ConfigMap `backstage-app-config` in the `backstage` namespace.

**To add a catalog location, proxy endpoint, or any runtime config:**
1. Edit `minicloud-gitops/helm-values/backstage-values.yaml`
2. `git commit && git push origin main`
3. ArgoCD auto-syncs the ConfigMap within ~30s
4. `kubectl rollout restart deployment/backstage -n backstage`

Do NOT edit `app-config.yaml` or the now-deleted `app-config.production.yaml` for
anything that needs to work in production.

---

## What this repo contains

| Path | Purpose |
|---|---|
| `packages/app/src/App.tsx` | Plugin registration (`features: [...]`) |
| `packages/app/src/modules/auth.tsx` | Authentik OIDC wiring |
| `packages/app/src/modules/nav/Sidebar.tsx` | Sidebar layout |
| `packages/app/src/modules/tech-radar/` | Tech Radar page |
| `plugins/minicloud-plane/` | Local plugin — Plane Issues tab |
| `app-config.yaml` | Local dev only (never loaded in prod) |
| `packages/backend/` | Backend plugins (standard Backstage) |

## Local dev

```bash
yarn install
yarn start   # frontend at localhost:3000 + backend at localhost:7007

# Port-forward minicloud-plane if you want the Plane tab to work locally:
kubectl --context minicloud port-forward -n minicloud-plane-dev svc/minicloud-plane 8080:8080
```

## Adding a new catalog location (production)

```yaml
# minicloud-gitops/helm-values/backstage-values.yaml
backstage:
  appConfig:
    catalog:
      locations:
        - type: url
          target: https://raw.githubusercontent.com/andrelair-platform/<repo>/main/catalog-info.yaml
```

## Adding a new proxy endpoint (production)

```yaml
# minicloud-gitops/helm-values/backstage-values.yaml
backstage:
  appConfig:
    proxy:
      endpoints:
        '/my-service':
          target: 'http://my-service.my-namespace.svc.cluster.local:8080'
          changeOrigin: true
```

## Adding a new frontend plugin

1. Create `plugins/<name>/` with `package.json`, `src/index.ts`, `src/plugin.ts`
2. Add `"@internal/plugin-<name>": "*"` to `packages/app/package.json`
3. Import and add to `features: [...]` in `packages/app/src/App.tsx`
4. `yarn install` to link the workspace package
5. Push to `main` → CI builds new image → gitops bump → ArgoCD deploys

## CI

Push to `main` → yarn build → Docker build → Trivy → Cosign sign → bump
`minicloud-gitops/helm-values/backstage-values.yaml` image tag (GPG-signed commit).
