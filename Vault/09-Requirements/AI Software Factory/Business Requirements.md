# Business Requirements — AI Software Factory

Status: Draft
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

## Related

- [[Functional Requirements]]
- [[Non-Functional Requirements]]
- [[Overview]]
