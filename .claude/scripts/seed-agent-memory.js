#!/usr/bin/env node

/**
 * Agent Memory Seeding Script (Phase 15.4)
 *
 * One-time migration: mines .claude/metrics/<agent>/<version>/outputs.json
 * records and 08-Retrospectives session summaries to produce initial
 * Vault/14-Agent-Memory/<agent>/memory.yaml files.
 *
 * Ongoing memory updates are Phase 17's memory-updater.js (learning loop,
 * gated by approval-workflow.js). This script only seeds.
 *
 * Usage: node .claude/scripts/seed-agent-memory.js [--force]
 *   --force  Overwrite existing memory.yaml files
 */

const fs = require('fs');
const path = require('path');

const METRICS_DIR = path.join('.claude', 'metrics');
const MEMORY_DIR = path.join('Vault', '14-Agent-Memory');
const RETRO_DIR = path.join('Vault', '08-Retrospectives');
const FORCE = process.argv.includes('--force');

// Metrics directory names → orchestrator agent roles (mcp-authorization matrix)
const AGENT_ROLE_MAP = {
  architect: 'architect',
  backend: 'backend',
  devops: 'devops',
  frontend: 'frontend',
  test: 'qa'
};

// Score keys in outputs.json verification blocks → baseline names
const SCORE_KEYS = {
  compliance_score: 'compliance',
  completeness_score: 'completeness',
  security_score: 'security',
  consistency_score: 'consistency',
  documentation_score: 'documentation'
};

const WEAK_SCORE_THRESHOLD = 80; // baselines below this are flagged as weak points

function main() {
  console.log('\n🧠 Agent Memory Seeding (Phase 15.4)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(METRICS_DIR)) {
    console.error(`❌ Metrics directory not found: ${METRICS_DIR}`);
    process.exit(1);
  }

  const recentSessions = collectRecentSessions(3);
  console.log(`   Found ${recentSessions.length} recent session summaries\n`);

  let seeded = 0;
  let skipped = 0;

  for (const [metricsName, agentRole] of Object.entries(AGENT_ROLE_MAP)) {
    const records = collectOutputs(path.join(METRICS_DIR, metricsName));

    if (records.length === 0) {
      console.log(`   ⚠️  ${agentRole}: no outputs.json records found, skipping`);
      skipped++;
      continue;
    }

    const memoryPath = path.join(MEMORY_DIR, agentRole, 'memory.yaml');

    if (fs.existsSync(memoryPath) && !FORCE) {
      console.log(`   ℹ️  ${agentRole}: memory.yaml exists (use --force to overwrite)`);
      skipped++;
      continue;
    }

    const memory = buildMemory(agentRole, records, recentSessions);
    fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
    fs.writeFileSync(memoryPath, toYaml(memory), 'utf8');

    console.log(`   ✅ ${agentRole}: seeded from ${records.length} records → ${memoryPath}`);
    seeded++;
  }

  console.log(`\n   Seeded: ${seeded}, Skipped: ${skipped}`);
  console.log('✅ SEEDING COMPLETE\n');
}

/**
 * Read all outputs.json records under a metrics agent directory (all versions)
 */
function collectOutputs(agentDir) {
  const records = [];

  if (!fs.existsSync(agentDir)) return records;

  for (const version of fs.readdirSync(agentDir)) {
    const outputsPath = path.join(agentDir, version, 'outputs.json');
    if (!fs.existsSync(outputsPath)) continue;

    try {
      const parsed = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      if (Array.isArray(parsed)) records.push(...parsed);
    } catch (err) {
      console.warn(`   ⚠️  Failed to parse ${outputsPath}: ${err.message}`);
    }
  }

  return records;
}

/**
 * List the N most recent session summary filenames for continuity references
 */
