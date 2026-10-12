const PUBLIC_CONTENT_PATH = /^\/v1\/(?:collections\/[a-z][a-z-]*|assets\/[a-z0-9]+|diagrams\/[a-f0-9]{64}\.svg|demos)$/

// The populated backend also has a preview-only readiness mutation endpoint.
// Enforce the capability boundary here before any request reaches that Worker.
export async function handlePreviewContent(request, sourceBinding) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } })
  }
  if (!PUBLIC_CONTENT_PATH.test(new URL(request.url).pathname)) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }
  return sourceBinding.fetch(request)
}
