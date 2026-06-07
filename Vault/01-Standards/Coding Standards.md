---
type: Standard
phase: global
status: Active
authority: facts
chroma_collection: global-standards
tags: [coding, testing, naming, standards]
related: [Backend.md, Frontend.md, DevOps.md]
last_updated: 2026-06-07
---

# Coding Standards

**Status:** Active  
**Phase Enforcement Begins:** Phase 3  
**Last Updated:** 2026-06-07

---

## Overview

Coding standards ensure consistent, maintainable, and secure code across all projects. These standards apply to all code work starting in Phase 3. Code that violates these standards will not be reviewed or merged.

---

## 1. Code Organization and Structure

### Rule: Code must be organized by responsibility, not by type

Services, modules, and classes should group related functionality together. Avoid organizing by file type (all models together, all views together) — instead organize by feature or domain.

### Compliance Example

**Correct domain-organized structure:**
```
project/
├── users/
│   ├── models.py          # User entity
│   ├── service.py         # User business logic
│   ├── api.py             # User endpoints
│   └── tests/
│       └── test_users.py
├── documents/
│   ├── models.py          # Document entity
│   ├── service.py         # Document business logic
│   ├── api.py             # Document endpoints
│   └── tests/
│       └── test_documents.py
└── shared/
    ├── auth.py            # Shared authentication
    ├── validation.py      # Shared validators
```

### Violation Example

**❌ WRONG — type-organized (hard to find related code):**
```
project/
├── models/
│   ├── user.py
│   ├── document.py
│   └── order.py
├── views/
│   ├── user_views.py
│   ├── document_views.py
│   └── order_views.py
├── tests/
│   ├── test_user_models.py
│   ├── test_user_views.py
```

### Enforcement Gate

- **Code Review:** Verify domain organization before merge
- **Architecture Review:** New modules should follow domain pattern

### Related Standards

[[Architecture Standards]] — Modularity and Service Design

---

## 2. Naming Conventions

### Rule: Names must be descriptive and follow language conventions

Names communicate intent. A good name eliminates the need for comments.

### Compliance Example

**Python naming:**
```python
# Functions: snake_case, verb-first
def validate_email(email: str) -> bool:
    pass

def get_user_by_id(user_id: str) -> User:
    pass

# Classes: PascalCase, noun-based
class UserService:
    pass

class AuthenticationError(Exception):
    pass

# Constants: UPPER_CASE
MAX_LOGIN_ATTEMPTS = 5
DEFAULT_SESSION_TIMEOUT_SECONDS = 3600

# Variables: snake_case, descriptive
user_email = "user@example.com"
is_authenticated = True
```

**Abbreviations: Avoid unless universally known**
```python
# CORRECT
user_identifier = "123"
authentication_token = "abc123"

# WRONG
usr_id = "123"  # "usr" unclear
auth_tk = "abc123"  # "tk" unclear
```

### Violation Example

**❌ WRONG — unclear names:**
```python
def process(x):  # What does it process?
    pass

def get_data():  # What data?
    pass

class Handler:  # Handles what?
    pass

x = 5  # What is x?
temp = calculate_something()  # What is calculated?
```

### Enforcement Gate

- **Code Review:** Reject unclear names; require clarification
- **Linting:** Use linters (pylint, eslint) to enforce naming conventions

### Related Standards

[[Documentation Standards]] — Comments should clarify intent, not names

---

## 3. Type Safety and Type Hints

### Rule: All function signatures require type hints; use type checking

Type hints prevent bugs, improve IDE support, and document intent.

### Compliance Example

**Python with type hints:**
```python
from typing import List, Optional, Dict

def create_user(email: str, password_hash: str) -> User:
    """Create a new user."""
    user = User(email=email, password_hash=password_hash)
    db.session.add(user)
    return user

def find_users(filter: Dict[str, str]) -> List[User]:
    """Find users matching filter criteria."""
    return User.query.filter_by(**filter).all()

def get_user_or_none(user_id: str) -> Optional[User]:
    """Fetch user or return None if not found."""
    return User.query.get(user_id)
```

**Type checking (Phase 5+):**
```bash
# Run mypy to catch type errors before runtime
mypy --strict app/
```

