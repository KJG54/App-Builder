---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Obsidian MCP

## Purpose

Vault-native read/write access for AI agents. Unlike the generic [[Filesystem.md]] MCP, this understands Obsidian-specific structures: frontmatter, backlinks, tags, and note metadata.

## MCP Server

- **Package:** `obsidian-mcp-server`
- **Config key:** `obsidian` in `.mcp.json`
- **Requires:** Obsidian Local REST API community plugin + `OBSIDIAN_API_KEY` env var

## Prerequisites

**This server requires the Obsidian app to be running** with the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed:

1. Open Obsidian → Settings → Community Plugins → Browse
2. Search for "Local REST API" and install it
3. Enable the plugin and copy the API key
4. Set `OBSIDIAN_API_KEY=<your-key>` in your environment
5. Default port: `27123` (matches `OBSIDIAN_BASE_URL` in `.mcp.json`)

## Capabilities

- Read notes by path
- Create and update notes
- Search notes (full-text and tag-based)
- List vault contents
- Read and write frontmatter
- Append/prepend content without overwriting

## When to Use vs. Filesystem MCP

| Need | Tool |
|------|------|
| Raw file read/write | [[MCP_SERVERS.md]] filesystem MCP |
| Frontmatter-aware operations | **Obsidian MCP** |
| Backlink-aware navigation | **Obsidian MCP** |
| Tag and metadata queries | **Obsidian MCP** |

## Supported Agents

- Curator Agent (vault maintenance, link repair)
- Documentation Agent (creating and updating vault notes)
- Architect Agent (reading architecture notes with context)

## Limitations

- Requires Obsidian app to be open and running
- Not suitable for headless/CI environments
- Rate limited by the local REST API plugin

## Related Documents

- [[MCP_SERVERS.md]]
- [[Chroma.md]]

## References

- [obsidian-mcp-server on npm](https://www.npmjs.com/package/obsidian-mcp-server)
- [Obsidian Local REST API Plugin](https://github.com/coddingtonbear/obsidian-local-rest-api)
- [Obsidian Community Plugins](https://obsidian.md/plugins)
- [Obsidian Help](https://help.obsidian.md)
