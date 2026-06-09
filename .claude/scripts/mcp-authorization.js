/**
 * MCP Authorization Enforcer
 * Implements the agent-to-tool access matrix from ADR-INT-001
 * Enforces approval tiers based on operation risk
 * Integrates with Phase 14 command whitelisting
 */

const { MCPWhitelister } = require('./mcp-whitelist');

class MCPAuthorization {
  constructor() {
    // Phase 14: Initialize whitelister
    this.whitelister = new MCPWhitelister(process.cwd());
    // Define the authorization matrix from ADR-INT-001
    // Format: agent -> server -> { tools: { tool: tier } }
    this.matrix = {
      architect: {
        github: {
          tools: {
            search_repositories: 1,
            search_code: 1,
            get_repository: 1,
          },
        },
        chroma: {
          tools: {
            query_documents: 1,
            list_collections: 1,
          },
        },
        filesystem: {
          tools: {
            read_file: 1,
            list_directory: 1,
          },
        },
      },

      backend: {
        github: {
          tools: {
            search_code: 1,
            get_file_contents: 1,
            create_pull_request: 2,
            push_branch: 2,
            get_pull_request: 1,
          },
        },
        chroma: {
          tools: {
            query_documents: 1,
          },
        },
        filesystem: {
          tools: {
            read_file: 1,
            list_directory: 1,
            write_file: 2,
          },
        },
      },

      frontend: {
        github: {
          tools: {
            search_code: 1,
            get_file_contents: 1,
            create_pull_request: 2,
            push_branch: 2,
            get_pull_request: 1,
          },
        },
        chroma: {
          tools: {
            query_documents: 1,
          },
        },
        filesystem: {
          tools: {
            read_file: 1,
            list_directory: 1,
            write_file: 2,
          },
        },
      },

      security: {
        github: {
          tools: {
            search_repositories: 1,
            search_code: 1,
            get_file_contents: 1,
          },
        },
        chroma: {
          tools: {
            query_documents: 1,
          },
        },
      },

      devops: {
        github: {
          tools: {
            search_repositories: 1,
            get_repository: 1,
            merge_pull_request: 3,
            get_pull_request: 1,
          },
        },
        filesystem: {
          tools: {
            read_file: 1,
            write_file: 2,
            list_directory: 1,
          },
        },
      },

      qa: {
        github: {
          tools: {
            search_code: 1,
            get_file_contents: 1,
          },
        },
        chroma: {
          tools: {
            query_documents: 1,
          },
        },
        filesystem: {
          tools: {
            read_file: 1,
            list_directory: 1,
          },
        },
      },

      documentation: {
        github: {
          tools: {
            search_repositories: 1,
            get_file_contents: 1,
          },
        },
        chroma: {
          tools: {
            query_documents: 1,
          },
        },
        filesystem: {
          tools: {
            read_file: 1,
            list_directory: 1,
          },
        },
      },

      orchestrator: {
        filesystem: {
          tools: {
            read_file: 1,
            list_directory: 1,
          },
        },
      },
    };

    // Tier definitions (matching ADR-SEC-001)
    this.tiers = {
      1: {
        name: 'Allowed - Auto-approve',
        description: 'Read-only or low-risk operations',
        requires_approval: false,
      },
      2: {
        name: 'Code Review Required',
        description: 'Code-modifying operations',
        requires_approval: true,
        deadline_hours: 24,
      },
      3: {
        name: 'Human Approval Required',
        description: 'Infrastructure or high-risk operations',
        requires_approval: true,
        deadline_hours: 72,
      },
      4: {
        name: 'Human-Only Decision',
        description: 'Irreversible operations - blocked, human decides',
        requires_approval: 'mandatory_human_only',
      },
      5: {
        name: 'Blocked',
        description: 'Forbidden operation',
        requires_approval: 'blocked',
      },
    };
  }

  /**
   * Phase 14: Check if a terminal command is safe to execute
   * @param {string} command - Command string to validate
   * @param {object} context - { agent, task }
   * @returns {object} { allowed, reason, requires_approval, dangerous }
   */
  checkCommand(command, context = {}) {
    const validation = this.whitelister.validateCommand(command, context);

    if (!validation.allowed && validation.dangerous) {
      // Dangerous pattern: warn user
      console.warn(`\n⚠️  DANGEROUS COMMAND DETECTED`);
      console.warn(`Command: ${command}`);
      console.warn(`Reason: ${validation.reason}`);
      console.warn(`\nAction: Requires explicit user approval`);
    }

    this.whitelister.logCommand(command, validation, context);
    return validation;
  }

