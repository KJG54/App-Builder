---
type: Standard
phase: global
status: Active
authority: facts
chroma_collection: global-standards
tags: [security, authentication, secrets, standards]
related: [ADR-SEC-001, All Agent Prompts]
last_updated: 2026-06-07
---

# Security Standards

**Status:** Active  
**Phase Enforcement Begins:** Phase 2  
**Last Updated:** 2026-06-07

---

## Overview

Security standards establish minimum acceptable practices for protecting data, preventing unauthorized access, and ensuring compliance with organizational policies. All code, infrastructure, and deployment must comply with these standards. Violations are not acceptable for production systems.

---

## 1. Secrets Management

### Rule: No secrets in source code or Git history

Secrets include: passwords, API keys, database credentials, private encryption keys, auth tokens, OAuth client secrets, and any value that grants unauthorized access.

### Compliance Example

**Correct approach — environment variables:**
```python
# config.py (safe to commit)
import os
db_password = os.getenv('DB_PASSWORD')
api_key = os.getenv('OPENAI_API_KEY')
secret_key = os.getenv('JWT_SECRET_KEY')

if not all([db_password, api_key, secret_key]):
    raise ValueError("Required secrets not configured in environment")
```

**.env file (NEVER committed):**
```
DB_PASSWORD=my_secure_password_123
OPENAI_API_KEY=sk-...
JWT_SECRET_KEY=my_jwt_secret
```

**.env.example (safe to commit — shows structure only):**
```
DB_PASSWORD=your_password_here
OPENAI_API_KEY=your_api_key_here
JWT_SECRET_KEY=your_jwt_secret_here
```

### Violation Example

**❌ WRONG — hardcoded secrets:**
```python
# NEVER DO THIS
db_password = "my_secure_password_123"  # Exposed in Git history forever
api_key = "sk-abc123def456"  # Will be revoked
```

**❌ WRONG — secrets in environment setup:**
```bash
export DB_PASSWORD="my_secure_password_123"  # Visible in shell history
```

### Enforcement Gate

- **Developer:** Pre-commit hook blocks patterns: `password|secret|api_key|token|credential` (case-insensitive)
- **Code Review (Phase 3+):** Human reviewer checks for hardcoded values
- **Security Agent (Phase 2+):** Scans code for common secret patterns
- **Verification Agent (Phase 5+):** Audits Chroma ingestion for secrets

**Tool:** `git-secrets` or equivalent pre-commit hook (Phase 3+)

### Related Standards
[[Coding Standards]] — Configuration and secrets management section  
[[Architecture Standards]] — Environment configuration section

### Related Decisions
[[ADR-SEC-001]] — Human Approval Gate Requirements

---

## 2. Data Classification and Protection

### Rule: Classify all data and protect according to sensitivity level

Data must be classified as one of:
- **PUBLIC:** No sensitivity; can be exposed
- **INTERNAL:** Project confidential; limited distribution
- **SENSITIVE:** Personal data, credentials, secrets; strict protection required
- **CRITICAL:** Data breach would cause operational failure or legal liability

### Compliance Example

**Data classification in code comments:**
```python
# PUBLIC: Project roadmap and phase definitions
# INTERNAL: Project decisions and architectural notes
# SENSITIVE: API keys, user credentials, JWT secrets
# CRITICAL: Database encryption keys, master secrets

class User:
    email = ""  # INTERNAL: maps to user accounts
    password_hash = ""  # SENSITIVE: never store plaintext
    api_key = ""  # SENSITIVE: grants API access
    
class SystemConfig:
    db_encryption_key = ""  # CRITICAL: encryption depends on secrecy
```

**Storage rules:**
- **PUBLIC:** Can be in Vault, committed to Git
- **INTERNAL:** In Vault (Obsidian vault is Git-versioned; private repo)
- **SENSITIVE:** In .env, secret manager, or encrypted storage (NOT in Vault or Git)
- **CRITICAL:** In secret manager only (AWS Secrets Manager, Vault, etc.) — NOT in .env

### Violation Example

