import type { APIRoute } from "astro";

// Define the structure of the purge request
interface PurgeBody {
  tags?: string[];
  files?: string[];
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Validate the request has proper authorization
    const authHeader = request.headers.get("Authorization");
    const webhookSecret = import.meta.env.CACHE_PURGE_SECRET;
    
    if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Parse the request body
    const body = await request.json();
    const { tags, files } = body;

    // Validate required Cloudflare credentials
    const cfZoneId = import.meta.env.CF_ZONE_ID;
    const cfApiToken = import.meta.env.CF_API_TOKEN;
    
    if (!cfZoneId || !cfApiToken) {
      console.error("Missing Cloudflare credentials");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Prepare purge request
    const purgeBody: PurgeBody = {};
    
    if (tags && Array.isArray(tags) && tags.length > 0) {
      purgeBody.tags = tags;
    }
    
    if (files && Array.isArray(files) && files.length > 0) {
      purgeBody.files = files;
    }
    
    if (Object.keys(purgeBody).length === 0) {
      return new Response(JSON.stringify({ error: "No tags or files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Make the purge request to Cloudflare
    const purgeResponse = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cfApiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purgeBody),
      }
    );

    const purgeResult = await purgeResponse.json();

    if (!purgeResponse.ok) {
      console.error("Cloudflare purge failed:", purgeResult);
      return new Response(JSON.stringify({ 
        error: "Cache purge failed", 
        details: purgeResult.errors 
      }), {
        status: purgeResponse.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Log successful purge
    console.log("Cache purged successfully:", { tags, files });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cache purged successfully",
      purged: { tags, files }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Cache purge error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// Optionally support GET for manual testing (remove in production)
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    message: "Cache purge endpoint. Use POST with proper authorization." 
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};