### Violation Example

**❌ WRONG — missing type hints:**
```python
def create_user(email, password_hash):  # No types; unclear
    user = User(email=email, password_hash=password_hash)
    db.session.add(user)
    return user

def process_data(data):  # What's the data type?
    return data.upper()  # Could crash if data is not a string
```

### Enforcement Gate

- **Code Review:** Reject functions without type hints on signatures
- **Linting:** Use mypy or pyright to enforce type safety (Phase 5+)

### Related Standards

[[Architecture Standards]] — Database Management (ORM typing)

---

## 4. Testing Requirements

### Rule: All business logic requires unit tests; critical code requires integration tests

Tests document intent, prevent regressions, and catch bugs early.

### Compliance Example

**Unit tests (fast, isolated):**
```python
import pytest
from users.service import UserService

class TestUserService:
    def test_create_user_success(self):
        service = UserService()
        user = service.create("user@example.com", "password")
        assert user.email == "user@example.com"
        assert user.is_active is True
    
    def test_create_user_duplicate_email(self):
        service = UserService()
        service.create("user@example.com", "password")
        with pytest.raises(ValueError):
            service.create("user@example.com", "different_password")
```

**Integration tests (critical paths):**
```python
def test_user_login_flow(db, client):
    """Test complete login flow: create user, authenticate, get token."""
    # Create user
    response = client.post("/api/v1/users", json={
        "email": "user@example.com",
        "password": "secure_password"
    })
    assert response.status_code == 201
    
    # Authenticate
    response = client.post("/api/v1/auth/login", json={
        "email": "user@example.com",
        "password": "secure_password"
    })
    assert response.status_code == 200
    token = response.json()["token"]
    
    # Verify token works
    response = client.get("/api/v1/users/me", 
        headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
```

### Violation Example

**❌ WRONG — no tests:**
```python
# No test file exists
# Business logic untested
# Regressions not caught
```

**❌ WRONG — tests don't test logic:**
```python
def test_user_creation():
    user = User()  # Creates but doesn't validate
    assert user is not None  # Weak assertion
```

### Enforcement Gate

- **Code Review:** New features require matching test coverage
- **CI/CD (Phase 5+):** Tests must pass before merge; coverage tracked
- **Test Coverage:** Aim for 80%+ coverage on business logic

**Tools:** pytest, unittest, coverage.py

### Related Standards

[[Architecture Standards]] — Service boundaries should be independently testable

---

## 5. Comments and Docstrings

### Rule: Code is self-documenting; comments explain WHY, not WHAT

Good naming and structure eliminate most comments. Only add comments when the WHY is non-obvious.

### Compliance Example

**Self-documenting code:**
```python
def validate_password_strength(password: str) -> bool:
    """Check if password meets security requirements."""
    return (
        len(password) >= 12 and
        any(c.isupper() for c in password) and
        any(c.isdigit() for c in password)
    )
```

**Comments for non-obvious decisions:**
```python
def calculate_expiration_time(created_at: datetime) -> datetime:
    # RFC 6238 requires 30-second windows for TOTP tokens
    # Extending to 60 seconds to accommodate client clock drift
    return created_at + timedelta(seconds=60)
```

**Docstrings (one short line; no multi-paragraph blocks):**
```python
def get_user(user_id: str) -> Optional[User]:
    """Fetch user by ID, or None if not found."""
    return User.query.get(user_id)
```

### Violation Example

**❌ WRONG — comments describe what code does:**
```python
# Loop through users
for user in users:
    # Check if user is active
    if user.is_active:
        # Send email to user
        send_email(user)
```

**❌ WRONG — multi-paragraph docstrings:**
```python
def process_user(user_id):
    """
    This function processes a user by taking their ID and then
    looking them up in the database. It then checks various conditions
    and may send them an email or update their status depending on
    what those conditions are. It's a complex function that does
    many things.
    """
    pass
```

### Enforcement Gate

- **Code Review:** Require justification for comments; reject "what" comments
- **Linting:** Flag multi-paragraph docstrings (Phase 5+)

### Related Standards

[[Documentation Standards]] — Code documentation section

---

## 6. Error Handling

