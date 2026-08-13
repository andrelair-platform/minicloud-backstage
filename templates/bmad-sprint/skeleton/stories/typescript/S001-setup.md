---
id: S001-setup
title: "${{ values.project_code }} — TypeScript scaffold, eslint, vitest, CI skeleton"
status: Ready
type: Story
epic: ${{ values.project_code }}
milestone: "${{ values.milestone_title }}"
estimate: 2
labels: [typescript, ci, frontend, ${{ values.project_code }}]
priority: Must
assignee: AndreLiar
---

## Story

As a **Tech Lead**, I want a production-ready TypeScript scaffold so that all subsequent stories start from a consistent, CI-enforced baseline.

## Background

_Fill in: which service is this? what does it do? reference to CdCF or architecture doc._

## Acceptance Criteria

- [ ] AC-1: `npm ci && npm test` exits 0 on a fresh clone
- [ ] AC-2: `npm run lint` runs eslint + tsc type-check and exits 0
- [ ] AC-3: `npm run test:cov` runs vitest with coverage ≥ 70% on `src/`
- [ ] AC-4: `npm run build` produces a production bundle (no type errors)
- [ ] AC-5: GitHub Actions CI: lint → typecheck → test:cov → build
- [ ] AC-6: `catalog-info.yaml` at repo root (Backstage entity, type=service or website)

## Technical Notes

- Node 22 LTS
- Framework: Next.js 15 (full-stack) or Fastify (API-only) — decide based on project type
- Linting: `eslint` + `@typescript-eslint/eslint-plugin` (strict config)
- Testing: `vitest` for unit/integration · `playwright` for E2E (L4)
- Build: `tsc --noEmit` for type check + bundler (Vite or Next.js)

## Definition of Done

- [ ] All ACs met
- [ ] eslint + tsc passing in CI
- [ ] L1: smoke test — app starts, renders without error
- [ ] PR merged to `staging`

## Tasks

- [ ] TASK-1: Initialise project (`npm create next-app` or `npm init fastify`)
- [ ] TASK-2: Configure `eslint.config.ts` with strict TypeScript rules
- [ ] TASK-3: Configure `vitest.config.ts` with coverage threshold
- [ ] TASK-4: Copy + adapt CI workflow
- [ ] TASK-5: Write `catalog-info.yaml`

## Dependencies

- Depends on: none
- Blocks: all other stories in this sprint
