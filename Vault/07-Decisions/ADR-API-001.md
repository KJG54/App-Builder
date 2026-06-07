# ADR-API-001: RESTful API Design Conventions

**Date:** 2026-06-07  
**Status:** Accepted  
**Phase:** 3 — Requirements Management  
**Category:** API (API)

---

## Decision

All APIs exposed by the Application Builder Framework must follow RESTful conventions with:

1. **Versioning** via URL path (`/api/v1/`, `/api/v2/`, etc.)
2. **Standard HTTP methods** (GET, POST, PUT, DELETE, PATCH)
3. **OpenAPI/Swagger documentation** (required for all APIs)
4. **JSON request/response format** (no XML, SOAP, or custom formats)
5. **Consistent error responses** (standard error schema)
6. **Pagination** for list endpoints (limit, offset, or cursor-based)

---

## Context

### The Problem: API Fragmentation

Without API conventions, different systems expose incompatible APIs. Clients must learn custom patterns for each service, leading to:
- Duplicate authentication logic per client
- No consistent error handling
- Breaking changes without notice
- Poor tooling support
- Difficult to test and document

### Why RESTful

RESTful APIs are:
- **Industry standard** (widely understood by developers)
- **Tool-friendly** (OpenAPI generators, Swagger UI, testing frameworks)
- **Stateless** (easier to scale and run in containers)
- **Language-agnostic** (any language can consume)
- **Web-native** (HTTP, no custom protocols)

### Why Versioning

APIs evolve. Versioning allows:
- **Safe evolution** (introduce v2 without breaking v1 clients)
- **Deprecation** (6-month notice before removing v1)
- **Parallel support** (run v1 and v2 simultaneously)
- **Client control** (clients choose when to upgrade)

---

## Alternatives Considered

### Alternative 1: GraphQL

**Pros:**
- Flexible queries (clients request exactly what they need)
- Single endpoint
- Excellent for complex data shapes

**Cons:**
- Steeper learning curve
- Overkill for CRUD operations
- Harder to cache (need field-level cache keys)
- Less mature tooling in some languages

### Alternative 2: Custom JSON-RPC

**Pros:**
- Can implement any pattern
- Full control

**Cons:**
- Non-standard (reinvent authentication, error handling, pagination)
- Poor tooling support
- Hard to document
- Clients must learn custom patterns

### Alternative 3: RESTful (CHOSEN)

**Pros:**
- Industry standard (developers understand immediately)
- Excellent tooling (OpenAPI, Swagger, testing frameworks)
- Cacheable (GET requests are idempotent)
- Stateless (scales horizontally)
- Language-agnostic

**Cons:**
- Less flexible than GraphQL (require specific data shapes)
- More endpoints than RPC (one per resource)
- Requires versioning discipline

**We choose RESTful** because it's the right balance: standards + tooling + simplicity.

---

## Implementation

### Endpoint Structure

**Standard resource endpoints:**

```
GET    /api/v1/users              # List all users
POST   /api/v1/users              # Create user
GET    /api/v1/users/{id}         # Get specific user
PUT    /api/v1/users/{id}         # Replace entire user
PATCH  /api/v1/users/{id}         # Partial update
DELETE /api/v1/users/{id}         # Delete user

GET    /api/v1/users/{id}/documents  # List user's documents
POST   /api/v1/users/{id}/documents  # Create document for user
```

**Sub-resources follow same pattern:**
- `/api/v1/projects/{id}/tasks` — Tasks within a project
- `/api/v1/documents/{id}/comments` — Comments on a document

---

### Versioning Strategy

**Version in URL path (preferred):**
```
/api/v1/users
/api/v2/users
```

Not in headers:
```
# Don't do this:
GET /users
Header: API-Version: 1
```

**Why:** Version clearly visible in URL; easier to test and document.

**Version lifecycle:**

```
v1: Introduced (Year 1)
    ↓
v1: Stable (use in production)
    ↓
v2: Introduced (breaking changes)
    Notice: "v1 will be sunset 2027-06-07"
    ↓
v1: Deprecated for 6 months (clients migrate)
    ↓
v1: Removed (2027-06-07)
    v2 now latest
```

---

### HTTP Status Codes

**Success:**
- `200 OK` — Request succeeded; body included
- `201 Created` — Resource created; body includes new resource
- `204 No Content` — Request succeeded; no body (DELETE, etc.)

**Client Errors:**
- `400 Bad Request` — Invalid input (validation failed)
- `401 Unauthorized` — Missing or invalid auth
- `403 Forbidden` — Auth valid but user lacks permission
- `404 Not Found` — Resource doesn't exist
- `409 Conflict` — Resource already exists (duplicate email, etc.)

