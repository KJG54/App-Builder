---
type: guide
status: active
tags: [relationships, cause-effect, memory, phase-15]
last_updated: 2026-06-09
---

# 13-Relationships — Cause/Effect Chains

Causal relationships mined from [[../10-Known-Problems/README|10-Known-Problems]] and operational observations. Part of the Phase 15 memory system.

**Purpose:** Capture *why* things happen — chains of cause and effect that agents should consider before repeating a known-bad pattern. These are included in assembled context alongside agent memory.

**Schema (frontmatter):**

```yaml
type: relationship
status: active
authority: sessions       # derived from open problems; promote to facts when confirmed
relationship_kind: causes|blocks|degrades|requires
domain: api|auth|infra|security|general
agent_relevance: [backend, qa, ...]
source_problems: [Problem-file-name, ...]
confidence: 0.0–1.0
last_updated: YYYY-MM-DD
```

**Rules:**

- One causal chain per file, written as `cause → effect → impact`
- Every relationship traces to source problems or observations
- When the source problem is resolved, update the relationship's status or confidence

**Relationships:**

- [[Rel-Timeouts-Degrade-Backend-Compliance]]
- [[Rel-Missing-Input-Validation-Security-Risk]]
- [[Rel-Missing-Integration-Tests-Undetected-Regressions]]

**Related:** [[../10-Known-Problems/README|10-Known-Problems]] | [[../11-Facts/README|11-Facts]] | [[../14-Agent-Memory/README|14-Agent-Memory]]
