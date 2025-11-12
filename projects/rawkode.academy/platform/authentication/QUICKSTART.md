# Quick Start Guide

Get the authentication service up and running locally in 5 minutes.

## Prerequisites

- Node.js 20+ or Bun installed
- Cloudflare account (for D1 database)
- Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Install Dependencies

```bash
cd projects/rawkode.academy/platform/authentication
npm install
```

## Step 2: Set Up Database

```bash
# Create D1 database
wrangler d1 create authentication-db

# Copy the database ID from the output
# Update database_id in both wrangler.jsonc files
```

## Step 3: Generate & Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations locally
npm run db:migrate
```

## Step 4: Create Development Environment

Create `.dev.vars` file:

```bash
AUTH_SECRET=your-secret-key-at-least-32-characters-long
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Step 5: Start Development Servers

Open two terminal windows:

**Terminal 1 - Read Model (GraphQL):**
```bash
npm run dev:read
```

**Terminal 2 - Write Model (Better Auth):**
```bash
npm run dev:write
```

## Step 6: Test the Service

### Test GraphQL API (Read Model)

```bash
curl http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users(limit: 5) { id email name } }"}'
```

### Test Sign Up (Write Model)

```bash
curl http://localhost:8788/sign-up \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'
```

### Test Sign In

```bash
curl http://localhost:8788/sign-in \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }' \
  -c cookies.txt
```

### Test Session (requires cookies from sign-in)

```bash
curl http://localhost:8788/session \
  -b cookies.txt
```

### Test Sign Out

```bash
curl http://localhost:8788/sign-out \
  -X POST \
  -b cookies.txt
```

## Development Workflow

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Format Code

```bash
npm run format
```

### Lint Code

```bash
npm run lint
```

### Check Everything

```bash
npm run check
```

## Database Management

### View Database with Drizzle Studio

```bash
npm run db:studio
```

This opens a web UI to browse and edit your database.

### Reset Database (Local)

```bash
rm -rf .wrangler
npm run db:migrate
```

## Deploying to Production

### Step 1: Update Database IDs

Get your production database ID and update both `wrangler.jsonc` files:
- `read-model/wrangler.jsonc`
- `write-model/wrangler.jsonc`

### Step 2: Set Production Secret

```bash
wrangler secret put AUTH_SECRET --name authentication-write-model
# Enter your production secret when prompted
```

### Step 3: Run Production Migrations

```bash
npm run db:migrate:remote
```

### Step 4: Deploy

```bash
# Deploy read model
npm run deploy:read

# Deploy write model
npm run deploy:write
```

## Common Issues

### "Database not found" error

Make sure you've:
1. Created the D1 database
2. Updated the database_id in wrangler.jsonc
3. Run migrations

### "AUTH_SECRET not found" error

Create a `.dev.vars` file with your secret:
```
AUTH_SECRET=your-secret-here
```

### Port already in use

The write model runs on port 8788. Change it in the npm script if needed:
```bash
cd write-model && wrangler dev --local --persist-to=../.wrangler --port 8789
```

### GraphQL endpoint returns 404

Make sure you're hitting the root path `/` not `/graphql`:
```bash
curl http://localhost:8787/
```

## Next Steps

1. Read the [INTEGRATION.md](./INTEGRATION.md) guide to integrate with the website
2. Check [MIGRATION.md](./MIGRATION.md) for the full migration plan
3. See [README.md](./README.md) for detailed API documentation

## Getting Help

- Check Cloudflare Workers logs: `wrangler tail authentication-read-model`
- View database: `npm run db:studio`
- Check service status in Cloudflare dashboard
- Contact the platform team

## Useful Commands Reference

```bash
# Development
npm run dev:read                  # Start GraphQL API
npm run dev:write                 # Start Auth API
npm test                          # Run tests
npm run test:watch                # Run tests in watch mode

# Database
npm run db:generate               # Generate migrations from schema
npm run db:migrate                # Apply migrations locally
npm run db:migrate:remote         # Apply migrations to production
npm run db:studio                 # Open database GUI

# Deployment
npm run deploy:read               # Deploy GraphQL API
npm run deploy:write              # Deploy Auth API

# Code Quality
npm run format                    # Format code
npm run lint                      # Lint code
npm run check                     # Check everything
```

Enjoy building with Better Auth! 🚀
