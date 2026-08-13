---
id: S001-setup
title: "${{ values.project_code }} — Python scaffold, ruff, pytest, CI skeleton"
status: Ready
type: Story
epic: ${{ values.project_code }}
milestone: "${{ values.milestone_title }}"
estimate: 2
labels: [python, ci, backend, ${{ values.project_code }}]
priority: Must
assignee: AndreLiar
---

## Story

As a **Tech Lead**, I want a production-ready Python scaffold so that all subsequent stories start from a consistent, CI-enforced baseline.

## Background

_Fill in: which service is this? what does it do? reference to CdCF or architecture doc._

## Acceptance Criteria

- [ ] AC-1: `pip install -r requirements.txt && python -m pytest` exits 0 on a fresh clone
- [ ] AC-2: `make lint` runs `ruff check . && ruff format --check .` and exits 0
- [ ] AC-3: `make test-cov` runs pytest with `--cov --cov-fail-under=70`
- [ ] AC-4: Multi-stage Docker image builds successfully (builder → python:3.12-slim)
- [ ] AC-5: GitHub Actions CI: ruff → mypy → pytest --cov → build image → push Harbor
- [ ] AC-6: `catalog-info.yaml` at repo root (Backstage entity, type=service)
- [ ] AC-7: `GET /healthz` returns `{"status":"ok"}` with 200

## Technical Notes

- Python 3.12 + FastAPI or Flask (decide based on async needs)
- Dependency management: `requirements.txt` + `requirements-test.txt`
- Type checking: `mypy --strict` on `src/` package
- Linting: `ruff` (replaces flake8 + isort + black)
- Test layout: `tests/unit/`, `tests/integration/`, `tests/fixtures/`

## Definition of Done

- [ ] All ACs met
- [ ] ruff + mypy passing in CI
- [ ] L1: smoke test — app starts, `/healthz` returns 200
- [ ] PR merged to `staging`

## Tasks

- [ ] TASK-1: Initialise project structure (`src/`, `tests/`, `Makefile`)
- [ ] TASK-2: Configure `ruff.toml` and `mypy.ini`
- [ ] TASK-3: Write multi-stage `Dockerfile`
- [ ] TASK-4: Copy + adapt CI workflow from minicloud-erpnext
- [ ] TASK-5: Write `catalog-info.yaml`

## Dependencies

- Depends on: none
- Blocks: all other stories in this sprint
