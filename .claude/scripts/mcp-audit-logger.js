/**
 * MCP Audit Logger
 * Logs all MCP tool calls for compliance with ADR-INT-001
 * Format: JSONL (newline-delimited JSON) for easy querying and grep
 */

const fs = require('fs');
const path = require('path');

class MCPAuditLogger {
  constructor(auditDir = '.claude/mcp-audit') {
    this.auditDir = auditDir;
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
  }

  /**
   * Get today's audit log filename (audit-YYYYMMDD.jsonl)
   */
  getAuditFilePath() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.auditDir, `audit-${today}.jsonl`);
  }

  /**
   * Sanitize arguments to remove secrets before logging
   * Strips values for common secret keys: password, token, secret, key, credential
   */
  sanitizeArgs(args) {
    if (!args) return args;
    if (typeof args !== 'object') return args;

    const secretPatterns = ['password', 'token', 'secret', 'key', 'credential', 'auth'];
    const sanitized = JSON.parse(JSON.stringify(args));

    const stripSecrets = (obj) => {
      if (typeof obj !== 'object' || obj === null) return;
      for (const [k, v] of Object.entries(obj)) {
        if (secretPatterns.some(pat => k.toLowerCase().includes(pat))) {
          obj[k] = '***REDACTED***';
        } else if (typeof v === 'object' && v !== null) {
          stripSecrets(v);
        }
      }
    };

    stripSecrets(sanitized);
    return sanitized;
  }

  /**
   * Log a tool call
   * @param {string} agentRole - Name of agent (e.g., 'backend', 'devops')
   * @param {string} server - MCP server name (e.g., 'github', 'filesystem')
   * @param {string} tool - Tool name (e.g., 'create_pull_request')
   * @param {object} args - Tool arguments
   * @param {string} resultStatus - 'success', 'error', 'blocked', etc.
   * @param {object} metadata - Additional metadata (error, duration_ms, etc.)
   */
  log(agentRole, server, tool, args, resultStatus, metadata = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      agent_role: agentRole,
      server,
      tool,
      args_sanitized: this.sanitizeArgs(args),
      result_status: resultStatus,
      duration_ms: metadata.duration_ms || 0,
      ...(metadata.error && { error: metadata.error }),
      ...(metadata.approval_tier && { approval_tier: metadata.approval_tier }),
      ...(metadata.reason && { reason: metadata.reason }),
    };

    const jsonLine = JSON.stringify(entry) + '\n';
    const filePath = this.getAuditFilePath();

    try {
      fs.appendFileSync(filePath, jsonLine);
    } catch (err) {
      console.error(`Failed to write audit log: ${err.message}`);
    }

    return entry;
  }

  /**
   * Query audit log by date range and optional filters
   * @param {Date} startDate - Start of range
   * @param {Date} endDate - End of range
   * @param {object} filters - { agent_role?, server?, tool?, result_status? }
   * @returns {array} Matching entries
   */
  query(startDate, endDate, filters = {}) {
    const results = [];

    // Generate file names for date range
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const filePath = path.join(this.auditDir, `audit-${dateStr}.jsonl`);

      if (fs.existsSync(filePath)) {
        const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            if (this.matchesFilters(entry, filters)) {
              results.push(entry);
            }
          } catch (err) {
            // Skip malformed lines
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return results;
  }

  /**
   * Check if an entry matches filter criteria
   */
  matchesFilters(entry, filters) {
    if (filters.agent_role && entry.agent_role !== filters.agent_role) return false;
    if (filters.server && entry.server !== filters.server) return false;
    if (filters.tool && entry.tool !== filters.tool) return false;
    if (filters.result_status && entry.result_status !== filters.result_status) return false;
    return true;
  }

  /**
   * Get usage statistics for a date range
   * @returns {object} Stats including tool counts, error rates, etc.
   */
  getStats(startDate = null, endDate = null) {
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    }
    if (!endDate) {
      endDate = new Date();
    }

    const entries = this.query(startDate, endDate);
    const stats = {
      total_calls: entries.length,
      by_agent: {},
      by_server: {},
      by_result: {},
      error_rate: 0,
    };

    for (const entry of entries) {
      // Count by agent
      stats.by_agent[entry.agent_role] = (stats.by_agent[entry.agent_role] || 0) + 1;

      // Count by server
      stats.by_server[entry.server] = (stats.by_server[entry.server] || 0) + 1;

      // Count by result status
      stats.by_result[entry.result_status] = (stats.by_result[entry.result_status] || 0) + 1;
    }

    // Calculate error rate
    const errors = stats.by_result['error'] || 0;
    stats.error_rate = stats.total_calls > 0 ? (errors / stats.total_calls * 100).toFixed(2) + '%' : '0%';

    return stats;
  }

  /**
   * Export audit log for a date range as CSV
   * Useful for compliance audits
   */
  exportCSV(startDate, endDate, outputPath) {
    const entries = this.query(startDate, endDate);
    if (entries.length === 0) {
      console.log('No entries to export');
      return;
    }

    const headers = ['timestamp', 'agent_role', 'server', 'tool', 'result_status', 'duration_ms', 'reason'];
    const csvLines = [headers.join(',')];

    for (const entry of entries) {
      const row = [
        entry.timestamp,
        entry.agent_role,
        entry.server,
        entry.tool,
        entry.result_status,
        entry.duration_ms,
        (entry.reason || '').replace(/,/g, ';'), // Escape commas in reason
      ];
      csvLines.push(row.join(','));
    }

    fs.writeFileSync(outputPath, csvLines.join('\n'));
    console.log(`Exported ${entries.length} entries to ${outputPath}`);
  }

  /**
   * Clean up old audit logs (keep only last N days)
   */
  cleanup(keepDays = 90) {
    const files = fs.readdirSync(this.auditDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    let deleted = 0;
    for (const file of files) {
      if (!file.match(/^audit-\d{4}-\d{2}-\d{2}\.jsonl$/)) continue;

      const dateStr = file.replace('audit-', '').replace('.jsonl', '');
      const fileDate = new Date(dateStr);

      if (fileDate < cutoffDate) {
        const filePath = path.join(this.auditDir, file);
        fs.unlinkSync(filePath);
        deleted++;
      }
    }

    return deleted;
  }
}

module.exports = MCPAuditLogger;
