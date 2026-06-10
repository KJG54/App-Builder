---
type: Requirement
phase: 17
status: Approved
authority: facts
chroma_collection: ai-software-factory-facts
tags: [requirement, business, build-pipeline, discovery]
related: [Functional Requirements, Non-Functional Requirements, ADR-ARCH-001, ADR-SEC-001]
last_updated: 2026-06-10
---

# Business Requirements — Project Build Pipeline

Status: Approved
Last Updated: 2026-06-10

---

## BR-PBP-001 — Seamless End-to-End Project Creation

Type: Business
Priority: Must Have
Status: Approved

### Description

The framework must guide a developer — human or AI — from a project idea to a deployable, containerized artifact without requiring repeated context setup, reinvention of process, or manual coordination between stages. Each stage must feed the next automatically.

### Acceptance Criteria

- A developer can say "I want to build X" and receive a structured plan before any code is written
- No stage begins without output from the previous stage being confirmed
- The final output is deployable without additional manual setup

---

## BR-PBP-002 — Human Authority at Commit Boundaries

Type: Business
Priority: Must Have
Status: Approved

### Description

The human must remain the final authority before anything becomes permanent. Agents run autonomously during build but may not commit or push without a human reviewing a full rundown of what changed and why.

### Acceptance Criteria

- Agent execution is fully autonomous from plan approval to test completion
- A diff summary + decision log is presented to the human before any commit
- No git commit or push is executed without explicit human approval
- All agent actions during the build phase are logged and auditable

---

## BR-PBP-003 — Universal + Project-Specific Governance

Type: Business
Priority: Must Have
Status: Approved

### Description

Universal agent rules (CLAUDE.md, .claude/) apply to all projects. Each project captures its own rulebook during the discovery phase and stores it with the project. Neither set of rules overrides the other; universal rules are the floor, project rules extend them.

### Acceptance Criteria

- Universal governance is enforced automatically on all projects
- Discovery phase always produces a project-specific rules document
- Project rules are stored in the project's Vault record
- Conflicts between universal and project rules are surfaced, not silently resolved

---

## BR-PBP-004 — Knowledge Compounds Across Projects

Type: Business
Priority: Must Have
Status: Approved

### Description

Every project built with the framework must contribute reusable knowledge back to it. Decisions, components, patterns, and solutions discovered during a build should be available to future projects. The framework grows smarter with each use.

### Acceptance Criteria

- Each completed project produces a Vault record of decisions, tradeoffs, and lessons
- Reusability detection checks prior projects before building new components
- Components identified as reusable are promoted to the framework's shared library
- Future discovery interviews surface relevant prior work automatically

---

## BR-PBP-005 — Human + AI Readable at Every Layer

Type: Business
Priority: Must Have
Status: Approved

### Description

Every artifact produced by the pipeline — specs, plans, code, docs, Vault records — must be readable and actionable by both humans and AI agents without translation or interpretation layers. The framework serves a single developer today and autonomous agents tomorrow; neither should require special handling.

### Acceptance Criteria

- All Vault documents pass vault-validator.js (correct frontmatter, structure)
- All agent prompts and skills are self-contained and executable without prior session context
- All project specs follow the BR/FR/NFR structure with acceptance criteria
- A new AI agent can orient to any project by reading its Vault record alone

---

## Related ADRs

- [[../../../07-Decisions/ADR-ARCH-001|ADR-ARCH-001]] — Knowledge-First Pipeline (context assembly enabling cross-project reuse)
- [[../../../07-Decisions/ADR-SEC-001|ADR-SEC-001]] — Human Approval Gate Requirements (commit boundary authority)

---

## Related Standards

- [[../../../01-Standards/Architecture Standards|Architecture Standards]] — Modularity, tech-agnosticism, reusability
- [[../../../01-Standards/Security Standards|Security Standards]] — Agent authority constraints
- [[../../../01-Standards/Documentation Standards|Documentation Standards]] — Vault record requirements

---

## Cross-Links

- [[Functional Requirements]] — What must the pipeline do to meet these business requirements?
- [[Non-Functional Requirements]] — How must the pipeline behave?