**❌ WRONG — storing sensitive data in Vault:**
```markdown
# Vault/03-Projects/AI Software Factory/Secrets.md
API_KEY=sk-abc123  # EXPOSED in Git history
DATABASE_PASSWORD=secure_pass  # Visible to anyone with repo access
```

**❌ WRONG — mixed classifications:**
```python
config = {
    "project_name": "App Builder",  # PUBLIC - OK
    "api_key": "sk-abc123",  # SENSITIVE - WRONG, should be env var
    "db_password": "password"  # CRITICAL - WRONG, should be secret manager
}
```

### Enforcement Gate

- **Developer:** Classify data at point of definition; use comments or type hints
- **Code Review:** Verify SENSITIVE and CRITICAL data is not hardcoded
- **Security Agent:** Flag unclassified data in code review
- **Chroma Ingestion (Phase 5+):** Mark SENSITIVE/CRITICAL documents with `is_authoritative=false`

### Related Standards
[[Coding Standards]] — Data handling and classification section

### Related Decisions
[[ADR-DATA-001]] — Chroma Collection Schema & Facts/Sessions Separation (handles SENSITIVE data isolation)

---

## 3. Authentication and Authorization

### Rule: JWT or OAuth 2.0 only; no custom authentication schemes

Authentication (verifying identity) and authorization (checking permissions) must use industry-standard protocols. Custom implementations introduce exploitable bugs.

### Compliance Example

**JWT implementation:**
```python
import jwt
from datetime import datetime, timedelta

def create_token(user_id: str, expires_hours: int = 24) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=expires_hours),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, os.getenv('JWT_SECRET_KEY'), algorithm="HS256")

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, os.getenv('JWT_SECRET_KEY'), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidSignatureError:
        raise ValueError("Invalid token")
```

**OAuth 2.0 (delegated auth):**
- Use established providers (Google, GitHub, Auth0)
- Never implement OAuth provider yourself

### Violation Example

**❌ WRONG — custom authentication:**
```python
def verify_user(username, password):
    # NEVER implement this yourself
    user = db.query(User).filter_by(username=username).first()
    if user and user.password == password:  # Plaintext comparison!
        return True
    return False
```

**❌ WRONG — tokens without expiration:**
```python
# WRONG: token never expires
payload = {"user_id": user_id}
token = jwt.encode(payload, secret)  # Missing 'exp' field
```

### Enforcement Gate

- **Code Review:** Verify all auth uses JWT or OAuth only
- **Security Agent:** Scan for custom auth schemes or hardcoded tokens
- **Phase 5+:** Test token expiration and refresh rotation

### Related Standards
[[Coding Standards]] — Authentication patterns section

### Related Decisions
[[ADR-SEC-001]] — Human Approval Gate Requirements  
[[ADR-INT-001]] — MCP Server Integration Policy (agents use approved auth)

---

## 4. Agent-Specific Security Rules

### Rule: AI agents must not exceed delegated authority

Agents (Architect, Backend, Security, etc.) are tools with defined capabilities. They must not:
- Make decisions requiring human approval (see [[ADR-SEC-001]])
- Modify security-critical files without review
- Merge to production branches without approval
- Create or modify secrets/credentials
- Change authentication/authorization systems

### Compliance Example

**Allowed agent actions:**
- Architect: Design systems, write ADRs (approved by human)
- Backend: Write APIs, design databases (review before merge)
- Security: Review code for vulnerabilities (flagged for human decision)
- DevOps: Manage Docker, deploy to staging (human approves production)

**Required approvals (agents must flag for human decision):**
- Any change to `CLAUDE.md`, `WORKFLOW.md`, or security standards
- Any change to authentication/authorization
- Any database schema change
- Any infrastructure change to production
- Any secret creation or rotation

### Violation Example

**❌ WRONG — agent autonomy without approval:**
```python
# Backend agent should NOT do this without human approval
db.execute("""
    ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'changeme';
""")  # Security risk: default password exposed
```

**❌ WRONG — agent accessing secrets directly:**
```python
# WRONG: Agent hardcodes secret handling
secret_key = "sk-abc123"  # Agent should never know actual secret
# Correct: Agent uses env var, human provides it
secret_key = os.getenv('API_KEY')
```

