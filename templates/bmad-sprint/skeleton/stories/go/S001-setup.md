---
id: S001-setup
title: "${{ values.project_code }} — Go module scaffold, Makefile, CI skeleton"
status: Ready
type: Story
epic: ${{ values.project_code }}
milestone: "${{ values.milestone_title }}"
estimate: 2
labels: [go, ci, backend, ${{ values.project_code }}]
priority: Must
assignee: AndreLiar
---

## Story

As a **Tech Lead**, I want a production-ready Go project scaffold so that all subsequent stories start from a consistent, CI-enforced baseline.

## Background

_Fill in: which service is this? what does it do? reference to CdCF or architecture doc._

## Acceptance Criteria

- [ ] AC-1: `go build ./...` succeeds on a fresh clone (no local tools required beyond Go 1.23+)
- [ ] AC-2: `make lint` runs `golangci-lint run ./...` and exits 0
- [ ] AC-3: `make test` runs `go test ./... -count=1 -race` and exits 0
- [ ] AC-4: `make build` produces a distroless binary image (multi-stage Containerfile)
- [ ] AC-5: GitHub Actions CI job runs on every push: lint → test → build
- [ ] AC-6: `catalog-info.yaml` present at repo root (Backstage entity, type=service)

## Technical Notes

- Repo: `github.com/andrelair-platform/${{ values.project_code }}`
- Module path: `github.com/andrelair-platform/${{ values.project_code }}`
- Router: `go-chi/chi/v5`
- Base image: `gcr.io/distroless/static-debian12:nonroot`
- Copy CI workflow from `minicloud-plane/.github/workflows/ci.yml`, update image name + registry path

## Definition of Done

- [ ] Code implements all ACs
- [ ] `golangci-lint` `.golangci.yml` present (errcheck, govet, staticcheck, revive)
- [ ] L1: smoke test — server starts, `/healthz` returns 200
- [ ] PR merged to `staging`

## Tasks

- [ ] TASK-1: `gh repo create andrelair-platform/${{ values.project_code }} --public`
- [ ] TASK-2: `go mod init github.com/andrelair-platform/${{ values.project_code }}`
- [ ] TASK-3: Create directory layout (`cmd/`, `internal/`, `api/`, `migrations/`, `tests/`)
- [ ] TASK-4: Write `.golangci.yml`, `Makefile`, `.gitignore`
- [ ] TASK-5: Write multi-stage `Containerfile` (build → distroless)
- [ ] TASK-6: Copy + adapt CI workflow from minicloud-plane
- [ ] TASK-7: Write `catalog-info.yaml`

## Dependencies

- Depends on: none
- Blocks: all other stories in this sprint
