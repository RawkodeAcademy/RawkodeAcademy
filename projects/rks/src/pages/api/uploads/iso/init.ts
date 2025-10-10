import type { APIRoute } from 'astro';
import { IsoManifest } from '../../../../domain/types';
import { resolveServices } from '../../../../server/container';

export const POST: APIRoute = async ({ request }) => {
  const services = resolveServices();
  const payload = await request.json();
  const manifest = await services.iso.init({
    showId: payload.showId,
    userId: payload.userId,
    kind: payload.kind,
  });
  return new Response(JSON.stringify({ manifest: IsoManifest.parse(manifest) }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
