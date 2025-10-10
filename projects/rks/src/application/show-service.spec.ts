import { beforeEach, describe, expect, it } from 'vitest';
import { ShowService } from './show-service';
import { InMemoryShowRepository } from '../infrastructure/memory-repositories';

const futureDate = () => new Date(Date.now() + 60_000);

describe('ShowService', () => {
  let service: ShowService;
  let repository: InMemoryShowRepository;

  beforeEach(() => {
    repository = new InMemoryShowRepository();
    service = new ShowService(repository);
  });

  it('creates a show draft with defaults', async () => {
    const show = await service.create({
      title: 'Weekly Stream',
      description: 'A look at progress',
      startsAt: futureDate(),
      createdBy: 'producer-1',
    });

    expect(show.id).toBeDefined();
    expect(show.status).toBe('DRAFT');
    const saved = await repository.findById(show.id);
    expect(saved).toEqual(show);
  });

  it('schedules a draft show', async () => {
    const show = await service.create({
      title: 'Launch',
      description: 'Going live',
      startsAt: futureDate(),
      createdBy: 'producer-2',
    });

    const scheduled = await service.schedule(show.id, futureDate());
    expect(scheduled.status).toBe('SCHEDULED');
  });

  it('enforces state transitions', async () => {
    const show = await service.create({
      title: 'Transition check',
      description: 'Testing transitions',
      startsAt: futureDate(),
      createdBy: 'producer-3',
    });

    await expect(service.end(show.id)).rejects.toThrow('Only live shows can be ended');

    await service.schedule(show.id, futureDate());
    const live = await service.start(show.id);
    expect(live.status).toBe('LIVE');

    const ended = await service.end(show.id);
    expect(ended.status).toBe('ENDED');
  });

  it('throws for missing show', async () => {
    await expect(service.start('missing')).rejects.toThrow('Show missing not found');
  });
});
