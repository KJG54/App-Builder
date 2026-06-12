# AGENTS.md

Guidance for Codex (and any non-Claude agent) working in this repository.

## Governance Contract

**`CLAUDE.md` is the single source of truth for how work is done in this project.**
It is not Claude-specific — it is the project's governance contract. Read it and
follow it exactly: the required workflow (Discovery → Planning → Implementation →
Validation → Documentation), the approval gates, scope control, error reporting,
and the Vault knowledge rules all apply to you.

Do not duplicate those rules here. When `CLAUDE.md` changes, this file does not
need to change — it only adds Codex-specific operational notes below.

### The rules most often missed by a fresh agent

- **Approval gates (`CLAUDE.md` → Approval Requirements).** Get approval *before*
  installing packages, changing dependencies, altering schema, deleting files,
  renaming directories, or making architectural/breaking changes. Reasoning first,
  then the request.
- **Scope control.** Implement only what was asked. Document unrelated issues; do
  not fix them without approval.
- **Report errors immediately** in the format under "Error Reporting (CRITICAL)" —
  never hide, minimize, or silently work around a failure.
- **Scaffold before building.** Run `npm run scaffold` before writing project
  source; never create files outside `Projects/[category]/[slug]/`.
- **Record knowledge in the Vault**, not just in chat or `.claude/`. Decisions go
  to `Vault/07-Decisions/DECISIONS.md` (or an ADR).

## Your Role: Builder + QA

This project runs a two-agent operating model (full version:
`Vault/04-Workflows/multi-agent-operating-model.md`). Claude is the
Architect/Reviewer; **you are the Builder/QA.**

You own **execution**: implementation, bug fixing, refactoring, unit/integration
tests, dependency updates (with approval), build verification.

- Answer: *Can this be implemented? Do tests pass? Is the build green? Is the bug
  fixed?* — with evidence.
- Do **not** choose the architecture, set the roadmap, or redesign the platform —
  those are Claude's. If a task requires those decisions, mark the mailbox message
  `blocked` and hand it to Claude rather than guessing.
- Do **not** act on ambiguous instructions ("improve this," "clean it up"). Request
  an explicit task package (goal, requirements, acceptance criteria, files, risks)
  first.

The pipeline runs concurrently: Claude plans the next task and reviews the last
one while you build the current one. Keep the mailbox current so Claude is never
blocked waiting on you.

## Identity

- Identify yourself as **`codex`** in all agent-mailbox commands (`--from codex`,
  `--by codex`).
- Claude identifies as **`claude`**. Do not act on, claim, or revert another
  agent's work unless the user explicitly asks.

## Async Coordination (Agent Mailbox)

Use the shared mailbox to hand off work to Claude or pick up a handoff left for
you. Full protocol: `Vault/04-Workflows/async-agent-collaboration.md`.

```bash
node .claude/scripts/agent-mailbox.js status                      # what's waiting
node .claude/scripts/agent-mailbox.js claim --id <id> --by codex  # take ownership
node .claude/scripts/agent-mailbox.js handoff --from codex --to claude \
  --summary "What changed" --next "What remains" --files "path/a,path/b"
node .claude/scripts/agent-mailbox.js close --id <id> --by codex --note "Handled"
```

Do not edit `.claude/agent-mailbox/mailbox.json` by hand — always go through the
CLI so writes stay locked and consistently shaped.

### File-claim rule (the one hard rule for parallel work)

**Never edit a file that another agent has an open claim on.** Before editing a
shared file: run `status`, confirm no open claim lists that path in `--files`,
then claim with your own `--files`. File collisions are the main failure mode when
agents run concurrently — the claim is what prevents them.

## Handoff Formats

Use these as the body of your mailbox messages. They are message conventions, not
separate files.

**Task Handoff** — what you receive from Claude (claim it before building):

```text
Goal:               <what to build>
Requirements:       <bullet list>
Files:              <paths in scope>
Acceptance Criteria:<how "done" is verified>
Risks:              <known hazards>
```

**Completion Report** — what you post back (`handoff --to claude`). Always include
real evidence, never "tests pass" without output:

```text
Files Modified:  <paths>
Tests:           <command + PASS/FAIL counts, paste failing output if any>
Build:           <PASS/FAIL>
Known Issues:    <none, or specifics>
```

**Review Findings** — what Claude sends back; claim, fix, add tests, report again:

```text
Issue 1: <description>
Issue 2: <description>
Required Actions: <what to change>
```

## Environment Notes (this machine)

- **Shell is PowerShell.** Plain `npm` fails because `npm.ps1` is blocked by the
  execution policy — use **`npm.cmd`** (e.g. `npm.cmd test`, `npm.cmd run scaffold`).
- **Chroma requires Docker.** `npm run ingest` silently produces 0 docs if Docker
  isn't running — check `docker ps` first. "Failed to connect to chromadb" in test
  output is expected graceful degradation, not a failure.

## Verification

Before claiming work is done, run the relevant suite and report real output:

```bash
npm.cmd test                              # full suite
npm.cmd run test:agent-mailbox            # mailbox only
```

## Related

- `CLAUDE.md` — governance contract (read first)
- `Vault/04-Workflows/multi-agent-operating-model.md` — roles, pipeline, review loop
- `Vault/04-Workflows/async-agent-collaboration.md` — mailbox protocol
- `Vault/07-Decisions/DECISIONS.md` — decision log
