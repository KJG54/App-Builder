---
type: index
status: active
last_updated: 2026-06-11
author: Claude-Builder-Agent
---

# Project Registry

Tracks all projects scaffolded from the AI Software Factory framework.

Each project lives in `Projects/[category]/[name]/` and manages its own git repository.
The framework's `Projects/` directory is gitignored — projects are independent.

## Registry

| Name                     | Category | Type        | Chroma Collection                | Status   | Created    | GitHub |
| ------------------------ | -------- | ----------- | -------------------------------- | -------- | ---------- | ------ |
| Home Media Server        | personal | server      | project-home-media-server        | planning | 2026-06-10 | —      |
| Live Subtitle Translator | apps     | desktop-app | project-live-subtitle-translator | building | 2026-06-11 | —      |

## Status Values

| Status       | Meaning                                          |
| ------------ | ------------------------------------------------ |
| `scaffolded` | Project directory created; discovery not started |
| `discovery`  | Requirements interview in progress               |
| `planning`   | Phase plan being drafted                         |
| `building`   | Active implementation                            |
| `review`     | In pre-ship review                               |
| `shipped`    | Deployed / delivered                             |
| `archived`   | Inactive / completed                             |

## How Projects Are Created

Run `npm run scaffold` from the framework root. The script:

1. Prompts for project name, category, and type
2. Creates `Projects/[category]/[slug]/` with:
   - `Vault/01-Standards/` and `Vault/Templates/` copied from framework
   - Skeleton directories for all other Vault sections
   - `CLAUDE.md` (framework governance + project rules section)
   - `.claude/scripts/` (framework tool scripts)
   - `package.json`, `.gitignore`, `README.md`
3. Registers the project in this file

## Cross-Project Knowledge

Each project's Vault is indexed into the framework's Chroma instance under its own collection (e.g., `project-my-cool-app`).

The framework can query all project collections to detect reusable components before recommending new custom builds. See Phase 18.3 for the cross-project indexing implementation.

## See Also

- [[../AI Software Factory/Phase-18-Build-Pipeline.md|Phase 18 Build Pipeline]] — build pipeline specification
- [[../../09-Requirements/Project Build Pipeline/|Project Build Pipeline Requirements]]