### Rule: Handle errors at system boundaries; use exceptions for control flow

Errors should be caught at API boundaries (user input, external services). Avoid using exceptions for normal control flow.

### Compliance Example

**Boundary error handling:**
```python
@app.route("/api/v1/users", methods=["POST"])
def create_user():
    try:
        email = request.json.get("email")
        if not email:
            return {"error": "email required"}, 400
        
        user = UserService().create(email, request.json.get("password"))
        return {"id": user.id}, 201
    except ValueError as e:
        return {"error": str(e)}, 400
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {"error": "Internal server error"}, 500
```

### Violation Example

**❌ WRONG — using exceptions for control flow:**
```python
def find_user(email):
    try:
        return User.query.filter_by(email=email).first()
    except StopIteration:  # Not the right exception
        return None
```

**❌ WRONG — swallowing errors silently:**
```python
try:
    critical_operation()
except:
    pass  # Silent failure; bug hidden
```

### Enforcement Gate

- **Code Review:** Verify error handling at boundaries
- **Security Agent:** Flag silent exception swallowing

### Related Standards

[[Security Standards]] — Input Validation

---

## 7. Database Access (ORM Only)

### Rule: No raw SQL in business logic; use ORM for all queries

Raw SQL risks SQL injection and makes queries hard to test. ORM abstracts the database.

### Compliance Example

**ORM-based queries:**
```python
from sqlalchemy import Column, String, create_engine
from sqlalchemy.orm import sessionmaker

class User(Base):
    __tablename__ = "users"
    email = Column(String(255), unique=True)

# Query via ORM
user = session.query(User).filter_by(email="user@example.com").first()

# Update via ORM
user.email = "new@example.com"
session.commit()
```

### Violation Example

**❌ WRONG — raw SQL in business logic:**
```python
# SQL injection vulnerability
user = db.execute(
    f"SELECT * FROM users WHERE email='{email}'"
)
```

### Enforcement Gate

- **Code Review:** No raw SQL strings in business logic
- **Security Agent:** Scan for SQL injection patterns
- **Linting:** grep for execute() with unparameterized strings (Phase 5+)

### Related Standards

[[Security Standards]] — Database Management  
[[Architecture Standards]] — Database and Data Management

---

## 8. Code Review Standards

### Rule: All non-trivial changes require human code review

Code review catches bugs, shares knowledge, and improves consistency.

### Compliance Example

**Good PR with code review:**
```
PR Title: Add user email validation

Description:
- Validates email format on user creation
- Reuses existing EmailValidator utility
- Adds 3 unit tests for validation edge cases
- Related: [[ADR-ARCH-001]] (modularity principle)

Changes:
- users/service.py: Added email validation
- tests/test_users.py: Added validation tests

Review Checklist:
- [x] Tests pass
- [x] No security issues
- [x] Follows coding standards
- [x] Documentation updated
```

### Violation Example

**❌ WRONG — no review; direct merge:**
```
Pushed directly to main without PR
No tests
No documentation
```

### Enforcement Gate

- **Git Workflow:** Require PR approval before merge to main (Phase 3+)
- **Code Review Checklist:** [[Coding Standards Review Checklist]] below

---

## Coding Standards Review Checklist

Before approving any code review:

- [ ] Function/variable names are clear and descriptive
- [ ] Type hints present on all function signatures
- [ ] Business logic has unit tests
- [ ] Critical paths have integration tests
- [ ] No raw SQL or custom authentication
- [ ] Error handling at system boundaries only
- [ ] Comments explain WHY, not WHAT
- [ ] No magic numbers (use named constants)
- [ ] No hardcoded secrets or credentials
- [ ] Code follows domain organization pattern
- [ ] Related documentation updated
- [ ] Linked to relevant ADRs or standards

---

## Related Documents

- [[Architecture Standards]] — Module organization, API design
- [[Security Standards]] — Input validation, authentication, secrets
- [[Documentation Standards]] — Code documentation requirements
- [[ADR-ARCH-001]] — Knowledge-First Pipeline Design (organization principle)

---

**Last Updated:** 2026-06-07  
**Status:** Active — Phase 3+  
**Version:** 1.0
