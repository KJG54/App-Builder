---
type: Skill
name: "user-authentication-system-design"
version: "1.0"
phase: 7
status: Active
last_updated: 2026-06-08
authority: facts
chroma_collection: ai-software-factory-skills
tags: [skill, authentication, design-pattern, security, oauth]
related: [ADR-SEC-001, Security Standards, oauth2-implementation-v1.0, mfa-provider-implementation-v1.0, Backend Agent, DevOps Agent]
created_date: 2026-06-08
created_by: Architect Agent
validation_status: Approved
maintenance_owner: Security Team
next_review_date: 2026-09-08
---

# Skill: User Authentication System Design v1.0

**Skill ID:** user-authentication-system-design-v1.0  
**Domain:** Architecture  
**Status:** ✅ Active  
**Complexity:** Medium (4-6 weeks to implement)

---

## Problem Statement

You need to design a secure, scalable user authentication system that:

- **Supports modern authentication** (OAuth 2.0, OpenID Connect)
- **Enables multi-factor authentication** (MFA via TOTP and backup codes)
- **Maintains audit trail** (logs all authentication events)
- **Protects credentials** (never stores plaintext passwords)
- **Complies with security standards** (OWASP Top 10, NIST guidelines)
- **Integrates with identity providers** (Google, GitHub, corporate SSO)
- **Works across platforms** (web, mobile, API)

This skill captures the architecture and design patterns proven across multiple implementations.

---

## Solution: Architecture Pattern

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                User Application                 │
│         (Web, Mobile, API Client)               │
└────────────────┬────────────────────────────────┘
                 │
                 │ 1. Login Request
                 ↓
┌─────────────────────────────────────────────────┐
│          Authentication Service                 │
│  • Validates credentials                        │
│  • Initiates MFA if configured                  │
│  • Returns session token/JWT                    │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ↓        ↓        ↓
  ┌──────┴──┐ ┌────┴──┐ ┌──────┴──┐
  │ Identity│ │Token  │ │  MFA    │
  │Provider │ │Manager│ │Provider │
  │(OAuth)  │ │(JWT)  │ │(TOTP)   │
  └─────────┘ └───────┘ └─────────┘
        │        │        │
        └────────┼────────┘
                 │
        ┌────────↓────────┐
        │  Audit Logger   │
        │ (All Auth Events)
        └─────────────────┘