**Server Errors:**
- `500 Internal Server Error` — Unexpected error
- `503 Service Unavailable` — System temporarily down

---

### Error Response Format

**Standard error response (applies to all 4xx and 5xx):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

**For validation errors with multiple fields:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "constraint": "required"
      },
      {
        "field": "password",
        "constraint": "min_length",
        "min": 12
      }
    ]
  }
}
```

---

### Pagination

**For list endpoints, always support pagination:**

```
GET /api/v1/users?limit=20&offset=0

Response:
{
  "data": [
    { "id": "user-1", "email": "..."},
    ...
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 150,
    "has_more": true
  }
}
```

**Sorting:**

```
GET /api/v1/users?sort=created_at&order=desc
```

**Filtering:**

```
GET /api/v1/users?status=active&role=admin
```

---

### Authentication

**Use Authorization header with Bearer token:**

```
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Error responses for auth failures:**

```json
// 401 Unauthorized (missing or invalid token)
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token is invalid or expired"
  }
}

// 403 Forbidden (valid token, insufficient permissions)
{
  "error": {
    "code": "INSUFFICIENT_PERMISSION",
    "message": "You do not have permission to access this resource"
  }
}
```

See [[Security Standards]] — Authentication and Authorization for auth implementation.

---

### OpenAPI Documentation

**All APIs must have OpenAPI 3.0 specification.**

```yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0
  description: User management endpoints

servers:
  - url: https://api.example.com/api/v1
    description: Production

paths:
  /users:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid input
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Email already exists
          
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        created_at:
          type: string
          format: date-time
      required:
        - id
        - email
        - created_at
```

**Tools for OpenAPI generation:**
- FastAPI (auto-generates from code)
- Swagger Editor (manual specification)
- OpenAPI Generator (generate client libraries)

---

### Request/Response Examples

**Create User (POST):**

```
POST /api/v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}

Response: 201 Created
{
  "id": "user-123",
  "email": "user@example.com",
  "created_at": "2026-06-07T10:30:00Z"
}
```

**Update User (PATCH):**

```
PATCH /api/v1/users/user-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "email": "new@example.com"
}

Response: 200 OK
{
  "id": "user-123",
  "email": "new@example.com",
  "updated_at": "2026-06-07T10:35:00Z"
}
```

**List Users (GET with pagination):**

```
GET /api/v1/users?limit=10&offset=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Response: 200 OK
{
  "data": [
    { "id": "user-1", "email": "user1@example.com", ... },
    { "id": "user-2", "email": "user2@example.com", ... }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 150,
    "has_more": true
  }
}
```

---

## Related Standards

[[Architecture Standards]] — API Design and Versioning  
[[Coding Standards]] — API client code  
[[Security Standards]] — Authentication and Authorization

---

## Related Decisions

**Decision 1:** Knowledge-First Architecture — [[ADR-ARCH-001]] (APIs are services in pipeline)  
**Decision 3:** Human Authority Preserved — [[ADR-SEC-001]] (API design requires approval)

---

## Implementation Timeline

- **Phase 3:** API design standards established
- **Phase 5:** All APIs have OpenAPI documentation
- **Phase 6+:** Client libraries auto-generated from OpenAPI

---

## Consequences

### Positive

✅ Industry standard (developers understand immediately)  
✅ Excellent tooling support (Swagger UI, generators, testing)  
✅ Cacheable (GET requests are idempotent)  
✅ Scalable (stateless design)  
✅ Language-agnostic (any client can consume)  
✅ Clear versioning (safe evolution without breaking clients)  

### Negative

❌ Less flexible than GraphQL (clients request specific shapes)  
❌ More endpoints (one per resource type)  
❌ Requires discipline (versioning, documentation, pagination)  

### Mitigations

- GraphQL can be added later for specific high-value APIs
- Endpoint explosion mitigated by good service boundaries
- Documentation enforced in code review

---

## Approval

- ✅ **Reviewed by:** User (Planning Phase)
- ✅ **Approved by:** User (AskUserQuestion approval)
- ✅ **Status:** Accepted
- ✅ **Ratified:** 2026-06-07

---

## Revision History

**v1.0 (2026-06-07):** Initial ADR establishing RESTful API conventions
- Defined versioning strategy (URL path)
- Specified standard HTTP methods and status codes
- Documented OpenAPI requirement
- Standardized error response format
- Specified pagination and authentication patterns

---

**Last Updated:** 2026-06-07  
**Next Review:** Phase 6 (when client libraries are generated)
