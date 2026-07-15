# ${{ values.name }}

${{ values.description }}

## What this image does

This is a custom image that extends `${{ values.upstreamImage }}` with minicloud-specific additions:

- minicloud CA certificate baked in (so internal HTTPS works)
- Any other platform-specific customisations

## Deployment

The image is deployed as a manifest (not Kustomize overlays) in `minicloud-gitops/manifests/${{ values.name }}/`.

## Image registry

`harbor.10.0.0.200.nip.io/library/${{ values.name }}`

Built and signed automatically by the CI pipeline on every push to `main`.
