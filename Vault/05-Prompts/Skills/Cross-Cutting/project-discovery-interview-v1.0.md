---
type: Skill
name: "project-discovery-interview"
version: "1.0"
phase: 17
status: Active
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, discovery, requirements, interview, pre-build, cross-cutting]
related: [Project-Discovery.md, Phase-3-Requirements-Management.md, ADR-ARCH-001]
created_date: 2026-06-10
created_by: Claude
validation_status: Draft
maintenance_owner: Human
next_review_date: 2026-09-10
last_updated: 2026-06-10
---

# Skill: Project Discovery Interview v1.0

**Skill ID:** project-discovery-interview-v1.0  
**Domain:** Cross-Cutting  
**Status:** Active  
**Complexity:** Low-Medium

---

## Problem Statement

Use this skill when a new project or major feature needs to be defined before building begins. Unstructured requirements lead to wasted development, misaligned expectations, and rework. This skill provides a repeatable interview protocol that surfaces every requirement, assumption, constraint, and risk before a single line of code is written.

---

## Trigger Examples

Use this skill for requests like:

- "Interview me about a new project"
- "Help me define requirements before we start building"
- "I want to build X — what do you need to know?"
- "Requirements gathering for a new feature"
- "Before we start, let's figure out what we're building"
- "Discovery session for a new project"
- "Help me think through what I actually need"

---

## Required Inputs

Before starting, identify:

- Project name or working title (can be tentative)
- Whether any existing requirements exist in `Vault/09-Requirements/`
- Whether any architectural constraints already apply (check Vault for prior ADRs)

If no inputs provided: start with the opening question and gather everything from scratch.

---

## Interview Protocol

### Step 1: Opening (Single Question)

Ask only one question to start:

> "Tell me about the project — what problem are you trying to solve and why now?"

Listen fully. Analyze the answer for what it implies and what it leaves unresolved before asking the next question.

### Step 2: Progressive Drill-Down

Work through these areas in order. Ask one focused group per turn. Wait for answers before continuing.

**Vision**
- What problem is this solving?
- Why build this instead of using an existing tool?
- What does success look like in 6 months?
- Who is the primary beneficiary?

**Users**
- Who are the users? (Internal team, public, specific personas?)
- What is their technical skill level?
- How many users initially? Expected growth?
- What devices/environments will they use?

**Functionality**
For each proposed feature, ask all of:
- What should happen when X?
- What should explicitly NOT happen?
- Why is this feature needed?
- Is it required for launch or optional?
- What edge cases exist?

**User Experience**
- How should it look and feel?
- What existing products should it resemble?
- Present options: "Option A: [description]. Option B: [description]. Which direction and why?"
- Minimalist/fast vs. feature-rich/customizable?

**Technical Decisions**
- Preferred programming language or framework? (If none: present options with tradeoffs)
- Database: relational, document, vector, or none?
- Deployment: local, cloud, self-hosted, SaaS?
- Authentication: required? Which method?
- External integrations or APIs needed?

**Automation Opportunities**
For any repetitive workflow identified: "Would you like this automated?"
Always suggest existing tools (MCPs, APIs, open-source) before recommending custom code.

**Constraints**
- Timeline or deadline?
- Budget range?
- Hosting or infrastructure requirements?
- Licensing restrictions?
- Security or compliance requirements?
- Maintenance expectations (who maintains it long-term)?

**Future Growth**
- What features might be added in 6-12 months?
- What scale should the architecture anticipate?
- Are there known integrations that will be needed later?

### Step 3: Requirement Validation

After covering all areas, summarize current understanding:

> "Here is what I understand so far:
> **Goals:** [summary]
> **Features:** [list]
> **Constraints:** [list]
> **Assumptions:** [list]
> **Open Questions:** [list]
> Does this accurately capture what you're building? What needs to be corrected?"

### Step 4: Gap Detection

Before finalizing, actively check for:

- Missing requirements (features implied but not stated)
- Conflicting requirements (two requirements that can't both be true)
- Unrealistic expectations (timeline, budget, or technical feasibility)
- Technical risks (dependencies, third-party reliance, scalability concerns)
- Undocumented assumptions (things the user takes for granted but haven't been stated)

Flag each one explicitly and ask a clarifying question.

### Step 5: Completion Check

Do NOT produce the spec until all of these are true:

- [ ] Project scope is fully understood
- [ ] All requirements have been validated by the user
- [ ] All assumptions have been confirmed or refuted
- [ ] Major design decisions (tech stack, architecture approach) are resolved or deferred with a documented reason
- [ ] All open questions have been answered or explicitly flagged as out-of-scope

---

## Output Template

```markdown
# Project Specification — [Project Name]
**Date:** [YYYY-MM-DD]
**Status:** Draft

---

## Goals
[Primary objectives and success criteria]

## Users
| Persona | Description | Technical Level | Scale |
|---------|-------------|-----------------|-------|

## Functional Requirements
| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| FR-001 | | | Must Have |

## Non-Functional Requirements
| ID | Requirement | Metric | Priority |
|----|-------------|--------|----------|
| NFR-001 | | | |

## Business Requirements
| ID | Requirement | Rationale |
|----|-------------|-----------|
| BR-001 | | |

## Architecture Recommendations
[High-level approaches with tradeoffs — not final decisions]

## Suggested Tools and Integrations
[Existing tools, MCPs, APIs, open-source to leverage]

## Development Roadmap
| Phase | Features | Priority |
|-------|----------|----------|

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|

## Open Issues
[Unresolved questions requiring stakeholder input before proceeding]

## Assumptions
[Explicitly stated assumptions that were confirmed during discovery]
```

Save to: `Vault/09-Requirements/[Project Name]/Project-Spec.md`

---

## Quality Bar

The discovery session is successful when:

- The specification is specific enough that two different developers could build the same system from it
- No requirement contradicts another
- Every feature has an acceptance criterion
- All technology recommendations include tradeoffs (not just a single answer)
- Existing tools were researched before proposing custom builds
- The user has explicitly confirmed the spec is accurate

---

## Related Skills

- [[../Cross-Cutting/ai-software-factory-audit-v1.0.md]] — Use after discovery to audit project health
- [[../Cross-Cutting/project-guardian-v1.0.md]] — Use for ongoing health monitoring after the project is built
