# Getting Started with App Builder

## Introduction

App Builder is a framework that helps you design, plan, build, and ship software projects using AI agents as collaborators. Instead of starting from a blank slate, you get a structured workflow, a shared knowledge base, and a set of specialized AI agents that know your project's context.

This guide walks you through your first project from start to finish, then gives you a reference for every tool available.

---

## Mental Model

Before you start, three concepts underpin everything:

```
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
|------|---------|-----|
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
