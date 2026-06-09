---
type: guide
status: active
tags: [facts, memory, phase-15]
last_updated: 2026-06-09
---

# 11-Facts — Authoritative Fact Store

Atomic, authoritative statements mined from approved decisions ([[../07-Decisions/DECISIONS.md]]) and ADRs. Part of the Phase 15 memory system.

**Purpose:** Give agents small, retrievable, single-statement facts instead of requiring them to digest full ADRs. Each fact links back to its source ADR for full context.

**Schema (frontmatter):**

```yaml
type: fact
status: Current          # facts must be Current/Accepted/Approved to be ingested as facts
authority: facts
domain: api|auth|infra|security|general
confidence: 0.0–1.0
agent_relevance: [architect, backend, ...]
source: ADR-XXX-000      # originating decision
last_updated: YYYY-MM-DD
```

**Rules:**

- One fact per file; one clear statement per fact
- Every fact MUST trace to a source ADR or approved decision
- Facts are ingested into the `{project}-facts` Chroma collection
- When a source ADR is superseded, the fact must be updated or deprecated

**Related:** [[../07-Decisions/DECISIONS.md]] | [[../12-Entities/README|12-Entities]] | [[../13-Relationships/README|13-Relationships]] | [[../14-Agent-Memory/README|14-Agent-Memory]]
