---
type: Reference
phase: 3
status: Active
authority: facts
chroma_collection: global-standards
tags: [requirements, management, structure, workflow]
related: [Business Requirements, Functional Requirements, Non-Functional Requirements]
last_updated: 2026-06-07
---

# Requirements Management

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS Dashboard]]

---

## Overview

Requirements capture **WHAT** the system must do and **WHY**. They are the north star for all development work, driving:

- **Architectural Decisions** — Which ADRs are needed to satisfy these requirements?
- **Implementation Workflows** — How do we build features that meet these requirements?
- **Verification Gates** — How do we prove a requirement is satisfied?
- **Phase Completion** — Requirements fulfilled = phase complete

---

## Requirement Types

### Business Requirements (BR)
**Purpose:** Answer "Why are we building this?"

- Focus on **business value**, **user benefit**, **strategic alignment**
- Define the **problem** the system solves
- Establish **success criteria** from a business perspective
- Examples: BR-001 (Force Multiplier), BR-002 (Knowledge Preservation), BR-003 (Human Authority)

### Functional Requirements (FR)
**Purpose:** Answer "What must the system do?"

- Define **capabilities** and **features**
- Specify **system behavior** in response to user actions
- Outline **workflows** and **data flows**
- Examples: FR-001 (Context Assembly), FR-002 (Fact/Session Separation), FR-003 (Verification Before Implementation)

### Non-Functional Requirements (NFR)
**Purpose:** Answer "How must the system behave?"

- Define **quality attributes** (performance, reliability, security, maintainability, usability)
- Specify **constraints** (cost, resources, compatibility)
- Establish **operational requirements**
- Examples: NFR-001 (Local First), NFR-002 (Cost Visibility), NFR-003 (Reproducibility)

---

## Current Requirements for AI Software Factory

### Business Requirements
| ID | Title | Priority | Status |
|---|---|---|---|
| BR-001 | Force Multiplier for Solo Developer | Must Have | Approved |
| BR-002 | Knowledge Preservation | Must Have | Approved |
| BR-003 | Human Authority Preserved | Must Have | Approved |

**See:** [[AI Software Factory/Business Requirements|Full Business Requirements]]

### Functional Requirements
| ID | Title | Priority | Status |
|---|---|---|---|
| FR-001 | Context Assembly | Must Have | Draft |
| FR-002 | Fact and Session Separation | Must Have | Draft |
| FR-003 | Verification Before Implementation | Must Have | Draft |

**See:** [[AI Software Factory/Functional Requirements|Full Functional Requirements]]

### Non-Functional Requirements
| ID | Title | Priority | Status |
|---|---|---|---|
| NFR-001 | Local First | Must Have | Approved |
| NFR-002 | Cost Visibility | Must Have | Draft |
| NFR-003 | Reproducibility | Must Have | Draft |

**See:** [[AI Software Factory/Non-Functional Requirements|Full Non-Functional Requirements]]

---

## Current Requirements for Project Build Pipeline

### Business Requirements
| ID | Title | Priority | Status |
|---|---|---|---|
| BR-PBP-001 | Seamless End-to-End Project Creation | Must Have | Approved |
| BR-PBP-002 | Human Authority at Commit Boundaries | Must Have | Approved |
| BR-PBP-003 | Universal + Project-Specific Governance | Must Have | Approved |
| BR-PBP-004 | Knowledge Compounds Across Projects | Must Have | Approved |
| BR-PBP-005 | Human + AI Readable at Every Layer | Must Have | Approved |

**See:** [[Project Build Pipeline/Business Requirements|Full Business Requirements]]

### Functional Requirements
| ID | Title | Priority | Status |
|---|---|---|---|
| FR-PBP-001 | Structured Discovery Interview | Must Have | Approved |
| FR-PBP-002 | Project-Specific Rulebook Capture | Must Have | Approved |
| FR-PBP-003 | Autonomous Technology Research | Must Have | Approved |
| FR-PBP-004 | Paid API and Cost Gate | Must Have | Approved |
| FR-PBP-005 | AI-Recommended Phase Plan | Must Have | Approved |
| FR-PBP-006 | File Structure Scaffold | Must Have | Approved |
| FR-PBP-007 | Autonomous Phased Implementation | Must Have | Approved |
| FR-PBP-008 | Self-Healing Blocker Escalation | Must Have | Approved |
| FR-PBP-009 | Completion Verification | Must Have | Approved |
| FR-PBP-010 | Diff Summary + Decision Log | Must Have | Approved |
| FR-PBP-011 | Deployable Output | Must Have | Approved |
| FR-PBP-012 | Post-Build Vault Record | Must Have | Approved |

