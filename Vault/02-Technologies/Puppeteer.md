---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Puppeteer

## Purpose

Browser automation and web scraping for AI agents. Enables agents to interact with web UIs, take screenshots, fill forms, and extract content from JavaScript-rendered pages.

## MCP Server

- **Package:** `@modelcontextprotocol/server-puppeteer`
- **Config key:** `puppeteer` in `.mcp.json`
- **Requires:** No API key — uses local Chromium install

## Capabilities

- Navigate to URLs
- Take screenshots
- Click elements
- Fill and submit forms
- Execute JavaScript in page context
- Extract page content (text, HTML)
- Wait for selectors/network idle

## Supported Agents

- QA Agent (UI testing, screenshot verification)
- Research Agent (scraping JavaScript-heavy documentation sites)
- Documentation Agent (capturing UI screenshots for docs)

## Limitations

- Requires Chromium to be installed (auto-downloaded on first use)
- Slower than [[BraveSearch.md]] or [[Fetch.md]] for simple text content
- Not suitable for scraping sites with bot detection

## Related Documents

- [[MCP_SERVERS.md]]
- [[BraveSearch.md]]
- [[Fetch.md]]

## References

- [Puppeteer Documentation](https://pptr.dev)
- [MCP Server Source](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer)
- [puppeteer on npm](https://www.npmjs.com/package/@modelcontextprotocol/server-puppeteer)
