# Getting Started Guide — Design Spec

**Date:** 2026-06-10  
**Status:** Approved  
**Author:** Claude (brainstorming session with Krystian Garcia)

---

## Context

All 18 framework phases are complete. This spec defines the user-facing Getting Started guide for the App Builder Framework — the first thing a new user reads when they open the repo.

---

## Audience

Technical but not a developer. Can run commands in a terminal, understands software concepts, needs context for why things work the way they do — not just how.

---

## File Location

`GETTING-STARTED.md` at the project root.

---

## Structure

```
GETTING-STARTED.md
├── Introduction              — what this framework is and what it does for you
├── Mental Model              — Vault / Chroma / Agents explained in ~5 lines
├── Prerequisites             — Node.js, Docker, Claude Code CLI, Git
├── Part 1: Tutorial          — build "Task Tracker API" example end-to-end
│   ├── 1. Clone & install    — git clone + npm install + "What just happened?"
│   ├── 2. Scaffold           — npm run scaffold + callout
│   ├── 3. Run discovery      — /discover + callout
│   ├── 4. Generate a plan    — /plan-project + callout
│   ├── 5. Build              — npm run build + callout
│   ├── 6. Ship               — npm run ship + callout
│   └── 7. Wrap up            — /wrap-up + callout
├── Part 2: Reference
│   ├── Slash Commands        — table: command / purpose / when to use
│   ├── NPM Scripts           — table: script / what it does
│   ├── Agents                — table: agent / model / role / when active
│   ├── Skills                — table: skill / status / purpose
│   ├── Vault Navigation      — directory map with one-line descriptions
│   └── Workflows             — table: workflow / purpose / when to use
├── Troubleshooting           — top common first-run failures + fixes
├── How to Get Help           — /audit, /guardian, Vault/10-Known-Problems
└── Next Steps                — CLAUDE.md, Vault/07-Decisions, workflow docs
```

---

## Writing Guidelines

- "What just happened?" callouts use a blockquote (`>`) after each tutorial step
- Reference tables use GitHub-flavored markdown
- Mental model is presented in a fenced block or callout to visually separate it
- No filler — every sentence earns its place
- Vault paths use backtick formatting; commands use code blocks
- Concrete example project: "Task Tracker API" — generic enough for any reader to follow

---

## Source Material

| Section | Source |
|---------|--------|
| Slash Commands | `.claude/commands/*.md` |
| NPM Scripts | `package.json` |
| Agents | `Vault/05-Prompts/README.md` |
| Skills | `Vault/05-Prompts/Skills/SKILLS-INDEX.md` |
| Vault Navigation | `Vault/INDEX.md` |
| Workflows | `Vault/04-Workflows/README.md` |
| Troubleshooting | `Vault/10-Known-Problems/`, Phase 16 Chroma diagnosis |
