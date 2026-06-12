# Slash Commands Reference

All `/` commands available in this Claude Code session. Invoke any of these by typing `/<command>` in the prompt.

---

## Project Commands

Custom commands built for this App Builder project. Source: `.claude/commands/`.

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/audit` | Full AI Software Factory audit — governance, Vault health, architecture consistency, scripts, tests, runtime artifacts | Periodic health check; before major milestones; when things feel out of sync |
| `/agent-mailbox` | Shared async mailbox for Codex/Claude handoffs, ownership claims, blockers, and status updates | When another agent may continue the work later, or when receiving a handoff from another agent |
| `/curator` | Find and resolve redundant, dead, misplaced, and contradictory assets | Repository feels bloated; after a sprint; before a release |
| `/discover` | Structured project discovery interview — extracts vision, personas, features, constraints, and automation opportunities; produces a formal Project Specification saved to `Vault/09-Requirements/` | Starting a **new project**; must complete before `/plan-project` |
| `/efficiency` | Identify token waste, MCP cost, context bloat, and directory scope problems in the Claude Code runtime | Session feels slow or expensive; too many permission prompts; context window growing fast |
| `/guardian` | Continuous quality monitoring — governance alignment, architecture consistency, dead code, documentation drift | Regular health check between audits; after big refactors |
| `/plan-project` | Convert a completed `/discover` spec into a phased implementation plan with deliverables, dependencies, estimates, and a mandatory approval gate | After `/discover` completes; requires a spec as input; before any build begins |
| `/simplify-project` | Answer: "what can be removed from the *project* while preserving 95% of the value?" — audits scripts, skills, MCPs, Vault docs, and over-engineering at repository scale | Project feels over-engineered; maintenance burden is high; before a major version |

---

## Workflow & Process

Superpowers skills that govern *how* to approach work — invoke these before acting, not after.

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/brainstorming` | Explores user intent, requirements, and design for a **single feature or change** before any implementation — informal, no formal output | Before creating features, building components, or modifying behavior on an *existing* project |
| `/writing-plans` | Writes a structured implementation plan for **any individual task** — no formal spec or approval gate required | Everyday planning for a feature, fix, or refactor; lighter-weight than `/plan-project` |
| `/executing-plans` | Executes a written implementation plan in a separate session with review checkpoints | Multi-session plans with 5+ stages and hard-to-undo operations |
| `/subagent-driven-development` | Executes implementation plans with independent tasks in the current session via subagents | Parallelizable implementation work within one session |
| `/dispatching-parallel-agents` | Structured approach for dispatching 2+ independent tasks simultaneously | When 2+ tasks have no shared state or sequential dependencies |
| `/finishing-a-development-branch` | Guides completion of a development branch — merge, PR, or cleanup options | When implementation is complete and tests pass; deciding how to integrate |
| `/verification-before-completion` | Verify work meets requirements before calling it done | Before any task completion |
| `/using-git-worktrees` | Sets up an isolated workspace via git worktree | Starting feature work that needs isolation; before executing large plans |

---

## Code Quality & Review

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/code-review` | Review current diff for correctness bugs and simplification opportunities at a given effort level; supports `--comment` (post as PR comments) and `--fix` (apply fixes) | Before merging; after implementing a feature |
| `/review` | General code review | Ad-hoc review request |
| `/security-review` | Security-focused review | Before shipping user-facing features; after adding auth/input handling |
| `/requesting-code-review` | Prepares and structures a code review request | Completing tasks or major features; before merging |
| `/receiving-code-review` | Guides processing of incoming review feedback with technical rigor | When review feedback arrives, especially if unclear or questionable |
| `/test-driven-development` | TDD workflow — write tests before implementation code | When implementing any feature or bugfix |
| `/systematic-debugging` | Structured debugging process — diagnose before fixing | When encountering any bug, test failure, or unexpected behavior |
| `/verify` | Run the app and observe behavior to confirm a change works | After a fix or feature; before reporting a task complete |
| `/run` | Launch this project's app to see a change working live | When asked to run, start, or screenshot the app |

---

## Research & Web

Firecrawl-powered web tools for scraping, crawling, and searching the web.

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/deep-research` | Fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report | Deep multi-source fact-checked research on any topic |
| `/firecrawl-search` | Web search via Firecrawl | Quick web lookup |
| `/firecrawl-scrape` | Scrape a single URL to clean markdown | Extract content from one page |
| `/firecrawl-crawl` | Crawl an entire site | Map and extract a full website |
| `/firecrawl-parse` | Parse structured data from a page | Extract structured data from a URL |
| `/firecrawl-map` | Generate a site map | Discover all URLs on a site |
| `/firecrawl-download` | Download files from a URL | Save remote files locally |
| `/firecrawl-interact` | Interact with a web page (click, fill forms) | Automation against live pages |
| `/firecrawl-monitor` | Monitor a URL for changes | Watch a page for updates |
| `/firecrawl-agent` | Autonomous Firecrawl agent for complex web tasks | Multi-step web research |
| `/firecrawl-cli` | Firecrawl CLI interface | Direct Firecrawl CLI commands |

