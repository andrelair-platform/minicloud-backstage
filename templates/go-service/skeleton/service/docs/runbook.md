# Runbook

## Checking service health

```bash
kubectl get pods -n ${{ values.name }}-dev
kubectl logs -n ${{ values.name }}-dev deploy/${{ values.name }}
```

## Promoting to staging

1. Update `overlays/staging/kustomization.yaml` with the new image tag
2. Open a PR on `minicloud-gitops` targeting `main`
3. Merge → ArgoCD syncs `${{ values.name }}-staging` namespace

## Vault secrets

View current secrets:
```bash
vault kv get secret/platform/${{ values.name }}/config
```

Update a secret:
```bash
vault kv patch secret/platform/${{ values.name }}/config key=value
kubectl rollout restart deploy/${{ values.name }} -n ${{ values.name }}-dev
```

## Rollback

```bash
# Roll back to previous image tag in GitOps:
cd minicloud-gitops
kustomize edit set image harbor.10.0.0.200.nip.io/library/${{ values.name }}:<previous-sha>-amd64
git commit -S -m "rollback: revert ${{ values.name }} to <previous-sha>"
git push origin main
```
