# Standards Navigator

**See also:** [[../INDEX.md|Vault INDEX]] | [[../STATUS.md|STATUS]]

---

## Overview

This folder contains **4 governance standards** that apply to all projects in the Application Builder Framework. Standards are the rules everyone follows to ensure consistency, quality, and maintainability.

**Reading Order:** Architecture → Security → Coding → Documentation

---

## The 4 Standards

### 1. [[Architecture Standards.md|Architecture Standards]]

**Scope:** System design, modularity, versioning, technology selection  
**Enforces:** [[../07-Decisions/ADR-ARCH-001.md|Knowledge-first pipeline]], [[../07-Decisions/ADR-API-001.md|API design conventions]]  
**Used by:** Architect, DevOps, Backend  
**Key Rules:**
- Systems must be modular with clear service boundaries
- Technology selection must be documented in ADRs
- All changes must be versioned and reversible
- APIs follow [[../07-Decisions/ADR-API-001.md|RESTful conventions]]

**When to read:** First. This is the foundation for all other standards.

---

### 2. [[Security Standards.md|Security Standards]]

**Scope:** Authentication, secrets, data protection, agent authority, access control  
**Enforces:** [[../07-Decisions/ADR-SEC-001.md|Human approval gate requirements]]  
**Used by:** All agents, all developers  
**Key Rules:**
- No secrets in code or Git (use environment variables)
- All agents operate under [[../07-Decisions/ADR-SEC-001.md|approval tiers]] (Tier 1-5)
- Authentication via JWT or OAuth only
- Principle of least privilege for all access

**When to read:** Second. Informs every decision and every line of code.

---

### 3. [[Coding Standards.md|Coding Standards]]

**Scope:** Code organization, naming, type hints, testing, comments, error handling  
**Language-agnostic patterns with examples in Python  
**Used by:** Backend, Frontend, DevOps  
**Key Rules:**
- Type hints on all function signatures
- Tests required for all business logic (minimum 70% coverage)
- Comments explain WHY, not WHAT
- Domain organization (by feature, not by type)

**When to read:** Third. Applies when you're writing code.

---

### 4. [[Documentation Standards.md|Documentation Standards]]

**Scope:** README, architecture docs, API docs, ADRs, code comments, session summaries  
**Enforces:** Knowledge preservation across sessions  
**Used by:** Everyone (code reviewers, future developers, agents)  
**Key Rules:**
- Every project needs a README with prerequisites, installation, architecture, deployment
- Every API must have OpenAPI documentation
- Every significant decision requires an ADR
- Session summaries must preserve learnings and decisions

**When to read:** Last (or concurrent with coding). Applied at documentation time.

---

## Which Standard Applies To Your Role?

### Architect
- **Must follow:** [[Architecture Standards.md|Architecture Standards]] (primary) + [[Security Standards.md|Security Standards]]
- **Also apply:** [[Documentation Standards.md|Documentation Standards]] (when writing ADRs)
- **Reference:** [[Coding Standards.md|Coding Standards]] (when reviewing implementation)

### Backend Engineer
- **Must follow:** [[Coding Standards.md|Coding Standards]] (primary) + [[Security Standards.md|Security Standards]]
- **Also apply:** [[Architecture Standards.md|Architecture Standards]] (API design, ORM patterns)
- **Reference:** [[Documentation Standards.md|Documentation Standards]] (API documentation)

### Frontend Engineer
- **Must follow:** [[Coding Standards.md|Coding Standards]] (primary) + [[Architecture Standards.md|Architecture Standards]] (component design)
- **Also apply:** [[Security Standards.md|Security Standards]] (token storage, input validation)
- **Reference:** [[Documentation Standards.md|Documentation Standards]] (component documentation)

### DevOps Engineer
- **Must follow:** [[Security Standards.md|Security Standards]] (secrets, access control) + [[Architecture Standards.md|Architecture Standards]] (IaC, versioning)
- **Also apply:** [[Coding Standards.md|Coding Standards]] (infrastructure as code)
- **Reference:** [[Documentation Standards.md|Documentation Standards]] (runbooks, operations)

