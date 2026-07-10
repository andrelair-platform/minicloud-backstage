# Contributing to minicloud-backstage

Thank you for your interest in improving the platform. This document covers everything you need to contribute effectively.

## Table of Contents

- [Branch Strategy](#branch-strategy)
- [Commit Style](#commit-style)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)

---

## Branch Strategy

| Branch | Protection | CI behaviour |
|---|---|---|
| `main` | PR required · GPG-signed commits · no force-push | Builds image, signs with Cosign, bumps gitops manifest |
| `staging` | PR required · no force-push | Builds `staging-<sha>` image, Cosign-signed, no gitops update |
| `dev` | Open (direct push allowed) | Builds `dev-<sha>` image, no signing |

Work in a feature branch off `dev` → merge to `dev` → promote to `staging` → promote to `main`.

---

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructuring without behaviour change |
| `ci` | Changes to CI workflows |
| `chore` | Dependency updates, config tweaks |

**Examples:**
```
feat(tech-radar): add quadrant descriptions to radar entries
fix(sidebar): explicitly add SidebarItem for custom plugin routes
docs(readme): update CI secrets table
```

All commits to `main` must be GPG-signed. Configure signing locally:

```bash
git config user.signingkey FD6D39D681DEFA34
git config commit.gpgsign true
```

---

## Development Workflow

### Prerequisites

- Node.js ≥ 22 (`isolated-vm@6.x` requires Node 22+ — Node 20 will fail)
- Yarn v4 (managed by `.yarnrc.yml` — run `yarn --version` to confirm)

### Setup

```bash
git clone https://github.com/andrelair-platform/minicloud-backstage.git
cd minicloud-backstage
yarn install
```

### Local dev server

```bash
yarn start        # frontend hot-reload at http://localhost:3000
```

The local server uses `app-config.yaml`. It does not connect to the live Authentik instance or Harbor registry.

### Type checking

```bash
yarn tsc          # must pass before opening a PR
```

### Backend build

```bash
yarn build:backend   # compiles to packages/backend/dist/
```

---

## Pull Request Process

1. **Open a PR against `staging`** (or `dev` for draft/WIP work)
2. Ensure `yarn tsc` passes — CI will fail otherwise
3. Describe what changed and why in the PR description
4. Reference any related issues with `Closes #<number>`
5. A maintainer will review and merge; CI handles the rest

**Do not open PRs directly against `main`** unless you are promoting from `staging` after a successful staging build.

---

## Code Standards

- **TypeScript strict mode** — no `any` unless explicitly justified in a comment
- **No `Co-Authored-By` lines** in commits — all work is attributed to the committing author
- **No secrets in code** — all credentials go through ESO + Vault, injected at runtime via Kubernetes Secrets
- **Custom modules over npm plugins** when the npm package introduces a nested `@backstage/frontend-plugin-api` version conflict — see the Tech Radar module as the reference pattern
- **Explicit `SidebarItem` entries** for any custom `createFrontendPlugin` route — `nav.rest()` only picks up built-in `@backstage/*` plugins automatically
