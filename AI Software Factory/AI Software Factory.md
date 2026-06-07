# AI Software Factory

## Purpose

Build a local-first, Human-in-the-Loop AI software development operating system for a solo developer.

The goal is not autonomous software development.

The goal is:

* Increased efficiency
* Increased consistency
* Increased code quality
* Reduced context switching
* Reduced repetitive prompting
* Knowledge preservation
* Human-controlled decision making

The human remains the final authority for all meaningful decisions.

---

# Core Philosophy

Most AI-assisted development systems focus on generating code.

This system focuses on:

```
Knowledge → Context → Planning → Verification → Implementation → Preservation
```

The primary asset is not the generated software.

The primary asset is the accumulated knowledge system that allows future software to be built faster and more accurately.

Every decision, lesson learned, architecture choice, workflow, and standard should be captured and reused.

---

# Guiding Principles

## Principle 1

Knowledge is the most valuable asset.

Code can be regenerated.

Knowledge cannot.

---

## Principle 2

The human makes decisions.

The AI provides:

* Analysis
* Recommendations
* Implementation
* Testing
* Documentation

The human approves.

---

## Principle 3

Retrieval is more important than autonomy.

A well-informed agent is more useful than ten uninformed agents.

---

## Principle 4

Every completed task should improve future performance.

All important information should be stored and indexed.

---

## Principle 5

Requirements and architecture are separate concerns.

Requirements define what is being built.

Architecture defines how it is built.

Mixing them degrades retrieval accuracy and causes requirement drift.

---

## Principle 6

Facts and sessions are separate concerns.

Authoritative decisions must not be contaminated by exploratory discussions, experiments, or abandoned ideas.

---

# System Goals

1. Eliminate repeated prompting.
2. Preserve project knowledge permanently.
3. Allow multiple AI agents to collaborate.
4. Improve software quality through specialized reviews.
5. Maintain consistent development environments.
6. Support multiple projects simultaneously.
7. Reduce context window waste.
8. Enable scalable AI-assisted software development.
9. Catch issues before implementation begins.
10. Build a compounding troubleshooting knowledge base.

---

# High-Level Architecture

```text
Human
│
├── Decision Making
├── Prioritization
└── Approval
│
▼
VS Code
│
▼
Claude CLI
│
▼
Context Builder
│
├── Chroma Retrieval (facts, architecture, requirements, test history)
├── Obsidian Retrieval
├── ADR Retrieval
├── Code Retrieval
└── Standards Retrieval
│
▼
Model Router
│
├── Opus   → Architect, Security, Verification, complex reasoning
├── Sonnet → Backend, Frontend, QA, DevOps
└── Haiku  → Formatting, doc updates, summaries, classification
│
▼
AI Skills
│
├── Architect         → Design
├── Verification      → Pre-implementation gate
├── Backend           → Implementation
├── Frontend          → Implementation
├── QA                → Testing
├── Security          → Review
├── DevOps            → Infrastructure
└── Documentation     → Knowledge capture
│
▼
Docker Workspaces
│
▼
Git
│
▼
Deployment
│
▼
Observability Log + Project Health Metrics
│
▼
Obsidian + Chroma (updated)
```

---

# Core Components

## VS Code

Purpose:

Primary operational environment and central dashboard.

Responsibilities:

* Coding
* Reviewing
* Git management
* Terminal access
* Claude CLI execution
* MCP access

---

## Obsidian

Purpose:

Long-term organizational memory and source of truth.

Not Claude. Not Docker. Not Git.

All critical project knowledge should ultimately exist inside the Obsidian vault.

Stores:

* Requirements (separate from architecture)
* Architecture (versioned snapshots)
* Research
* ADRs (categorized)
* Standards
* Workflows
* Session summaries
* Lessons learned
* Known problems
* Prompt library

---

## Chroma Vector Database

Purpose:

Semantic memory and context retrieval.

Collections are strictly namespaced.

Facts and sessions are stored separately to prevent retrieval contamination.

Responsibilities:

