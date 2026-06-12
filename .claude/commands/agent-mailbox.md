# /agent-mailbox

Use the shared filesystem mailbox for asynchronous coordination between agents.

## What This Does

Reads or updates `.claude/agent-mailbox/mailbox.json` through the guarded CLI at `.claude/scripts/agent-mailbox.js`.

Use it when another agent, especially Codex, may continue the work later or has left a handoff for Claude.

## Instructions

1. Check status first:

```bash
node .claude/scripts/agent-mailbox.js status
```

2. If a message is addressed to you, claim it before editing:

```bash
node .claude/scripts/agent-mailbox.js claim --id <message-id> --by claude
```

3. Leave progress updates or handoffs with precise files and next actions:

```bash
node .claude/scripts/agent-mailbox.js handoff --from claude --to codex --summary "What changed" --next "What remains" --files "path/a,path/b"
```

4. Close the message when the requested work is handled:

```bash
node .claude/scripts/agent-mailbox.js close --id <message-id> --by claude --note "Handled"
```

## Rules

- Do not edit `.claude/agent-mailbox/mailbox.json` directly.
- Do not claim work you are not actively taking.
- Include changed file paths in `--files` whenever a handoff involves code or docs.
- If blocked, mark the message blocked with the exact reason.

## Related

- `Vault/04-Workflows/async-agent-collaboration.md`
- `.claude/scripts/agent-mailbox.js`
