---
id: S002-domain-model
title: "${{ values.project_code }} — domain model + data schema"
status: Draft
type: Story
epic: ${{ values.project_code }}
milestone: "${{ values.milestone_title }}"
estimate: 3
labels: [database, domain-logic, ${{ values.project_code }}]
priority: Must
assignee: AndreLiar
---

## Story

As a **Backend Developer**, I want the core domain entities defined with a database schema so that all other stories have a stable data contract to build on.

## Background

_Fill in: what are the main domain entities? Reference CdCF §9 (data model)._

## Acceptance Criteria

- [ ] AC-1: _Primary entity: define fields, types, constraints_
- [ ] AC-2: Migration/schema file runs cleanly on a fresh database
- [ ] AC-3: Repository interface defined — no direct DB calls in handlers
- [ ] AC-4: _Any domain validation rules_

## Technical Notes

_Fill in: table names, column types, indexes, FK constraints, any JSON/JSONB fields._

## Definition of Done

- [ ] Code implements all ACs
- [ ] L0: linter passes
- [ ] L1: unit tests for domain validation
- [ ] PR merged to `staging`

## Tasks

- [ ] TASK-1: Define domain entities/structs/classes
- [ ] TASK-2: Write migration file (V1__init_schema.sql or Flyway equivalent)
- [ ] TASK-3: Write repository interface
- [ ] TASK-4: Write repository implementation
- [ ] TASK-5: Write unit tests

## Dependencies

- Depends on: S001
- Blocks: S003 (API uses domain)