* Similarity search
* Context retrieval
* Historical decision retrieval
* Test failure and root cause retrieval

Expected outcome:

Less manual context gathering. Higher retrieval precision.

---

## Claude CLI

Purpose:

Reasoning engine.

Responsibilities:

* Planning
* Architecture
* Coding
* Analysis
* Review
* Documentation

Claude should always operate using structured, task-specific context.

---

## Docker

Purpose:

Execution environment.

Responsibilities:

* Consistent development environments
* Service isolation
* Reproducibility
* Agent workspace isolation

---

## Git

Purpose:

Version control.

Responsibilities:

* Source history
* Prompt history
* Documentation history
* Architecture version history
* Rollback
* Audit trail

---

## MCP Servers

Purpose:

Tool access layer.

Current Priority:

* Filesystem
* GitHub
* Chroma
* PostgreSQL
* Browser

Future:

* Jira
* Linear
* AWS
* Kubernetes
* Terraform
* Slack

---

# Knowledge Structure

## Obsidian Vault Layout

```text
Vault/
│
├── 00-Inbox
│
├── 01-Standards
│   ├── Coding Standards.md
│   ├── Architecture Standards.md
│   ├── Security Standards.md
│   └── Documentation Standards.md
│
├── 02-Technologies
│   ├── Python.md
│   ├── FastAPI.md
│   ├── PostgreSQL.md
│   ├── Docker.md
│   └── Kubernetes.md
│
├── 03-Projects
│   └── [Project Name]/
│       ├── Overview.md
│       ├── Architecture/
│       │   ├── v1.0.md
│       │   ├── v1.1.md
│       │   └── Current.md
│       └── Roadmap.md
│
├── 04-Workflows
│   ├── New Project.md
│   ├── Build API.md
│   ├── Debug Application.md
│   └── Deploy Service.md
│
├── 05-Prompts
│   └── [versioned prompt files — see Prompt Versioning]
│
├── 06-Research
│
├── 07-Decisions
│   ├── ADR-ARCH-001.md
│   ├── ADR-SEC-001.md
│   ├── ADR-DATA-001.md
│   └── ADR-INFRA-001.md
│
├── 08-Retrospectives
│   └── [session summaries + observability logs]
│
├── 09-Requirements
│   └── [Project Name]/
│       ├── Business Requirements.md
│       ├── Functional Requirements.md
│       ├── Non-Functional Requirements.md
│       ├── User Stories.md
│       └── Acceptance Criteria.md
│
├── 10-Known-Problems
│   ├── FastAPI-Issues.md
│   ├── Docker-Issues.md
│   ├── PostgreSQL-Issues.md
│   └── [Technology]-Issues.md
│
└── Templates
    ├── ADR.md
    ├── Project.md
    ├── Requirements.md
    ├── Session Summary.md
    ├── Known Problem.md
    └── Prompt.md
```

---

## Knowledge Graph Strategy

Every note should be heavily linked.

Example:

```markdown
Project X uses [[FastAPI]]
Project X uses [[PostgreSQL]]
Project X follows [[Coding Standards]]
Project X implements [[Authentication]]
Project X satisfies [[Business Requirements]]
Project X follows [[ADR-ARCH-001]]
```

The objective is a machine-readable knowledge graph that agents can traverse.

---

# Requirements Management

Requirements are a first-class layer. They are stored separately from architecture.

## Directory

```text
09-Requirements/
└── [Project Name]/
    ├── Business Requirements.md
    ├── Functional Requirements.md
    ├── Non-Functional Requirements.md
    ├── User Stories.md
    └── Acceptance Criteria.md
```

## Why Separate

* Architecture describes how the system is built.
* Requirements describe what the system must do.
* Mixing them causes retrieval to return architectural opinions when agents need to check requirement coverage.
* Separate storage allows the Verification Agent to independently check requirement coverage before implementation.

## Template

```markdown
# [Requirement ID] — [Short Title]

## Type
Business | Functional | Non-Functional

## Description

## Acceptance Criteria

## Priority
Must Have | Should Have | Nice to Have

## Status
Draft | Approved | Implemented | Verified

## Linked ADRs
- [[ADR-ARCH-001]]
```