function collectRecentSessions(count) {
  try {
    return fs.readdirSync(RETRO_DIR)
      .filter(f => f.startsWith('Session-Summary-') && f.endsWith('.md'))
      .map(f => ({ file: f, mtime: fs.statSync(path.join(RETRO_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, count)
      .map(s => `08-Retrospectives/${s.file}`);
  } catch (err) {
    return [];
  }
}

/**
 * Compute baselines, patterns, and recommendations from output records
 */
function buildMemory(agentRole, records, recentSessions) {
  // Score baselines: rounded mean per score type
  const baselines = {};
  for (const [key, name] of Object.entries(SCORE_KEYS)) {
    const values = records
      .map(r => r.verification && r.verification[key])
      .filter(v => typeof v === 'number');
    if (values.length > 0) {
      baselines[name] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }
  }

  // Successful patterns: best-scoring distinct inputs from successful records
  const successful = records
    .filter(r => r.success && r.verification)
    .map(r => ({
      pattern: r.input,
      domain: r.domain || 'general',
      avg_compliance_score: r.verification.compliance_score,
      confidence: r.verification.issues_critical === 0 && r.verification.issues_major === 0 ? 0.9 : 0.7,
      source: `outputs.json#${r.id}`
    }));

  const seen = new Set();
  const successfulPatterns = [];
  for (const p of successful.sort((a, b) => b.avg_compliance_score - a.avg_compliance_score)) {
    const key = p.pattern.toLowerCase().substring(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    successfulPatterns.push(p);
    if (successfulPatterns.length >= 5) break;
  }

  // Failed patterns: weak score baselines + outright failures
  const failedPatterns = [];
  for (const [name, value] of Object.entries(baselines)) {
    if (value < WEAK_SCORE_THRESHOLD) {
      failedPatterns.push({
        pattern: `${name} quality`,
        note: `${name}_score baseline ${value} (below ${WEAK_SCORE_THRESHOLD}) — recurring weak point`,
        source: 'outputs.json aggregate'
      });
    }
  }
  for (const r of records.filter(r => r.success === false)) {
    failedPatterns.push({
      pattern: r.input,
      note: `failed output (status: ${r.verification ? r.verification.status : 'unknown'})`,
      source: `outputs.json#${r.id}`
    });
  }

  // Recommendations derived from weak baselines
  const recommendations = [];
  if (baselines.documentation !== undefined && baselines.documentation < WEAK_SCORE_THRESHOLD) {
    recommendations.push(`documentation_score baseline ${baselines.documentation} is a consistent weak point — apply documentation skill`);
  }
  if (baselines.consistency !== undefined && baselines.consistency < WEAK_SCORE_THRESHOLD) {
    recommendations.push(`consistency_score baseline ${baselines.consistency} — always include cross-component consistency check`);
  }
  if (baselines.completeness !== undefined && baselines.completeness <= WEAK_SCORE_THRESHOLD) {
    recommendations.push(`completeness_score baseline ${baselines.completeness} — review flagged completeness gaps before submitting output`);
  }

  return {
    agent: agentRole,
    version: '1.0.0',
    seeded_from_records: records.length,
    successful_patterns: successfulPatterns,
    failed_patterns: failedPatterns,
    score_baselines: baselines,
    recommendations,
    recent_sessions: recentSessions,
    last_updated: new Date().toISOString().split('T')[0]
  };
}

/**
 * Minimal YAML serializer for the memory schema
 * (scalars, string arrays, flat objects, arrays of flat objects)
 */
function toYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  let out = '';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      out += `${pad}${key}: null\n`;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        out += `${pad}${key}: []\n`;
      } else {
        out += `${pad}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const entries = Object.entries(item);
            entries.forEach(([k, v], i) => {
              const prefix = i === 0 ? `${pad}  - ` : `${pad}    `;
              out += `${prefix}${k}: ${yamlScalar(v)}\n`;
            });
          } else {
            out += `${pad}  - ${yamlScalar(item)}\n`;
          }
        }
      }
    } else if (typeof value === 'object') {
      out += `${pad}${key}:\n${toYaml(value, indent + 1)}`;
    } else {
      out += `${pad}${key}: ${yamlScalar(value)}\n`;
    }
  }

  return out;
}

function yamlScalar(value) {
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return String(value);
}

main();
