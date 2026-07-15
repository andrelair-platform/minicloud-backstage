# Custom Plugins

## @internal/plugin-minicloud-plane

Adds a **Plane Issues** tab to Backstage entity pages.

**Source:** `plugins/minicloud-plane/` in this repo

**How it works:**
1. Component must have the `plane.io/project-id` annotation in `catalog-info.yaml`
2. The plugin calls the Backstage proxy at `/minicloud-plane`
3. The proxy forwards to `minicloud-plane.minicloud-plane-dev.svc.cluster.local:8080`
4. The minicloud-plane Go service fetches issues from the Plane CE API

**Adding it to a component:**
```yaml
metadata:
  annotations:
    plane.io/project-id: "PT"  # Plane project identifier
```

## vault:policy:create (scaffolder action)

Custom backend action registered in `packages/backend/src/actions/vault.ts`.

When a Software Template runs this step, it:
1. Creates a Vault policy at `sys/policy/<name>` — grants read on `secret/platform/<name>/*`
2. Seeds initial secrets at `secret/data/platform/<name>/config`
3. Creates a Kubernetes auth role at `auth/kubernetes/role/<name>` bound to the service's namespaces

Requires `VAULT_ADDR` and `VAULT_SCAFFOLDER_TOKEN` env vars (set via `backstage-vault-secret` k8s Secret).
