import type { APIRoute } from 'astro';
import { Poll } from '../../../domain/types';
import { resolveServices } from '../../../server/container';

export const POST: APIRoute = async ({ request }) => {
  const services = resolveServices();
  const payload = await request.json();
  const poll = await services.polls.create({
    showId: payload.showId,
    question: payload.question,
    options: payload.options,
  });
  return new Response(JSON.stringify({ poll: Poll.parse(poll) }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
