---
type: Requirement
phase: 3
status: Approved
authority: facts
chroma_collection: ai-software-factory-facts
tags: [requirement, functional]
related: [ADR-ARCH-001, ADR-DATA-001, Coding Standards]
last_updated: 2026-06-07
---

# Functional Requirements — AI Software Factory

Status: Approved
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

## Related ADRs

### FR-001 — Context Assembly
Implemented by:
- [[../../../07-Decisions/ADR-ARCH-001|ADR-ARCH-001]] — Knowledge-First Pipeline (Phase 2 context assembly)
- [[../../../07-Decisions/ADR-DATA-001|ADR-DATA-001]] — Chroma Collection Schema (retrieval of relevant facts)

### FR-002 — Fact and Session Separation
Implemented by:
- [[../../../07-Decisions/ADR-DATA-001|ADR-DATA-001]] — Chroma Collection Schema (separate collections, classification rules)
- [[../../../01-Standards/Documentation Standards|Documentation Standards]] — Authority field in YAML metadata

### FR-003 — Verification Before Implementation
Implemented by:
- [[../../../07-Decisions/ADR-SEC-001|ADR-SEC-001]] — Human Approval Gate Requirements (Verification Agent as Tier 4 gate)
- [[../../../01-Standards/Architecture Standards|Architecture Standards]] — Design review criteria

---

## Related Standards

- [[../../../01-Standards/Coding Standards|Coding Standards]] — Implementation patterns
- [[../../../01-Standards/Architecture Standards|Architecture Standards]] — Design constraints
- [[../../../01-Standards/Security Standards|Security Standards]] — Security verification

---

## Cross-Links

- [[Business Requirements]] — Why are these functional capabilities needed?
- [[Non-Functional Requirements]] — How should these functions perform?
- [[../../../04-Workflows/README.md|Workflows]] — Implementation choreography for these functions
