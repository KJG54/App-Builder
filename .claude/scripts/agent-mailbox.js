#!/usr/bin/env node

/**
 * Agent Mailbox
 *
 * File-backed async coordination for agents that share this workspace.
 * Stores mutable runtime state under .claude/agent-mailbox/ and writes a
 * readable latest.md summary for quick handoff review.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lockfile = require('proper-lockfile');

const ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_MAILBOX_DIR = path.join(ROOT, '.claude', 'agent-mailbox');
const MAILBOX_DIR = process.env.AGENT_MAILBOX_DIR
  ? path.resolve(process.env.AGENT_MAILBOX_DIR)
  : DEFAULT_MAILBOX_DIR;
const MAILBOX_FILE = path.join(MAILBOX_DIR, 'mailbox.json');
const SUMMARY_FILE = path.join(MAILBOX_DIR, 'latest.md');
const VALID_STATUSES = new Set(['open', 'claimed', 'blocked', 'closed']);

function now() {
  return new Date().toISOString();
}

function generateId(prefix = 'msg') {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hash = crypto.randomBytes(3).toString('hex');
  return `${prefix}-${date}-${hash}`;
}

function ensureMailboxDir() {
  fs.mkdirSync(MAILBOX_DIR, { recursive: true });
}

function emptyMailbox() {
  const timestamp = now();
  return {
    version: 1,
    created_at: timestamp,
    updated_at: timestamp,
    messages: [],
  };
}

function readMailbox() {
  ensureMailboxDir();
  if (!fs.existsSync(MAILBOX_FILE)) {
    return emptyMailbox();
  }

  const raw = fs.readFileSync(MAILBOX_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.messages)) {
    parsed.messages = [];
  }
  return parsed;
}

function writeMailbox(mailbox) {
  mailbox.updated_at = now();
  fs.writeFileSync(MAILBOX_FILE, `${JSON.stringify(mailbox, null, 2)}\n`, 'utf8');
  writeSummary(mailbox);
}

async function withMailbox(mutator, { readOnly = false } = {}) {
  ensureMailboxDir();
  let release;
  try {
    release = await lockfile.lock(MAILBOX_DIR, {
      retries: { retries: 8, minTimeout: 25, maxTimeout: 100 },
      stale: 10000,
    });
    const mailbox = readMailbox();
    const result = await mutator(mailbox);
    if (!readOnly) {
      writeMailbox(mailbox);
    }
    return result;
  } finally {
    if (release) {
      await release();
    }
  }
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeList);
  return String(value)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function requireArg(args, name) {
  if (!args[name]) {
    throw new Error(`Missing required argument: --${name}`);
  }
  return String(args[name]);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }

    const trimmed = token.slice(2);
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex >= 0) {
      const key = trimmed.slice(0, eqIndex);
      const value = trimmed.slice(eqIndex + 1);
      addArg(args, key, value);
      continue;
    }

    const key = trimmed;
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      addArg(args, key, true);
    } else {
      addArg(args, key, next);
      i++;
    }
  }
  return args;
}

function addArg(args, key, value) {
  if (args[key] === undefined) {
    args[key] = value;
  } else if (Array.isArray(args[key])) {
    args[key].push(value);
  } else {
    args[key] = [args[key], value];
  }
}

function createMessage(args, kindOverride = null) {
  const timestamp = now();
  const status = args.status ? String(args.status) : 'open';
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status "${status}". Use one of: ${Array.from(VALID_STATUSES).join(', ')}`);
  }

  return {
    id: generateId(),
    kind: kindOverride || String(args.kind || 'update'),
    from: requireArg(args, 'from'),
    to: String(args.to || 'all'),
    subject: requireArg(args, 'subject'),
    body: String(args.body || ''),
    task: args.task ? String(args.task) : '',
    files: normalizeList(args.files || args.file),
    status,
    claimed_by: status === 'claimed' ? String(args.by || args.from) : null,
    created_at: timestamp,
    updated_at: timestamp,
    closed_at: status === 'closed' ? timestamp : null,
    history: [
      {
        at: timestamp,
        by: String(args.from),
        action: 'posted',
        note: args.note ? String(args.note) : '',
      },
    ],
  };
}

function createHandoff(args) {
  if (!args.summary && !args.body) {
    throw new Error('Missing required argument: --summary or --body');
  }
  const summary = String(args.summary || args.body);
  const next = args.next ? `\n\nNext:\n${args.next}` : '';
  const blockers = args.blockers ? `\n\nBlockers:\n${args.blockers}` : '';
  return createMessage({
    ...args,
    subject: args.subject || 'Session handoff',
    body: `${summary}${next}${blockers}`,
    kind: 'handoff',
  }, 'handoff');
}

function findMessage(mailbox, id) {
  const message = mailbox.messages.find(item => item.id === id);
  if (!message) {
    throw new Error(`Message not found: ${id}`);
  }
  return message;
}

function appendHistory(message, by, action, note = '') {
  const timestamp = now();
  message.updated_at = timestamp;
  message.history.push({ at: timestamp, by, action, note });
}

function claimMessage(mailbox, args) {
  const id = requireArg(args, 'id');
  const by = requireArg(args, 'by');
  const message = findMessage(mailbox, id);

  if (message.status === 'closed') {
    throw new Error(`Cannot claim closed message: ${id}`);
  }
  if (message.status === 'claimed' && message.claimed_by && message.claimed_by !== by) {
    throw new Error(`Message ${id} is already claimed by ${message.claimed_by}`);
  }

  message.status = 'claimed';
  message.claimed_by = by;
  appendHistory(message, by, 'claimed', args.note ? String(args.note) : '');
  return message;
}

function closeMessage(mailbox, args) {
  const id = requireArg(args, 'id');
  const by = requireArg(args, 'by');
  const message = findMessage(mailbox, id);
  message.status = 'closed';
  message.claimed_by = message.claimed_by || by;
  message.closed_at = now();
  appendHistory(message, by, 'closed', args.note ? String(args.note) : '');
  return message;
}

function blockMessage(mailbox, args) {
  const id = requireArg(args, 'id');
  const by = requireArg(args, 'by');
  const note = requireArg(args, 'note');
  const message = findMessage(mailbox, id);
  message.status = 'blocked';
  appendHistory(message, by, 'blocked', note);
  return message;
}

function filteredMessages(mailbox, args) {
  let messages = [...mailbox.messages];
  if (args.to) {
    const to = String(args.to).toLowerCase();
    messages = messages.filter(item =>
      String(item.to).toLowerCase() === to ||
      String(item.to).toLowerCase() === 'all'
    );
  }
  if (args.from) {
    const from = String(args.from).toLowerCase();
    messages = messages.filter(item => String(item.from).toLowerCase() === from);
  }
  if (args.status) {
    const status = String(args.status);
    messages = messages.filter(item => item.status === status);
  }
  if (args.open) {
    messages = messages.filter(item => item.status !== 'closed');
  }
  return messages.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
}

function formatMessage(message, detailed = false) {
  const lines = [
    `${message.id} [${message.status}] ${message.kind}: ${message.subject}`,
    `  from: ${message.from} -> ${message.to}`,
  ];
  if (message.task) lines.push(`  task: ${message.task}`);
  if (message.claimed_by) lines.push(`  claimed_by: ${message.claimed_by}`);
  if (message.files.length) lines.push(`  files: ${message.files.join(', ')}`);
  lines.push(`  updated: ${message.updated_at}`);
  if (detailed && message.body) {
    lines.push('');
    lines.push(message.body);
  }
  if (detailed && message.history.length) {
    lines.push('');
    lines.push('history:');
    for (const entry of message.history) {
      const note = entry.note ? ` - ${entry.note}` : '';
      lines.push(`  - ${entry.at} ${entry.by} ${entry.action}${note}`);
    }
  }
  return lines.join('\n');
}

function writeSummary(mailbox) {
  const open = mailbox.messages.filter(item => item.status !== 'closed');
  const closed = mailbox.messages.filter(item => item.status === 'closed');
  const lines = [
    '# Agent Mailbox',
    '',
    `Updated: ${mailbox.updated_at}`,
    '',
    '## Open Messages',
    '',
  ];

  if (open.length === 0) {
    lines.push('_No open messages._');
  } else {
    for (const message of open.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))) {
      lines.push(`- ${message.id} [${message.status}] ${message.from} -> ${message.to}: ${message.subject}`);
      if (message.files.length) lines.push(`  Files: ${message.files.join(', ')}`);
      if (message.task) lines.push(`  Task: ${message.task}`);
    }
  }

  lines.push('');
  lines.push('## Recently Closed');
  lines.push('');

  for (const message of closed
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 10)) {
    lines.push(`- ${message.id} ${message.from} -> ${message.to}: ${message.subject}`);
  }
  if (closed.length === 0) {
    lines.push('_No closed messages._');
  }

  lines.push('');
  lines.push('Use `node .claude/scripts/agent-mailbox.js status` for the live view.');
  fs.writeFileSync(SUMMARY_FILE, `${lines.join('\n')}\n`, 'utf8');
}

async function run(command, args) {
  switch (command) {
    case 'init':
      return withMailbox(mailbox => {
        writeSummary(mailbox);
        return `Initialized mailbox at ${path.relative(ROOT, MAILBOX_FILE)}`;
      });
    case 'post':
      return withMailbox(mailbox => {
        const message = createMessage(args);
        mailbox.messages.push(message);
        return formatMessage(message, true);
      });
    case 'handoff':
      return withMailbox(mailbox => {
        const message = createHandoff(args);
        mailbox.messages.push(message);
        return formatMessage(message, true);
      });
    case 'claim':
      return withMailbox(mailbox => formatMessage(claimMessage(mailbox, args), true));
    case 'close':
      return withMailbox(mailbox => formatMessage(closeMessage(mailbox, args), true));
    case 'block':
      return withMailbox(mailbox => formatMessage(blockMessage(mailbox, args), true));
    case 'read':
      return withMailbox(
        mailbox => formatMessage(findMessage(mailbox, requireArg(args, 'id')), true),
        { readOnly: true }
      );
    case 'list':
      return withMailbox(mailbox => {
        const messages = filteredMessages(mailbox, args);
        return messages.length
          ? messages.map(item => formatMessage(item, Boolean(args.details))).join('\n\n')
          : 'No matching messages.';
      }, { readOnly: true });
    case 'status':
      return withMailbox(mailbox => {
        const open = mailbox.messages.filter(item => item.status === 'open').length;
        const claimed = mailbox.messages.filter(item => item.status === 'claimed').length;
        const blocked = mailbox.messages.filter(item => item.status === 'blocked').length;
        const closed = mailbox.messages.filter(item => item.status === 'closed').length;
        const header = [
          `Mailbox: ${path.relative(ROOT, MAILBOX_FILE)}`,
          `Open: ${open} | Claimed: ${claimed} | Blocked: ${blocked} | Closed: ${closed}`,
          '',
        ];
        const body = filteredMessages(mailbox, { open: true });
        return header.concat(body.length
          ? body.map(item => formatMessage(item))
          : ['No open messages.']).join('\n\n');
      }, { readOnly: true });
    default:
      return usage();
  }
}

function usage() {
  return [
    'Agent Mailbox',
    '',
    'Commands:',
    '  init',
    '  status',
    '  list [--to AGENT] [--from AGENT] [--status open|claimed|blocked|closed] [--open] [--details]',
    '  read --id ID',
    '  post --from AGENT --to AGENT|all --subject TEXT [--body TEXT] [--task TEXT] [--files a,b]',
    '  handoff --from AGENT --to AGENT|all --summary TEXT [--next TEXT] [--blockers TEXT] [--files a,b]',
    '  claim --id ID --by AGENT [--note TEXT]',
    '  close --id ID --by AGENT [--note TEXT]',
    '  block --id ID --by AGENT --note TEXT',
  ].join('\n');
}

if (require.main === module) {
  const [command = 'status', ...rest] = process.argv.slice(2);
  run(command, parseArgs(rest))
    .then(output => {
      console.log(output);
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`);
      process.exit(1);
    });
}

module.exports = {
  run,
  parseArgs,
  readMailbox,
  createMessage,
  createHandoff,
  MAILBOX_DIR,
  MAILBOX_FILE,
  SUMMARY_FILE,
};
