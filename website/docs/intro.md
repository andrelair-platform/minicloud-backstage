---
id: intro
title: Overview
sidebar_label: Overview
slug: /
---

# minicloud Backstage

Custom **Backstage Internal Developer Portal** image for the minicloud platform — pre-configured with Authentik OIDC, Harbor registry integration, ArgoCD status panels, and golden-path Go service scaffolding templates.

## Responsibility

| In scope | Out of scope |
|---|---|
| Custom Backstage Docker image (minicloud CA cert baked in) | Production config (minicloud-gitops `backstage-values.yaml`) |
| Software catalog — all platform services | ArgoCD sync (managed by ArgoCD itself) |
| Scaffolder templates — Go service golden path | OIDC provider config (Authentik) |
| BMAD Sprint scaffolder template | |

## Stack

| Concern | Choice |
|---|---|
| Language | TypeScript (Node.js 20) |
| Framework | Backstage 1.39.x |
| Auth | Authentik OIDC (provider pk=8) |
| Container | harbor.10.0.0.200.nip.io/library/backstage |
| Config (prod) | ConfigMap `backstage-app-config` in `backstage` ns |

## Templates

| Template | Output |
|---|---|
| New Go Service | Scaffolds repo, CI workflow, GitOps overlay, `catalog-info.yaml` |
| New BMAD Sprint | Scaffolds story directory + opens PR on minicloud-gitops |

## Key plugins

| Plugin | Purpose |
|---|---|
| `@backstage/plugin-catalog` | Software catalog |
| `@backstage/plugin-scaffolder` | Golden-path templates |
| `@backstage/plugin-argocd` | ArgoCD app status in catalog |
| `@backstage/plugin-kubernetes` | k8s resource view per service |
| `@backstage/plugin-techdocs` | In-portal TechDocs rendering |

## Links

- [GitHub repository](https://github.com/andrelair-platform/minicloud-backstage)
- [Live portal](https://backstage.devandre.sbs)
- [Platform documentation](https://andrelair-platform.github.io/minicloud-platform-docs/)
