# Functional Requirements — AI Software Factory

Status: Draft
Last Updated: 2026-06-07

## FR-001 — Context Assembly

Type: Functional
Priority: Must Have
Status: Draft

### Description

The system must automatically assemble a task-specific context package before invoking any agent.

### Acceptance Criteria

- Context includes global standards, relevant ADRs, current architecture, and task-scoped requirements
- Context package size is capped to prevent window waste
- `global-known-problems` is always included for implementation and debug tasks

---

## FR-002 — Fact and Session Separation

Type: Functional
Priority: Must Have
Status: Draft

### Description

Authoritative knowledge (approved ADRs, accepted requirements, finalized architecture) must be stored separately from exploratory session content.

### Acceptance Criteria

- `{project}-facts` contains only approved, authoritative content
- `{project}-sessions` contains exploratory and conversational content
- No draft or exploratory content is ingested into facts

---

## FR-003 — Verification Before Implementation

Type: Functional
Priority: Must Have
Status: Draft

### Description

A Verification Agent must run after the Architect and before Implementation on all feature work.

### Acceptance Criteria

- Verification checks: requirement coverage, ADR conflicts, security compliance, standards compliance, dependency impact
- Blocking issues stop implementation until resolved
- Verification report includes Confidence Report

## Related

- [[Business Requirements]]
- [[Non-Functional Requirements]]
