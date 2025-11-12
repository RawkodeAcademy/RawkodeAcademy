# Migration Guide: Zitadel to Better Auth

This guide outlines the steps to migrate from Zitadel to the Better Auth authentication service.

## Phase Overview

This migration follows a phased approach to minimize risk and ensure zero downtime:

1. **Deploy Authentication Service** - Deploy the new service alongside Zitadel
2. **Parallel Testing** - Test the new service without affecting production
3. **Website Integration** - Update the website to use Better Auth
4. **User Migration** - Migrate or re-authenticate users
5. **Cutover** - Switch traffic to Better Auth
6. **Cleanup** - Remove Zitadel configuration

## Prerequisites

- [ ] Authentication service deployed to production
- [ ] D1 database created and migrated
- [ ] `AUTH_SECRET` configured
- [ ] Read and write models accessible

## Step 1: Deploy Authentication Service

### 1.1 Create D1 Database

```bash
wrangler d1 create authentication-db
```

Save the database ID and update both `wrangler.jsonc` files.

### 1.2 Run Migrations

```bash
wrangler d1 migrations apply authentication-db --remote
```

### 1.3 Configure Secrets

```bash
# Generate a secure random secret (min 32 characters)
openssl rand -base64 32

# Set the secret
wrangler secret put AUTH_SECRET --name authentication-write-model
```

### 1.4 Deploy Services

```bash
# Deploy read model
cd read-model
wrangler deploy

# Deploy write model
cd ../write-model
wrangler deploy
```

### 1.5 Verify Deployment

Test the endpoints:

```bash
# Test write model health
curl https://authentication-write-model.rawkode.academy/session

# Test read model (GraphQL)
curl https://authentication-read-model.rawkode.academy \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users(limit: 1) { id } }"}'
```

## Step 2: Update Website Dependencies

### 2.1 Install Better Auth Client

```bash
cd projects/rawkode.academy/website
npm install better-auth
```

### 2.2 Create Auth Client Module

Create `src/lib/auth/client.ts`:

```typescript
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: import.meta.env.PUBLIC_AUTH_SERVICE_URL || 
    "https://authentication-write-model.rawkode.academy",
});
```

## Step 3: Update Website Configuration

### 3.1 Update Environment Variables

In `astro.config.mts`, update the env schema:

```typescript
// Remove Zitadel vars:
// ZITADEL_URL: envField.string({ ... })
// ZITADEL_CLIENT_ID: envField.string({ ... })

// Add Better Auth vars:
AUTH_SERVICE_URL: envField.string({
  context: "server",
  access: "public",
  default: "https://authentication-write-model.rawkode.academy",
}),
```

In `wrangler.jsonc`, update vars:

```jsonc
{
  "vars": {
    // Remove:
    // "ZITADEL_CLIENT_ID": "...",
    // "ZITADEL_URL": "..."
    
    // Add:
    "AUTH_SERVICE_URL": "https://authentication-write-model.rawkode.academy"
  }
}
```

### 3.2 Update Middleware

Replace `src/middleware/auth.ts`:

```typescript
import { defineMiddleware } from "astro:middleware";
import { authClient } from "@/lib/auth/client";

export const authMiddleware = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    return next();
  }

  if (context.request.url.endsWith("/api/auth/sign-out")) {
    return next();
  }

  try {
    // Get session from Better Auth
    const session = await authClient.getSession();
    
    if (session.data?.user) {
      context.locals.user = {
        sub: session.data.user.id,
        email: session.data.user.email,
        name: session.data.user.name,
        picture: session.data.user.image,
      };
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
  }

  return next();
});
```

## Step 4: Update Auth Endpoints

### 4.1 Update Sign-In Endpoint

Replace `src/pages/api/auth/sign-in.ts`:

```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ redirect }) => {
  const authServiceUrl = import.meta.env.AUTH_SERVICE_URL;
  return redirect(`${authServiceUrl}/sign-in?redirect=${encodeURIComponent("/")}`);
};
```

### 4.2 Update Sign-Out Endpoint

Replace `src/pages/api/auth/sign-out.ts`:

```typescript
import type { APIRoute } from "astro";
import { authClient } from "@/lib/auth/client";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error("Sign out error:", error);
  }

  return redirect("/");
};
```

