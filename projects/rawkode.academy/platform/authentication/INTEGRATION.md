# Website Integration Guide

This guide provides code examples for integrating the Better Auth authentication service with the Rawkode Academy website.

## Installation

```bash
cd projects/rawkode.academy/website
npm install better-auth
```

## Configuration

### 1. Create Auth Client

Create `src/lib/auth/client.ts`:

```typescript
import { createAuthClient } from "better-auth/client";
import { AUTH_SERVICE_URL } from "astro:env/server";

export const authClient = createAuthClient({
  baseURL: AUTH_SERVICE_URL,
  fetchOptions: {
    credentials: "include", // Important for cookies
  },
});

// Export types for use in other files
export type Session = Awaited<ReturnType<typeof authClient.getSession>>["data"];
export type User = Session["user"];
```

### 2. Update Environment Variables

In `astro.config.mts`, update the env schema:

```typescript
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  env: {
    schema: {
      // Remove old Zitadel variables
      // ZITADEL_URL: envField.string({ ... }),
      // ZITADEL_CLIENT_ID: envField.string({ ... }),
      
      // Add new auth service variable
      AUTH_SERVICE_URL: envField.string({
        context: "server",
        access: "public",
        default: "https://authentication-write-model.rawkode.academy",
      }),
    },
  },
});
```

In `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "AUTH_SERVICE_URL": "https://authentication-write-model.rawkode.academy"
  }
}
```

### 3. Update Middleware

Replace `src/middleware/auth.ts`:

```typescript
import { defineMiddleware } from "astro:middleware";
import { authClient } from "@/lib/auth/client";

export const authMiddleware = defineMiddleware(async (context, next) => {
  // Skip for prerendered pages
  if (context.isPrerendered) {
    console.debug("Prerendered: skipping auth middleware");
    return next();
  }

  // Skip for sign-out endpoint
  if (context.request.url.endsWith("/api/auth/sign-out")) {
    console.debug("Sign-out page, skipping auth middleware");
    return next();
  }

  try {
    // Get session from Better Auth
    const session = await authClient.getSession();
    
    if (session.data?.user) {
      // Map Better Auth user to context.locals.user
      // This maintains compatibility with existing code
      context.locals.user = {
        sub: session.data.user.id,
        email: session.data.user.email,
        name: session.data.user.name,
        picture: session.data.user.image,
        email_verified: session.data.user.emailVerified,
      };
      
      console.debug("User authenticated:", context.locals.user.email);
    } else {
      console.debug("No active session");
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
  }

  return next();
});
```

In `src/middleware/index.ts`:

```typescript
import { sequence } from "astro:middleware";
import { authMiddleware } from "./auth";

export const onRequest = sequence(authMiddleware);
```

## API Endpoints

### Sign In

Update `src/pages/api/auth/sign-in.ts`:

