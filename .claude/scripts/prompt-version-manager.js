/**
 * Prompt Version Manager
 *
 * Purpose: Track and manage prompt versions
 * Part of Phase 9: Prompt Versioning + Performance Tracking
 *
 * Usage:
 *   const manager = new PromptVersionManager();
 *   manager.createVersion('architect', 'Improved clarity');
 *   manager.promoteVersion('architect', 'v1.1.0');
 *   manager.compareVersions('architect', 'v1.0.0', 'v1.1.0');
 */

const fs = require('fs');
const path = require('path');

class PromptVersionManager {
  constructor(vaultDir = null) {
    if (!vaultDir) {
      // __dirname is .claude/scripts
      // Vault is in ../../Vault/05-Prompts from scripts (use resolve for absolute path)
      vaultDir = path.resolve(__dirname, '..', '..', 'Vault', '05-Prompts');
    }
    this.vaultDir = vaultDir;
  }

  /**
   * Create a new prompt version
   * @param {string} role - Agent role (architect, backend, frontend, devops)
   * @param {string} changes - Description of changes
   * @param {string} strategy - Version strategy: "patch", "minor", or "major"
   * @returns {Object} New version info
   */
  createVersion(role, changes, strategy = 'minor') {
    // Get current active version
    const history = this.getVersionHistory(role);
    const currentVersion = history.find(v => v.status === 'active');

    if (!currentVersion) {
      throw new Error(`No active version found for ${role}`);
    }

    // Calculate new version
    const newVersion = this.incrementVersion(currentVersion.version, strategy);
    console.log(`Creating ${role} ${newVersion} (${strategy})`);

    // Read current prompt
    const currentPromptPath = path.join(this.vaultDir, `${role}.md`);
    const promptContent = fs.readFileSync(currentPromptPath, 'utf8');

    // Create version directory
    const versionDir = path.join(this.vaultDir, `${role}-versions`);
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }

    // Save versioned prompt
    const versionedPath = path.join(versionDir, `${role}-${newVersion}.md`);
    fs.writeFileSync(versionedPath, promptContent, 'utf8');

    // Update version history
    const newHistoryEntry = {
      version: newVersion,
      created_date: new Date().toISOString().split('T')[0],
      status: 'testing',
      changes: changes,
    };

    this.updateVersionHistory(role, newHistoryEntry);

