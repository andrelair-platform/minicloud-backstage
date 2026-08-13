---
id: S001-setup
title: "${{ values.project_code }} — Spring Boot scaffold, Maven/Gradle, CI skeleton"
status: Ready
type: Story
epic: ${{ values.project_code }}
milestone: "${{ values.milestone_title }}"
estimate: 2
labels: [java, ci, backend, ${{ values.project_code }}]
priority: Must
assignee: AndreLiar
---

## Story

As a **Tech Lead**, I want a production-ready Spring Boot scaffold so that all subsequent stories start from a consistent, CI-enforced baseline.

## Background

_Fill in: which service is this? what does it do? reference to CdCF or architecture doc._

## Acceptance Criteria

- [ ] AC-1: `./mvnw verify` (or `./gradlew build`) succeeds on a fresh clone
- [ ] AC-2: `mvn checkstyle:check` exits 0 (Google Java Style Guide)
- [ ] AC-3: `mvn test` runs all unit tests and exits 0
- [ ] AC-4: `mvn package` produces a fat JAR; Docker multi-stage image builds successfully
- [ ] AC-5: GitHub Actions CI: checkstyle → test → build image → push Harbor
- [ ] AC-6: `catalog-info.yaml` at repo root (Backstage entity, type=service)
- [ ] AC-7: `GET /actuator/health` returns `{"status":"UP"}` with 200

## Technical Notes

- Spring Boot 3.x + Java 21 (LTS)
- Build: Maven wrapper (`./mvnw`) — no global Maven required
- Base image: `eclipse-temurin:21-jre-alpine` → distroless alternative: `gcr.io/distroless/java21-debian12`
- Spring profiles: `dev` (H2 in-memory) · `prod` (PostgreSQL via env vars)
- Actuator: expose `health`, `info`, `metrics` only

## Definition of Done

- [ ] All ACs met
- [ ] checkstyle + SpotBugs passing
- [ ] L1: smoke test — context loads, `/actuator/health` returns UP
- [ ] PR merged to `staging`

## Tasks

- [ ] TASK-1: `spring initializr` with Web + Actuator + Data JPA + Flyway + Validation
- [ ] TASK-2: Configure checkstyle (`google_checks.xml`)
- [ ] TASK-3: Write multi-stage `Dockerfile`
- [ ] TASK-4: Copy + adapt CI workflow
- [ ] TASK-5: Write `catalog-info.yaml`

## Dependencies

- Depends on: none
- Blocks: all other stories in this sprint