## Chroma Collection

Requirements are indexed into `{project}-facts` (approved) or `{project}-sessions` (draft/exploratory).

---

# Architecture Versioning

Architecture is not a static document. It evolves. Every evolution must be preserved.

## Structure

```text
03-Projects/[Project Name]/Architecture/
│
├── v1.0.md       ← initial design
├── v1.1.md       ← after first major change
├── v2.0.md       ← after significant redesign
└── Current.md    ← always points to latest
```

## Rules

* Never edit a past version in place. Create a new version.
* `Current.md` is always a copy of the latest version, not a symlink.
* Each version file includes a changelog header explaining what changed and why.
* Agents always read `Current.md`. Historical versions are available for retrieval when debugging or planning changes.

## Version Header Template

```markdown
# Architecture — v[X.Y]

Date: YYYY-MM-DD
Previous Version: v[X.Y-1]
Changes: [what changed]
Reason: [why it changed]
Linked ADRs: [[ADR-ARCH-001]]
```

---

# Known Problems Knowledge Base

Purpose:

Build a reusable troubleshooting database that compounds in value over time.

Every problem solved once should prevent the same problem from being solved again.

## Directory

```text
10-Known-Problems/
│
├── FastAPI-Issues.md
├── Docker-Issues.md
├── PostgreSQL-Issues.md
└── [Technology]-Issues.md
```

## Template

```markdown
# Problem — [Short Title]

Date: YYYY-MM-DD
Project: [Project Name]
Technology: [Technology]

## Symptoms

## Root Cause

## Resolution

## Prevention

## Linked Notes
- [[ADR-ARCH-001]]
- [[Session Summary YYYY-MM-DD]]
```

## Chroma Collection

All known problems are indexed into `global-known-problems`.

This collection is always included in context when debugging tasks.

---

# Architecture Decision Records

Directory:

```text
07-Decisions/
```

## Categorized Naming

ADRs use category prefixes for precise retrieval and organization.

```text
ADR-ARCH-001   — Architecture decisions
ADR-SEC-001    — Security decisions
ADR-DATA-001   — Data / database decisions
ADR-INFRA-001  — Infrastructure decisions
ADR-API-001    — API design decisions
ADR-INT-001    — Integration decisions
```

## Template

```markdown
# ADR-[CATEGORY]-[number] — [Short Title]

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded
Category: ARCH | SEC | DATA | INFRA | API | INT

## Decision

## Reason

## Alternatives Considered

## Consequences

## Linked Requirements
- [[Functional Requirements]]
```

## Purpose

* Prevent AI from re-evaluating settled decisions.
* Preserve reasoning.
* Improve project continuity.
* Enable the Verification Agent to check for ADR conflicts before implementation.

---

# Chroma Collection Design

Collections must be namespaced and semantically separated to prevent retrieval degradation.

## Collection Schema

```text
global-standards         — coding standards, security rules, naming conventions
global-prompts           — versioned prompt library
global-known-problems    — cross-project troubleshooting knowledge base

{project}-facts          — approved requirements, accepted ADRs, architecture decisions, standards
{project}-architecture   — versioned architecture snapshots
{project}-code           — indexed source code snippets
{project}-sessions       — experiments, discussions, research notes, work logs
{project}-test-history   — bugs, root causes, fixes, regression history, lessons learned
{project}-research       — research notes, vendor docs
```

## Facts vs Sessions — Critical Distinction

| Collection | Stores | Examples |
|---|---|---|
| `{project}-facts` | Authoritative, approved knowledge | Accepted ADRs, approved requirements, finalized architecture |
| `{project}-sessions` | Exploratory, conversational history | Experiments, draft ideas, work logs, abandoned approaches |

Never index draft or exploratory content into `{project}-facts`.

Contaminating facts with session noise is the most common cause of retrieval hallucination.

## Retrieval Strategy

