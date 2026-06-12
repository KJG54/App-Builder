---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Git MCP Server

**Purpose:** Local git operations for AI agents — read commits, blame, diff, log, and branch history without shelling out.

**Package:** `mcp-server-git` (PyPI, installed via `uvx`)

**MCP Key:** `git` (in `.mcp.json`)

---

## Why It Exists

The GitHub MCP server operates on the remote GitHub API — it creates PRs, lists issues, pushes files. It cannot read local git history, blame lines, or diff staged changes. The git MCP fills this gap: it gives agents direct read access to the local repository.

This matters most when agents need to:
- Understand *why* a line was changed (blame + commit message)
- Check what changed since a branch diverged
- Validate that generated code doesn't conflict with recent commits
- Summarise a diff before writing a commit message

---

## Configuration

```json
"git": {
  "type": "stdio",
  "command": "uvx",
  "args": ["mcp-server-git", "--repository", "."]
}
```

`"."` resolves to the working directory where the MCP host launches — the project root for Claude Code.

**Requirement:** `uv` must be installed (`pip install uv` or `winget install astral-sh.uv`).

---

## Key Tools Provided

| Tool | Description |
|------|-------------|
| `git_log` | List commits with message, author, date |
| `git_diff` | Show diff between refs or working tree |
| `git_blame` | Annotate lines with commit info |
| `git_status` | Working tree and staging area status |
| `git_show` | Show a specific commit or object |
| `git_branch` | List local and remote branches |

---

## Integration Points

- Use alongside **GitHub MCP** — git for local history, GitHub for remote API actions
- Agents can use `git_log` + `git_diff` to generate accurate commit messages
- Useful in [[04-Workflows/]] review and validation steps

---

## References

- [mcp-server-git on PyPI](https://pypi.org/project/mcp-server-git/)
- [[MCP_SERVERS.md]] — Full MCP inventory
- [[02-Technologies/README.md]] — Technology index
