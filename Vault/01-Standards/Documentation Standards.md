# Documentation Standards

**Status:** Active  
**Phase Enforcement Begins:** Phase 2  
**Last Updated:** 2026-06-07

---

## Overview

Documentation is a first-class deliverable. Code without documentation is unmaintainable. These standards ensure knowledge is captured, discoverable, and stays current. All documentation must be version-controlled in Git or Vault.

---

## 1. Required Project Documentation

### Rule: Every project must have complete governance and architecture documentation

Core documentation is required before Phase 3 (implementation).

### Compliance Example

**Complete documentation set:**
```
project/
├── README.md              # Project overview, setup, quick start
├── CLAUDE.md              # AI governance and rules
├── WORKFLOW.md            # Git workflow and discipline
├── Vault/
│   ├── 03-Projects/
│   │   └── [ProjectName]/
│   │       ├── Architecture/
│   │       │   └── Current.md          # Versioned architecture
│   │       └── Phase-[N]-Plan.md       # Phase plans
│   ├── 07-Decisions/
│   │   ├── DECISIONS.md                # Decision index
│   │   └── ADR-*.md                    # Architectural decisions
│   └── 09-Requirements/
│       └── [ProjectName].md            # Requirements doc
```

### Violation Example

**❌ WRONG — missing documentation:**
```
project/
├── src/
├── tests/
# No README, CLAUDE.md, WORKFLOW.md
# No architecture documentation
# No decision records
```

### Enforcement Gate

- **Project Kickoff:** Required docs created before Phase 3
- **Phase Review:** Architecture and decisions documented before implementation

### Related Standards

[[CLAUDE.md]] — File Organization and Storage Rules  
[[Vault Rules]] — Documentation storage locations

---

## 2. README Requirements

### Rule: Every project must have a comprehensive README

README is the entry point for new developers and AI agents. It must provide all information needed to understand and run the project.

### Compliance Example

**Complete README structure:**
```markdown
# Project Name

## Overview
Brief description of what the project does and why it exists.

## Quick Start

### Prerequisites
- Python 3.10+
- Docker
- etc.

### Installation
```bash
git clone ...
cd project
docker-compose up -d
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Running
```bash
python -m app.main
# Server running on http://localhost:8000
```

## Architecture

Brief overview pointing to [[Vault/03-Projects/ProjectName/Architecture/Current.md]]

## Development

### Project Structure
```
src/
├── users/        # User management domain
├── documents/    # Document management domain
└── shared/       # Shared utilities
```

### Running Tests
```bash
pytest
```

### Coding Standards
See [[Coding Standards]]

## Deployment
Point to deployment documentation or ADR

## Contributing
- Follow [[CLAUDE.md]]
- See [[Vault/07-Decisions/DECISIONS.md]] for architecture decisions

## Related

- [[Architecture/Current.md]] — System design
- [[CLAUDE.md]] — Project governance
```

### Violation Example

**❌ WRONG — inadequate README:**
```markdown
# My Project

This is a project.

Run: `python main.py`

That's it.
```

### Enforcement Gate

- **Project Creation:** README required before first commit
- **Code Review:** README updated when architecture changes

---

## 3. Architecture Documentation

### Rule: Architecture must be versioned, current, and linked to decisions

Architecture is a snapshot in time. As systems evolve, architecture must be updated with version tracking.

### Compliance Example

**Versioned architecture document:**
```markdown
# Architecture — v1.2

**Last Updated:** 2026-06-07  
**Previous Version:** [[Architecture — v1.1]]  
**Changes from v1.1:** Added Chroma vector store; migrated auth to JWT

## System Overview

[Diagram: services and data flow]

## Service Layers

**API Gateway** (Request routing, rate limiting)
- Forwards requests to appropriate service
- Applies rate limiting (100 req/min per IP)

**Authentication Service** (JWT token management)
- Issues tokens on login
- Validates tokens on protected endpoints
- Refreshes expired tokens

**Business Logic** (Core features)
- User management
- Document management
- Reporting

**Data Access Layer** (Database abstraction via ORM)
- All queries through SQLAlchemy
- Migrations managed via Alembic

**Vector Store** (Chroma for semantic search)
- Indexes documents for relevance search
- Separate from transactional database

## Linked ADRs

- [[ADR-ARCH-001]] — Knowledge-First Pipeline Design (why this architecture)
- [[ADR-ARCH-002]] — Microservice Communication (REST between services)
- [[ADR-DATA-001]] — Chroma Schema & Facts/Sessions Separation

