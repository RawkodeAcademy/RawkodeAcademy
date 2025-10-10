import type { APIRoute } from 'astro';
import { resolveServices } from '../../../../../server/container';

export const POST: APIRoute = async ({ params }) => {
  const services = resolveServices();
  const manifest = await services.iso.abort(params.id!);
  return new Response(JSON.stringify({ manifest }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
