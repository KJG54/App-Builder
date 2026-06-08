# Vault Index — Start Here

**Last Updated:** 2026-06-07

Welcome to the AI Software Factory Vault. This is the central hub for knowledge about the Application Builder Framework: our decisions, standards, architecture, and roadmap.

---

## Quick Links

🚀 **Status Dashboard** → [[STATUS.md|Current Phase Progress, Recent Work, Blockers]]  
📋 **Project Roadmap** → [[03-Projects/AI Software Factory/Roadmap.md|13-Phase Plan (Complete)]]  
🏗️ **Architecture** → [[03-Projects/AI Software Factory/Architecture/Current.md|System Design v1.0]]  
📚 **Decisions** → [[07-Decisions/DECISIONS.md|All Major ADRs and Architectural Decisions]]  

---

## What's in the Vault?

| Folder | What | Key Files |
|--------|------|-----------|
| **01-Standards** | Governance rules everyone follows | [[01-Standards/README.md\|Standards Navigator]], Coding, Security, Architecture, Documentation |
| **02-Technologies** | Technology reference guides | [[02-Technologies/README.md\|Tech Stack Reference]], Chroma, Docker, FastAPI, PostgreSQL |
| **03-Projects** | Project specs, architecture, roadmap | [[03-Projects/README.md\|Project Structure]], AI Software Factory overview |
| **04-Workflows** | Process choreography for common tasks | [[04-Workflows/README.md\|Workflow Guide]], Build API, Deploy Service, New Project |
| **05-Prompts** | Agent instructions and capabilities | [[05-Prompts/README.md\|Agent Library]], Architect, Backend, Frontend, DevOps prompts |
| **07-Decisions** | Architectural decision records (ADRs) | [[07-Decisions/README.md\|ADR Guide]], 8 decisions with rationale and alternatives |
| **08-Retrospectives** | Session summaries and learnings | [[08-Retrospectives/README.md\|Session Index]], Work completed, decisions made, problems found |
| **09-Requirements** | Project requirements and specs | [[09-Requirements/AI Software Factory/|AI Software Factory Requirements]] |
| **10-Known-Problems** | Issues, bugs, workarounds | [[10-Known-Problems/README.md\|Problem Escalation]], Known limitations and solutions |
| **00-Inbox** | Temporary capture area | [[00-Inbox/README.md\|Inbox Triage]], Work in progress before classification |
| **06-Research** | Exploratory work and investigations | [[06-Research/README.md\|Research Workspace]], Technology spikes, experiments |
| **Templates** | Document templates for consistency | ADR template, Project template, Session template, etc. |

---

## Find Information By Role

### 🏛️ Architect
You design systems, evaluate technologies, and make architectural decisions.

**Start here:**
1. [[03-Projects/AI Software Factory/Architecture/Current.md|Current Architecture v1.0]] — Understand the system design
2. [[01-Standards/Architecture Standards.md|Architecture Standards]] — Your constraints and principles
3. [[07-Decisions/DECISIONS.md|All ADRs]] — Prior decisions that constrain future ones
4. [[05-Prompts/Architect.md|Architect Agent Prompt]] — Your capabilities and authority

**When you need to:**
- Make a technology decision → Start at [[07-Decisions/DECISIONS.md|DECISIONS.md]], check for precedent, create [[07-Decisions/README.md|new ADR]]
- Design a new service → Refer to [[01-Standards/Architecture Standards.md|Architecture Standards]] (modularity, versioning, tech-agnosticism)
- Understand what's been tried → Explore related [[07-Decisions/README.md|ADRs by category]]

---

### 💻 Backend Engineer
You implement APIs, business logic, and databases following architectural decisions.

**Start here:**
1. [[01-Standards/Coding Standards.md|Coding Standards]] — Code organization, naming, testing
2. [[04-Workflows/Build API.md|Build API Workflow]] — How to implement a new endpoint
3. [[07-Decisions/ADR-API-001.md|RESTful API Design (ADR-API-001)]] — API conventions you must follow
4. [[05-Prompts/Backend.md|Backend Agent Prompt]] — Your responsibilities and constraints

**When you need to:**
- Build a new API → Follow [[04-Workflows/Build API.md|Build API Workflow]], conform to [[07-Decisions/ADR-API-001.md|API design standards]]
- Understand authentication → See [[01-Standards/Security Standards.md|Security Standards]]
- Query Chroma for context → See [[02-Technologies/Chroma-Indexing.md|Chroma indexing strategy]]

---

### 🎨 Frontend Engineer
You build user interfaces following design specs and accessibility standards.