```typescript
import type { APIRoute } from "astro";
import { AUTH_SERVICE_URL } from "astro:env/server";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Forward to Better Auth
    const response = await fetch(`${AUTH_SERVICE_URL}/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Set cookies from Better Auth response
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      // Parse and set cookies
      // Better Auth handles cookie creation, we just need to forward them
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setCookieHeader,
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Keep GET endpoint for compatibility (redirects to sign-in page)
export const GET: APIRoute = ({ redirect }) => {
  return redirect("/sign-in");
};
```

### Sign Out

Update `src/pages/api/auth/sign-out.ts`:

```typescript
import type { APIRoute } from "astro";
import { AUTH_SERVICE_URL } from "astro:env/server";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
  try {
    // Forward to Better Auth sign-out
    const cookieHeader = request.headers.get("cookie");
    
    const response = await fetch(`${AUTH_SERVICE_URL}/sign-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { Cookie: cookieHeader }),
      },
    });

    // Clear all auth-related cookies
    cookies.delete("session", {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "strict",
    });

    // Delete legacy Zitadel cookies if they exist
    cookies.delete("accessToken", { path: "/" });
    cookies.delete("idToken", { path: "/" });
    cookies.delete("refreshToken", { path: "/" });
  } catch (error) {
    console.error("Sign out error:", error);
  }

  return redirect("/");
};
```

### Get Current User

Update `src/pages/api/auth/me.ts`:

```typescript
import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: "Not authenticated" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ user: locals.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

### Sign Up (New)

Create `src/pages/api/auth/sign-up.ts`:

```typescript
import type { APIRoute } from "astro";
import { AUTH_SERVICE_URL } from "astro:env/server";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Forward to Better Auth
    const response = await fetch(`${AUTH_SERVICE_URL}/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify(error), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Forward cookies
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setCookieHeader,
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

## UI Components

### Update Profile Component

Update `src/components/auth/profile.vue`:

```vue
<template>
  <div class="relative">
    <button
      @click="toggleDropdown"
      type="button"
      class="flex items-center space-x-3 text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
      id="userProfileButton"
    >
      <img
        class="w-8 h-8 rounded-full"
        :src="user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`"
        :alt="user.name"
      />
    </button>

    <div
      ref="dropdownRef"
      :class="[
        'absolute right-0 top-full z-50 mt-2 w-56 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 rounded-xl transition-all duration-200',
        dropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      ]"
    >
      <div class="py-3 px-4">
        <span class="block text-sm font-semibold text-gray-900 dark:text-white">
          {{ user.name || "User" }}
        </span>
        <span class="block text-sm text-gray-900 truncate dark:text-white">
          {{ user.email }}
        </span>
        <span v-if="!user.email_verified" class="block text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          Email not verified
        </span>
      </div>
      <ul class="py-1 text-gray-700 dark:text-gray-300">
        <li>
          <a
            href="/account/profile"
            class="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            My Profile
          </a>
        </li>
        <li>
          <a
            href="/account/settings"
            class="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            Settings
          </a>
        </li>
      </ul>
      <ul class="py-1 text-gray-700 dark:text-gray-300">
        <li>
          <a
            href="/api/auth/sign-out"
            class="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            Sign out
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  user: {
    name?: string;
    email: string;
    picture?: string;
    email_verified?: boolean;
  };
}>();

const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
```

### Sign-In Page (New)

Create `src/pages/sign-in.astro`:

```astro
---
import Layout from "@/layouts/Layout.astro";

const { redirect } = Astro.url.searchParams;
---

<Layout title="Sign In">
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
      </div>
      <form class="mt-8 space-y-6" id="sign-in-form">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email-address" class="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autocomplete="email"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <a href="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in
          </button>
        </div>

        <div class="text-sm text-center">
          <span class="text-gray-600 dark:text-gray-400">Don't have an account?</span>
          <a href="/sign-up" class="font-medium text-indigo-600 hover:text-indigo-500 ml-1">
            Sign up
          </a>
        </div>

        <div id="error-message" class="hidden text-red-600 text-sm text-center"></div>
      </form>
    </div>
  </div>

  <script>
    document.getElementById("sign-in-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        const response = await fetch("/api/auth/sign-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Sign in failed");
        }

        // Redirect after successful sign in
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        window.location.href = redirect || "/";
      } catch (error) {
        const errorDiv = document.getElementById("error-message");
        if (errorDiv) {
          errorDiv.textContent = error instanceof Error ? error.message : "An error occurred";
          errorDiv.classList.remove("hidden");
        }
      }
    });
  </script>
</Layout>
```

## Type Definitions

Update `src/env.d.ts` to include the new user type:

```typescript
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
    };
  }
}
```

## Testing

### Manual Testing Checklist

- [ ] Sign up with a new account
- [ ] Verify email (check email for verification link)
- [ ] Sign in with credentials
- [ ] Access protected pages
- [ ] Profile component displays user info
- [ ] Sign out works correctly
- [ ] Password reset flow
- [ ] Session persists across page reloads
- [ ] Session expires after configured time

### Automated Tests

Create `src/tests/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Authentication", () => {
  it("should redirect unauthenticated users to sign-in", async () => {
    // Test implementation
  });

  it("should allow authenticated users to access protected pages", async () => {
    // Test implementation
  });

  it("should clear session on sign-out", async () => {
    // Test implementation
  });
});
```

## Cleanup

After successful migration:

1. Remove old Zitadel files:
   - `src/lib/zitadel/index.ts`
   - Old callback endpoint: `src/pages/api/auth/callback.ts`

2. Remove Zitadel environment variables from:
   - `astro.config.mts`
   - `wrangler.jsonc`
   - `.env` files

3. Update documentation to reference Better Auth

## Troubleshooting

### Cookies not being set

Ensure `credentials: "include"` is set in fetch options and the auth service URL matches the website domain (or CORS is properly configured).

### Session not persisting

Check that:
- Cookies are httpOnly and secure (in production)
- SameSite attribute is set correctly
- The auth service is accessible from the website

### Email verification not working

Verify that:
- Email service is configured in the auth service
- Verification links point to the correct domain
- Tokens are not expired

## Support

For issues, contact the platform team or check the auth service logs in Cloudflare dashboard.
