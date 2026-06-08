/**
 * Phase 12 Validation Suite
 * Tests MCP audit logging, authorization, and configuration
 * Run: node .claude/scripts/validate-phase-12.js
 */

const fs = require('fs');
const path = require('path');
const MCPAuditLogger = require('./mcp-audit-logger');
const MCPAuthorization = require('./mcp-authorization');

class Phase12Validator {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  log(message) {
    console.log(message);
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  test(name, fn) {
    this.totalTests++;
    try {
      fn.call(this);
      this.passedTests++;
      this.testResults.push({ name, status: 'PASS' });
      this.log(`✓ Test ${this.totalTests}: ${name}`);
    } catch (err) {
      this.testResults.push({ name, status: 'FAIL', error: err.message });
      this.log(`✗ Test ${this.totalTests}: ${name}`);
      this.log(`  Error: ${err.message}`);
    }
  }

  // Test 1: .mcp.json schema is valid
  testMCPJsonSchema() {
    this.test('MCP .json schema is valid and servers parseable', () => {
      const mcpPath = path.join(process.cwd(), '.mcp.json');
      this.assert(fs.existsSync(mcpPath), '.mcp.json does not exist');

      const content = fs.readFileSync(mcpPath, 'utf-8');
      const mcp = JSON.parse(content);

      this.assert(mcp.mcpServers, 'mcpServers property missing');
      this.assert(typeof mcp.mcpServers === 'object', 'mcpServers must be an object');

      // Check for required servers
      this.assert(mcp.mcpServers.chroma, 'chroma server missing');
      this.assert(mcp.mcpServers.github, 'github server missing (Phase 12 requirement)');
      this.assert(mcp.mcpServers.filesystem, 'filesystem server missing (Phase 12 requirement)');

      // Validate server structure
      for (const [serverName, config] of Object.entries(mcp.mcpServers)) {
        this.assert(config.type, `${serverName} server missing type`);
        this.assert(config.command, `${serverName} server missing command`);
        this.assert(Array.isArray(config.args), `${serverName} server args must be array`);
      }
    });
  }

  // Test 2: Audit logger creates entries
  testAuditLoggerCreatesEntries() {
    this.test('Audit logger creates log entries with all required fields', () => {
      const auditDir = path.join(process.cwd(), '.claude/.test-audit-phase12');
      const logger = new MCPAuditLogger(auditDir);

      const entry = logger.log('backend', 'github', 'create_pull_request', {
        repo: 'test/repo',
        title: 'Feature: Auth',
      }, 'success', { duration_ms: 1234 });

      this.assert(entry.timestamp, 'timestamp missing');
      this.assert(entry.agent_role === 'backend', 'agent_role incorrect');
      this.assert(entry.server === 'github', 'server incorrect');
      this.assert(entry.tool === 'create_pull_request', 'tool incorrect');
      this.assert(entry.result_status === 'success', 'result_status incorrect');
      this.assert(entry.duration_ms === 1234, 'duration_ms incorrect');
      this.assert(entry.args_sanitized, 'args_sanitized missing');

      // Cleanup
      if (fs.existsSync(auditDir)) {
        fs.rmSync(auditDir, { recursive: true });
      }
    });
  }

  // Test 3: Audit logger sanitizes secrets
  testAuditLoggerSanitizesSecrets() {
    this.test('Audit logger sanitizes secrets from arguments', () => {
      const auditDir = path.join(process.cwd(), '.claude/.test-audit-phase12');
      const logger = new MCPAuditLogger(auditDir);

      const entry = logger.log('backend', 'github', 'push_branch', {
        repo: 'test/repo',
        token: 'secret123',
        github_token: 'secret456',
        password: 'pw789',
        api_key: 'key000',
        normal_field: 'visible',
      }, 'success');

      this.assert(entry.args_sanitized.normal_field === 'visible', 'normal fields must not be sanitized');
      this.assert(entry.args_sanitized.token === '***REDACTED***', 'token not sanitized');
      this.assert(entry.args_sanitized.github_token === '***REDACTED***', 'github_token not sanitized');
      this.assert(entry.args_sanitized.password === '***REDACTED***', 'password not sanitized');
      this.assert(entry.args_sanitized.api_key === '***REDACTED***', 'api_key not sanitized');

      // Cleanup
      if (fs.existsSync(auditDir)) {
        fs.rmSync(auditDir, { recursive: true });
      }
    });
  }

  // Test 4: Authorization allows Tier-1 tools
  testAuthorizationAllowsTier1() {
    this.test('Authorization allows Tier-1 tools for correct agents', () => {
      const auth = new MCPAuthorization();

      // Backend can search code (Tier 1)
      const result = auth.checkAuthorization('backend', 'github', 'search_code');
      this.assert(result.allowed === true, 'Tier-1 tool should be allowed');
      this.assert(result.tier === 1, 'Tier should be 1');

      // Frontend can read files (Tier 1)
      const result2 = auth.checkAuthorization('frontend', 'filesystem', 'read_file');
      this.assert(result2.allowed === true, 'Tier-1 filesystem read should be allowed');
      this.assert(result2.tier === 1, 'Tier should be 1');
    });
  }

