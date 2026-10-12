import { WorkerEntrypoint } from 'cloudflare:workers'
import { handlePreviewContent } from './preview-content-proxy.mjs'

const unavailable = () => Response.json(
	{ error: "This integration is disabled in the isolated website preview." },
	{ status: 503, headers: { "Cache-Control": "no-store" } },
)

export default {
	fetch() {
		return unavailable()
	},
}

// Only this named service entrypoint can read the pinned public content source.
export class PublicContentReadOnly extends WorkerEntrypoint {
	fetch(request) {
		return handlePreviewContent(request, this.env.PUBLIC_CONTENT_SOURCE)
	}
}
