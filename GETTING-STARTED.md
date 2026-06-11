# Getting Started with App Builder

## Introduction

App Builder is a framework that helps you design, plan, build, and ship software projects using AI agents as collaborators. Instead of starting from a blank slate, you get a structured workflow, a shared knowledge base, and a set of specialized AI agents that know your project's context.

This guide walks you through your first project from start to finish, then gives you a reference for every tool available.

### How to start a new project

This repo IS the workbench — you don't copy it per project. The intended workflow:

1. Run `/discover` — Claude interviews you about the project (goals, tech, constraints). Produces a spec in `Vault/09-Requirements/`.
2. Run `/plan-project` — Generates a phased implementation plan from the spec.
3. Run `npm run scaffold` — Creates a scaffolded project folder in `Projects/` (gitignored). Each scaffolded project is its own directory with its own git repo.
4. Work on the project using the framework's agents, skills, and Chroma context.
5. Run `npm run build` / `npm run ship` — Build and ship pipeline.

---

## Mental Model

Before you start, three concepts underpin everything:

```text
Vault     — A folder of markdown files. The project's long-term memory.
            Standards, decisions, session notes, requirements all live here.

Chroma    — A vector database that indexes the Vault so AI agents can
            search it semantically. Run `npm run ingest` to re-index after
            big changes.

Agents    — Specialized Claude models (Architect, Backend, Frontend, etc.)
            with different roles and authority levels. Each one reads from
            the Vault to understand your project before acting.
```

The workflow is always the same: **capture knowledge → plan → build → record what you learned**.

---

## Prerequisites

Before using this framework you need:

