---
type: Requirement
phase: 17
status: Approved
authority: facts
chroma_collection: ai-software-factory-facts
tags: [requirement, functional, build-pipeline, discovery, interview, autonomous]
related: [Business Requirements, Non-Functional Requirements, ADR-ARCH-001, ADR-SEC-001]
last_updated: 2026-06-10
---

# Functional Requirements — Project Build Pipeline

Status: Approved
Last Updated: 2026-06-10

---

## Stage 1: Interview

---

## FR-PBP-001 — Structured Discovery Interview

Type: Functional
Priority: Must Have
Status: Approved

### Description

Before any code, architecture, or plan is produced, the framework must conduct a structured discovery interview that surfaces project vision, users, tech stack candidates, hosting, dependencies, constraints, and project-specific rules. The interview must follow the `/discover` skill protocol.

### Acceptance Criteria

- Interview covers: vision/goals, users/personas, functionality, UX direction, technical decisions, automation opportunities, constraints, future growth, project-specific rules
- Interview progresses one question at a time — no lists of questions, no rushing to solutions
- Interview does not end until all open questions are answered and scope is confirmed by the human
- Output is a formal Project Specification saved to `Vault/09-Requirements/[Project Name]/`

---

## FR-PBP-002 — Project-Specific Rulebook Capture

Type: Functional
Priority: Must Have
Status: Approved

### Description

Discovery must always produce a project-specific rulebook that extends universal governance (CLAUDE.md). This includes paid API tolerance, budget constraints, licensing requirements, security standards, hosting environment, and any project-specific agent behavior rules.

### Acceptance Criteria

- Every project spec includes a "Project Rules" section
- Rules are stored alongside the spec in `Vault/09-Requirements/[Project Name]/`
- Rules are loaded by agents before any build phase begins
- Conflicts with universal rules are explicitly flagged

---

## Stage 2: Research

---

## FR-PBP-003 — Autonomous Technology Research

Type: Functional
Priority: Must Have
Status: Approved

### Description

After discovery, the framework must autonomously research technology options, relevant frameworks, libraries, tools, APIs, and hosting approaches suited to the project. Reusability detection must check prior projects before recommending new builds.

### Acceptance Criteria

- Research covers: tech stack options, frameworks, libraries, hosting, dependencies, prior project components
- Prior project Vault records are checked before recommending new custom components
- External tools (MCPs, APIs, open-source) are evaluated before recommending custom builds
- Research output is a structured comparison with tradeoffs, not just a list

---

## FR-PBP-004 — Paid API and Cost Gate

Type: Functional
Priority: Must Have
Status: Approved

### Description

Any recommended technology that involves paid APIs, usage-based pricing, or third-party costs must be surfaced explicitly before the plan is approved. The agent must never silently include paid dependencies.

### Acceptance Criteria

- All paid APIs and services are flagged with estimated cost impact
- Human approval is required before any paid dependency is included in the plan
- Budget tolerance captured during discovery is used as the evaluation threshold

---

## Stage 3: Recommend

---

## FR-PBP-005 — AI-Recommended Phase Plan

Type: Functional
Priority: Must Have
Status: Approved

### Description

Based on discovery and research, the framework must produce a phased implementation plan with AI-recommended phase breakdown (e.g., security, GUI, backend, frontend, testing, deployment). The human may modify the plan before approving it.

### Acceptance Criteria

- Plan includes: recommended phases with rationale, file structure scaffold, dependencies per phase, estimated complexity
- Phase breakdown is explained — not just listed
- Human can modify any phase before approving
- Plan is not executed until human explicitly approves

---

## Stage 4: Build

---

## FR-PBP-006 — File Structure Scaffold

Type: Functional
Priority: Must Have
Status: Approved

### Description

At the start of the build phase, the framework must generate a complete file structure representing the near-final project layout. Structure is created before any implementation code is written.

### Acceptance Criteria

- File structure reflects the approved plan and tech stack
- Structure includes all major directories, placeholder files, and configuration files
- Human can review and adjust before implementation begins

