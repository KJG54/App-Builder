#!/usr/bin/env node
/**
 * Memory Updater — Phase 17.1
 *
 * Records completed subtask outcomes into agent memory.yaml via a staged
 * pending-file pattern. memory.yaml is NEVER written directly — human must
 * run --apply to commit a pending update.
 *
 * CLI:
 *   node memory-updater.js --review              List pending updates
 *   node memory-updater.js --apply <timestamp>   Apply a pending update
 *   node memory-updater.js --discard <timestamp> Discard a pending update
 */

const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const DEFAULT_MEMORY_DIR = path.resolve(__dirname, '..', '..', 'Vault', '14-Agent-Memory');

// ---------------------------------------------------------------------------
// Pure functions (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Compute new rolling baselines using 80/20 weighted average.
 * Only updates score types present in both current and incoming.
 */
function computeNewBaselines(current, incoming) {
  const result = { ...current };
  for (const key of Object.keys(current)) {
    if (incoming[key] !== undefined && typeof incoming[key] === 'number') {
      result[key] = 0.8 * current[key] + 0.2 * incoming[key];
    }
  }
  return result;
}

/**
 * Detect which score types regressed (current_baseline - new_score > 10).
 */
function detectRegressions(currentBaselines, newScores) {
  return Object.keys(currentBaselines).filter(key => {
    const incoming = newScores[key];
    return typeof incoming === 'number' && (currentBaselines[key] - incoming) > 10;
  });
}

// ---------------------------------------------------------------------------
// MemoryUpdater class
// ---------------------------------------------------------------------------

class MemoryUpdater {
  constructor(memoryDir = DEFAULT_MEMORY_DIR) {
    this.memoryDir = memoryDir;
  }

  async recordOutcome({ agent, domain = 'general', scores = {} }) {
    const agentDir  = path.join(this.memoryDir, agent);
    const memFile   = path.join(agentDir, 'memory.yaml');

    if (!fs.existsSync(memFile)) {
      console.warn(`[MemoryUpdater] No memory.yaml for agent "${agent}" — skipping`);
      return;
    }

    const current = yaml.load(fs.readFileSync(memFile, 'utf8'));
    const currentBaselines = current.score_baselines || {};
    const newBaselines     = computeNewBaselines(currentBaselines, scores);
    const regressions      = detectRegressions(currentBaselines, scores);

    const pending = {
      ...current,
      score_baselines: newBaselines,
      last_updated: new Date().toISOString().slice(0, 10),
      _pending_meta: {
        recorded_at: new Date().toISOString(),
        domain,
        incoming_scores: scores,
        regressions: regressions.length > 0
          ? regressions.map(k => `⚠️ REGRESSION: ${k} dropped from ${currentBaselines[k].toFixed(1)} to ${scores[k]}`)
          : [],
      },
    };

    const timestamp   = new Date().toISOString().replace(/[:.]/g, '-');
    const pendingFile = path.join(agentDir, `memory-pending-${timestamp}.yaml`);
    fs.writeFileSync(pendingFile, yaml.dump(pending), 'utf8');

    if (regressions.length > 0) {
      console.warn(`[MemoryUpdater] ⚠️  REGRESSIONS for ${agent}: ${regressions.join(', ')}`);
      console.warn(`[MemoryUpdater] Review with: node memory-updater.js --review`);
    } else {
      console.log(`[MemoryUpdater] Pending update written for ${agent} (${pendingFile})`);
    }
  }

  review() {
    const agents = fs.readdirSync(this.memoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    let found = 0;
    for (const agent of agents) {
      const agentDir = path.join(this.memoryDir, agent);
      const pending  = fs.readdirSync(agentDir).filter(f => f.startsWith('memory-pending-'));
      for (const file of pending) {
        found++;
        const data = yaml.load(fs.readFileSync(path.join(agentDir, file), 'utf8'));
        const meta = data._pending_meta || {};
        const regressionCount = meta.regressions?.length || 0;
        const tag = regressionCount > 0 ? `⚠️  ${regressionCount} regression(s)` : '✅ no regressions';
        const timestamp = file.replace('memory-pending-', '').replace('.yaml', '');
        console.log(`\n  Agent:      ${agent}`);
        console.log(`  Timestamp:  ${timestamp}`);
        console.log(`  Domain:     ${meta.domain || 'unknown'}`);
        console.log(`  Status:     ${tag}`);
        if (regressionCount > 0) {
          meta.regressions.forEach(r => console.log(`              ${r}`));
        }
        console.log(`  Apply:      node memory-updater.js --apply ${timestamp}`);
        console.log(`  Discard:    node memory-updater.js --discard ${timestamp}`);
      }
    }

    if (found === 0) console.log('  No pending memory updates.');
    else console.log(`\n  ${found} pending update(s) total.`);
  }

  apply(timestamp) {
    const agents = fs.readdirSync(this.memoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agent of agents) {
      const agentDir    = path.join(this.memoryDir, agent);
      const pendingFile = path.join(agentDir, `memory-pending-${timestamp}.yaml`);
      if (!fs.existsSync(pendingFile)) continue;

      const data = yaml.load(fs.readFileSync(pendingFile, 'utf8'));
      delete data._pending_meta;
      fs.writeFileSync(path.join(agentDir, 'memory.yaml'), yaml.dump(data), 'utf8');
      fs.unlinkSync(pendingFile);
      console.log(`✅ Applied memory update for ${agent} (${timestamp})`);
      return;
    }

    console.error(`❌ No pending file found with timestamp: ${timestamp}`);
    process.exit(1);
  }

  discard(timestamp) {
    const agents = fs.readdirSync(this.memoryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const agent of agents) {
      const pendingFile = path.join(this.memoryDir, agent, `memory-pending-${timestamp}.yaml`);
      if (!fs.existsSync(pendingFile)) continue;
      fs.unlinkSync(pendingFile);
      console.log(`🗑️  Discarded pending update for ${agent} (${timestamp})`);
      return;
    }

    console.error(`❌ No pending file found with timestamp: ${timestamp}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const updater = new MemoryUpdater();

  if (args[0] === '--review') {
    console.log('\n📋 Pending Memory Updates\n');
    updater.review();
  } else if (args[0] === '--apply' && args[1]) {
    updater.apply(args[1]);
  } else if (args[0] === '--discard' && args[1]) {
    updater.discard(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node memory-updater.js --review');
    console.log('  node memory-updater.js --apply <timestamp>');
    console.log('  node memory-updater.js --discard <timestamp>');
  }
}

module.exports = { MemoryUpdater, computeNewBaselines, detectRegressions };
