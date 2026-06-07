# Non-Functional Requirements — AI Software Factory

Status: Draft
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

## Related

- [[Business Requirements]]
- [[Functional Requirements]]
