# User Management API Design

## Endpoints
- POST /auth/register - User registration
- POST /auth/login - User authentication
- GET /users/{id} - Get user profile
- PUT /users/{id} - Update user
- DELETE /users/{id} - Delete user

## Authentication
- JWT tokens with 24h expiry
- Refresh tokens for renewal

## Database Schema
- users table with: id, email, password_hash, created_at, updated_at
- tokens table with: id, user_id, token, expires_at