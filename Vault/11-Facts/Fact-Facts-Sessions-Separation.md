---
type: fact
status: Current
authority: facts
domain: infra
confidence: 0.95
agent_relevance: [architect, backend, devops]
tags: [chroma, retrieval, data]
source: ADR-DATA-001
last_updated: 2026-06-09
---

# Fact: Facts and Sessions Are Stored in Separate Chroma Collections

**Statement:** Authoritative knowledge lives in `{project}-facts`; exploratory content lives in `{project}-sessions`. The two must never be mixed, to prevent retrieval contamination.

**Implications:**

- Only approved ADRs, finalized architecture, and accepted requirements are ingested as facts
- Draft documents with `authority: facts` are blocked at ingestion
- Session notes, research, and work logs always route to sessions

**Source:** [[../07-Decisions/ADR-DATA-001]], Decision 2 in [[../07-Decisions/DECISIONS.md]]
