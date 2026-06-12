---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Memory (MCP)

## Purpose

Persistent knowledge graph for AI agents. Stores entities, relationships, and observations that survive across tool calls and sessions — separate from [[Chroma.md]] which handles semantic search over vault documents.

## MCP Server

- **Package:** `@modelcontextprotocol/server-memory`
- **Config key:** `memory` in `.mcp.json`
- **Requires:** No API key — stores locally in a JSON file

## When to Use vs. Chroma

| Use Case | Tool |
|----------|------|
| Semantic search over vault docs | [[Chroma.md]] |
| Structured entity/relationship facts | **Memory MCP** |
| Short-lived session state | Conversation context |
| Long-term project decisions | [[Chroma.md]] + [[Vault/07-Decisions/]] |

## Capabilities

- Create, read, update, delete entities
- Define relationships between entities
- Store observations (timestamped facts about entities)
- Query by entity type or relationship

## Supported Agents

- Project Manager Agent (tracking project entities and status)
- Architect Agent (tracking component relationships)
- QA Agent (tracking known bugs and test results)

## Limitations

- Not semantically searchable — exact entity/relationship queries only
- Local file storage — not distributed across machines
- No embedding/vector similarity

## Related Documents

- [[MCP_SERVERS.md]]
- [[Chroma.md]]

## References

- [MCP Server Source](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- [server-memory on npm](https://www.npmjs.com/package/@modelcontextprotocol/server-memory)