### Code Reviewer
- **Use all 4 standards** with checklists in each document
- [[Coding Standards.md#Quality Gate Checklist|Coding Standards checklist]] (12 items)
- [[Architecture Standards.md#Quality Checklist|Architecture Standards checklist]] (8 items)
- [[Security Standards.md#Quality Gate|Security Standards checklist]] (7 items)
- [[Documentation Standards.md#Review Checklist|Documentation Standards checklist]] (10 items)

---

## Quick Reference: When to Apply Each Standard

| Situation | Apply These Standards |
|-----------|----------------------|
| Writing code | Coding + Security (always), Architecture (if system-wide), Documentation (comments) |
| Designing a service | Architecture (primary) + Security (access control) + Documentation (design doc) |
| Designing an API | Architecture + [[../07-Decisions/ADR-API-001.md|ADR-API-001]] + Coding + Documentation |
| Making a tech decision | Architecture (primary) + Security (if applicable) + [[../07-Decisions/ADR-PROC-001.md|create an ADR]] |
| Reviewing code | All 4 (use checklists in each) |
| Writing documentation | Documentation (primary) + Coding (code examples) + relevant others |
| Setting up infrastructure | Architecture (IaC patterns) + Security (secrets, access) + Coding (code quality) |

---

## Standards Enforcement

**When enforced:** Phase 3+ (architecture and implementation phases)

**How enforced:**
- Code review checklist (see each standard)
- Architecture review checklist (Architecture Standards)
- CI/CD gates (type checking, test coverage minimums)
- Human approval gates for Tier 3+ decisions (see [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]])

**Violations:**
- Minor (code style, comments): Can be fixed before merge
- Major (missing tests, no documentation, security issue): Blocks merge until fixed
- Critical (hardcoded secrets, breaking changes, unauthorized deployment): Escalates to human decision (Tier 4)

---

## Cross-References

- **Related ADRs:**
  - [[../07-Decisions/ADR-ARCH-001.md|ADR-ARCH-001]] (Knowledge-first pipeline)
  - [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]] (Approval tiers)
  - [[../07-Decisions/ADR-API-001.md|ADR-API-001]] (API design)
  - [[../07-Decisions/ADR-PROC-001.md|ADR-PROC-001]] (How ADRs are created)

- **Related Workflows:**
  - [[../04-Workflows/README.md|Workflows Guide]] (each workflow enforces standards)
  - [[../04-Workflows/Build API.md|Build API]] (uses Coding + Architecture + Security standards)

- **Related Prompts:**
  - [[../05-Prompts/Architect.md|Architect prompt]] (enforces Architecture Standard)
  - [[../05-Prompts/Backend.md|Backend prompt]] (enforces Coding + Security)
  - [[../05-Prompts/Frontend.md|Frontend prompt]] (enforces Coding + Architecture)

---

## FAQ

**Q: Can I violate a standard if I have a good reason?**  
A: Not without approval. Standards exist to enforce consistency. If you believe a standard is insufficient, [[../07-Decisions/ADR-PROC-001.md|create a new ADR]] proposing a change. Until approved, follow the standard.

**Q: What if two standards conflict?**  
A: Standards are designed to be complementary. If you find a genuine conflict, escalate to human decision (Tier 4 via [[../07-Decisions/ADR-SEC-001.md|ADR-SEC-001]]).

**Q: Are standards language-specific?**  
A: No. Standards are technology-agnostic. They describe principles (modularity, testing, security) that apply across languages. Examples are provided in Python; translate patterns to your language.

**Q: Who decides if a standard is being violated?**  
A: Code reviewers using the checklists in each standard document. For architectural questions, the Architect agent. For security, the Security gate (Tier 3+).

---

**See also:** [[../INDEX.md|Vault INDEX]] | [[../07-Decisions/README.md|ADR Guide]] | [[../04-Workflows/README.md|Workflows]]