| Tool | Version | Why |
| ---- | ------- | --- |
| [Node.js](https://nodejs.org) | 20+ | Runs all framework scripts |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs Chroma (the vector database) |
| [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) | Latest | The AI assistant that runs slash commands |
| [Git](https://git-scm.com) | 2.x+ | Version control and session commits |

**Check your setup:**

```bash
node --version   # should print v20.x.x or higher
docker --version # should print a version number
claude --version # should print a version number
git --version    # should print git version 2.x.x
```

---

## Part 1: Tutorial — Build Your First Project

We'll build a **Task Tracker API** together. By the end you'll have scaffolded a project, interviewed it into existence with AI, generated a phase plan, built it, and shipped it.

### Step 1: Clone and install

```bash
git clone <your-repo-url> my-task-tracker
cd my-task-tracker
npm install
```

> **What just happened?** You now have the framework locally. `npm install` pulled in three dependencies: `chromadb` (the vector DB client), `@chroma-core/default-embed` (local text embeddings), and `proper-lockfile` (used by background scripts). The framework itself is in `.claude/scripts/` — those are the scripts behind every `npm run` command.

---

### Step 2: Scaffold your project

```bash
npm run scaffold
```

The script asks three questions:

```text
Project name: Task Tracker API
Category: (apps / tools / games / experiments / client-work / internal) → apps
Type: (web-app / api / desktop-app / ai-system / game / automation / internal-tool / other) → api
```

> **What just happened?** The scaffolder created `Projects/apps/task-tracker-api/` with a complete skeleton: a project-level Vault (standards, decisions, workflows), a `CLAUDE.md` governance file, a `package.json`, a `.gitignore`, and a `README.md`. It also registered the project in Chroma so agents can find it later. Every project you create lives under `Projects/[category]/[name]/`.

---

### Step 3: Run discovery

Open Claude Code in your terminal (`claude`) and run:

```text
/discover
```

Claude will ask you questions one at a time about your project — what it does, who uses it, what the constraints are. Answer naturally. When the interview is complete, it saves a Project Specification to `Vault/09-Requirements/`.

> **What just happened?** The `/discover` command runs the Project Discovery Interview skill. It extracts your requirements, assumptions, and constraints into a structured spec before a single line of code is written. This spec is what every subsequent agent reads to understand what it's building. Don't skip this step — it's the foundation everything else builds on.

---

### Step 4: Generate a plan

```text
/plan-project
```

Claude reads the discovery spec and produces a phased implementation plan: sequenced phases, per-phase deliverables, effort estimates, and a cost estimate. It will ask for your approval before proceeding.

> **What just happened?** The `/plan-project` command ran the Phase Plan Generator skill. It turned your requirements spec into a concrete build plan. The plan is saved to `Projects/apps/task-tracker-api/Vault/03-Projects/task-tracker-api/Phase-Plan.md`. Nothing gets built until you approve it — that's the human gate.

---

### Step 5: Build

```bash
npm run build
```

The build runner reads the approved phase plan and begins executing phases. It checks in with you at human approval gates and records progress in the project Vault.

> **What just happened?** `build-runner.js` orchestrated the build loop: it assembled context from Chroma (standards, prior decisions, your spec), dispatched the right agents for each phase, and tracked state using a finite state machine. Each phase is committed to git when complete. If something fails, the runner stops and reports the error — it never silently continues past a broken state.

---

### Step 6: Ship

```bash
npm run ship
```

The ship script runs the review pipeline (code review, security check, test suite) and prepares the project for release. It will prompt you for final approval before pushing.

> **What just happened?** `ship-project.js` ran the review and ship pipeline: automated checks (tests, security scan, lint), a summary of what's being shipped, and a final human gate. After approval it pushes to your remote and creates a release tag. The review report is saved to `Vault/Logs/`.

---

### Step 7: Wrap up the session

At the end of every working session, run:

```text
/wrap-up
```

Claude generates a session summary, stages your changes, commits, and pushes to origin.

> **What just happened?** `/wrap-up` is the end-of-day ritual. It creates a `Vault/08-Retrospectives/Session-Summary-<date>.md` capturing what you built, decisions made, and next steps. This is how the Vault grows over time — each session's learnings become searchable context for future sessions. Future you (and future agents) will thank present you for this.

---

## Part 2: Reference

Quick reference for every tool in the framework. Bookmark this section.

---

### Slash Commands

Run these in Claude Code (`claude` in your terminal).

| Command | Purpose | When to use |
| ------- | ------- | ----------- |
| `/discover` | Structured project interview → saves spec to `Vault/09-Requirements/` | Start of every new project, before any building |
| `/plan-project` | Generates phased build plan from a discovery spec | After `/discover` is complete and spec is approved |
| `/audit` | Full project health scan → improvement report + task list | First-pass checkup on a new or existing project |
| `/guardian` | Continuous health monitoring → trend report in `Vault/Logs/` | Regularly, to track whether the project is getting healthier |
| `/wrap-up` | Session summary → commit → push to origin | End of every working session |

**`/audit` vs `/guardian`:** Use `/audit` for a thorough one-time deep scan. Use `/guardian` regularly to track trends. They complement each other.

---

### NPM Scripts

| Script | What it does |
| ------ | ------------ |
| `npm run scaffold` | Create a new project under `Projects/[category]/[name]/` |
| `npm run build` | Run the autonomous build loop against an approved phase plan |
| `npm run ship` | Run review pipeline and ship the project |
| `npm run ingest` | Re-index the framework Vault into Chroma |
| `npm run ingest:project` | Re-index a project's Vault into Chroma |
| `npm test` | Run all phase validation scripts (phases 8–16) |
| `npm run test:all` | Alias for `npm test` |
| `npm run test:phase-N` | Run validation for a specific phase (replace N with 8–16) |

**When to re-ingest:** Run `npm run ingest` after adding significant new content to the Vault (new ADRs, standards, or requirements). Chroma won't pick up changes automatically.

---

### Agents

Agents are Claude models with specialized instructions. Each knows its role, its constraints, and when to escalate to a human.

| Agent | Model | Role | When active |
| ----- | ----- | ---- | ----------- |
| Project Discovery | Claude Opus | Interviews you, extracts requirements, produces the project spec | Start of any new project |
| Project Guardian | Claude Opus | Continuous health monitoring, technical debt tracking, improvement recommendations | Ongoing — run regularly |
| Architect | Claude Opus | System design, technology decisions, architectural review | Phase 3+ |
| Security | Claude Opus | Threat analysis, vulnerability assessment, compliance | Phase 2+ |
| Verification | Claude Opus | Requirements coverage, ADR validation, pre-implementation gates | Phase 8+ |
| Backend | Claude Sonnet | APIs, business logic, databases | Phase 5+ |
| Frontend | Claude Sonnet | UI components, accessibility | Phase 5+ |
| DevOps | Claude Sonnet | Containerization, deployment, monitoring | Phase 5+ |
| QA | Claude Sonnet | Test design, bug detection, quality metrics | Phase 8+ |
| Documentation | Claude Haiku | Technical writing, API docs, session summaries | Phase 2+ |

Agents operate under five authority tiers (Tier 1 = no approval needed → Tier 5 = human-only). The Architect and Verification agents can block work from proceeding; the build loop respects these gates.

---

### Skills

Skills are reusable instruction sets that agents follow for specific tasks. They live in `Vault/05-Prompts/Skills/`.

| Skill | Status | Purpose |
| ----- | ------ | ------- |
| AI Software Factory Audit | Active | Full project audit with improvement task plan |
| User Authentication System Design | Active | Design a complete auth system |
| Project Discovery Interview | Draft | Requirements gathering interview |
| Project Guardian | Draft | Health monitoring with trend tracking |
| Phase Plan Generator | Draft | Generate phased build plans from specs |
| API Design | Beta | RESTful API design patterns |
| Microservice Architecture | Beta | Service decomposition and communication |
| Database Schema Design | Beta | Relational and document schema design |
| REST API Implementation | Beta | Endpoint implementation patterns |
| Testing Strategy | Beta | Test pyramid, coverage, test design |
| Docker Containerization | Beta | Container setup and best practices |
| CI/CD Pipeline | Beta | Automated build and deploy pipelines |
| Code Review Process | Beta | Structured code review checklist |

**Status legend:** Active = recommended; Draft = under review; Beta = proposed, not yet validated.
Full index: `Vault/05-Prompts/Skills/SKILLS-INDEX.md`

---

### Vault Navigation

The `Vault/` folder is the project's long-term memory. Every significant decision, standard, and session note lives here.

```text
Vault/
├── 01-Standards/       Governance rules: coding, architecture, security, documentation
├── 02-Technologies/    Technology guides: Chroma, Docker, MCP servers
├── 03-Projects/        Project specs, architecture diagrams, roadmaps
├── 04-Workflows/       Process guides: new project, build API, debug, deploy
├── 05-Prompts/         Agent instruction prompts and skills library
├── 06-Research/        Technology spikes and exploratory investigations
├── 07-Decisions/       Architectural Decision Records (ADRs) — the why behind choices
├── 08-Retrospectives/  Session summaries — what was built, learned, decided each day
├── 09-Requirements/    Project specs produced by /discover
├── 10-Known-Problems/  Known issues, workarounds, and their resolution status
├── INDEX.md            Start here — navigation guide by role and topic
├── STATUS.md           Live dashboard: phase progress, recent ADRs, blockers
└── Logs/               Guardian reports, build logs, review reports
```

**Best entry points:**

- `Vault/INDEX.md` — navigate by role (Architect, Backend, DevOps, PM)
- `Vault/STATUS.md` — see what's complete and what's in progress
- `Vault/07-Decisions/DECISIONS.md` — understand every major architectural choice

---

### Workflows

Documented processes for common multi-step tasks. Full docs in `Vault/04-Workflows/`.

| Workflow | Purpose | When to use |
| -------- | ------- | ----------- |
| New Project | Set up a project from scratch: requirements → architecture → roadmap → approval | Starting any new project or product |
| Build API | Design and implement a REST endpoint end-to-end | Implementing backend features |
| Debug Application | Diagnose and fix a bug systematically | Any time something breaks |
| Deploy Service | Release to staging/production with health checks and rollback plan | After implementation, before release |
| End of Day | Session wrap-up: summary → commit → push | Daily — use `/wrap-up` to run this |

---

## Troubleshooting

### Docker is not running

**Symptom:** `npm run ingest` fails with `ECONNREFUSED` or `Failed to connect to Chroma`.

**Fix:** Start Docker Desktop, wait for it to fully start (the whale icon in your taskbar stops animating), then retry.

```bash
docker ps   # should list containers without error
```

If Chroma is not running as a container:

```bash
docker-compose up -d chroma
```

---

### Chroma returns no results after ingest

**Symptom:** `npm run ingest` completes but `/discover` or context assembly returns empty results.

**Fix:** Re-run ingest and check the output for errors. Chroma requires the embedding model to download on first run — this can take a minute.

```bash
npm run ingest
# Look for: "Ingested X documents" with X > 0
# If X = 0, check that Vault/ has .md files with valid YAML frontmatter
```

---

### `npm install` fails

**Symptom:** Error during `npm install`, often related to `chromadb` or native bindings.

**Fix:** Ensure Node.js 20+ is installed. The `chromadb` package requires Node 18+ for its native embedding support.

```bash
node --version               # must be v20.x.x or higher
npm install --legacy-peer-deps   # if peer dependency conflicts occur
```

---

### Claude Code doesn't recognize a slash command

**Symptom:** `/discover` or `/plan-project` returns "command not found" or does nothing.

**Fix:** Slash commands are loaded from `.claude/commands/`. Ensure you're running Claude Code from the project root directory (where `CLAUDE.md` lives).

```bash
ls .claude/commands/   # should list discover.md, plan-project.md, etc.
```

---

### `npm run build` exits immediately

**Symptom:** Build runner starts and stops without doing anything.

**Fix:** The build runner requires an approved phase plan. Run `/discover` then `/plan-project` first, and approve the plan when prompted. The runner looks for `Phase-Plan.md` in the project Vault.

---

## How to Get Help

### Run an audit

```text
/audit
```

Runs a full project health scan and produces a prioritized improvement list. Good starting point when something feels wrong but you're not sure what.

### Run the guardian

```text
/guardian
```

Produces a health report at `Vault/Logs/guardian-report-<date>.md` covering governance, architecture, code quality, and documentation. Tracks trends across sessions.

### Check Known Problems

`Vault/10-Known-Problems/` — documented issues with their current status (open / workaround available / resolved). Check here before spending time debugging something that's already been diagnosed.

### Read the Vault

- `Vault/INDEX.md` — navigation guide by role and question
- `Vault/07-Decisions/DECISIONS.md` — every major architectural decision with rationale
- `Vault/08-Retrospectives/` — session notes from every past session

---

## Next Steps

You've completed the tutorial. Here's where to go next:

**Understand the governance:**
Read `CLAUDE.md` — it defines the framework's principles, required workflow phases, approval requirements, and how decisions get made. Every agent in the framework reads this file.

**Understand architectural decisions:**
Read `Vault/07-Decisions/DECISIONS.md` — the index of every major decision with rationale. When you wonder "why does the framework do X this way?", the answer is usually here.

**Explore workflows:**
Read `Vault/04-Workflows/README.md` — the four core workflows (New Project, Build API, Debug, Deploy) with step-by-step guidance including human approval gates.

**Explore agent capabilities:**
Read `Vault/05-Prompts/README.md` — the agent library, capability matrix, and authority tier system. Understanding what each agent can and can't do helps you know when to expect it to ask for your approval.

**Keep the Vault current:**
Run `/wrap-up` at the end of every session. Run `npm run ingest` after adding significant new content. Run `/guardian` weekly. These three habits keep the framework's knowledge base healthy.