**Start here:**
1. [[01-Standards/Coding Standards.md|Coding Standards]] — Code style and testing
2. [[01-Standards/Architecture Standards.md|Architecture Standards]] — Component design, state management
3. [[04-Workflows/Build API.md|Build API Workflow]] — Understand backend API contracts
4. [[05-Prompts/Frontend.md|Frontend Agent Prompt]] — Accessibility and performance requirements

**When you need to:**
- Build a new component → Check [[01-Standards/Architecture Standards.md|Architecture Standards]] for patterns
- Understand the API → See [[07-Decisions/ADR-API-001.md|REST API conventions]]
- Check accessibility → [[01-Standards/Coding Standards.md|Coding Standards]] includes WCAG 2.1 AA requirements

---

### 🚀 DevOps Engineer
You design infrastructure, automate deployments, and ensure reliability.

**Start here:**
1. [[03-Projects/AI Software Factory/Architecture/Current.md|Current Architecture]] — Understand the system topology
2. [[01-Standards/Security Standards.md|Security Standards]] — Secrets, encryption, access control
3. [[04-Workflows/Deploy Service.md|Deploy Service Workflow]] — How to release to environments
4. [[05-Prompts/DevOps.md|DevOps Agent Prompt]] — Your infrastructure responsibilities

**When you need to:**
- Deploy a new service → Follow [[04-Workflows/Deploy Service.md|Deploy workflow]], use [[02-Technologies/Docker.md|Docker standards]]
- Understand infrastructure → See [[07-Decisions/ADR-INFRA-001.md|Infrastructure ADR]]
- Set up monitoring → See [[05-Prompts/DevOps.md|DevOps prompt]] for monitoring/logging patterns

---

### 📊 Product Manager
You manage requirements, roadmap, and stakeholder communication.

**Start here:**
1. [[03-Projects/AI Software Factory/Roadmap.md|Roadmap]] — 8-phase plan, current phase, completion status
2. [[09-Requirements/AI Software Factory/|Requirements]] — Business, functional, non-functional specs
3. [[03-Projects/AI Software Factory/Overview.md|Project Overview]] — Vision and architecture summary
4. [[STATUS.md|Status Dashboard]] — Current work, blockers, priorities

**When you need to:**
- Check what's done → [[STATUS.md|Status dashboard]] or [[Roadmap.md|Roadmap]]
- Understand project scope → [[09-Requirements/AI Software Factory/|Requirements]] + [[03-Projects/AI Software Factory/Overview.md|Overview]]
- Plan next phase → [[03-Projects/AI Software Factory/Roadmap.md|Roadmap]] shows phases 1-8 and current progress

---

### 👀 Code Reviewer
You review code, architecture, and decisions for quality and standards compliance.

**Start here:**
1. [[01-Standards/Coding Standards.md|Coding Standards]] — Code review checklist (12-item)
2. [[01-Standards/Architecture Standards.md|Architecture Standards]] — Architectural review criteria
3. [[07-Decisions/DECISIONS.md|All ADRs]] — Prior decisions this code should align with
4. [[01-Standards/Security Standards.md|Security Standards]] — Security review checklist

**When you need to:**
- Review code → Use [[01-Standards/Coding Standards.md|Coding Standards]] checklist
- Review architecture → Check [[01-Standards/Architecture Standards.md|Architecture Standards]]
- Verify security → Apply [[01-Standards/Security Standards.md|Security Standards]]
- Link to standards → All files have [[07-Decisions/README.md|ADR cross-references]]

---

## How to Find Specific Information

### "Where can I find the current project status?"
→ [[STATUS.md|STATUS.md]] (updated each session) or [[03-Projects/AI Software Factory/Roadmap.md|Roadmap.md]] (canonical source of truth)

### "What's the architecture of the system?"
→ [[03-Projects/AI Software Factory/Architecture/Current.md|Architecture/Current.md]] (versioned, with diagrams)

### "What are the major architectural decisions?"
→ [[07-Decisions/DECISIONS.md|DECISIONS.md]] (master index) or [[07-Decisions/README.md|ADR Guide]] (how to read them)

### "What coding standards do I need to follow?"
→ [[01-Standards/Coding Standards.md|Coding Standards.md]] (language-agnostic patterns with examples)

### "How do I [implement feature / deploy / debug]?"
→ [[04-Workflows/README.md|Workflows Guide]] (lists all available workflows)

### "What APIs are available?"
→ Project-specific API documentation in each service folder, conforms to [[07-Decisions/ADR-API-001.md|ADR-API-001]]

### "What technologies do we use?"
→ [[02-Technologies/README.md|Technologies Reference]] (status of each, why chosen)

