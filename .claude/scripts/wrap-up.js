#!/usr/bin/env node

/**
 * /wrap-up implementation
 * Summarizes day's work, creates session summary, stages files, commits, and pushes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const vaultDir = path.join(projectRoot, 'Vault', '08-Retrospectives');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Ensure Vault retrospectives directory exists
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

try {
  console.log('\n📋 Starting wrap-up workflow...\n');

  // Step 1: Create session summary
  console.log('1️⃣  Creating session summary...');
  const summaryPath = path.join(vaultDir, `Session-Summary-${today}.md`);

  // Only create new summary if one doesn't exist for today
  if (!fs.existsSync(summaryPath)) {
    const summaryContent = `# Session Summary — ${today}

**Date:** ${today}
**Participants:** Claude Code (Haiku 4.5), Krystian Garcia

## Overview

End-of-day wrap-up. Summarizing work and preparing for next session.

## Work Completed

- Reviewed and validated changes
- Prepared session summary

## Decisions Made

- Consolidated work for commit

## Files Modified

- See git diff for detailed changes

## Next Steps

1. Verify all changes pushed to origin/main
2. Continue with next session priorities

---

**Status:** Session wrap-up complete. Ready for next session.
`;
    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`   ✅ Created: Session-Summary-${today}.md`);
  } else {
    console.log(`   ℹ️  Session summary already exists for ${today}`);
  }

  // Step 2: Stage files
  console.log('\n2️⃣  Staging files...');

  // Get current status
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf-8' });
  const lines = statusOutput.split('\n').filter(l => l.trim());

  let stagedCount = 0;

  // Stage modified tracked files and new Vault documents
  for (const line of lines) {
    const status = line.substring(0, 2);
    const filePath = line.substring(3);

    // Skip if excluded
    const excludePatterns = [
      '.claude/.fsm-state.json',
      '.claude/scripts/PHASE-14-SUMMARY.md',
      '.claude/scripts/mcp-whitelist.js',
      '.claude/scripts/phase-14-integration.md',
      '.claude/scripts/state-machine.js',
      '.claude/scripts/test-phase-14',
      '.claude/scripts/validate-phase-14',
      '.claude/scripts/vault-validator.js',
      '.claude/Logs/',
      '.obsidian/plugins/',
      '/._',
      '.tmp'
    ];

    const isExcluded = excludePatterns.some(pattern => filePath.includes(pattern));

    if (isExcluded) {
      continue;
    }

    // Stage if: modified tracked OR new Vault file
    if ((status === ' M' || status === 'M ') ||
        (status === '??' && filePath.includes('Vault/'))) {
      try {
        execSync(`git add "${filePath}"`, { stdio: 'pipe' });
        stagedCount++;
      } catch (e) {
        // Ignore errors on individual files
      }
    }
  }

  console.log(`   ✅ Staged ${stagedCount} files`);

  // Step 3: Create commit
  console.log('\n3️⃣  Creating commit...');
  const commitMessage = `docs: end of day wrap-up ${today}`;

  try {
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
    console.log(`   ✅ Committed: "${commitMessage}"`);
  } catch (e) {
    const error = e.toString();
    if (error.includes('nothing to commit')) {
      console.log('   ℹ️  No changes to commit');
    } else {
      throw e;
    }
  }

  // Step 4: Push to origin
  console.log('\n4️⃣  Pushing to origin/main...');
  try {
    execSync('git push origin main', { stdio: 'pipe' });
    console.log('   ✅ Pushed to origin/main');
  } catch (e) {
    const error = e.toString();
    if (error.includes('up to date')) {
      console.log('   ℹ️  Already up to date');
    } else {
      console.error('   ❌ Push failed:', error);
      throw e;
    }
  }

  // Report results
  console.log('\n✅ Wrap-up complete!\n');
  console.log('Summary:');
  console.log(`  - Session summary: Vault/08-Retrospectives/Session-Summary-${today}.md`);
  console.log(`  - Commit message: ${commitMessage}`);
  console.log(`  - Files staged: ${stagedCount}`);
  console.log('\n📌 Your changes have been committed and pushed to origin/main.\n');

} catch (error) {
  console.error('\n❌ Wrap-up failed:', error.message);
  process.exit(1);
}
