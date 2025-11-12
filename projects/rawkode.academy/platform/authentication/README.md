# Authentication Service

Self-hosted authentication service for Rawkode Academy using Better Auth with Passkeys and GitHub OAuth.

## Overview

This service replaces Zitadel with a modern authentication solution supporting:
- **Passkeys/WebAuthn** - Passwordless authentication
- **GitHub OAuth** - Social login
- **Session management** - Secure cookie-based sessions
- **GraphQL API** - User data queries

## Architecture

**Write Model** (Better Auth REST API)
- Handles authentication flows
- Manages passkeys and OAuth
- Session management
- Runs on Cloudflare Workers

**Read Model** (GraphQL API)
- User data queries
- Federation support
- Runs on Cloudflare Workers

**Database** (D1/SQLite)
- Users, sessions, accounts
- Passkey credentials
- Verification tokens

## Quick Start

### Prerequisites

- Node.js 20+ or Bun
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account
- GitHub OAuth App credentials

### Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Create D1 database**:
```bash
wrangler d1 create authentication-db
```

Update `database_id` in both `wrangler.jsonc` files with the ID from output.

3. **Configure GitHub OAuth**:
- Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
- Application name: `Rawkode Academy (Dev)`
- Homepage URL: `http://localhost:8788`
- Authorization callback URL: `http://localhost:8788/sign-in/github/callback`
- Copy Client ID and generate a Client Secret

4. **Create `.dev.vars`**:
```bash
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
```

5. **Generate migrations**:
```bash
npm run db:generate
```

6. **Apply migrations**:
```bash
npm run db:migrate
```

7. **Start services**:

Terminal 1 - Write Model (Auth):
```bash
npm run dev:write
```

Terminal 2 - Read Model (GraphQL):
```bash
npm run dev:read
```

## Authentication Flows

### Passkey Registration

1. User signs in with GitHub first (to create account)
2. User navigates to account settings
3. Click "Add Passkey"
4. Browser prompts for biometric/security key
5. Passkey is registered and saved

### Passkey Login

1. User visits sign-in page
2. Clicks "Sign in with Passkey"
3. Browser prompts for biometric/security key
4. User is authenticated

### GitHub OAuth

1. User clicks "Sign in with GitHub"
2. Redirected to GitHub for authorization
3. User approves access
4. Redirected back with access token
5. Session created, user signed in

## API Endpoints

### Write Model (Authentication)

Base URL: `http://localhost:8788` (dev) or `https://authentication-write-model.rawkode.academy` (prod)

**GitHub OAuth:**
- `GET /sign-in/github` - Initiate GitHub OAuth flow
- `GET /sign-in/github/callback` - GitHub callback handler

**Passkeys:**
- `POST /passkey/register` - Register new passkey
  ```json
  {
    "name": "My MacBook Touch ID"
  }
  ```
- `POST /passkey/authenticate` - Authenticate with passkey
- `GET /passkey/list` - List user's registered passkeys
- `DELETE /passkey/:id` - Remove a passkey

**Session:**
- `GET /session` - Get current session
- `POST /sign-out` - Sign out

### Read Model (GraphQL)

Base URL: `http://localhost:8787` (dev) or `https://authentication-read-model.rawkode.academy` (prod)

**Queries:**
```graphql
# Get user by ID
query GetUser($id: String!) {
  user(id: $id) {
    id
    email
    name
    image
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

## Testing

### Manual Testing

**Test GitHub OAuth:**
```bash
# Open in browser
open http://localhost:8788/sign-in/github
```

**Test Session:**
```bash
curl http://localhost:8788/session \
  -b cookies.txt
```

**Test GraphQL:**
```bash
curl http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users(limit: 5) { id email name } }"}'
```

### Automated Tests

```bash
npm test
```

## Deployment

### Prerequisites

1. Create production D1 database
2. Update `database_id` in both `wrangler.jsonc` files
3. Configure production GitHub OAuth app with prod callback URL

### Set Secrets

```bash
# Generate secure secret
openssl rand -base64 32

# Set secrets
wrangler secret put AUTH_SECRET --name authentication-write-model
wrangler secret put GITHUB_CLIENT_ID --name authentication-write-model
wrangler secret put GITHUB_CLIENT_SECRET --name authentication-write-model
```

### Deploy

```bash
# Apply migrations to production
npm run db:migrate:remote

# Deploy services
npm run deploy:write
npm run deploy:read
```

## Website Integration

See [INTEGRATION.md](./INTEGRATION.md) for complete integration guide.

### Quick Example

**Install client:**
```bash
npm install better-auth
```

**Create client:**
```typescript
import { createAuthClient } from "better-auth/client";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "https://authentication-write-model.rawkode.academy",
  plugins: [passkeyClient()],
});
```

**Sign in with GitHub:**
```typescript
await authClient.signIn.social({
  provider: "github",
  callbackURL: "/dashboard",
});
```

**Register passkey:**
```typescript
await authClient.passkey.register({
  name: "My Device",
});
```

**Authenticate with passkey:**
```typescript
await authClient.passkey.authenticate();
```

## Security

- **Passkeys**: FIDO2/WebAuthn standard
- **OAuth**: GitHub's official OAuth 2.0
- **Sessions**: httpOnly cookies, 7-day expiration
- **CSRF**: Built-in protection
- **Secrets**: Managed via Wrangler secrets

## Database Schema

```sql
-- Users
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  name TEXT,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Sessions
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- OAuth Accounts (GitHub)
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Passkeys/WebAuthn
CREATE TABLE passkey (
  id TEXT PRIMARY KEY,
  name TEXT,
  public_key TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  webauthn_user_id TEXT NOT NULL,
  counter INTEGER NOT NULL,
  device_type TEXT NOT NULL,
  backed_up INTEGER NOT NULL,
  transports TEXT,
  created_at INTEGER
);

-- Email Verification
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);
```

## Monitoring

- Cloudflare Workers logs and metrics
- OpenTelemetry trace propagation
- Auth success/failure events
- Session creation metrics

Access via Cloudflare dashboard.

## Development

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Format code
npm run format

# Lint
npm run lint

# Database studio (GUI)
npm run db:studio
```

## Migration from Zitadel

See [MIGRATION.md](./MIGRATION.md) for complete migration guide.

Key changes:
- Remove Zitadel OAuth config
- Update middleware to use Better Auth
- Replace sign-in flow with GitHub/Passkey
- Update UI components

## Support

- Check Cloudflare Workers logs
- Review Better Auth docs: https://better-auth.com
- Contact platform team

## License

MIT
