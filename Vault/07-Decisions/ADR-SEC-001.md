# ADR-SEC-001: Human Approval Gate Requirements

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 2 — Knowledge System Development  
**Category:** Security (SEC)

---

## Decision

Certain actions require explicit human approval before execution. These gates preserve human authority and prevent autonomous agents from making irreversible decisions.

We define and formalize:
1. **What actions require approval** (scope of human authority)
2. **Who can approve** (approval authority)
3. **What "irreversible" means** (when gates apply)
4. **How agents must flag decisions** (implementation pattern)

---

## Context

The Application Builder Framework uses 8 specialized AI agents (Architect, Backend, Frontend, QA, Security, DevOps, Documentation, Verification) for rapid development. Agents have distinct capabilities and authority levels.

However, not all decisions should be automated. Some decisions are:
- **Irreversible:** Cannot be easily undone (database migrations, production deployments)
- **Policy-affecting:** Change how the system works (authentication systems, security rules)
- **Cross-cutting:** Affect multiple projects or teams
- **Risk-bearing:** Could cause outages, data loss, or security breaches

**Decision 3 in DECISIONS.md:** "Human Authority Preserved" — states that human judgment is final authority and agents operate with delegated, constrained authority.

This ADR operationalizes that principle by defining explicit approval gates.

---

## Rationale

### Why Human Approval is Necessary

**Irreversible changes:**
- Database schema changes cannot be undone without data loss
- Pushing to production cannot be rolled back instantly
- Deleting files removes them from Git history
- Changing authentication systems affects all users

**Expertise requirement:**
- Security decisions require threat modeling (human judgment)
- Architecture decisions require business context (human knowledge)
- Escalations require human decision-making (agents can only escalate)

**Accountability:**
- Humans are accountable for decisions (in regulated industries, legally)
- Agents are tools; they cannot be held responsible for outcomes
- Approval creates audit trail: who approved, when, why

**Risk management:**
- Agents can recommend; humans decide
- Humans have broader context (business, legal, user impact)
- Humans can weigh trade-offs (cost vs. speed, risk vs. benefit)

---

## Approval Gate Definitions

### Tier 1: No Approval Required (Agents can execute)

**Code changes to non-critical files:**
- Feature implementation in isolated branches
- Bug fixes (non-security)
- Documentation updates (stubs, examples, session notes)
- Test additions
- Refactoring (same behavior, different implementation)

**Reasoning:** Can be reviewed async; easily reverted

**Agent authority:** Backend, Frontend, Documentation agents can work autonomously

---

### Tier 2: Code Review Only (Human reviews before merge)

**Code changes to critical systems:**
- API changes (especially breaking changes)
- Authentication/authorization logic
- Security-related code
- Business logic with high impact
- Dependency additions

**Process:**
1. Agent: Write code on feature branch
2. Agent: Create PR with detailed explanation (why, not what)
3. Human: Review for correctness, security, alignment with standards
4. Human: Approve and merge

**Turnaround:** 24-48 hours for review  
**Agent authority:** All agents, with human review gate

---

### Tier 3: Approval Required Before Implementation (Agent proposes, human decides)

**Architecture decisions:**
- Technology selection (new language, framework, database)
- Service boundary changes (adding/removing services)
- API versioning strategy changes
- Authentication system changes

**Process:**
1. Agent: Design proposal with trade-offs and risk assessment
2. Agent: Link to relevant ADRs, standards, and decisions
3. Human: Review design; ask clarifying questions
4. Human: Approve, request changes, or reject
5. Agent: Implement approved design

**Turnaround:** 1-2 hours for decision  
**Gate:** Cannot implement until human approval  
**Documentation:** Decision recorded in ADR

**Example ADRs:**
- [[ADR-ARCH-001]] — Knowledge-First Pipeline Design
- [[ADR-API-001]] — RESTful API Design Conventions
- [[ADR-INT-001]] — MCP Server Integration Policy

