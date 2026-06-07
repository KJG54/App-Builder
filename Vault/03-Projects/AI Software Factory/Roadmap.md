# AI Software Factory — Roadmap

Last Updated: 2026-06-07

## Phase Status

| Phase | Name | Status |
|---|---|---|
| 1 | Foundation | In Progress |
| 2 | Knowledge System | Not Started |
| 3 | Requirements Management | Not Started |
| 4 | Fact vs Session Separation | Not Started |
| 5 | Chroma Integration | Not Started |
| 6 | Context Builder | Not Started |
| 7 | Skills System | Not Started |
| 8 | Verification Layer | Not Started |
| 9 | Prompt Versioning + Performance Tracking | Not Started |
| 10 | Review Pipeline + Observability | Not Started |
| 11 | Known Problems KB | Not Started |
| 12 | Advanced MCP Integration | Not Started |
| 13 | Multi-Agent Collaboration | Not Started |

## Next Actions

### Phase 1 Foundation (In Progress)
- [x] Configure VS Code workspace and extensions ([[../../../.vscode/extensions.json|config]], [[../../../.vscode/settings.json|settings]])
- [ ] Initialize Git branching strategy (see [[../../../WORKFLOW.md|WORKFLOW.md]]; rename master → main pending)
- [x] Stand up Docker Compose environment ([[../../../docker-compose.yml|docker-compose.yml]], [[../../../docker|Dockerfile templates]])
- [x] Create infrastructure ADR ([[ADR-INFRA-001.md|ADR-INFRA-001]])

### Phase 2 Knowledge System
- [ ] Write first categorized ADRs (use [[ADR-INFRA-001.md|ADR-INFRA-001]] as template)
- [ ] Write standards documents (coding, security, documentation)
- [ ] Create prompt library structure in [[../../05-Prompts|05-Prompts/]]

### Phase 3+ 
- [ ] Define initial requirements
- [ ] Chroma persistence and schema management
- [ ] MCP server integrations

## Related

- [[Overview]]
- [[Architecture/Current]]
- [[08-Retrospectives/Session-Summary-2026-06-07]]
