---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# Workflows Guide

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

**Workflows** are documented processes for common tasks. Each workflow choreographs work across multiple roles (humans, agents) with clear handoff points.

This folder contains **6 core workflows** for the Application Builder Framework.

---

## Core Workflows

| Workflow | Purpose | When to Use | Phases Involved |
|----------|---------|------------|---|
| [[New Project.md|New Project]] | Set up a new project from scratch | Starting a new project or product | 1-3 |
| [[Build API.md|Build API]] | Design and implement a new REST API endpoint | Implementing backend features | 5+ |
| [[Debug Application.md|Debug Application]] | Diagnose and fix issues | Any phase; when bugs found | All |
| [[Deploy Service.md|Deploy Service]] | Release code to staging/production | After implementation; before release | 6+ |
| [[async-agent-collaboration.md|Async Agent Collaboration]] | Coordinate Codex, Claude, and other agents across asynchronous sessions | When one agent hands off work to another | 13+ |
| [[multi-agent-operating-model.md|Multi-Agent Operating Model]] | Role split (Claude Architect/Reviewer + Codex Builder) and the async plan→build→review→fix pipeline | Operating Claude + Codex as a team | 13+ |

---

## How Workflows Work

Each workflow defines:

1. **Purpose** — What problem does this solve?
2. **When to use** — Phase, scenario, triggers
3. **Roles involved** — Which agents, which humans
4. **Steps** — Sequential (sometimes parallel) actions
5. **Human gates** — Where humans make decisions
6. **Handoff points** — When work passes to another role
7. **Success criteria** — How do you know it worked?
8. **Related standards** — Which standards apply?
9. **Related ADRs** — Which decisions govern this?
10. **Example** — Walk through one complete scenario

---

## New Project Workflow

[[New Project.md|See detailed workflow]]

**Summary:**
1. Create project folder and Overview.md
2. Write requirements (Business, Functional, Non-Functional)
3. Design architecture (following [[../01-Standards/Architecture Standards.md|Architecture Standards]])
4. Create Roadmap (8-phase plan)
5. Get human approval (Tier 3 decision)
6. Begin Phase 1

---

## Build API Workflow

[[Build API.md|See detailed workflow]]

**Summary:**
1. Receive feature request + acceptance criteria
2. Design API endpoint (following [[../07-Decisions/ADR-API-001.md|ADR-API-001]])
3. Create OpenAPI spec
4. Implement endpoint with tests (minimum 70% coverage)
5. Code review (against [[../01-Standards/Coding Standards.md|Coding Standards]])
6. Deploy to staging
7. Get human approval before production

**Enforces:**
- [[../01-Standards/Coding Standards.md|Coding Standards]] (testing, naming, comments)
- [[../01-Standards/Security Standards.md|Security Standards]] (input validation, authentication)
- [[../01-Standards/Architecture Standards.md|Architecture Standards]] (API design)
- [[../07-Decisions/ADR-API-001.md|ADR-API-001]] (RESTful conventions)

---

## Debug Application Workflow

[[Debug Application.md|See detailed workflow]]

**Summary:**
1. Report issue (what happened, what was expected)
2. Reproduce the bug (confirm it's consistent)
3. Investigate (logs, code, tests)
4. Create fix
5. Write test to verify fix (regression prevention)
6. Code review
7. Deploy and verify

---

## Deploy Service Workflow

[[Deploy Service.md|See detailed workflow]]

**Summary:**
1. Prepare release (version number, changelog, migration plan)
2. Tag in Git
3. Build Docker image
4. Run tests in container
5. Deploy to staging
6. Health checks + smoke tests
7. Deploy to production (with rollback plan)
8. Monitor for issues
9. Document in retrospective

---

## When to Create a New Workflow

Create a new workflow if:
- You find yourself repeatedly doing the same sequence of steps
- The sequence involves multiple roles
- There are decision points where humans need to approve
- The process needs to be standardized across the team

To create a new workflow:
1. Use [[../Templates/Workflow.md|Workflow template]]
2. Define purpose, roles, steps, gates, standards
3. Walk through 1-2 examples
4. Get feedback from relevant roles
5. Add to this README

---

## Workflow Anatomy

```markdown
# [Workflow Name]

## Purpose
[What problem does this workflow solve?]

## When to Use
[Phase, scenario, triggers]

## Roles Involved
[Architect, Backend, DevOps, humans?]

## Steps
1. [Step 1] (Owner: Role)
2. [Step 2] (Owner: Role)
   - Human gate: [Decision point]
   - Expected: [What should happen]
3. [Continue...]

## Success Criteria
[How do you know this worked?]

## Related
- Standards: [which apply]
- ADRs: [which govern]

## Example
[Walk through one complete scenario]
```

---

## Cross-References

- **Related Standards:**
  - [[../01-Standards/Coding Standards.md|Coding Standards]] (code quality gates)
  - [[../01-Standards/Security Standards.md|Security Standards]] (security gates)
  - [[../01-Standards/Architecture Standards.md|Architecture Standards]] (design gates)
  - [[../01-Standards/Documentation Standards.md|Documentation Standards]] (documentation gates)

- **Related ADRs:**
  - [[../07-Decisions/ADR-PROC-001.md|ADR-PROC-001]] (if modifying this workflow)
  - [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]] (approval tiers)
  - [[../07-Decisions/ADR-API-001.md|ADR-API-001]] (for Build API workflow)

- **Related Prompts:**
  - [[../05-Prompts/Architect.md|Architect]] (design phase)
  - [[../05-Prompts/Backend.md|Backend]] (implementation phase)
  - [[../05-Prompts/DevOps.md|DevOps]] (deployment phase)

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../01-Standards/README.md|Standards Navigator]]
