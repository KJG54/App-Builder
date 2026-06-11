#!/usr/bin/env node
/**
 * Cost Analyzer — Phase 17.2
 *
 * Aggregates cost data from .claude/metrics/{agent}/v1.0.0/outputs.json.
 * Detects cost spikes using 3× median threshold per agent.
 * Writes Vault/Logs/cost-report-YYYY-MM-DD.md
 *
 * CLI:
 *   node cost-analyzer.js [--agent architect] [--days 30] [--no-write]
 */

const fs   = require('fs');
const path = require('path');

const DEFAULT_METRICS_DIR = path.resolve(__dirname, '..', 'metrics');
const DEFAULT_LOG_DIR     = path.resolve(__dirname, '..', '..', 'Vault', 'Logs');

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Detect cost spikes: records where cost > 3× the agent's median cost.
 */
function detectSpikes(records) {
  const byAgent = {};
  for (const r of records) {
    const agent = r.agent_role || 'unknown';
    (byAgent[agent] = byAgent[agent] || []).push(r);
  }

  const spikes = [];
  for (const [agent, agentRecords] of Object.entries(byAgent)) {
    const costs  = agentRecords.map(r => r.performance?.cost_usd || 0).sort((a, b) => a - b);
    const median = (costs[Math.floor((costs.length - 1) / 2)] + costs[Math.ceil((costs.length - 1) / 2)]) / 2;
    if (median === 0) continue;
    for (const r of agentRecords) {
      const cost = r.performance?.cost_usd || 0;
      if (cost > 3 * median) {
        spikes.push({ ...r, medianCost: median, multiple: cost / median });
      }
    }
  }
  return spikes;
}

// ---------------------------------------------------------------------------
// CostAnalyzer class
// ---------------------------------------------------------------------------

class CostAnalyzer {
  constructor(metricsDir = DEFAULT_METRICS_DIR) {
    this.metricsDir = metricsDir;
  }

  loadAllRecords() {
    const records = [];
    if (!fs.existsSync(this.metricsDir)) return records;

    const agents = fs.readdirSync(this.metricsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agent of agents) {
      const outputFile = path.join(this.metricsDir, agent, 'v1.0.0', 'outputs.json');
      if (!fs.existsSync(outputFile)) continue;
      try {
        const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
        const arr  = Array.isArray(data) ? data : Object.values(data);
        records.push(...arr);
      } catch (e) {
        console.warn(`[CostAnalyzer] Could not parse ${outputFile}: ${e.message}`);
      }
    }
    return records;
  }

  buildReport(records, { days = 30, agent = null } = {}) {
    let filtered = records;
    if (agent) filtered = filtered.filter(r => r.agent_role === agent);
    if (days > 0) {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      filtered = filtered.filter(r => r.timestamp >= cutoff);
    }

    if (filtered.length === 0) return { totalCost: 0, byAgent: {}, byDomain: {}, byDay: {}, spikes: [], recordCount: 0 };

    const totalCost = filtered.reduce((s, r) => s + (r.performance?.cost_usd || 0), 0);

    const byAgent = {};
    for (const r of filtered) {
      const a = r.agent_role || 'unknown';
      if (!byAgent[a]) byAgent[a] = { total: 0, count: 0, costs: [] };
      byAgent[a].total += r.performance?.cost_usd || 0;
      byAgent[a].count++;
      byAgent[a].costs.push(r.performance?.cost_usd || 0);
    }
    for (const a of Object.keys(byAgent)) {
      const costs  = byAgent[a].costs.sort((x, y) => x - y);
      byAgent[a].median  = (costs[Math.floor((costs.length - 1) / 2)] + costs[Math.ceil((costs.length - 1) / 2)]) / 2;
      byAgent[a].average = byAgent[a].total / byAgent[a].count;
      delete byAgent[a].costs;
    }

    const byDomain = {};
    for (const r of filtered) {
      const d = r.domain || 'unknown';
      if (!byDomain[d]) byDomain[d] = { total: 0, count: 0 };
      byDomain[d].total += r.performance?.cost_usd || 0;
      byDomain[d].count++;
    }

    const byDay = {};
    for (const r of filtered) {
      const day = (r.timestamp || '').slice(0, 10);
      if (!day) continue;
      byDay[day] = (byDay[day] || 0) + (r.performance?.cost_usd || 0);
    }

    const spikes = detectSpikes(filtered);

    return { totalCost, byAgent, byDomain, byDay, spikes, recordCount: filtered.length };
  }