### "What problems are known and unsolved?"
→ [[10-Known-Problems/README.md|Known Problems Index]] (with workarounds and status)

### "What did we learn in the last session?"
→ [[08-Retrospectives/README.md|Retrospectives Index]] (linked to phase in Roadmap)

### "How does Chroma indexing work?"
→ [[02-Technologies/Chroma-Indexing.md|Chroma-Indexing.md]] (indexing strategy, metadata schema, retrieval rules)

### "What are the requirements for the AI Software Factory?"
→ [[09-Requirements/README.md|Requirements Management Guide]] (overview) or [[09-Requirements/AI Software Factory/|Project Requirements]] (Business, Functional, Non-Functional)

### "How do I write a new requirement?"
→ [[09-Requirements/README.md|Requirements Management Guide]] (step-by-step process and template link)

---

## Navigation Guides (By Folder)

### Knowledge Organization

```
Quick orientation:
Vault/
├── Standards (01-) ← Start here: governance rules
├── Technologies (02-) ← Then: what we're building with
├── Projects (03-) ← Then: what we're building
├── Workflows (04-) ← Then: how to build it
├── Prompts (05-) ← Then: agent capabilities
├── Decisions (07-) ← Then: why we chose these technologies
└── Everything else (00, 06, 08, 09, 10) ← Reference as needed
```

For detailed navigation of each folder, see:
- [[01-Standards/README.md|Standards Navigator]]
- [[02-Technologies/README.md|Technologies Reference]]
- [[03-Projects/README.md|Projects Structure]]
- [[04-Workflows/README.md|Workflows Guide]]
- [[05-Prompts/README.md|Agent Library]]
- [[07-Decisions/README.md|ADR Guide]]
- [[08-Retrospectives/README.md|Session Index]]
- [[10-Known-Problems/README.md|Problems Index]]

---

## For AI Agents & Chroma Integration

**How Chroma will use this vault** (Phase 5+):

1. **Metadata annotations** — Every document has YAML frontmatter with:
   - `type`: Decision, Standard, Workflow, Prompt, Reference, etc.
   - `authority`: facts (authoritative) or sessions (exploratory)
   - `chroma_collection`: which Chroma collection to index into
   - `tags`: semantic keywords for search
   - `related`: cross-document links

2. **Collection routing** — Based on authority field:
   - `authority: facts` → `global-standards` or `{project}-facts`
   - `authority: sessions` → `{project}-sessions`

3. **Discovery path** — Agents use this vault to:
   - Find architectural constraints (standards + ADRs)
   - Understand prior decisions (DECISIONS.md)
   - Locate workflows for common tasks (04-Workflows)
   - Get agent instructions (05-Prompts)
   - Understand project scope (03-Projects)

All metadata is already embedded in documents; Phase 5 Chroma ingestion has no judgment calls.

**See:** [[02-Technologies/Chroma-Indexing.md|Chroma Indexing Strategy]]

---

## Vault Philosophy

This vault operates on **Knowledge-First Pipeline** principles ([[07-Decisions/ADR-ARCH-001.md|ADR-ARCH-001]]):

- **Facts are separated from sessions** ([[07-Decisions/ADR-DATA-001.md|ADR-DATA-001]]) — Approved decisions are authoritative; work logs are exploratory context
- **Every decision is recorded with rationale** — Why we chose something, not just what we chose
- **Standards enforce governance** — All code, architecture, documentation, and security decisions follow documented standards
- **Humans retain authority** ([[07-Decisions/ADR-SEC-001.md|ADR-SEC-001]]) — Approval gates ensure AI agents escalate when needed
- **Everything is discoverable** — Cross-links, tags, and metadata enable semantic search and context assembly

---

## Getting Started (First Time?)

**5-minute orientation:**
1. Open [[STATUS.md|STATUS.md]] → See what's currently happening
2. Open [[03-Projects/AI Software Factory/Roadmap.md|Roadmap.md]] → Understand phases and progress
3. Pick your role above → Follow the "Start here" links for your role
4. Bookmark this page → You'll come back to it

**First task?**
1. Find what you need above → Use role-based sections or "Find Information" guide
2. Navigate to relevant file → Click link or use Obsidian search
3. Check related documents → Most files link to related standards/ADRs/workflows
4. Stuck? → Check [[00-Inbox/README.md|Inbox README]] or ask in [[08-Retrospectives/README.md|session notes]]

---

**Questions?** Check the folder README for each section (links above), or see [[07-Decisions/README.md|ADR Guide]] for how decisions are made.

**Want to add something?** See relevant folder README for templates and processes.

---

*This vault is the source of truth for Application Builder Framework knowledge. It's maintained collaboratively and versioned in Git.*