**See:** [[Project Build Pipeline/Functional Requirements|Full Functional Requirements]]

### Non-Functional Requirements
| ID | Title | Priority | Status |
|---|---|---|---|
| NFR-PBP-001 | Autonomous Execution with Bounded Escalation | Must Have | Approved |
| NFR-PBP-002 | Phase Checkpoint Integrity | Must Have | Approved |
| NFR-PBP-003 | Dual Readability (Human + AI) | Must Have | Approved |
| NFR-PBP-004 | Cost and Paid API Transparency | Must Have | Approved |
| NFR-PBP-005 | Reusability Detection Coverage | Should Have | Draft |
| NFR-PBP-006 | Post-Ship Health Monitoring | Should Have | Draft |
| NFR-PBP-007 | Technology Agnosticism | Must Have | Approved |

**See:** [[Project Build Pipeline/Non-Functional Requirements|Full Non-Functional Requirements]]

---

## Requirement Lifecycle

### 1. Draft
- Initial definition written, not yet reviewed
- May lack complete acceptance criteria
- Not binding; subject to change during review

### 2. Approved
- Reviewed and accepted by stakeholders
- All acceptance criteria defined
- Drives implementation planning
- Listed in roadmap/phase deliverables

### 3. Implemented
- Code changes complete
- Feature integrated into main branch
- Ready for verification

### 4. Verified
- Acceptance criteria tested and confirmed
- Feature deployed or ready for deployment
- Requirement is satisfied

---

## Requirement Template

Each requirement follows this structure:

```markdown
# [Requirement ID] — [Short Title]

Type: Business | Functional | Non-Functional
Priority: Must Have | Should Have | Nice to Have
Status: Draft | Approved | Implemented | Verified

## Description

Clear, concise explanation of what is required. Why is it important?

## Acceptance Criteria

Specific, testable, measurable criteria that prove the requirement is satisfied.

- Criterion 1
- Criterion 2
- Criterion 3

## Related ADRs

Link to architectural decisions that enable this requirement.

- [[ADR-ARCH-001]] — provides the pipeline
- [[ADR-DATA-001]] — provides the data structure

## Related Standards

Link to standards this requirement must comply with.

- [[Architecture Standards]] — design principles
- [[Security Standards]] — security constraints
```

**Use the template:** [[../Templates/Requirements.md|Requirement Template]]

---

## Traceability: Requirements ↔ ADRs ↔ Standards

Requirements are **authoritative** — they drive architectural decisions. Every requirement should trace to at least one ADR explaining HOW it will be satisfied.

### Example: BR-001 (Force Multiplier)

```
BR-001: Force Multiplier for Solo Developer
  ↓
  Enabled by:
  - ADR-ARCH-001: Knowledge-First Pipeline (context assembly)
  - ADR-DATA-001: Facts/Sessions Separation (fast retrieval)
  - ADR-INT-001: MCP Server Integration (tool access)
  ↓
  Constrained by:
  - Architecture Standards (modularity, versioning)
  - Security Standards (no unauthorized agent actions)
  ↓
  Verified by:
  - Workflow: New Project (can agents work autonomously?)
  - Workflow: Build API (can context be assembled quickly?)
```

---

## Requirement Phasing

### Phase 3 (Current): Application Builder Framework
- 9 initial requirements for the AI Software Factory system itself
- Foundation for all subsequent phases
- Focus on **knowledge system**, **governance**, **human authority**, **reproducibility**

### Future Phases: Subsystem Requirements
As we implement the Application Builder, each phase will define additional requirements for its subsystems:

- **Phase 4**: Fact vs. Session Separation requirements
- **Phase 5**: Chroma Integration requirements
- **Phase 6**: Context Builder requirements
- **Phase 7**: Skills System requirements
- **Phase 8**: Verification Layer requirements
- **Phase 9**: Prompt Versioning & Performance requirements
- **Phase 10**: Review Pipeline & Observability requirements
- **Phase 11**: Known Problems KB requirements
- **Phase 12**: Advanced MCP Integration requirements
- **Phase 13**: Multi-Agent Collaboration requirements

Each will follow the same structure: Business → Functional → Non-Functional.

---

## Adding New Requirements

### Step 1: Determine Requirement Type
- Is it about **business value**? → Business Requirement
- Is it about **what the system does**? → Functional Requirement
- Is it about **how it behaves**? → Non-Functional Requirement

### Step 2: Create File or Add Section
- If starting a **new project**: create `/AI Software Factory/Business Requirements.md`, etc.
- If adding to **existing project**: add section to appropriate file
- If starting a **new phase**: create `/[Phase Name]/[Requirement Type].md`

