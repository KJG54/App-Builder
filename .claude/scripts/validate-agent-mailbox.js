#!/usr/bin/env node

/**
 * Agent Mailbox Validation Suite
 *
 * Verifies syntax and a basic async handoff lifecycle using an isolated
 * temporary mailbox directory.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, '.claude', 'scripts', 'agent-mailbox.js');
const WORKFLOW = path.join(ROOT, 'Vault', '04-Workflows', 'async-agent-collaboration.md');
const COMMAND = path.join(ROOT, '.claude', 'commands', 'agent-mailbox.md');

class AgentMailboxValidator {
  constructor() {
    this.passCount = 0;
    this.failCount = 0;
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-mailbox-'));
  }

  runAll() {
    console.log('Agent Mailbox Validation Suite');
    console.log('========================================');

    this.testScriptExists();
    this.testSyntax();
    this.testLifecycle();
    this.testConflictGuards();
    this.testDocsExist();
    this.testRuntimeIgnored();

    console.log('\n========================================');
    console.log('Test Results Summary');
    console.log(`   Passed: ${this.passCount}`);
    console.log(`   Failed: ${this.failCount}`);
    console.log('========================================\n');

    return this.failCount === 0 ? 0 : 1;
  }

  testScriptExists() {
    console.log('\nTest 1: Script Exists');
    fs.existsSync(SCRIPT) ? this.pass('agent-mailbox.js exists') : this.fail('agent-mailbox.js missing');
  }

  testSyntax() {
    console.log('\nTest 2: Syntax Check');
    try {
      execFileSync('node', ['--check', SCRIPT], { stdio: 'pipe' });
      this.pass('agent-mailbox.js passes syntax check');
    } catch (err) {
      this.fail(err.stderr ? err.stderr.toString() : err.message);
    }
  }

  testLifecycle() {
    console.log('\nTest 3: Handoff Lifecycle');
    try {
      const init = this.exec(['init']);
      this.assert(init.includes('Initialized mailbox'), 'mailbox initializes');

      const post = this.exec([
        'handoff',
        '--from', 'codex',
        '--to', 'claude',
        '--summary', 'Implemented mailbox validator.',
        '--next', 'Review and continue.',
        '--files', '.claude/scripts/agent-mailbox.js',
      ]);
      const id = post.match(/(msg-\d{8}-[a-f0-9]{6})/)[1];
      this.assert(Boolean(id), 'handoff creates message id');

      const claimed = this.exec(['claim', '--id', id, '--by', 'claude', '--note', 'Taking it.']);
      this.assert(claimed.includes('[claimed]'), 'message can be claimed');

      const closed = this.exec(['close', '--id', id, '--by', 'claude', '--note', 'Done.']);
      this.assert(closed.includes('[closed]'), 'message can be closed');

      const status = this.exec(['status']);
      this.assert(status.includes('Closed: 1'), 'status reports closed message');

      const summary = path.join(this.tempDir, 'latest.md');
      this.assert(fs.existsSync(summary), 'latest.md summary is written');
    } catch (err) {
      this.fail(err.message);
    }
  }

  testConflictGuards() {
    console.log('\nTest 4: Conflict Guards');
    try {
      this.exec(['init']);

      const post = this.exec([
        'post',
        '--from', 'codex',
        '--to', 'claude',
        '--subject', 'Guarded handoff',
      ]);
      const id = post.match(/(msg-\d{8}-[a-f0-9]{6})/)[1];

      this.exec(['claim', '--id', id, '--by', 'claude', '--note', 'Mine.']);

      const conflict = this.execExpectFail([
        'claim', '--id', id, '--by', 'codex', '--note', 'Stealing it.',
      ]);
      this.assert(
        conflict.includes('already claimed'),
        'claim is rejected when another agent already holds the message'
      );

      this.exec(['close', '--id', id, '--by', 'claude', '--note', 'Done.']);

      const closedClaim = this.execExpectFail([
        'claim', '--id', id, '--by', 'codex',
      ]);
      this.assert(
        closedClaim.includes('closed'),
        'claim is rejected on a closed message'
      );
    } catch (err) {
      this.fail(err.message);
    }
  }

  testDocsExist() {
    console.log('\nTest 5: Documentation Exists');
    fs.existsSync(WORKFLOW) ? this.pass('async workflow doc exists') : this.fail('workflow doc missing');
    fs.existsSync(COMMAND) ? this.pass('/agent-mailbox command doc exists') : this.fail('command doc missing');
  }

  testRuntimeIgnored() {
    console.log('\nTest 6: Runtime State Ignored');
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    gitignore.includes('.claude/agent-mailbox/')
      ? this.pass('.claude/agent-mailbox/ is gitignored')
      : this.fail('.claude/agent-mailbox/ is not gitignored');
  }

  exec(args) {
    return execFileSync('node', [SCRIPT, ...args], {
      env: { ...process.env, AGENT_MAILBOX_DIR: this.tempDir },
      encoding: 'utf8',
    });
  }

  execExpectFail(args) {
    try {
      this.exec(args);
    } catch (err) {
      return `${err.stdout || ''}${err.stderr || ''}`;
    }
    throw new Error(`Expected command to fail but it succeeded: ${args.join(' ')}`);
  }

  assert(condition, message) {
    condition ? this.pass(message) : this.fail(message);
  }

  pass(message) {
    this.passCount++;
    console.log(`   PASS ${message}`);
  }

  fail(message) {
    this.failCount++;
    console.log(`   FAIL ${message}`);
  }
}

if (require.main === module) {
  const validator = new AgentMailboxValidator();
  process.exit(validator.runAll());
}

module.exports = AgentMailboxValidator;
