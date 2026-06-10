---
type: Requirement
phase: 17
status: Approved
authority: facts
chroma_collection: ai-software-factory-facts
tags: [requirement, non-functional, build-pipeline, autonomy, performance, safety]
related: [Business Requirements, Functional Requirements, ADR-ARCH-001, ADR-SEC-001]
last_updated: 2026-06-10
---

# Non-Functional Requirements — Project Build Pipeline

Status: Approved
Last Updated: 2026-06-10

---

## NFR-PBP-001 — Autonomous Execution with Bounded Escalation

Type: Non-Functional
Priority: Must Have
Status: Approved

### Description

The framework must execute build phases autonomously without requiring human input at each step. Escalation must be bounded — the agent must exhaust available tools before surfacing a blocker, and must not escalate on problems it can solve.

### Acceptance Criteria

- Human is not interrupted during autonomous build phases except for defined escalation triggers
- Escalation ladder is always: fix → search → escalate → document
- Agent never escalates a problem it resolved successfully
- Escalation message always includes: error context, attempted fixes, search results, recommended next step

---

## NFR-PBP-002 — Phase Checkpoint Integrity

Type: Non-Functional
Priority: Must Have
Status: Approved

### Description

Each completed phase must leave the project in a known-good, recoverable state. If a later phase introduces regressions, rollback to the prior checkpoint must be possible without losing all subsequent work.

### Acceptance Criteria

- A checkpoint (git commit or equivalent) is created at the end of each passing phase
- Checkpoints are labeled by phase name and timestamp
- Rollback to any prior phase checkpoint is possible without losing the overall project structure
- Regression detection runs at the start of each phase (prior phase tests must still pass)

---

## NFR-PBP-003 — Dual Readability (Human + AI)

Type: Non-Functional
Priority: Must Have
Status: Approved

### Description

All pipeline artifacts — specs, plans, code, docs, Vault records — must be structured and written so that both humans and AI agents can read, understand, and act on them without additional context or translation.

### Acceptance Criteria

- All Vault documents pass vault-validator.js
- Project specs follow BR/FR/NFR structure with testable acceptance criteria
- Agent prompts and skills are self-contained (no implicit session dependencies)
- Code is documented at decision points, not at line level
- A new agent can orient to the project within one Vault query

---

## NFR-PBP-004 — Cost and Paid API Transparency

Type: Non-Functional
Priority: Must Have
Status: Approved

### Description

The pipeline must never silently incur costs. Any action that involves paid APIs, usage-based services, or third-party billing must be surfaced before execution. A soft budget ceiling is captured per project during discovery. If the build is projected to exceed that ceiling, the agent pauses and confers with the human before continuing.

### Acceptance Criteria

- All paid dependencies are flagged during research phase with estimated cost impact
- A soft budget ceiling is captured in the project rulebook during discovery
- Agent tracks projected costs during the build and alerts the human if the ceiling is at risk of being exceeded
- Agent does not proceed past the alert without explicit human approval
- Human may raise, lower, or waive the budget ceiling at any time
- Cost estimates are included in the phase plan for all paid services

---

## NFR-PBP-005 — Reusability Detection Coverage

Type: Non-Functional
Priority: Should Have
Status: Draft

### Description

Before building any new component, the pipeline must check whether a suitable component already exists in a prior project's Vault record or the framework's shared library. The reusability detection must cover the corpus of all completed projects indexed in the framework's Chroma instance.

### Project Physical Location (Resolved)

Projects live in `Projects/[category]/[project-name]/` within this repo. Each project is scaffolded as a self-contained copy of the framework (`.claude/`, `Vault/`, `CLAUDE.md`, scripts). Category folders are created on first use when project type is specified during discovery. Each project gets its own GitHub repo when ready to ship.

The framework Vault and project Vault are separate. The connection is Chroma: each project's Vault is indexed into the framework's Chroma instance under its own collection. This makes all project knowledge queryable by future projects without merging Vault folders.

A **project registry** is maintained at `Vault/03-Projects/Registry.md` — a lightweight index of every scaffolded project, its category, Chroma collection name, and status.

### Acceptance Criteria

- Reusability check runs before any new custom component is scaffolded
- Check queries Chroma across framework collection and all registered project collections
- Match threshold is defined (e.g., 0.85+ semantic similarity = flag for reuse review)
- Human decides whether to reuse, adapt, or build new — not the agent
- Project registry is updated when a new project is scaffolded or a project ships

---

## NFR-PBP-006 — Post-Ship Health Monitoring

Type: Non-Functional
Priority: Should Have
Status: Draft

### Description

Projects built with the framework should optionally inherit a Guardian configuration so they can be monitored for health, drift, and technical debt after handoff. Health monitoring is not mandatory but must be supported.

### Acceptance Criteria

- Discovery phase includes an optional "enable Guardian monitoring" prompt
- If enabled, a Guardian config is scaffolded into the project during the build phase
- Guardian reports for managed projects are stored in the project's own Vault record, not the framework's
- Guardian monitoring can be enabled or disabled post-ship without rebuilding

---

## NFR-PBP-007 — Technology Agnosticism

Type: Non-Functional
Priority: Must Have
Status: Approved

### Description

The pipeline must not assume any specific language, framework, database, hosting provider, or AI provider. Technology decisions are always driven by project requirements, not framework defaults.

### Acceptance Criteria

- No technology is hardcoded as a default in the pipeline (no implicit Node.js, React, Docker, etc.)
- Technology recommendations always include at least two alternatives with tradeoffs
- The framework can successfully scaffold projects in at least: web apps, desktop apps, APIs, CLI tools
- All pipeline scripts and validators work regardless of the project's tech stack

---

## Cross-Links

- [[Business Requirements]] — Why are these constraints required?
- [[Functional Requirements]] — What the system must do to satisfy these constraints