```

### Core Components

#### 1. Identity Provider Integration
**Responsibility:** Authenticate users via OAuth 2.0 / OpenID Connect

**Pattern:**
- Use OpenID Connect for modern authentication (supersedes OAuth 2.0)
- Support multiple providers (Google, GitHub, Microsoft)
- Store provider user info (sub, email, name, avatar)
- Map provider identity to internal user

**Flow:**
```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth provider
3. User authenticates with Google
4. Google redirects back with authorization code
5. Backend exchanges code for ID token + access token
6. Backend verifies ID token signature (JWT)
7. Backend creates session or returns JWT
8. Client stores token, uses for subsequent requests
```

**Key Decision:** Use OIDC (OpenID Connect) over plain OAuth 2.0
- OIDC includes ID token (JWT with user claims)
- OAuth 2.0 only provides access token (no user info)
- OIDC is purpose-built for authentication

#### 2. Token Manager
**Responsibility:** Issue and validate JWT tokens

**Pattern:**
- Issue JWT with short expiration (15 minutes)
- Issue refresh token with long expiration (7 days)
- Validate JWT signature on each request
- Rotate refresh tokens periodically

**JWT Payload (Example):**
```json
{
  "sub": "user-123",
  "email": "alice@example.com",
  "name": "Alice",
  "iat": 1717939200,
  "exp": 1717940100,
  "aud": "my-app"
}
```

**Token Expiration Strategy:**
- **Access token:** 15 minutes (short-lived, limits damage if stolen)
- **Refresh token:** 7 days (long-lived, enables seamless UX)
- **Sliding expiration:** Refresh token valid for 7 days from last use

#### 3. MFA Provider
**Responsibility:** Require and validate second factor

**Patterns:**
- **TOTP (Time-based One-Time Password):** Google Authenticator, Authy
- **Email codes:** Send 6-digit code to email (low friction)
- **Backup codes:** 10x one-time codes for account recovery
- **Required for:** Admin accounts, sensitive operations
- **Optional for:** Regular users (opt-in, not mandated)

**MFA Flow:**
```
1. User enters credentials (username + password)
2. AuthService validates password
3. AuthService checks: does user have MFA enabled?
4. If yes: Prompt for MFA challenge
5. MFAProvider sends code (TOTP from app or email)
6. User enters code
7. MFAProvider validates (within 30 seconds for TOTP, 10 min for email)
8. If valid: Create JWT + session
```

#### 4. Audit Logger
**Responsibility:** Log all authentication events

**What to Log:**
- Login attempts (success/failure)
- MFA challenges (issued/validated)
- Token refresh
- Session creation/expiration
- Failed password attempts
- Suspicious activity (too many failures, unusual location)

**Log Format (JSON):**
```json
{
  "timestamp": "2026-06-08T12:34:56Z",
  "event": "login_success",
  "user_id": "user-123",
  "email": "alice@example.com",
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0...",
  "provider": "google",
  "mfa_used": true,
  "duration_ms": 245
}
```

**Retention:** Keep audit logs for 1 year (compliance requirement)

---

## Security Checklist

Before deploying user authentication, verify:

### Passwords & Credentials
- [ ] **Never store plaintext passwords** — Use bcrypt or argon2
- [ ] **Hash cost factor:** bcrypt 12+, argon2 with recommended params
- [ ] **Password reset via email:** Secure token (cryptographically random, 1-hour expiry)
- [ ] **Rate limit:** Max 5 login attempts per minute per account
- [ ] **Account lockout:** Lock after 10 failed attempts (30 min cooldown)

### Authentication Tokens (JWT)
- [ ] **Signed tokens:** RS256 (RSA) or ES256 (ECDSA), never HS256 (shared secret)
- [ ] **Token expiration:** Short-lived (15 min access, 7 day refresh)
- [ ] **Token validation:** Verify signature on every API request
- [ ] **Token storage (web):** HttpOnly cookies (not localStorage, prevents XSS theft)
- [ ] **Token storage (mobile):** Secure storage (iOS Keychain, Android Keystore)

### Multi-Factor Authentication
- [ ] **MFA for admins:** Mandatory, no exceptions
- [ ] **TOTP apps:** Preferred (offline, doesn't leak via SMS)
- [ ] **Backup codes:** Generate 10 one-time codes (for account recovery)
- [ ] **Recovery flow:** Use backup code to disable MFA and reset

### OAuth / OpenID Connect
- [ ] **OIDC (not plain OAuth):** Use OpenID Connect for ID token
- [ ] **PKCE flow:** For web/mobile apps (prevents authorization code interception)
- [ ] **Provider verification:** Verify ID token signature using provider's public key
- [ ] **Scope limitations:** Request minimal scopes (openid, email, profile)
- [ ] **State parameter:** Verify state matches (prevents CSRF)

### Network Security
- [ ] **HTTPS/TLS 1.3:** All authentication endpoints over TLS
- [ ] **HSTS:** Enforce HTTPS (Strict-Transport-Security header)
- [ ] **CORS:** Restrict to your domains only (no wildcard)
- [ ] **CSP:** Content Security Policy (prevent XSS)

### Audit & Monitoring
- [ ] **Audit logging:** All auth events logged
- [ ] **Failed login alerts:** Alert on unusual patterns (too many failures, new location)
- [ ] **Token leak detection:** Flag unusual token usage (multiple IPs, rapid refresh)
- [ ] **Security review:** Annual security audit

---

## Component Implementation Guide

### Component 1: Identity Provider Integration

**File:** `services/auth/identity_provider.py`

**Responsibilities:**
- OAuth 2.0 / OpenID Connect authorization code flow
- JWT validation (verify signature + expiration)
- User info retrieval from provider
- Mapping to internal user database

**Key Methods:**
- `initiate_oauth_flow(provider) → auth_url` — Generate OAuth login URL
- `exchange_code_for_token(code) → id_token` — Exchange auth code for token
- `verify_id_token(token) → user_info` — Validate JWT signature and return claims
- `get_or_create_user(user_info) → user` — Map provider user to internal user

**Example (Python with FastAPI):**
```python
from fastapi import FastAPI
from authlib.integrations.starlette_client import OAuth

app = FastAPI()
oauth = OAuth()

