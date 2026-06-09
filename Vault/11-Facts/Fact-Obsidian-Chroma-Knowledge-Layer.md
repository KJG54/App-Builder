---
type: fact
status: Current
authority: facts
domain: infra
confidence: 0.9
agent_relevance: [architect, devops]
tags: [obsidian, chroma, vault, infrastructure]
source: ADR-INFRA-001
last_updated: 2026-06-09
---

# Fact: Obsidian Is the Source of Truth; Chroma Is the Retrieval Layer

**Statement:** Humans author knowledge in the Obsidian Vault (markdown, git-versioned, durable). Chroma provides semantic retrieval over that content. Chroma is always rebuildable from the Vault — never the reverse.

**Implications:**

- The Vault can be re-ingested into Chroma at any time (`chroma-ingest.js`)
- Chroma index loss is recoverable; Vault loss is not — Vault is committed to git
- Markdown portability protects against tool obsolescence

**Source:** [[../07-Decisions/ADR-INFRA-001]], Decision 4 in [[../07-Decisions/DECISIONS.md]]
