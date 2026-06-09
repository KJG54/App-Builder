---
type: entity
status: Current
authority: facts
entity_kind: service
domain: infra
agent_relevance: [architect, devops, backend]
tags: [chroma, vector-database, retrieval]
last_updated: 2026-06-09
---

# Entity: Chroma Vector Database

Semantic retrieval service for the knowledge layer ([[../11-Facts/Fact-Obsidian-Chroma-Knowledge-Layer]]).

**Deployment:** Docker service via `docker-compose.yml`, default `http://localhost:8000` (override with `CHROMA_HOST` / `CHROMA_SERVER_HOST`).

**Collections:**

| Collection | Content | Authority |
|-----------|---------|-----------|
| `global-standards` | Cross-project standards | Authoritative |
| `ai-software-factory-facts` | Approved ADRs, architecture, requirements, facts | Authoritative |
| `ai-software-factory-sessions` | Session notes, research, exploratory content | Exploratory |

**Interfaces:**

- Write path: `.claude/scripts/chroma-ingest.js` (scans Vault, classifies by frontmatter, ingests)
- Read path: `.claude/scripts/context-assembly.js` (`assembleContext()` / `queryChromaCollection()`)
- API: Chroma HTTP API v2 for queries; ingestion currently posts to v1 add endpoint

**Failure mode:** When Chroma is unreachable (Docker not running), context assembly fails gracefully — agents proceed without Chroma context.

**Related:** [[../02-Technologies/MCP_SERVERS.md]] | [[../11-Facts/Fact-Facts-Sessions-Separation]]