1. Always query `global-standards` for any task.
2. Query `global-known-problems` for debugging and implementation tasks.
3. Query `{project}-facts` for requirements, decisions, and architecture.
4. Query `{project}-test-history` for tasks touching previously-buggy areas.
5. Query additional `{project}-*` collections based on task type.
6. Score and rank results before packaging.
7. Cap context package size to avoid window waste.

## Ingestion Rules

* Approved ADRs → `{project}-facts`
* Approved requirements → `{project}-facts`
* Draft requirements → `{project}-sessions`
* Session summaries → `{project}-sessions`
* Bug reports + fixes → `{project}-test-history`
* Architecture snapshots → `{project}-architecture`
* Known problems → `global-known-problems`

## Ingestion Triggers

* On Obsidian note save (via file watcher or manual trigger)
* After each session summary is generated
* After each ADR is created, updated, or status changes to Accepted
* After prompt versions are updated
* After test failures are documented

---

# CLAUDE.md Strategy

Every project contains a `CLAUDE.md` file.

Purpose:

Provide runtime context. Claude loads this first.

Contents:

```markdown
# Project Context

Tech Stack:
- FastAPI
- PostgreSQL

Standards:
- Type hints required
- Unit tests required

Architecture:
- See Architecture/Current.md

Requirements:
- See 09-Requirements/[Project Name]/

Deployment:
- Docker Compose

Current Priorities:
- [active sprint items]

Constraints:
- [known limitations or frozen decisions]

Key ADRs:
- ADR-ARCH-001: [brief description]
- ADR-SEC-001: [brief description]
```

---

# Context Hierarchy

## Layer 1 — Global

* Coding standards
* Security standards
* Naming conventions
* Preferred architectures
* Known problems

---

## Layer 2 — Project

* Architecture (Current.md)
* Approved requirements
* Accepted ADRs
* CLAUDE.md
* Project health metrics

---

## Layer 3 — Task

* Current feature requirements
* Current bug
* Current sprint
* Relevant test history

---

# Context Builder

## Purpose

Automatically assemble the information needed for a task before invoking an agent.

## Input

```text
Task description — e.g., "Implement OAuth login"
```

## Retrieval Sources

* `global-standards` — always included
* `global-known-problems` — always included for implementation/debug tasks
* `{project}-facts` — requirements, ADRs, architecture decisions
* `{project}-architecture` — current architecture
* `{project}-test-history` — relevant past failures
* `{project}-code` — relevant source files
* `{project}-sessions` — relevant recent work logs

## Output — Task Context Package

```text
Global Standards
Relevant Known Problems
Approved Requirements (scoped to task)
Relevant ADRs (categorized)
Current Architecture
Existing Auth Code
Security Standards
Relevant Test History
```

Only relevant information is included. Context package size is capped.

---

# Model Routing

Not all tasks require the most capable model.

Routing reduces cost significantly at scale.

## Routing Table

| Task Type | Model |
|---|---|
| Architecture design | Opus |
| Security review | Opus |
| Verification (pre-implementation gate) | Opus |
| Complex multi-file reasoning | Opus |
| Backend / Frontend implementation | Sonnet |
| QA review | Sonnet |
| DevOps / infrastructure | Sonnet |
| Requirements analysis | Sonnet |
| Code formatting | Haiku |
| Documentation updates | Haiku |
| Session summary generation | Haiku |
| Simple retrieval / classification | Haiku |
| Known problems indexing | Haiku |

## How to Apply

Each skill file specifies its default model tier.

The human can override for any task.

---

# AI Skills System

Directory:

```text
skills/
│
├── architect.md
├── verification.md
├── backend.md
├── frontend.md
├── qa.md
├── security.md
├── devops.md
└── documentation.md
```

Each skill defines:

* Role
* Objectives
* Default model tier
* Constraints
* Standards checklist
* Output format
* Confidence reporting format

All agent outputs must include a Confidence Report (see Confidence Reporting).

---

## Architect Agent

Default model: Opus

Inputs: Requirements, existing architecture, standards, accepted ADRs

