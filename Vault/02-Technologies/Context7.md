---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Context7

## Purpose

Fetches current, version-accurate library documentation and code examples into agent context on demand. Eliminates reliance on training-data docs that may be outdated.

## MCP Server

- **Package:** `@upstash/context7-mcp@latest`
- **Config key:** `context7` in `.mcp.json`
- **API Key:** Optional — free tier works without one; generate at context7.com/dashboard for higher rate limits

## Usage

Two tools are exposed:

| Tool | Purpose |
|------|---------|
| `resolve-library-id` | Resolve a library name to a context7 library ID |
| `query-docs` | Fetch documentation for a specific library + topic |

## Workflow

1. Call `resolve-library-id` with a library name (e.g. `fastapi`, `chroma`, `docker`)
2. Use the returned ID with `query-docs` to pull relevant documentation sections

## Supported Agents

All agents that troubleshoot, integrate, or extend library dependencies should use context7 before reading training-data knowledge.

## Limitations

- Free tier has rate limits; paid tier unlocks higher volume
- Coverage depends on what context7 has indexed — major libraries well covered, niche packages may be missing

## Related Documents

- [[MCP_SERVERS.md]]
- [[FastAPI.md]]
- [[Chroma.md]]
- [[PostgreSQL.md]]
- [[Python.md]]

## References

- [Context7 Website](https://context7.com)
- [context7-mcp on npm](https://www.npmjs.com/package/@upstash/context7-mcp)
- [Context7 GitHub](https://github.com/upstash/context7)
- [Setup Guide](https://apidog.com/blog/context7-mcp-server/)
