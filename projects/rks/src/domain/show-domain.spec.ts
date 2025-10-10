import { describe, expect, it } from 'vitest';
import { canTransition, createShow, endShow, ensureProducerOwnership, scheduleShow, startShow } from './show-domain';

describe('show domain', () => {
  const baseDraft = {
    title: 'Test Show',
    description: 'Domain driven test',
    startsAt: new Date(Date.now() + 60_000),
    createdBy: 'producer-1',
  } as const;

  it('creates show with deterministic constraints', () => {
    const show = createShow(baseDraft);
    expect(show.title).toBe(baseDraft.title);
    expect(show.status).toBe('DRAFT');
  });

  it('enforces scheduling rules', () => {
    const show = createShow(baseDraft);
    expect(() => scheduleShow(show, new Date(Date.now() - 1))).toThrow('Scheduled start must be in the future');
  });

  it('transitions through lifecycle and validates ownership', () => {
    let show = createShow(baseDraft);
    ensureProducerOwnership(show, 'producer-1');
    expect(() => ensureProducerOwnership(show, 'other')).toThrow('Only the show owner may perform this action');
    show = scheduleShow(show, new Date(Date.now() + 120_000));
    show = startShow(show);
    show = endShow(show);
    expect(show.status).toBe('ENDED');
    expect(() => startShow(show)).toThrow('Show must be scheduled or draft before going live');
  });

  it('describes allowed transitions', () => {
    expect(canTransition('DRAFT', 'SCHEDULED')).toBe(true);
    expect(canTransition('SCHEDULED', 'DRAFT')).toBe(false);
  });
});