Outputs: Architecture diagrams, service boundaries, database design, API specifications, new architecture version file

---

## Verification Agent

Default model: Opus

Purpose: Pre-implementation gate. Catches issues before implementation wastes time.

Inputs: Architecture plan, requirements, ADRs, standards

Checks:

* Requirement coverage — does the plan address all relevant requirements?
* ADR conflicts — does the plan contradict any accepted ADR?
* Security compliance — does the plan satisfy security standards?
* Standards compliance — does the plan follow coding and architecture standards?
* Dependency impact — does the plan introduce new dependencies, and are they acceptable?

Outputs: Verification report (pass / fail per check), list of issues, recommended resolutions

Workflow position: After Architect, before Human Approval and Implementation.

---

## Product Agent

Default model: Sonnet

Outputs: User stories, acceptance criteria, development plans

Stores outputs in: `09-Requirements/`

---

## Backend Agent

Default model: Sonnet

Outputs: Source code, APIs, database interactions, tests

---

## Frontend Agent

Default model: Sonnet

Outputs: Components, pages, state management

---

## QA Agent

Default model: Sonnet

Outputs: Bug reports, test coverage reports, validation results

All bugs and fixes stored in: `{project}-test-history`

Responsibilities: Attempt to break systems, find edge cases

---

## Security Agent

Default model: Opus

Checks: Authentication, authorization, secrets handling, input validation, dependency risks

Outputs: Security findings

---

## DevOps Agent

Default model: Sonnet

Outputs: Dockerfiles, Compose files, CI/CD workflows, deployment procedures

---

## Documentation Agent

Default model: Haiku

Outputs: README, architecture docs, API docs, user guides, session summaries, known problem entries

---

# Confidence Reporting

Every agent output must include a Confidence Report.

Purpose:

Improve decision quality and surface uncertainty before the human approves.

## Format

```markdown
## Confidence Report

Confidence Level: High | Medium | Low

Known Unknowns:
- [Missing information that would improve this output]
- [Assumptions made that have not been verified]
- [Areas requiring human validation]

Recommended Actions Before Proceeding:
- [What should be confirmed or checked]
```

## Rules

* Low confidence outputs must be flagged to the human before any downstream agent acts on them.
* Medium confidence outputs proceed but the human should review known unknowns.
* High confidence outputs proceed normally.

---

# Prompt Versioning and Performance Tracking

Prompts are first-class artifacts. They are versioned, tracked, and measured.

## Storage

Prompts live in two places:

* Obsidian `05-Prompts/` — human-readable, linked to projects and skills
* Git — version history and changelog

## File Format

```markdown
---
name: oauth-implementation
version: 1.2.0
skill: backend
model: sonnet
status: validated | active | deprecated
last-updated: YYYY-MM-DD
---

# Prompt

[prompt body]

# Performance

success_rate: 0.87
avg_human_edits_required: 0.3
avg_time_saved_minutes: 45
last_failure_cause: [description]
total_uses: 23

# Changelog

## 1.2.0
- Added constraint for refresh token rotation

## 1.1.0
- Narrowed scope to FastAPI specifically

## 1.0.0
- Initial version
```

## Versioning Rules

* Never overwrite a prompt in place — increment the version.
* Retiring a prompt sets status to `deprecated`, not deleted.
* Prompts that produced known-good outputs are tagged `validated`.

## Performance Tracking

After each prompt use, log:

```text
prompt_name
version
task_type
outcome (success | partial | failed)
human_edits_required (0-5 scale)
time_saved_estimate (minutes)
failure_cause (if applicable)
```

This data is stored in `08-Retrospectives/prompt-log.jsonl` and summarized weekly.

Use this data to:

* Identify highest-value prompts
* Retire prompts with declining success rates
* Guide prompt improvement efforts

---

# Docker Architecture

## Workspace Layout

```text
workspace/
│
├── vault/
├── projects/
├── skills/
├── prompts/
├── docker/
├── agents/
└── scripts/
    └── new-project.sh
```

## Service Layout

