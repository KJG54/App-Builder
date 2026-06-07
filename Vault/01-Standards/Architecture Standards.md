# Architecture Standards

**Status:** Active  
**Phase Enforcement Begins:** Phase 2  
**Last Updated:** 2026-06-07

---

## Overview

Architecture standards ensure systems remain modular, extensible, maintainable, and technology-agnostic. These standards apply to all system design work across phases. Major architectural decisions must be formalized in ADRs and documented in versioned architecture files.

---

## 1. Modularity and Service Design

### Rule: Systems must be modular with clear service boundaries

Modularity enables parallel development, independent scaling, and technology flexibility. Every major component should be reusable across projects.

### Principle: Single Responsibility

Each service/module has one reason to change:
- One domain of responsibility
- Independent deployment if possible
- Clear, minimal API surface

### Compliance Example

**Correct modular design:**
```
Application Architecture:
├── API Gateway (routes requests, rate limiting)
├── Authentication Service (JWT/OAuth tokens)
├── Business Logic (feature-specific)
├── Data Access Layer (database abstraction)
├── Vector Store (Chroma/semantic search)
└── External Integrations (MCP servers)

Each layer:
- Has single responsibility
- Can be tested independently
- Can be versioned separately
- Can be replaced without affecting others
```

### Violation Example

**❌ WRONG — monolithic, tightly coupled:**
```
# All business logic, auth, database, and storage in one module
application.py (5000+ lines)
├── User authentication logic
├── Payment processing
├── Email notifications
├── Database queries
├── Cache management
└── File storage logic

Problem: Changing one piece risks breaking everything
```

### Enforcement Gate

- **Architecture Review:** Verify service boundaries defined before coding
- **Code Review:** Check that modules don't violate single responsibility
- **Phase 3+ Design Phase:** All architecture changes require ADR (see [[ADR-ARCH-001]])

### Related Standards
[[Security Standards]] — Agent-Specific Security Rules (services respect agent authority)

### Related Decisions
[[ADR-ARCH-001]] — Knowledge-First Pipeline Design (layers of system)

---

## 2. API Design and Versioning

### Rule: APIs are RESTful by default; versions enable safe evolution

APIs are contracts. Changing APIs breaks clients. Versioning allows safe evolution without forced upgrades.

### Compliance Example

**RESTful API with versioning:**
```
# Version in URL path (preferred)
GET  /api/v1/users/:id              → Get user
POST /api/v1/users                  → Create user
PUT  /api/v1/users/:id              → Update user
DELETE /api/v1/users/:id            → Delete user

# Version in header (alternative)
GET /api/users/:id
    Header: API-Version: 1

# OpenAPI/Swagger documentation (REQUIRED)
GET /api/v1/docs
    Returns: OpenAPI 3.0 spec
    Includes: all endpoints, parameters, response schemas
```

**Version management:**
```
v1/: Original API design
  Stabilized: Phase 2
  Deprecated: (when v2 stable, 6+ months notice)
  Sunset: (remove after deprecation period)

v2/: Enhanced design (breaking changes)
  Reason: (document in ADR-API-001)
  Changes: (list breaking changes)
  Migration: (guide v1 clients to v2)
```

### Violation Example

**❌ WRONG — unversioned API:**
```
# No version path; clients break when API changes
GET /users/:id
    # Changed response schema in production
    # All existing clients now broken
```

**❌ WRONG — no documentation:**
```
# API exists but no spec
# Clients must reverse-engineer or ask questions
# Breaking changes not communicated
```

### Enforcement Gate

- **API Design (Phase 3+):** Every API must have OpenAPI spec
- **Code Review:** Verify versioning strategy before merge
- **Documentation:** API changes documented before deployment
- **Phase 5+ Integration:** Test backward compatibility

**Tools:** OpenAPI Generator, Swagger UI, automatic spec generation

### Related Standards
[[Coding Standards]] — API client code and error handling

### Related Decisions
[[ADR-API-001]] — RESTful API Design Conventions (detailed API guidelines)

---

## 3. Database and Data Management

### Rule: Database changes are versioned, tracked, and reversible

Manual database changes are untrackable, unrepeatable, and break reproducibility. All schema changes go through migrations.

### Compliance Example

**Schema migrations (managed via code):**
```sql
-- migrations/001_create_users_table.sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- migrations/002_add_phone_to_users.sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Migration runner (Python, Node, etc.)
# Tracks which migrations have run
# Can roll back if needed
# Can test migrations in isolation
```

