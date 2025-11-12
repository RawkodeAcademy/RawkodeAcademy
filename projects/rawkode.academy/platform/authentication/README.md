# Authentication Service

A Cloudflare Workers-based authentication service using Better Auth for Rawkode Academy.

## Overview

This service provides authentication and user management for the Rawkode Academy platform. It replaces the previous Zitadel integration with a self-hosted Better Auth solution.

### Features

- **Email/Password Authentication**: Secure sign-up and sign-in with email verification
- **Session Management**: Cookie-based sessions with configurable expiration
- **Password Reset**: Secure password reset flow with email tokens
- **GraphQL API**: Read-only GraphQL API for user data queries
- **Federation Ready**: GraphQL schema supports Apollo Federation

## Architecture

The service follows the platform's standard architecture pattern:

- **Data Model**: Drizzle ORM schema with SQLite (D1) tables
- **Read Model**: GraphQL API for querying user data
- **Write Model**: Better Auth REST API for authentication operations

### Database Schema

- `users`: Core user identity (id, email, name, image)
- `sessions`: Active user sessions
- `accounts`: Authentication providers and credentials
- `verification_tokens`: Email verification and password reset tokens

## Local Development

### Prerequisites

- Node.js 20+ or Bun
- Wrangler CLI
- Cloudflare account with D1 access

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create D1 database:
```bash
wrangler d1 create authentication-db
```

3. Update `wrangler.jsonc` files with the database ID

4. Run migrations:
```bash
wrangler d1 migrations apply authentication-db --local
```

5. Create `.dev.vars` file:
```bash
AUTH_SECRET=your-secret-key-min-32-chars
```

### Running Locally

Start the read model (GraphQL):
```bash
cd read-model
wrangler dev --local --persist-to=../.wrangler
```

Start the write model (Better Auth):
```bash
cd write-model
wrangler dev --local --persist-to=../.wrangler --port 8788
```

## API Endpoints

### Write Model (Better Auth)

Base URL: `https://authentication-write-model.rawkode.academy` (or `http://localhost:8788` locally)

- `POST /sign-up` - Create new account
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }
  ```

- `POST /sign-in` - Sign in
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```

- `POST /sign-out` - Sign out (requires cookie)

- `GET /session` - Get current session (requires cookie)

- `POST /verify-email` - Verify email
  ```json
  {
    "token": "verification-token"
  }
  ```

- `POST /forgot-password` - Request password reset
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /reset-password` - Reset password
  ```json
  {
    "token": "reset-token",
    "password": "newsecurepassword"
  }
  ```

### Read Model (GraphQL)

Base URL: `https://authentication-read-model.rawkode.academy` (or `http://localhost:8787` locally)

Example queries:

```graphql
# Get user by ID
query GetUser($id: String!) {
  user(id: $id) {
    id
    email
    name
    emailVerified
    createdAt
  }
}

# Get user by email
query GetUserByEmail($email: String!) {
  user(email: $email) {
    id
    email
    name
  }
}

# List users (paginated)
query ListUsers($limit: Int, $offset: Int) {
  users(limit: $limit, offset: $offset) {
    id
    email
    name
    createdAt
  }
}
```

## Integration Guide

### Website Integration

To integrate with the Rawkode Academy website:

1. **Install the Better Auth client**:
```bash
npm install better-auth
```

2. **Create auth client**:
```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: "https://authentication-write-model.rawkode.academy",
});
```

3. **Sign in**:
```typescript
const { data, error } = await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});
```

4. **Get session**:
```typescript
const { data: session } = await authClient.getSession();
```

5. **Sign out**:
```typescript
await authClient.signOut();
```

### Middleware Example

Replace the existing Zitadel middleware with Better Auth:

```typescript
import { defineMiddleware } from "astro:middleware";
import { authClient } from "@/lib/auth/client";

export const authMiddleware = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    return next();
  }

  const session = await authClient.getSession();
  
  if (session.data?.user) {
    context.locals.user = session.data.user;
  }
  
  return next();
});
```

## Deployment

The service is automatically deployed via CI/CD when changes are merged to main.

### Manual Deployment

Deploy read model:
```bash
cd read-model
wrangler deploy
```

Deploy write model:
```bash
cd write-model
wrangler deploy
```

### Environment Variables

Required secrets (set via `wrangler secret put`):

- `AUTH_SECRET`: Random secret key (min 32 characters) for session signing

## Migration from Zitadel

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide from Zitadel to Better Auth.

Key steps:
1. Deploy authentication service
2. Create user migration script
3. Update website to use Better Auth client
4. Remove Zitadel configuration
5. Test authentication flows
6. Deprecate Zitadel

## Security Considerations

- All passwords are hashed using industry-standard algorithms (handled by Better Auth)
- Sessions use httpOnly cookies to prevent XSS attacks
- CSRF protection is built-in
- Email verification is required for new accounts
- Rate limiting should be implemented at the edge (Cloudflare)

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Monitoring

The service has observability enabled with:
- Request logging
- Error tracking
- Performance metrics

Access logs and metrics via the Cloudflare dashboard.

## Support

For issues or questions, please contact the platform team or open an issue in the repository.
