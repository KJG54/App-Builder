#!/usr/bin/env node

/**
 * Phase 14 FSM Test Suite
 * Validates state machine transitions, permissions, and crash recovery
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { StateMachineEngine, STATES } = require('./state-machine');

class Phase14FSMTests {
  constructor() {
    this.testsPassed = 0;
    this.testsFailed = 0;
    this.tempDirs = []; // Track all temp directories created during tests
  }

  /**
   * Create FSM with isolated temp directory for testing
   * Each test gets its own temp directory to prevent state contamination
   */
  createTestFSM() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsm-test-'));
    this.tempDirs.push(tempDir);
    return new StateMachineEngine(tempDir);
  }

  /**
   * Clean up all temp directories created during tests
   */
  cleanup() {
    for (const tempDir of this.tempDirs) {
      try {
        if (tempDir && fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (error) {
        console.warn(`Failed to clean up ${tempDir}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Valid state transitions
   */
  testValidTransitions() {
    console.log('\n📋 Test: Valid State Transitions');
    try {
      const fsm = this.createTestFSM();

      fsm.transition(STATES.PLANNING, { test: 'transition_1' });
      this.assert(fsm.currentState === STATES.PLANNING, 'Transitioned to PLANNING');

      fsm.transition(STATES.EXECUTING, { test: 'transition_2' });
      this.assert(fsm.currentState === STATES.EXECUTING, 'Transitioned to EXECUTING');

      fsm.transition(STATES.VERIFYING, { test: 'transition_3' });
      this.assert(fsm.currentState === STATES.VERIFYING, 'Transitioned to VERIFYING');

      fsm.transition(STATES.CONSOLIDATING, { test: 'transition_4' });
      this.assert(fsm.currentState === STATES.CONSOLIDATING, 'Transitioned to CONSOLIDATING');

      fsm.transition(STATES.IDLE, { test: 'transition_5' });
      this.assert(fsm.currentState === STATES.IDLE, 'Transitioned back to IDLE');
    } catch (error) {
      this.fail(`Valid transitions: ${error.message}`);
    }
  }

  /**
   * Test: Invalid state transitions (should throw)
   */
  testInvalidTransitions() {
    console.log('\n📋 Test: Invalid State Transitions (Should Reject)');
    try {
      const fsm = this.createTestFSM();

      // Try to jump directly to EXECUTING (invalid from IDLE)
      try {
        fsm.transition(STATES.EXECUTING);
        this.fail('Should have rejected invalid transition IDLE → EXECUTING');
      } catch (error) {
        this.pass('Correctly rejected invalid transition');
      }

      // Try to transition to invalid state
      try {
        fsm.transition('INVALID_STATE');
        this.fail('Should have rejected invalid state name');
      } catch (error) {
        this.pass('Correctly rejected invalid state name');
      }
    } catch (error) {
      this.fail(`Invalid transitions test: ${error.message}`);
    }
  }

  /**
   * Test: State permissions
   */
  testStatePermissions() {
    console.log('\n📋 Test: State-Based Permissions');
    try {
      const fsm = this.createTestFSM();

      // IDLE: can read, cannot execute
      fsm.currentState = STATES.IDLE;
      this.assert(fsm.isPermitted('readVault') === true, 'IDLE: readVault permitted');
      this.assert(fsm.isPermitted('executeTerminal') === false, 'IDLE: executeTerminal forbidden');

      // PLANNING: can read, write plan
      fsm.currentState = STATES.PLANNING;
      this.assert(fsm.isPermitted('readVault') === true, 'PLANNING: readVault permitted');
      this.assert(fsm.isPermitted('writePlan') === true, 'PLANNING: writePlan permitted');
      this.assert(fsm.isPermitted('writeCode') === false, 'PLANNING: writeCode forbidden');

      // EXECUTING: can read, write, execute
      fsm.currentState = STATES.EXECUTING;
      this.assert(fsm.isPermitted('writeCode') === true, 'EXECUTING: writeCode permitted');
      this.assert(fsm.isPermitted('executeTerminal') === true, 'EXECUTING: executeTerminal permitted');

      // VERIFYING: can read, execute tests, but not write
      fsm.currentState = STATES.VERIFYING;
      this.assert(fsm.isPermitted('executeTests') === true, 'VERIFYING: executeTests permitted');
      this.assert(fsm.isPermitted('writeCode') === false, 'VERIFYING: writeCode forbidden');

      // CONSOLIDATING: can write vault, delete workspace
      fsm.currentState = STATES.CONSOLIDATING;
      this.assert(fsm.isPermitted('writeVault') === true, 'CONSOLIDATING: writeVault permitted');
      this.assert(fsm.isPermitted('deleteWorkspace') === true, 'CONSOLIDATING: deleteWorkspace permitted');
    } catch (error) {
      this.fail(`State permissions: ${error.message}`);
    }
  }

  /**
   * Test: Crash recovery data recording
   */
  testCrashRecovery() {
    console.log('\n📋 Test: Crash Recovery Data');
    try {
      const fsm = this.createTestFSM();
      // Valid transition path: IDLE → PLANNING → EXECUTING
      fsm.transition(STATES.PLANNING, { task: 'test' });
      fsm.transition(STATES.EXECUTING, { task: 'test' });

      const crashData = fsm.recordCrash({
        task: 'test_task',
        step: 'agent_execution',
        error: 'Timeout'
      });

      this.assert(crashData !== null, 'Crash data recorded');
      this.assert(crashData.task === 'test_task', 'Crash data contains task');
      this.assert(crashData.state === STATES.EXECUTING, 'Crash data contains state');

      const options = fsm.getCrashRecoveryOptions();
      this.assert(options.length > 0, 'Recovery options available');
      this.assert(options.some(o => o.action === 'RESUME'), 'RESUME option available');
    } catch (error) {
      this.fail(`Crash recovery: ${error.message}`);
    }
  }

  /**
   * Test: State history tracking
   */
  testStateHistory() {
    console.log('\n📋 Test: State History Tracking');
    try {
      const fsm = this.createTestFSM();
      fsm.transition(STATES.PLANNING, { test: 1 });
      fsm.transition(STATES.EXECUTING, { test: 2 });

      const history = fsm.stateHistory;
      this.assert(history.length >= 2, 'State history recorded');
      this.assert(history[0].to === STATES.PLANNING, 'First transition recorded');
      this.assert(history[1].to === STATES.EXECUTING, 'Second transition recorded');
    } catch (error) {
      this.fail(`State history: ${error.message}`);
    }
  }

  /**
   * Test: State persistence to disk
   */
  testStatePersistence() {
    console.log('\n📋 Test: State Persistence to Disk');
    try {
      // Create isolated temp directory for this test
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fsm-test-'));
      this.tempDirs.push(tempDir);

      const fsm = new StateMachineEngine(tempDir);
      fsm.transition(STATES.PLANNING, { test: 'persistence' });
      fsm.saveStateToDisk();

      // Create new instance in same temp directory and load
      const fsm2 = new StateMachineEngine(tempDir);
      this.assert(fsm2.currentState === STATES.PLANNING, 'State restored from disk');

      // Reset for cleanup
      fsm2.resetToIdle();
      fsm2.saveStateToDisk();
    } catch (error) {
      this.fail(`State persistence: ${error.message}`);
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
    console.log('║         Phase 14 FSM Test Suite                      ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    this.testValidTransitions();
    this.testInvalidTransitions();
    this.testStatePermissions();
    this.testCrashRecovery();
    this.testStateHistory();
    this.testStatePersistence();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log(`║  Results: ${this.testsPassed} passed, ${this.testsFailed} failed           ║`);
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Clean up temp directory
    this.cleanup();

    return this.testsFailed === 0 ? 0 : 1;
  }
}

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  const tester = new Phase14FSMTests();
  const exitCode = tester.runAllTests();
  process.exit(exitCode);
}

module.exports = Phase14FSMTests;