## Change Log

v1.2 (2026-06-07): Added Chroma vector store
v1.1 (2026-05-15): Separated API from business logic
v1.0 (2026-05-01): Initial monolithic design (deprecated)
```

### Violation Example

**❌ WRONG — stale architecture:**
```
# Architecture.md (last updated 6 months ago)
But 10 services have been added since
New team members read docs and are confused
Decisions from old architecture incorrectly referenced
```

### Enforcement Gate

- **Phase Review:** Architecture versioned at phase boundaries
- **Architecture Changes:** Require updated architecture doc + ADR
- **Code Review:** Implementation must match documented architecture

### Related Standards

[[Architecture Standards]] — Architecture versioning and evolution  
[[Architectural Decision Records]] — How to formalize changes

---

## 4. Architectural Decision Records (ADRs)

### Rule: Significant decisions must be documented in ADRs; decisions are traced to reasoning

An ADR (Architectural Decision Record) documents the WHY behind important choices. This allows future teams to understand the original reasoning and change course if circumstances evolve.

### When ADRs Are Required

**Requires ADR:**
- Major architectural changes
- Technology selection (new language, framework, database)
- Service boundary changes
- Communication pattern changes (REST → async, etc.)
- Database strategy changes
- Deployment strategy changes
- Security policy changes
- Cross-project standards

**Does NOT require ADR:**
- Bug fixes that don't affect design
- Code refactoring (same behavior)
- Adding features using existing patterns
- Documentation updates

### ADR Format (use [[ADR-INFRA-001]] as precedent)

```markdown
# ADR-XXX: [Title]

**Date:** YYYY-MM-DD  
**Status:** [Proposed | Accepted | Deprecated]  
**Category:** [ARCH | SEC | DATA | API | INT | PROC | INFRA]

## Decision

One-sentence statement of the decision made.

## Context

Background and problem being solved.

## Alternatives Considered

Options evaluated and why they were rejected.

## Rationale

Why the chosen decision is best given constraints.

## Consequences

Positive consequences and tradeoffs.

## Implementation

How the decision will be operationalized.

## Related Decisions

Links to [[related ADRs]] and [[standards]].
```

### Compliance Example

**Good ADR:**
```markdown
# ADR-API-001: RESTful API Design Conventions

**Status:** Accepted  
**Category:** API

## Decision

All APIs must be RESTful with versioned URL paths.

## Context

Multiple systems will expose APIs. Without conventions, clients can't reuse
authentication, pagination, error handling patterns.

## Alternatives

1. GraphQL — more flexible, steeper learning curve, overkill for CRUD
2. Custom JSON-RPC — non-standard, less tooling
3. RESTful — industry standard, clear conventions, great tooling

## Rationale

RESTful is industry standard and enables ecosystem tooling. Versioning
enables safe evolution without breaking clients.

## Implementation

- API versions in URL path: /api/v1/, /api/v2/
- Deprecation notice when v1 → v2 migration starts
- 6+ month deprecation period before removal

## Related

- [[API Design and Versioning]] (standard)
- [[Architecture Standards]]
```

### Violation Example

**❌ WRONG — decision made without documenting reasoning:**
```
# Why did we choose PostgreSQL?
# Nobody remembers the original reasoning
# When it becomes a bottleneck, team can't weigh switching options
```

### Enforcement Gate

- **Architecture Review:** Determine if change requires ADR
- **ADR Review:** If required, write and get approval before implementation
- **Decision Traceability:** All major decisions should be findable via [[DECISIONS.md]]

### Related Standards

[[CLAUDE.md]] — Architectural Decision Records section  
[[Vault Rules]] — Where ADRs are stored

---

## 5. Code Comments and Inline Documentation

### Rule: Code is self-documenting; comments explain WHY, not WHAT

Good naming and structure eliminate most comments. Only add comments when the WHY is non-obvious.

### Compliance Example

**Good comment (explains WHY):**
```python
def validate_password_strength(password: str) -> bool:
    """Check if password meets security requirements."""
    return (
        len(password) >= 12 and
        any(c.isupper() for c in password) and
        any(c.isdigit() for c in password)
    )

def calculate_expiration_time(created_at: datetime) -> datetime:
    # RFC 6238 requires 30-second windows for TOTP tokens.
    # Extending to 60 seconds to accommodate client clock drift.
    return created_at + timedelta(seconds=60)