---

### Tier 4: Human-Only Decisions (Agents flag, humans execute)

**Strategic and policy decisions:**
- Changing governance documents (CLAUDE.md, WORKFLOW.md)
- Changing approval gates or decision authority
- Security policy changes
- Major infrastructure changes (new regions, cloud providers)
- Public API deprecations (affects external clients)
- Headcount or resource allocation
- Feature prioritization or roadmap changes

**Process:**
1. Agent: Flag for human decision; provide analysis and recommendations
2. Agent: Cannot execute; waits for human decision
3. Human: Decide; may ask agent for additional analysis
4. Human: Document decision in DECISIONS.md or ADR

**Turnaround:** 2-4 hours (human decision required)  
**Agent authority:** Cannot execute; can only recommend  
**Documentation:** Decision recorded; rationale explained

**Examples that require Tier 4 approval:**
- Deciding to switch from PostgreSQL to MongoDB (architecture impact)
- Changing authentication from JWT to OAuth everywhere (system-wide impact)
- Deprecating an API version (affects external users)
- Changing security standards (affects all code)

---

### Tier 5: Irreversible Operations (Highest approval bar)

**Operations that cannot be undone:**
- Database migrations to production (schema changes affect data)
- Force-pushing to main branch (rewrites Git history)
- Deleting Vault entries (removes historical knowledge)
- Removing published API versions (breaks external clients)
- Deploying to production (no rollback possible for stateful changes)

**Process:**
1. Agent: Prepare operation with rollback plan
2. Agent: Flag for human approval with detailed impact analysis
3. Human: Review impact, rollback plan, and risk
4. Human: Approve with explicit confirmation
5. Human: Execute or explicitly authorize agent to execute
6. Human: Document approval and reasoning

**Approval bar:** Highest — must be confident in impact assessment  
**Turnaround:** 2-4 hours  
**Documentation:** Approval recorded; audit trail maintained  
**Rollback:** Human must have documented rollback plan before approval

**Examples:**
- Database migrations that delete columns (data loss risk)
- Production deployments of untested features (outage risk)
- Revoking security credentials (access loss risk)

---

## Implementation Pattern: How Agents Flag Decisions

### For Tier 2+ Decisions, agents must:

**1. Identify the tier:**
```python
# In PR description or proposal
APPROVAL_TIER: 3  # Architecture decision
DECISION_TYPE: Technology Selection
IMPACTED_SYSTEMS: [Database, API, DataAccess]
```

**2. Provide rationale:**
```markdown
## Decision
Use PostgreSQL for primary fact storage

## Why This Tier?
- Technology selection (Tier 3)
- Affects data layer architecture
- Long-term commitment (6+ months)
- Alternatives exist (MongoDB, DynamoDB)

## Options Considered
1. PostgreSQL (RECOMMENDED): ACID guarantees, mature, team experienced
2. MongoDB: Flexible schema, but eventual consistency unsuitable
3. DynamoDB: AWS lock-in, cost concerns

## Trade-offs
PostgreSQL requires schema migrations (overhead), but provides consistency guarantees (benefit)
```

**3. Link to standards and decisions:**
```markdown
## Related
- [[Coding Standards]] - Database patterns section
- [[Security Standards]] - Data classification
- [[ADR-ARCH-001]] - Architecture pipeline
- [[DECISIONS.md]] - Technology selection process
```

**4. Estimate impact and risk:**
```markdown
## Impact Analysis
- Scope: Data layer only; API layer unaffected
- Effort: 2 weeks implementation
- Risk: Medium (schema migrations require careful planning)
- Timeline: Can start Phase 3

## Risk Mitigation
- Automated migration testing
- Rollback procedure documented
- Team training on PostgreSQL patterns
```

**5. Wait for approval:**
```markdown
## Approval Status
⏳ AWAITING HUMAN APPROVAL
Flagged: 2026-06-07 14:30 UTC
Estimated turnaround: 2 hours
```