**Data access abstraction:**
```python
# CORRECT: Use ORM to abstract database
from sqlalchemy import Column, String
from database import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String(255), unique=True)
    
# Query through ORM
user = session.query(User).filter_by(email="user@example.com").first()

# WRONG: Raw SQL in business logic
user = db.execute(f"SELECT * FROM users WHERE email='{email}'")
```

### Violation Example

**❌ WRONG — manual schema changes:**
```
# DBA manually runs SQL in production
# Change is not tracked
# Other environments (staging, local) become inconsistent
# Rollback requires manual intervention
```

**❌ WRONG — raw SQL embedded in code:**
```python
# SQL injection vulnerability
user = db.execute(f"SELECT * FROM users WHERE email='{user_email}'")
# Attacker: email='; DROP TABLE users; --
```

### Enforcement Gate

- **Code Review:** All schema changes via migrations, never raw SQL
- **Database Review:** Migrations reviewed for performance, safety
- **Testing:** Migrations tested in isolated environment
- **Documentation:** Migration purpose documented

**Tools:** Alembic (Python), Flyway (Java/Kotlin), Knex.js (Node)

### Related Standards
[[Coding Standards]] — Query patterns and ORM usage

### Related Decisions
[[ADR-ARCH-001]] — Knowledge-First Pipeline Design (data layer)

---

## 4. Technology Selection Process

### Rule: Technology choices are explicit, documented, and reversible

Framework and language choices have long-term cost. Decisions must be deliberate, documented, and not premature.

### Process: When to Choose a Technology

```
1. Identify the problem:
   - What specifically needs solving?
   - What are the constraints? (performance, team skill, timeline)

2. Research options:
   - What are 2-3 viable solutions?
   - Compare: cost, learning curve, community, maturity, lock-in risk

3. Make decision:
   - Choose the SIMPLEST solution that solves the problem
   - Document in ADR (see [[ADR-ARCH-001]])
   - Avoid: "it's trendy," "I want to learn it," "it's the best"

4. Review:
   - Human approval required (approval gate in [[ADR-ARCH-001]])
   - Lock in for period (minimum 6 months, usually longer)

5. Migrate (if needed):
   - Plan exit strategy if change is required
   - Migration documented before switching
```

### Compliance Example

**Good technology decision (documented):**
```markdown
# ADR-ARCH-003: Use PostgreSQL for Facts Store

## Decision
PostgreSQL for primary fact storage (normalized data)

## Reason
- Transactional guarantees (ACID) required for fact integrity
- Mature ecosystem; long-term vendor lock-in minimal
- Team has PostgreSQL experience
- Alternatives (MongoDB) less suitable for relational data

## Trade-off
- Less flexible than document stores
- Schema migrations overhead
- But: consistency guarantees worth the cost

## Migration Path
If we need to change: migration scripts to other DB (18+ month effort)
```

### Violation Example

**❌ WRONG — technology churn:**
```
Month 1: "Let's use Node.js"
Month 3: "Actually, let's use Python"
Month 6: "Go is better"
# Team constantly switching; no progress
```

**❌ WRONG — no documented reasoning:**
```
# Why did we choose this framework?
# Nobody remembers; knowledge lost
# Team can't maintain decision when framework becomes outdated
```

### Enforcement Gate

- **Design Phase:** Technology choice documented before implementation
- **Architecture Review:** Decision recorded in ADR
- **Change Control:** Technology change requires new ADR + human approval

### Related Standards
[[Security Standards]] — Dependency management (technology selection includes security)

### Related Decisions
[[ADR-ARCH-001]] — Knowledge-First Pipeline Design (decisions persist)

---

## 5. Architecture Evolution and Versioning

### Rule: Architecture changes are versioned, documented, and traced to ADRs

Architecture is a snapshot in time. As system evolves, architecture documentation must be updated and versions tracked.

### Compliance Example

**Versioned architecture document:**
```markdown
# Architecture — v1.2

Last Updated: 2026-06-07
Previous Version: [[Architecture — v1.1]]
Changes from v1.1: Added Chroma vector store; refactored authentication

## System Overview
[Diagram and description]

## Service Layers
[Each service and responsibility]

## Data Flow
[How data moves through system]

## Linked ADRs
- [[ADR-ARCH-001]] — Knowledge-First Pipeline Design
- [[ADR-DATA-001]] — Chroma Collection Schema
- [[ADR-ARCH-002]] — Distributed Tracing Strategy
```