```

### Violation Example

**❌ WRONG — comments describe what code does:**
```python
# Increment i
i = i + 1

# Check if user is admin
if user.role == "admin":
    pass
```

### Enforcement Gate

- **Code Review:** Require justification for comments
- **Linting:** Flag multi-line docstrings (Phase 5+)

### Related Standards

[[Coding Standards]] — Comments and Docstrings section

---

## 6. API Documentation

### Rule: All APIs must have OpenAPI/Swagger documentation

API documentation is a contract between client and server. Without it, clients must guess.

### Compliance Example

**OpenAPI spec (auto-generated if possible):**
```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
  description: User management endpoints

servers:
  - url: https://api.example.com/api/v1

paths:
  /users:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 12 }
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid input
        '409':
          description: Email already exists
```

### Violation Example

**❌ WRONG — no API documentation:**
```
# API exists but clients must guess parameters and responses
# Breaking changes not communicated
# No versioning strategy
```

### Enforcement Gate

- **API Review:** Every API must have OpenAPI spec
- **Documentation Review:** API changes reflected in spec before deployment

**Tools:** OpenAPI Generator, Swagger UI, FastAPI auto-generation

---

## 7. Session Summaries and Retrospectives

### Rule: Significant work sessions must be summarized and archived

Session summaries document what was learned, decisions made, and unexpected discoveries. This prevents knowledge loss.

### Compliance Example

**Session summary structure:**
```markdown
# Session Summary: Phase 2.1 Core Governance Layer

**Date:** 2026-06-07  
**Duration:** 6 hours  
**Participants:** Claude (Haiku)

## Work Completed

- ✅ Expanded Security Standards (350+ lines)
- ✅ Expanded Architecture Standards (360+ lines)
- ✅ Created ADR-SEC-001 (approval gates)
- ✅ Created ADR-ARCH-001 (knowledge-first pipeline)

## Decisions Made

- Decision 1: Standards follow Rule + Example + Violation + Gate pattern
- Decision 2: ADRs must reference and link to standards
- Decision 3: All governance rules integrated into CLAUDE.md

## Lessons Learned

- Pattern consistency (Rule + Example + Violation + Gate) makes standards easier to scan
- Cross-referencing ADRs to standards prevents duplicate reasoning
- Governance changes should always be committed separately (not bundled with feature work)

## Related Files

- [[Vault/01-Standards/Security Standards.md]]
- [[Vault/01-Standards/Architecture Standards.md]]
- [[Vault/07-Decisions/ADR-SEC-001.md]]
- [[Vault/07-Decisions/ADR-ARCH-001.md]]

## Next Steps

- Phase 2.2: Expand remaining standards
- Phase 2.2: Create additional ADRs (PROC, DATA, API, INT)

## Retrospective

Significant progress on governance layer. Pattern consistency helped maintain quality across multiple standards. Ready for Phase 2.2.
```

### Enforcement Gate

- **Phase Completion:** Session summary required before moving to next phase
- **Archive Location:** Vault/08-Retrospectives/ (organized by date)

---

## Documentation Update Criteria

Documentation updates are **REQUIRED** when:

- Behavior changes
- Architecture changes
- Requirements change
- Operational procedures change
- New systems are introduced
- Existing systems are removed
- ADRs are created

Documentation updates are **OPTIONAL** for:

- Minor bug fixes
- Cosmetic changes
- Internal implementation details with no external impact

Avoid documentation churn that does not improve future maintainability.

---

## Documentation Standards Review Checklist

Before considering documentation complete:

- [ ] README covers setup, architecture, development workflow
- [ ] Architecture document is versioned and current
- [ ] Significant decisions documented in ADRs
- [ ] ADRs follow consistent format with examples
- [ ] All ADRs linked from [[DECISIONS.md]]
- [ ] Code comments explain WHY, not WHAT
- [ ] API documentation (OpenAPI) is current
- [ ] No orphaned documentation (all docs linked)
- [ ] Knowledge preserved in Vault (not just working directories)
- [ ] Session summaries archived for significant work

---

## Related Documents

- [[Coding Standards]] — Code comments and docstrings
- [[Architecture Standards]] — Architecture documentation and versioning
- [[CLAUDE.md]] — Vault Rules, File Organization
- [[ADR-INFRA-001]] — ADR format precedent
- [[Vault/08-Retrospectives/]] — Archived session summaries

---

**Last Updated:** 2026-06-07  
**Status:** Active — Phase 2+  
**Version:** 1.0