    return {
      version: newVersion,
      status: 'testing',
      created_date: newHistoryEntry.created_date,
      changes: changes,
    };
  }

  /**
   * Promote a version to active status
   * @param {string} role - Agent role
   * @param {string} version - Version to promote (e.g., "v1.1.0")
   */
  promoteVersion(role, version) {
    const history = this.getVersionHistory(role);
    const activeVersion = history.find(v => v.status === 'active');

    // Update version history
    const updatedHistory = history.map(v => {
      if (v.version === version) {
        return { ...v, status: 'active' };
      } else if (v.status === 'active') {
        return { ...v, status: 'archived' };
      }
      return v;
    });

    this.saveVersionHistory(role, updatedHistory);

    // Update main prompt file to reflect active version
    const versionedPath = path.join(this.vaultDir, `${role}-versions`, `${role}-${version}.md`);
    const mainPromptPath = path.join(this.vaultDir, `${role}.md`);

    const promptContent = fs.readFileSync(versionedPath, 'utf8');
    fs.writeFileSync(mainPromptPath, promptContent, 'utf8');

    console.log(`✅ Promoted ${role}-${version} to active`);
    if (activeVersion) {
      console.log(`📦 Archived ${role}-${activeVersion.version}`);
    }
  }

  /**
   * Compare two versions
   * @param {string} role - Agent role
   * @param {string} version1 - First version
   * @param {string} version2 - Second version
   * @returns {Object} Comparison report
   */
  compareVersions(role, version1, version2) {
    const path1 = path.join(this.vaultDir, `${role}-versions`, `${role}-${version1}.md`);
    const path2 = path.join(this.vaultDir, `${role}-versions`, `${role}-${version2}.md`);

    if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
      throw new Error(`Version file not found`);
    }

    const content1 = fs.readFileSync(path1, 'utf8');
    const content2 = fs.readFileSync(path2, 'utf8');

    // Simple diff: count lines that changed
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const changedLines = this.countDifferentLines(lines1, lines2);
    const similarity = ((1 - changedLines / Math.max(lines1.length, lines2.length)) * 100).toFixed(1);

    // Extract key sections
    const capabilities1 = this.extractSection(content1, '## Capabilities');
    const capabilities2 = this.extractSection(content2, '## Capabilities');

    return {
      version1: version1,
      version2: version2,
      total_lines_v1: lines1.length,
      total_lines_v2: lines2.length,
      changed_lines: changedLines,
      similarity_percent: similarity,
      summary: `${version2} differs from ${version1} in ${changedLines} lines (${similarity}% similarity)`,
    };
  }

  /**
   * List all versions for a role
   * @param {string} role - Agent role
   * @returns {Array} List of versions with metadata
   */
  listVersions(role) {
    return this.getVersionHistory(role);
  }

  /**
   * Get the active version for a role
   * @param {string} role - Agent role
   * @returns {Object} Active version info
   */
  getActiveVersion(role) {
    const history = this.getVersionHistory(role);
    return history.find(v => v.status === 'active');
  }

  /**
   * Get version history
   * @private
   */
  getVersionHistory(role) {
    const historyPath = path.join(this.vaultDir, `${role}-versions.json`);

    if (!fs.existsSync(historyPath)) {
      // Initialize with v1.0.0
      const initialHistory = [
        {
          version: 'v1.0.0',
          created_date: new Date().toISOString().split('T')[0],
          status: 'active',
          changes: 'Initial version',
        },
      ];
      this.saveVersionHistory(role, initialHistory);
      return initialHistory;
    }

    try {
      return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (error) {
      console.error(`Error reading version history for ${role}:`, error.message);
      return [];
    }
  }

  /**
   * Save version history
   * @private
   */
  saveVersionHistory(role, history) {
    const historyPath = path.join(this.vaultDir, `${role}-versions.json`);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
  }

  /**
   * Update version history (add new entry)
   * @private
   */
  updateVersionHistory(role, newEntry) {
    const history = this.getVersionHistory(role);
    history.push(newEntry);
    this.saveVersionHistory(role, history);
  }

  /**
   * Increment version number
   * @private
   */
  incrementVersion(currentVersion, strategy) {
    // Parse version: "v1.0.0"
    const match = currentVersion.match(/^v(\d+)\.(\d+)\.(\d+)$/);
    if (!match) {
      throw new Error(`Invalid version format: ${currentVersion}`);
    }

    let [, major, minor, patch] = match.map(Number);

    switch (strategy) {
      case 'patch':
        patch++;
        break;
      case 'minor':
        minor++;
        patch = 0;
        break;
      case 'major':
        major++;
        minor = 0;
        patch = 0;
        break;
      default:
        throw new Error(`Invalid strategy: ${strategy}`);
    }

    return `v${major}.${minor}.${patch}`;
  }

  /**
   * Count different lines between two arrays
   * @private
   */
  countDifferentLines(lines1, lines2) {
    const maxLen = Math.max(lines1.length, lines2.length);
    let different = 0;

    for (let i = 0; i < maxLen; i++) {
      if ((lines1[i] || '') !== (lines2[i] || '')) {
        different++;
      }
    }

    return different;
  }

  /**
   * Extract a section from prompt text
   * @private
   */
  extractSection(content, sectionHeader) {
    const lines = content.split('\n');
    const startIdx = lines.findIndex(l => l.includes(sectionHeader));

    if (startIdx === -1) return null;

    const endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith('##'));
    const endLine = endIdx === -1 ? lines.length : endIdx;

    return lines.slice(startIdx, endLine).join('\n').substring(0, 200);
  }

  /**
   * Get summary of all versions
   */
  getSummary() {
    const roles = ['architect', 'backend', 'frontend', 'devops'];
    const summary = {};

    for (const role of roles) {
      const history = this.getVersionHistory(role);
      const active = history.find(v => v.status === 'active');
      summary[role] = {
        active_version: active?.version,
        total_versions: history.length,
        versions: history,
      };
    }

    return summary;
  }
}

/**
 * Example usage (for testing)
 */
if (require.main === module) {
  const manager = new PromptVersionManager();

  // Get version info
  const activeArchitect = manager.getActiveVersion('architect');
  console.log('Active Architect version:', activeArchitect);

  // List versions
  const allVersions = manager.listVersions('architect');
  console.log('\nAll Architect versions:');
  console.log(JSON.stringify(allVersions, null, 2));

  // Get summary
  const summary = manager.getSummary();
  console.log('\nVersion Summary:');
  console.log(JSON.stringify(summary, null, 2));
}

module.exports = PromptVersionManager;
