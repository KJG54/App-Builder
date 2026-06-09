#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read-only command patterns that Claude Code auto-allows
const AUTO_ALLOWED = new Set([
  'cal', 'uptime', 'cat', 'head', 'tail', 'wc', 'stat', 'strings', 'hexdump', 'od', 'nl',
  'id', 'uname', 'free', 'df', 'du', 'locale', 'groups', 'nproc', 'basename', 'dirname',
  'realpath', 'cut', 'paste', 'tr', 'column', 'tac', 'rev', 'fold', 'expand', 'unexpand',
  'fmt', 'comm', 'cmp', 'numfmt', 'readlink', 'diff', 'true', 'false', 'sleep', 'which',
  'type', 'expr', 'seq', 'tsort', 'pr', 'echo', 'ls', 'cd', 'pwd', 'whoami', 'alias'
]);

// Read-only git commands
const GIT_READONLY = new Set([
  'git status', 'git log', 'git diff', 'git show', 'git blame', 'git branch',
  'git tag', 'git remote', 'git ls-files', 'git ls-remote', 'git config',
  'git rev-parse', 'git describe', 'git stash', 'git reflog', 'git shortlog',
  'git cat-file', 'git for-each-ref', 'git worktree'
]);

// Read-only gh commands
const GH_READONLY = new Set([
  'gh pr view', 'gh pr list', 'gh pr diff', 'gh pr checks', 'gh pr status',
  'gh issue view', 'gh issue list', 'gh issue status', 'gh run view', 'gh run list',
  'gh workflow list', 'gh workflow view', 'gh repo view', 'gh release view',
  'gh release list', 'gh api', 'gh auth status'
]);

// Docker read-only commands
const DOCKER_READONLY = new Set([
  'docker ps', 'docker images', 'docker logs', 'docker inspect'
]);

// Extract command from a bash command string
function extractCommand(cmd) {
  if (!cmd) return null;

  // Remove leading sudo, timeout, env vars
  let c = cmd.replace(/^(sudo\s+)|(timeout\s+[0-9]+s?\s+)/, '').trim();
  c = c.replace(/^[A-Z_]+=[^ ]+ /, '');

  // Get the first token (main command)
  const tokens = c.split(/\s+/);
  if (tokens.length === 0) return null;

  const mainCmd = tokens[0];
  const subCmd = tokens[1];

  return { main: mainCmd, sub: subCmd, full: c };
}

function isReadOnly(cmdObj) {
  if (!cmdObj) return false;

  const { main, sub, full } = cmdObj;

  // Check auto-allowed
  if (AUTO_ALLOWED.has(main)) return true;

  // Check git commands
  if (main === 'git') {
    if (GIT_READONLY.has(`git ${sub}`)) return true;
    // Allow common git read-only subcommands
    const readonly_gits = ['status', 'log', 'diff', 'show', 'blame', 'branch', 'tag',
      'remote', 'ls-files', 'ls-remote', 'config', 'rev-parse', 'describe', 'stash',
      'reflog', 'shortlog', 'cat-file', 'for-each-ref', 'worktree'];
    if (readonly_gits.includes(sub)) return true;
  }

  // Check gh commands
  if (main === 'gh') {
    const readonly_ghs = ['pr', 'issue', 'run', 'workflow', 'repo', 'release', 'api', 'auth'];
    if (readonly_ghs.includes(sub)) {
      // gh api needs GET
      if (sub === 'api' && !full.includes('--method') && !full.includes('-X')) return true;
      if (sub !== 'api') return true;
    }
  }

  // Check docker commands
  if (main === 'docker') {
    const readonly_dockers = ['ps', 'images', 'logs', 'inspect'];
    if (readonly_dockers.includes(sub)) return true;
  }

  // Check ripgrep, grep, find (with restrictions)
  if (['grep', 'egrep', 'fgrep', 'rg', 'fd', 'fdfind'].includes(main)) {
    // These are read-only
    return true;
  }

  // Check jq
  if (main === 'jq') return true;

  return false;
}

// Parse transcripts
const transcriptDir = path.join(process.env.HOME, '.claude/projects/C--Users-kryst-Code-App-Builder');
const files = fs.readdirSync(transcriptDir)
  .filter(f => f.endsWith('.jsonl'))
  .sort((a, b) => fs.statSync(path.join(transcriptDir, b)).mtime - fs.statSync(path.join(transcriptDir, a)).mtime)
  .slice(0, 20);

const toolCounts = {};

for (const file of files) {
  const filePath = path.join(transcriptDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      if (obj.messages) {
        for (const msg of obj.messages) {
          if (msg.role === 'assistant' && msg.content) {
            for (const item of msg.content) {
              if (item.type === 'tool_use') {
                const toolName = item.name;

                if (toolName === 'Bash') {
                  const cmd = item.input.command;
                  const cmdObj = extractCommand(cmd);

                  if (cmdObj && isReadOnly(cmdObj)) {
                    const key = cmdObj.main;
                    toolCounts[key] = (toolCounts[key] || 0) + 1;
                  }
                } else if (toolName.startsWith('mcp__')) {
                  // MCP tools
                  if (toolName.includes('read') || toolName.includes('get') ||
                      toolName.includes('list') || toolName.includes('search') ||
                      toolName.includes('view') || toolName.includes('info')) {
                    toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
}

// Sort by count
const sorted = Object.entries(toolCounts)
  .filter(([_, count]) => count >= 3)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('Top read-only commands by frequency:');
console.log('');
sorted.forEach(([cmd, count], idx) => {
  console.log(`${idx + 1}. \`${cmd}\` — ${count} times`);
});