```text
docker/
│
├── postgres
├── redis
├── backend
├── frontend
├── chroma
├── mcp-filesystem
├── mcp-postgres
└── mcp-github
```

## Agent Containers (future)

```text
containers/
│
├── architect/
├── verification/
├── backend/
├── frontend/
├── qa/
├── security/
└── devops/
```

Each container receives:

* Task context package
* Project files
* Standards
* Shared vault mount

```yaml
volumes:
  - ./vault:/vault
```

---

# Project Bootstrap Script

Purpose:

Turn a multi-hour manual setup into a single command.

## Trigger

```bash
./scripts/new-project.sh "Project Name"
```

## Actions

1. Create project folder structure (`src/`, `tests/`, `docs/`, `docker/`)
2. Generate `CLAUDE.md` skeleton from template
3. Generate `docker-compose.yml` from template
4. Create Obsidian project note in `03-Projects/` with `Architecture/v1.0.md` and `Architecture/Current.md`
5. Create requirements folder in `09-Requirements/[Project Name]/` with template files
6. Create first ADR stub (`ADR-ARCH-001 — Initial Technology Decisions`)
7. Initialize Git repository
8. Create Chroma collections:
   * `{project}-facts`
   * `{project}-architecture`
   * `{project}-code`
   * `{project}-sessions`
   * `{project}-test-history`
   * `{project}-research`
9. Output checklist of remaining manual decisions

## Output

```text
Project "Project Name" bootstrapped.

Remaining decisions:
[ ] Confirm tech stack in ADR-ARCH-001
[ ] Define business requirements in 09-Requirements/
[ ] Set current priorities in CLAUDE.md
[ ] Add project to Docker Compose network
```

---

# Human Governance Layer

## Automatic Actions (no approval needed)

* Formatting
* Documentation updates
* Analysis
* Test generation
* Code review comments
* Session summary generation
* Known problem entries

---

## Approval Required

* Database migrations
* Dependency changes
* Architecture changes (triggers new architecture version)
* Infrastructure changes
* New MCP integrations
* Any output with Low confidence rating

---

## Human Only (never delegated)

* Product direction
* Business decisions
* Financial decisions
* Security exceptions

---

# Observability

Purpose:

Track system performance so the factory improves over time.

## What to Log

After every agent execution:

```text
session_id
date
project
task_description
agent_skill
model_used
tokens_in
tokens_out
estimated_cost
retrieval_sources_used
retrieval_quality (human-rated 1-5, optional)
confidence_level (from agent output)
outcome (success | partial | failed)
notes
```

## Storage

* Raw logs: `08-Retrospectives/logs/YYYY-MM-DD.jsonl`
* Indexed into `{project}-sessions` collection
* Weekly summaries generated by Documentation Agent (Haiku)

## What to Review

* Token cost trends by project and skill
* Retrieval quality scores over time
* Which prompts are producing failures
* Which agents are being overridden most often
* Confidence level accuracy (did Low confidence outputs require more human intervention?)

---

# Project Health Metrics

Purpose:

Measure whether projects are improving or degrading over time.

## Metrics

```text
test_coverage_percent
open_defects
security_findings_open
technical_debt_score    (subjective 1-10)
documentation_coverage  (percent of components documented)
complexity_score        (cyclomatic or subjective)
prompt_success_rate
retrieval_quality_avg
```

## Storage

Stored in `03-Projects/[Project Name]/Health.md` and updated after each session.

## Review Cadence

* Updated after each session (automated where possible)
* Reviewed by human weekly
* Trending metrics compared against previous 4 sessions

---

# Agent Failure and Recovery

## Failure Types

| Type | Definition |
|---|---|
| Hard failure | Agent errors, crashes, or produces no output |
| Soft failure | Output is produced but does not meet acceptance criteria |
| Partial completion | Agent completes some steps but not all |
| Verification failure | Verification Agent blocks implementation due to unresolved issues |

## Recovery Protocol

