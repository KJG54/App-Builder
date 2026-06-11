---
type: guide
phase: 14
status: active
authority: facts
chroma_collection: ai-software-factory-facts
tags: [phase-14, fsm, vault-validator, mcp-whitelist, integration, state-machine]
related: [Phase-14-Summary.md, Context-Assembly-API.md, ADR-SEC-001]
last_updated: 2026-06-10
author: Claude-Builder-Agent
---

# Phase 14 Integration Guide

This document describes how to integrate the three Phase 14 modules (FSM, VaultValidator, MCPWhitelister) into existing scripts.

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
  
  // Initialize FSM
  this.fsm = new StateMachineEngine(process.cwd());
  this.fsm.printState();
}
```

### In createTask() Method
Before creating a task, transition FSM from IDLE → PLANNING:
```javascript
async createTask(description, subtaskDefs) {
  try {
    this.fsm.transition(STATES.PLANNING, {
      action: 'CREATE_TASK',
      task: description
    });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error;
  }
  // ... rest of existing createTask() code ...
}
```

### In executeTask() Method
Before executing subtasks, transition FSM from PLANNING → EXECUTING:
```javascript
async executeTask(taskId, agentConfig) {
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
    this.fsm.recordCrash({ taskId, step: 'agent_execution', error: error.message });
    const options = this.fsm.getCrashRecoveryOptions();
    console.log('[FSM] Recovery options:', options);
    throw error;
  }
}
```

### In verifyTask() Method
Before running tests, transition FSM from EXECUTING → VERIFYING:
```javascript
async verifyTask(taskId) {
  try {
    this.fsm.transition(STATES.VERIFYING, { action: 'VERIFY_TASK', taskId });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error;
  }

  if (!this.fsm.isPermitted('writeCode')) {
    console.log('[FSM] Code edits forbidden during VERIFYING state');
  }
  // ... rest of existing verifyTask() code ...
}
```

### Add consolidateTask() Method
After verification passes, transition FSM from VERIFYING → CONSOLIDATING:
```javascript
async consolidateTask(taskId) {
  try {
    this.fsm.transition(STATES.CONSOLIDATING, { action: 'CONSOLIDATE_TASK', taskId });
  } catch (error) {
    console.error(`[FSM] ${error.message}`);
    throw error;
  }

  // Parse logs, update Vault, cleanup workspace
  // ...

  try {
    this.fsm.transition(STATES.IDLE, { action: 'RESET', taskId });
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
  this.whitelister = new MCPWhitelister(process.cwd());
}
```

### Add checkCommand() Method
```javascript
checkCommand(command, context = {}) {
  const validation = this.whitelister.validateCommand(command, context);

  if (!validation.allowed && validation.dangerous) {
    console.warn(`\n⚠️ ${validation.reason}`);
    console.warn(`Command: ${command}`);
    console.warn(this.whitelister.getApprovalPrompt(command, validation));
  }

  this.whitelister.logCommand(command, validation, context);
  return validation;
}
```

### Modify getAuthorization() Method
```javascript
getAuthorization(agent, server, tool, context = {}) {
  // ... existing authorization logic ...

  if (tool === 'execute_terminal' && context.command) {
    const cmdValidation = this.checkCommand(context.command, { agent, task: context.task });
    if (!cmdValidation.allowed && cmdValidation.dangerous) {
      return { allowed: false, tier: 5, reason: cmdValidation.reason };
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
Before processing documents, validate entire Vault:
```javascript
async function main() {
  console.log(`\n📚 Chroma Ingestion Pipeline`);
  // ... existing startup code ...

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
Before indexing a document, validate its frontmatter:
```javascript
async function processDocument(docPath) {
  const validator = new VaultValidator(VAULT_PATH);
  const validation = validator.validateFile(docPath, true); // autoMigrate=true

  if (!validation.hasFrontmatter) {
    if (validation.migrated) {
      console.log(`   ✓ Auto-migrated: ${docPath}`);
    } else {
      console.warn(`   ✗ Skipping (invalid frontmatter): ${docPath}`);
      auditLog.rejections.push({ file: docPath, reason: 'Missing or invalid frontmatter' });
      return;
    }
  }
  // ... rest of existing processDocument() code ...
}
```

---

## 4. Running Phase 14 Tests

```bash
npm run test:phase-14
npm run test:phase-14-fsm
npm run test:phase-14-validator
npm run test:phase-14-whitelist
```

---

## 5. Enabling FSM Logging

In `.claude/settings.json`, the PostCompact hook runs the state machine log update automatically.

---

## Completion Checklist

- [x] FSM engine integrated into agent-orchestrator.js
- [x] MCPWhitelister integrated into mcp-authorization.js
- [x] VaultValidator integrated into chroma-ingest.js
- [x] All unit tests passing
- [x] Phase 13 regression tests passing
- [x] Vault docs auto-migrated with YAML frontmatter

---

## References

- [[Phase-14-Summary.md]] — Phase 14 deliverables and feature summary
- [[Context-Assembly-API.md]] — VaultValidator integration point in Chroma ingest
- [[ADR-SEC-001]] — Human Approval Gate (MCPWhitelister enforces Tier 4-5)
