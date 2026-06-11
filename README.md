# App Builder Framework

A modular workbench for designing, planning, building, and shipping software projects with AI agents as collaborators. Instead of starting from a blank slate every time, you get a structured workflow, a shared knowledge base (the Vault), and a set of specialized AI agents that understand your project's context from day one.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | 20+ | Runs all framework scripts |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs Chroma (local vector database) |
| [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) | Latest | The AI assistant and slash command runner |
| [Git](https://git-scm.com) | 2.x+ | Version control |

---

## Quickstart

```bash
git clone https://github.com/KJG54/App-Builder my-project
cd my-project
cp .env.example .env        # fill in GITHUB_PERSONAL_ACCESS_TOKEN
npm run setup               # installs, starts Chroma, indexes the Vault
claude                      # open Claude Code
```

Then inside Claude Code:

```
/discover     → interview your project into existence
/plan-project → generate a phased implementation plan
npm run scaffold (in terminal) → create your project folder
```

To verify your setup at any time:

```bash
npm run doctor
```

---

## What's in the repo vs what stays local

This is a shared framework — the workbench, not the projects you build with it.

**Tracked in git (the framework):**
- `Vault/` — knowledge base: standards, decisions, skills, architecture docs
- `.claude/scripts/` — all automation scripts
- `.claude/commands/` — slash command definitions
- `.claude/settings.json` — hook definitions and session config
- `GETTING-STARTED.md`, `COMMANDS.md`, `CLAUDE.md` — documentation
- `docker-compose.yml`, `.mcp.json`, `package.json` — project config
- `.env.example` — environment variable template (no real credentials)

**Local only — never committed:**
- `.env` — your real credentials and tokens
- `Projects/` — the actual software you build (each is its own git repo)
- `docker/volumes/` — Chroma's database files
- `.claude/plans/`, `.claude/metrics/`, `.claude/logs/` — session runtime state

If you're contributing to the framework itself, keep this boundary in mind. Never commit `.env` or anything in `Projects/`.

---

## Full Guide

See [GETTING-STARTED.md](GETTING-STARTED.md) for the complete tutorial, reference docs, and troubleshooting.

See [COMMANDS.md](COMMANDS.md) for every available slash command and when to use each one.
