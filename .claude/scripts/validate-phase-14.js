#!/usr/bin/env node

/**
 * Phase 14 Master Validation Script
 *
 * Runs all Phase 14 tests:
 * 1. FSM State Machine Tests
 * 2. Vault Validator Tests
 * 3. MCP Whitelister Tests
 * 4. Regression check (Phase 13 still works)
 */

const { spawn } = require('child_process');
const path = require('path');

class Phase14Validator {
  constructor() {
    this.results = {
      fsm: null,
      validator: null,
      whitelist: null,
      regression: null
    };
    this.allPassed = true;
  }

  /**
   * Run a test script and return exit code
   */
  async runTest(scriptName, displayName) {
    return new Promise((resolve) => {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`Running: ${displayName}`);
      console.log(`${'═'.repeat(60)}`);

      const script = path.join(__dirname, scriptName);
      const child = spawn('node', [script], { stdio: 'inherit' });

      child.on('exit', (code) => {
        const passed = code === 0;
        this.results[displayName.toLowerCase()] = { passed, code };
        if (!passed) {
          this.allPassed = false;
        }
        resolve(passed);
      });

      child.on('error', (error) => {
        console.error(`Error running ${displayName}:`, error);
        this.results[displayName.toLowerCase()] = { passed: false, error };
        this.allPassed = false;
        resolve(false);
      });
    });
  }

  /**
   * Run all tests sequentially
   */
  async runAllTests() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        Phase 14: Complete Validation & Test Suite          ║');
    console.log('║  FSM State Machine + Vault Validator + MCP Whitelister     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n📋 Test Plan:');
    console.log('  1. FSM State Machine Tests');
    console.log('  2. Vault Validator Tests');
    console.log('  3. MCP Whitelister Tests');
    console.log('  4. Regression Check (Phase 13)');

    // Run FSM tests
    await this.runTest('test-phase-14-fsm.js', 'FSM Tests');

    // Run Validator tests
    await this.runTest('test-phase-14-validator.js', 'Validator Tests');

    // Run Whitelister tests
    await this.runTest('test-phase-14-whitelist.js', 'Whitelist Tests');

    // Run regression (Phase 13)
    console.log('\n📋 Regression Check: Verifying Phase 13 still works...');
    await this.runTest('validate-phase-13.js', 'Regression Check');

    // Print summary
    this.printSummary();

    return this.allPassed ? 0 : 1;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                   PHASE 14 TEST SUMMARY                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const tests = [
      { name: 'FSM State Machine', key: 'fsm' },
      { name: 'Vault Validator', key: 'validator' },
      { name: 'MCP Whitelister', key: 'whitelist' },
      { name: 'Regression (Phase 13)', key: 'regression' }
    ];

    let passCount = 0;
    let failCount = 0;

    tests.forEach(test => {
      const result = this.results[test.key];
      if (result) {
        const status = result.passed ? '✓ PASS' : '✗ FAIL';
        const color = result.passed ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}${status}\x1b[0m  ${test.name} (exit code: ${result.code})`);
        if (result.passed) passCount++;
        else failCount++;
      } else {
        console.log(`? UNKNOWN  ${test.name}`);
      }
    });

    console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`);
    console.log(`Success Rate: ${((passCount / tests.length) * 100).toFixed(1)}%\n`);

    if (this.allPassed) {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║              ✅ PHASE 14 VALIDATION PASSED ✅              ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      console.log('Next Steps:');
      console.log('  1. Integrate Phase 14 modules into existing scripts');
      console.log('  2. See: .claude/scripts/phase-14-integration.md');
      console.log('  3. Start Phase 15 (Semantic Indexing & Lexical Search)\n');
    } else {
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║             ❌ PHASE 14 VALIDATION FAILED ❌              ║');
      console.log('║              Review failures above and retry               ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
    }
  }
}

// ============================================================================
// Run Validator
// ============================================================================

if (require.main === module) {
  const validator = new Phase14Validator();
  validator.runAllTests()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Validation error:', error);
      process.exit(1);
    });
}

module.exports = Phase14Validator;
