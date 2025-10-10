import type { APIRoute } from 'astro';
import { resolveServices } from '../../../../server/container';

export const POST: APIRoute = async ({ params, request }) => {
  const services = resolveServices();
  const payload = await request.json();
  const vote = await services.polls.vote(params.id!, payload.voterKey, payload.optionIndex);
  return new Response(JSON.stringify({ vote }), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
