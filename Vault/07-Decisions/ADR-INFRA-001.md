# ADR-INFRA-001: VS Code Workspace Configuration for Multi-Agent Development

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 1 — Foundation

---

## Context

The Application Builder Framework requires a consistent, AI-friendly development environment that works for both human developers and AI agents (Architect, Backend, Frontend, QA, Security, DevOps, Documentation, Verification agents).

Currently, there is no shared VS Code configuration. This creates friction:
- Extensions are chosen individually (no shared standards)
- Editor settings vary across developers (inconsistent formatting)
- Automation tasks must be documented separately (no discoverable workflows)
- Debug configurations are not standardized

This is blocking Phase 1 Foundation completion and creates risk for Phase 2+ multi-agent work.

---

## Decision

We will establish a shared VS Code workspace configuration (`.vscode/` directory) containing:

1. **extensions.json** — Recommended extensions for Obsidian, Docker, Git, Python, YAML, Markdown
2. **settings.json** — Workspace defaults (formatting, rulers, file associations, exclusions)
3. **tasks.json** — Automation tasks (Chroma startup, Docker compose, Git status)
4. **launch.json** — Debug configuration templates (Python, Node.js)

All configuration is:
- **Shared** in git (readable, versionable)
- **Overridable** by users (workspace defaults, not enforced)
- **AI-friendly** (JSON format, clear structure, documented)
- **Technology-agnostic** (no language lock-in; uses templates)

---

## Rationale

### Why VS Code Configuration?

1. **Consistency** — All developers see the same editor behavior
2. **Discoverability** — AI agents can read `.vscode/` and understand the environment
3. **Automation** — Tasks enable one-command workflows (Ctrl+Shift+B)
4. **Scalability** — Templates support future languages without duplication

### Why This Specific Configuration?

- **extensions.json**: Recommendations vs. requirements (teams can choose different tools)
- **settings.json**: Sensible defaults based on project standards (80/120 column rulers, markdown formatting, whitespace trimming)
- **tasks.json**: Most common workflows (Chroma startup, Docker compose, Git status)
- **launch.json**: Templates only (Python, Node.js; not locked to one language)

### Why Not Alternatives?

| Alternative | Pros | Cons | Decision |
|---|---|---|---|
| External configuration (DevContainer) | Fully isolated, reproducible | High complexity; requires Docker always; changes later | Rejected |
| Project README with manual setup | Simple; no overhead | Non-discoverable to AI; error-prone setup | Rejected |
| User-specific .vscode/ config | Everyone chooses own setup | No consistency; agents confused | Rejected |
| **Shared .vscode/ in git** | **Consistent, AI-readable, versionable, easy** | **Slightly opinionated, can be overridden** | **Selected** |

---

## Consequences

### Positive

- ✅ Consistent editor behavior across all developers
- ✅ New contributors see recommended extensions on first open
- ✅ Automation tasks reduce manual CLI commands
- ✅ AI agents can read `.vscode/` to understand environment expectations
- ✅ Configuration is versionable; changes are tracked in git
- ✅ Workspace-specific settings (vs. global) don't affect other projects

### Negative

- ❌ Users who prefer different extensions must override settings
- ❌ Configuration must stay synchronized (one more thing to maintain)
- ❌ Some team members may disable formatting on save (different behavior)

### Mitigations

- Document that all settings are overridable in WORKFLOW.md
- Use `.vscode/` for *recommended* extensions, not enforced extensions
- Review and update `.vscode/settings.json` in Phase 2+ if issues emerge
- Include troubleshooting section in WORKFLOW.md

---

## Implementation

### Phase 1 (Foundation)

Create files:
- `.vscode/extensions.json` (8 recommended extensions)
- `.vscode/settings.json` (editor defaults, file exclusions, formatting)
- `.vscode/tasks.json` (Chroma startup, Docker compose, Git status)
- `.vscode/launch.json` (Python and Node.js debug templates)

### Phase 2+ (Evolution)

- Add Remote Containers configuration (dev containers)
- Add workspace-specific Python venv settings
- Add project-specific debug configurations based on chosen tech stack
- Review and refine based on agent feedback

---

## Related Decisions

- [[07-Decisions/DECISIONS.md#Decision-3]] — Human authority preserved (users can override VS Code settings)
- [[07-Decisions/DECISIONS.md#Decision-5]] — Docker for execution and isolation
- [[02-Technologies/MCP_SERVERS.md]] — MCP server inventory and configuration

---

## References

- [VS Code Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings#_workspace-settings)
- [VS Code Tasks](https://code.visualstudio.com/docs/editor/tasks)
- [VS Code Debug](https://code.visualstudio.com/docs/editor/debugging)
- **WORKFLOW.md** — Development workflow (created Phase 1)
- **CLAUDE.md** — Project governance

---

## Approval

- ✅ **Reviewed by:** Human (Phase 1 planning approval)
- ✅ **Approved by:** Human (Phase 1 decision gates)
- ✅ **Status:** Implementation complete (Phase 1)

---

**Next Review:** Phase 2 Foundation, or when agents report friction with workspace configuration
