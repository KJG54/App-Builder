# Phase 14 Integration Guide

This document describes how to integrate the three new Phase 14 modules (FSM, VaultValidator, MCPWhitelister) into existing scripts.

## Overview

### New Modules
1. **state-machine.js** — FSM engine (IDLE → PLANNING → EXECUTING → VERIFYING → CONSOLIDATING)
2. **vault-validator.js** — YAML frontmatter validator for Vault docs
3. **mcp-whitelist.js** — MCP command whitelister with dangerous pattern detection

### Integration Points
1. **agent-orchestrator.js** — Integrate FSM to control state transitions
2. **mcp-authorization.js** — Integrate MCPWhitelister to check commands
3. **chroma-ingest.js** — Integrate VaultValidator before indexing

---

## 1. Integrate FSM into agent-orchestrator.js

### Add Import at Top
```javascript
const { StateMachineEngine, STATES } = require('./state-machine');
```

### In Constructor
```javascript
constructor(tasksDir = '.claude/tasks', projectName = 'ai-software-factory') {
  // ... existing code ...
  
  // NEW: Initialize FSM
  this.fsm = new StateMachineEngine(process.cwd());
  this.fsm.printState(); // Debug output
}
```

### In createTask() Method
**Before creating a task**, transition FSM from IDLE → PLANNING:
```javascript
async createTask(description, subtaskDefs) {
  // NEW: Enforce FSM state
  try {
    this.fsm.transition(STATES.PLANNING, {
      action: 'CREATE_TASK',
      task: description
    });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error; // Block task creation if transition fails
  }

  // ... rest of existing createTask() code ...
}
```

### In executeTask() Method
**Before executing subtasks**, transition FSM from PLANNING → EXECUTING:
```javascript
async executeTask(taskId, agentConfig) {
  // NEW: Enforce FSM state
  try {
    this.fsm.transition(STATES.EXECUTING, {
      action: 'EXECUTE_TASK',
      taskId
    });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error;
  }

  try {
    // ... rest of existing executeTask() code ...
  } catch (error) {
    // NEW: On crash, record recovery data
    this.fsm.recordCrash({
      taskId,
      step: 'agent_execution',
      error: error.message
    });

    // Present user with recovery options
    const options = this.fsm.getCrashRecoveryOptions();
    console.log('[FSM] Recovery options:', options);
    // User chooses: RESUME, RETRY, RESTART, or ABORT
    throw error;
  }
}
```

### In verifyTask() Method
**Before running tests**, transition FSM from EXECUTING → VERIFYING:
```javascript
async verifyTask(taskId) {
  // NEW: Enforce FSM state
  try {
    this.fsm.transition(STATES.VERIFYING, {
      action: 'VERIFY_TASK',
      taskId
    });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error;
  }

  // NEW: Check that code writes are forbidden in VERIFYING state
  if (!this.fsm.isPermitted('writeCode')) {
    console.log('[FSM] Code edits forbidden during VERIFYING state');
  }

  // ... rest of existing verifyTask() code (run tests, linters, etc.) ...
}
```

### Add consolidateTask() Method
**After verification passes**, transition FSM from VERIFYING → CONSOLIDATING:
```javascript
async consolidateTask(taskId) {
  // NEW: Enforce FSM state
  try {
    this.fsm.transition(STATES.CONSOLIDATING, {
      action: 'CONSOLIDATE_TASK',
      taskId
    });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error;
  }

  // Parse logs, update Vault, cleanup workspace
  // ... existing consolidation logic ...

  // NEW: Return to IDLE
  try {
    this.fsm.transition(STATES.IDLE, {
      action: 'RESET',
      taskId
    });
  } catch (error) {
    console.error(`[FSM] Failed to return to IDLE:`, error.message);
  }
}
```

---

## 2. Integrate MCPWhitelister into mcp-authorization.js

### Add Import at Top
```javascript
const { MCPWhitelister } = require('./mcp-whitelist');
```

