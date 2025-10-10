import type { APIRoute } from 'astro';
import { resolveServices } from '../../../../../server/container';

export const PUT: APIRoute = async ({ params, request }) => {
  const services = resolveServices();
  const payload = await request.json();
  const manifest = await services.iso.append(params.id!, payload.partNo, payload.bytes, payload.hash);
  return new Response(JSON.stringify({ manifest }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
