#!/usr/bin/env node

/**
 * FSM State Machine Engine
 *
 * Enforces strict state transitions: IDLE → PLANNING → EXECUTING → VERIFYING → CONSOLIDATING
 * Locks/unlocks tools based on current state. Handles crash recovery with manual user choice.
 * Logs all transitions to both JSONL (audit) and markdown (human-readable).
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// FSM State Definitions & Transitions
// ============================================================================

const STATES = {
  IDLE: 'IDLE',
  PLANNING: 'PLANNING',
  EXECUTING: 'EXECUTING',
  VERIFYING: 'VERIFYING',
  CONSOLIDATING: 'CONSOLIDATING'
};

// Strict state transition matrix
const VALID_TRANSITIONS = {
  [STATES.IDLE]: [STATES.PLANNING],
  [STATES.PLANNING]: [STATES.EXECUTING],
  [STATES.EXECUTING]: [STATES.VERIFYING],
  [STATES.VERIFYING]: [STATES.CONSOLIDATING],
  [STATES.CONSOLIDATING]: [STATES.IDLE]
};

// Tool permissions per state
const STATE_PERMISSIONS = {
  [STATES.IDLE]: {
    readVault: true,
    readFileSystem: true,
    writeWorkspace: true,
    executeTerminal: false,
    executeTests: false,
    indexChroma: false
  },
  [STATES.PLANNING]: {
    readVault: true,
    readFileSystem: true,
    writeWorkspace: true,
    writePlan: true,
    executeTerminal: false,
    executeTests: false,
    indexChroma: false
  },
  [STATES.EXECUTING]: {
    readVault: true,
    readFileSystem: true,
    writeCode: true,
    writeConfig: true,
    writeWorkspace: true,
    executeTerminal: true,
    indexChroma: false
  },
  [STATES.VERIFYING]: {
    readVault: true,
    readFileSystem: true,
    readLogs: true,
    executeTests: true,
    executeLinters: true,
    writeWorkspace: false,
    writeCode: false
  },
  [STATES.CONSOLIDATING]: {
    readLogs: true,
    writeVault: true,
    deleteWorkspace: true,
    indexChroma: true,
    writeWorkspace: false,
    executeTerminal: false
  }
};

// ============================================================================
// FSM Engine Class
// ============================================================================

class StateMachineEngine {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.currentState = STATES.IDLE;
    this.previousState = null;
    this.stateHistory = [];
    this.crashRecoveryData = null;
    this.auditLogPath = path.join(projectRoot, '.claude', 'mcp-audit', 'fsm-state.jsonl');
    this.markdownLogPath = path.join(projectRoot, 'Vault', 'Logs', 'FSM-History.md');
    this.stateFilePath = path.join(projectRoot, '.claude', '.fsm-state.json');

    this.initializeDirectories();
    this.loadStateFromDisk();
  }

  initializeDirectories() {
    const dirs = [
      path.dirname(this.auditLogPath),
      path.dirname(this.markdownLogPath)
    ];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadStateFromDisk() {
    // Check if there's a saved state (e.g., from a previous crash)
    if (fs.existsSync(this.stateFilePath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.stateFilePath, 'utf8'));
        this.currentState = saved.state || STATES.IDLE;
        this.crashRecoveryData = saved.lastAction || null;
        console.log(`[FSM] Loaded state from disk: ${this.currentState}`);
      } catch (error) {
        console.warn(`[FSM] Failed to load state from disk:`, error.message);
        this.currentState = STATES.IDLE;
      }
    }
  }

  saveStateToDisk() {
    fs.writeFileSync(
      this.stateFilePath,
      JSON.stringify({
        state: this.currentState,
        timestamp: new Date().toISOString(),
        lastAction: this.crashRecoveryData
      }, null, 2)
    );
  }

  /**
   * Attempt to transition to a new state
   * @param {string} newState - Target state
   * @param {object} context - Context object { agent, task, action }
   * @throws {Error} If transition is invalid
   */
  transition(newState, context = {}) {
    if (!Object.values(STATES).includes(newState)) {
      throw new Error(`[FSM] Invalid state: ${newState}`);
    }

    const validTransitions = VALID_TRANSITIONS[this.currentState] || [];
    if (!validTransitions.includes(newState)) {
      throw new Error(
        `[FSM] Invalid transition: ${this.currentState} → ${newState}. ` +
        `Valid transitions: ${validTransitions.join(', ')}`
      );
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateHistory.push({
      from: this.previousState,
      to: newState,
      timestamp: new Date().toISOString(),
      context
    });

    this.saveStateToDisk();
    this.logTransition(newState, context);

    console.log(`[FSM] ✓ Transitioned: ${this.previousState} → ${this.currentState}`);
    return true;
  }

  /**
   * Check if a tool/action is permitted in current state
   * @param {string} capability - Tool name (e.g., 'writeCode', 'executeTerminal')
   * @returns {boolean} True if permitted
   */
  isPermitted(capability) {
    const permissions = STATE_PERMISSIONS[this.currentState] || {};
    return permissions[capability] === true;
  }

  /**
   * Get all permitted capabilities in current state
   * @returns {object} Permissions object
   */
  getPermissions() {
    return STATE_PERMISSIONS[this.currentState] || {};
  }

  /**
   * Handle a crash: save recovery data and halt
   * @param {object} lastAction - Last action before crash { agent, task, step }
   */
  recordCrash(lastAction) {
    this.crashRecoveryData = {
      ...lastAction,
      crashedAt: new Date().toISOString(),
      state: this.currentState
    };
    this.saveStateToDisk();
    console.error(`[FSM] 🔴 Crash recorded. Recovery data saved.`);
    return this.crashRecoveryData;
  }

  /**
   * Get recovery options after crash
   * @returns {array} Array of recovery actions
   */
  getCrashRecoveryOptions() {
    if (!this.crashRecoveryData) {
      return [];
    }

    return [
      {
        action: 'RESUME',
        description: `Resume from ${this.crashRecoveryData.state} state, retry last action`,
        command: 'engine.resumeFromCrash()'
      },
      {
        action: 'RETRY',
        description: `Retry entire phase, reset to IDLE`,
        command: 'engine.resetToIdle()'
      },
      {
        action: 'RESTART',
        description: `Restart planning phase with recovery context`,
        command: 'engine.transitionTo(STATES.PLANNING)'
      },
      {
        action: 'ABORT',
        description: `Abort task, reset to IDLE, log incident`,
        command: 'engine.abortTask()'
      }
    ];
  }

  /**
   * Resume after a crash (user chooses to continue)
   */
  resumeFromCrash() {
    if (!this.crashRecoveryData) {
      throw new Error('[FSM] No crash recovery data available');
    }
    console.log(`[FSM] ▶️ Resuming from crash. Last action:`, this.crashRecoveryData);
    // Caller should handle actual resumption
    return this.crashRecoveryData;
  }

  /**
   * Abort task and reset to IDLE
   */
  abortTask() {
    this.transition(STATES.CONSOLIDATING, { action: 'CRASH_ABORT' });
    this.transition(STATES.IDLE, { action: 'RESET' });
    this.crashRecoveryData = null;
    this.saveStateToDisk();
    console.log('[FSM] ⚠️ Task aborted, reset to IDLE');
  }

  /**
   * Reset to IDLE (for emergency recovery)
   */
  resetToIdle() {
    this.currentState = STATES.IDLE;
    this.saveStateToDisk();
    console.log('[FSM] 🔄 Reset to IDLE');
  }

  /**
   * Log state transition to both JSONL and markdown
   * @private
   */
  logTransition(newState, context) {
    const timestamp = new Date().toISOString();

    // JSONL (machine-readable)
    const jsonlEntry = JSON.stringify({
      timestamp,
      from: this.previousState,
      to: newState,
      context,
      crashRecoveryData: this.crashRecoveryData || null
    });
    fs.appendFileSync(this.auditLogPath, jsonlEntry + '\n');

    // Markdown (human-readable)
    const mdEntry = `\n## ${timestamp}\n**Transition:** ${this.previousState} → ${newState}\n` +
      (context && Object.keys(context).length > 0 ? `**Context:** ${JSON.stringify(context)}\n` : '');

    if (!fs.existsSync(this.markdownLogPath)) {
      fs.writeFileSync(this.markdownLogPath, '# FSM State History\n');
    }
    fs.appendFileSync(this.markdownLogPath, mdEntry);
  }

  /**
   * Get current state info
   */
  getState() {
    return {
      current: this.currentState,
      previous: this.previousState,
      permissions: this.getPermissions(),
      history: this.stateHistory,
      crashRecoveryData: this.crashRecoveryData
    };
  }

  /**
   * Print state summary to console
   */
  printState() {
    console.log('\n========== FSM STATE ==========');
    console.log(`Current: ${this.currentState}`);
    console.log(`Previous: ${this.previousState}`);
    console.log('Permissions:', this.getPermissions());
    if (this.crashRecoveryData) {
      console.log('⚠️ Crash Recovery Data:', this.crashRecoveryData);
    }
    console.log('==============================\n');
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  StateMachineEngine,
  STATES,
  VALID_TRANSITIONS,
  STATE_PERMISSIONS
};

// ============================================================================
// CLI Usage (for testing)
// ============================================================================

if (require.main === module) {
  const engine = new StateMachineEngine(process.cwd());

  // Test: print current state
  engine.printState();

  // Test: attempt transitions
  try {
    engine.transition(STATES.PLANNING, { action: 'user_input', task: 'test' });
    engine.printState();
  } catch (error) {
    console.error(error.message);
  }
}