1. **Log the failure** — record in observability log with task context and failure type.
2. **Preserve state** — save any partial output to `00-Inbox` before retrying.
3. **Diagnose before retrying** — identify whether the failure was context quality, prompt quality, or model capability.
4. **Adjust and retry** — improve the context package or prompt, then re-run.
5. **Escalate model tier** — if Sonnet failed, retry with Opus before involving the human.
6. **Human fallback** — if retry fails, surface to human with failure summary and partial output.
7. **Document the problem** — if root cause is identified, add to `10-Known-Problems/`.

## Checkpoints

For multi-step tasks, each agent handoff is a checkpoint.

Partial outputs at checkpoints are committed to a `wip/` branch so nothing is lost.

---

# Session Memory

After each work session, generate a session summary.

## Template

```markdown
# Session Summary — YYYY-MM-DD

## Work Completed

## Decisions Made

## Problems Encountered

## Lessons Learned

## Follow-up Tasks

## New Known Problems
- [link to 10-Known-Problems entry if applicable]

## Observability

- Total estimated cost: $
- Models used:
- Retrieval quality notes:
- Confidence levels observed:
```

## Storage

* Save to `08-Retrospectives/`
* Ingest into `{project}-sessions`
* Any resolved problems → ingest into `global-known-problems`
* Any approved decisions → ingest into `{project}-facts`

---

# Workflow Example

## New Feature Request

User submits:

```text
Implement OAuth login
```

---

Step 1 — Context Builder assembles:

* Global standards
* Approved auth requirements
* Relevant ADRs (ADR-SEC-001, ADR-ARCH-002)
* Current architecture
* Existing auth code
* Auth-related test history
* Relevant known problems

---

Step 2 — Model Router selects: Opus (architect + verification), Sonnet (implementation)

---

Step 3 — Architect Agent designs OAuth flow and data model changes. Saves new architecture version.

---

Step 4 — Verification Agent checks:

* Requirement coverage ✓
* ADR conflicts ✓
* Security compliance ✓
* Standards compliance ✓
* Dependency impact ✓

Outputs verification report with Confidence Report.

---

Step 5 — Human reviews verification report and approves plan.

---

Step 6 — Backend Agent implements.

---

Step 7 — QA Agent tests. Bugs logged to `{project}-test-history`.

---

Step 8 — Security Agent reviews.

---

Step 9 — Human approves.

---

Step 10 — Commit to Git.

---

Step 11 — Documentation Agent updates docs and session summary (Haiku).

---

Step 12 — Observability log updated. Project health metrics updated.

---

Step 13 — Chroma re-indexed: new facts → `{project}-facts`, session → `{project}-sessions`.

---

# Implementation Roadmap

## Phase 1 — Foundation

Goal: Create stable infrastructure.

* Configure VS Code workspace and extensions
* Initialize Git repository and branching strategy
* Stand up Docker Compose environment
* Build Obsidian vault structure and all templates

Deliverables: Functional workspace, organized knowledge base.

---

## Phase 2 — Knowledge System

Goal: Create organizational memory.

* Create categorized ADR template and storage process (`ADR-ARCH`, `ADR-SEC`, etc.)
* Create session summary template and workflow
* Establish CLAUDE.md standard across projects
* Create Known Problems template and `10-Known-Problems/` directory

Deliverables: Persistent memory framework with categorized ADRs and troubleshooting foundation.

---

## Phase 3 — Requirements Management

Goal: Separate requirements from architecture before any retrieval system is built.

* Create `09-Requirements/` directory and templates
* Establish requirements status workflow (Draft → Approved → Implemented → Verified)
* Document initial requirements for first project
* Link requirements to ADRs in Obsidian

Deliverables: Standalone requirements layer, decoupled from architecture.

---

## Phase 4 — Fact vs Session Separation

Goal: Design and enforce Chroma collection boundaries before ingesting anything.

* Define full collection schema (`{project}-facts`, `{project}-sessions`, `{project}-test-history`, etc.)
* Define ingestion rules — what goes where and when
* Create ingestion classification checklist
* Document collection design in this specification

Deliverables: Chroma collection schema with strict separation rules. Zero contamination from day one.

