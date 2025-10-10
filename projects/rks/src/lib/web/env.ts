export function workerBase(): string | null {
  const v = import.meta.env.PUBLIC_RKS_WORKER_URL as string | undefined;
  if (!v || v.trim() === '') return null;
  return v.replace(/\/$/, '');
}

// Deprecated: Astro /api routes have been removed. Use workerBase().
