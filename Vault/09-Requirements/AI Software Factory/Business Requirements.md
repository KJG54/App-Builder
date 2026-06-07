---
type: Requirement
phase: 3
status: Approved
authority: facts
chroma_collection: ai-software-factory-facts
tags: [requirement, business]
related: [ADR-ARCH-001, ADR-SEC-001, Architecture Standards]
last_updated: 2026-06-07
---

# Business Requirements — AI Software Factory

Status: Approved
Last Updated: 2026-06-07

## BR-001 — Force Multiplier for Solo Developer

Type: Business
Priority: Must Have
Status: Approved

### Description

The system must function as a force multiplier for a single developer working across multiple projects simultaneously.

### Acceptance Criteria

- Developer can switch between projects without losing context
- AI agents operate with full project knowledge without repeated prompting
- Time spent on repeated context creation is measurably reduced

---

## BR-002 — Knowledge Preservation

Type: Business
Priority: Must Have
Status: Approved

### Description

All project decisions, lessons learned, architecture choices, and standards must be preserved permanently and remain retrievable.

### Acceptance Criteria

- Every ADR is stored and retrievable
- Session summaries capture decisions and lessons
- Knowledge compounds — future projects benefit from past work

---

## BR-003 — Human Authority Preserved

Type: Business
Priority: Must Have
Status: Approved

### Description

The human must remain the final authority for all meaningful decisions. The system must not take irreversible actions without approval.

### Acceptance Criteria

- All architecture, infrastructure, and dependency changes require human approval
- Product direction and business decisions are never delegated
- Low-confidence outputs are flagged before any downstream action

## Related ADRs

### BR-001 — Force Multiplier for Solo Developer
Enabled by:
- [[../../../07-Decisions/ADR-ARCH-001|ADR-ARCH-001]] — Knowledge-First Pipeline (context assembly for agents)
- [[../../../07-Decisions/ADR-DATA-001|ADR-DATA-001]] — Chroma Collection Schema (fast retrieval without repeated context)
- [[../../../07-Decisions/ADR-INT-001|ADR-INT-001]] — MCP Server Integration (tool access layer)

### BR-002 — Knowledge Preservation
Enabled by:
- [[../../../07-Decisions/ADR-ARCH-001|ADR-ARCH-001]] — Knowledge-First Pipeline (permanent knowledge accumulation)
- [[../../../07-Decisions/ADR-DATA-001|ADR-DATA-001]] — Chroma Collection Schema (semantic storage and retrieval)
- [[../../../07-Decisions/ADR-PROC-001|ADR-PROC-001]] — ADR Authoring Workflow (decisions documented)

### BR-003 — Human Authority Preserved
Enabled by:
- [[../../../07-Decisions/ADR-SEC-001|ADR-SEC-001]] — Human Approval Gate Requirements (5 approval tiers)
- [[../../../01-Standards/Security Standards|Security Standards]] — Agent authority constraints

---

## Related Standards

- [[../../../01-Standards/Architecture Standards|Architecture Standards]] — Modularity, versioning, tech-agnosticism
- [[../../../01-Standards/Security Standards|Security Standards]] — Data protection, threat modeling
- [[../../../01-Standards/Documentation Standards|Documentation Standards]] — Knowledge preservation requirements

---

## Cross-Links

- [[Functional Requirements]] — What must the system do to meet these business requirements?
- [[Non-Functional Requirements]] — How must the system behave to meet these business requirements?
- [[../Overview|Project Overview]]
