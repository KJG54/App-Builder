---
type: Skill
name: "phase-plan-generator"
version: "1.0"
phase: 18
status: Active
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, planning, phase-plan, build-pipeline, cross-cutting]
related: [project-discovery-interview-v1.0.md, Project-Discovery.md, ADR-ARCH-001]
created_date: 2026-06-10
created_by: Claude
validation_status: Draft
maintenance_owner: Human
next_review_date: 2026-09-10
last_updated: 2026-06-10
---

# Skill: Phase Plan Generator v1.0

**Skill ID:** phase-plan-generator-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** Medium

---

## Problem Statement

Use this skill when a completed Project Specification (from `/discover`) needs to be converted into a phased implementation plan before building begins.

A phase plan translates requirements into executable, ordered phases — each with a clear goal, deliverables, dependencies, and a test plan. The human must approve the plan before any build phase begins. This is a mandatory gate between discovery and implementation.

---

## Trigger Examples

Use this skill for requests like:

- "Generate a phase plan for this project"
- "Turn the discovery spec into an implementation plan"
- "What phases should we build this in?"
- "Create a build plan from the requirements"
- "Plan the implementation before we start coding"

---

## Required Inputs

Before generating, locate:

1. **Project Specification** — `Vault/09-Requirements/[Project Name]/Project-Spec.md` (produced by `/discover`)
2. **Project Rules** — from the spec's "Project Rules" section
3. **Budget Ceiling** — from the spec's "Budget Ceiling" section
4. **Technology Stack** — from the spec's "Architecture Recommendations" or confirmed tech decisions
5. **Test Plan Summary** — from the spec's "Test Plan Summary" section

If the spec is missing required sections (budget ceiling, project rules, test plan summary), **stop and ask the user to complete discovery first** using `/discover`.

---

## Phase Plan Protocol

### Step 1: Analyze the Spec

Read the full Project Specification and extract:

- All Functional Requirements (FR)
- All Non-Functional Requirements (NFR)
- All Business Requirements (BR)
- Architecture constraints
- Dependencies between features
- Risk areas

### Step 2: Group Requirements into Phases

Group related requirements into cohesive phases. Apply these rules:

**Sequencing rules:**
- Foundation first (data models, infrastructure, auth) before features
- Higher-risk or higher-uncertainty work before low-risk work
- Each phase must produce something testable and demonstrable
- No phase should depend on a later phase
- Phase N's tests must pass before Phase N+1 begins

**Phase size rules:**
- Each phase should represent 2–8 hours of implementation work
- A phase that can be done in under 1 hour should be merged with its neighbor
- A phase that exceeds 12 hours should be split

**Mandatory first phase:**
Phase 1 always includes:
- Project scaffolding and tooling setup
- Core data models or schema
- Baseline test infrastructure

### Step 3: For Each Phase, Define

- **Goal** — one sentence describing the outcome
- **Deliverables** — specific files, endpoints, components, or capabilities created
- **Dependencies** — which prior phases must be complete
- **Test plan** — what gets tested at unit level, integration level, and what the acceptance criterion is
- **Estimated effort** — hours or range
- **Risk level** — Low / Medium / High, with brief rationale

### Step 4: Validate the Plan

Before presenting, check:

- [ ] All FR are covered by at least one phase
- [ ] All NFR have corresponding test or validation steps
- [ ] No circular dependencies between phases
- [ ] Phase 1 produces a testable artifact
- [ ] Each phase has a clear acceptance criterion
- [ ] Budget ceiling is respected across all phases (estimate cumulative cost)
- [ ] Project rules are honored (no prohibited technologies, output formats respected)

### Step 5: Present for Human Approval

Present the full phase plan and explicitly ask:

> "Does this plan accurately reflect what you want to build? Should any phases be merged, split, reordered, or removed before we begin?"

**Do NOT begin any implementation until the human explicitly approves the plan.**

---

## Output Template

```markdown
# Phase Plan — [Project Name]
**Date:** [YYYY-MM-DD]
**Based on spec:** Vault/09-Requirements/[Project Name]/Project-Spec.md
**Status:** Pending Approval

---

## Summary

| Phase | Goal | Effort | Risk |
|-------|------|--------|------|
| 1 | [one-line goal] | [hours] | Low/Med/High |
| 2 | | | |

**Total estimated effort:** [X–Y hours]  
**Budget ceiling:** [from spec]  
**Estimated API cost:** [if applicable]

---

## Phase 1: [Phase Name]

**Goal:** [One sentence — what this phase achieves]

**Deliverables:**
- [Specific file, endpoint, component, or capability]

**Dependencies:** None (first phase)

**Test Plan:**
- Unit: [what gets unit tested]
- Integration: [what gets tested end-to-end]
- Acceptance: [definition of done for this phase]

**Estimated effort:** [X hours]
**Risk:** Low / Medium / High — [one-line rationale]

---

## Phase 2: [Phase Name]

**Goal:** [One sentence]

**Deliverables:**
- [...]

**Dependencies:** Phase 1 complete (all tests passing)

**Test Plan:**
- Unit: [...]
- Integration: [...]
- Acceptance: [...]

**Estimated effort:** [X hours]
**Risk:** Low / Medium / High — [rationale]

---

[Repeat for each phase]

---

## Open Questions

[Any decisions that need to be made before implementation begins]

---

## Approval Gate

> ⚠️ Implementation does NOT begin until this plan is approved.
> Reply "approved" or suggest changes.
```

Save to: `Projects/[category]/[name]/Vault/03-Projects/[name]/Phase-Plan.md`

---

## Quality Bar

The phase plan is ready for approval when:

- All requirements from the spec are traceable to at least one phase deliverable
- Every phase has a clearly stated acceptance criterion
- The plan can be followed by a developer who has not read this conversation
- No phase is a "do everything else" catch-all
- The first phase produces a runnable, testable artifact
- Human approval is explicitly requested before any implementation begins

---

## Related Skills

- [[project-discovery-interview-v1.0.md]] — Discovery must complete before this skill runs
- [[project-guardian-v1.0.md]] — Use after build to audit the completed project
- [[ai-software-factory-audit-v1.0.md]] — For auditing the framework itself
