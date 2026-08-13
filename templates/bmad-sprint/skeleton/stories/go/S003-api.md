---
id: S003-rest-api
title: "${{ values.project_code }} — REST API endpoints + OpenAPI 3.1 spec"
status: Draft
type: Story
epic: ${{ values.project_code }}
milestone: "${{ values.milestone_title }}"
estimate: 5
labels: [go, api, openapi, ${{ values.project_code }}]
priority: Must
assignee: AndreLiar
---

## Story

As a **consumer service**, I want REST API endpoints with a published OpenAPI spec so that I can integrate against a stable, documented contract.

## Background

_Fill in: which endpoints? What resources? Reference CdCF functional requirements._

## Acceptance Criteria

- [ ] AC-1: `POST /<resource>` — creates resource, returns 201
- [ ] AC-2: `GET /<resource>/:id` — returns full resource; 404 if not found
- [ ] AC-3: `GET /<resource>?<filters>` — paginated list
- [ ] AC-4: `PUT /<resource>/:id` — updates mutable fields
- [ ] AC-5: `DELETE /<resource>/:id` — soft delete or 409 if in wrong state
- [ ] AC-6: OpenAPI 3.1 spec at `api/openapi.yaml` — validated with `vacuum lint`, 0 errors
- [ ] AC-7: `GET /healthz` returns `{"status":"ok","version":"<sha>"}` with 200

## Technical Notes

- Router: `go-chi/chi/v5`
- Error responses: RFC 7807 Problem Details (`application/problem+json`)
- Pagination: cursor-based on `created_at DESC + id` (no OFFSET)
- Spec-first: write `api/openapi.yaml` before handler code

## Definition of Done

- [ ] Code implements all ACs
- [ ] L0: golangci-lint passes
- [ ] L1: handler tests with `net/http/httptest` (happy path + 4xx per endpoint)
- [ ] `vacuum lint api/openapi.yaml` exits 0
- [ ] PR merged to `staging`

## Tasks

- [ ] TASK-1: Write `api/openapi.yaml`
- [ ] TASK-2: Write handlers in `internal/api/handlers/`
- [ ] TASK-3: Write domain service layer in `internal/domain/service.go`
- [ ] TASK-4: Wire router in `cmd/server/server.go`
- [ ] TASK-5: Write handler unit tests
- [ ] TASK-6: Run `vacuum lint` and fix warnings

## Dependencies

- Depends on: S001, S002
- Blocks: auth middleware, integration tests, k8s manifests