---

## Approval Authority

**Human (Project Owner/Lead):**
- All Tier 2 decisions (code review)
- All Tier 3+ decisions (approval gates)
- Highest authority on Tier 4-5 decisions

**Architect Agent (Phase 5+):**
- Can advise on architecture decisions
- Can evaluate trade-offs
- Cannot approve; must escalate to human

**Security Agent (Phase 2+):**
- Can flag security concerns
- Can recommend security standards updates
- Cannot approve security policies; must escalate

---

## When Approval Gates Apply

### During Planning Phase (EnterPlanMode)
- Proposals for Tier 3+ decisions must be approved before planning
- User explicitly approves approach with AskUserQuestion

### During Implementation Phase
- Code changes follow their tier gate (Tier 2 = review, Tier 3+ = approval required)
- Agent flags tier in PR/proposal
- Human approves before merge/implementation

### During Validation Phase
- Verify all Tier 4-5 operations have documented approval
- Audit trail shows who approved, when, with what reasoning

---

## Escalation Path

When agents encounter decisions beyond their authority:

```
Agent encounters decision → Identify tier → Flag for human

Tier 2 (Code review):
  Agent → Create PR → Human reviews → Merge

Tier 3 (Approval required):
  Agent → Proposal + analysis → Human decides → Implement

Tier 4 (Human-only):
  Agent → Flag + recommendations → Human decides → Human executes

Tier 5 (Irreversible):
  Agent → Full impact analysis + rollback plan → Human approves explicitly → Human executes
```

---

## Related Standards

[[Security Standards]] — Gate enforcement, agent-specific security rules  
[[Architecture Standards]] — Technology selection process  
[[Coding Standards]] — Code review standards

---

## Related Decisions

**Decision 1:** Knowledge-First Architecture — [[ADR-ARCH-001]]  
**Decision 2:** Facts/Sessions Separation — [[ADR-DATA-001]]  
**Decision 3:** Human Authority Preserved — This ADR (ADR-SEC-001)  
**Decision 6:** ADR Categories — [[ADR-PROC-001]] (future)  
**Decision 7:** 8 Agent Roles — [[AI_SKILLS.md]] (agent capabilities inventory)

---

## Implementation Timeline

- **Phase 2 (Now):** ADR-SEC-001 written; approval gates documented
- **Phase 3:** Code review standards activated (Tier 2 gates enforced)
- **Phase 5:** Verification Agent validates all approvals are recorded
- **Phase 8+:** Audit logs automatically track approval tier compliance

---

## Consequences

### Positive
✅ Human authority preserved; agents cannot make irreversible mistakes  
✅ Clear escalation path when agents encounter decisions beyond scope  
✅ Audit trail documents all major decisions and approvals  
✅ Agents focus on work within authority; humans focus on strategy  
✅ Reduces risk of autonomous system failures  

### Negative
❌ Adds latency to decisions (humans must review)  
❌ Requires human availability (blocks agent work if human unavailable)  
❌ Possible approval bottleneck if human approval slow  
❌ Agents may over-escalate (submit Tier 2 decisions as Tier 4)  

### Mitigations
- Approval guidelines are clear (agents trained on tiers)
- Human availability documented (SLA for approval response)
- Tier escalation discouraged (agent authority documented in [[AI_SKILLS.md]])
- Asynchronous approval where possible (PR review doesn't require sync communication)

---

## Approval

- ✅ **Reviewed by:** User (Planning Phase)
- ✅ **Approved by:** User (AskUserQuestion approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-07

---

## Revision History

**v1.0 (2026-06-07):** Initial ADR formalizing Decision 3 (Human Authority Preserved)
- Defined 5 approval tiers
- Documented escalation path
- Specified implementation pattern

---

**Last Updated:** 2026-06-07  
**Next Review:** Phase 5 (when verification automation begins)
