import type { APIRoute } from 'astro';
import { resolveServices } from '../../../../server/container';

export const POST: APIRoute = async ({ params, request }) => {
  const services = resolveServices();
  const payload = await request.json();
  const requestRecord = await services.raiseHands.create({
    showId: params.id!,
    userId: payload.userId,
  });
  return new Response(JSON.stringify({ request: requestRecord }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const GET: APIRoute = async ({ params }) => {
  const services = resolveServices();
  const requests = await services.raiseHands.list(params.id!);
  return new Response(JSON.stringify({ requests }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
