#!/usr/bin/env node

/**
 * Phase 14 MCP Whitelister Test Suite
 * Validates dangerous command detection and whitelisting
 */

const { MCPWhitelister } = require('./mcp-whitelist');

class Phase14WhitelisterTests {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.whitelister = new MCPWhitelister(process.cwd());
  }

  /**
   * Test: Detect rm -rf (data destruction)
   */
  testDetectRmRf() {
    console.log('\n📋 Test: Detect rm -rf (Data Destruction)');
    try {
      const dangerous = this.whitelister.checkDangerousPattern('rm -rf /');
      this.assert(dangerous !== null, 'rm -rf detected as dangerous');
      this.assert(dangerous.reason.includes('Recursive delete'), 'Correct reason');

      const safe = this.whitelister.checkDangerousPattern('rm file.txt');
      this.assert(safe === null, 'rm without -rf is safe');
    } catch (error) {
      this.fail(`rm -rf test: ${error.message}`);
    }
  }

  /**
   * Test: Detect chmod lockout
   */
  testDetectChmodLockout() {
    console.log('\n📋 Test: Detect chmod Permission Lockout');
    try {
      const dangerous = this.whitelister.checkDangerousPattern('chmod -R 000 /home');
      this.assert(dangerous !== null, 'chmod -R 000 detected as dangerous');

      const safe = this.whitelister.checkDangerousPattern('chmod 755 script.sh');
      this.assert(safe === null, 'chmod with normal perms is safe');
    } catch (error) {
      this.fail(`chmod test: ${error.message}`);
    }
  }

  /**
   * Test: Detect dd (disk write)
   */
  testDetectDD() {
    console.log('\n📋 Test: Detect dd (Disk Write)');
    try {
      const dangerous = this.whitelister.checkDangerousPattern('dd if=/dev/zero of=/dev/sda');
      this.assert(dangerous !== null, 'dd detected as dangerous');
    } catch (error) {
      this.fail(`dd test: ${error.message}`);
    }
  }

  /**
   * Test: Detect mkfs (filesystem format)
   */
  testDetectMkfs() {
    console.log('\n📋 Test: Detect mkfs (Filesystem Format)');
    try {
      const dangerous = this.whitelister.checkDangerousPattern('mkfs.ext4 /dev/sda1');
      this.assert(dangerous !== null, 'mkfs detected as dangerous');
    } catch (error) {
      this.fail(`mkfs test: ${error.message}`);
    }
  }

  /**
   * Test: Detect fork bomb pattern
   */
  testDetectForkBomb() {
    console.log('\n📋 Test: Detect Fork Bomb Pattern');
    try {
      const dangerous = this.whitelister.checkDangerousPattern(': () { : | : & }');
      this.assert(dangerous !== null, 'Fork bomb pattern detected');
    } catch (error) {
      this.fail(`Fork bomb test: ${error.message}`);
    }
  }

  /**
   * Test: Detect eval() injection
   */
  testDetectEval() {
    console.log('\n📋 Test: Detect eval() Code Injection');
    try {
      const dangerous = this.whitelister.checkDangerousPattern('eval("malicious code")');
      this.assert(dangerous !== null, 'eval() detected as dangerous');

      const safe = this.whitelister.checkDangerousPattern('const result = evaluate(expr)');
      this.assert(safe === null, 'evaluate() is safe (different function)');
    } catch (error) {
      this.fail(`eval test: ${error.message}`);
    }
  }

  /**
   * Test: Whitelist npm commands
   */
  testWhitelistNpm() {
    console.log('\n📋 Test: Whitelist Safe Commands (npm)');
    try {
      const isWhitelisted = this.whitelister.isWhitelistedCommand('npm test');
      this.assert(isWhitelisted === true, 'npm is whitelisted');

      const result = this.whitelister.validateCommand('npm install');
      this.assert(result.allowed === true, 'npm install allowed');
    } catch (error) {
      this.fail(`npm whitelist test: ${error.message}`);
    }
  }

  /**
   * Test: Whitelist git commands
   */
  testWhitelistGit() {
    console.log('\n📋 Test: Whitelist Safe Commands (git)');
    try {
      const isWhitelisted = this.whitelister.isWhitelistedCommand('git push origin main');
      this.assert(isWhitelisted === true, 'git is whitelisted');

      const result = this.whitelister.validateCommand('git commit -m "test"');
      this.assert(result.allowed === true, 'git commit allowed');
    } catch (error) {
      this.fail(`git whitelist test: ${error.message}`);
    }
  }

  /**
   * Test: Whitelist node commands
   */
  testWhitelistNode() {
    console.log('\n📋 Test: Whitelist Safe Commands (node)');
    try {
      const result = this.whitelister.validateCommand('node script.js');
      this.assert(result.allowed === true, 'node script.js allowed');
    } catch (error) {
      this.fail(`node whitelist test: ${error.message}`);
    }
  }

  /**
   * Test: Whitelist jest test runner
   */
  testWhitelistJest() {
    console.log('\n📋 Test: Whitelist Safe Commands (jest)');
    try {
      const result = this.whitelister.validateCommand('jest --coverage');
      this.assert(result.allowed === true, 'jest is whitelisted');
    } catch (error) {
      this.fail(`jest whitelist test: ${error.message}`);
    }
  }

  /**
   * Test: Validate command with context
   */
  testValidateWithContext() {
    console.log('\n📋 Test: Validate Command with Context');
    try {
      const context = { agent: 'backend', task: 'test_123' };
      const result = this.whitelister.validateCommand('npm test', context);
      this.assert(result.allowed === true, 'Command allowed');
    } catch (error) {
      this.fail(`Validate with context: ${error.message}`);
    }
  }

  /**
   * Test: Get approval prompt for dangerous command
   */
  testApprovalPrompt() {
    console.log('\n📋 Test: Generate Approval Prompt for Dangerous Command');
    try {
      const validation = {
        allowed: false,
        dangerous: true,
        reason: 'Test dangerous pattern'
      };
      const prompt = this.whitelister.getApprovalPrompt('rm -rf /', validation);
      this.assert(prompt.includes('Dangerous Command'), 'Prompt includes warning');
      this.assert(prompt.includes('rm -rf /'), 'Prompt includes command');
      this.assert(prompt.includes('APPROVE'), 'Prompt includes APPROVE option');
    } catch (error) {
      this.fail(`Approval prompt: ${error.message}`);
    }
  }

  /**
   * Test: Logging command to audit trail
   */
  testAuditLogging() {
    console.log('\n📋 Test: Audit Logging of Commands');
    try {
      const validation = { allowed: true, reason: 'Test' };
      const context = { agent: 'test', task: 'test_task' };

      this.whitelister.logCommand('npm test', validation, context);
      // Verify audit log file exists and contains entry
      const fs = require('fs');
      const logExists = fs.existsSync(this.whitelister.auditLogPath);
      this.assert(logExists === true, 'Audit log file created');
    } catch (error) {
      this.fail(`Audit logging: ${error.message}`);
    }
  }

  /**
   * Test: Unknown command handling (permissive, flagged for review)
   */
  testUnknownCommand() {
    console.log('\n📋 Test: Unknown Command (Permissive + Flag for Review)');
    try {
      const result = this.whitelister.validateCommand('obscure-tool --flag');
      this.assert(result.allowed === true, 'Unknown command allowed (permissive)');
      this.assert(result.flagForReview === true, 'Unknown command flagged for review');
    } catch (error) {
      this.fail(`Unknown command test: ${error.message}`);
    }
  }

  // ============================================================================
  // Test Helpers
  // ============================================================================

  assert(condition, message) {
    if (condition) {
      this.pass(message);
    } else {
      this.fail(message);
    }
  }

  pass(message) {
    console.log(`  ✓ ${message}`);
    this.testsPassed++;
  }

  fail(message) {
    console.error(`  ✗ ${message}`);
    this.testsFailed++;
  }

  // ============================================================================
  // Test Runner
  // ============================================================================

  runAllTests() {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║     Phase 14 MCP Whitelister Test Suite              ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    this.testDetectRmRf();
    this.testDetectChmodLockout();
    this.testDetectDD();
    this.testDetectMkfs();
    this.testDetectForkBomb();
    this.testDetectEval();
    this.testWhitelistNpm();
    this.testWhitelistGit();
    this.testWhitelistNode();
    this.testWhitelistJest();
    this.testValidateWithContext();
    this.testApprovalPrompt();
    this.testAuditLogging();
    this.testUnknownCommand();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log(`║  Results: ${this.testsPassed} passed, ${this.testsFailed} failed           ║`);
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    return this.testsFailed === 0 ? 0 : 1;
  }
}

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  const tester = new Phase14WhitelisterTests();
  const exitCode = tester.runAllTests();
  process.exit(exitCode);
}

module.exports = Phase14WhitelisterTests;