**Change log:**
```
v1.2 (2026-06-07):
  - Added Chroma vector store for semantic search
  - Refactored auth to use JWT tokens
  - Related ADR: ADR-ARCH-001

v1.1 (2026-05-15):
  - Initial modular architecture
  - Separated API Gateway from business logic

v1.0 (2026-05-01):
  - Initial monolithic design
  - Deprecated in v1.1
```

### Violation Example

**❌ WRONG — stale architecture:**
```
# Architecture document last updated 6 months ago
# But 10 services have been added since
# New team members read docs; they're confused
# Decisions from old architecture still referenced incorrectly
```

### Enforcement Gate

- **Phase 5+ Change Control:** Architecture changes require versioned document + ADR
- **Code Review:** Changes match documented architecture
- **Documentation Review:** Architecture kept current (updated every phase)

### Related Standards
[[Documentation Standards]] — Architecture documentation requirements

### Related Decisions
[[ADR-ARCH-001]] — Knowledge-First Pipeline Design (traces decisions over time)

---

## 6. Architecture Change Decision Gate

### Rule: Major architecture changes require ADR and human approval

What triggers an ADR?

**Requires ADR:**
- Adding or removing a service/layer
- Changing communication between services (REST → gRPC, synchronous → async)
- Changing data store (PostgreSQL → MongoDB, adding new store type)
- Changing authentication/authorization system
- Major performance optimization that affects architecture
- Technology selection (new framework, language, platform)

**Does NOT require ADR:**
- Bug fixes that don't affect design
- Performance tweaks within existing architecture
- Code refactoring (same responsibilities, different implementation)
- Adding new features using existing patterns

### Enforcement Gate

- **Architecture Review:** Determine if change requires ADR
- **ADR Review:** If required, write and get approval before implementation
- **Code Review:** Verify implementation matches ADR

### Related Decisions
[[ADR-ARCH-001]] — Knowledge-First Pipeline Design (when to write decisions)

---

## 7. Technology-Agnostic Design

### Rule: Avoid framework and language lock-in; design for portability

This is an Application Builder Framework. It must support ANY tech stack, not prescribe one.

### Compliance Example

**Technology-agnostic design:**
```
Knowledge Layer:
  - Obsidian Vault (markdown files, any tool can read)
  - Chroma (vector database, API-based, language-agnostic)
  - Decision: Uses REST API, not language-specific library

Agent Execution:
  - Docker (language-agnostic container)
  - MCP (Model Context Protocol, language-agnostic tool access)
  - Design: Agents call APIs, don't depend on Python/Node/Go directly

Result: Can switch from Python agents to Go agents without architecture change
```

### Violation Example

**❌ WRONG — language lock-in:**
```
# Framework only works with Python
# Uses Python libraries nobody else uses
# Switching languages requires redesign
```

### Enforcement Gate

- **Design Review:** Architecture doesn't prescribe language/framework
- **Documentation:** Design reasons explained (why choices enable flexibility)

### Related Decisions
[[ADR-ARCH-001]] — Knowledge-First Pipeline Design (technology-agnostic architecture)

---

## Architecture Review Checklist

Before finalizing any architecture:

- [ ] Services have single responsibility
- [ ] Service boundaries clearly defined
- [ ] APIs are RESTful with versioning
- [ ] APIs have OpenAPI documentation
- [ ] Database changes via migrations (never manual)
- [ ] No raw SQL in business logic (use ORM)
- [ ] Technology choices documented in ADR
- [ ] Architecture changes traced to ADRs
- [ ] Architecture document versioned
- [ ] Design is technology-agnostic where possible
- [ ] Modularity preserved (no framework lock-in)
- [ ] [[ADR-ARCH-001]] linked for design rationale

---

## Related Documents

- [[Coding Standards]] — Implementation patterns, refactoring guidelines
- [[Security Standards]] — Authentication systems, threat modeling
- [[ADR-ARCH-001]] — Knowledge-First Pipeline Design (core architecture)
- [[ADR-ARCH-002]] (Future) — Distributed systems patterns
- [[Architecture/Current.md]] — Current versioned architecture

---

**Last Updated:** 2026-06-07  
**Status:** Active — Phase 2+  
**Version:** 1.0
