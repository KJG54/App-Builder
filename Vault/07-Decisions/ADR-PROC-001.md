---
type: Decision
phase: 2
status: Accepted
authority: facts
chroma_collection: global-standards
tags: [process, adr-workflow, governance, documentation]
related: [ADR-ARCH-001, Documentation Standards]
last_updated: 2026-06-07
---

# ADR-PROC-001: ADR Authoring and Review Workflow

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 2 — Knowledge System Development  
**Category:** Process (PROC)

---

## Decision

All Architectural Decision Records (ADRs) must follow a standardized authoring and review workflow to ensure quality, consistency, and traceability. The workflow is:

1. **Identification:** Determine if decision requires ADR
2. **Draft:** Author ADR using standard template
3. **Review:** Human review and feedback
4. **Approval:** Explicit approval by project lead
5. **Publication:** Commit to Vault; link from DECISIONS.md

---

## Context

### The Problem: Inconsistent Documentation

Without a structured ADR workflow, decisions are documented inconsistently:
- Some decisions lack context or rationale
- Alternatives not considered or documented
- Decisions isolated (not linked to related ones)
- No clear approval status
- Hard to track which decisions are still active

### Why Workflow Matters

ADRs are **institutional memory**. They preserve:
- **Why** decisions were made (not just what)
- **Alternatives** considered and rejected
- **Reasoning** behind choices
- **Consequences** and tradeoffs
- **Timeline** (when decision was made)

A consistent workflow ensures:
- Quality (human review catches issues)
- Traceability (who approved, when)
- Consistency (all ADRs use same structure)
- Discoverability (indexed in DECISIONS.md and Chroma)

---

## ADR Identification

### When ADRs Are Required

**Requires ADR:**
- Major architectural changes (service boundaries, tech stack)
- Technology selection (language, framework, database, cloud)
- API design strategy changes
- Authentication/authorization system changes
- Database strategy changes
- Infrastructure strategy changes
- Cross-project standards
- Deployment strategy changes
- Security policy changes