### Enforcement Gate

- **CLAUDE.md:** Approval gates define what agents can/cannot do
- **Code Review:** Human verifies agent-written code follows delegated authority
- **Security Agent:** Flags any code that exceeds agent authority
- **Phase 5+ Verification:** Audit logs track agent actions and approvals

### Related Standards
[[Coding Standards]] — Code review and approval section  
[[Architecture Standards]] — Technology selection and change management

### Related Decisions
[[ADR-SEC-001]] — Human Approval Gate Requirements (operationalizes agent authority)

---

## 5. Input Validation

### Rule: Validate all input at system boundaries

System boundaries are: API endpoints, file uploads, environment variables, command-line arguments, and external service responses. Never trust external input.

### Compliance Example

**API endpoint validation:**
```python
from pydantic import BaseModel, Field, validator

class CreateUserRequest(BaseModel):
    email: str = Field(..., regex=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., min_length=12)
    role: str = Field(..., regex=r"^(admin|user|viewer)$")
    
    @validator('email')
    def validate_email_not_registered(cls, v):
        if User.query.filter_by(email=v).first():
            raise ValueError("Email already registered")
        return v
```

**File upload validation:**
```python
def upload_document(file):
    # Validate file type
    allowed_types = {'pdf', 'docx', 'txt'}
    file_ext = file.filename.rsplit('.', 1)[1].lower()
    if file_ext not in allowed_types:
        raise ValueError(f"File type {file_ext} not allowed")
    
    # Validate file size
    max_size = 10 * 1024 * 1024  # 10 MB
    if len(file.read()) > max_size:
        raise ValueError("File too large")
    
    # Never trust filename
    secure_name = generate_safe_filename(file.filename)
    return secure_name
```

### Violation Example

**❌ WRONG — trusting user input:**
```python
# WRONG: No validation
user = User.query.filter_by(email=request.args.get('email')).first()
# Attacker can inject: ?email=anything@example.com OR 1=1
```

**❌ WRONG — incomplete validation:**
```python
# WRONG: Only checks length, not format
if len(password) >= 8:
    save_user(password)  # Could be "aaaaaaaa" (too simple)
```

### Enforcement Gate

- **Code Review:** Verify all boundaries have validators
- **Security Agent:** Scan for missing input validation
- **Phase 5+ Testing:** Run security tests with invalid inputs

### Related Standards
[[Coding Standards]] — Error handling and input validation section

---

## 6. Dependency Management

### Rule: Review dependencies before adding; audit regularly; pin versions

Dependencies introduce risk (vulnerability, supply chain, license issues). Minimize and audit.

### Compliance Example

**Dependency review process:**
```
1. Identify specific need (what does this package do?)
2. Check: 
   - License compatible (MIT, Apache 2.0, etc. — not GPL unless appropriate)
   - Maintenance status (is it actively maintained?)
   - Security history (any known CVEs?)
   - Community adoption (does it have significant use?)
3. Pin version: requirements.txt or package.json must specify exact version
   - WRONG: requests  (picks latest)
   - CORRECT: requests==2.31.0  (fixed version)
4. Document: Why is this dependency needed?
```

**Audit cadence:**
```
- Weekly: Run `pip audit` or `npm audit` for vulnerabilities
- Monthly: Review dependency updates and security advisories
- Quarterly: Full security audit of all dependencies
```

### Violation Example

**❌ WRONG — unpinned dependencies:**
```
# requirements.txt
requests  # Could be 2.25.0 or 2.32.0 — unpredictable
flask >= 2.0  # Too loose; could pull breaking changes
```

**❌ WRONG — untrusted dependencies:**
```
# This package hasn't been updated in 5 years
pip install obscure-package-from-2018
```

### Enforcement Gate

- **Developer:** Propose new dependency with justification
- **Code Review:** Verify dependency is necessary and pinned
- **Security Agent:** Check for known CVEs in dependencies
- **CI/CD (Phase 5+):** Automated audit on every build