### In Constructor
```javascript
constructor() {
  // ... existing authorization matrix code ...
  
  // NEW: Initialize whitelister
  this.whitelister = new MCPWhitelister(process.cwd());
}
```

### Add checkCommand() Method
```javascript
/**
 * Check if a command is safe to execute
 * @param {string} command - Terminal command
 * @param {object} context - { agent, task }
 * @returns {object} { allowed, reason, requiresApproval }
 */
checkCommand(command, context = {}) {
  const validation = this.whitelister.validateCommand(command, context);

  if (!validation.allowed && validation.dangerous) {
    // Dangerous pattern detected: warn + ask user
    console.warn(`\n⚠️ ${validation.reason}`);
    console.warn(`Command: ${command}`);
    console.warn(this.whitelister.getApprovalPrompt(command, validation));
    // In real implementation: wait for user input (A/D/L)
  }

  this.whitelister.logCommand(command, validation, context);
  return validation;
}
```

### Modify getAuthorization() Method
**When a tool requests terminal execution**, call checkCommand():
```javascript
getAuthorization(agent, server, tool, context = {}) {
  // ... existing authorization logic ...

  // NEW: If this is a terminal/shell command
  if (tool === 'execute_terminal' && context.command) {
    const cmdValidation = this.checkCommand(context.command, { agent, task: context.task });
    if (!cmdValidation.allowed && cmdValidation.dangerous) {
      return {
        allowed: false,
        tier: 5, // Irreversible operation
        reason: cmdValidation.reason
      };
    }
  }

  // ... rest of existing getAuthorization() code ...
}
```

---

## 3. Integrate VaultValidator into chroma-ingest.js

### Add Import at Top
```javascript
const { VaultValidator } = require('./vault-validator');
```

### In main() Function
**Before processing documents**, validate entire Vault:
```javascript
async function main() {
  console.log(`\n📚 Chroma Ingestion Pipeline`);
  // ... existing startup code ...

  // NEW: Validate all Vault documents
  console.log(`\n0️⃣  VALIDATING VAULT FRONTMATTER`);
  const validator = new VaultValidator(VAULT_PATH);
  const validationResults = validator.validateVault(true); // autoMigrate=true
  validator.printSummary(validationResults);

  if (validationResults.invalidFiles > 0) {
    console.warn(`\n⚠️  ${validationResults.invalidFiles} invalid files found.`);
    console.warn('Continuing with valid files only.\n');
  }

  // ... rest of existing main() code ...
}
```

### In processDocument() Function
**Before indexing a document**, validate its frontmatter:
```javascript
async function processDocument(docPath) {
  // NEW: Validate frontmatter
  const validator = new VaultValidator(VAULT_PATH);
  const validation = validator.validateFile(docPath, true); // autoMigrate=true

  if (!validation.hasFrontmatter) {
    if (validation.migrated) {
      console.log(`   ✓ Auto-migrated: ${docPath}`);
      // Re-read the file (now with frontmatter)
      // ... existing processing continues ...
    } else {
      console.warn(`   ✗ Skipping (invalid frontmatter): ${docPath}`);
      auditLog.rejections.push({
        file: docPath,
        reason: 'Missing or invalid frontmatter'
      });
      return;
    }
  }

  // ... rest of existing processDocument() code ...
}
```

---

## 4. Testing Phase 14 Integration

