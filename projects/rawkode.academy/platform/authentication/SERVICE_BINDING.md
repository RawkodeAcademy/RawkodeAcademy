# Service Binding & RPC Integration

The authentication service is designed to be consumed by the website using Cloudflare Service Bindings for efficient service-to-service RPC communication.

## Architecture

```
┌─────────────┐         Service Binding (RPC)        ┌──────────────────┐
│             │────────────────────────────────────────▶│                  │
│   Website   │                                        │  Authentication  │
│             │◀────────────────────────────────────────│     Service      │
└─────────────┘                                        └──────────────────┘
```

## Service Binding Configuration

The authentication service is bound to the website as `AUTH_SERVICE` in `wrangler.jsonc`:

```jsonc
{
  "services": [
    {
      "binding": "AUTH_SERVICE",
      "service": "authentication-write-model"
    }
  ]
}
```

## RPC Interface

The service exposes an RPC interface defined in Cap'n Proto schema (`schema/auth.capnp`) for service-to-service communication.

### Available RPC Methods

All RPC methods are accessible via `/rpc/{method}` endpoints:

1. **verifySession** - Verify a session token and return user info
   ```typescript
   POST /rpc/verifySession
   { "sessionToken": "session_abc123" }
   ```

2. **getUser** - Get user by ID
   ```typescript
   POST /rpc/getUser
   { "userId": "user_123" }
   ```

3. **getUserByEmail** - Get user by email
   ```typescript
   POST /rpc/getUserByEmail
   { "email": "user@example.com" }
   ```

4. **listUserSessions** - List all sessions for a user
   ```typescript
   POST /rpc/listUserSessions
   { "userId": "user_123" }
   ```

5. **revokeSession** - Revoke a specific session
   ```typescript
   POST /rpc/revokeSession
   { "sessionId": "session_abc123" }
   ```

6. **validatePasskey** - Validate if a passkey belongs to a user
   ```typescript
   POST /rpc/validatePasskey
   { "userId": "user_123", "credentialId": "cred_xyz" }
   ```

## Using the Client

### Import the Client

```typescript
import { AuthClient } from "@/lib/auth/client";
```

### Initialize with Service Binding

```typescript
// In middleware or API route
const authClient = new AuthClient(context.locals.runtime.env.AUTH_SERVICE);
```

### Example Usage

```typescript
// Verify a session
const result = await authClient.verifySession(sessionToken);
if (result.success) {
  console.log("User:", result.user);
  console.log("Session:", result.session);
}

// Get user by email
const user = await authClient.getUserByEmail("user@example.com");

// Revoke a session
const revoked = await authClient.revokeSession(sessionId);
```

## Middleware Example

```typescript
import { defineMiddleware } from "astro:middleware";
import { AuthClient } from "@/lib/auth/client";

export const authMiddleware = defineMiddleware(async (context, next) => {
  const authClient = new AuthClient(context.locals.runtime.env.AUTH_SERVICE);
  
  // Get session token from cookie
  const sessionToken = context.cookies.get("session")?.value;
  
  if (sessionToken) {
    const result = await authClient.verifySession(sessionToken);
    
    if (result.success && result.user) {
      context.locals.user = result.user;
    }
  }
  
  return next();
});
```

## Benefits of Service Bindings

1. **Low Latency** - Direct Worker-to-Worker communication without network overhead
2. **Type Safety** - TypeScript types ensure correct usage
3. **No Authentication** - Internal service calls don't require external auth
4. **Cost Effective** - No egress charges for internal communication
5. **Scalability** - Automatic scaling handled by Cloudflare

## Cap'n Proto Schema

The service interface is formally defined in `schema/auth.capnp` using Cap'n Proto IDL. This provides:

- **Schema validation** - Ensures data contracts are maintained
- **Efficient serialization** - Binary protocol for fast communication
- **Cross-language support** - Can generate clients in multiple languages
- **Version compatibility** - Schema evolution without breaking changes

## Capnweb Integration

The service is designed to work with [capnweb](https://github.com/cloudflare/capnweb), Cloudflare's implementation of Cap'n Proto for Workers, enabling efficient RPC between services.

Future enhancements may include:
- Binary Cap'n Proto encoding for even faster communication
- Streaming RPC for large result sets
- Bidirectional communication for real-time updates

## Development

### Testing RPC Locally

```bash
# Start auth service
npm run dev:write

# Test RPC endpoint
curl http://localhost:8788/rpc/getUser \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_123"}'
```

### Adding New RPC Methods

1. Define method in `schema/auth.capnp`
2. Implement in `write-model/rpc-service.ts`
3. Add route handler in `write-model/main.ts`
4. Update `AuthClient` in `website/src/lib/auth/client.ts`
5. Update TypeScript types

## Security Considerations

- Service bindings are **internal only** - not exposed to the internet
- RPC endpoints should **validate** all inputs
- Session tokens should be **short-lived** and **rotated**
- Always check session expiration before trusting user data
- Use **HTTPS** for any external-facing endpoints

## Performance

Service bindings provide:
- **Sub-millisecond** latency for most operations
- **No cold starts** between bound services
- **Automatic load balancing** across Worker instances
- **Efficient memory usage** through shared context

## Monitoring

Monitor RPC calls via:
- Cloudflare Workers Analytics
- Custom metrics in write-model observability
- Trace IDs for request correlation
- Error rates and latencies in dashboard
