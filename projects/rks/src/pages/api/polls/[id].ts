import type { APIRoute } from 'astro';
import { Poll } from '../../../domain/types';
import { resolveServices } from '../../../server/container';

export const GET: APIRoute = async ({ params }) => {
  const services = resolveServices();
  const { poll, tallies } = await services.polls.results(params.id!);
  return new Response(JSON.stringify({ poll: Poll.parse(poll), tallies }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const services = resolveServices();
  const payload = await request.json();
  if (payload.action === 'open') {
    const poll = await services.polls.open(params.id!);
    return new Response(JSON.stringify({ poll: Poll.parse(poll) }), { status: 200 });
  }
  if (payload.action === 'close') {
    const poll = await services.polls.close(params.id!);
    return new Response(JSON.stringify({ poll: Poll.parse(poll) }), { status: 200 });
  }
  return new Response(JSON.stringify({ error: 'Unsupported action' }), { status: 400 });
};
