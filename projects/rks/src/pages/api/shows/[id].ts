import type { APIRoute } from 'astro';
import { Show } from '../../../domain/types';
import { resolveServices } from '../../../server/container';

export const GET: APIRoute = async ({ params }) => {
  const services = resolveServices();
  const shows = await services.shows.list();
  const show = shows.find((item) => item.id === params.id);
  if (!show) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ show: Show.parse(show) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