---

## Skill & Config Management

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/skill-creator` | Create new skills, modify existing skills, run evals, benchmark performance | Building or improving a skill |
| `/writing-skills` | Guidance for writing high-quality skills | When authoring a new skill from scratch |
| `/skill-gen` | Generate a complete skill from a documentation URL using Firecrawl | Turning external docs into a reusable skill |
| `/update-config` | Configure Claude Code settings.json — permissions, hooks, env vars, automated behaviors | Adding permissions, setting up hooks ("from now on when X…"), env vars |
| `/keybindings-help` | Customize keyboard shortcuts and chord bindings in `~/.claude/keybindings.json` | Rebinding keys; adding chord shortcuts |
| `/fewer-permission-prompts` | Scan transcripts for common read-only calls and build an allowlist to reduce prompts | Too many permission dialogs interrupting flow |
| `/init` | Initialize a new CLAUDE.md with codebase documentation | Starting a new project that lacks a CLAUDE.md |

---

## Scheduling & Memory

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/schedule` | Create, update, list, or run cloud agents on a cron schedule | Recurring automated tasks; one-time scheduled runs |
| `/loop` | Run a prompt or slash command on a recurring interval | Polling for status; repeating a task on an interval |
| `/remember` | Save session state for clean continuation next session | End of a significant session; before a long break |

---

## AI / MCP Development

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/claude-api` | Reference for the Claude API — model IDs, pricing, params, streaming, tool use, MCP, agents, caching | Any task touching Anthropic/Claude APIs, models, or agent patterns |
| `/build-mcp-server` | Build a new MCP server | Creating a new MCP integration |
| `/build-mcp-app` | Build a full MCP-powered application | Building an app that uses MCP as its backbone |
| `/build-mcpb` | MCP builder shorthand | Quick MCP scaffolding |

---

## Design

| Command | What it does | When to use |
|---------|-------------|-------------|
| `/frontend-design` | Frontend design guidance — components, layouts, UX patterns | Building or redesigning UI; before implementing a new screen |

---

## Tips

- **Project commands** (`/audit`, `/curator`, etc.) are defined locally in `.claude/commands/` and are specific to this repository.
- **Superpowers commands** (prefixed with `superpowers:` internally) govern your working *process* — invoke them before acting, not after.
- When starting a new project from scratch: `/discover` → `/plan-project` → `/brainstorming` → build.
- When something feels broken: `/systematic-debugging` before any fix attempt.

## Comparison Notes

Commands that look similar but serve different purposes:

| Pair | Distinction |
|------|------------|
| `/discover` vs `/brainstorming` | `/discover` is project-level: structured interview, produces a formal spec saved to the Vault, required input for `/plan-project`. `/brainstorming` is feature-level: informal creative exploration before implementing any single change. |
| `/plan-project` vs `/writing-plans` | `/plan-project` consumes a `/discover` spec and produces a multi-phase roadmap with a human approval gate — for full software projects. `/writing-plans` is for any individual task; no spec or gate required. |
| `/simplify-project` vs `/simplify` | `/simplify-project` (project command) audits the whole repository for what can be removed at architecture scale. `/simplify` (built-in system skill) reviews your current code diff for cleanup and reuse. |
| `/audit` vs `/guardian` vs `/curator` | `/audit` = one-time comprehensive snapshot. `/guardian` = periodic trend-aware monitoring (tracks if health is improving or drifting). `/curator` = find dead, orphaned, misplaced, or contradictory assets. |
| `/simplify-project` vs `/curator` | `/curator` finds dead/unreferenced things. `/simplify-project` finds live things that don't justify their complexity cost. Run both for thorough cleanup. |
| `/verify` vs `/verification-before-completion` | `/verify` runs the app to confirm a specific change works. `/verification-before-completion` is a checklist skill to confirm all requirements are met before declaring a task done. |
