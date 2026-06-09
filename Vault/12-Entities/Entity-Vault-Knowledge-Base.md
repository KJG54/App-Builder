---
type: entity
status: Current
authority: facts
entity_kind: store
domain: general
agent_relevance: [architect, backend, frontend, devops, qa]
tags: [vault, obsidian, knowledge]
last_updated: 2026-06-09
---

# Entity: Vault Knowledge Base

The Obsidian Vault (`Vault/`) — source of truth for all project knowledge ([[../11-Facts/Fact-Knowledge-First-Pipeline]]).

**Structure:**

| Directory | Content |
|-----------|---------|
| `00-Inbox` | Unsorted captures, session handoffs |
| `01-Standards` | Standards and principles |
| `02-Technologies` | Technology guides |
| `03-Projects` | Project architecture, planning, roadmaps |
| `04-Workflows` | Workflows and processes |
| `05-Prompts` | Agent skills and prompts |
| `06-Research` | Research notes |
| `07-Decisions` | ADRs and DECISIONS.md index |
| `08-Retrospectives` | Session summaries |
| `09-Requirements` | Requirements documents |
| `10-Known-Problems` | Problem lifecycle tracking (status frontmatter, Phase 15.6) |
| `11-Facts` | Atomic authoritative facts (Phase 15) |
| `12-Entities` | Component registry (Phase 15) |
| `13-Relationships` | Cause/effect chains (Phase 15) |
| `14-Agent-Memory` | Per-agent memory files (Phase 15) |
| `Templates` | Document templates |
| `Logs` | Generated reports |

**Interfaces:** Ingested into Chroma by `chroma-ingest.js`; validated by `vault-validator.js`; memory directories read directly by `context-assembly.js`.

**Related:** [[Entity-Chroma-Service]] | [[../11-Facts/Fact-Obsidian-Chroma-Knowledge-Layer]]
