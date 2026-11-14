# ${{ values.name }} — deployment

> ${{ values.description }}
>
> This directory is **deployment config only** (Helm wrapper chart + ArgoCD apps). The application
> **source** lives in its own repo (`conventions.md`): CI builds the image, Kargo/ArgoCD deploy it.

Scaffolded by the Backstage **wrapper-service** template on the Helm golden path:
`helm/` depends on the `minicloud-app-deployment` library chart; `values-dev.yaml` / `values-prod.yaml`
are the two env overlays consumed by `apps/is/${{ values.appGroup }}/${{ values.name }}-{dev,prod}.yaml`.

| | dev | prod |
|---|---|---|
| namespace | `${{ values.devNamespace }}` | `${{ values.prodNamespace }}` |
| image | `harbor.10.0.0.200.nip.io/library/${{ values.imageRepo }}` | `ghcr.io/andrelair-platform/${{ values.imageRepo }}` |
| host | `${{ values.name }}.10.0.0.200.nip.io` | `${{ values.name }}-prod.10.0.0.200.nip.io` |
| replicas | 1 | 2 |

## Finish wiring (before the apps go green)

1. **Chart.lock** — ✅ **automatic, no action.** The `helm-chart-lock` CI workflow generates it on this PR
   and commits it back to the branch (ArgoCD's `helm dependency build` needs it). No local
   `helm dependency update`.
2. **Namespaces** — ✅ **automatic, no action.** The `minicloud-platform` AppProject allow-lists every
   non-system namespace, so `${{ values.devNamespace }}` and `${{ values.prodNamespace }}` are already
   permitted (`CreateNamespace=true` creates them on first sync).
3. **Build + push the first image** from the source repo, then set `image.tag` in `values-dev.yaml`
   (and `values-prod.yaml` once promoted). Keep `tag:` **block-style** — Kargo can't rewrite a flow map.
4. **Wire Kargo** once the first ghcr image exists — run the **kargo-wiring** golden-path template
   (Backstage → Create → *"Promotion — Kargo dev→prod pipeline"*) with `name = ${{ values.name }}`. It
   scaffolds `services/${{ values.name }}/kargo/` (pick the image vs git Warehouse model) and the
   `kargo-projects` ApplicationSet picks it up. Until then, promote dev→prod by a manual
   (CODEOWNERS-gated) prod `image.tag` PR.
{% if values.needsSecret %}
5. **Create the app secret in Vault** — every key becomes an env var via `envFrom`:
   ```bash
   vault kv put secret/platform/${{ values.name }} SOME_KEY=value ANOTHER=value
   ```
   (ESO renders `${{ values.name }}-secret`; the apps already carry the ESO SSA `ignoreDifferences`.)
{% endif %}{% if values.needsDb %}
6. **Set the DB role password in Vault** (CNPG creates role `${{ values.name }}` from it):
   ```bash
   vault kv patch secret/platform/${{ values.name }} db-password="$(openssl rand -base64 24)"
   ```
   The app connects to host `${{ values.name }}-cnpg-rw`, database `${{ values.name }}`, user
   `${{ values.name }}`. Wire those into the app's config (plain env for host/db; password via the
   `${{ values.name }}-cnpg-role` secret or your app secret). CNPG reconciles the role **after** initdb,
   so any object GRANTs beyond the owner are a one-time manual step.
{% endif %}{% if values.needsSSO %}
7. **Authentik SSO (forward-auth)** — the nginx forward-auth annotations are **already scaffolded** in
   `values.yaml` (gated by needsSSO). The only step left is to provision the matching Authentik proxy
   provider ONCE, from the controller (gates access to the **${{ values.ssoGroup }}** group; non-members → 403):
   ```bash
   ssh controller "~/minicloud-ops/scripts/authentik/ensure-groups.sh '${{ values.ssoGroup }}'"
   ssh controller "~/minicloud-ops/scripts/authentik/forward-auth-provider.sh ${{ values.name }} ${{ values.name }}.10.0.0.200.nip.io '${{ values.ssoGroup }}'"
   ```
   Then open the dev host → redirected to Authentik → log in → back, authenticated. See `[[feedback_public_sso_app_forwardauth]]`.
{% endif %}

## Verify
```bash
cd services/${{ values.name }}/helm && helm dependency build && helm template ${{ values.name }} . -f values-dev.yaml
```
