---
type: fact
status: Current
authority: facts
domain: infra
confidence: 0.9
agent_relevance: [devops, backend]
tags: [docker, isolation, infrastructure]
source: DECISIONS.md#decision-5
last_updated: 2026-06-09
---

# Fact: All Execution Environments Run in Docker

**Statement:** Services, agents, and databases run in Docker containers orchestrated via Docker Compose. Any project must be rebuildable from Git + Docker Compose alone.

**Implications:**

- Chroma runs as a Docker service (`docker-compose.yml`)
- Agent workspaces are isolated from each other
- The system is local-first; no cloud dependency is required for core operation

**Source:** Decision 5 in [[../07-Decisions/DECISIONS.md]]
