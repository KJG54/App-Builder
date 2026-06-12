---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Brave Search

## Purpose

Web and local search for AI agents. Enables research agents to query the live web without depending on training-data knowledge.

## MCP Server

- **Package:** `@modelcontextprotocol/server-brave-search`
- **Config key:** `brave-search` in `.mcp.json`
- **Requires:** `BRAVE_API_KEY` environment variable

## Getting an API Key

1. Go to [https://brave.com/search/api/](https://brave.com/search/api/)
2. Sign up for the Brave Search API (free tier: 2,000 queries/month)
3. Set `BRAVE_API_KEY` in your environment

## Capabilities

- Web search
- Local/geo-aware search
- News search
- Safe-search filtering

## Supported Agents

- Research Agent
- Documentation Agent
- Security Agent (CVE lookups, vulnerability research)
- Architect Agent (technology evaluation)

## Limitations

- Free tier: 2,000 queries/month
- Results are web search — not always authoritative for technical docs (prefer [[Context7.md]] for library docs)

## Related Documents

- [[MCP_SERVERS.md]]
- [[Context7.md]]

## References

- [Brave Search API](https://brave.com/search/api/)
- [MCP Server Source](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search)
- [brave-search on npm](https://www.npmjs.com/package/@modelcontextprotocol/server-brave-search)
