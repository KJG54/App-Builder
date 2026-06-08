/**
 * Problem Manager
 *
 * Purpose: Create and manage known problem records in Vault
 * Part of Phase 11: Known Problems Knowledge Base
 *
 * Usage:
 *   const manager = new ProblemManager();
 *   const problemId = manager.createProblem(extractedIssue);
 *   manager.resolveProblem(problemId, fixDescription);
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProblemManager {
  constructor(vaultDir = null) {
    if (!vaultDir) {
      vaultDir = path.resolve(__dirname, '..', '..', 'Vault', '10-Known-Problems');
    }
    this.vaultDir = vaultDir;
    this.ensureDirectory();
  }

  /**
   * Create new problem from extracted issue
   * @param {Object} extractedIssue - Issue from ProblemExtractor
   * @returns {Object} Created problem record
   */
  createProblem(extractedIssue) {
    const problemId = this.generateProblemId(extractedIssue);
    const category = extractedIssue.category || 'unknown';
    const briefName = this.slugify(extractedIssue.message.substring(0, 50));
    const fileName = `Problem-${category}-${briefName}.md`;
    const filePath = path.join(this.vaultDir, fileName);

    // Build YAML frontmatter
    const frontmatter = `---
type: KnownProblem
status: Open
severity: ${extractedIssue.calculated_severity || 'Medium'}
category: ${category}
authority: sessions
chroma_collection: ai-software-factory-known-problems
tags: [${category}, issue, recurring]
related: []
discovered: ${new Date().toISOString().split('T')[0]}
last_updated: ${new Date().toISOString().split('T')[0]}
---

# ${category} — ${extractedIssue.message}

**Status:** Open
**Severity:** ${extractedIssue.calculated_severity || 'Medium'}
**Occurrences:** ${extractedIssue.occurrences}
**Affected Agents:** ${extractedIssue.agents_affected.join(', ')}
**Discovered:** ${new Date().toISOString().split('T')[0]}
**Last Updated:** ${new Date().toISOString().split('T')[0]}

---

## Problem Description

${extractedIssue.message}

This issue has occurred ${extractedIssue.occurrences} times across ${extractedIssue.agents_affected.length} agent(s).

---

## Symptoms

- Issue detected in verification: ${extractedIssue.id}
- Compliance impact: Average score reduced by ${(100 - extractedIssue.avg_compliance_impact).toFixed(1)}%
- Affects agents: ${extractedIssue.agents_affected.join(', ')}

---

## Root Cause

[To be determined. Investigate when implementing permanent fix.]

---

## Impact

- **Frequency:** ${extractedIssue.occurrences} occurrences (high)
- **Affected Teams:** ${extractedIssue.agents_affected.join(', ')}
- **Quality Loss:** ${(100 - extractedIssue.avg_compliance_impact).toFixed(1)}% compliance reduction

---

## Workaround

[To be documented when temporary fix is identified.]

**Steps:**
1. [Placeholder for workaround step 1]
2. [Placeholder for workaround step 2]

**Limitations:** [What the workaround doesn't solve]

---

## Permanent Fix

[To be proposed via ADR when permanent solution is available.]

**Related ADR:** [Link to ADR when created]

---

## Links

- Related problems: []
- Related decisions: []
- Discovered in session: [[../08-Retrospectives/|Session Summary]]
- Observability evidence: Review IDs with this issue

---

**Created:** ${new Date().toISOString().split('T')[0]}
**Last Updated:** ${new Date().toISOString().split('T')[0]}
`;

    // Write file
    fs.writeFileSync(filePath, frontmatter, 'utf8');

    console.log(`✅ Created problem: ${fileName}`);

    return {
      problemId: problemId,
      fileName: fileName,
      filePath: filePath,
      status: 'created',
      severity: extractedIssue.calculated_severity || 'Medium',
    };
  }

  /**
   * Update problem with additional info
   * @param {string} problemFileName - Problem file name
   * @param {Object} updates - Fields to update
   * @returns {Object} Update result
   */
  updateProblem(problemFileName, updates) {
    const filePath = path.join(this.vaultDir, problemFileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Problem file not found: ${problemFileName}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Parse YAML frontmatter
    const parts = content.split('---');
    if (parts.length < 3) {
      throw new Error(`Invalid problem file format: ${problemFileName}`);
    }

    const yamlLines = parts[1].split('\n');
    let yamlContent = '';

    // Update YAML fields
    yamlLines.forEach(line => {
      const [key] = line.split(':');

      if (updates[key]) {
        yamlContent += `${key}: ${updates[key]}\n`;
      } else if (line.trim()) {
        yamlContent += line + '\n';
      }
    });

    // Update last_updated
    yamlContent = yamlContent.replace(/last_updated:.*/, `last_updated: ${new Date().toISOString().split('T')[0]}`);

    const updatedContent = `---\n${yamlContent}---\n${parts.slice(2).join('---')}`;

    fs.writeFileSync(filePath, updatedContent, 'utf8');

    console.log(`✅ Updated problem: ${problemFileName}`);

    return {
      fileName: problemFileName,
      updated_fields: Object.keys(updates),
      status: 'updated',
    };
  }

  /**
   * Link problem to ADR (permanent fix)
   * @param {string} problemFileName - Problem file name
   * @param {string} adrPath - Path to ADR (relative to Vault)
   * @returns {Object} Link result
   */
  linkToADR(problemFileName, adrPath) {
    const filePath = path.join(this.vaultDir, problemFileName);
    let content = fs.readFileSync(filePath, 'utf8');

    // Add ADR link to "Permanent Fix" section
    const section = '## Permanent Fix';
    const replacement = `## Permanent Fix

**Related ADR:** [[${adrPath}|View ADR]]`;

    content = content.replace(section, replacement);

    // Update related field in YAML
    content = content.replace(/related: \[\]/, `related: [${adrPath}]`);

    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`✅ Linked ${problemFileName} to ${adrPath}`);

    return {
      fileName: problemFileName,
      adr_path: adrPath,
      status: 'linked',
    };
  }

  /**
   * Mark problem as resolved
   * @param {string} problemFileName - Problem file name
   * @param {string} fixDescription - Description of fix
   * @returns {Object} Resolution result
   */
  resolveProblem(problemFileName, fixDescription) {
    const filePath = path.join(this.vaultDir, problemFileName);
    let content = fs.readFileSync(filePath, 'utf8');

    // Update status in YAML
    content = content.replace(/status: .+/, 'status: Resolved');

    // Update status in content
    content = content.replace(/\*\*Status:\*\*.+/, `**Status:** Resolved`);

    // Add resolution note
    const section = '---\n\n**Created:**';
    const replacement = `---

## Resolution

${fixDescription}

**Resolved:** ${new Date().toISOString().split('T')[0]}

**Created:**`;

    content = content.replace(section, replacement);

    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`✅ Resolved problem: ${problemFileName}`);

    return {
      fileName: problemFileName,
      status: 'resolved',
      resolved_date: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Get problems by filters
   * @param {string} category - Optional category filter
   * @param {string} status - Optional status filter (Open, Resolved, Workaround, Design Constraint)
   * @param {string} severity - Optional severity filter
   * @returns {Array} Filtered problem records
   */
  getProblems(category = null, status = null, severity = null) {
    const files = fs.readdirSync(this.vaultDir)
      .filter(f => f.startsWith('Problem-') && f.endsWith('.md'));

    return files.map(f => {
      try {
        const content = fs.readFileSync(path.join(this.vaultDir, f), 'utf8');
        const problemData = this.parseProblemFile(content, f);

        // Apply filters
        if (category && problemData.category !== category) return null;
        if (status && problemData.status !== status) return null;
        if (severity && problemData.severity !== severity) return null;

        return problemData;
      } catch (error) {
        return null;
      }
    }).filter(p => p !== null);
  }

  /**
   * Get problems affecting specific agent
   * @param {string} agentRole - Agent role
   * @returns {Array} Problems affecting agent
   */
  getProblemsForAgent(agentRole) {
    const allProblems = this.getProblems();

    return allProblems.filter(p => {
      const content = fs.readFileSync(p.filePath, 'utf8');
      return content.includes(`**Affected Agents:** ${agentRole}`) || content.includes(`, ${agentRole}`);
    });
  }

  /**
   * Parse problem file
   * @private
   */
  parseProblemFile(content, fileName) {
    const parts = content.split('---');
    const yaml = parts[1];

    const extract = (pattern) => {
      const match = yaml.match(pattern);
      return match ? match[1].trim() : null;
    };

    return {
      fileName: fileName,
      filePath: path.join(this.vaultDir, fileName),
      category: extract(/category:\s*(.+)/),
      status: extract(/status:\s*(.+)/),
      severity: extract(/severity:\s*(.+)/),
      discovered: extract(/discovered:\s*(.+)/),
    };
  }

  /**
   * Generate problem ID
   * @private
   */
  generateProblemId() {
    return `problem-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  }

  /**
   * Slugify text for filename
   * @private
   */
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
  }

  /**
   * Ensure directory exists
   * @private
   */
  ensureDirectory() {
    if (!fs.existsSync(this.vaultDir)) {
      fs.mkdirSync(this.vaultDir, { recursive: true });
    }
  }
}

module.exports = ProblemManager;
