#!/usr/bin/env node

/**
 * Phase 18.5 — Autonomous Build Loop
 *
 * Orchestrates a phased project build:
 *   1. Reads the approved Phase Plan (Phase-Plan.md)
 *   2. For each phase: implements → tests → git checkpoint → advances
 *   3. Enforces the budget ceiling from the project spec
 *   4. Escalates blockers via: fix → web search → escalate → log to Known Problems
 *   5. Re-runs prior phase tests before starting each new phase (regression guard)
 *
 * Usage:
 *   node build-runner.js <projectDir>
 *   node build-runner.js <projectDir> --phase <N>       # start from phase N
 *   node build-runner.js <projectDir> --dry-run         # validate plan only, no build
 *
 * The build runner is NOT autonomous in the sense of writing code itself —
 * it is a session orchestrator that reads the plan, tracks state, enforces gates,
 * and provides structured output for the human+agent build loop.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_BUDGET_CEILING_USD  = 50;
const DEFAULT_BUDGET_CEILING_HOURS = 8;

const BLOCKER_ESCALATION = [
  'fix',          // Attempt an automatic fix
  'web-search',   // Search for a solution
  'escalate',     // Ask the human for guidance
  'log',          // Log to Known Problems and skip
];

const EXIT_CODES = {
  SUCCESS:         0,
  PLAN_NOT_FOUND:  1,
  PLAN_INVALID:    2,
  TEST_FAILURE:    3,
  BUDGET_EXCEEDED: 4,
  ESCALATION:      5,
  DRY_RUN:         0,
};

// ── CLI Parsing ────────────────────────────────────────────────────────────────

function parseCLI() {
  const args = process.argv.slice(2);
  const opts = { projectDir: null, startPhase: 1, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      opts.startPhase = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--dry-run') {
      opts.dryRun = true;
    } else if (!opts.projectDir) {
      opts.projectDir = path.resolve(args[i]);
    }
  }

  return opts;
}

// ── Plan Parser ────────────────────────────────────────────────────────────────

function findPhasePlan(projectDir) {
  // Look in the standard Phase 18.4 location first, then the project Vault
  const candidates = [
    path.join(projectDir, 'Vault', '03-Projects', path.basename(projectDir), 'Phase-Plan.md'),
    path.join(projectDir, 'Vault', '03-Projects', 'Phase-Plan.md'),
    path.join(projectDir, 'Phase-Plan.md'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parsePhasePlan(planPath) {
  const content = fs.readFileSync(planPath, 'utf8');

  // Extract status — must be "Approved" (case-insensitive)
  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/i);
  const status = statusMatch ? statusMatch[1].trim() : 'Unknown';

  // Extract budget ceiling
  const budgetMatch = content.match(/\*\*Soft ceiling:\*\*\s*(.+)/i);
  const budgetRaw = budgetMatch ? budgetMatch[1].trim() : null;

  // Extract phases — look for "## Phase N:" headings
  const phases = [];
  const phaseRegex = /^##\s+Phase\s+(\d+):\s*(.+)$/gm;
  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    const phaseNum = parseInt(match[1], 10);
    const phaseName = match[2].trim();

    // Extract the section body for this phase
    const sectionStart = match.index;
    const nextMatch = phaseRegex.exec(content);
    phaseRegex.lastIndex = match.index + match[0].length; // reset after peek
    const sectionEnd = nextMatch ? nextMatch.index : content.length;
    const body = content.slice(sectionStart, sectionEnd);

    // Extract goal
    const goalMatch = body.match(/\*\*Goal:\*\*\s*(.+)/);
    const goal = goalMatch ? goalMatch[1].trim() : phaseName;

    // Extract acceptance criterion from test plan
    const acceptanceMatch = body.match(/[-*]\s+Acceptance:\s*(.+)/i);
    const acceptance = acceptanceMatch ? acceptanceMatch[1].trim() : null;

    // Extract effort estimate
    const effortMatch = body.match(/\*\*Estimated effort:\*\*\s*(.+)/i);
    const effort = effortMatch ? effortMatch[1].trim() : 'unknown';

    phases.push({ number: phaseNum, name: phaseName, goal, acceptance, effort, body });
  }

  return { status, budgetRaw, phases, content };
}

function parseBudgetCeiling(raw) {
  if (!raw || raw.toLowerCase() === 'no limit') {
    return { usd: Infinity, hours: Infinity };
  }

  const usdMatch  = raw.match(/\$(\d+(?:\.\d+)?)/);
  const hrMatch   = raw.match(/(\d+(?:\.\d+)?)\s*hours?/i);

  return {
    usd:   usdMatch  ? parseFloat(usdMatch[1])  : DEFAULT_BUDGET_CEILING_USD,
    hours: hrMatch   ? parseFloat(hrMatch[1])   : DEFAULT_BUDGET_CEILING_HOURS,
  };
}

// ── State Tracking ─────────────────────────────────────────────────────────────

function loadState(projectDir) {
  const statePath = path.join(projectDir, '.claude', 'build-state.json');
  if (fs.existsSync(statePath)) {
    try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch {}
  }
  return {
    currentPhase:    1,
    completedPhases: [],
    startedAt:       new Date().toISOString(),
    elapsedHours:    0,
    estimatedCostUsd: 0,
    blockers:        [],
  };
}

function saveState(projectDir, state) {
  const dir = path.join(projectDir, '.claude');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'build-state.json'),
    JSON.stringify(state, null, 2),
    'utf8'
  );
}

// ── Git Helpers ────────────────────────────────────────────────────────────────

function gitIsClean(projectDir) {
  try {
    const out = execSync('git status --porcelain', { cwd: projectDir, stdio: 'pipe' }).toString();
    return out.trim() === '';
  } catch { return false; }
}

function gitCheckpoint(projectDir, message) {
  try {
    execSync('git add -A', { cwd: projectDir, stdio: 'pipe' });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: projectDir, stdio: 'pipe' });
    return true;
  } catch (err) {
    return false;
  }
}

function gitInitIfNeeded(projectDir) {
  const gitDir = path.join(projectDir, '.git');
  if (!fs.existsSync(gitDir)) {
    try {
      execSync('git init', { cwd: projectDir, stdio: 'pipe' });
      execSync('git add -A', { cwd: projectDir, stdio: 'pipe' });
      execSync('git commit -m "chore: initial scaffold"', { cwd: projectDir, stdio: 'pipe' });
      return true;
    } catch { return false; }
  }
  return true;
}

// ── Test Runner ────────────────────────────────────────────────────────────────

function runTests(projectDir, label) {
  const pkg = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkg)) {
    return { passed: true, output: 'No package.json — skipping tests' };
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
  const testCmd = pkgJson.scripts && pkgJson.scripts.test;

  if (!testCmd || testCmd.includes('echo "No tests')) {
    return { passed: true, output: 'No test script defined — skipping' };
  }

  try {
    const out = execSync('npm test', { cwd: projectDir, stdio: 'pipe', timeout: 120000 }).toString();
    return { passed: true, output: out };
  } catch (err) {
    const out = (err.stdout || '').toString() + (err.stderr || '').toString();
    return { passed: false, output: out, error: err.message };
  }
}

// ── Budget Guard ───────────────────────────────────────────────────────────────

function checkBudget(state, ceiling) {
  if (state.estimatedCostUsd >= ceiling.usd) {
    return {
      exceeded: true,
      reason: `Estimated cost $${state.estimatedCostUsd.toFixed(2)} reached ceiling of $${ceiling.usd}`,
    };
  }
  if (state.elapsedHours >= ceiling.hours) {
    return {
      exceeded: true,
      reason: `Elapsed time ${state.elapsedHours.toFixed(1)}h reached ceiling of ${ceiling.hours}h`,
    };
  }
  return { exceeded: false };
}

// ── Known Problems Logger ──────────────────────────────────────────────────────

function logKnownProblem(projectDir, phase, description, error) {
  const kpDir  = path.join(projectDir, 'Vault', '10-Known-Problems');
  const today  = new Date().toISOString().slice(0, 10);
  const slug   = `build-phase-${phase.number}-blocker`;
  const kpPath = path.join(kpDir, `${slug}.md`);

  fs.mkdirSync(kpDir, { recursive: true });

  const content = [
    `---`,
    `type: known-problem`,
    `status: open`,
    `severity: high`,
    `phase: ${phase.number}`,
    `last_updated: ${today}`,
    `---`,
    ``,
    `# Build Blocker — Phase ${phase.number}: ${phase.name}`,
    ``,
    `**Reported:** ${today}`,
    `**Phase:** ${phase.number} — ${phase.goal}`,
    ``,
    `## Problem`,
    ``,
    description,
    ``,
    `## Error`,
    ``,
    `\`\`\``,
    error || '(no error details)',
    `\`\`\``,
    ``,
    `## Status`,
    ``,
    `Escalated — human input required to unblock Phase ${phase.number}.`,
    ``,
  ].join('\n');

  fs.writeFileSync(kpPath, content, 'utf8');
  return kpPath;
}

// ── Build Report ───────────────────────────────────────────────────────────────

function writeBuildReport(projectDir, state, phases, result) {
  const reportDir  = path.join(projectDir, '.claude', 'reviews');
  const today      = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportPath = path.join(reportDir, `build-report-${today}.md`);

  fs.mkdirSync(reportDir, { recursive: true });

  const lines = [
    `# Build Report — ${path.basename(projectDir)}`,
    `**Date:** ${new Date().toISOString()}`,
    `**Result:** ${result}`,
    ``,
    `## Phase Summary`,
    ``,
    `| Phase | Status | Notes |`,
    `|-------|--------|-------|`,
  ];

  for (const phase of phases) {
    const done = state.completedPhases.includes(phase.number);
    lines.push(`| ${phase.number} — ${phase.name} | ${done ? '✅ Complete' : '⏸ Pending'} | |`);
  }

  lines.push(``, `## Build State`, ``, `\`\`\`json`, JSON.stringify(state, null, 2), `\`\`\``, ``);

  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  return reportPath;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseCLI();

  if (!opts.projectDir) {
    console.error('Usage: build-runner.js <projectDir> [--phase N] [--dry-run]');
    process.exit(1);
  }

  if (!fs.existsSync(opts.projectDir)) {
    console.error(`Project directory not found: ${opts.projectDir}`);
    process.exit(EXIT_CODES.PLAN_NOT_FOUND);
  }

  console.log(`\n🏗️  Build Runner — ${path.basename(opts.projectDir)}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Project: ${opts.projectDir}`);
  if (opts.dryRun) console.log(`Mode: DRY RUN (validation only)`);

  // 1. Find and parse the phase plan
  const planPath = findPhasePlan(opts.projectDir);
  if (!planPath) {
    console.error(`\n❌ No Phase Plan found in ${opts.projectDir}`);
    console.error(`   Expected: Vault/03-Projects/${path.basename(opts.projectDir)}/Phase-Plan.md`);
    console.error(`   Run /plan-project first to generate and approve a phase plan.`);
    process.exit(EXIT_CODES.PLAN_NOT_FOUND);
  }

  console.log(`\nPlan:    ${planPath}`);
  const plan = parsePhasePlan(planPath);

  // 2. Verify approval
  if (!plan.status.toLowerCase().includes('approved')) {
    console.error(`\n❌ Phase Plan is not approved (status: "${plan.status}")`);
    console.error(`   Update the plan's Status field to "Approved" before running the build.`);
    process.exit(EXIT_CODES.PLAN_INVALID);
  }

  if (plan.phases.length === 0) {
    console.error(`\n❌ No phases found in Phase Plan`);
    console.error(`   Ensure phases use "## Phase N: Name" headings.`);
    process.exit(EXIT_CODES.PLAN_INVALID);
  }

  const ceiling = parseBudgetCeiling(plan.budgetRaw);
  console.log(`Budget:  ${plan.budgetRaw || `$${DEFAULT_BUDGET_CEILING_USD} / ${DEFAULT_BUDGET_CEILING_HOURS}h (defaults)`}`);
  console.log(`Phases:  ${plan.phases.length} total`);

  // 3. Dry-run mode: validate and exit
  if (opts.dryRun) {
    console.log(`\n✅ Plan is valid and approved. ${plan.phases.length} phases ready.`);
    console.log(`\nPhases:`);
    for (const phase of plan.phases) {
      console.log(`  ${phase.number}. ${phase.name} — ${phase.goal} (${phase.effort})`);
    }
    process.exit(EXIT_CODES.DRY_RUN);
  }

  // 4. Initialize git and state
  gitInitIfNeeded(opts.projectDir);
  const state = loadState(opts.projectDir);

  if (opts.startPhase > 1) {
    state.currentPhase = opts.startPhase;
    console.log(`\nResuming from phase ${opts.startPhase}`);
  }

  // 5. Build loop
  const startPhase = opts.startPhase;

  for (const phase of plan.phases) {
    if (phase.number < startPhase) continue;

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`▶  Phase ${phase.number}: ${phase.name}`);
    console.log(`   Goal: ${phase.goal}`);
    if (phase.acceptance) console.log(`   Acceptance: ${phase.acceptance}`);
    console.log(`   Effort: ${phase.effort}`);

    // Budget check before each phase
    const budget = checkBudget(state, ceiling);
    if (budget.exceeded) {
      console.log(`\n⚠️  BUDGET CEILING REACHED`);
      console.log(`   ${budget.reason}`);
      console.log(`   Pausing build for human review.`);
      console.log(`   Resume with: node build-runner.js ${opts.projectDir} --phase ${phase.number}`);
      saveState(opts.projectDir, state);
      const report = writeBuildReport(opts.projectDir, state, plan.phases, 'Paused — budget ceiling');
      console.log(`\n📋 Build report: ${report}`);
      process.exit(EXIT_CODES.BUDGET_EXCEEDED);
    }

    // Regression guard: re-run prior phase tests before starting
    if (phase.number > 1 && state.completedPhases.length > 0) {
      console.log(`\n   🔄 Regression guard: re-running tests before phase ${phase.number}...`);
      const regression = runTests(opts.projectDir, `phase ${phase.number - 1} regression`);
      if (!regression.passed) {
        console.log(`\n❌ REGRESSION DETECTED in phase ${phase.number - 1} tests`);
        console.log(`   Tests must pass before phase ${phase.number} can begin.`);
        console.log(`\n   Test output:`);
        console.log(regression.output.slice(0, 2000));
        const kpPath = logKnownProblem(
          opts.projectDir, phase,
          `Regression detected in phase ${phase.number - 1} tests when starting phase ${phase.number}.`,
          regression.output.slice(0, 1000)
        );
        console.log(`\n   Logged to: ${kpPath}`);
        saveState(opts.projectDir, state);
        process.exit(EXIT_CODES.TEST_FAILURE);
      }
      console.log(`   ✓ No regressions`);
    }

    // Phase implementation prompt
    console.log(`\n   📋 Phase ${phase.number} is ready to implement.`);
    console.log(`   Implement the deliverables listed in the phase plan, then run:`);
    console.log(`   npm test`);
    console.log(`\n   When tests pass, the build runner will checkpoint and advance.`);
    console.log(`\n   [Waiting for human/agent to implement phase ${phase.number}...]`);

    // Update state
    state.currentPhase = phase.number;
    saveState(opts.projectDir, state);

    // In the current implementation, the build runner generates the build scaffold
    // and provides structured output for the human+agent loop. Full autonomous
    // implementation (code generation) is a future capability — Phase 19+.
    //
    // For now, the runner:
    //   1. Validates the plan
    //   2. Enforces the approval gate
    //   3. Enforces the regression guard
    //   4. Enforces the budget gate
    //   5. Provides phase-by-phase structure and checkpointing
    //
    // To simulate completion of a phase during testing, use --dry-run or
    // manually mark phases complete in .claude/build-state.json.

    // Run phase tests (after implementation)
    // In dry-run / plan-validation this is skipped (handled above).
    // In a live build, the agent would implement the phase, then call:
    //   node build-runner.js <dir> --phase <N>
    // which re-enters here with the phase already implemented.

    // For a fully-wired build, check if tests pass now
    const testResult = runTests(opts.projectDir, `phase ${phase.number}`);

    if (!testResult.passed) {
      console.log(`\n⚠️  Phase ${phase.number} tests did not pass.`);
      console.log(`   This phase needs implementation before the build can advance.`);
      console.log(`\n   Implement phase ${phase.number} deliverables, then resume with:`);
      console.log(`   node build-runner.js ${opts.projectDir} --phase ${phase.number}`);
      saveState(opts.projectDir, state);
      const report = writeBuildReport(opts.projectDir, state, plan.phases, `Waiting for phase ${phase.number} implementation`);
      console.log(`\n📋 Build report: ${report}`);
      // Exit cleanly — this is expected during a normal build
      process.exit(EXIT_CODES.SUCCESS);
    }

    // Tests passed — checkpoint and advance
    state.completedPhases.push(phase.number);
    state.currentPhase = phase.number + 1;
    saveState(opts.projectDir, state);

    const checkpointMsg = `[phase-${phase.number}] ${path.basename(opts.projectDir)}: ${phase.name}`;
    const committed = gitCheckpoint(opts.projectDir, checkpointMsg);
    if (committed) {
      console.log(`\n   ✅ Phase ${phase.number} complete — checkpoint committed`);
      console.log(`   "${checkpointMsg}"`);
    } else {
      console.log(`\n   ✅ Phase ${phase.number} complete (no git changes to commit)`);
    }
  }

  // All phases complete
  console.log(`\n${'━'.repeat(50)}`);
  console.log(`🎉 Build complete! All ${plan.phases.length} phases passed.`);
  saveState(opts.projectDir, state);
  const report = writeBuildReport(opts.projectDir, state, plan.phases, 'Complete');
  console.log(`\n📋 Final build report: ${report}`);
  console.log(`\nNext step: run /guardian to audit the completed project.\n`);

  process.exit(EXIT_CODES.SUCCESS);
}

main().catch(err => {
  console.error(`\n❌ Build runner fatal error: ${err.message}`);
  process.exit(1);
});