  formatReport(report, date) {
    const d    = date.toISOString().slice(0, 10);
    const fmt  = n => `$${n.toFixed(4)}`;
    const lines = [`# Cost Report — ${d}\n`];

    lines.push(`## Summary`);
    lines.push(`- **Total spend:** ${fmt(report.totalCost)}`);
    lines.push(`- **Records analyzed:** ${report.recordCount}`);
    lines.push(`- **Spikes detected:** ${report.spikes.length}\n`);

    lines.push(`## Per-Agent`);
    lines.push(`| Agent | Total | Records | Median/task | Avg/task |`);
    lines.push(`|-------|-------|---------|-------------|----------|`);
    for (const [a, s] of Object.entries(report.byAgent)) {
      lines.push(`| ${a} | ${fmt(s.total)} | ${s.count} | ${fmt(s.median)} | ${fmt(s.average)} |`);
    }
    lines.push('');

    lines.push(`## Per-Domain`);
    lines.push(`| Domain | Total | Records |`);
    lines.push(`|--------|-------|---------|`);
    for (const [d2, s] of Object.entries(report.byDomain)) {
      lines.push(`| ${d2} | ${fmt(s.total)} | ${s.count} |`);
    }
    lines.push('');

    lines.push(`## Daily Spend`);
    lines.push(`| Date | Total |`);
    lines.push(`|------|-------|`);
    for (const [day, total] of Object.entries(report.byDay).sort()) {
      lines.push(`| ${day} | ${fmt(total)} |`);
    }
    lines.push('');

    if (report.spikes.length > 0) {
      lines.push(`## ⚠️ Cost Spikes`);
      lines.push(`| ID | Agent | Domain | Date | Cost | Multiple of Median |`);
      lines.push(`|----|-------|--------|------|------|--------------------|`);
      for (const s of report.spikes) {
        const day = (s.timestamp || '').slice(0, 10);
        lines.push(`| ${s.id} | ${s.agent_role} | ${s.domain || '-'} | ${day} | ${fmt(s.performance?.cost_usd || 0)} | ${s.multiple.toFixed(1)}× |`);
      }
    } else {
      lines.push(`## Cost Spikes\nNone detected.`);
    }

    return lines.join('\n');
  }

  analyze({ days = 30, agent = null, write = true, logDir = DEFAULT_LOG_DIR } = {}) {
    const records = this.loadAllRecords();
    const report  = this.buildReport(records, { days, agent });
    const now     = new Date();
    const md      = this.formatReport(report, now);

    if (write) {
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const outPath = path.join(logDir, `cost-report-${now.toISOString().slice(0, 10)}.md`);
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(`✅ Cost report written to ${outPath}`);
    } else {
      console.log(md);
    }

    return report;
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args    = process.argv.slice(2);
  const noWrite = args.includes('--no-write');
  const days    = parseInt(
    (args.find(a => a.startsWith('--days='))  || '').replace('--days=', '') ||
    (args.includes('--days')  ? args[args.indexOf('--days')  + 1] : '') ||
    '30'
  );
  const agent   = (args.find(a => a.startsWith('--agent=')) || '').replace('--agent=', '') ||
                  (args.includes('--agent') ? args[args.indexOf('--agent') + 1] : null);

  new CostAnalyzer().analyze({ days, agent, write: !noWrite });
}

module.exports = { CostAnalyzer, detectSpikes };