---

## Phase 5 — Chroma Integration

Goal: Semantic retrieval with namespaced collections.

* Spin up Chroma via Docker
* Create all collections per schema
* Build Obsidian ingestion pipeline (standards, ADRs, requirements, known problems)
* Build retrieval pipeline with per-collection routing
* Build context packaging with size cap

Deliverables: Semantic search system with separated, namespaced collections.

---

## Phase 6 — Context Builder

Goal: Automatic context assembly.

* Retrieval orchestration across all relevant collections
* Context scoring and ranking
* Always-include logic for `global-standards` and `global-known-problems`
* Context package size capping
* Packaging system for agent consumption

Deliverables: Task-ready context generation with retrieval hierarchy.

---

## Phase 7 — Skills System

Goal: Specialized agent behavior.

* Create skill files: Architect, Verification, Backend, Frontend, QA, Security, DevOps, Documentation
* Define default model tier per skill
* Define checklists and output formats
* Add Confidence Reporting format to every skill

Deliverables: Specialized, reusable agent workflows with mandatory confidence reporting.

---

## Phase 8 — Verification Layer

Goal: Prevent costly implementation mistakes.

* Define Verification Agent skill and checklist
* Integrate verification step into all feature workflows
* Define what constitutes a blocking vs non-blocking verification failure
* Test verification against at least 3 real feature scenarios

Deliverables: Pre-implementation gate that catches requirement gaps, ADR conflicts, and standards violations.

---

## Phase 9 — Prompt Versioning and Performance Tracking

Goal: Treat prompts as measurable, versioned assets.

* Create prompt file format standard
* Move existing prompts into versioned files
* Integrate prompt library into Git history
* Index prompts into `global-prompts`
* Set up `prompt-log.jsonl` tracking
* Build weekly prompt performance summary

Deliverables: Versioned, retrievable, measurable prompt library.

---

## Phase 10 — Review Pipeline and Observability

Goal: Improve quality and make the factory self-improving.

* Build review workflow: Implementation → QA → Security → Human
* Integrate model routing into review steps
* Implement observability log schema and storage
* Build project health metrics tracking
* Build weekly summary generation (Documentation Agent / Haiku)
* Define and document agent failure recovery protocol

Deliverables: Consistent review process with full observability and measurable health metrics.

---

## Phase 11 — Known Problems Knowledge Base

Goal: Compound troubleshooting knowledge.

* Backfill `10-Known-Problems/` from past session summaries
* Integrate into context builder (always include for debug/implementation tasks)
* Ingest into `global-known-problems` Chroma collection
* Test retrieval quality against real past bugs

Deliverables: Active troubleshooting knowledge base that reduces repeated debugging.

---

## Phase 12 — Advanced MCP Integration

Goal: Expand tool access.

* Integrate PostgreSQL MCP
* Integrate GitHub MCP
* Integrate Browser MCP

Deliverables: Tool-assisted reasoning across the stack.

---

## Phase 13 — Multi-Agent Collaboration

Goal: Structured agent coordination.

* Define agent handoff protocol
* Implement shared context passing between agents
* Workflow orchestration across agents
* Checkpoint and recovery integration

Deliverables: Coordinated agent ecosystem built on a proven knowledge and retrieval foundation.

---

# Definition of Success

The system is successful when:

1. Requirements can be entered once and retrieved precisely.
2. Context is assembled automatically without manual prompting.
3. Historical decisions are retrievable without human memory.
4. AI understands projects without repeated prompting.
5. Human approval remains central to all meaningful decisions.
6. Development speed increases measurably over time.
7. Code quality improves as knowledge compounds.
8. Facts and sessions are never contaminated.
9. Verification catches issues before implementation begins.
10. Every bug fixed is documented and prevents future recurrence.
11. Architecture evolves with a complete historical record.
12. Token costs and retrieval quality are tracked and improving.
13. Agent failures are recoverable without lost work.
14. Prompt performance improves with each iteration.
15. Project health metrics trend positively over time.
16. New projects are faster and higher quality than the last.