---

## FR-PBP-007 — Autonomous Phased Implementation

Type: Functional
Priority: Must Have
Status: Approved

### Description

The framework must execute each phase autonomously: implement code, run tests, verify output, and advance to the next phase without requiring human intervention unless a blocker is encountered. A checkpoint is created at the end of each phase.

### Acceptance Criteria

- Each phase completes before the next begins
- Tests are run and must pass before a phase is marked complete
- Phase checkpoint is saved (git commit or equivalent snapshot) before advancing
- Rollback to a prior phase checkpoint is possible if a later phase breaks prior functionality

---

## FR-PBP-008 — Self-Healing Blocker Escalation

Type: Functional
Priority: Must Have
Status: Approved

### Description

When the agent encounters a blocker during build (failing test, missing dependency, breaking API change), it must attempt resolution in order: fix autonomously → web search → escalate to human → document in Known Problems.

### Acceptance Criteria

- Agent attempts autonomous fix before escalating
- If autonomous fix fails, agent performs a web search for the specific problem
- If web search does not yield an actionable solution, agent escalates to human with full context (error, attempted fixes, search results)
- All unresolved blockers are documented in `Vault/10-Known-Problems/` regardless of outcome

---

## FR-PBP-009 — Completion Verification

Type: Functional
Priority: Must Have
Status: Approved

### Description

The framework must define "done" concretely per project — not just passing tests, but all acceptance criteria from the project spec verified, containerization complete, and documentation present. The agent must not self-certify completion without meeting the defined bar.

### Acceptance Criteria

- Completion criteria are defined during discovery and captured in the project spec
- Agent checks all completion criteria before declaring the build done
- Test suite must pass in full
- Container builds and runs successfully
- Documentation (README, API docs, architecture notes) is present
- Human is notified when completion criteria are met — not before

### Test Authorship (Resolved)

Agents write all tests. Before writing tests, the agent must present the human with a plain-language summary of what tests will be written, what each test covers, and why — so the human understands the coverage without reading test code. Human approves the test plan before the agent writes any tests.

---

## Stage 5: Review

---

## FR-PBP-010 — Diff Summary + Decision Log

Type: Functional
Priority: Must Have
Status: Approved

### Description

Before any commit or push, the framework must present the human with a structured rundown of all changes made and the reasoning behind each significant decision. This is not just a file diff — it is a decision audit trail.

### Acceptance Criteria

- Summary includes: files changed, what changed in each, why each significant decision was made
- Decisions reference the phase plan and discovery spec where applicable
- Human can approve, request changes, or reject before any commit is made
- Rejected changes return control to the agent for correction without losing prior phase work

---

## Stage 6: Ship

---

## FR-PBP-011 — Deployable Output

Type: Functional
Priority: Must Have
Status: Approved

### Description

The final output of every project build must be a deployable, containerized artifact. Containerization, environment configuration, and basic CI/CD scaffolding are not optional — they are part of the definition of done.

### Acceptance Criteria

- Dockerfile (or equivalent) is present and builds successfully
- Environment variables are documented and externalized (no hardcoded secrets)
- Basic CI/CD configuration is scaffolded (GitHub Actions or equivalent)
- README includes deployment instructions
- Project is committed and pushed to the designated repository

---

## FR-PBP-012 — Post-Build Vault Record

Type: Functional
Priority: Must Have
Status: Approved

### Description

Every completed project must produce a Vault record capturing the decisions made, tradeoffs chosen, components built, and lessons learned. This record feeds the reusability detection system for future projects.

### Acceptance Criteria

- Vault record is created in `Vault/03-Projects/[Project Name]/`
- Record includes: tech stack chosen and why, major architectural decisions (ADRs), known limitations, reusable components identified
- Session summary is created in `Vault/08-Retrospectives/`
- Components flagged as reusable are linked from the framework's shared library index

---

## Cross-Links

- [[Business Requirements]] — Why are these functional requirements needed?
- [[Non-Functional Requirements]] — How must these functions behave?