### 4.3 Remove Old Endpoints

Delete or archive:
- `src/pages/api/auth/callback.ts` (no longer needed)
- `src/lib/zitadel/index.ts` (Zitadel helper)

### 4.4 Update Me Endpoint

Update `src/pages/api/auth/me.ts`:

```typescript
import type { APIRoute } from "astro";
import { authClient } from "@/lib/auth/client";

export const prerender = false;

export const GET: APIRoute = async () => {
  const session = await authClient.getSession();
  
  if (!session.data?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ user: session.data.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

## Step 5: Update UI Components

### 5.1 Update Profile Component

In `src/components/auth/profile.vue`, update the profile link:

```vue
<!-- Replace Zitadel profile link -->
<a target="_blank" href="https://zitadel.rawkode.academy">

<!-- With Better Auth profile management -->
<a href="/account/profile">
```

### 5.2 Update Sign-In Button

The sign-in button should already work with the updated `/api/auth/sign-in` endpoint.

## Step 6: User Migration Strategy

You have two options for user migration:

### Option A: Force Re-Authentication (Recommended for Security)

1. Announce to users that they need to re-authenticate
2. Provide a grace period for the transition
3. Users create new accounts or reset passwords via email
4. Gradually phase out Zitadel

### Option B: Automated Migration

If you need to preserve user accounts:

1. Export users from Zitadel
2. Create a migration script to import into Better Auth
3. Handle password reset flow for imported users
4. Notify users to reset passwords

**Note**: Password hashes cannot be migrated between systems. Users will need to reset passwords.

## Step 7: Testing Checklist

- [ ] Sign up with new account
- [ ] Email verification works
- [ ] Sign in with credentials
- [ ] Session persists across page loads
- [ ] Protected pages require authentication
- [ ] Sign out works correctly
- [ ] Password reset flow works
- [ ] GraphQL queries return user data
- [ ] Middleware correctly identifies authenticated users

## Step 8: Rollout Plan

### 8.1 Feature Flag (Optional)

Add a feature flag to switch between Zitadel and Better Auth:

```typescript
const USE_BETTER_AUTH = import.meta.env.PUBLIC_USE_BETTER_AUTH === "true";
```

### 8.2 Gradual Rollout

1. Enable for internal team only
2. Enable for beta users
3. Enable for all users
4. Monitor error rates and user feedback

### 8.3 Monitoring

Watch for:
- Authentication success/failure rates
- Session creation errors
- API response times
- User complaints

## Step 9: Cleanup

Once Better Auth is stable:

### 9.1 Remove Zitadel Configuration

Remove from `astro.config.mts`:
- `ZITADEL_URL`
- `ZITADEL_CLIENT_ID`

Remove from `wrangler.jsonc`:
- Zitadel vars

### 9.2 Remove Zitadel Code

Delete:
- `src/lib/zitadel/`
- Old auth endpoints

### 9.3 Update Documentation

Update:
- `README.md`
- Developer onboarding docs
- Architecture docs

### 9.4 Deprecate Zitadel Service

Archive or delete:
- `platform/zitadel-zulip-connector` (if no longer needed)
- Zitadel configuration in infrastructure

## Rollback Plan

If issues arise, you can rollback by:

1. Revert website changes (Git)
2. Re-enable Zitadel endpoints
3. Point users back to Zitadel
4. Investigate and fix issues
5. Retry migration

Keep Zitadel running in parallel during the transition period.

## Timeline

Suggested timeline for migration:

- **Week 1**: Deploy authentication service, test internally
- **Week 2**: Update website code, test in staging
- **Week 3**: Enable for beta users, gather feedback
- **Week 4**: Full rollout, monitor closely
- **Week 5+**: Cleanup and documentation

## Support

For issues during migration:
- Check Cloudflare Workers logs
- Review error traces
- Test with curl/Postman
- Contact platform team

## Success Criteria

Migration is successful when:
- [ ] All authentication flows work
- [ ] Zero increase in support tickets
- [ ] Session management is reliable
- [ ] Performance is equal or better
- [ ] Users can authenticate without issues
- [ ] Monitoring shows healthy metrics
