---
type: guide
status: active
last_updated: 2026-06-09
author: Claude-Builder-Agent
---

# Chroma

## Purpose

Vector database for semantic memory and context retrieval.

## Collection Schema

```
global-standards         — coding standards, security rules, naming conventions
global-prompts           — versioned prompt library
global-known-problems    — cross-project troubleshooting knowledge base

{project}-facts          — approved requirements, accepted ADRs, architecture decisions
{project}-architecture   — versioned architecture snapshots
{project}-code           — indexed source code snippets
{project}-sessions       — experiments, discussions, research notes, work logs
{project}-test-history   — bugs, root causes, fixes, regression history
{project}-research       — research notes, vendor docs
```

## Critical Rule

Facts and sessions must never be mixed. Contaminating `{project}-facts` with exploratory session content is the primary cause of retrieval hallucination.

## Related ADRs

- [[ADR-INFRA-001]]

## References

- [Chroma Documentation](https://docs.trychroma.com)
- [Chroma MCP Server (chroma-mcp)](https://pypi.org/project/chroma-mcp/)
- [Chroma GitHub](https://github.com/chroma-core/chroma)
- [Chroma Python Client API](https://docs.trychroma.com/reference/py-client)
- [Embedding Functions Reference](https://docs.trychroma.com/guides/embeddings)
