#!/usr/bin/env bash
# Build, push, and update GitOps manifest for minicloud-backstage.
# Run from any directory — uses the repo root automatically.
#
# Usage:
#   ./scripts/release.sh            # build current HEAD and update gitops
#   ./scripts/release.sh --push-only   # skip build, just update gitops for HEAD sha
#   ./scripts/release.sh --dry-run     # print what would happen, no writes
#
# Prerequisites on Mac:
#   - Tailscale connected (harbor.10.0.0.200.nip.io must be reachable)
#   - crane installed (go install github.com/google/go-containerregistry/cmd/crane@latest)
#   - GPG key FD6D39D681DEFA34 configured (for signed gitops commit)
#   - Docker Desktop running

set -euo pipefail

REGISTRY="harbor.10.0.0.200.nip.io"
IMAGE_REPO="library/backstage"
GITOPS_VALUES="$HOME/Developer/cloudplateform/minicloud-gitops/helm-values/backstage-values.yaml"
BACKSTAGE_REPO="$(cd "$(dirname "$0")/.." && pwd)"

DRY_RUN=false
PUSH_ONLY=false

for arg in "$@"; do
  case $arg in
    --dry-run)   DRY_RUN=true ;;
    --push-only) PUSH_ONLY=true ;;
  esac
done

cd "$BACKSTAGE_REPO"

SHA=$(git rev-parse --short HEAD)
TAG="${SHA}-amd64"
FULL_IMAGE="${REGISTRY}/${IMAGE_REPO}:${TAG}"
TMP_TAR="/tmp/backstage-${SHA}-amd64.tar"

echo "==> backstage release: ${TAG}"
echo "    gitops:  ${GITOPS_VALUES}"
echo "    image:   ${FULL_IMAGE}"
[ "$DRY_RUN" = true ] && echo "    (dry-run — no writes)" && exit 0

# ── 1. Build ────────────────────────────────────────────────────────────────
if [ "$PUSH_ONLY" = false ]; then
  echo ""
  echo "==> [1/4] yarn build-image (amd64)"
  DOCKER_DEFAULT_PLATFORM=linux/amd64 yarn build-image --tag "backstage:${TAG}"
else
  echo ""
  echo "==> [1/4] skipping build (--push-only)"
fi

# ── 2. Push to Harbor via crane ─────────────────────────────────────────────
echo ""
echo "==> [2/4] push to Harbor"
if ! crane version &>/dev/null; then
  echo "ERROR: 'crane' not found. Install: go install github.com/google/go-containerregistry/cmd/crane@latest"
  exit 1
fi

docker save "backstage:${TAG}" -o "${TMP_TAR}"
crane push "${TMP_TAR}" "${FULL_IMAGE}"
rm -f "${TMP_TAR}"
echo "    pushed: ${FULL_IMAGE}"

# ── 3. Update gitops values file ────────────────────────────────────────────
echo ""
echo "==> [3/4] update gitops"
if [ ! -f "$GITOPS_VALUES" ]; then
  echo "ERROR: gitops values file not found: ${GITOPS_VALUES}"
  exit 1
fi

# Replace the tag: line and the comment above it
OLD_TAG_LINE=$(grep '^\s*tag:' "$GITOPS_VALUES" | head -1 | sed 's/[[:space:]]*//')
sed -i.bak \
  -e "s|# git SHA: .* — .*|# git SHA: ${SHA} — built $(date -u '+%Y-%m-%d')|" \
  -e "s|tag: \"[^\"]*-amd64\"|tag: \"${TAG}\"|" \
  "$GITOPS_VALUES"
rm -f "${GITOPS_VALUES}.bak"

echo "    updated: $(grep 'tag:' "$GITOPS_VALUES" | head -1 | xargs)"

# ── 4. Commit gitops change ─────────────────────────────────────────────────
echo ""
echo "==> [4/4] commit gitops"
GITOPS_DIR="$(dirname "$(dirname "$GITOPS_VALUES")")"
cd "$GITOPS_DIR"

if ! git diff --quiet HEAD -- "$GITOPS_VALUES"; then
  git add "$GITOPS_VALUES"
  git -c user.name='AndreLair' \
      -c user.email='andrelaurelyvan.kanmegnetabouguie@ynov.com' \
      commit -S --gpg-sign=FD6D39D681DEFA34 \
      -m "chore(backstage): bump image to ${TAG}"
  git push origin main
  echo "    committed and pushed gitops"
else
  echo "    no gitops change needed (tag already ${TAG})"
fi

echo ""
echo "==> done — ArgoCD will sync backstage to ${TAG}"