**Tools:** `pip audit`, `npm audit`, `OWASP Dependency-Check`

### Related Standards
[[Coding Standards]] — Dependency declaration section

---

## 7. Principle of Least Privilege

### Rule: All service accounts and agent roles have minimum necessary permissions

Every actor (human, agent, service) should have only the permissions required for their specific task.

### Compliance Example

**Service account roles:**
```
Backend Agent:
  - Read: project-facts, architecture, standards (Chroma)
  - Write: code, tests (git branches)
  - Deploy: staging only (not production)
  - Cannot: delete data, modify CLAUDE.md, rotate keys

Security Agent:
  - Read: all (for threat analysis)
  - Write: security recommendations, ADRs
  - Deploy: none (recommendations only)
  - Cannot: merge code, push to main

DevOps Agent:
  - Read: architecture, infrastructure ADRs
  - Write: docker configs, deployment manifests
  - Deploy: staging and production (with approval)
  - Cannot: merge code to main, modify standards
```

### Violation Example

**❌ WRONG — excessive permissions:**
```
all_agents = {
    "permissions": ["*"]  # All agents can do everything
}
```

**❌ WRONG — persistent admin access:**
```
# Agent always has admin rights
@requires_role("admin")
def backend_agent_generate_code():
    # Can delete databases, change configuration, etc.
```

### Enforcement Gate

- **Setup:** Define role matrix (Agent × Capability × Resource)
- **Code Review:** Verify each agent call respects delegated authority
- **Phase 5+:** Audit logs verify agents don't exceed permissions
- **CLAUDE.md:** Approval Requirements define authority boundaries

### Related Standards
[[Architecture Standards]] — Agent role definition and authorization

### Related Decisions
[[ADR-SEC-001]] — Human Approval Gate Requirements (formalizes approval authority)  
[[ADR-INT-001]] — MCP Server Integration Policy (controls agent tool access)

---

## Threat Modeling

### Rule: Critical systems require threat analysis using STRIDE framework

STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) ensures systematic threat identification.

### When Required
- Any authentication or authorization system
- Any system storing or transmitting sensitive data
- Any API exposed to external callers
- Any infrastructure change to production

### Compliance Example

**STRIDE analysis for API authentication:**
```
Spoofing:       Could attacker forge JWT token? (Use secure signing)
Tampering:      Could attacker modify token? (Use HMAC signature verification)
Repudiation:    Could user deny action? (Log all auth events)
Information:    Is token transmitted securely? (Use HTTPS only)
Denial:         Could attacker flood auth endpoint? (Rate limiting)
Elevation:      Could token grant unintended permissions? (Validate scopes)
```

### Enforcement Gate

- **Phase 2+:** Document threat model for security-critical systems
- **Security Agent:** Review systems for common threats
- **Phase 5+ Verification:** Test mitigations before deployment

### Related Decisions
[[ADR-SEC-001]] — Human Approval Gate Requirements (security decisions require approval)

---

## Security Review Checklist

Before deploying any system, verify:

- [ ] No secrets in code or Git history
- [ ] Data classified (PUBLIC, INTERNAL, SENSITIVE, CRITICAL)
- [ ] All input validated at system boundaries
- [ ] Authentication uses JWT or OAuth only
- [ ] All service accounts follow least privilege principle
- [ ] Dependencies reviewed and pinned
- [ ] Critical systems have threat model (STRIDE)
- [ ] Agent actions respect delegated authority
- [ ] Security standards linked in architecture documentation
- [ ] [[ADR-SEC-001]] approval gates respected for security changes

---

## Related Documents

- [[Coding Standards]] — Configuration, data handling, code review practices
- [[Architecture Standards]] — Service design, authentication systems, technology selection
- [[ADR-SEC-001]] — Human Approval Gate Requirements (operationalizes these rules)
- [[ADR-INT-001]] — MCP Server Integration Policy (agent tool security)
- [[ADR-DATA-001]] — Chroma Collection Schema (data classification and protection)

---

**Last Updated:** 2026-06-07  
**Status:** Active — Phase 2+  
**Version:** 1.0
