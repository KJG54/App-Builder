#!/usr/bin/env node

/**
 * MCP Command Whitelister
 *
 * Dangerous Command Patterns Blacklist:
 * - Data destruction: rm -rf /, dd, mkfs
 * - Permission lockouts: chmod -R 000, chown root:root
 * - Resource exhaustion: fork bombs, memory hogs
 * - Code injection: eval(), exec(), Function()
 *
 * Strategy: Permissive (allow everything except proven dangerous)
 * Behavior: Warn + ask user for approval before executing dangerous commands
 * Customization: Layered whitelist (global + project-specific exceptions)
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// Dangerous Command Patterns
// ============================================================================

const DANGEROUS_PATTERNS = [
  // Data destruction
  { pattern: /^rm\s+(-rf|-fr).*(\/|\\)/, reason: 'Recursive delete from root' },
  { pattern: /^dd\s+.*if=|of=/, reason: 'Raw disk write (data destruction risk)' },
  { pattern: /^mkfs/, reason: 'Filesystem format (data destruction)' },
  { pattern: /^shred/, reason: 'File shredding (data destruction)' },

  // Permission lockouts
  { pattern: /^chmod\s+(-R|--recursive).*000/, reason: 'Recursive permission removal (lockout)' },
  { pattern: /^chown\s+(-R|--recursive).*root/, reason: 'Recursive ownership change to root' },

  // Resource exhaustion / fork bombs
  { pattern: /:\s*\(\)\s*\{.*:\s*\|\s*:/, reason: 'Fork bomb pattern detected' },
  { pattern: /\(\)\s*&/, reason: 'Background process fork (potential DoS)' },

  // Code injection
  { pattern: /\beval\s*\(/, reason: 'eval() code injection risk' },
  { pattern: /\bexec\s*\(/, reason: 'exec() code injection risk' },
  { pattern: /new\s+Function\s*\(/, reason: 'Function() constructor injection risk' }
];

// ============================================================================
// Safe Command Patterns (Whitelist)
// ============================================================================

const SAFE_COMMANDS = [
  // File operations
  'cat', 'ls', 'find', 'grep', 'cp', 'mv', 'mkdir', 'touch', 'nano', 'vi',

  // Git commands
  'git', 'gh',

  // Package managers
  'npm', 'yarn', 'pip', 'python', 'node',

  // Linters & formatters
  'eslint', 'prettier', 'black', 'flake8', 'rubocop', 'shellcheck',

  // Test runners
  'jest', 'mocha', 'pytest', 'rspec', 'go test', 'cargo test',

  // Build tools
  'webpack', 'vite', 'tsc', 'cargo', 'make',

  // Documentation & analysis
  'jsdoc', 'doxygen', 'javadoc'
];

// ============================================================================
// Command Whitelister Class
// ============================================================================

class MCPWhitelister {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.auditLogPath = path.join(projectRoot, '.claude', 'mcp-audit', 'command-whitelist.jsonl');
    this.projectExceptions = this.loadProjectExceptions();

    this.initializeAuditLog();
  }

  /**
   * Load project-specific whitelist exceptions from .claude/settings.local.json
   * @returns {object} { allowed: [], blocked: [] }
   */
  loadProjectExceptions() {
    const localSettingsPath = path.join(this.projectRoot, '.claude', 'settings.local.json');
    if (!fs.existsSync(localSettingsPath)) {
      return { allowed: [], blocked: [] };
    }

    try {
      const settings = JSON.parse(fs.readFileSync(localSettingsPath, 'utf8'));
      return settings.mcpCommandExceptions || { allowed: [], blocked: [] };
    } catch (error) {
      console.warn('[Whitelist] Failed to load project exceptions:', error.message);
      return { allowed: [], blocked: [] };
    }
  }

  /**
   * Initialize audit log directory
   * @private
   */
  initializeAuditLog() {
    const dir = path.dirname(this.auditLogPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Check if command matches a dangerous pattern
   * @param {string} command - Command string to check
   * @returns {object|null} { isDangerous: boolean, pattern, reason } or null if safe
   */
  checkDangerousPattern(command) {
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return {
          isDangerous: true,
          pattern: pattern.source,
          reason
        };
      }
    }
    return null;
  }

  /**
   * Check if command starts with a whitelisted prefix
   * @param {string} command - Command string
   * @returns {boolean} True if whitelisted
   */
  isWhitelistedCommand(command) {
    const commandName = command.split(/\s+/)[0];
    return SAFE_COMMANDS.some(safe => commandName.includes(safe));
  }

  /**
   * Validate a command before execution
   * @param {string} command - Command to validate
   * @param {object} context - { agent, task, purpose }
   * @returns {object} { allowed: boolean, reason, requiresApproval: boolean }
   */
  validateCommand(command, context = {}) {
    // Check project-specific allowed exceptions
    if (this.projectExceptions.allowed.some(exc => command.includes(exc))) {
      return {
        allowed: true,
        reason: 'Project-specific exception (allowed)',
        requiresApproval: false
      };
    }

    // Check project-specific blocked exceptions
    if (this.projectExceptions.blocked.some(exc => command.includes(exc))) {
      return {
        allowed: false,
        reason: 'Project-specific exception (blocked)',
        requiresApproval: false
      };
    }

    // Check dangerous patterns
    const dangerousMatch = this.checkDangerousPattern(command);
    if (dangerousMatch) {
      return {
        allowed: false,
        reason: `Dangerous pattern detected: ${dangerousMatch.reason}`,
        pattern: dangerousMatch.pattern,
        requiresApproval: true, // Warn + ask user
        dangerous: true
      };
    }

    // Check whitelisted commands
    if (this.isWhitelistedCommand(command)) {
      return {
        allowed: true,
        reason: 'Whitelisted command',
        requiresApproval: false
      };
    }

    // Unknown command (permissive: allow, but warn)
    return {
      allowed: true,
      reason: 'Unknown command (allowed, log for review)',
      requiresApproval: false,
      flagForReview: true
    };
  }

  /**
   * Log blocked/warned command to audit trail
   * @private
   */
  logCommand(command, validation, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      command,
      validation,
      context,
      action: validation.allowed ? 'ALLOWED' : 'BLOCKED'
    };

    fs.appendFileSync(this.auditLogPath, JSON.stringify(entry) + '\n');
  }

  /**
   * Get formatted prompt for user approval
   * @param {string} command - Command to approve
   * @param {object} validation - Validation result
   * @returns {string} Formatted prompt
   */
  getApprovalPrompt(command, validation) {
    return `
⚠️ Dangerous Command Detected

Command: ${command}
Reason: ${validation.reason}

This command matches a dangerous pattern and requires user approval.

Options:
  [A] APPROVE - Execute command (logged for audit)
  [D] DENY - Block command, suggest alternative
  [L] LOG ONLY - Execute and log as high-risk

Your choice: `;
  }

  /**
   * Print validation summary
   */
  printSummary() {
    console.log('\n========== WHITELIST SUMMARY ==========');
    console.log(`Dangerous patterns tracked: ${DANGEROUS_PATTERNS.length}`);
    console.log(`Whitelisted commands: ${SAFE_COMMANDS.length}`);
    console.log(`Project exceptions: +${this.projectExceptions.allowed.length} allowed, +${this.projectExceptions.blocked.length} blocked`);
    console.log(`Audit log: ${this.auditLogPath}`);
    console.log('======================================\n');
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  MCPWhitelister,
  DANGEROUS_PATTERNS,
  SAFE_COMMANDS
};

// ============================================================================
// CLI Usage (for testing)
// ============================================================================

if (require.main === module) {
  const whitelister = new MCPWhitelister(process.cwd());

  // Test commands
  const testCommands = [
    'npm test',
    'rm -rf /',
    'git push origin main',
    'chmod -R 000 /etc',
    'node script.js',
    'unknown-command arg1 arg2'
  ];

  console.log('[Whitelist] Testing commands...\n');
  testCommands.forEach(cmd => {
    const validation = whitelister.validateCommand(cmd);
    console.log(`\nCommand: ${cmd}`);
    console.log(`Result:`, validation);
    whitelister.logCommand(cmd, validation);
  });

  whitelister.printSummary();
}
