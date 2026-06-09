---
type: guide
status: active
tags: [entities, registry, memory, phase-15]
last_updated: 2026-06-09
---

# 12-Entities — Component Registry

Registry of the system's named components: agents, services, scripts, and knowledge stores. Part of the Phase 15 memory system.

**Purpose:** Give agents a stable answer to "what exists in this system and what does it do?" without scanning source code. Each entity document describes one component (or one tight family of components), its responsibilities, and its interfaces.

**Schema (frontmatter):**

```yaml
type: entity
status: Current
authority: facts
entity_kind: agent|service|script|store
domain: api|auth|infra|security|general
agent_relevance: [architect, devops, ...]
last_updated: YYYY-MM-DD
```

**Rules:**

- One entity (or one cohesive family) per file
- Update the entity doc when the component's interface or responsibility changes
- New components introduced in any phase must be registered here

**Entities:**

- [[Entity-Agent-Roles]] — the 8 specialized agent roles
- [[Entity-Chroma-Service]] — vector database service
- [[Entity-Orchestration-Scripts]] — the `.claude/scripts/` pipeline
- [[Entity-Vault-Knowledge-Base]] — the Obsidian Vault itself

**Related:** [[../11-Facts/README|11-Facts]] | [[../13-Relationships/README|13-Relationships]] | [[../14-Agent-Memory/README|14-Agent-Memory]]