### Step 3: Write the Requirement
1. Use the [[../Templates/Requirements.md|template]]
2. Choose an **ID** following convention (BR-004, FR-004, NFR-004, etc.)
3. Write clear **description** (why, what problem does it solve?)
4. Define **acceptance criteria** (how do we know it's satisfied? Be specific and testable)
5. Link to **related ADRs** (which decisions enable this?)
6. Link to **related standards** (which constraints apply?)
7. Set **status** to "Draft"

### Step 4: Review and Approval
1. Get **stakeholder feedback** (in this project: you review)
2. Update **acceptance criteria** based on feedback
3. Link to any **new ADRs** that were created to support this requirement
4. Change **status** to "Approved"

### Step 5: Track Implementation
1. Create **implementation tasks** (what code changes are needed?)
2. Update **Roadmap.md** to reflect this in phase deliverables
3. Change **status** to "Implemented" when code merged
4. Change **status** to "Verified" when acceptance criteria tested

---

## Requirement Versioning and Deprecation

Requirements are **permanent** (authority: facts), but they can be deprecated:

### When to Deprecate
- Requirement is superseded by a newer requirement
- Business need changed
- Feature removed from scope

### How to Deprecate
1. Add "DEPRECATED" flag to status (e.g., `Status: Deprecated`)
2. Add "Superseded by" field pointing to replacement requirement
3. Keep historical record (don't delete)
4. Remove from active phase deliverables
5. Update related ADRs to reflect change

Example:
```markdown
## BR-001 — Force Multiplier (DEPRECATED)

Status: Deprecated
Superseded by: BR-001-v2 (with revised scope)
```

---

## Integration with Workflows

Requirements flow into the **New Project Workflow**:

```
Phase 1: New Project Workflow
  Step 1: Create project folder and Overview.md
  Step 2: Write Requirements (Business, Functional, Non-Functional)
  Step 3: Design Architecture (following requirements + standards)
```

Workflow steps check: "Are requirements addressed?" before proceeding.

---

## Chroma Integration

Requirements are indexed as **facts** in Chroma:

```yaml
chroma_collection: ai-software-factory-facts
authority: facts
```

This enables agents to:
- Query: "What are the business requirements for the AI Software Factory?"
- Find related requirements by semantic similarity
- Link requirements to implementation tasks

---

## Best Practices

### DO ✅
- Write requirements **before** implementation (design from requirements)
- Make acceptance criteria **specific and testable** (measurable)
- Link each requirement to **at least one ADR** (traceability)
- Update **status** as requirement progresses through lifecycle
- Include **constraints** in requirements (security, performance, cost, etc.)
- Review requirements **before major phases** (gate phase completion)

### DON'T ❌
- Write vague requirements ("the system should be fast")
- Create requirements **after** implementation (re-documenting code)
- Leave requirements in "Draft" status indefinitely
- Create requirements with **no acceptance criteria** (untestable)
- Orphan requirements (no links to ADRs, standards, or workflows)
- Change **Approved** requirements without stakeholder review

---

## FAQ

### Q: How many requirements should we have?
**A:** Enough to fully specify the system, but not so many you can't manage them. Start with 3 BRs, 3 FRs, 3 NFRs per phase. Expand as needed.

### Q: Who approves requirements?
**A:** You do (solo developer project). In a team, product managers or stakeholders would approve.

### Q: Can requirements change?
**A:** Yes, but only in Draft status. Once Approved, changes should go through review. Prefer creating new versioned requirements (BR-001-v2) over modifying approved ones.

### Q: How do we measure requirement satisfaction?
**A:** Through **acceptance criteria**. If all acceptance criteria are verified, requirement is satisfied.

### Q: What's the relationship between requirements and ADRs?
**A:** Requirements define WHAT. ADRs explain HOW and WHY. Every requirement should link to at least one ADR that enables it.

### Q: Can a requirement be on multiple projects?
**A:** Yes, cross-project requirements can be stored in `09-Requirements/Global/` and linked from multiple projects.

---

## See Also

- [[../04-Workflows/New Project|New Project Workflow]] — mentions "write requirements" as step 2
- [[../01-Standards/Architecture Standards|Architecture Standards]] — requirements must align with architecture principles
- [[../Templates/Requirements.md|Requirements Template]] — use this to create new requirements
- [[../07-Decisions/ADR-ARCH-001|ADR-ARCH-001]] — Knowledge-First Pipeline (requirements feed the pipeline)

---

**Last Updated:** 2026-06-07  
**Status:** Active  
**Version:** 1.0
