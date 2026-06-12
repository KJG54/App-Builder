---
type: guide
status: active
last_updated: 2026-06-12
author: Claude-Builder-Agent
---

# Sequential Thinking MCP Server

**Purpose:** Structured, multi-step reasoning tool for AI agents — breaks complex problems into an explicit chain of thoughts before producing output.

**Package:** `@modelcontextprotocol/server-sequential-thinking` (npm)

**MCP Key:** `sequential-thinking` (in `.mcp.json`)

---

## Why It Exists

LLMs tend to collapse complex multi-step reasoning into a single output pass, which increases error rates on planning and design tasks. The Sequential Thinking MCP provides a `sequentialthinking` tool that forces the agent to reason through a problem step by step — each step can revise earlier steps before a final answer is produced.

This is most valuable when agents are:
- Planning a multi-phase implementation
- Analysing an architectural trade-off
- Debugging a non-obvious failure
- Generating a structured proposal with dependencies

---

## Configuration

```json
"sequential-thinking": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```

No API key or env vars required.

---

## Key Tool Provided

| Tool | Description |
|------|-------------|
| `sequentialthinking` | Accepts a problem statement; returns a chain of numbered thoughts, each building on the last, with a final summary |

Parameters include `thought`, `nextThoughtNeeded`, `thoughtNumber`, and `totalThoughts` — the server manages a reasoning chain and allows branching and revision.

---

## When to Use

- Use for any task classified as **Medium or High risk** per [[07-Decisions/ADR-SEC-001.md]] before generating a plan
- Use when a skill says "brainstorm first" — Sequential Thinking is the structured mechanism for that
- Avoid for simple lookups or single-step tasks (overhead not worth it)

---

## Integration Points

- Complements [[05-Prompts/AI_SKILLS.md]] — skills describe what to do; sequential thinking structures how to reason about it
- Agent orchestrator can invoke this before committing to a plan in [[04-Workflows/]]

---

## References

- [server-sequential-thinking on npm](https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking)
- [[MCP_SERVERS.md]] — Full MCP inventory
- [[02-Technologies/README.md]] — Technology index