### Unit Tests for FSM
Create `.claude/scripts/test-state-machine.js`:
```javascript
const { StateMachineEngine, STATES } = require('./state-machine');

console.log('Testing FSM State Transitions...\n');

const fsm = new StateMachineEngine();

// Test 1: Valid transitions
try {
  fsm.transition(STATES.PLANNING, { test: true });
  fsm.transition(STATES.EXECUTING, { test: true });
  fsm.transition(STATES.VERIFYING, { test: true });
  fsm.transition(STATES.CONSOLIDATING, { test: true });
  fsm.transition(STATES.IDLE, { test: true });
  console.log('✓ Valid transitions: PASS');
} catch (error) {
  console.error('✗ Valid transitions: FAIL -', error.message);
}

// Test 2: Invalid transitions
try {
  fsm.transition(STATES.EXECUTING, { test: true }); // Invalid: can't jump IDLE → EXECUTING
  console.error('✗ Invalid transitions: FAIL (should have thrown)');
} catch (error) {
  console.log('✓ Invalid transitions: PASS (correctly rejected)');
}

// Test 3: Permissions
const permissions = fsm.getPermissions();
console.log('✓ Permissions:', permissions);

// Test 4: Crash recovery
fsm.recordCrash({ task: 'test', step: 1 });
const options = fsm.getCrashRecoveryOptions();
console.log('✓ Crash recovery options:', options.length);
```

### Unit Tests for Validator
Create `.claude/scripts/test-vault-validator.js`:
```javascript
const { VaultValidator } = require('./vault-validator');

console.log('Testing Vault Validator...\n');

const validator = new VaultValidator('Vault');

// Test 1: Parse frontmatter
const content = `---
type: guide
status: active
last_updated: 2026-06-09
---

# Document Body`;

const parsed = validator.parseFrontmatter(content);
console.log('✓ Frontmatter parsing:', parsed.hasFrontmatter);

// Test 2: Validate frontmatter
const validation = validator.validateFrontmatter(parsed.frontmatter);
console.log('✓ Validation result:', validation.isValid);

// Test 3: Auto-migrate
const noFrontmatter = '# Doc without frontmatter\nContent here';
const migrated = validator.autoMigrate(noFrontmatter);
console.log('✓ Auto-migration:', migrated.startsWith('---'));

// Test 4: Validate entire Vault
const results = validator.validateVault(true);
validator.printSummary(results);
```

### Unit Tests for Whitelister
Create `.claude/scripts/test-mcp-whitelist.js`:
```javascript
const { MCPWhitelister } = require('./mcp-whitelist');

console.log('Testing MCP Whitelister...\n');

const whitelister = new MCPWhitelister();

const testCases = [
  { cmd: 'npm test', expect: 'allowed' },
  { cmd: 'git push origin main', expect: 'allowed' },
  { cmd: 'rm -rf /', expect: 'dangerous' },
  { cmd: 'chmod -R 000 /etc', expect: 'dangerous' },
  { cmd: 'node script.js', expect: 'allowed' },
  { cmd: 'eval("malicious code")', expect: 'dangerous' }
];

testCases.forEach(({ cmd, expect }) => {
  const result = whitelister.validateCommand(cmd);
  const actual = result.allowed ? 'allowed' : 'dangerous';
  const status = actual === expect ? '✓' : '✗';
  console.log(`${status} "${cmd}" → ${actual}`);
});
```

---

## 5. Running Tests

```bash
# Test each module
node .claude/scripts/test-state-machine.js
node .claude/scripts/test-vault-validator.js
node .claude/scripts/test-mcp-whitelist.js

# Run Phase 13 regression tests (ensure no breakage)
npm test
```

---

## 6. Enabling FSM Logging

In `.claude/settings.json`, add:
```json
{
  "hooks": {
    "PostCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/scripts/state-machine.js",
            "timeout": 10,
            "statusMessage": "📋 Updating FSM state log..."
          }
        ]
      }
    ]
  }
}
```

---

## Checklist Before Phase 14 Complete

- [ ] FSM engine integrated into agent-orchestrator.js
- [ ] MCPWhitelister integrated into mcp-authorization.js
- [ ] VaultValidator integrated into chroma-ingest.js
- [ ] All unit tests passing
- [ ] Phase 13 regression tests passing (no breakage)
- [ ] FSM state transitions logged to `.claude/mcp-audit/fsm-state.jsonl`
- [ ] Vault docs auto-migrated with YAML frontmatter
- [ ] Command whitelist tested with dangerous patterns
- [ ] Documentation updated in CLAUDE.md (FSM rules, frontmatter requirements)
