---
type: Requirement
phase: 3
status: Approved
authority: facts
chroma_collection: ai-software-factory-facts
tags: [requirement, non-functional]
related: [ADR-INFRA-001, ADR-DATA-001, Security Standards]
last_updated: 2026-06-07
---

# Non-Functional Requirements — AI Software Factory

Status: Approved
Last Updated: 2026-06-07

## NFR-001 — Local First

Type: Non-Functional
Priority: Must Have
Status: Approved

### Description

All core components must run locally. No cloud dependencies for the primary workflow.

### Acceptance Criteria

- Obsidian vault is local
- Chroma runs in Docker locally
- Claude CLI operates locally
- No mandatory SaaS services in the critical path

---

## NFR-002 — Cost Visibility

Type: Non-Functional
Priority: Must Have
Status: Draft

### Description

Token costs must be tracked and visible after every agent execution.

### Acceptance Criteria

- Observability log records tokens in/out and estimated cost per execution
- Weekly cost summaries are generated
- Model routing is used to minimize cost for low-complexity tasks

---

## NFR-003 — Reproducibility

Type: Non-Functional
Priority: Must Have
Status: Draft

### Description

All development environments must be reproducible via Docker.

### Acceptance Criteria

- Any project can be rebuilt from Git + Docker Compose alone
- No undocumented local dependencies
- Bootstrap script creates consistent project structure every time

## Related ADRs

### NFR-001 — Local First
Constrained by:
- [[../../../07-Decisions/ADR-INFRA-001|ADR-INFRA-001]] — VS Code Workspace Configuration (local environment)
- [[../../../01-Standards/Security Standards|Security Standards]] — No cloud dependencies for critical path

### NFR-002 — Cost Visibility
Implemented by:
- [[../../../07-Decisions/ADR-PROC-001|ADR-PROC-001]] — ADR Authoring Workflow (governance through observability)
- [[../../../05-Prompts/DevOps.md|DevOps Agent Prompt]] — Cost tracking and visibility

### NFR-003 — Reproducibility
Constrained by:
- [[../../../07-Decisions/ADR-INFRA-001|ADR-INFRA-001]] — VS Code Workspace Configuration (Docker reproducibility)
- [[../../../01-Standards/Architecture Standards|Architecture Standards]] — Technology-agnostic design

---

## Related Standards

- [[../../../01-Standards/Architecture Standards|Architecture Standards]] — Modularity, versioning
- [[../../../01-Standards/Security Standards|Security Standards]] — Local-first security implications
- [[../../../01-Standards/Documentation Standards|Documentation Standards]] — Reproducibility documentation

---

## Cross-Links

- [[Business Requirements]] — Why are these non-functional attributes required?
- [[Functional Requirements]] — What features support these non-functional requirements?
- [[../../../02-Technologies/README.md|Technology Stack]] — Tech choices driven by these constraints