# Configure Google OAuth
oauth.register(
    name='google',
    client_id='YOUR_CLIENT_ID',
    client_secret='YOUR_CLIENT_SECRET',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

@app.get("/auth/login/google")
async def login_google(request):
    # Generate OAuth URL
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request):
    # Exchange code for token
    token = await oauth.google.authorize_access_token(request)
    
    # Verify ID token
    user_info = token['userinfo']
    
    # Create user session
    return {"token": create_jwt(user_info['sub'])}
```

### Component 2: Token Manager

**File:** `services/auth/token_manager.py`

**Responsibilities:**
- Generate JWT tokens with claims
- Validate token signature and expiration
- Refresh tokens (issue new access token with valid refresh token)
- Token revocation (blacklist for logout)

**Key Methods:**
- `create_jwt(user_id, expires_in=900) → token` — Create JWT
- `verify_jwt(token) → claims` — Validate and parse JWT
- `refresh_token(refresh_token) → access_token` — Issue new token
- `revoke_token(token)` — Blacklist token for logout

**Example (Python with PyJWT):**
```python
import jwt
from datetime import datetime, timedelta

class TokenManager:
    def __init__(self, secret_key, algorithm="RS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def create_jwt(self, user_id: str, expires_in: int = 900) -> str:
        """Create JWT token"""
        payload = {
            "sub": user_id,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(seconds=expires_in),
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_jwt(self, token: str) -> dict:
        """Verify and decode JWT"""
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

# Usage
token_mgr = TokenManager(private_key, algorithm="RS256")

# Create token
access_token = token_mgr.create_jwt("user-123", expires_in=900)  # 15 min

# Verify token
claims = token_mgr.verify_jwt(access_token)
user_id = claims["sub"]
```

### Component 3: MFA Provider

**File:** `services/auth/mfa_provider.py`

**Responsibilities:**
- Generate TOTP secrets
- Validate TOTP codes (6 digits, 30-second window)
- Generate backup codes
- Store MFA configuration per user

**Key Methods:**
- `generate_totp_secret() → (secret, qr_code)` — Create TOTP setup
- `verify_totp(user_id, code) → bool` — Validate TOTP code
- `generate_backup_codes() → [codes]` — Generate 10 backup codes
- `verify_backup_code(user_id, code) → bool` — Use backup code (one-time)

**Example (Python with pyotp):**
```python
import pyotp

class MFAProvider:
    def generate_totp_secret(self) -> tuple:
        """Generate TOTP secret and QR code"""
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        qr_code = totp.provisioning_uri(
            name="user@example.com",
            issuer_name="My App"
        )
        return secret, qr_code
    
    def verify_totp(self, secret: str, code: str) -> bool:
        """Verify TOTP code (within 30-second window)"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)  # Allow ±1 time step

# Usage
mfa = MFAProvider()

# Setup: User scans QR code
secret, qr_code = mfa.generate_totp_secret()
# Store secret in database

# Verification: User enters 6-digit code
code = "123456"
if mfa.verify_totp(secret, code):
    # Create JWT + session
```

### Component 4: Audit Logger

**File:** `services/auth/audit_logger.py`

**Responsibilities:**
- Log all authentication events
- Store in database or log aggregation service
- Query for security analysis

**Key Methods:**
- `log_login(user_id, success, ip, provider, mfa_used)` — Log login attempt
- `log_mfa_challenge(user_id, method)` — Log MFA sent
- `log_suspicious_activity(event, details)` — Log security event

**Example (Python with logging):**
```python
import json
import logging
from datetime import datetime

class AuditLogger:
    def __init__(self):
        self.logger = logging.getLogger("auth.audit")
    
    def log_login(self, user_id: str, success: bool, ip: str, provider: str, mfa_used: bool, duration_ms: int):
        """Log login event"""
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "login_success" if success else "login_failure",
            "user_id": user_id,
            "ip_address": ip,
            "provider": provider,
            "mfa_used": mfa_used,
            "duration_ms": duration_ms,
        }
        self.logger.info(json.dumps(event))

# Usage
audit = AuditLogger()
audit.log_login("user-123", success=True, ip="203.0.113.45", provider="google", mfa_used=True, duration_ms=245)
```

---

## When to Use This Skill

### ✅ Use This Skill When

- **Building a new authentication system** (from scratch)
- **Migrating from legacy auth** to modern OAuth + MFA
- **Adding authentication to an API** (backend service)
- **Implementing multi-tenant auth** (multiple organizations)
- **Supporting multiple providers** (Google, GitHub, corporate SSO)
- **Requiring audit logging** (compliance: SOC 2, ISO 27001)

### ❌ Don't Use This Skill When

- **Building API key authentication** (service-to-service, use different skill)
- **Implementing JWT alone** (without OAuth — incomplete)
- **Using external auth service** (Auth0, Cognito — delegate to them)
- **Mobile app native auth** (use platform native auth + JWT backend)
- **Updating existing OAuth** (use oauth2-upgrade skill)

---

## Constraints & Prerequisites

### Security Constraints
- **Mandatory:** MFA for admin accounts (no exceptions)
- **Mandatory:** Password hashing (bcrypt 12+)
- **Mandatory:** HTTPS/TLS only
- **Mandatory:** Token signing (RS256 or ES256, never HS256)
- **Required Review:** Security code review before production deployment

### Technology Constraints
- **Requires:** HTTPS certificate (TLS 1.3)
- **Requires:** Database (for user storage + audit logs)
- **Requires:** Email service (for password reset + MFA codes)
- **Requires:** Message queue (for async email sending, optional but recommended)

### Operational Constraints
- **Setup:** 2-3 days (configure OAuth apps, set up databases, certificates)
- **Implementation:** 4-6 weeks (4 components, integration, testing)
- **Deployment:** Blue-green deployment recommended (0-downtime)
- **Monitoring:** Real-time alerts for failed logins, unusual patterns

---

## Dependencies

### Related Skills
- **oauth2-implementation-v1.0** — Details for OAuth component
- **mfa-provider-implementation-v1.0** — TOTP + backup code implementation
- **audit-logging-implementation-v1.0** — Audit storage + querying

### Required Standards
- **Security Standards** — Password hashing, TLS, audit logging
- **API Standards** — RESTful authentication endpoints
- **Coding Standards** — Error handling, logging, tests

### External Tools
- **OAuth Providers:** Google, GitHub, Okta, Microsoft
- **JWT Library:** PyJWT (Python), jsonwebtoken (Node.js)
- **TOTP Library:** pyotp (Python), speakeasy (Node.js)
- **Database:** PostgreSQL (recommended for compliance + audit)

---

## Variations & Adaptations

### Variation 1: Web Application
**Architecture:** Monolithic or microservices backend + JavaScript frontend

**Key Decisions:**
- Store JWT in HttpOnly cookie (prevents XSS theft)
- CSRF protection (SameSite=Strict)
- Session table in database (for logout + revocation)

### Variation 2: Mobile Application (iOS/Android)
**Architecture:** Native mobile app + REST API backend

**Key Decisions:**
- Store token in platform secure storage (iOS Keychain, Android Keystore)
- Use public OAuth client (client credentials flow)
- PKCE required (prevents interception on mobile)
- Token refresh should use refresh token (not re-login every 15 min)

### Variation 3: API-Only (Service-to-Service)
**Architecture:** Microservices, each service is both client + server

**Key Decisions:**
- Use mTLS (mutual TLS) for service-to-service auth
- Or use JWT + shared secrets (simpler, less secure)
- API keys for external integrations (different from user auth)

### Variation 4: Single Sign-On (SSO)
**Architecture:** Multiple applications sharing auth

**Key Decisions:**
- Central auth service (shared by all apps)
- Session cookie domain covers all apps
- SAML or OIDC federation between auth service + apps

---

## Implementation Timeline & Effort

**Phase 1: Foundation (Week 1)**
- [ ] Set up OAuth apps (Google, GitHub, etc.)
- [ ] Configure OIDC discovery endpoints
- [ ] Create JWT signing keys (RS256 keypair)
- [ ] Database schema (users, sessions, tokens)
- **Deliverable:** OIDC flow working, test login with Google

**Phase 2: Core Auth (Weeks 2-3)**
- [ ] Implement identity provider integration
- [ ] Implement token manager (JWT creation + validation)
- [ ] Implement audit logger
- [ ] Password reset flow
- **Deliverable:** Full login/logout with Google OAuth, audit trail

**Phase 3: MFA (Week 4)**
- [ ] Implement TOTP (Google Authenticator)
- [ ] Implement backup codes
- [ ] MFA setup flow (QR code scanning)
- [ ] MFA validation on login
- **Deliverable:** MFA working, backup codes for recovery

**Phase 4: Security & Hardening (Weeks 5-6)**
- [ ] Rate limiting (failed login attempts)
- [ ] Account lockout (after 10 failures)
- [ ] Security audit (OWASP, penetration testing)
- [ ] Monitoring + alerting (failed logins, unusual patterns)
- **Deliverable:** Production-ready auth system, security audit pass

---

## Lessons Learned

### What Worked
✅ **OIDC over OAuth 2.0:** ID token (JWT) makes user info reliable, doesn't require separate endpoint call  
✅ **Short-lived access tokens (15 min):** Limits damage if token stolen, users barely notice expiration  
✅ **Refresh token rotation:** Each refresh returns new refresh token, detects token reuse attacks  
✅ **MFA for admins only:** Mandatory MFA adoption blocked by UX friction; starting with admins proved users accept it  
✅ **Audit logging from day 1:** Enabled security incident response; added retroactively is painful  

### What Surprised Us
⚠️ **JWT in localStorage is a security risk:** XSS vulnerability = token theft. Use HttpOnly cookies instead  
⚠️ **Session table still needed:** JWT is stateless but revocation (logout) requires state. Maintain session table  
⚠️ **Token expiration UX:** Users get frustrated with 15-min expiration. Refresh token + silent refresh solves it  
⚠️ **Backup codes low adoption:** Users skip backup code backup. Make them available after MFA setup, not optional  
⚠️ **Email-based MFA is insecure:** Email can be accessed from anywhere. SMS is insecure too (SIM swap). TOTP apps are best  

### What We'd Do Differently
🔧 **Implement rate limiting from start:** Adding later is disruptive to existing deployments  
🔧 **Use HTTPS from day 1:** Even development must use HTTPS for testing auth locally (browsers enforce HTTPS for cookies)  
🔧 **Plan for multi-tenant early:** If system will have multiple orgs, design for it now (harder to add later)  
🔧 **Monitor token usage patterns:** Detect token sharing (same token from different IPs) early  

---

## Success Metrics

### Delivery Metrics
| Metric | Target | Result |
|--------|--------|--------|
| Time to implement | 4-6 weeks | ___ |
| Design review cycles | 1-2 | ___ |
| Security audit pass | 100% | ___ |
| Test coverage | >80% | ___ |

### Operational Metrics
| Metric | Target | Result |
|--------|--------|--------|
| Login success rate | >99% | ___ |
| Failed login alerts | <50/day (normal) | ___ |
| Token refresh latency | <100ms | ___ |
| Auth service uptime | 99.9% | ___ |

### Security Metrics
| Metric | Target | Result |
|--------|--------|--------|
| Brute force incidents | 0 | ___ |
| Unauthorized access | 0 | ___ |
| Credential compromise | 0 | ___ |
| Security audit findings | 0 critical | ___ |

---

## Related Skills

- [[oauth2-implementation-v1.0]] — Detailed OAuth 2.0 implementation patterns
- [[mfa-provider-implementation-v1.0]] — TOTP + backup code implementation
- [[audit-logging-implementation-v1.0]] — Log storage + security analysis
- [[password-reset-workflow-v1.0]] — Secure password reset (future)
- [[rate-limiting-patterns-v1.0]] — Prevent brute force attacks (future)

---

## Deprecation Notes

(Empty for v1.0)

When v2.0 created, this section will explain: "Use v2.0 instead because..."

---

## Quick Reference

**Problem:** Design a secure user auth system  
**Solution:** OAuth 2.0 + OpenID Connect + MFA + Audit Logging  
**Time:** 4-6 weeks to implement  
**Complexity:** Medium  
**Risk:** Medium (security-critical, requires code review)  
**Maintenance:** Security team owns, quarterly review  

**Use this skill if you're designing auth for:**
- ✅ Web application with multiple users
- ✅ Mobile app + backend API
- ✅ Multi-tenant SaaS
- ✅ Enterprise system with compliance requirements

**Don't use this skill if you're:**
- ❌ Building a simple login (consider OAuth provider delegation)
- ❌ Implementing API key authentication (different skill)
- ❌ Adding to existing auth system (use v1.1 upgrade skill)

---

**Skill Created:** 2026-06-08  
**Last Updated:** 2026-06-08  
**Maintenance Owner:** Security Team  
**Next Review:** 2026-09-08
