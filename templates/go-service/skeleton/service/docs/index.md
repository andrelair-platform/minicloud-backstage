# ${{ values.name }}

${{ values.description }}

## Overview

This service was scaffolded using the minicloud Go Service golden-path template.

## Endpoints

| Path | Method | Description |
|---|---|---|
| `/healthz` | GET | Liveness probe |
| `/readyz` | GET | Readiness probe |

## Deployment

Deployed via ArgoCD from `minicloud-gitops/services/${{ values.name }}/`.

| Overlay | Namespace | Sync |
|---|---|---|
| dev | `${{ values.name }}-dev` | Automatic on push to `dev` branch |
| staging | `${{ values.name }}-staging` | Manual PR to promote |
| prod | `${{ values.name }}-prod` | Manual PR to promote |

## Secrets

Secrets are stored in Vault at `secret/platform/${{ values.name }}/` and injected by the Vault Agent sidecar.