  // Test 5: Authorization blocks unauthorized agents
  testAuthorizationBlocksUnauthorized() {
    this.test('Authorization blocks tools for unauthorized agents', () => {
      const auth = new MCPAuthorization();

      // Architect cannot use GitHub merge
      const result = auth.checkAuthorization('architect', 'github', 'merge_pull_request');
      this.assert(result.allowed === false, 'Architect should not merge PRs');
      this.assert(result.tier === 5, 'Should return Tier 5 (blocked)');

      // Unknown agent
      const result2 = auth.checkAuthorization('unknown_role', 'github', 'push_branch');
      this.assert(result2.allowed === false, 'Unknown agent should be blocked');
      this.assert(result2.tier === 5, 'Should return Tier 5');
    });
  }

  // Test 6: Authorization handles Tier-2 (review required)
  testAuthorizationTier2() {
    this.test('Authorization routes Tier-2 tools correctly', () => {
      const auth = new MCPAuthorization();

      // Backend can create PRs but needs review
      const result = auth.checkAuthorization('backend', 'github', 'create_pull_request');
      this.assert(result.allowed === true, 'Tier-2 should be allowed (review happens in pipeline)');
      this.assert(result.tier === 2, 'Tier should be 2');
      this.assert(result.action === 'require-review', 'Action should be require-review');
      this.assert(result.requires_approval === true, 'requires_approval should be true');
    });
  }

  // Test 7: Authorization matrix is valid
  testAuthorizationMatrixValid() {
    this.test('Authorization matrix is valid and complete', () => {
      const auth = new MCPAuthorization();
      const validation = auth.validate();

      this.assert(validation.valid === true, `Matrix validation failed: ${validation.errors.join(', ')}`);
      this.assert(validation.agent_count >= 7, 'Should have at least 7 agents');
      this.assert(validation.server_count >= 3, 'Should have at least 3 servers (chroma, github, filesystem)');
      this.assert(validation.tool_count >= 20, 'Should have at least 20 tools');
    });
  }

  // Test 8: Full integration test
  testFullIntegration() {
    this.test('Full integration: authorization + audit log', () => {
      const auditDir = path.join(process.cwd(), '.claude/.test-audit-phase12');
      const logger = new MCPAuditLogger(auditDir);
      const auth = new MCPAuthorization();

      // Simulate a tool call flow
      const agentRole = 'backend';
      const server = 'github';
      const tool = 'create_pull_request';
      const args = { repo: 'test/repo', title: 'Feature X' };

      // 1. Check authorization
      const authResult = auth.checkAuthorization(agentRole, server, tool);
      this.assert(authResult.allowed === true, 'Auth check failed');
      this.assert(authResult.tier === 2, 'Should be Tier 2');

      // 2. Log the call
      const auditEntry = logger.log(agentRole, server, tool, args, 'success', {
        duration_ms: 500,
        approval_tier: 2,
      });

      // 3. Verify audit entry
      this.assert(auditEntry.agent_role === agentRole, 'Audit entry agent_role incorrect');
      this.assert(auditEntry.result_status === 'success', 'Audit entry result_status incorrect');
      this.assert(auditEntry.approval_tier === 2, 'Audit entry approval_tier incorrect');

      // Cleanup
      if (fs.existsSync(auditDir)) {
        fs.rmSync(auditDir, { recursive: true });
      }
    });
  }

  run() {
    this.log('\n=== Phase 12 Validation Suite ===\n');

    this.testMCPJsonSchema();
    this.testAuditLoggerCreatesEntries();
    this.testAuditLoggerSanitizesSecrets();
    this.testAuthorizationAllowsTier1();
    this.testAuthorizationBlocksUnauthorized();
    this.testAuthorizationTier2();
    this.testAuthorizationMatrixValid();
    this.testFullIntegration();

    // Summary
    this.log(`\n=== Summary ===`);
    this.log(`Total: ${this.totalTests}`);
    this.log(`Passed: ${this.passedTests}`);
    this.log(`Failed: ${this.totalTests - this.passedTests}`);

    if (this.passedTests === this.totalTests) {
      this.log('\n✓ All tests passed!');
      return 0;
    } else {
      this.log(`\n✗ ${this.totalTests - this.passedTests} test(s) failed`);
      return 1;
    }
  }
}

if (require.main === module) {
  const validator = new Phase12Validator();
  process.exit(validator.run());
}

module.exports = Phase12Validator;
