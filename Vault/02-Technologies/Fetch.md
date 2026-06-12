---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Fetch

## Purpose

HTTP request tool for AI agents. Fetches web content and converts it to LLM-friendly formats (Markdown). Faster and lighter than [[Puppeteer.md]] for static or server-rendered content.

## MCP Server

- **Package:** `@modelcontextprotocol/server-fetch`
- **Config key:** `fetch` in `.mcp.json`
- **Requires:** No API key

## Capabilities

- GET any URL and return content as Markdown
- Fetch raw HTML
- Fetch plain text
- Follow redirects
- Set custom headers

## Use Cases

- Fetching documentation pages (complement to [[Context7.md]])
- Pulling API specs (OpenAPI/Swagger JSON)
- Reading public configuration files
- Health-checking external services

## When to Use vs. Alternatives

| Need | Tool |
|------|------|
| Library docs | [[Context7.md]] (preferred) |
| JavaScript-rendered pages | [[Puppeteer.md]] |
| Static/server-rendered content | **Fetch** (faster, lighter) |
| Broad web search | [[BraveSearch.md]] |

## Supported Agents

- Research Agent
- Architect Agent (fetching specs and RFCs)
- Documentation Agent

## Related Documents

- [[MCP_SERVERS.md]]
- [[Context7.md]]
- [[Puppeteer.md]]
- [[BraveSearch.md]]

## References

- [MCP Server Source](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch)
- [server-fetch on npm](https://www.npmjs.com/package/@modelcontextprotocol/server-fetch)