**Does NOT require ADR:**
- Bug fixes (don't affect design)
- Code refactoring (same behavior, different implementation)
- Feature additions using existing patterns
- Documentation updates
- Test additions
- Performance optimizations within existing architecture

**Decision Matrix:**

| Scope | Reversibility | Examples | ADR? |
|-------|---------------|----------|------|
| Single module | Easy | Bug fix, refactor | No |
| Single service | Easy | Add feature (existing pattern) | No |
| Multiple services | Hard | New service, add dependency | Yes |
| System-wide | Irreversible | Tech stack, auth system | Yes |

---

## ADR Template

Use this template for all ADRs (based on [[ADR-INFRA-001]] precedent):

```markdown
# ADR-[CATEGORY]-[###]: [Title]

**Date:** YYYY-MM-DD  
**Status:** [Proposed | Accepted | Deprecated]  
**Phase:** [1-8] — [Phase Name]  
**Category:** [ARCH | SEC | DATA | API | INT | PROC | INFRA]

---

## Decision

One-paragraph decision statement. What was decided?

---

## Context

Background and situation that prompted the decision.

### Problem

What problem is this solving?

### Why This Matters

Why should we care about this decision?

---

## Rationale

Why is this the right choice?

---

## Alternatives Considered

### Alternative 1: [Name]

**Pros:**
- Benefit 1
- Benefit 2

**Cons:**
- Cost 1
- Cost 2

### Alternative 2: [Name]

**Pros:**
- Benefit 1

**Cons:**
- Cost 1

### Alternative 3: [Name] (CHOSEN)

**Pros:**
- Benefit 1
- Benefit 2

**Cons:**
- Cost 1

---

## Implementation

How will this decision be operationalized?

---

## Related Standards

Link to relevant standards:
- [[Security Standards]]
- [[Architecture Standards]]

---

## Related Decisions

Link to related ADRs:
- [[ADR-ARCH-001]]
- [[ADR-SEC-001]]

---

## Timeline

When will this be implemented?

---

## Consequences

### Positive

What good outcomes result from this decision?

### Negative

What challenges or costs result?

### Mitigations

How do we mitigate the negative consequences?

---

## Approval

- ✅ **Reviewed by:** [Name] (Role)
- ✅ **Approved by:** [Name] (Project Lead)
- ✅ **Status:** Accepted
- ✅ **Ratified:** YYYY-MM-DD

---

## Revision History

**v1.0 (YYYY-MM-DD):** Initial ADR
- Change 1
- Change 2

---

**Last Updated:** YYYY-MM-DD  
**Next Review:** [Phase #] (when [trigger])
```

---

## Authoring Workflow

### Step 1: Identify Decision

When you encounter a significant decision:
1. Ask: "Is this reversible and low-impact?"
   - Yes: Proceed without ADR
   - No: Continue to Step 2
2. Check: Does an ADR already exist for this?
   - Yes: Reference existing ADR
   - No: Create new ADR

### Step 2: Draft ADR

Author ADR following template above.

**Guidelines:**
- **Context:** Explain the problem, not just the solution
- **Alternatives:** Always consider 2-3 alternatives
- **Rationale:** Explain WHY this choice is best
- **Consequences:** Be honest about tradeoffs
- **Links:** Reference related standards and ADRs
- **Template:** Use standard format (consistency matters)

**File location:** `Vault/07-Decisions/ADR-[CATEGORY]-[###].md`

**Naming:**
- ADR-ARCH-001 (architecture decision #1)
- ADR-SEC-001 (security decision #1)
- ADR-DATA-001 (data decision #1)
- etc.

### Step 3: Request Review

1. Prepare ADR in working branch
2. Create Pull Request with ADR
3. Request human review (project lead)
4. PR description includes:
   - Why this decision matters
   - Summary of alternatives
   - Key rationale

**PR Template:**

```markdown
## ADR: [Title]

**What:**
[One-line decision]

**Why:**
[Why this decision matters]

**Alternatives:**
1. [Alt 1]: [Brief summary]
2. [Alt 2]: [Brief summary]
3. [Chosen]: [Brief summary]

**Key Concern:**
[What should reviewers focus on?]

**Related:**
- [[Related ADR 1]]
- [[Related Standard 1]]
```

### Step 4: Review Feedback

Human reviewer will check:
- [ ] Decision is significant (truly requires ADR)
- [ ] Context clearly explains the problem
- [ ] Alternatives are realistic and well-explained
- [ ] Rationale is sound and justified
- [ ] Consequences honestly described
- [ ] Related documents linked
- [ ] Status field reflects current state
- [ ] Format matches template
- [ ] Writing is clear and concise

**Reviewer may:**
- Request clarifications
- Suggest alternatives
- Reject ADR if insufficient justification
- Approve (move to Step 5)

### Step 5: Approval

Upon human approval:

1. **Update ADR:**
   - Set `Status: Accepted`
   - Set `Approved by: [Name]`
   - Set `Ratified: [Date]`

2. **Commit to main:**
   ```bash
   git commit -m "docs: ADR-ARCH-001 — Knowledge-First Pipeline Design"
   ```

3. **Link from DECISIONS.md:**
   - Add to relevant decision category
   - Format: `- Decision Title → [[ADR-ARCH-001]]`

4. **Link from related standards:**
   - Update cross-references in standards
   - Standards should reference ADRs that operationalize them

5. **Tag in Chroma:**
   - Add to `{project}-facts` collection
   - Metadata: `status: Accepted`, `is_authoritative: true`

---

## ADR Categories

**Defined categories and naming convention:**

| Category | Prefix | Examples |
|----------|--------|----------|
| Architecture | ARCH | Service design, API strategy, technology selection |
| Security | SEC | Authentication, approval gates, threat modeling |
| Data | DATA | Database strategy, Chroma schema, data models |
| Infrastructure | INFRA | Docker, deployment, cloud strategy |
| API | API | RESTful design, versioning, error handling |
| Integration | INT | MCP servers, third-party integrations |
| Process | PROC | ADR workflow, review process, naming conventions |

**Numbering:** Sequential within category (ADR-ARCH-001, ADR-ARCH-002, etc.)

---

## Quality Checklist

Before approving an ADR, verify:

- [ ] **Title is clear** — Describes decision, not rationale
- [ ] **Status is correct** — Proposed or Accepted
- [ ] **Category is appropriate** — Matches decision type
- [ ] **Context explains problem** — Not just the solution
- [ ] **Problem is clear** — Why does this matter?
- [ ] **Alternatives are realistic** — Not strawmen
- [ ] **Rationale is sound** — Logically justified
- [ ] **Consequences are honest** — Tradeoffs disclosed
- [ ] **Related links exist** — Standards and other ADRs
- [ ] **Timeline is clear** — When implemented?
- [ ] **Format matches template** — Consistency
- [ ] **Writing is clear** — No jargon or unclear terms
- [ ] **No confidential information** — Safe to commit to Git

---

## Common Mistakes

**❌ Missing alternatives:** ADR only describes chosen approach

**Fix:** Always list 2-3 alternatives with pros/cons

**❌ Unclear context:** Jumps to solution without explaining problem

**Fix:** Start with "What problem are we solving?" section

**❌ Weak rationale:** "We chose this because it's better"

**Fix:** Explain WHAT makes it better given the constraints

**❌ No links:** ADR stands alone, not linked to related work

**Fix:** Always reference related standards and other ADRs

**❌ Future tense:** "Status: Proposed" but no timeline for approval

**Fix:** Propose → Review → Approve within reasonable timeframe

**❌ Vague consequences:** "May have performance impact"

**Fix:** Quantify or explain specifically

---

## Deprecation and Removal

### When ADR Is Deprecated

If circumstances change and an ADR is no longer valid:

1. Create new ADR for the replacement decision
2. Update old ADR:
   - Set `Status: Deprecated`
   - Add note: "Replaced by [[ADR-ARCH-002]]"
   - Keep in history (don't delete)

3. Update DECISIONS.md:
   - Mark old decision as deprecated
   - Link to replacement

Example:

```markdown
### Decision 4: ~~PostgreSQL for All Data~~ [DEPRECATED]

**Status:** Deprecated (see [[ADR-DATA-002]] for replacement)

**Decision:** Use PostgreSQL for all data storage.

[Original content...]

---

**DEPRECATION NOTE (2026-09-01):**
This decision was superseded by [[ADR-DATA-002]] due to scaling requirements.
See migration plan in [[ADR-DATA-002]].
```

---

## Related Standards

[[Coding Standards]] — Code review patterns  
[[Documentation Standards]] — ADR format and storage  
[[Security Standards]] — Approval gates for decisions  
[[Architecture Standards]] — Technology selection process

---

## Related Decisions

**Decision 1:** Knowledge-First Architecture — [[ADR-ARCH-001]] (ADRs are core to this)  
**Decision 3:** Human Authority Preserved — [[ADR-SEC-001]] (ADR approval is a gate)

---

## Implementation Timeline

- **Phase 2 (Now):** ADR workflow established; template defined
- **Phase 3+:** All significant decisions documented in ADRs
- **Phase 5+:** Chroma indexing of ADRs (searchable by decision)

---

## Consequences

### Positive

✅ Decisions documented with full rationale (prevents "why did we choose X?" questions)  
✅ Consistent format (easy to scan and understand)  
✅ Traceability (who approved, when)  
✅ Alternatives preserved (can reconsider if circumstances change)  
✅ Knowledge asset (future projects learn from past decisions)  
✅ Reduced duplicate work (can reference prior reasoning)  

### Negative

❌ Overhead (writing ADRs takes time)  
❌ Discipline required (must consistently use workflow)  
❌ May slow decisions (approval step adds latency)  

### Mitigations

- Use template to reduce writing time
- Parallelize with work (ADR doesn't block implementation if in sync)
- Limit ADRs to significant decisions (not everything requires one)

---

## Approval

- ✅ **Reviewed by:** User (Planning Phase)
- ✅ **Approved by:** User (AskUserQuestion approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-07

---

## Revision History

**v1.0 (2026-06-07):** Initial ADR establishing workflow
- Defined ADR identification criteria
- Created standard template (based on [[ADR-INFRA-001]])
- Documented 5-step authoring and approval workflow
- Specified categories and naming convention
- Created quality checklist

---

**Last Updated:** 2026-06-07  
**Next Review:** Phase 4 (after first 3 months of ADR usage)
