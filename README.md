# minicloud-backstage

Custom [Backstage](https://backstage.io) image for the **andrelair-platform** minicloud Kubernetes platform. Built and deployed automatically via GitHub Actions on every push to `main` — no manual steps required.

## What's inside

This is a fully customised Backstage deployment using the **new frontend system** (`createApp` from `@backstage/frontend-defaults`). All UI extensions are registered as typed `FrontendFeature` objects in `packages/app/src/App.tsx`.

| Feature | Source |
|---|---|
| Software Catalog | `@backstage/plugin-catalog/alpha` |
| API Docs (Swagger UI) | `@backstage/plugin-api-docs/alpha` |
| Kubernetes tab | `@backstage/plugin-kubernetes/alpha` |
| Search | `@backstage/plugin-search/alpha` |
| **Tech Radar** | `packages/app/src/modules/tech-radar/` — custom module, fetches `tech-radar.json` from `minicloud-gitops` |
| **Sidebar** | `packages/app/src/modules/nav/` — custom `NavContentBlueprint`, andrelair-platform branding |
| **OIDC login** | `packages/app/src/modules/auth.tsx` — Authentik via `SignInPageBlueprint` |

### Why a custom Tech Radar module?

`@backstage/plugin-tech-radar@0.7.4` ships a nested `@backstage/frontend-plugin-api@0.6.7` inside its own `node_modules/`. The workspace uses `0.17.2`. The `$type` symbol check in `createApp` operates across module boundaries, so the plugin is silently dropped at runtime despite clean TypeScript compilation. The local module imports `createFrontendPlugin` and `PageBlueprint` directly from the workspace package and avoids the conflict entirely.

## Stack

| Component | Detail |
|---|---|
| Backstage | 1.52.0 (new frontend system) |
| Node runtime | `node:24-trixie-slim` |
| Registry | `harbor.10.0.0.200.nip.io/library/backstage` |
| Auth | Authentik OIDC (`auth.devandre.sbs`) |
| Database | PostgreSQL (Bitnami subchart, Longhorn PVC) |
| GitOps | ArgoCD via `minicloud-gitops/helm-values/backstage-values.yaml` |
| Live URL | `https://backstage.devandre.sbs` (Cloudflare Tunnel) |

## CI / CD

Push to `main` → `.github/workflows/ci.yml`:

1. Join the minicloud Tailscale tailnet (reaches `harbor.10.0.0.200.nip.io` directly — bypasses Cloudflare 100 MB upload limit)
2. `yarn install --immutable` + `yarn tsc` + `yarn build:backend` on Node 22
3. Docker build → push to Harbor as `library/backstage:<sha>-amd64`
4. Trivy CRITICAL CVE scan
5. Cosign keyless sign (GitHub OIDC → Sigstore Fulcio)
6. GPG-signed commit to `minicloud-gitops` bumping `helm-values/backstage-values.yaml`
7. ArgoCD auto-syncs → new pod rolls out via `Recreate` strategy

**Required GHA secrets:**

| Secret | Purpose |
|---|---|
| `TAILSCALE_AUTH_KEY` | Ephemeral Tailscale auth key for the runner |
| `MINICLOUD_CA_CERT` | minicloud self-signed CA (PEM) so Docker and cosign trust Harbor TLS |
| `HARBOR_USER` | Harbor username |
| `HARBOR_PASSWORD` | Harbor password |
| `GITOPS_TOKEN` | PAT with `repo` scope on `minicloud-gitops` |
| `GPG_PRIVATE_KEY` | Armored GPG private key (`FD6D39D681DEFA34`) for signed gitops commits |

## Local development

Requires Node 22+ (for `isolated-vm@6.x`).

```bash
yarn install

# TypeScript check
yarn tsc

# Build backend bundle
yarn build:backend

# Frontend dev server with hot reload (uses app-config.yaml)
yarn start
```

Production config is injected by the Helm chart's `appConfig` values block and the `backstage-session-config` ConfigMap in the `backstage` namespace — `app-config.yaml` is only used locally.

## Source layout

```
packages/
  app/
    src/
      App.tsx                          # createApp — registers all features
      modules/
        auth.tsx                       # SignInPageBlueprint (Authentik OIDC)
        nav/
          Sidebar.tsx                  # NavContentBlueprint — sidebar layout + Tech Radar link
          SidebarLogo.tsx              # andrelair-platform branding
        tech-radar/
          index.tsx                    # createFrontendPlugin at /tech-radar
          TechRadarPage.tsx            # Fetches tech-radar.json, renders 4-quadrant grid
  backend/
    src/
      index.ts                         # Standard Backstage backend entry point
      plugins/                         # Backend plugin wiring
```

## Tech Radar data

The radar reads [`tech-radar.json`](https://github.com/andrelair-platform/minicloud-gitops/blob/main/tech-radar.json) from the root of `minicloud-gitops` at runtime. Update that file to change the radar content — no image rebuild needed.

The backend CSP allows browser `fetch()` to GitHub:

```yaml
backend:
  csp:
    connect-src: ["'self'", 'https://raw.githubusercontent.com']
```

## Key configuration

**Session secret** — injected via `extraAppConfig` referencing ConfigMap `backstage-session-config` in the `backstage` namespace. The key is `auth.session.secret` (not `backend.session.secret`).

**minicloud CA trust** — `NODE_EXTRA_CA_CERTS=/ca/ca.crt`; the cert is mounted from ConfigMap `minicloud-ca`. Required for the backend to verify Authentik's TLS cert when exchanging OIDC tokens in-cluster.

**OIDC provider** — `auth.providers.oidc.production` in `backstage-values.yaml`. The sign-in page is registered via `SignInPageBlueprint.make` in `packages/app/src/modules/auth.tsx`.

## Known gotchas

- **`isolated-vm@6.x` requires Node 22+** — uses `v8::SourceLocation` not present in Node 20. CI runs Node 22; the runtime image is Node 24 (compatible).
- **BuildKit does not inherit `/etc/docker/certs.d/`** — buildkitd config sets `insecure = true` for Harbor. Safe: traffic is over Tailscale.
- **`Recreate` strategy** — rolling updates exceed the namespace quota (2 CPU / 2 Gi) when two pods run simultaneously. `strategy.type: Recreate` avoids the deadlock.
- **Pod restart after DB unavailability** — the new backend does not retry DB connections after startup failure. Force-delete the pod to reset: `kubectl delete pod -n backstage -l app.kubernetes.io/name=backstage --force --grace-period=0`.
- **PostgreSQL subchart image** — uses `docker.io/bitnamilegacy/postgresql` (Bitnami chart migration #35164).
- **`nav.rest()` does not pick up custom plugins** — only built-in `@backstage/*` plugins auto-register in `navItems`. Custom `createFrontendPlugin` entries require an explicit `<SidebarItem>` in `Sidebar.tsx`.
- **Search plugin must be in `features`** — `SidebarSearchModal` uses `apiRef{plugin.search.queryservice}` at render time. Without `@backstage/plugin-search/alpha` in the `features` array, every page throws `NotImplementedError`.
