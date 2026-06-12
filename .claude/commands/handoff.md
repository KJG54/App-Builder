# /handoff

Save this session's state to the shared agent mailbox as a unique, non-overwriting handoff — the multi-session-safe alternative to `/remember`.

## What This Does

Posts a session handoff to `.claude/agent-mailbox/` through `.claude/scripts/agent-mailbox.js`. Unlike `/remember` (which overwrites a single `remember.md`), **every call here creates a separate message with its own ID**, so multiple concurrent Claude/Codex sessions can each save state without clobbering one another.

Use it to close out a session, or any time you hand work to another session or agent.

## Arguments

`/handoff [label]` — optional session label used as the `--from` identity (e.g. `claude-arch`, `codex-1`). If omitted, derive one from the current git branch and time: `claude-<branch>-<HHMM>`.

## Instructions

1. **Determine the session identity (`FROM`):**
   - If a label was passed in `$ARGUMENTS`, use it verbatim.
   - Otherwise derive `claude-<branch>-<HHMM>` — get the branch with `git rev-parse --abbrev-ref HEAD`.

2. **Gather this session's state concisely** (you were here — use the conversation, do not re-derive):
   - **Summary** — what was done or decided.
   - **Next** — the single best next step(s), in priority order.
   - **Blockers** — anything preventing progress (omit if none).
   - **Files** — exact paths touched or relevant, comma-separated.

3. **Post the handoff:**

```bash
node .claude/scripts/agent-mailbox.js handoff \
  --from "<FROM>" --to all \
  --summary "<summary>" \
  --next "<next>" \
  --files "<path,path>"
```

   Add `--blockers "<text>"` only if there are blockers.

4. **Confirm:** report the returned `msg-...` ID, then run `status` so the user sees every open handoff (none overwritten):

```bash
node .claude/scripts/agent-mailbox.js status
```

## Picking Up Handoffs (start of a session)

To read what other sessions left, then take ownership and close when handled:

```bash
node .claude/scripts/agent-mailbox.js status
node .claude/scripts/agent-mailbox.js read  --id <message-id>
node .claude/scripts/agent-mailbox.js claim --id <message-id> --by "<FROM>"
node .claude/scripts/agent-mailbox.js close --id <message-id> --by "<FROM>" --note "Handled"
```

## Rules

- One handoff per session close-out. Use a **distinct `--from` per session** so ownership is unambiguous.
- Keep it operational. Anything permanent (a decision, architecture change, known problem) must also be recorded in the Vault, not only here.
- Always include changed file paths in `--files` when code or docs changed.
- Do not edit `.claude/agent-mailbox/mailbox.json` by hand — go through the CLI so writes stay locked.

## Related

- `/agent-mailbox` — general mailbox usage (claim, block, list, read)
- `Vault/04-Workflows/multi-agent-operating-model.md` — roles and the async pipeline
- `Vault/04-Workflows/async-agent-collaboration.md` — mailbox protocol
- `.claude/scripts/agent-mailbox.js`
