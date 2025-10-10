import type { APIRoute } from 'astro';
import { Show } from '../../../domain/types';
import { resolveServices } from '../../../server/container';

export const GET: APIRoute = async () => {
  const services = resolveServices();
  const shows = await services.shows.list();
  return new Response(JSON.stringify({ shows }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const services = resolveServices();
  const payload = await request.json();
  const show = await services.shows.create({
    title: payload.title,
    description: payload.description ?? '',
    startsAt: new Date(payload.startsAt ?? Date.now()),
    createdBy: payload.createdBy,
  });
  return new Response(JSON.stringify({ show: Show.parse(show) }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