  /**
   * Check authorization for an agent to use a tool
   * @param {string} agentRole - Agent role (e.g., 'backend', 'devops')
   * @param {string} server - MCP server (e.g., 'github', 'filesystem')
   * @param {string} tool - Tool name (e.g., 'create_pull_request')
   * @returns {object} { allowed: bool, tier: 1-5, reason: string }
   */
  checkAuthorization(agentRole, server, tool) {
    // Validate agent exists
    if (!this.matrix[agentRole]) {
      return {
        allowed: false,
        tier: 5,
        reason: `Unknown agent role: ${agentRole}`,
        action: 'blocked',
      };
    }

    // Validate server exists for agent
    if (!this.matrix[agentRole][server]) {
      return {
        allowed: false,
        tier: 5,
        reason: `Agent ${agentRole} is not authorized to use server ${server}`,
        action: 'blocked',
      };
    }

    // Validate tool exists for agent+server
    const tools = this.matrix[agentRole][server].tools;
    if (!tools[tool]) {
      return {
        allowed: false,
        tier: 5,
        reason: `Agent ${agentRole} is not authorized to use tool ${server}:${tool}`,
        action: 'blocked',
      };
    }

    // Get the tier
    const tier = tools[tool];
    const tierInfo = this.tiers[tier];

    return {
      allowed: tier <= 2, // Tiers 1-2 can proceed (Tier 2 requires review during pipeline)
      tier,
      name: tierInfo.name,
      description: tierInfo.description,
      requires_approval: tierInfo.requires_approval,
      deadline_hours: tierInfo.deadline_hours,
      reason: `Authorized at Tier ${tier}: ${tierInfo.description}`,
      action: tier === 1 ? 'allow' : tier === 2 ? 'require-review' : 'escalate',
    };
  }

  /**
   * Check if an agent role is valid (exists in authorization matrix)
   * @param {string} agentRole - Agent role to validate
   * @returns {boolean} true if agent exists in matrix
   */
  isValidAgent(agentRole) {
    return !!this.matrix[agentRole];
  }

  /**
   * Get all authorized tools for an agent on a server
   * Useful for documentation and agent discovery
   */
  getAuthorizedTools(agentRole, server = null) {
    if (!this.matrix[agentRole]) {
      return null;
    }

    const result = {};

    if (server) {
      // Single server
      if (!this.matrix[agentRole][server]) {
        return {};
      }
      const tools = this.matrix[agentRole][server].tools;
      for (const [toolName, tier] of Object.entries(tools)) {
        result[toolName] = { tier, ...this.tiers[tier] };
      }
      return result;
    } else {
      // All servers for agent
      for (const [srv, config] of Object.entries(this.matrix[agentRole])) {
        result[srv] = {};
        for (const [toolName, tier] of Object.entries(config.tools)) {
          result[srv][toolName] = { tier, ...this.tiers[tier] };
        }
      }
      return result;
    }
  }

  /**
   * Get the entire authorization matrix (useful for documentation)
   */
  getMatrix() {
    return JSON.parse(JSON.stringify(this.matrix));
  }

  /**
   * Get all agents authorized to use a tool
   * Reverse lookup: who can call this tool?
   */
  getAgentsForTool(server, tool) {
    const agents = [];

    for (const [agentRole, serverConfig] of Object.entries(this.matrix)) {
      if (serverConfig[server] && serverConfig[server].tools[tool]) {
        const tier = serverConfig[server].tools[tool];
        agents.push({
          agent: agentRole,
          tier,
          tier_info: this.tiers[tier],
        });
      }
    }

    return agents;
  }

  /**
   * Check if a tool exists in any agent's authorization
   */
  toolExists(server, tool) {
    for (const serverConfig of Object.values(this.matrix)) {
      if (serverConfig[server] && serverConfig[server].tools[tool]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Validate the entire matrix for consistency
   * Returns { valid: bool, errors: [] }
   */
  validate() {
    const errors = [];

    for (const [agentRole, servers] of Object.entries(this.matrix)) {
      for (const [server, config] of Object.entries(servers)) {
        for (const [tool, tier] of Object.entries(config.tools)) {
          if (!this.tiers[tier]) {
            errors.push(
              `Invalid tier ${tier} for ${agentRole}:${server}:${tool}`
            );
          }
          if (tier < 1 || tier > 5) {
            errors.push(
              `Tier out of range (1-5) for ${agentRole}:${server}:${tool}`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      agent_count: Object.keys(this.matrix).length,
      server_count: new Set(
        Object.values(this.matrix).flatMap(s => Object.keys(s))
      ).size,
      tool_count: Object.values(this.matrix)
        .flatMap(s => Object.values(s))
        .reduce((sum, c) => sum + Object.keys(c.tools).length, 0),
    };
  }
}

module.exports = MCPAuthorization;
